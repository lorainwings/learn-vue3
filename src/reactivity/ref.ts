import { reactive } from "./reactive";
import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";

interface Ref<T> {
  value: T
}

export class RefImpl {
  private _value;
  private _rawValue;
  public deps = new Set();

  constructor(value) {
    this._rawValue = value;
    // 如果value是对象, 则需要对对象用reactive进行代理
    this._value = convert(value)
  }
  get value() {
    trackRefValue(this);
    return this._value;

  }
  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      // 必须先修改value的值
      this._value = convert(newValue)
      triggerEffects(this.deps);
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}


export function trackRefValue(ref: RefImpl) {
  if (isTracking()) trackEffects(ref.deps);
}


export function ref<T>(value: T): Ref<T> {
  return new RefImpl(value)
}


