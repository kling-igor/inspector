import * as R from 'ramda'

import { TYPE } from '../interface-types'
import { lensGet, lensSet, isObject } from '../../utils'

const defaultValues = {
  [TYPE.BOOLEAN]: false,
  [TYPE.NUMBER]: 0,
  [TYPE.STRING]: ''
}

// TODO: протестировать!!!

/**
 * Формирование среза стиля для подэлемента компонента,
 * Наполнен данными объекта кастомного стиля в комбинации с
 * данными по умолчанию из схемы описания стиля
 * @param {Object[]} styleSchema - схема стиля
 * @param {Object} styleSlice - релевантный срез стиля в виде объекта - источник данных для модели
 */
export default (styleSchema, styleSlice) => {
  const style = {}

  const last = R.last(styleSlice)
  const styleObject = isObject(last) ? last : {}

  // делаем срез стиля в соответствие со схемой и заполняем данными из внешнего источника
  for (const schemaItem of styleSchema) {
    if (schemaItem.type === TYPE.DIVIDER || schemaItem.type === TYPE.NAMEDSTYLESELECT) continue

    const value = lensGet(schemaItem.key, styleObject)

    if (value == null) {
      if (schemaItem.default != null) {
        Object.assign(style, lensSet(schemaItem.key, schemaItem.default, style))
      } else {
        if (schemaItem.type === TYPE.OPTIONS) {
          Object.assign(style, lensSet(schemaItem.key, schemaItem.options[0].value, style))
        } else {
          Object.assign(style, lensSet(schemaItem.key, defaultValues[schemaItem.type], style))
        }
      }
    } else {
      if (typeof value === 'number') {
        Object.assign(style, lensSet(schemaItem.key, value.toString(), style))
      } else if (typeof value === 'string') {
        if (schemaItem.type === TYPE.RGB || schemaItem.type === TYPE.RGB) {
          if (/#[0-9a-f]{3,8}/i) {
            Object.assign(style, lensSet(schemaItem.key, value, style))
          } else {
            // проверить со словарем цветов!!!
          }
        } else {
          // проверяем на суффиксы
          if (/\d*%?/i.test(value)) {
            Object.assign(style, lensSet(schemaItem.key, value.toLowerCase(), style))
          } else {
            // отбрасываем все что не % TODO: влияет на шрифты!!!!!!!!!!!!  em, rem
            const match = /(\d*)%?/.exec(value)
            if (match) {
              Object.assign(style, lensSet(schemaItem.key, match[1], style))
            }
          }
        }
      }
    }
  }

  return style
}
