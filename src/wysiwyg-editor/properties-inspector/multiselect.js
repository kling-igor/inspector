import React, { Component } from 'react'
import { Button, MenuItem } from '@blueprintjs/core'
import { MultiSelect } from '@blueprintjs/select'

export default class extends Component {
  state = {
    items: []
  }

  constructor(props) {
    super(props)
    this.state = { items: props.initialItems || [] }
  }

  renderItem = (item, { modifiers, handleClick }) => {
    if (!modifiers.matchesPredicate) {
      return null
    }

    return (
      <MenuItem
        active={modifiers.active}
        icon={this.isItemSelected(item) ? 'tick' : 'blank'}
        key={item} // <-- !!!!!!!!
        // label={style.name}
        onClick={handleClick}
        text={`${item}`} // <-- !!!!!!!!
        shouldDismissPopover={false}
      />
    )
  }

  handleClear = () => {
    this.setState({ items: [] })
  }

  selectItem = item => {
    const index = this.state.items.findIndex(_item => _item === item)
    if (index !== -1) return
    this.setState({ items: [...this.state.items, item] }, () => {
      if (this.props.onSelectChange) this.props.onSelectChange(this.state.items)
    })
  }

  deselectItem = index => {
    this.setState({ items: this.state.items.filter((_, i) => i !== index) }, () => {
      if (this.props.onSelectChange) this.props.onSelectChange(this.state.items)
    })
  }

  getSelectedItemIndex = item => {
    return this.state.items.indexOf(item)
  }

  isItemSelected = item => {
    return this.getSelectedItemIndex(item) !== -1
  }

  handleItemSelect = item => {
    if (this.isItemSelected(item)) {
      this.deselectItem(this.getSelectedItemIndex(item))
    } else {
      this.selectItem(item)
    }
  }

  filterItem = (query, item) => {
    return `${item}`.indexOf(query.toLowerCase()) >= 0
  }

  renderTag = item => item

  handleTagRemove = (_tag, index) => {
    this.deselectItem(index)
  }

  render() {
    const { items } = this.state

    const clearButton = items.length > 0 ? <Button icon="cross" minimal onClick={this.handleClear} /> : null

    return (
      <MultiSelect
        fill
        itemPredicate={this.filterItem}
        items={this.props.items}
        itemRenderer={this.renderItem}
        noResults={<MenuItem disabled={true} text={this.props.noResultText} />}
        onItemSelect={this.handleItemSelect}
        popoverProps={{ minimal: true }}
        tagRenderer={this.renderTag}
        tagInputProps={{ tagProps: { minimal: true }, onRemove: this.handleTagRemove, rightElement: clearButton }}
        selectedItems={this.state.items}
        placeholder={this.props.placeholderText}
      />
    )
  }
}
