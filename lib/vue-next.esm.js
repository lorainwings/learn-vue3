const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === 'object';
const hasChanged = (n, o) => !Object.is(n, o);
function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
}
// TPP
// 先写一个特定的行为, 再重构成通用的行为
// add -> Add
const capitalize = (str) => {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
};
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, w) => {
        return w ? `${w.toUpperCase()}` : '';
    });
};
const toHandlerKey = (str) => {
    return str ? `on${capitalize(str)}` : '';
};

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        // type就是原来的组件选项对象
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    // children type
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 必须是组件类型, 且children是一个object, 那么就是一个slot类型
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(children)) {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOTS_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, slotScope) {
    const slot = slots[name];
    // 需将slots包装为vnode
    if (slot) {
        if (typeof slot === 'function') {
            // 由于children不可以是数组, 因此实现了renderSlots
            // renderSlots待优化的点: 每个slot都会多了一层div
            // 此时将div改为Fragment
            return createVNode(Fragment, {}, slot(slotScope));
        }
    }
}

// 全局存储当前组件的effect
let activeEffect;
// stop后是否应该收集依赖
let shouldTrack;
const targetMap = new Map();
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        // 防止多次调用stop
        this.active = true;
        this.onStop = () => { };
        // 组件更新函数
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.active)
            return this._fn();
        shouldTrack = true;
        // 全局指针先引用当前的ReactEffect实例
        // 当前的ReactEffect实例存储着更新组件的componentUpdateFn
        // 执行this._fn后, 会读取响应式变量, 接着触发了get陷阱函数
        // 在陷阱函数的track中, 会通过dep来保存当前的ReactEffect实例
        // 因此, 同一个组件只有一个ReactEffect实例
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        activeEffect = this;
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            this.onStop && this.onStop();
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function track(target, key) {
    if (!isTracking())
        return;
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let deps = depsMap.get(key);
    if (!deps) {
        deps = new Set();
        depsMap.set(key, deps);
    }
    trackEffects(deps);
}
function isTracking() {
    // 在reactive中的单测代码, 并未执行effect, 所以activeEffect为undefined
    // 如果外部并未执行effect, 而是直接读取响应式的值, 被get陷阱函数拦截, 调用track, 此处activeEffect为undefined
    // 如果stop后, 不应该收集依赖, 因此直接返回
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function trackEffects(deps) {
    // 防止重复收集依赖, set中征对对象无法去重
    if (deps.has(activeEffect))
        return;
    deps.add(activeEffect);
    // activeEffect.deps是所有响应式所有key的deps
    // 例如 reactive({a: 1, b: 2, c: 3})
    // depsMap: { a: Set([avtiveEffect]), b: Set([avtiveEffect]), c: Set([avtiveEffect]) }
    // 如果a,b,c都触发了响应式, 那么activeEffect.deps就会收集上面所有的Set
    activeEffect.deps.push(deps);
}
function effect(fn, options = {}) {
    const scheduler = options.scheduler;
    const _effect = new ReactiveEffect(fn, scheduler);
    // 考虑到后期会添加很多options的数据到_effect中, 因此重构此处
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}

// 防止每次引用都会执行一次createGetter/createSetter
// 缓存之后, 只会创建一次
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */)
            return !isReadonly;
        if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */)
            return isReadonly;
        const res = Reflect.get(target, key);
        // 如果shallow为true, 那么只代理最外层的响应式, 内层不代理
        if (shallow)
            return res;
        // 如果res也是object, 那么再次调用reactive, 递归代理
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(t, k, v) {
        console.warn(`cannot set readonly property ${k}`);
        return true;
    }
};
// 必须使用一个空对象作为原型, 否则会改到readonlyHandlers
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
/* shallow只代理最外层的响应式, 内层不代理 */
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function createActiveObject(raw, handlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`);
        return raw;
    }
    return new Proxy(raw, handlers);
}
function isReactive(obj) {
    return !!obj["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}
function isReadonly(obj) {
    return !!obj["__v_isReadonly" /* ReactiveFlags.IS_READONLY */];
}
function isProxy(obj) {
    return isReactive(obj) || isReadonly(obj);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this.deps = new Set();
        this._rawValue = value;
        // 如果value是对象, 则需要对对象用reactive进行代理
        this._value = convert(value);
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            // 必须先修改value的值
            this._value = convert(newValue);
            triggerEffects(this.deps);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking())
        trackEffects(ref.deps);
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
// proxyRefs用于自动拆包, 即不需要.value来访问ref值
// 使用场景一般在template中, template中不需要.value来访问ref值
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            const o = Reflect.get(target, key);
            // 源对象是ref对象, 但是新值不是ref对象, 则直接修改ref对象的value值
            if (isRef(o) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

class ComputedRefImpl {
    constructor(getter) {
        // private _getter: () => unknown;
        // 如果脏值, 就获取新值, 否则使用缓存值
        this._isDirty = true;
        // this._getter = getter;
        this._effect = new ReactiveEffect(getter, () => {
            if (!this._isDirty)
                this._isDirty = true;
        });
    }
    get value() {
        // 当依赖的响应式对象的值发生变化的时候, 就需要改变_isDirty = true
        // 因此也需要知道什么时候响应式变量发生变化, 因此就需要使用effect
        if (this._isDirty) {
            this._isDirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
}
function computed(getter) {
    return new ComputedRefImpl(getter);
}

function emit(instance, event, ...args) {
    // instance.props -> event
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    // attrs
}

// 需要代理哪些常用响应属性
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    // $slots
    $slots: (i) => i.slots
};
const PublicInstanceProxyHandles = {
    get({ _: instance }, key) {
        // setupState
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // $el属性 | $slots属性
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        // $data
    }
};

function initSlots(instance, children) {
    // 不是所有的组件都有插槽, 因此需要判断
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOTS_CHILDREN */) {
        normalizeObjectSlots(children, instance);
    }
}
function normalizeObjectSlots(children, instance) {
    // 为了实现具名插槽, 因此需要将children转换成对象
    const slots = {};
    for (const key in children) {
        const value = children[key];
        // slot
        slots[key] = (slotScope) => normalizeSlotValue(value(slotScope));
    }
    instance.slots = slots;
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    console.log('createComponentInstance', parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit() { },
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {}
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 此处_用于传参
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandles);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        // function Object
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        // setup调用完应该清空
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // 实现function
    if (typeof setupResult === 'object') {
        // 为了模版中能直接访问ref的value值, 此处先进行拆包
        instance.setupState = proxyRefs(setupResult);
    }
    // 保证最终的组件render一定有值
    finishComponent(instance);
}
function finishComponent(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
function getCurrentInstance() {
    return currentInstance;
}
/**
 * 为何需要将currentInstance的set和get封装为函数?
 *
 * 如果不封装, 多处修改一个全局变量, 会导致代码难以维护和跟踪, 更容易出现bug
 * 封装统一的get和set方法, 便于后续调试和维护, 以及跟踪currentInstance的变化
 */
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    // 数据存在哪里? 存在使用provide的组件实例上
    // 使用getCurrentInstance只能在setup函数中使用
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        let { provides } = currentInstance;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { parent } = currentInstance;
        const parentProvides = parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                /**
                 *  1. 先转VNode
                 *  */
                // 将入口component->转化成 VNode
                const vnode = createVNode(rootComponent);
                /**
                 *  2. 后续所有逻辑操作都会基于VNode进行
                 *  */
                render(vnode, rootContainer);
            }
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options;
    function render(vnode, container) {
        // 调用patch
        patch(null, vnode, container, null);
    }
    // n1 老虚拟节点
    // n2 新虚拟节点
    function patch(n1, n2, container, parentComponent) {
        // 按类型处理vnode
        // 组件vnode.type是个对象, 而普通元素vnode.type是个字符串
        const { shapeFlag, type } = n2;
        //  实现Fragment,只渲染children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 判断是不是element类型
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 如果是组件类型
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(instance, initialVnode, container) {
        effect(() => {
            // 初始化流程
            if (!instance.isMounted) {
                console.log('init');
                const { proxy } = instance;
                // sub vnode -> patch -> element -> mountElement
                const subTree = (instance.subTree = instance.render.call(proxy));
                // 递归处理所有子节点
                patch(null, subTree, container, instance);
                // 所有element已经处理完成
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            // 更新流程
            else {
                console.log('update');
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    function processElement(n1, n2, container, parentComponent) {
        // 包含初始化和更新两个流程
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    function patchElement(n1, n2, container) {
        console.log('n1-n2', n1, n2);
        // patchProp
        // patchChildren
    }
    function mountElement(vnode, container, parentComponent) {
        // 分为普通元素string类型和一个子元素数组类型
        // 此处是使用DOM API创建真实DOM元素, 为了兼容自定义渲染器, 因此需要重构
        // const el = (vnode.el = document.createElement(vnode.type as string))
        // 重构为创建元素的函数, 函数中判断平台然后调用对应平台创建API
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { props, shapeFlag } = vnode;
        // 处理children
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = vnode.children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode, el, parentComponent);
        }
        // props
        for (const key in props) {
            const val = props[key];
            // 重构步骤, 从具体到抽象, 从一个具体的情况抽象为通用的情况
            /**
             * 此处也需要重构到通用的创建props的函数
             */
            /* const isOn = (key: string) => /^on[A-Z]/g.test(key)
            if (isOn(key)) {
              const event = key.toLowerCase().replace(/on/, '')
              el.addEventListener(event, val)
            } else {
              el.setAttribute(key, val)
            } */
            hostPatchProp(el, key, val);
        }
        // container.append(el)
        hostInsert(el, container);
    }
    function mountChildren(vnode, el, parentComponent) {
        vnode.children.forEach((v) => {
            patch(null, v, el, parentComponent);
        });
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    const isOn = (key) => /^on[A-Z]/g.test(key);
    if (isOn(key)) {
        const event = key.toLowerCase().replace(/on/, '');
        el.addEventListener(event, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, parent) {
    parent.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { ReactiveEffect, computed, createApp, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, provide, proxyRefs, reactive, readonly, ref, renderSlots, shallowReadonly, stop, unRef };
//# sourceMappingURL=vue-next.esm.js.map
