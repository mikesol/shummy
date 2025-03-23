export type Anchor = 'parent' | number

export type Traversal = (element: Node, anchor: Anchor) => Traversals

export interface Traversals {
  elementPaths: Record<string, Element>
  listenerPaths: Element[]
} 