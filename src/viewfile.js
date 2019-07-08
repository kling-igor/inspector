import path from 'path'

import { observable, computed, action, toJS } from 'mobx'

import produce, { applyPatches } from 'immer'

import moment from 'moment'

import js_beautify from 'js-beautify'

import * as R from 'ramda'

import SparkMD5 from 'spark-md5'

import { hashlessFileName } from './utils'

export const PATH_ID = '__PATH_ID__'

import { NONE, PALETTE, PLAYGROUND, ROOT, TRASH } from './wysiwyg-editor/dnd-types'

import { getTreeNode, createNode, removeChildNode, appendNodePath, walkTree } from './node-utils'

import { mergeStyleSlices } from './style-utils'

import { copyObject, cleanMergedStyles, recursiveCleanPathKeys, numberify } from './utils'

// !!!
// import renderScreen from './viewstate-renderer'

const uppercaseFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1)

const nodeName = node => {
  let type = node.type
  if (type === 'list' || type === 'chart') {
    type = node.displayType
  }

  return uppercaseFirstLetter(type)
}

const nodeFullIdentifier = node => {
  if (node.id != null) {
    return `${nodeName(node)} #${node.id}`
  }

  return nodeName(node)
}

function moveArray(array, from, to) {
  array.splice(to, 0, array.splice(from, 1)[0])
}

const calcTreeHash = root => {
  const spark = new SparkMD5()

  const traverse = node => {
    const { [PATH_ID]: path, type, displayType, id, visibility: visible, elements } = node

    const visibility = visible == null ? true : visible

    console.log(`path:${path} type:${type} displayType:${displayType} id:${id}`)

    spark.append(path)
    if (displayType) {
      spark.append(displayType)
    } else {
      spark.append(type)
    }
    if (id) {
      spark.append(id)
    }

    if (visibility) {
      spark.append(visibility.toString())
    }

    if (Array.isArray(elements)) {
      elements.map(traverse)
    }
  }

  traverse(root)

  return spark.end()
}

export class ViewFile {
  @observable filePath = null

  @computed get fileName() {
    const baseName = path.basename(this.filePath)
    return hashlessFileName(baseName)
  }

  // оригинал файла удален с диска
  @observable deletedFromDisk = false

  @observable dirty = false

  // файл в состоянии сохраненния
  @observable isSaving = false

  selectedComponentProperties

  selectedComponentStyles

  // это значение устанавливается и меняется только через immer !!!
  viewTreeState

  @observable propertiesHaveChanged = false

  // управление историей изменений
  @observable changes = []
  @observable inverseChanges = []
  @observable historyMoment = -1

  @observable _viewTree = null
  @observable _selectedViewState = null

  @observable treeHash = null

  /** convenient methods **/
  @computed get selectedViewState() {
    return this._selectedViewState
  }

  @computed get selectedViewStatePath() {
    if (!this._selectedViewState) return null
    return this._selectedViewState[PATH_ID]
  }

  @computed get viewTree() {
    return this._viewTree
  }

  // устанавливает новое состояние для отображения сцены, попутно добавляя расчет стилей
  @action setViewTree(viewTree) {
    this.treeHash = calcTreeHash(viewTree)

    this._viewTree = this.appendMergedStyles(viewTree)
  }

  // it shoould be a part of opened file description
  @observable content = ''

  @action setContent(contentObject) {
    try {
      this.content = js_beautify(JSON.stringify(contentObject), {
        indent_size: 2,
        space_in_empty_paren: true
      })
    } catch (e) {
      console.error(e)
    }
  }

  constructor(filePath, buffer, styleService, namedStyles, dirty = false) {
    this.filePath = filePath

    this.styleService = styleService

    this.namedStyles = namedStyles

    this.openingTime = moment()

    try {
      const parsedJSON = JSON.parse(buffer)

      parsedJSON.id = parsedJSON.name
      delete parsedJSON.uptime
      delete parsedJSON.name

      this.setContent(parsedJSON)

      // базовое значение объекта, которое прогоняется через immer
      this.viewTreeState = appendNodePath(parsedJSON)

      this.setViewTree(this.viewTreeState)

      this.setDirty(dirty)

      // изначально всегда выбрано состояние рутового объекта
      this._selectedViewState = this.viewTreeState
    } catch (e) {
      console.log('UNABLE TO PARSE JSON:', filePath)
    }
  }

  dispose() {}

  @action.bound
  setDirty(dirty = true) {
    this.dirty = dirty
  }

  @action.bound
  save(projectPath, save) {
    if (this.isSaving) {
      return
    }

    this.isSaving = true

    return save(path.join(projectPath, this.filePath), this.content)
      .then(() => {
        this.setDirty(false)
        this.deletedFromDisk = false
      })
      .catch(e => {
        console.log(`UNABLE TO SAVE '${savingPath}':`, e)
      })
      .finally(() => {
        this.isSaving = false
      })

    // должен контент отдавать завернутым в JSON
  }

  // TODO: что с этим делать !!!
  // /**
  //  * @param {String} screenName
  //  * @param {Object} parameters
  //  * @returns {Node}
  //  */
  // renderScreen(screenName, parameters = null) {
  //   return renderScreen(screenName, parameters)
  // }

  /**
   * Добавляет в узлы объединенное значение описания стилей - это делает возможным отрисовку объектов
   */
  appendMergedStyles = object => {
    const traverse = node => {
      const { elements, type, styles = [], ...rest } = node

      const children = elements ? elements.map(child => traverse(child)) : null

      const mergedStyle = this.styleService.mergeStyles(type, styles)

      return { type, styles, mergedStyle, ...rest, elements: children }
    }

    return traverse(object)
  }

  @action.bound
  savePatches(patches, inversePatches, description) {
    console.log('PATHCHES:', patches)
    console.log('INVERSE PATCHES:', inversePatches)
    if (patches.length > 0) {
      const dateTime = moment()

      this.changes.push({ dateTime, patches, description })
      this.inverseChanges.push({ dateTime, inversePatches, description })
      this.historyMoment += 1
    }
  }

  @action.bound
  onSelectNode(path) {
    const node = getTreeNode(this.viewTreeState, path)
    if (node) {
      console.log('SELECT NODE:', node)
      // this.openedFiles[this.activeIndex].selectedViewState = node
      this._selectedViewState = node
    } else {
      console.log('NODE NOT FOUND:', path)
    }
  }

  unselectSelectedNode() {
    // TODO: убирать рамку вокруг выделенного компонента

    this._selectedViewState = null

    this.selectedComponentProperties = null

    this.selectedComponentStyles = null
  }

  @computed
  get selectedPropertiesChanged() {
    return this.propertiesHaveChanged
  }

  @action.bound
  propertiesDidChange() {
    this.propertiesHaveChanged = true
  }

  /**
   * @param source - имя объекта из палитры или уже из плейграунда
   * @param target - имя объекта в плейграунде или это корзина
   */
  @action.bound
  onDrop = (source, target) => {
    console.log(`[STORE] DROP ${JSON.stringify(source)} on ${JSON.stringify(target)}`)
    const { type: sourceType, path: sourcePath } = source
    const { type: targetType, path: targetPath } = target

    let operationResult = false

    if (targetPath == null && targetType === TRASH) {
      operationResult = this.removeNode(sourcePath)
    } else if (sourcePath === PALETTE) {
      operationResult = this.addNode(sourceType, targetPath)
    } else {
      operationResult = this.moveNode(sourcePath, targetPath)
    }

    // если состояние модифицировалось, то задаем новое дерево
    if (operationResult) {
      this.setViewTree(this.viewTreeState)
    }
  }

  // для выделенной картинки меняет URI при DnD
  @action.bound
  onDropURL(path, { urls }) {
    if (this._selectedViewState && this._selectedViewState[PATH_ID] === path) {
      if (Array.isArray(urls) && urls.length > 0 && /(http(s?):)([/|.|\w|\s|-])*\.(?:jpe?g|png)/.test(urls[0])) {
        this.selectedComponentProperties.value = urls[0]
        this.propertiesDidChange()
      }
    }
  }

  @action.bound
  moveNode = (sourcePath, targetPath) => {
    let operationResult = false

    let name

    this.viewTreeState = produce(
      this.viewTreeState,
      draft => {
        const movingNode = removeChildNode(draft, sourcePath)
        if (movingNode) {
          name = nodeFullIdentifier(movingNode)

          const targetNode = getTreeNode(draft, targetPath)
          if (targetNode) {
            targetNode.elements.push(movingNode)
            operationResult = true
          } else {
            console.error(`no node with path: ${targetPath}`)
          }
        }
      },
      (patches, inversePatches) => {
        this.savePatches(patches, inversePatches, `move ${name}`)
      }
    )

    if (operationResult) {
      this.setContent(recursiveCleanPathKeys(this.viewTreeState))
      this.setViewTree(this.viewTreeState)
    }

    return operationResult
  }

  @action.bound
  addNode = (type, targetPath) => {
    console.log('ViewFile::addNode:', type, targetPath)

    let operationResult = false

    this.viewTreeState = produce(
      this.viewTreeState,
      draft => {
        // на пустрой стол можно положить только View
        if (Object.keys(draft).length === 0 && draft.constructor === Object) {
          if (type === 'view') {
            Object.assign(draft, createNode(type))
            operationResult = true
          }
        }
        // иначе уже что-то на столе есть
        else {
          const targetNode = getTreeNode(draft, targetPath)
          if (targetNode) {
            const node = createNode(type, targetPath)
            targetNode.elements.push(node)
            operationResult = true

            console.log('TARGET NODE:', targetNode)
          } else {
            console.error(`no node with path: ${targetPath}`)
          }
        }
      },
      (patches, inversePatches) => {
        this.savePatches(patches, inversePatches, `add ${uppercaseFirstLetter(type)}`)
      }
    )

    if (operationResult) {
      this.setContent(recursiveCleanPathKeys(this.viewTreeState))
      this.setViewTree(this.viewTreeState)
    }

    return operationResult
  }

  @action.bound
  removeNode = path => {
    let operationResult = false

    let name

    this.viewTreeState = produce(
      this.viewTreeState,
      draft => {
        // нельзя удалить корневой View
        if (draft[PATH_ID] !== path) {
          const node = removeChildNode(draft, path)

          if (node) {
            operationResult = true

            name = nodeFullIdentifier(node)
          }

          if (/*this.openedFiles[this.activeIndex].selectedViewState*/ this._selectedViewState) {
            const selectedPath = /*this.openedFiles[this.activeIndex].selectedViewState[PATH_ID]*/ this
              ._selectedViewState[PATH_ID]

            // развыделение
            if (selectedPath.includes(path)) {
              /*this.openedFiles[this.activeIndex].selectedViewState*/ this.unselectSelectedNode()
            }
          }
        }
      },
      (patches, inversePatches) => {
        this.savePatches(patches, inversePatches, `remove ${name}`)
      }
    )

    if (operationResult) {
      this.setContent(recursiveCleanPathKeys(this.viewTreeState))
      this.setViewTree(this.viewTreeState)
    }

    return operationResult
  }

  @action.bound
  onTreeStructureChanged = (movingNodePath, oldParentPath, newParentPath, newIndexInParent) => {
    console.log('MOVING NODE PATH:', movingNodePath)
    console.log('OLD PARENT PATH:', oldParentPath)
    console.log('NEW PARENT PATH:', newParentPath)
    console.log('NEW POSITION IN PARENT:', newIndexInParent)

    let operationResult = false

    let name

    this.viewTreeState = produce(
      this.viewTreeState,
      draft => {
        const oldParentNode = getTreeNode(draft, oldParentPath)
        const oldIndexInParent = oldParentNode.elements.findIndex(item => item[PATH_ID] === movingNodePath)

        if (oldParentPath === newParentPath) {
          moveArray(oldParentNode.elements, oldIndexInParent, newIndexInParent)
        } else {
          const movingNode = getTreeNode(draft, movingNodePath)

          name = nodeFullIdentifier(movingNode)

          oldParentNode.elements = oldParentNode.elements.filter(item => item[PATH_ID] !== movingNodePath)
          const newParentNode = getTreeNode(draft, newParentPath)
          newParentNode.elements = [
            ...newParentNode.elements.slice(0, newIndexInParent),
            movingNode,
            ...newParentNode.elements.slice(newIndexInParent)
          ]

          walkTree(movingNode, node => {
            node[PATH_ID] = node[PATH_ID].replace(oldParentPath, newParentPath)
          })
        }
      },
      (patches, inversePatches) => {
        this.savePatches(patches, inversePatches, `move ${name}`)
      }
    )

    // if (operationResult) {
    this.setContent(recursiveCleanPathKeys(this.viewTreeState))
    this.setViewTree(this.viewTreeState)
    // }
  }

  // сохранение извне знаний об объектах свойств компонента и его стилей
  @action.bound
  coollectPropertiesStates = (properties, styles) => {
    console.log(`COLLECT PROPS AND SYLES: PROPS:${JSON.stringify(properties)}`)
    this.selectedComponentProperties = properties
    this.selectedComponentStyles = styles
  }

  // сериализация свойст компонента и замена ими текущего состояния выделенного компонента
  @action.bound
  serializeObjectProperties = () => {
    this.propertiesHaveChanged = false

    let name

    // свойства объекта, очищенные от стилей
    const obj = numberify(R.clone(cleanMergedStyles({ ...this.selectedComponentProperties, styles: [] })))
    console.log('CLEANED MERGED STYLES (OBJECT OWN PROPERTIES):', obj)

    // собираем все стили элементов
    if (this.selectedComponentStyles) {
      const styles = this.selectedComponentStyles.map(({ key, state }) => ({ key, style: R.clone(state) }))
      console.log('ARRAY OF STYLE SLICES:', styles)
      obj.styles = mergeStyleSlices(styles)
    } else {
      obj.styles = [{ self: [{}] }]
    }

    // берем  и по нему в draft перезаписываем свойста объекта
    this.viewTreeState = produce(
      this.viewTreeState,
      draft => {
        const node = getTreeNode(draft, this._selectedViewState[PATH_ID])
        if (node) {
          name = nodeFullIdentifier(node)

          obj.type = node.type // в obj нет этого, копируем чтобы сравнение не выявило разницы
          obj.displayType = node.displayType
          copyObject(node, obj)
        } else {
          console.log('UNABLE TO UPDATE ATTRIBUTES FOR OBJECT:', this._selectedViewState[PATH_ID])
        }
      },
      (patches, inversePatches) => {
        this.savePatches(patches, inversePatches, `modify ${name}`)
      }
    )

    const cleanedViewTreeState = recursiveCleanPathKeys(this.viewTreeState)

    this.setContent(cleanedViewTreeState /*recursiveCleanPathKeys(this.viewTreeState)*/)

    this.setViewTree(this.viewTreeState)
  }

  @action.bound
  undoLastChanges() {
    // moment.duration(1, "minutes").humanize();

    // развыделяем выделенный объект - т.к. панель может содержать состояния отсутствующего компонента
    this.unselectSelectedNode()

    const lastChanges = toJS(this.inverseChanges[this.historyMoment])

    console.log('LAST CHANGES:', lastChanges)

    const timeDiff = moment.duration(moment().diff(lastChanges.dateTime)).humanize()

    console.log(`Back to state ${timeDiff} before:`, lastChanges.inversePatches)

    this.viewTreeState = applyPatches(this.viewTreeState, [...lastChanges.inversePatches])
    this.historyMoment -= 1

    console.log('UNDO:', this.viewTreeState)

    this.setContent(recursiveCleanPathKeys(this.viewTreeState))
    this.setViewTree(this.viewTreeState)
  }

  @action.bound
  redoLastUndone() {
    // развыделяем выделенный объект - т.к. панель может содержать состояния отсутствующего компонента
    this.unselectSelectedNode()

    const lastChanges = toJS(this.changes[this.historyMoment + 1])

    const timeDiff = moment.duration(moment().diff(lastChanges.dateTime)).humanize()

    console.log(`Back to state ${timeDiff} before:`, lastChanges.patches)

    this.viewTreeState = applyPatches(this.viewTreeState, [...lastChanges.patches])
    this.historyMoment += 1

    console.log('REDO:', this.viewTreeState)

    this.setContent(recursiveCleanPathKeys(this.viewTreeState))
    this.setViewTree(this.viewTreeState)
  }

  @computed
  get hasHistoryChanges() {
    return this.historyMoment > -1
  }

  @computed
  get hasUndoneChanges() {
    return this.inverseChanges.length > 0 && this.historyMoment < this.inverseChanges.length - 1
  }
}
