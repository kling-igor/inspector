import React, { Fragment } from 'react'
import styled from 'styled-components'

import { GlobalStyle } from './style'

const CentralWidget = styled.div`
  width: 100%;
  height: 100%;
  background-color: yellow;
`

const TabBarRootStyle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
  width: 100%;
`

const TabBarStyle = styled.div`
  width: 100%;
  height: 32px;
  background-color: red;
`

const withTabBar = Component => props => {
  return (
    <TabBarRootStyle>
      <TabBarStyle />
      <Component />
    </TabBarRootStyle>
  )
}

const TabBarWrapped = withTabBar(CentralWidget)

const ActivityBarRootStyle = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
  width: 100%;
`

const ActivityBarStyle = styled.div`
  width: 64px;
  height: 100%;
  background-color: blue;
`

const withActivityBar = Component => props => {
  return (
    <ActivityBarRootStyle>
      <ActivityBarStyle />
      <Component />
    </ActivityBarRootStyle>
  )
}

const ActivityBarWrapped = withActivityBar(TabBarWrapped)

const StatusbarRootStyle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
  width: 100%;
`

const StatusBarStyle = styled.div`
  width: 100%;
  height: 24px;
  background-color: green;
`

const withStatusBar = Component => props => {
  return (
    <StatusbarRootStyle>
      <Component />
      <StatusBarStyle />
    </StatusbarRootStyle>
  )
}

const StatusBarWrapped = withStatusBar(ActivityBarWrapped)

export default class App extends React.Component {
  render() {
    return (
      <>
        <GlobalStyle />
        <StatusBarWrapped />
      </>
    )
  }
}
