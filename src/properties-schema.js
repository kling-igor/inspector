const idSchema = {
  key: 'id',
  label: 'ID',
  type: 'string',
  placeholder: 'Input unique Id'
}

const entryPointSchema = {
  key: 'entryPoint',
  label: 'Entry point',
  type: 'boolean',
  default: false
}

const publicSchema = {
  key: 'public',
  label: 'Public',
  type: 'boolean',
  default: false
}

const visibilitySchema = {
  key: 'visibility',
  label: 'Visible',
  type: 'boolean',
  default: true
}

const scrollableSchema = {
  key: 'scrollable',
  label: 'Scrollable',
  type: 'boolean',
  default: false
}

const orientationSchema = {
  key: 'orientation',
  label: 'Orientation',
  type: 'options',
  options: [
    {
      value: 'vertical'
    },
    {
      value: 'horizontal'
    }
  ],
  default: 'vertical'
}

const alignSchema = {
  key: 'align',
  label: 'Align Items',
  type: 'options',
  // subtype: '9D',
  options: [
    {
      label: 'top left',
      value: 'left_top'
    },
    {
      label: 'top center',
      value: 'center_top'
    },
    {
      label: 'top right',
      value: 'right_top'
    },

    {
      label: 'middle left',
      value: 'left_center'
    },
    {
      label: 'middle center',
      value: 'center'
    },
    {
      label: 'middle right',
      value: 'right_center'
    },

    {
      label: 'bottom left',
      value: 'left_bottom'
    },
    {
      label: 'bottom center',
      value: 'center_bottom'
    },
    {
      label: 'bottom right',
      value: 'right_bottom'
    }
  ],
  default: 'left_top'
}

export default [
  idSchema,
  publicSchema,
  entryPointSchema,
  visibilitySchema,
  scrollableSchema,
  { type: 'divider' },
  orientationSchema,
  { type: 'divider' },
  alignSchema
]
