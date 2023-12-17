export * from './toDisplayString'
export * from './shapeFlags'

export const EMPTY_PROPS = {}

export const extend = Object.assign

export const isObject = (val) => val !== null && typeof val === 'object'

export const hasChanged = (n, o) => !Object.is(n, o)

export function hasOwn(target: any, key: any) {
  return Object.prototype.hasOwnProperty.call(target, key)
}

// TPP
// 先写一个特定的行为, 再重构成通用的行为
// add -> Add
export const capitalize = (str: string) => {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, w) => {
    return w ? `${w.toUpperCase()}` : ''
  })
}

export const toHandlerKey = (str: string) => {
  return str ? `on${capitalize(str)}` : ''
}

export const isString = (val: unknown): val is string => typeof val === 'string'
