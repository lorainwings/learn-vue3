export const extend = Object.assign

export const isObject = (val) => val !== null && typeof val === 'object'

export const hasChanged = (n, o) => !Object.is(n, o)

export function hasOwn(target: any, key: any) {
  return Object.prototype.hasOwnProperty.call(target, key)
}
