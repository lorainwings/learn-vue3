import { NodeTypes, TagType } from './ast'

export type StringToNumber<T extends `${NodeTypes}`> =
  T extends `${infer U extends number}` ? U : never

export interface AstNode {
  type: StringToNumber<`${NodeTypes}`>
  children?: AstNode[]
  tag?: string
  content?:
    | {
        type: StringToNumber<`${NodeTypes}`>
        content: string
      }
    | string
}

export interface RootContext {
  source: string
}

export type ParseTagReturnType<T extends TagType> = T extends TagType.Start
  ? AstNode
  : undefined

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context, []))
}

function parseChildren(context: RootContext, ancestors: AstNode[]) {
  const nodes: AstNode[] = []
  while (!isEnd(context, ancestors)) {
    let node
    const s = context.source
    if (s.startsWith('{{')) {
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }
    if (!node) {
      node = parseText(context)
    }
    nodes.push(node)
  }
  return nodes
}

function isEnd(context: RootContext, ancestors: AstNode[]): boolean {
  // 1. source无值时
  // 2. 遇到结束标签的时候
  const s = context.source
  if (s.startsWith('</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag as string
      if (startsWithEndTagOpen(s, tag)) return true
    }
  }
  return !s
}

function parseText(context: RootContext): AstNode {
  let endIndex = context.source.length
  const endTokens = ['<', '{{']
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    // 首次先将endIndex设置一个下标值, 下一次进入循环就会判断比上一次小的下标才会赋值, 最终找到最小的下标
    if (~index && endIndex > index) endIndex = index
  }
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseTextData(
  context: RootContext,
  length: number = context.source.length
) {
  // 1. 获取content
  const content = context.source.slice(0, length)
  // 2. 推进
  advanceBy(context, content.length)
  return content
}

function parseElement(context: RootContext, ancestors: AstNode[]): AstNode {
  const element = parseTag(context, TagType.Start)
  ancestors.push(element)
  element.children = parseChildren(context, ancestors)
  ancestors.pop()
  if (startsWithEndTagOpen(context.source, element!.tag as string)) {
    parseTag(context, TagType.End)
  } else {
    throw Error('element tag not match')
  }
  return element
}

function startsWithEndTagOpen(source: string, tag: string) {
  return (
    source.startsWith('<') &&
    source.slice(2, 2 + tag!.length).toLowerCase() === tag.toLocaleLowerCase()
  )
}

// function parseTag(context: RootContext, type: TagType.Start): AstNode
// function parseTag(context: RootContext, type: TagType.End): undefined
function parseTag<T extends TagType>(
  context: RootContext,
  type: T
): ParseTagReturnType<T> {
  // 1. 解析tag
  const match = /^<\/?([a-z]+)/i.exec(context.source)
  const tag = match![1]
  advanceBy(context, match![0].length)
  advanceBy(context, 1)

  // 处理结束标签就不需要返回值了
  if (type === TagType.End) return void 0 as ParseTagReturnType<T>

  // 2. 删除处理完的代码
  return {
    type: NodeTypes.ELEMENT,
    tag
  } as ParseTagReturnType<T>
}

function parseInterpolation(context: RootContext): AstNode {
  const openDelimiter = '{{'
  const closeDelimiter = '}}'

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  )
  advanceBy(context, openDelimiter.length)
  const rawContentLength = closeIndex - openDelimiter.length
  const rawContent = parseTextData(context, rawContentLength)
  const content = rawContent.trim()
  advanceBy(context, closeDelimiter.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content
    }
  }
}

function advanceBy(context: RootContext, length: number) {
  context.source = context.source.slice(length)
}

function createRoot(children: AstNode[]) {
  return {
    children
  }
}

function createParserContext(content: string): RootContext {
  return {
    source: content
  }
}
