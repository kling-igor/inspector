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
