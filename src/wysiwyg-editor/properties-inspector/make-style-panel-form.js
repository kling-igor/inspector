import React from 'react'
import { observable } from 'mobx'
import * as deepmerge from 'deepmerge'
import { lensGet, isObject } from '../../utils'
import makeForm from './make-form'
import MultiSelect from './multiselect'
import makeStyleModel from './make-style-model'
import { TYPE } from '../interface-types'

import { Divider } from './components'

const onNamedStylesSelectChange = (namedStylesState, propertiesDidChange) => collection => {
  namedStylesState.replace(collection)
  propertiesDidChange()
}

// список именованных стилей, показываемый в компоненте MultiSelect при первоначальном открытии
const filterInitialNamedStyles = globalNamedStyles => stylesArray => {
  return stylesArray.reduce((accum, item) => {
    if (typeof item !== 'string') return accum
    // отбрасывать обнаруживаемые именованные стили которых нет в списке globalNamedStyles
    if (!globalNamedStyles.includes(item)) return accum
    return [...accum, item]
  }, [])
}

/**
 * Создает компонент многосекционной формы редактирования стилей
 * @param {Object} schema - схема стилей объекта (у каждого типа обычно своя)
 * @param {Array} styles - собственно массив стилей объекта (сначала именованные, потои идет объект стилей элементов компонента)
 * @param {String[]} globalNamedStyles - список доступных именованных стилей
 * @param {Function} collectObservableStates - колбек для того чтобы сообщить о всех observable чтобы из них можно было получить данные для сериализации
 * @param {Function} propertiesDidChange - колбек, вызываемый формой при изменении любого поля формы
 */
export const makeStyleForms = (
  schema,
  styles,
  globalNamedStyles = [],
  collectObservableStates,
  propertiesDidChange
) => {
  // тут будут накапливаться observable части стиля
  const observableStates = []

  // массив стилей в виде объектов (в случае работы с легаси конфигурациями, где такое может встретиться)
  const stilesAsObjects = styles.filter(item => isObject(item))

  // объединяем в один - он будет всегда идти последним
  const stylesObject = stilesAsObjects.reduce((obj, item) => deepmerge(obj, item), {})

  /**
   * создаение форм для одного элемента стиля
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

    const hasNamedStyles = !!settingsSchema.find(item => item.type === TYPE.NAMEDSTYLESELECT)

    if (hasNamedStyles) {
      const initialNamedStyles = filterInitialNamedStyles(globalNamedStyles)(elementStyle)
      const namedStylesState = observable(initialNamedStyles)
      observableStates.push({ key: elementKey, state: namedStylesState })
      return () => (
        <>
          {/* это будет пока заголовок секции формы стиля */}
          {!!title && <div>{title}</div>}
          <MultiSelect
            items={globalNamedStyles.map(item => item.name)}
            initialItems={initialNamedStyles}
            placeholderText="Select named style.."
            noResultText="No named styles."
            onSelectChange={onNamedStylesSelectChange(namedStylesState, propertiesDidChange)}
          />
          <Form state={state} />
        </>
      )
    }

    return () => (
      <>
        {/* это будет пока заголовок секции формы стиля */}
        {!!title && <div style={{ textAlign: 'right' }}>{title}</div>}
        <Form state={state} />
      </>
    )
  }

  // создание разворачиваемой формы для элемента стиля (self, label, etc)
  const makeStyleElementForm = (subitems, styleKey, title) => {
    let elements = []
    // если указаны элементные именованные стили (как правило, должны)
    const hasNamedStyles = !!subitems.find(item => item.type === TYPE.NAMEDSTYLESELECT)
    if (hasNamedStyles) {
      const initialNamedStyles = filterInitialNamedStyles(globalNamedStyles)(styles)
      const namedStylesState = observable(initialNamedStyles)
      observableStates.push({ key: styleKey, state: namedStylesState })

      // первый элемент формы будет элемент выбора именованного стиля для подэлемента стиля
      elements.push(() => (
        <MultiSelect
          items={globalNamedStyles.map(item => item.name)}
          initialItems={initialNamedStyles}
          placeholderText={`Select named style for '${styleKey}'...`}
          noResultText="No named styles."
          onSelectChange={onNamedStylesSelectChange(namedStylesState, propertiesDidChange)}
        />
      ))
    }

    subitems
      .filter(item => item.type !== TYPE.NAMEDSTYLESELECT)
      .forEach((item, i) => {
        const { type, title, schemes } = item

        if (type === 'divider') {
          elements.push(() => <Divider />)
        } else {
          elements.push(makeStyleFormPane(schemes, styleKey, title))
        }
      })

    return () => (
      <>
        <div>{`COLLAPSIBLE HEADER ${title}`}</div>
        {elements.map((Component, i) => (
          <Component key={`${styleKey}_${i}`} />
        ))}
      </>
    )
  }

  let elements = []

  // если указаны корневые именованные стили (как правило, должны)
  const hasNamedStyles = !!schema.find(item => item.type === TYPE.NAMEDSTYLESELECT)
  if (hasNamedStyles) {
    const initialNamedStyles = filterInitialNamedStyles(globalNamedStyles)(styles)
    const namedStylesState = observable(initialNamedStyles)
    observableStates.push({ key: null, state: namedStylesState })

    // первый элемент формы будет элемент выбора именованного стиля для всего компонента
    elements.push(() => (
      <MultiSelect
        items={globalNamedStyles.map(item => item.name)}
        initialItems={initialNamedStyles}
        placeholderText="Select named style for entire element..."
        noResultText="No named styles."
        onSelectChange={onNamedStylesSelectChange(namedStylesState, propertiesDidChange)}
      />
    ))
  }

  // строим разворачиваемые формы элементов стиля

  const subItems = schema
    .filter(item => item.type !== TYPE.NAMEDSTYLESELECT)
    .map((schemaItem, i) => {
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
      {elements.map((Component, i) => (
        <Component key={`root_${i}`} />
      ))}
    </>
  )
}
