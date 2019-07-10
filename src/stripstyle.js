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

// удаляем именованные стили которых нет в списке (остальные удаляем)
const stripNamedStyles = (style, schema) => {
  return style.reduce((acc, item) => {
    if (typeof item === 'string') {
      if (!namedStyles.includes(item)) {
        return acc
      }

      console.log('schema:', schema)

      // тут проверяем что именованный стиль подходит по схеме
      if (schema) {
        const schemaKeys = schema.reduce((acc, item) => {
          if (typeof item !== 'string') {
            return [...acc, item.styleKey]
          }

          return acc
        }, [])

        console.log('schema keys:', schemaKeys)

        const styleKeys = Object.keys(styleCache[item])

        console.log('style keys:', styleKeys)

        for (let i = 0; i < styleKeys.length; i += 1) {
          if (!schemaKeys.includes(styleKeys[i])) {
            console.log(`${styleKeys[i]} is not in schema`)
            return acc
          }
        }
      }
    }

    return [...acc, item]
  }, [])
}

const traverse = element => {
  const type = element.displayType || element.type

  const schema = schemes[type]

  element.styles = stripNamedStyles(element.styles, schema) // должны остаться стили которые содержат теги элементов из схемы (если хоть один тег отсутствующи в схеме - отбрасывать)
  element.styles.forEach(item => {
    if (typeof item !== 'string') {
      // TODO: для сложных стилей нужна дополнительная обработка !!!
      for (const [key, style] of Object.entries(item)) {
        item[key] = stripNamedStyles(style) // должны остаться только нетегированные стили
      }
    }
  })

  if (element.elements && element.elements.length > 0) {
    element.elements.forEach(child => traverse(child))
  }
}

traverse(viewState)

console.log(viewState)
