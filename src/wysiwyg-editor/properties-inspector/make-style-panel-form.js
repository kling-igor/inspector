import React from 'react'
import { observable } from 'mobx'
import * as deepmerge from 'deepmerge'
import styled from 'styled-components'
import { lensGet, isObject } from '../../utils'
import makeForm from './make-form'
import MultiSelect from './multiselect'
import makeStyleModel from './make-style-model'
import { TYPE } from '../interface-types'
import { Divider } from './components'
import { useCollapsible } from './collapsibe-header'

import styleSchemes from './style-schemes'

// возможные ключи элементов стиля
const elementNames = [
  'self',
  'title',
  'label',
  'header',
  'content',
  'menu',
  'menuItem',
  'listItem',
  'autocompleteInput',
  'tab',
  'icon',
  'thumb',
  'track',
  'trackSwitched',
  'text',
  'hint',
  'error',
  'tabBar',
  'tab',
  'inkBar',
  'sectionedListHeader',
  'radiogroupItem',
  'disabled',
  'dropdownHeader',
  'inputStyle',
  'dateText',
  'okLabel',
  'cancelLabel'
]

// получение ключей элементов стиля в описании схемы
const getStyleKeys = styleSchema =>
  styleSchema.reduce((acc, item) => {
    if (typeof item !== 'string') {
      return [...acc, item.styleKey]
    }

    return acc
  }, [])

const isStyleMatchesSchema = (styleKeys, schemaKeys) => {
  for (const styleKey of styleKeys) {
    if (!schemaKeys.includes(styleKey)) return false
  }

  return true
}

// фильтрация стиля от неподходящих именованных стилей
/**
 * Рекурсивная фильтрация именованных стилей
 * @param {Object} styleCache - кеш именованных стилей
 * @param {Array} style - поле стилей компонента
 * @param {Array} schema - схема стилей компонента
 * @returns {Array} - стили, очищенные от неподходящих именованных стилей
 */
const stripNamedStyles = (styleCache, style, schema) => {
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
      return [...accum, item.name]
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
  console.log('STYLE CACHE:', styleCache)

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
    console.log('** makeStyleFormPane:', elementKey)
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
    console.log('** makeStyleElementForm:', styleKey)
    let elements = []
    // если указаны элементные именованные стили (как правило, должны)
    const hasNamedStyles = !!subitems.find(item => item === 'namedstyleselect')
    console.log('HAS NAMED STYLES:', hasNamedStyles)
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

  console.log('** ENTRY POINT')

  let elements = []

  // если в схеме указаны корневые именованные стили (как правило, должны)
  const hasNamedStyles = !!schema.find(item => item === 'namedstyleselect')
  console.log('HAS NAMED STYLES:', hasNamedStyles)
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
