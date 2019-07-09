import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { Collapse } from '@blueprintjs/core'

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
  margin-left: 0px;
  margin-right: 4px;
`

const TitleStyle = styled.span`
  -webkit-app-region: no-drag;
  -webkit-touch-callout: none;
  user-select: none;
`

export const useCollapsible = (title, Component, expanded = true) =>
  class extends PureComponent {
    state = {
      isOpen: expanded
    }

    toggle = () => {
      this.setState(({ isOpen }) => ({ isOpen: !isOpen }))
    }

    render() {
      const buttonImage = this.state.isOpen ? './assets/ui/expando_expanded.svg' : './assets/ui/expando_collapsed.svg'

      return (
        <>
          <HeaderStyle onClick={this.toggle}>
            <ButtonStyle draggable={false} src={buttonImage} width={16} height={16} />
            <TitleStyle>{title}</TitleStyle>
          </HeaderStyle>
          <Collapse isOpen={this.state.isOpen}>
            <Component />
          </Collapse>
        </>
      )
    }
  }
