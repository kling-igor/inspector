import React, { PureComponent } from 'react'

import styled, { createGlobalStyle } from 'styled-components'

import { Scrollbars } from 'react-custom-scrollbars'

import { GlobalStyle } from './style'

import { Collapse } from '@blueprintjs/core'

import { PropertiesInspector } from './wysiwyg-editor/properties-inspector'

import { ViewFile } from './viewfile'

import StyleService from './utils/StyleService'

import { defaultTheme } from './uikit-default-theme'

import propertiesSchema from './properties-schema'
import stylesSchema from './styles-schema'

const HeaderStyle = styled.div`
  height: 24px;
  width: 100%;
  cursor: pointer;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  /* background: magenta;
  color: white; */
`

const ButtonStyle = styled.img`
  -webkit-app-region: no-drag;
  -webkit-touch-callout: none;
  user-select: none;

  padding: 0;
  z-index: 2;
  /* position: absolute; */
  cursor: pointer;
  margin-left: 4px;
  margin-right: 4px;
`

const TitleStyle = styled.span`
  -webkit-app-region: no-drag;
  -webkit-touch-callout: none;
  user-select: none;
`

const useCollapsible = (title, Component, expanded = true) =>
  class extends PureComponent {
    state = {
      isOpen: expanded
    }

    toggle = () => {
      this.setState(({ isOpen }) => ({ isOpen: !isOpen }))
    }

    render() {
      const exapndButtonImage = this.state.isOpen
        ? './assets/ui/expando_expanded.svg'
        : './assets/ui/expando_collapsed.svg'

      return (
        <>
          <HeaderStyle onClick={this.toggle}>
            <ButtonStyle draggable={false} src={exapndButtonImage} width={16} height={16} />
            <TitleStyle>{title}</TitleStyle>
          </HeaderStyle>
          <Collapse isOpen={this.state.isOpen}>
            <Component />
          </Collapse>
        </>
      )
    }
  }

// const SelfPane = useCollapsible('self', () => (
//   <div>
//     self properties here
//     <br />
//     self properties here
//     <br />
//     self properties here
//     <br />
//     self properties here
//     <br />
//     self properties here
//     <br />
//     self properties here
//     <br />
//     self properties here
//     <br />
//     self properties here
//     <br />
//     self properties here
//     <br />
//     self properties here
//     <br />
//     self properties here
//   </div>
// ))
// const TitlePane = useCollapsible('title', () => (
//   <div>
//     title properties here
//     <br />
//     title properties here
//     <br />
//     title properties here
//     <br />
//     title properties here
//     <br />
//     title properties here
//     <br />
//     title properties here
//     <br />
//     title properties here
//     <br />
//     title properties here
//     <br />
//     title properties here
//     <br />
//     title properties here
//     <br />
//     title properties here
//   </div>
// ))

const namedStyles = [
  { name: 'p10', value: { padding: 10 } },
  { name: 'selfMargin10', value: { self: [{ margin: 10 }] } },
  { name: 'selfBlueBack', value: { self: [{ backgroundColor: 'blue' }] } }
]

// ОНИ ОПРЕДЕЛЕНЫ В VIEWFILE!!!
// const coollectPropertiesStates = (properties, styles) => {
//   console.log('coollectPropertiesStates', properties, styles)
// }
// const propertiesDidChange = () => {
//   console.log('propertiesDidChange')
// }

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

// загруженный файо
const content = JSON.stringify(viewState)

// хендлер выбранного файла
const file = new ViewFile(cleanPath, content, styleService, namedStyles)

export default class App extends PureComponent {
  render() {
    return (
      <>
        <GlobalStyle />
        <Scrollbars
          style={{ width: 300, height: '100%' }}
          thumbMinSize={30}
          autoHide
          autoHideTimeout={1000}
          autoHideDuration={200}
        >
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
