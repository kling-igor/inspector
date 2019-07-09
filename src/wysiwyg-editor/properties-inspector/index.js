import React, { Fragment } from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

// import { componentPropertiesSchema, componentStylesSchema, TYPE } from '../../form-schemas'

import { TYPE } from '../interface-types'
// import { makeStylePanelStack } from './make-style-panel-stack'
import { makeStyleForms } from './make-style-panel-form'
import makeForm from './make-form'
import defaultValues from './default-values'

const containerStyle = { padding: 12, height: '100%', overflowX: 'hidden', overflowY: 'auto' }

/**
 * @export
 * @class PropertiesInspector
 * @extends {Component}
 * @example <PropertiesInspector viewState={viewState} namedStyles={namedStyles}/>
 */
export const PropertiesInspector = observer(
  ({ viewState, namedStyles, schema, stylesSchema, styleSchemes, coollectPropertiesStates, propertiesDidChange }) => {
    // отделяем стили от других свойств объекта
    const { styles, ...rest } = viewState

    const Form = makeForm(schema, propertiesDidChange)

    // когда нужно будет реализовывать графики - то треш с сложными ключами свойств доберется и сюда

    // наполняем состояние аттрибутами из схемы со значениями по-умолчанию

    // в соответствие со схемой
    for (const item of schema) {
      const { key, type } = item
      if (type === TYPE.DEVIDER) continue

      // если в объекте нет аттрибута как в схеме
      if (!rest.hasOwnProperty(key)) {
        // и в схеме определено значение по-умолчанию для такого аттрибута
        if (item.default != null) {
          // вставляем в объект такой аттрибут со значением по-умолчанию
          rest[key] = item.default
        } else {
          if (type === TYPE.OPTIONS) {
            const { value } = item.options[0]
            rest[key] = value
          } else {
            rest[key] = defaultValues[type]
          }
        }
      }
    }

    // делаем объект наблюдаемым
    const selfState = observable(rest)

    if (stylesSchema.length > 0) {
      const coollectStyleStates = styleStates => {
        coollectPropertiesStates(selfState, styleStates)
      }

      const StylePanes = makeStyleForms(stylesSchema, styles, namedStyles, coollectStyleStates, propertiesDidChange)

      return (
        <div /*className="bp3-dark"*/ style={containerStyle}>
          <Form state={selfState} />
          <StylePanes />
        </div>
      )
    }

    coollectPropertiesStates(selfState)

    return (
      <div /*className="bp3-dark"*/ style={containerStyle}>
        <Form state={selfState} />
      </div>
    )
  }
)
