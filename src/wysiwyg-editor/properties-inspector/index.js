import React, { Fragment } from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

// import { componentPropertiesSchema, componentStylesSchema, TYPE } from '../../form-schemas'

import { TYPE } from '../interface-types'
// import { makeStylePanelStack } from './make-style-panel-stack'
import makeForm from './make-form'

const containerStyle = { padding: 12, height: '100%', overflowX: 'hidden', overflowY: 'auto' }

/**
 * @export
 * @class PropertiesInspector
 * @extends {Component}
 * @example <PropertiesInspector viewState={viewState} namedStyles={namedStyles}/>
 */
export const PropertiesInspector = observer(
  ({ viewState, namedStyles, schema, stylesSchema, styleSchemes, coollectPropertiesStates, propertiesDidChange }) => {
    const { /*type, displayType,*/ styles, ...rest } = viewState

    // // по type определяем соответствующую схему для свойств элемента UI
    // // const schema = componentPropertiesSchema(type, displayType)
    // const schema = type === 'list' || type === 'chart' ? stateSchemes[displayType] : stateSchemes[type]

    // // по type определяем соответствующую схему для стилей элемента UI
    // // const stylesSchema = componentStylesSchema(type, displayType)
    // const stylesSchema = type === 'list' || type === 'chart' ? styleSchemes[displayType] : styleSchemes[type]

    const Form = makeForm(schema, propertiesDidChange)

    // когда нужно будет реализовывать графики - то треш с сложными ключами свойсв доберется и сюда

    const defaultValues = {
      [TYPE.BOOLEAN]: false,
      [TYPE.NUMBER]: 0,
      [TYPE.STRING]: ''
    }

    // TODO: такой код уже есть - имеет смысл убрать дублирование!!

    // наполняем состояние аттрибутами из схемы со значениями по-умолчанию

    for (const item of schema) {
      const { key, type } = item
      if (type === TYPE.DEVIDER) continue

      if (!rest.hasOwnProperty(key)) {
        if (item.default != null) {
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

    const selfState = observable(rest)

    if (stylesSchema.length > 0) {
      // const coollectStyleStates = styleStates => {
      //   coollectPropertiesStates(selfState, styleStates)
      // }

      // const StylePanelStack = makeStylePanelStack(
      //   stylesSchema,
      //   styles,
      //   namedStyles,
      //   coollectStyleStates,
      //   propertiesDidChange
      // )

      return (
        <div /*className="bp3-dark"*/ style={containerStyle}>
          <Form state={selfState} />
          {/* <StylePanelStack /> */}
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
