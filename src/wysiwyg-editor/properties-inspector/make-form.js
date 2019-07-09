import React from 'react'
import { observer } from 'mobx-react'

import {
  Divider,
  Checkbox,
  TextInput,
  Options,
  ColorPickerRGB,
  ColorPickerRGBA,
  OrientationWidget,
  AlignWidget3D,
  AlignWidget9D
} from './components'
import { TYPE } from '../interface-types'
import { lensSet } from '../../utils'

/**
 * Строит форму ввода в соответствие с описанием
 * @param {Object} schema
 */
const makeForm = (schema, propertiesDidChange) => {
  const onChange = state => key => ({ target }) => {
    const { type, value, checked } = target
    const actualValue = type === 'checkbox' ? checked : value

    Object.assign(state, lensSet(key, actualValue, state))
    propertiesDidChange()
  }

  const onClick = state => key => value => {
    Object.assign(state, lensSet(key, value, state))
    propertiesDidChange()
  }

  const onSelect = state => key => value => {
    Object.assign(state, lensSet(key, value, state))
    propertiesDidChange()
  }

  const children = []

  let component

  for (const item of schema) {
    const { label, type, subtype, key, required, placeholder, options, disabled } = item

    switch (type) {
      case TYPE.NAMEDSTYLESELECT: {
        // может имеет смысл вставить сюда multiselect ?
        continue
      }

      case TYPE.DIVIDER:
        {
          component = Divider
        }
        break

      case TYPE.BOOLEAN:
        {
          component = Checkbox(label, disabled)
        }
        break

      case TYPE.STRING:
        {
          component = TextInput(key, label, placeholder, required, disabled)
        }
        break

      case TYPE.OPTIONS:
        {
          // if (key === 'orientation') {
          // component = OrientationWidget(key, label)
          // } else if (key === 'align') {
          // if (subtype === '3D') {
          //   component = AlignWidget3D(key, label)
          // } else if (subtype === '9D') {
          //   component = AlignWidget9D(key, label)
          // } else {
          //   throw new Error('Invalid subtype for align - unable to make widget')
          // }
          // } else {
          component = Options(label, options, disabled)
          // }
        }
        break

      case TYPE.RGB:
        {
          component = ColorPickerRGB(label)
        }
        break

      case TYPE.RGBA:
        {
          component = ColorPickerRGBA(label)
        }
        break
    }

    children.push({ component, key })
  }

  return observer(({ state }) => {
    return (
      <div>
        {children.map(({ component: Component, key }, i) => {
          if (key == null) {
            return <Component key={`__has_no_key_${i}__`} />
          }

          return (
            <Component
              key={key}
              value={state[key]}
              onChange={onChange(state)(key)}
              onClick={onClick(state)(key)}
              onSelect={onSelect(state)(key)}
            />
          )
        })}
      </div>
    )
  })
}

export default makeForm
