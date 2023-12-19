import type { ReactiveEffect } from '@v-next/reactivity'

// 防止创建多个Promise
let isFlushPending = false
const p = Promise.resolve()

const queue: ReactiveEffect[] = []
// 创建一个渲染前的执行队列
const activePreFlushCbs: any[] = []

export function nextTick(fn?) {
  return fn ? p.then(fn) : p
}

export function queueJobs(job) {
  if (queue.includes(job)) return
  queue.push(job)
  queueFlush()
}

export function queuePreFlushCb(job) {
  activePreFlushCbs.push(job)
  queueFlush()
}

function queueFlush() {
  if (isFlushPending) return
  isFlushPending = true
  nextTick(flushJobs)
}

function flushJobs() {
  isFlushPending = false
  // watchEffect需要在组件渲染前执行
  flushPreFlushCbs()

  // 组件渲染前
  let job
  while ((job = queue.shift())) {
    job && job()
  }
}

function flushPreFlushCbs() {
  for (let i = 0; i < activePreFlushCbs.length; i++) {
    activePreFlushCbs[i]()
  }
}
