import React from 'react'
import { observable } from 'mobx'
import * as deepmerge from 'deepmerge'
import styled from 'styled-components'
import { lensGet, isObject } from '../../utils'
import makeForm from './make-form'
import MultiSelect from './multiselect'
import makeStyleModel from './make-style-model'
import { Divider } from './components'
import { useCollapsible } from './collapsibe-header'

import styleSchemes from './style-schemes'

import { getStyleKeys, isStyleMatchesSchema, elementNames } from '../../style-utils'

/**
 * Отфильтровывает имена именованных стилей кеша, в соответствие  с предоставленной схемой стиля компонента
 * Остаются только те стили, которые вписываются в схему
 * Если схема не указана - останутся только элементарные стили - сложные будут отброшены
 * @param {Object} styleCache - кеш стилей, где ключ - имя стиля, значение - описание
 * @param {Array} schema - схема стилей компонентов
 * @returns {String[]} - имена стилей, прошедших отбор
 */
const filterNamedStyles = (styleCache, schema) => {
  const filtered = []

  for (const [name, style] of Object.entries(styleCache)) {
    if (schema) {
      // имена подэлементов стиля в соответствие со схемой стиля конкретного типа элемента
      const styleSchemaKeys = getStyleKeys(schema)
      if (isStyleMatchesSchema(Object.keys(style), styleSchemaKeys)) {
        filtered.push(name)
      }
    } else {
      if (!isStyleMatchesSchema(Object.keys(style), elementNames)) {
        filtered.push(name)
      }
    }
  }

  return filtered
}

const TitleStyle = styled.div`
  -webkit-app-region: no-drag;
  -webkit-touch-callout: none;
  user-select: none;
  text-align: right;
  text-transform: uppercase;
`

const StylesLabelStyle = styled.p`
  -webkit-app-region: no-drag;
  -webkit-touch-callout: none;
  user-select: none;
`

const onNamedStylesSelectChange = (namedStylesState, propertiesDidChange) => collection => {
  namedStylesState.replace(collection)
  propertiesDidChange()
}

// список именованных стилей, показываемый в компоненте MultiSelect при первоначальном открытии
const filterInitialNamedStyles = (namedStyleNames, style) => {
  return style.reduce((accum, item) => {
    if (typeof item === 'string' && namedStyleNames.includes(item)) {
      return [...accum, item]
    }
    return accum
  }, [])
}

/**
 * Создает компонент многосекционной формы редактирования стилей
 * @param {Object} schema - схема стилей объекта (у каждого типа обычно своя)
 * @param {Array} styles - собственно массив стилей объекта (сначала именованные, потом идет объект стилей элементов компонента)
 * @param {Object} styleCache - кеш стилей
 * @param {Function} collectObservableStates - колбек для того чтобы сообщить о всех observable чтобы из них можно было получить данные для сериализации
 * @param {Function} propertiesDidChange - колбек, вызываемый формой при изменении любого поля формы
 */
export const makeStyleForms = (schema, styles, styleCache, collectObservableStates, propertiesDidChange) => {
  // тут будут накапливаться observable части стиля
  const observableStates = []

  // массив стилей в виде объектов (в случае работы с легаси конфигурациями, где такое может встретиться)
  const stilesAsObjects = styles.filter(item => isObject(item))

  // объединяем в один - он будет всегда идти последним
  const stylesObject = stilesAsObjects.reduce((obj, item) => deepmerge(obj, item), {})

  /**
   * создание раздела (DIMENSIONS, MARGINS, PADDINGS, etc) в рамках одного ключа стиля
   * @param {Array} settingsSchema - схема элементов формы
   * @param {String} elementKey - имя подэлемента стиля к которому относятся настройки (например, self или listItem.text)
   */
  const makeStyleFormPane = (settingsSchema, elementKey, title) => {
    // заглушка на случай когда схема стиля пустая (компонент в разработке - еще не принято решение какие аттрибуты конфигурируются)
    if (Array.isArray(settingsSchema) && settingsSchema.length === 0) {
      const state = observable({})
      observableStates.push({ key: elementKey, state })
      // будет отображена пустая страница
      return () => <div />
    }

    // получаем стиль для подэлемента (self, title, etc...)
    const elementStyle = lensGet(elementKey, stylesObject)

    // делаем модель стиля - стиль-объект, наполненныей данными и заполненый дефолтными значениями. Все именованные стили из источника данных будут проигнорированы
    const styleModel = makeStyleModel(settingsSchema, elementStyle)

    const state = observable(styleModel)
    observableStates.push({ key: elementKey, state })

    const Form = makeForm(settingsSchema, propertiesDidChange)

    return () => (
      <>
        {!!title && <TitleStyle className="bp3-text-muted">{title}</TitleStyle>}
        <Form state={state} />
      </>
    )
  }

  // создание разворачиваемой формы для элемента стиля (self, label, etc)
  /**
   *
   * @param {Array} subitems - схемы стилей именованных элементов (self, label, etc) компонента
   * @param {String} styleKey - ключ
   * @param {String} title - заголовок
   */
  const makeStyleElementForm = (subitems, styleKey, title) => {
    let elements = []
    // если указаны элементные именованные стили (как правило, должны)
    const hasNamedStyles = !!subitems.find(item => item === 'namedstyleselect')

    if (hasNamedStyles) {
      // только примитивны стили останутся (т.е. не указана схеме стиля при вызове фильтрации)
      const acceptableNamedStyles = filterNamedStyles(styleCache)

      // получаем объект отбросив корневые именованные стили
      const elementsStyleObject = styles.filter(item => typeof item !== 'string')[0]
      // получаем стили элемента по возможно комбинированному ключу
      const elementStyles = lensGet(styleKey, elementsStyleObject)

      const initialNamedStyles = filterInitialNamedStyles(acceptableNamedStyles, elementStyles)
      const namedStylesState = observable(initialNamedStyles)
      observableStates.push({ key: styleKey, state: namedStylesState })

      // первый элемент формы будет элемент выбора именованного стиля для подэлемента стиля
      elements.push(() => (
        <MultiSelect
          items={acceptableNamedStyles}
          initialItems={initialNamedStyles}
          placeholderText={`Select named style for '${styleKey}'...`}
          noResultText="No named styles."
          onSelectChange={onNamedStylesSelectChange(namedStylesState, propertiesDidChange)}
        />
      ))
    }

    subitems
      .filter(item => item !== 'namedstyleselect')
      .forEach((item, i) => {
        let schemaItem
        if (typeof item === 'string') {
          schemaItem = styleSchemes[item]
        } else {
          schemaItem = item
        }

        if (!schemaItem) {
          throw new Error('no schema for ', item)
        }

        const { type, title, schemes } = schemaItem

        if (type === 'divider') {
          elements.push(() => <Divider />)
        } else {
          elements.push(makeStyleFormPane(schemes, styleKey, title))
        }
      })

    const Collapsible = useCollapsible(title, () => (
      <>
        {elements.map((Component, i) => (
          <Component key={`${styleKey}_${i}`} />
        ))}
      </>
    ))

    return () => <Collapsible />
  }

  // entry point

  let elements = []

  // если в схеме указаны корневые именованные стили (как правило, должны)
  const hasNamedStyles = !!schema.find(item => item === 'namedstyleselect')
  if (hasNamedStyles) {
    // получаем список имен именованных стилей, подходящих компоненту даного типа
    const acceptableNamedStyles = filterNamedStyles(styleCache, schema)

    // названия именованных стилей, которые должны быть уже отображены в форме
    const initialNamedStyles = filterInitialNamedStyles(acceptableNamedStyles, styles)

    const namedStylesState = observable(initialNamedStyles)
    observableStates.push({ key: null, state: namedStylesState })

    // первый элемент формы будет элемент выбора именованного стиля для всего компонента
    elements.push(() => (
      <MultiSelect
        items={acceptableNamedStyles}
        initialItems={initialNamedStyles}
        placeholderText="Select named style for entire element..."
        noResultText="No named styles."
        onSelectChange={onNamedStylesSelectChange(namedStylesState, propertiesDidChange)}
      />
    ))
  }

  // строим разворачиваемые формы элементов стиля

  const subItems = schema
    .filter(item => item !== 'namedstyleselect')
    .map((item, i) => {
      let schemaItem
      if (typeof item === 'string') {
        schemaItem = styleSchemes[item]
      } else {
        schemaItem = item
      }

      if (!schemaItem) {
        throw new Error('no schema for ', item)
      }

      const { styleKey, title, subitems } = schemaItem
      // делаем форму для целого подэлемента стиля
      const Component = makeStyleElementForm(subitems, styleKey, title)
      return () => <Component />
    })

  elements = [...elements, ...subItems]

  // уведомляем о всех срезах состояния стиля
  collectObservableStates(observableStates)

  // на этом уровне существует выбора именованных стилей для всего элемента и разворачиваемые формы для всех подэлементов стиля
  return () => (
    <>
      <StylesLabelStyle>Styles</StylesLabelStyle>
      {elements.map((Component, i) => (
        <Component key={`root_${i}`} />
      ))}
    </>
  )
}
