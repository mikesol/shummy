import { describe, it, expect, beforeEach } from 'vitest'
import { ShimmyRuntime } from '@shimmy/runtime'
import { ShimmySPAServer } from '../server'
import { Message } from '@shimmy/runtime'
import { selectorTraverseHTML } from '@shimmy/traversals'

describe('Counter Example', () => {
  let runtime: ShimmyRuntime
  let server: ShimmySPAServer
  let reference: Element

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '<div id="app"></div>'
    reference = document.querySelector('#app')!
    
    // Create runtime and server
    runtime = new ShimmyRuntime({ inDom: false }, reference)
    server = new ShimmySPAServer(reference)
    
    // Connect server to runtime
    server.sendTemplate = (template) => {
      const message: Message = {
        type: 'template',
        template
      }
      runtime.handleMessage(message)
    }
  })

  it('should increment counter when button is clicked', async () => {
    const html = `
      <div>
        <p>Count: <span data-s-id="count">0</span></p>
        <button data-s-listener="click:increment">Increment</button>
      </div>
    `

    // Send initial template
    server.sendTemplate({
      html,
      domListeners: {
        increment: {
          handler: (stores) => {
            stores.count = (stores.count || 0) + 1
          },
          stores: new Set(['count'])
        }
      },
      storeListeners: [{
        stores: new Set(['count']),
        handler: (elements, stores) => {
          elements.count.textContent = String(stores.count)
        }
      }],
      stores: { count: 0 },
      traversal: selectorTraverseHTML(html)
    })

    // Subscribe to count changes
    const countElement = document.querySelector('[data-s-id="count"]')
    expect(countElement?.textContent).toBe('0')

    // Click increment button
    const button = document.querySelector('button')
    button?.click()

    // Check count was updated
    expect(countElement?.textContent).toBe('1')
  })
}) 