import { objectAssignDeepInto } from './deepmerge'

export default class StyleService {
  constructor(defaultTheme) {
    this.defaultTheme = defaultTheme
    this.appTheme = defaultTheme
    this.styleCache = {}
  }

  clearCache() {
    this.styleCache = {}
  }

  putStyles(styles) {
    styles.forEach(style => {
      this.styleCache[style.name || style.id] = style.value
    })
  }

  getStyle(id) {
    const style = this.styleCache[id]
    if (!style) {
      throw new Error(`Style ${id} not in memory cache`)
    }
    return style
  }

  fetchComponentStyles(object) {
    return Object.assign({}, ...Object.keys(object).map(key => ({ [key]: this.parseComponent(object[key]) })))
  }

  fetchElementStyles(object) {
    if (typeof object !== 'object') {
      throw new Error(`Invalid style ${JSON.stringify(object, null, 2)}`)
    }
    return Object.assign({}, ...Object.keys(object).map(key => ({ [key]: this.parseElement(object[key]) })))
  }

  setTheme(id) {
    this.appTheme = this.fetchComponentStyles(objectAssignDeepInto(this.defaultTheme, this.parseTheme(id)))
  }

  getDefaultStyle(componentType) {
    return this.appTheme[componentType]
  }

  parseTheme(themeId) {
    return this.fetchComponentStyles(this.getStyle(themeId))
  }

  parseComponent(component) {
    if (typeof component === 'string') {
      return this.parseComponent(this.getStyle(component))
    } else if (Array.isArray(component)) {
      return objectAssignDeepInto(...component.map(styleItem => this.parseComponent(styleItem)))
    }
    return this.fetchElementStyles(component)
  }

  parseElement(element) {
    if (Array.isArray(element)) {
      return [Object.assign({}, ...element.map(item => (typeof item === 'string' ? this.getStyle(item) : item)))]
    }
    return this.parseComponent(element)
  }

  mergeStyles(componentType, styles) {
    return styles
      ? this.fetchElementStyles(objectAssignDeepInto(this.getDefaultStyle(componentType), this.parseComponent(styles)))
      : this.getDefaultStyle(componentType)
  }
}
