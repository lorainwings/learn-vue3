const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === 'object';
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

const targetMap = new Map();
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit() { }
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
        // function Object
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // 实现function
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    // 保证最终的组件render一定有值
    finishComponent(instance);
}
function finishComponent(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
    // 调用patch
    patch(vnode, container);
}
function patch(vnode, container) {
    // 按类型处理vnode
    // 组件vnode.type是个对象, 而普通元素vnode.type是个字符串
    const { shapeFlag, type } = vnode;
    //  实现Fragment,只渲染children
    switch (type) {
        case Fragment:
            processFragment(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                // 判断是不是element类型
                processElement(vnode, container);
            }
            else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                // 如果是组件类型
                processComponent(vnode, container);
            }
            break;
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVnode, container) {
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    const { proxy } = instance;
    // sub vnode -> patch -> element -> mountElement
    const subTree = instance.render.call(proxy);
    // 递归处理所有子节点
    patch(subTree, container);
    // 所有element已经处理完成
    initialVnode.el = subTree.el;
}
function processElement(vnode, container) {
    // 包含初始化和更新两个流程
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    // 分为普通元素string类型和一个子元素数组类型
    const el = (vnode.el = document.createElement(vnode.type));
    const { props, shapeFlag } = vnode;
    // 处理children
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = vnode.children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode, el);
    }
    // props
    for (const key in props) {
        const val = props[key];
        // 重构步骤, 从具体到抽象, 从一个具体的情况抽象为通用的情况
        const isOn = (key) => /^on[A-Z]/g.test(key);
        if (isOn(key)) {
            el.addEventListener(key.toLowerCase().replace(/on/, ''), props[key]);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, el) {
    vnode.children.forEach((v) => {
        patch(v, el);
    });
}
function processFragment(vnode, container) {
    mountChildren(vnode, container);
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}

function createApp(rootComponent) {
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

export { createApp, createTextVNode, h, renderSlots };
//# sourceMappingURL=vue-next.esm.js.map
