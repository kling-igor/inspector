import React from 'react'
import { Checkbox } from "@blueprintjs/core";

export default label => ({ value, onChange }) => (
  <Checkbox
    className="bp3-align-right"
    label={label}
    checked={value}
    onChange={onChange}
  />
)