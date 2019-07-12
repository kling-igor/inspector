import _ from 'lodash'
import * as R from 'ramda'

export const PATH_ID = '__PATH_ID__'

export const isArray = arr => Array.isArray(arr)

export const isObject = obj => !!obj && obj === Object(obj) && obj.constructor === Object

export const emptyObject = object => isObject(object) && !Object.keys(object).length

/**
 * Рекурсивно копирует в target измененные значения совпадающих ключей,
 * добавляет отсутсвующие в target ключи и удаляет отсутствующие в source
 * @param {Object} target
 * @param {Object} source
 */
export const copyObject = (target, source) => {
  Object.keys(target).reduce((result, key) => {
    // result - все ключи что есть в новом объекте
    // key - i-тый ключ старого объекта

    // если ключ старого объекта есть в новом объекте
    if (result.includes(key)) {
      if (isObject(target[key]) && isObject(source[key])) {
        copyObject(target[key], source[key])
      } else {
        if (target[key] !== source[key]) {
          if (isObject(source[key])) {
            target[key] = _.cloneDeep(source[key])
          } else {
            target[key] = source[key]
          }
        }
      }
    } else {
      delete target[key]
    }

    return result
  }, Object.keys(source))

  Object.keys(source).reduce((result, key) => {
    // result - все ключи что есть в старом объекте
    // key - i-тый ключ нового объекта
    if (!result.includes(key)) {
      if (isObject(source[key])) {
        target[key] = _.cloneDeep(source[key])
      } else {
        target[key] = source[key]
      }
    }

    return result
  }, Object.keys(target))
}

// поверхностно удаляет все свойства из указанного списка
const cleanObjectKeys = (keys = []) => object => {
  const result = {}
  Object.keys(object).forEach(key => {
    if (!keys.includes(key) && object[key] != null && object[key] !== '') {
      result[key] = object[key]
    }
  })
  return result
}

export const cleanMergedStyles = cleanObjectKeys(['mergedStyle'])

export const eraseEmptyFields = cleanObjectKeys()

export const cleanPathKeys = cleanObjectKeys([PATH_ID])

export const recursiveCleanPathKeys = node => {
  const result = cleanPathKeys(node)
  if (isArray(result.elements) && result.elements.length > 0) {
    result.elements = result.elements.map(recursiveCleanPathKeys)
  }

  return result
}

/**
 * удаляем свойства, значения которых равны дефолтным значениям в схеме
 * @param {Object} viewState - стейт компонента
 * @param {Object} propertiesSchemes - схемы описания свойств для всех типов
 * @returns {Object} копия стейта, очищенная от дефолтых свойств
 */
export const recursiveCleanDefaultValues = (viewState, propertiesSchemes) => {
  const type = viewState.displayType || viewState.type
  const schema = propertiesSchemes[type]

  const copy = {}

  for (const key of Object.keys(viewState)) {
    const found = schema.find(item => item.key === key)

    if (found) {
      // только то, что не равно дефолтным значениям переходит в копию
      if (found['default'] !== viewState[key]) {
        copy[key] = viewState[key]
      }
    } else {
      // то, чего нет в схеме - переходит как есть
      copy[key] = viewState[key]
    }
  }

  if (viewState.elements) {
    copy.elements = viewState.elements.map(element => recursiveCleanDefaultValues(element, propertiesSchemes))
  }

  return copy
}

export const numberify = object => {
  const result = {}
  Object.keys(object).forEach(key => {
    let value = object[key]
    if (key !== 'id' && typeof value === 'string') {
      if (/^-?\d*$/.test(value)) {
        value = parseInt(value, 10)
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        value = parseFloat(value)
      }
    }

    result[key] = value
  })

  return result
}

export function isElectron() {
  // Renderer process
  if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
    return true
  }

  // Main process
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
    return true
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
  ) {
    return true
  }

  return false
}

/**
 * removes hash from filename
 * @param {String} fileName
 * @returns {Stirng}
 */
export const hashlessFileName = fileName =>
  fileName.replace(/(.*)(-[0-9a-f]*)(\..*)/, (match, p1, p2, p3) => `${p1}${p3}`)

/**
 * get hash from filename
 * @param {String} fileName
 * @returns {String | undefined }
 */
export const fileNameHash = fileName => {
  const match = fileName.match(/(?:.*)(-[0-9a-f]*)(?:\..*)/)
  if (match) {
    return match[1]
  }

  return ''
}

export const lensSet = (path, value, target) => {
  const lens = R.lensPath(path.split('.'))
  return R.set(lens, value, target)
}

export const lensGet = (path, obj) => {
  const lens = R.lensPath(path.split('.'))
  return R.view(lens, obj)
}
