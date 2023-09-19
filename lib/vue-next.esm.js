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
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === 'object';
function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
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

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    // attrs
}

// 需要代理哪些常用响应属性
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
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
        // $el属性
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        // $data
    }
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {}
    };
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 此处_用于传参
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandles);
    const { setup } = Component;
    if (setup) {
        // function Object
        const setupResult = setup(shallowReadonly(instance.props));
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
    if (vnode.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        // 判断是不是element类型
        processElement(vnode, container);
    }
    else if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        // 如果是组件类型
        processComponent(vnode, container);
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
    const { children, props, shapeFlag } = vnode;
    // 处理children
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(children, el);
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
function mountChildren(children, el) {
    children.forEach(v => {
        patch(v, el);
    });
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

export { createApp, h };
