import React from 'react'

import ButtonsWidget from './buttons-widget'

const alignItems3D = [
  {
    tooltip: 'left',
    icon: 'align-left',
    ownValue: 'left'
  },
  {
    tooltip: 'center',
    icon: 'align-center',
    ownValue: 'center'
  },
  {
    tooltip: 'right',
    icon: 'align-right',
    ownValue: 'right'
  }
]

const alignItems9D = [
  {
    tooltip: 'top left',
    icon: 'align-left',
    ownValue: 'left_top'
  },
  {
    tooltip: 'top center',
    icon: 'align-center',
    ownValue: 'center_top'
  },
  {
    tooltip: 'top right',
    icon: 'align-right',
    ownValue: 'right_top'
  },

  {
    tooltip: 'middle left',
    icon: 'align-left',
    ownValue: 'left_center'
  },
  {
    tooltip: 'middle center',
    icon: 'align-center',
    ownValue: 'center'
  },
  {
    tooltip: 'middle right',
    icon: 'align-right',
    ownValue: 'right_center'
  },

  {
    tooltip: 'bottom left',
    icon: 'align-left',
    ownValue: 'left_bottom'
  },
  {
    tooltip: 'bottom center',
    icon: 'align-center',
    ownValue: 'center_bottom'
  },
  {
    tooltip: 'bottom right',
    icon: 'align-right',
    ownValue: 'right_bottom'
  },
]

export const AlignWidget3D = (key, label) => {
  const Component3D = ButtonsWidget(label, alignItems3D)
  return ({ value, onClick }) => <Component3D stateKey={key} value={value} onClick={onClick} />
}

export const AlignWidget9D = (key, label) => {
  const Component9D = ButtonsWidget(label, alignItems9D, 3)
  return ({ value, onClick }) => <Component9D stateKey={key} value={value} onClick={onClick} />
}