import * as R from 'ramda'

import { isArray, isObject, eraseEmptyFields, numberify, lensSet, lensGet } from './utils'

// стиль - массив строк
export const validNamedStylesDescription = style => isArray(style) && style.every(item => typeof item === 'string')

// вставка стиля (именованных или стиля-объекта) в МАССИВ стилей
const insertStyleIntoArray = (style, styleArray) => {
  // console.log(`INSERT_STYLE_INTO_ARRAY STYLE:${JSON.stringify(style)} STYLE_ARRAY:${JSON.stringify(styleArray)}`)

  const last = R.last(styleArray)

  if (isObject(last)) {
    if (isArray(style)) {
      return [...R.dropLast(1, styleArray), ...style, last]
    } else if (isObject(style)) {
      // склейка объектов
      return [...R.dropLast(1, styleArray), R.mergeDeepRight(last, numberify(eraseEmptyFields(style)))]
    }
  } else {
    if (isArray(style)) {
      return [...styleArray, ...style]
    } else if (isObject(style)) {
      return [...styleArray, numberify(eraseEmptyFields(style))]
    }
  }

  return styleArray
}

// в объект (target) по пути (key) вставляет стиль (style)
const mergeStyleByKey = (key, style, target) => {
  // console.log(`MERGE_STYLE_BY_KEY KEY:${key} STYLE:${JSON.stringify(style)} TARGET:${JSON.stringify(target)}`)

  const styleArray = lensGet(key, target) || []

  const result = insertStyleIntoArray(style, styleArray)

  return lensSet(key, [...result], target)
}

const mergeStyle = (merged, { key, style }) => {
  // console.log(`MERGE_STYLE MERGED:${JSON.stringify(merged)} KEY:${key} STYLE:${JSON.stringify(style)}`)

  if (key) {
    const last = R.last(merged)
    if (isObject(last)) {
      return [...R.dropLast(1, merged), mergeStyleByKey(key, style, last)]
    } else {
      return [...merged, mergeStyleByKey(key, style, {})]
      // console.log('RET:', JSON.stringify(ret))
    }
  } else {
    // вставка напрямую в merged
    return insertStyleIntoArray(style, merged)
  }
}

export const mergeStyleSlices = styleSlices => styleSlices.reduce(mergeStyle, [])

// получение ключей элементов стиля в описании схемы
export const getStyleKeys = styleSchema => {
  return styleSchema.reduce((acc, item) => {
    if (typeof item !== 'string') {
      return [...acc, item.styleKey]
    }

    return acc
  }, [])
}

export const isStyleMatchesSchema = (styleKeys, schemaKeys) => {
  for (const styleKey of styleKeys) {
    if (!schemaKeys.includes(styleKey)) return false
  }

  return true
}

/**
 * Рекурсивная фильтрация именованных стилей
 * @param {Object} styleCache - кеш именованных стилей
 * @param {Array} style - поле стилей компонента
 * @param {Array} schema - схема стилей компонента
 * @returns {Array} - стили, очищенные от неподходящих именованных стилей
 */
export const stripNamedStyles = (styleCache, style, schema) => {
  const namedStyleKeys = Object.keys(styleCache[item])

  return style.reduce((acc, item) => {
    if (typeof item === 'string') {
      if (!namedStyleKeys.includes(item)) {
        return acc
      }

      if (schema) {
        const schemaKeys = getStyleKeys(schema)

        // если в namedStyleKeys есть хоть один ключ которого нет в schemaKeys, то отбрасываем этот стиль
        if (!isStyleMatchesSchema(namedStyleKeys, schemaKeys)) {
          return acc
        }
      } else {
        // тут если проверка именованного стиля внутри подэлемента
        // нужна какая-то эвристика чтобы понять что именованный стиль имеет отношение непосредственно к элементу а не к сложному компоненту в целом
        // можно проанализировать наличие ключей, свойственных схеме

        // если в namedStyleKeys есть хоть один ключ который бывает в схемах, то отбрасываем этот стиль т.к. это сложный стиль и он не должен был бы быть на этом уровне
        if (isStyleMatchesSchema(namedStyleKeys, elementNames)) {
          return acc
        }
      }
    } else {
      // наличие схемы как признак того на каком уровне вложенности мы находимся
      if (schema) {
        // console.log('STRIP SUBELEMENTS STYLES', item)
        // иначе это объект с возможно множеством ключей - каждый ключ это массив который также нужно очистить
        for (const [elementKey, elementStyle] of Object.entries(item)) {
          item[elementKey] = stripNamedStyles(styleCache, elementStyle) // нужно не углубляться дальше конкретных стилей подэлементов стиля !!!
        }

        // console.log('STRIPPED:', item)
      }
    }

    return [...acc, item]
  }, [])
}

/**
 * Рекурсивно чистит объект от неподходящих именованных стилей
 * @param {Object} viewState - очищаемый объект (мутирует)
 * @param {Object} schemes - словарь схем стилей для всех типов компонентов
 * @param {Object} styleCache - кеш стилей
 */
export const cleanInvalidNamedStyles = (viewState, schemes, styleCache) => {
  const type = viewState.displayType || viewState.type

  const schema = schemes[type]

  viewState.styles = stripNamedStyles(styleCache, element.styles, schema)

  if (viewState.elements && viewState.elements.length > 0) {
    viewState.elements.forEach(childViewState => cleanInvalidNamedStyles(childViewState, schemes, styleCache))
  }
}
