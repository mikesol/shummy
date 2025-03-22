export type Traversal = (element: Element) => Traversals

export interface Traversals {
  elementPaths: Record<string, Element>
  listenerPaths: Element[]
} 