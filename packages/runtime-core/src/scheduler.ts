import type { ReactiveEffect } from '@v-next/reactivity'

// 防止创建多个Promise
let isFlushPending = false
const p = Promise.resolve()

const queue: ReactiveEffect[] = []

export function nextTick(fn) {
  return fn ? p.then(fn) : p
}

export function queueJobs(job) {
  if (queue.includes(job)) return
  queue.push(job)
  queueFlush()
}

function queueFlush() {
  if (isFlushPending) return
  isFlushPending = true
  nextTick(flushJobs)
}

function flushJobs() {
  isFlushPending = false
  let job
  while ((job = queue.shift())) {
    job && job()
  }
}
