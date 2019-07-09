import React from 'react'
import { FormGroup, InputGroup } from '@blueprintjs/core'

export default (key, label, placeholder, required, disabled = false) => ({ value, onChange }) => (
  <FormGroup
    // inline
    className="bp3-text-small"
    disabled={disabled}
    label={label}
    labelFor={`${key}-text-input`}
    labelInfo={required && '(required)'}
  >
    <InputGroup
      // name={key}
      id={`${key}-text-input`}
      disabled={disabled}
      placeholder={placeholder}
      onChange={onChange}
      small
      value={value} // controlled
    />
  </FormGroup>
)
