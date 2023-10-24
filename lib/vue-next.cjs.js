'use strict';

const EMPTY_PROPS = {};
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
        key: props && props.key,
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
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        // 调用patch
        patch(null, vnode, container, null, null);
    }
    // n1 老虚拟节点
    // n2 新虚拟节点
    function patch(n1, n2, container, parentComponent, anchor) {
        // 按类型处理vnode
        // 组件vnode.type是个对象, 而普通元素vnode.type是个字符串
        const { shapeFlag, type } = n2;
        //  实现Fragment,只渲染children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 判断是不是element类型
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 如果是组件类型
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor);
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        effect(() => {
            // 初始化流程
            if (!instance.isMounted) {
                console.log('init');
                const { proxy } = instance;
                // sub vnode -> patch -> element -> mountElement
                const subTree = (instance.subTree = instance.render.call(proxy));
                // 递归处理所有子节点
                patch(null, subTree, container, instance, anchor);
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
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        });
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 包含初始化和更新两个流程
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('patchElement', n1, n2);
        // 值是不可变的, 不能直接修改props的变量值, 而是去更新容器上面的属性值
        const oldProps = n1.props || EMPTY_PROPS;
        const newProps = n2.props || EMPTY_PROPS;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const shapeFlag = n2.shapeFlag;
        const c2 = n2.children;
        /**
         * 新旧子节点就两种类型, 文本节点和数组节点, 通过两两组合就形成四种条件
         */
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            /**
             * 场景一: 老节点是数组节点, 新节点是文本节点
             * 操作步骤: 将老节点的子节点全部删除, 然后将新节点的文本节点插入到容器中
             */
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 1. 把老的children清空
                unmountChildren(c1);
                // 2. 设置新的text, 与场景二合并该操作
                // hostSetElementText(container, c2 as string)
            }
            /**
             * 场景二: 老节点是文本节点, 新节点也是文本节点
             * 操作步骤: 直接修改文本节点的内容
             */
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            /**
             * 场景三: 老节点是文本节点, 新节点是数组节点
             * 操作步骤: 清空老节点的文本节点, 然后把新节点的数组节点mount到容器中
             */
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // 1. 把老的节点先清空
                hostSetElementText(container, '');
                // 2. 把新节点mount到容器中
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                /**
                 * 场景四: 老节点是数组节点, 新节点也是数组节点
                 * 操作步骤: 通过diff算法对比新老节点, 然后更新, 也是最复杂的最核心的场景
                 */
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0; // 老节点的头指针
        let e1 = c1.length - 1; // 老节点的尾指针
        let e2 = l2 - 1; // 新节点的尾指针
        function isSameNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // case1: 从左侧开始对比, 用于锁定范围
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // case2: 从右侧开始对比, 用于锁定范围
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // case3: 新节点比老节点长, 需要创建, 包含了右侧和左侧对比
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    // 从i 到 e2 循环创建
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        // case4: 老节点比新节点长, 需要删除
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        // case5: 中间对比, 乱序对比
        else {
            const s1 = i;
            const s2 = i;
            // 新节点中所有需要patch对比的个数, 当新节点所有需要patch的个数对比完成时, 老节点中多出来的节点都需要直接移除掉
            const toBePatched = e2 - s2 + 1;
            // 新旧节点已经patch对比的数量
            let patched = 0;
            const keyToIndexMap = new Map();
            /**
             * 优化case5.3逻辑
             * 初始化新老下标的映射关系, 下标为在新节点中的下标位置(减去起始位置), 值为在老节点中的下标位置
             * Note that oldIndex is offset by +1
             * and oldIndex = 0 is a special value indicating the new node has
             * 老节点下标为0是一个在新节点中的特殊值, 因此需要加上一个偏移+1
             *
             */
            let moved = false;
            let maxNewIndexSoFar = 0;
            const newIndexToOldIndexMap = new Array(toBePatched);
            for (i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            // 遍历新节点, 创建映射表
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToIndexMap.set(nextChild.key, i);
            }
            // 遍历老节点, 从映射表中找到对应的节点, 如果没有则删除
            for (let i = s1; i <= e1; i++) {
                let newIndex;
                const prevChild = c1[i];
                /**
                 * 优化case5.1逻辑: 老的比新的多， 那么多出来的直接就可以被干掉
                 * 操作步骤 优化删除逻辑
                 */
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                if (prevChild.key !== null) {
                    // 老节点中有key
                    newIndex = keyToIndexMap.get(prevChild.key);
                }
                else {
                    // 老节点中没有key
                    for (let j = s2; j < e2; j++) {
                        if (isSameNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                /**
                 * case5.1: 在老节点中存在, 新节点中不存在
                 * 操作步骤: 删除老节点
                 */
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    /**
                     * 优化case5.3逻辑: 通过记录最大的newIndex, 如果当前的newIndex小于最大的newIndex, 说明位置变化了, 需要移动
                     * 新坐标的位置如果一直递增, 就不需要移动, 就不需要使用最长递增子序列算法
                     * 否则出现一个新坐标小于老坐标的情况, 那么就需要移动
                     */
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    /**
                     * e.g. 如果老节点是a, b, (c, d, e), f, g  新节点是a, b, (e, c, d), f, g
                     * 因为老节点中的元素下标可能为0, 因此存入IndexToOldIndexMap时得增加偏移量1
                     *     那么他们的映射关系为:
                     *     - c对应的newIndexToOldIndexMap下标为1, 值为2
                     *     - d对应的newIndexToOldIndexMap下标为2, 值为3
                     *     - e对应的newIndexToOldIndexMap下标为0, 值为4
                     *     结果为: [4, 2, 3], 每个值偏移了1, 因此为[5, 3, 4]
                     */
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    /**
                     * case5.2: 新节点中找到了对应的老节点
                     * 操作步骤: 通过patch递归对比然后更新
                     */
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            // 遍历新节点差异区间, 为了保证insertBefore插入的基本元素的稳定性, 因此需要倒序遍历
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex].el;
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                /**
                 * case5.4: 在老节点在新节点中不存在, 但在新节点中存在
                 * 操作步骤: 创建新的节点
                 */
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, c2[nextIndex], container, parentComponent, anchor);
                }
                else if (moved) {
                    /**
                     * case5.3: 老节点在新节点中仍然存在, 但是位置变化了
                     * 操作步骤: 获取最长递增子序列, 遍历需要移动的位置, 然后进行移动
                     */
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    /**
     * patchProps 几种情况
     * 场景一. 前后都有属性值, 后面的值不一样了, 属于修改
     * 场景二. 前面有属性, 后面变为null或者undefined, 属于删除
     * 场景三. 前面有属性, 后面没有属性, 属于删除
     */
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 场景一
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_PROPS) {
                // 场景二
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
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
            mountChildren(vnode.children, el, parentComponent, anchor);
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
            hostPatchProp(el, key, null, val);
        }
        // container.append(el)
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, el, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, el, parentComponent, anchor);
        });
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
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
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevPropVal, nextPropVal) {
    const isOn = (key) => /^on[A-Z]/g.test(key);
    if (isOn(key)) {
        const event = key.toLowerCase().replace(/on/, '');
        el.addEventListener(event, nextPropVal);
    }
    else {
        if (nextPropVal === undefined || nextPropVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextPropVal);
        }
    }
}
function insert(child, parent, anchor) {
    // 当anchor为null时, 相当于appendChild
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.ReactiveEffect = ReactiveEffect;
exports.computed = computed;
exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.shallowReadonly = shallowReadonly;
exports.stop = stop;
exports.unRef = unRef;
