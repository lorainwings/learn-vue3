import { ReactiveEffect } from '@v-next/reactivity'
import { queuePreFlushCb } from './scheduler'

export function watchEffect(source) {
  function job() {
    effect.run()
  }

  let cleanup
  const onCleanup = function (outerFn) {
    cleanup = effect.onStop = () => {
      outerFn()
    }
  }

  function getter() {
    if (cleanup) cleanup()
    source(onCleanup)
  }

  const effect = new ReactiveEffect(getter, () => {
    queuePreFlushCb(job)
  })

  effect.run()

  return () => {
    effect.stop()
  }
}
