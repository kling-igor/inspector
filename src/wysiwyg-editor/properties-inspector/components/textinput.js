import React from 'react'
import { FormGroup, InputGroup } from "@blueprintjs/core"

export default (key, label, placeholder, required) => ({ value, onChange }) => (
  <FormGroup
    // inline
    label={label}
    labelFor={`${key}-text-input`}
    labelInfo={required && "(required)"}
  >
    <InputGroup
      // name={key}
      id={`${key}-text-input`}
      placeholder={placeholder}
      onChange={onChange}
      small
      value={value} // controlled
    />
  </FormGroup>
)