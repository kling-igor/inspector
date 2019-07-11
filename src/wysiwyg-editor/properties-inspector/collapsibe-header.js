import React, { useState } from 'react'
import styled from 'styled-components'
import { Collapse } from '@blueprintjs/core'

const HeaderStyle = styled.div`
  height: 24px;
  width: 100%;
  cursor: pointer;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`

const ButtonStyle = styled.img`
  -webkit-app-region: no-drag;
  -webkit-touch-callout: none;
  user-select: none;

  padding: 0;
  z-index: 2;
  /* position: absolute; */
  cursor: pointer;
  margin-left: -4px;
  margin-right: 4px;
`

const TitleStyle = styled.span`
  -webkit-app-region: no-drag;
  -webkit-touch-callout: none;
  user-select: none;
`

const HeaderWithExpandoArrow = ({ title, toggle, expanded }) => {
  const buttonImage = expanded ? './assets/ui/expando_expanded.svg' : './assets/ui/expando_collapsed.svg'
  return (
    <HeaderStyle onClick={toggle}>
      <ButtonStyle draggable={false} src={buttonImage} width={16} height={16} />
      <TitleStyle className="bp3-text-muted">{title}</TitleStyle>
    </HeaderStyle>
  )
}

export const useCollapsible = (title, Component, expandedByDefault = true, Header = HeaderWithExpandoArrow) => () => {
  const [expanded, setExpanded] = useState(expandedByDefault)

  const toggle = () => {
    setExpanded(!expanded)
  }

  return (
    <>
      <Header title={title} toggle={toggle} expanded={expanded} />
      <Collapse isOpen={expanded} keepChildrenMounted>
        <Component />
      </Collapse>
    </>
  )
}
