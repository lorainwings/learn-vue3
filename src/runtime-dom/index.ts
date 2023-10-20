import { createRenderer } from '../runtime-core'

function createElement(type) {
  return document.createElement(type)
}

function patchProp(el, key, prevPropVal, nextPropVal) {
  const isOn = (key: string) => /^on[A-Z]/g.test(key)
  if (isOn(key)) {
    const event = key.toLowerCase().replace(/on/, '')
    el.addEventListener(event, nextPropVal)
  } else {
    if (nextPropVal === undefined || nextPropVal === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextPropVal)
    }
  }
}

function insert(el, parent) {
  parent.append(el)
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert
})

export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '../runtime-core'
