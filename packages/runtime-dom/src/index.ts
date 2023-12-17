import { createRenderer } from '@v-next/runtime-core'

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

function insert(child, parent, anchor) {
  // 当anchor为null时, 相当于appendChild
  parent.insertBefore(child, anchor || null)
}

function remove(child) {
  const parent = child.parentNode
  if (parent) {
    parent.removeChild(child)
  }
}

function setElementText(el, text) {
  el.textContent = text
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText
})

export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '@v-next/runtime-core'
