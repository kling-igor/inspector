import React from 'react'
import { Button, PanelStack } from '@blueprintjs/core'
import { observable } from 'mobx'
import uuidv4 from 'uuid/v4'
import * as deepmerge from 'deepmerge'
import * as R from 'ramda'

import { TYPE } from '../interface-types'
import { lensGet, isObject } from '../../../utils'
import makeForm from './make-form'
import MultiSelect from './multiselect'
import makeStyleModel from './make-style-model'

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
 * Создает компонент многостраничной формы редактирования стилей
 * @param {Object} schema - схема стилей объекта (у каждого типа обычно своя)
 * @param {Array} styles - собственно массив стилей объекта (сначала именованные, потои идет объект стилей элементов компонента)
 * @param {String[]} globalNamedStyles - список доступных именованных стилей
 * @param {Function} collectObservableStates - колбек для того чтобы сообщить о всех observable чтобы из них можно было получить данные для сериализации
 * @param {Function} propertiesDidChange - колбек, вызываемый формой при изменении любого поля формы
 */
export const makeStylePanelStack = (
  schema,
  styles,
  globalNamedStyles = [],
  collectObservableStates,
  propertiesDidChange
) => {
  // console.log(`makeStylePanelStack: STYLES:`, JSON.stringify(styles))
  // console.log(`makeStylePanelStack: SCHEMA:`, JSON.stringify(schema))

  // тут будут накапливаться observable части стиля
  const observableStates = []

  // массив стилей в виде объектов (в случае работы с легаси конфигурациями, где такое может встретиться)
  const stilesAsObjects = styles.filter(item => isObject(item))

  // объединяем в один - он будет всегда идти последним
  const stylesObject = stilesAsObjects.reduce((obj, item) => deepmerge(obj, item), {})

  /**
   * Создание страницы с элементами настроек стиля
   * @param {Array} settingsSchema - схема элементов формы
   * @param {String} elementKey - имя подэлемента стиля к которому относятся настройки (например, self или listItem.text)
   * на 0-м строится навигационная панель в которой перичислены компоненты стиля (self, label и т.п.)
   * на 1-й соответствует какому-то компоненту стиля, тут строится либо панель навигации с выбором именованных стилей
   * и пунктами меню группировки элементов компонента стиля (группировка для удобства - сколь глубого не уходила бы навигаци вглубь - все это относится к компонету стиля)
   * либо на 1-м сразу строится полная таблица настроект компонта стиля. Она предваряется панелью выбора именованных стилей
   */
  const makeSettingsPage = (settingsSchema, elementKey) => {
    // console.log('***************************************************************')
    // console.log(`MAKE_SETTINGS_PAGE SCHEMA: ${JSON.stringify(settingsSchema)} FOR KEY: %c${elementKey}`, "color:blue")

    // заглушка на случай когда схема стиля пустая (компонент в разработке - еще не принято решение какие аттрибуты конфигурируются)
    if (Array.isArray(settingsSchema) && settingsSchema.length === 0) {
      const state = observable({})
      observableStates.push({ key: elementKey, state })
      // будет отображена пустая страница
      return () => <div />
    }

    // TODO:  если комбинированный стиль, то это учитывается ? - разобраться с этим!!!

    //${elementKey}.0 не учитывает факта что там может быть не только объект но и именованные стили !!!

    // получаем стиль для подэлемента (self, title, etc...)

    const elementStyle = lensGet(elementKey, stylesObject)
    // тут имеем или массив (например для self [{"width":200}]) - тогда это простой стиль
    // или объект с полями массивами (например для listItem {"self":["p10",{"backgroundColor":"#ff00ff"}],"title":[{"color":"#ffffff"}]}) - тогда это сложный стиль - ключи объекта - имена подэлементов компонента

    // console.log(`ELEMENT STYLE :`, JSON.stringify(elementStyle))

    // нужно elementStyle вычистить от именованных стилей

    // если сложный стиль то в схеме формы будут сложные ключи

    // делаем модель стиля - стиль-объект, наполненныей данными и заполненый дефолтными значениями. Все именованные стили из источника данных будут проигнорированы
    const styleModel = makeStyleModel(settingsSchema, elementStyle)

    // console.log(`STYLE MODEL ${JSON.stringify(styleModel)} FOR KEY: %c${elementKey}`, "color:blue")

    const state = observable(styleModel)
    observableStates.push({ key: elementKey, state })

    const Form = makeForm(settingsSchema, propertiesDidChange)

    const hasNamedStyles = !!settingsSchema.find(item => item.type === TYPE.NAMEDSTYLESELECT)

    let namedStylesState
    let initialNamedStyles = []

    if (hasNamedStyles) {
      initialNamedStyles = filterInitialNamedStyles(globalNamedStyles)(elementStyle)
      // console.log(`%cINITIAL NAMED STYLES:%c ${JSON.stringify(initialNamedStyles)} for key: %c${elementKey}`, "color: green", "color: black", "color: blue")

      namedStylesState = observable(initialNamedStyles)
      observableStates.push({ key: elementKey, state: namedStylesState })
    }

    return () =>
      hasNamedStyles ? (
        <div>
          <MultiSelect
            items={globalNamedStyles}
            initialItems={initialNamedStyles}
            placeholderText="Select named style.."
            noResultText="No named styles."
            onSelectChange={onNamedStylesSelectChange(namedStylesState, propertiesDidChange)}
          />
          <div style={{ padding: 8 }}>
            <Form state={state} />
          </div>
        </div>
      ) : (
        <div style={{ padding: 8 }}>
          <Form state={state} />
        </div>
      )
  }

  /**
   * Создает страницу с кнопками перехода на категорию стиля и элементом выбора именованного стиля
   * @param {*} pageSchema
   * @param {*} elementKey
   * @returns
   */
  const makeCategoriesPage = (pageSchema, elementKey) => {
    // console.log('###############################################################')
    // console.log(`MAKE_CATEGORIES_PAGE SCHEMA: ${JSON.stringify(pageSchema)} FOR KEY: %c${elementKey}`, "color:magenta")

    const children = pageSchema
      .filter(item => item.type !== TYPE.NAMEDSTYLESELECT)
      .map((pageSchemaItem, i) => {
        // необходимо выполнить рекурсивное создание всех страниц чтобы зарегистрировались все срезы хранилищ
        // иначе будет неполная сериализация
        const { styleKey, title, subitems, schemes } = pageSchemaItem

        let subpage

        if (subitems) {
          subpage = makeCategoriesPage(subitems, styleKey || elementKey)
        } else if (schemes) {
          subpage = makeSettingsPage(schemes, styleKey || elementKey)
        } else {
          throw new Error("Invalid scheme - neither 'subitems' nor 'schemes' defined")
        }

        // частичная реализация, в месте применения будет дополнена аргументами
        return (openPanel, props) => (
          <Button
            minimal
            fill
            alignText="left"
            rightIcon="chevron-right"
            onClick={() => openPanel({ component: subpage, props, title })}
            text={title}
            key={uuidv4()} // так проще сформировать ключ - других данных недостаточно
          />
        )
      })

    const hasNamedStyles = !!pageSchema.find(item => item.type === TYPE.NAMEDSTYLESELECT)

    let initialNamedStyles = []
    let namedStylesState

    if (hasNamedStyles) {
      if (elementKey) {
        const last = R.last(styles)
        if (isObject(last)) {
          initialNamedStyles = filterInitialNamedStyles(globalNamedStyles)(lensGet(elementKey, last))
        }
      } else {
        initialNamedStyles = filterInitialNamedStyles(globalNamedStyles)(styles)
      }

      namedStylesState = observable(initialNamedStyles)
      observableStates.push({ key: elementKey, state: namedStylesState })
    }

    // возвращаем готовый компонент страницы
    return ({ openPanel, ...props }) => (
      <div>
        {hasNamedStyles && (
          <MultiSelect
            items={globalNamedStyles}
            initialItems={initialNamedStyles}
            placeholderText="Select named style.."
            noResultText="No named styles."
            onSelectChange={onNamedStylesSelectChange(namedStylesState, propertiesDidChange)}
          />
        )}
        {children.map(f => f(openPanel, props))}
      </div>
    )
  }

  // тут запускается рекурсивное построение страниц настройки стилей
  // в процессе котрого формируется список наблюдаемых срезов стиля - расщепленное на части состояние стиля компонента
  const RootPage = makeCategoriesPage(schema)

  // уведомляем о всем срезах состояния стиля
  collectObservableStates(observableStates)

  return () => <PanelStack className="styles-stack" initialPanel={{ component: RootPage, title: 'Styles' }} />
}
