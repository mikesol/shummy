import type { Traversal, Traversals, Anchor } from './types'

export function traverseHTML(_: string): Traversal {
  return (e: Node, anchor: Anchor) => {
    const element = anchor === 'parent' ? e : e.parentElement
    if (!(element instanceof Element)) {
      throw new Error('Anchor element not found')
    }
    const elementPaths: Record<string, Element> = {}
    const listenerPaths: Element[] = []

    // Find all elements with data-s-id
    const elements = element.querySelectorAll('[data-s-id]')
    elements.forEach(el => {
      const id = el.getAttribute('data-s-id')!
      elementPaths[id] = el
    })

    // Find all elements with data-s-listener
    const listeners = element.querySelectorAll('[data-s-listener]')
    listeners.forEach(el => {
      listenerPaths.push(el)
    })

    return {
      elementPaths,
      listenerPaths
    }
  }
}
