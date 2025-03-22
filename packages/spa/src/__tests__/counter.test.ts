import { describe, it, expect, beforeEach } from 'vitest'
import { ShimmyRuntime } from '@shimmy/runtime'
import { ShimmySPAServer } from '../server'

describe('Counter Example', () => {
  let runtime: ShimmyRuntime
  let server: ShimmySPAServer

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '<div id="app"></div>'
    
    // Create runtime and server
    runtime = new ShimmyRuntime()
    server = new ShimmySPAServer()
    
    // Connect server to runtime
    server.onMessage(message => runtime.handleMessage(message))
  })

  it('should increment counter when button is clicked', async () => {
    // Send initial template
    server.sendTemplate({
      html: `
        <div>
          <p>Count: <span data-s-id="count">0</span></p>
          <button data-s-onclick="increment">Increment</button>
        </div>
      `,
      listeners: {
        increment: () => {
          const store = runtime.getStore()
          runtime.setStore({ count: (store.count || 0) + 1 })
        }
      },
      store: { count: 0 }
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