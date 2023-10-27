import { NodeTypes, TagType } from './ast'

type StringToNumber<T extends `${NodeTypes}`> = T extends `${infer U extends
  number}`
  ? U
  : never

interface AstNode {
  type: StringToNumber<`${NodeTypes}`>
  tag?: string
  content?: {
    type: StringToNumber<`${NodeTypes}`>
    content: string
  }
}

interface RootContext {
  source: string
}

export function baseParse(content: string) {
  const context = createParserContext(content)
  return createRoot(parseChildren(context))
}

function parseChildren(context: RootContext) {
  const nodes: AstNode[] = []
  let node
  const s = context.source
  if (s.startsWith('{{')) {
    node = parseInterpolation(context)
  } else if (s[0] === '<') {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context)
    }
  }
  nodes.push(node)
  return nodes
}

function parseElement(context: RootContext): AstNode {
  const element = parseTag(context, TagType.Start)
  parseTag(context, TagType.End)
  return element
}

function parseTag(context: RootContext, type: TagType.Start): AstNode
function parseTag(context: RootContext, type: TagType.End): undefined
function parseTag(context: RootContext, type: TagType): AstNode | undefined {
  // 1. 解析tag
  const match = /^<\/?([a-z]+)/i.exec(context.source)
  const tag = match![1]
  advanceBy(context, match![0].length)
  advanceBy(context, 1)

  // 处理结束标签就不需要返回值了
  if (type === TagType.End) return

  // 2. 删除处理完的代码
  return {
    type: NodeTypes.ELEMENT,
    tag
  }
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
  const rawContent = context.source.slice(0, rawContentLength)
  const content = rawContent.trim()
  advanceBy(context, rawContentLength + closeDelimiter.length)

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
