'use strict';

function createVNode(type, props, children) {
    const vnode = {
        // type就是原来的组件选项对象
        type,
        props,
        children
    };
    return vnode;
}

const isObject = (val) => {
    return val !== null && typeof val === 'object';
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type
    };
    return component;
}
function setupComponent(instance) {
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        // function Object
        const setupResult = setup();
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
    // 组件vode.type是个对象, 而普通元素vnode.type是个字符串
    if (typeof vnode.type === "string") {
        // 判断是不是element类型
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 如果是组件类型
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // sub vnode -> patch -> element -> mountElement
    patch(subTree, container);
}
function processElement(vnode, container) {
    // 包含初始化和更新两个流程
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    // 分为普通元素string类型和一个子元素数组类型
    const el = document.createElement(vnode.type);
    const { children, props } = vnode;
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(children, el);
    }
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
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

exports.createApp = createApp;
exports.h = h;
