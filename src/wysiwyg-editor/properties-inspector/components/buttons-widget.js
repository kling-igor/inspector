import React from 'react'

import { ButtonGroup, Label, Tooltip, Button, Position } from "@blueprintjs/core";

/**
 * Кнопка в группе со всплывающей подсказкой
 * @param {String} tooltip  - текст всплывающе подсказки
 * @param {String} icon - имя иконки 
 * @param {Any} ownValue - собственное значение, генерируемое кнопкой
 * @param {Any} value - текущее значение для все группы 
 * @param {Function} onClick - обработчик нажатия
 */
const GroupButton = ({ tooltip, icon, ownValue, value, onClick }) => {
  return (
    <Tooltip content={tooltip} position={Position.RIGHT} hoverOpenDelay={500}>
      <Button icon={icon} active={value === ownValue} onClick={() => onClick(ownValue)} />
    </Tooltip>
  )
}

const ButtonsWidget = (label, items, cols) => ({ value = 'vertical', onClick }) => {
  const itemsInRow = cols == null ? items.length : Math.min(items.length, cols)

  const rows = Math.ceil(items.length / itemsInRow)

  const rowSequence = Array.from(new Array(rows), (_, index) => index);

  return (
    <div>
      <Label>{label}</Label>
      {rowSequence.map(i => {
        const rowItems = items.slice(i * itemsInRow, (i + 1) * itemsInRow)
        return (
          <div key={i}>
            <ButtonGroup minimal={true}>
              {rowItems.map(({ tooltip, icon, ownValue }, j) => <GroupButton key={i * itemsInRow + j} tooltip={tooltip} icon={icon} ownValue={ownValue} value={value} onClick={onClick} />)}
            </ButtonGroup>
          </div>
        )
      })}
    </div>
  )
}

export default ButtonsWidget
