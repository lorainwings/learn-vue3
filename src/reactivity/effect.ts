

interface Runner {
  (): void;
  effect: ReactiveEffect
}

let activeEffect: ReactiveEffect;
const targetMap = new Map()

class ReactiveEffect {
  private _fn: () => unknown
  public deps: Set<ReactiveEffect>[] = [];
  constructor(fn: () => void, public scheduler) {
    // 组件更新函数
    this._fn = fn
    this.scheduler = scheduler
  }
  run() {
    // 全局指针先引用当前的ReactEffect实例
    // 当前的ReactEffect实例存储着更新组件的componentUpdateFn
    // 执行this._fn后, 会读取响应式变量, 接着触发了get陷阱函数
    // 在陷阱函数的track中, 会通过dep来保存当前的ReactEffect实例
    // 因此, 同一个组件只有一个ReactEffect实例
    activeEffect = this;
    return this._fn()
  }
  stop() {
    cleanupEffect(this)
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect)
  })
}

export function track(target, key) {
  // target -> key -> dep
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }


  deps.add(activeEffect)

  // if(!activeEffect) return
  activeEffect.deps.push(deps)
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  const dep = depsMap.get(key)
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}


export function effect(fn, options: any = {}) {
  const scheduler = options.scheduler
  const _effect = new ReactiveEffect(fn, scheduler)

  _effect.run()
  const runner = _effect.run.bind(_effect) as Runner
  runner.effect = _effect

  return runner
}


export function stop(runner) {
  runner.effect.stop()
}
