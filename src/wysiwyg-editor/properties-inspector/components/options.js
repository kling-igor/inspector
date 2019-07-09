import React from 'react'
import { Label, HTMLSelect } from '@blueprintjs/core'
export default (label, options) => ({ value, onChange }) => (
  <Label className="bp3-text-small">
    {label}
    <HTMLSelect options={options} onChange={onChange} value={value} />
  </Label>
)
