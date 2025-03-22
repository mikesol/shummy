import type { Traversal, Traversals } from './types'

export function traverseHTML(html: string): Traversal {
  return (element: Element) => {
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
