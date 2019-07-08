import uuidv4 from 'uuid/v4'

export const PATH_ID = '__PATH_ID__'

// import uimodels from './uimodels'

/**
 * получение узла из viewTree
 * @param {*} node
 * @param {*} path
 */
export const getTreeNode = (node, path) => {
  if (node[PATH_ID] === path) {
    return node
  }

  const { elements } = node

  if (elements && elements.length) {
    for (const child of elements) {
      const found = getTreeNode(child, path)
      if (found) return child
    }
  }
}

/**
 * создание узла и присовение ему уникального ID, описывающего его положение в дереве
 * @param {*} type
 * @param {*} targetPath
 */
export const createNode = (type, targetPath = '') => {
  throw new Error('!!! uimodels does not defined here!!!! IMPROVE IN EDITOR!!!')

  const model = uimodels[type]

  if (!model) {
    console.warn(`no prototype for '${type}'`)
    return
  }

  const node = Object.assign({ [PATH_ID]: `${targetPath}/${uuidv4()}` }, model)

  console.log('CREATED OBJECT:', node)

  return node
}

/**
 * Removes node from tree
 * @param {Node} parentNode - parent node to looking in for removing child
 * @param {String} removingPath - path of removing component
 * @returns {Node|undefined} - removed node or undefined if node with `removingPath` not found
 *
 */
export const removeChildNode = (parentNode, removingPath) => {
  const { elements } = parentNode

  if (elements && elements.length) {
    for (const index in elements) {
      const child = elements[index]
      if (child[PATH_ID] === removingPath) {
        // parentNode.elements = [...elements.slice(0, index), ...elements.slice(index + 1)] // WTF!! IT DOESN`T WORK AS EXPECTED
        parentNode.elements.splice(index, 1)
        return child
      } else {
        const foundChild = removeChildNode(child, removingPath)
        if (foundChild) return foundChild
      }
    }
  }
}

/**
 * парсит объект (считанный JSON, описывающий View)
 * @param {Object} object - описание вида
 * @returns {Object} - копия объекта в узлы которого добавлены ключи по которым можно для отдельно взятого
 * элемента определить его местоположение в иерархии
 */
export const appendNodePath = object => {
  const traverse = (node, parentPath = '', depth = 0) => {
    const { elements, type, ...rest } = node

    const path = `${parentPath}/${uuidv4()}`

    const children = elements ? elements.map(child => traverse(child, path, depth + 1)) : null

    return { [PATH_ID]: path, type, ...rest, elements: children }
  }

  return traverse(object)
}

/**
 * Обходит дерево, применяя к каждому узлу функцию
 * @param {*} tree
 * @param {*} fn
 */
export const walkTree = (node, fn) => {
  const { elements } = node
  if (Array.isArray(elements)) {
    elements.forEach(item => {
      fn(item)
      walk(item, fn)
    })
  }
}
