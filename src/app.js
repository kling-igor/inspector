import React, { PureComponent } from 'react'

import styled, { createGlobalStyle } from 'styled-components'

import { Scrollbars } from 'react-custom-scrollbars'

import { GlobalStyle } from './style'

import { PropertiesInspector } from './wysiwyg-editor/properties-inspector'

import { ViewFile } from './viewfile'

import StyleService from './utils/StyleService'

import { defaultTheme } from './uikit-default-theme'

import propertiesSchema from './properties-schema'
import stylesSchema from './styles-schema'

const namedStyles = [
  { name: 'p10', value: { padding: 10 } },
  { name: 'selfMargin10', value: { self: [{ margin: 10 }] } },
  { name: 'selfBlueBack', value: { self: [{ backgroundColor: 'blue' }] } }
]

const styleService = new StyleService(defaultTheme)

const cleanPath = '/views/Example.json'

// это для представления содержимого файла - будет сериализовано
const viewState = {
  name: 'Example',
  type: 'view',
  public: true,
  entryPoint: true,
  align: 'center',
  orientation: 'horizontal',
  styles: [
    {
      self: [
        {
          width: '100%',
          height: '100%',
          backgroundColor: 'yellow'
        }
      ]
    }
  ]
}

// загруженный файл
const content = JSON.stringify(viewState)

// хендлер выбранного файла
const file = new ViewFile(cleanPath, content, styleService, namedStyles)

const rootStyle = { width: 300, height: '100%' }

// TODO: было бы не плохо определять что выделен корнeвой View и для него не давать менять ID и только для него в схеме view показывать Public и EntryPoint (это просто потому что нет понятия Screen для элементов)
// TODO: до вызова PropertiesInspector определяем  тип и вложенность и если это View то в копии схемы делаем  id disabled и доабаляемя после id public и entryPoint

export default class App extends PureComponent {
  render() {
    return (
      <>
        <GlobalStyle />
        <Scrollbars style={rootStyle} thumbMinSize={30} autoHide autoHideTimeout={1000} autoHideDuration={200}>
          <PropertiesInspector
            viewState={file.selectedViewState}
            schema={propertiesSchema}
            stylesSchema={stylesSchema}
            namedStyles={namedStyles}
            coollectPropertiesStates={file.coollectPropertiesStates}
            propertiesDidChange={file.propertiesDidChange}
          />
        </Scrollbars>
      </>
    )
  }
}
