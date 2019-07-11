import chai, { expect } from 'chai'
import deepEql from 'deep-eql'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
// import * as R from 'ramda'

chai.use(sinonChai)
chai.use(chaiAsPromised)

const styleCache = {
  p10: { padding: 10 },
  selfMargin10: { self: [{ margin: 10 }] },
  selfBlueBack: { self: [{ backgroundColor: 'blue' }] }
}

const namedStyles = Object.keys(styleCache)

const viewStyleSchema = [
  'namedstyleselect',
  {
    styleKey: 'self',
    title: 'self',
    subitems: ['namedstyleselect', 'dimensions', 'colors', 'font', 'margins', 'paddings']
  }
]

const schemes = {
  view: viewStyleSchema
}

const viewState = {
  name: 'Example',
  type: 'view',
  public: true,
  entryPoint: true,
  align: 'center',
  orientation: 'horizontal',
  styles: [
    'p10',
    {
      self: [
        'p10',
        {
          width: '100%',
          height: '100%',
          backgroundColor: 'yellow'
        }
      ]
    }
  ]
}

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

// получение ключе элементов стиля в описании схемы
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
const stripNamedStyles = (style, schema) => {
  return style.reduce((acc, item) => {
    if (typeof item === 'string') {
      if (!namedStyles.includes(item)) {
        return acc
      }

      if (schema) {
        const schemaKeys = getStyleKeys(schema)
        const namedStyleKeys = Object.keys(styleCache[item])

        // если в namedStyleKeys есть хоть один ключ которого нет в schemaKeys, то отбрасываем этот стиль
        if (!isStyleMatchesSchema(namedStyleKeys, schemaKeys)) {
          return acc
        }
      } else {
        // тут если проверка именованного стиля внутри подэлемента
        // нужна какая-то эвристика чтобы понять что именованный стиль имеет отношение непосредственно к элементу а не к сложному компоненту в целом
        // можно проанализировать наличие ключей, свойственных схеме

        const namedStyleKeys = Object.keys(styleCache[item])

        // если в namedStyleKeys есть хоть один ключ который бывает в схемах, то отбрасываем этот стиль т.к. это сложный стиль и он не должен был бы быть на этом уровне
        if (isStyleMatchesSchema(namedStyleKeys, elementNames)) {
          return acc
        }
      }
    } else {
      // наличие схемы как признак того на каком уровне вложенности мы находимся
      if (schema) {
        console.log('STRIP SUBELEMENTS STYLES', item)
        // иначе это объект с возможно множеством ключей - каждый ключ это массив который также нужно очистить
        for (const [elementKey, elementStyle] of Object.entries(item)) {
          item[elementKey] = stripNamedStyles(elementStyle) // нужно не углубляться дальше конкретных стилей подэлементов стиля !!!
        }

        console.log('STRIPPED:', item)
      }
    }

    return [...acc, item]
  }, [])
}

// ГЛОБАЛЬНАЯ ЦЕЛЬ!!!
// имеем стейт нужного типа
// для всех его элементов стиля нужно формировать из глобальных именованных стилей только подходящие

const filter = (styleCache, schema) => {
  const filtered = []

  if (schema) {
    // имена подэлементов стиля в соответствие со схемой стиля конкретного типа элемента
    const styleSchemaKeys = getStyleKeys(schema)
    for (const [name, style] of Object.entries(styleCache)) {
      if (isStyleMatchesSchema(Object.keys(style), styleSchemaKeys)) {
        filtered.push(name)
      }
    }
  } else {
    // если схема не указана, то нужно проверить на НЕСООТВЕТСТВИЕ стилям подэлементов
    for (const [name, style] of Object.entries(styleCache)) {
      if (!isStyleMatchesSchema(Object.keys(style), elementNames)) {
        filtered.push(name)
      }
    }
  }

  return filtered
}

describe('strip named styles', () => {
  it('should strip style', () => {
    const style = ['p11']

    const stripped = stripNamedStyles(style)

    expect(stripped).to.deep.equal([])
  })

  it('should leave existent style', () => {
    const style = ['p10']

    const stripped = stripNamedStyles(style)

    expect(stripped).to.deep.equal(['p10'])
  })

  it('should strip inappropriate style', () => {
    const style = ['p10']

    const stripped = stripNamedStyles(style, schemes['view'])

    expect(stripped).to.deep.equal([])
  })

  it('should leave only appropriate styles', () => {
    const style = ['p10', 'selfMargin10', 'selfBlueBack']

    const stripped = stripNamedStyles(style, schemes['view'])

    expect(stripped).to.deep.equal(['selfMargin10', 'selfBlueBack'])
  })

  it('should strip style elements named styles', () => {
    const style = [
      {
        self: [
          'selfMargin10',
          {
            margin: 10
          }
        ]
      }
    ]

    const stripped = stripNamedStyles(style, schemes['view'])

    expect(stripped).to.deep.equal([
      {
        self: [
          {
            margin: 10
          }
        ]
      }
    ])
  })
})

describe('style schema', () => {
  it('should get schema keys', () => {
    const viewStyleSchema = [
      'namedstyleselect',
      {
        styleKey: 'self',
        title: 'self',
        subitems: ['namedstyleselect', 'dimensions', 'colors', 'margins', 'paddings']
      },
      {
        styleKey: 'label',
        title: 'label',
        subitems: ['namedstyleselect', 'font']
      }
    ]

    const styleElementsKeys = getStyleKeys(viewStyleSchema)
    expect(styleElementsKeys).to.deep.equal(['self', 'label'])
  })

  it('should accept style with some matching keys to schema', () => {
    const schemaKeys = ['self', 'label']
    const styleKeys = ['self']

    expect(isStyleMatchesSchema(styleKeys, schemaKeys)).to.be.true
  })

  it('should accept style with all matching keys to schema', () => {
    const schemaKeys = ['self', 'label']
    const styleKeys = ['self', 'label']

    expect(isStyleMatchesSchema(styleKeys, schemaKeys)).to.be.true
  })

  it('should declean style with some unmatching keys to schema', () => {
    const schemaKeys = ['self', 'label']
    const styleKeys = ['self', 'header']

    expect(isStyleMatchesSchema(styleKeys, schemaKeys)).to.be.false
  })

  it('should declean style with all unmatching keys to schema', () => {
    const schemaKeys = ['self', 'label']
    const styleKeys = ['margin']

    expect(isStyleMatchesSchema(styleKeys, schemaKeys)).to.be.false
  })
})

describe('filter global named styles', () => {
  it.only('should leave only styles matching to view schema', () => {
    const styleCache = {
      p10: { padding: 10 },
      selfMargin10: { self: [{ margin: 10 }] },
      selfBlueBack: { self: [{ backgroundColor: 'blue' }], title: [{ color: 'black' }] }
    }

    const viewStyleSchema = [
      'namedstyleselect',
      {
        styleKey: 'self',
        title: 'self',
        subitems: ['namedstyleselect', 'dimensions', 'colors', 'margins', 'paddings']
      },
      {
        styleKey: 'label',
        title: 'label',
        subitems: ['namedstyleselect', 'font']
      }
    ]

    const filtered = filter(styleCache, viewStyleSchema)

    expect(filtered).to.deep.equal(['selfMargin10'])
  })

  it('should leave only primitive styles', () => {
    const styleCache = {
      p10: { padding: 10 },
      selfMargin10: { self: [{ margin: 10 }] },
      selfBlueBack: { self: [{ backgroundColor: 'blue' }] }
    }

    const filtered = filter(styleCache)

    expect(filtered).to.deep.equal(['p10'])
  })
})
