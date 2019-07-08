import React from 'react'

import { widgets } from './uiwrappers'

const MenuScreen = {
  id: 'MenuScreen',
  type: 'view',
  orientation: 'vertical',
  align: 'left_top',
  styles: [
    {
      self: [
        {
          width: 300,
          height: '100%',
          backgroundColor: 'blue'
        }
      ]
    }
  ],
  mergedStyle: {
    self: [
      {
        width: 300,
        height: '100%',
        backgroundColor: 'blue'
      }
    ]
  },
  elements: [
    {
      id: 'myButton',
      type: 'button',
      title: 'Press Me',
      styles: [
        {
          self: [
            {
              width: 150,
              height: 40,
              backgroundColor: 'red'
            }
          ],
          label: [
            {
              color: 'white'
            }
          ]
        }
      ],
      mergedStyle: {
        self: [
          {
            width: 150,
            height: 40,
            backgroundColor: 'red'
          }
        ],
        label: [
          {
            color: 'white'
          }
        ]
      }
    }
  ]
}

const ContentScreen = {
  id: 'ContentScreen',
  type: 'view',
  orientation: 'vertical',
  align: 'left_top',
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
  ],
  mergedStyle: {
    self: [
      {
        width: '100%',
        height: '100%',
        backgroundColor: 'yellow'
      }
    ]
  },
  elements: [
    {
      type: 'fab',
      id: 'fab',
      icon: 'add',
      readonly: false,
      hasShadow: true,
      styles: [{ self: [{}], icon: [{}], disabled: [{}] }],
      mergedStyle: { self: [{}], icon: [{}], disabled: [{}] }
    }
  ]
}

// заглушка для viewStateCache !!!
const sceenCache = {
  MenuScreen,
  ContentScreen
}

const COMPONENTS_WITH_SPECIAL_ELEMENTS = ['appbar', 'tabs', 'bottomnavigation']

/**
 * синхронно рекурсивно строит UI на основе дерева состояния
 * @param {Object} viewState
 */
const buildViewTree = viewState => {
  const { type, displayType } = viewState

  let Component

  if (type === 'list' || type === 'chart') {
    Component = widgets[displayType]
  } else {
    Component = widgets[type]
  }

  if (!Component) {
    console.error('Unable to create Widget')
    return null
  }

  const { elements, ...restState } = viewState

  const children =
    elements && !COMPONENTS_WITH_SPECIAL_ELEMENTS.includes(type) && elements.map(element => buildViewTree(element))

  return (
    <Component key={viewState.id} viewState={restState}>
      {children}
    </Component>
  )
}

// это как бы загрузка данных
const loadScreen = async screenName => {
  // находим по screen нужное состояние (грузим из файла)

  return new Promise((resove, reject) => {
    const viewState = sceenCache[screenName]
    if (!viewState) {
      reject(new Error(`Unable to found view state for screem '${screenName}'`))
    } else {
      setTimeout(() => {
        resove(viewState)
      }, 500)
    }
  })
}

// TODO: переписать на React Hooks
class Screen extends React.PureComponent {
  state = { ui: null }

  componentDidMount() {
    loadScreen(this.props.screenName)
      .then(viewState => {
        const ui = buildViewTree(viewState)
        this.setState({ ui })
      })
      .catch(e => {
        console.log(e)
        // можно в ui устанавливать экран с ошибкой!!!
      })
  }

  render() {
    return this.state.ui
  }
}

const renderScreen = (screenName, parameters = null) => {
  if (screenName == null) throw new Error('Screen ID is undefined')

  return <Screen screenName={screenName} params={parameters} />

  // return <Screen id={id} params={params} parent={parent} screen={this.screens[id]} onUnmount={this.onUnmount} />
}

export default renderScreen
