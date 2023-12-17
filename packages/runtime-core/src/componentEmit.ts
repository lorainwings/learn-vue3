import { camelize, toHandlerKey } from '@v-next/shared'
import { ComponentInternalInstance } from './component'

export function emit(instance: ComponentInternalInstance, event, ...args) {
  // instance.props -> event
  const { props } = instance

  const handlerName = toHandlerKey(camelize(event))

  const handler = props[handlerName]

  handler && handler(...args)
}
