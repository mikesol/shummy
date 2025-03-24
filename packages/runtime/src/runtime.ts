import { Runtime, RuntimeOptions, Template, RuntimeState } from './types'
import { Position, Reference } from '@shimmy/traversals'
import { traverseHTML, Child } from '@shimmy/traversals'
import { produceWithPatches } from 'immer'

const getLeftmostNode = (child: Child): Node => {
  if (child.reference.type === 'node-neighbor') {
    return child.reference.element
  } else if (child.reference.type === 'child-neighbor') {
    if (child.reference.leftmostNode) {
      return child.reference.leftmostNode
    } else {
      return getLeftmostNode(child.reference.element)
    }
  }
  // it must be a parent reference
  // in which case it is a programming error
  throw new Error('Parent reference does not have a leftmost node')
}

function insertHtml(html: string, reference: Reference): Element | Text {
  const fragment = document.createRange().createContextualFragment(html)
  const firstNode = fragment.firstChild
  if (!firstNode) throw new Error('Template HTML cannot be empty')
  if (!(firstNode instanceof Element || firstNode instanceof Text)) {
    throw new Error('Template HTML must start with an Element or Text node')
  }

  const nodes = Array.from(fragment.childNodes)
  const eltToUse = reference.type === 'parent' ? reference.element : reference.type === 'node-neighbor' ? reference.element.parentNode! : getLeftmostNode(reference.element)
  for (let i = 0; i < nodes.length; i++) {
      if (reference.type === 'parent') {
        eltToUse.appendChild(nodes[i])
      } else if (reference.type === 'node-neighbor') {
        eltToUse.parentNode?.insertBefore(nodes[i], eltToUse)
      } else if (reference.type === 'child-neighbor') {
        eltToUse.insertBefore(nodes[i], eltToUse)
      }
  }

  return firstNode
}

export class ShimmyRuntime implements Runtime {
  private options: RuntimeOptions
  private reference: Element
  private state: RuntimeState

  constructor(options: RuntimeOptions = { inDom: false }, reference: Element) {
    this.options = options
    this.reference = reference
    this.state = {
      templates: {},
      actualizedTemplates: {},
      stores: {}
    }
  }

  registerTemplate(template: Template): void {
    this.state.templates[template.id] = template
  }

  actualizeTemplate(templateId: string, reference: Reference): void {
    // Register template and get its leftmost element
    const template = this.state.templates[templateId]
    const leftmostNode = insertHtml(template.html, reference)
    this.state.actualizedTemplates[template.id] = { leftmostNode, children: {} }

    // Register stores
    Object.entries(template.stores).forEach(([namespace, store]) => {
      this.state.stores[namespace] = store
    })

    // Get element and listener paths
    const { elementPaths, listenerPaths } = template.traversal(leftmostNode)
    const elements: Record<string, Element> = elementPaths

    // Create listener paths
    const domListeners: Record<string, (event: Event) => void> = {}
    for (const element of listenerPaths) {
      const listenAttr = element.getAttribute('data-s-listener')
      if (!listenAttr) continue

      const [event, id] = listenAttr.split(':')
      if (!event || !id || !template.domListeners[id]) continue

      const handler = template.domListeners[id]
      domListeners[id] = (event: Event) => {
        handler.handler(this.state.stores, event)
        // Call store listeners
        for (const listener of template.storeListeners) {
          const shouldCall = Array.from(listener.stores).some(store =>
            handler.stores.has(store)
          )
          if (shouldCall) {
            listener.handler(elements, this.state.stores, this.options.inDom)
          }
        }
      }
      element.addEventListener(event, domListeners[id])
    }

    // Call store listeners
    for (const listener of template.storeListeners) {
      listener.handler(elements, this.state.stores, this.options.inDom)
    }
  }
} 