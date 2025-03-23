import { Template, RuntimeOptions } from './types'

export function initializeTemplate(
  template: Readonly<Template>,
  options: Readonly<RuntimeOptions>,
  document: Document,
  callCount: number,
): void {
  // Mount HTML
  const reference = document.querySelector('#app')
  if (!reference) throw new Error('No #app element found')
  reference.innerHTML = template.html

  // Get element and listener paths
  const { elementPaths, listenerPaths } = template.traversal(reference, 'parent')
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
      handler.handler(template.stores, event)
      // Call store listeners
      for (const listener of template.storeListeners) {
        const shouldCall = Array.from(listener.stores).some(store => 
          handler.stores.has(store)
        )
        if (shouldCall) {
          listener.handler(elements, template.stores, callCount, options.inDom)
        }
      }
    }
    element.addEventListener(event, domListeners[id])
  }

  // Call store listeners
  for (const listener of template.storeListeners) {
    listener.handler(elements, template.stores, callCount, options.inDom)
  }
} 