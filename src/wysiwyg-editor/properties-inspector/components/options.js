import React from 'react'
import { Label, HTMLSelect } from '@blueprintjs/core'
export default (label, options, disabled) => ({ value, onChange }) => (
  <Label className={`bp3-text-small ${disabled ? 'bp3-disabled' : 0}`}>
    {label}
    <HTMLSelect options={options} onChange={onChange} value={value} disabled={disabled} />
  </Label>
)
