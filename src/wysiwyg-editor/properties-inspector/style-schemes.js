const margins = {
  title: 'Margins',
  schemes: [
    { key: 'margin', type: 'string', label: 'Margin', placeholder: 'undefined' },
    { key: 'marginTop', type: 'string', label: 'Margin Top', placeholder: 'undefined' },
    { key: 'marginBottom', type: 'string', label: 'Margin Bottom', placeholder: 'undefined' },
    { key: 'marginLeft', type: 'string', label: 'Margin Left', placeholder: 'undefined' },
    { key: 'marginRight', type: 'string', label: 'Margin Right', placeholder: 'undefined' }
  ]
}

const paddings = {
  title: 'Paddings',
  schemes: [
    { key: 'padding', type: 'string', label: 'Padding', placeholder: 'undefined' },
    { key: 'paddingTop', type: 'string', label: 'Padding Top', placeholder: 'undefined' },
    { key: 'paddingBottom', type: 'string', label: 'Padding Bottom', placeholder: 'undefined' },
    { key: 'paddingLeft', type: 'string', label: 'Padding Left', placeholder: 'undefined' },
    { key: 'paddingRight', type: 'string', label: 'Padding Right', placeholder: 'undefined' }
  ]
}

const font = {
  title: 'Font Settings',
  schemes: [{ key: 'fontSize', type: 'string', label: 'Font Size', placeholder: 'Use "px", "em", "rem" units' }]
}

const dimensions = {
  title: 'Dimensions',
  schemes: [
    { key: 'width', type: 'string', label: 'Width', placeholder: 'undefined' },
    { key: 'height', type: 'string', label: 'Height', placeholder: 'undefined' }
  ]
}

const colors = {
  title: 'Color & Background',
  schemes: [
    { key: 'color', type: 'rgba', label: 'Color' },
    { key: 'backgroundColor', type: 'rgb', label: 'Background Color' }
  ]
}

export default {
  dimensions,
  margins,
  paddings,
  font,
  colors
}
