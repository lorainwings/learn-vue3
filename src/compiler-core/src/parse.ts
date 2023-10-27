import { NodeTypes } from './ast'

interface InterpolationNode {
  type: NodeTypes.INTERPOLATION
  content: {
    type: NodeTypes.SIMPLE_EXPRESSION
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
  const nodes: InterpolationNode[] = []
  let node
  if (context.source.startsWith('{{')) {
    node = parseInterpolation(context)
  }
  nodes.push(node)
  return nodes
}

function parseInterpolation(context: RootContext): InterpolationNode {
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

function createRoot(children: InterpolationNode[]) {
  return {
    children
  }
}

function createParserContext(content: string): RootContext {
  return {
    source: content
  }
}
