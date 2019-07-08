import React from 'react'
import ButtonsWidget from './buttons-widget'


const orienationItems = [
  {
    tooltip: 'vertical',
    icon: 'arrows-vertical',
    ownValue: 'vertical'
  },
  {
    tooltip: 'horizontal',
    icon: 'arrows-horizontal',
    ownValue: 'horizontal'
  }
]

export default (key, label) => {
  const OrientationWidget = ButtonsWidget(label, orienationItems)
  return ({ value, onClick }) => <OrientationWidget stateKey={key} value={value} onClick={onClick} />
}
