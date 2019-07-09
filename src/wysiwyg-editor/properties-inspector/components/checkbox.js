import React from 'react'
import { Checkbox } from '@blueprintjs/core'

export default (label, disabled = false) => ({ value, onChange }) => (
  <Checkbox
    className="bp3-align-right bp3-text-small"
    label={label}
    checked={value}
    onChange={onChange}
    disabled={disabled}
  />
)
