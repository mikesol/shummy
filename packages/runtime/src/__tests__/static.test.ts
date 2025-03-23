import { describe, it, expect, beforeEach } from 'vitest'
import { Template, Message, RuntimeOptions } from '../types'
import { selectorTraverseHTML } from '@shimmy/traversals'
import { initializeTemplate } from '../initialization'

describe('Static Runtime', () => {
  let options: RuntimeOptions
  let callCount: number

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '<div id="app"></div>'
    options = { inDom: false }
    callCount = 1
  })

  it('should mount HTML and handle DOM events', () => {
    const html = '<div data-s-id="counter">0</div><button data-s-listener="click:increment">Click me</button>'
    
    const template: Template = {
      html,
      domListeners: {
        increment: {
          handler: (stores, /* event */) => {
            stores.count = (stores.count || 0) + 1
          },
          stores: new Set(['count'])
        }
      },
      storeListeners: [{
        stores: new Set(['count']),
        handler: (elements, stores) => {
          elements.counter.textContent = String(stores.count)
        }
      }],
      stores: { count: 0 },
      traversal: selectorTraverseHTML(html)
    }

    initializeTemplate(template, options, document, callCount)
    
    // Check initial state
    expect(document.querySelector('#app')?.innerHTML).toBe(template.html)
    expect(document.querySelector('[data-s-id="counter"]')?.textContent).toBe('0')

    // Simulate click
    const button = document.querySelector('button') as HTMLButtonElement
    button?.click()

    // Check updated state
    expect(document.querySelector('[data-s-id="counter"]')?.textContent).toBe('1')
  })

  it('should handle store listeners with call count, inDom flag, and element paths', () => {
    let value = 0
    let inDomValue = false
    let elementsValue: Record<string, Element> = {}
    
    const html = '<div data-s-id="counter">Hello World</div><button data-s-listener="click:increment">Click me</button>'
    
    const template: Template = {
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
        handler: (elements, stores, nCalled, inDom) => {
          value = stores.count
          inDomValue = inDom
          elementsValue = elements
        }
      }],
      stores: { count: 0 },
      traversal: selectorTraverseHTML(html)
    }

    initializeTemplate(template, options, document, callCount)
    expect(value).toBe(0)
    expect(inDomValue).toBe(false)
    expect(elementsValue.counter).toBeDefined()
    expect(elementsValue.counter?.textContent).toBe('Hello World')

    // Update stores via click
    const button = document.querySelector('button') as HTMLButtonElement
    button?.click()
    expect(value).toBe(1)
    expect(inDomValue).toBe(false)
    expect(elementsValue.counter).toBeDefined()
    expect(elementsValue.counter?.textContent).toBe('Hello World')

    // Update again
    button?.click()
    expect(value).toBe(2)
    expect(inDomValue).toBe(false)
    expect(elementsValue.counter).toBeDefined()
    expect(elementsValue.counter?.textContent).toBe('Hello World')
  })

  it('should handle multiple stores and listeners', () => {
    let value = 0
    let inDomValue = false
    let elementsValue: Record<string, Element> = {}
    
    const html = `
      <div data-s-id="display">0</div>
      <button data-s-listener="click:incrementCount">Increment Count</button>
      <button data-s-listener="click:incrementMultiplier">Increment Multiplier</button>
    `
    
    const template: Template = {
      html,
      domListeners: {
        incrementCount: {
          handler: (stores) => {
            stores.count = (stores.count || 0) + 1
          },
          stores: new Set(['count'])
        },
        incrementMultiplier: {
          handler: (stores) => {
            stores.multiplier = (stores.multiplier || 1) + 1
          },
          stores: new Set(['multiplier'])
        }
      },
      storeListeners: [{
        stores: new Set(['count', 'multiplier']),
        handler: (elements, stores, nCalled, inDom) => {
          value = stores.count * stores.multiplier
          inDomValue = inDom
          elementsValue = elements
          elements.display.textContent = String(value)
        }
      }],
      stores: { count: 0, multiplier: 1 },
      traversal: selectorTraverseHTML(html)
    }

    initializeTemplate(template, options, document, callCount)
    expect(value).toBe(0)
    expect(inDomValue).toBe(false)
    expect(elementsValue.display).toBeDefined()
    expect(elementsValue.display?.textContent).toBe('0')

    // Update one store - listener should not fire
    const countButton = document.querySelector('[data-s-listener="click:incrementCount"]') as HTMLButtonElement
    countButton?.click()
    expect(value).toBe(1)
    expect(inDomValue).toBe(false)
    expect(elementsValue.display).toBeDefined()
    expect(elementsValue.display?.textContent).toBe('1')

    // Update both stores - listener should fire
    const multiplierButton = document.querySelector('[data-s-listener="click:incrementMultiplier"]') as HTMLButtonElement
    multiplierButton?.click()
    expect(value).toBe(2)
    expect(inDomValue).toBe(false)
    expect(elementsValue.display).toBeDefined()
    expect(elementsValue.display?.textContent).toBe('2')
  })

  it('should respect inDom setting from constructor', () => {
    const domOptions = { inDom: true }
    let inDomValue = false
    let elementsValue: Record<string, Element> = {}
    
    const html = '<div data-s-id="test">Hello World</div><button data-s-listener="click:increment">Click me</button>'
    
    const template: Template = {
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
        handler: (elements, stores, nCalled, inDom) => {
          inDomValue = inDom
          elementsValue = elements
        }
      }],
      stores: { count: 0 },
      traversal: selectorTraverseHTML(html)
    }

    initializeTemplate(template, domOptions, document, callCount)
    const button = document.querySelector('button') as HTMLButtonElement
    button?.click()
    expect(inDomValue).toBe(true)
    expect(elementsValue.test).toBeDefined()
    expect(elementsValue.test?.textContent).toBe('Hello World')
  })

  it('should handle template without enclosing element', () => {
    let value = 0
    
    const html = `
      Welcome to <span data-s-id="app-name">Shimmy</span>!
      <div data-s-id="nav" data-s-listener="mouseenter:showMenu">
        <button data-s-listener="click:login">Login</button>
      </div>
      <p>This is a paragraph with <span data-s-id="highlight">important</span> text.</p>
    `
    
    const template: Template = {
      html,
      domListeners: {
        showMenu: {
          handler: (stores) => {
            stores.menuVisible = true
          },
          stores: new Set(['menuVisible'])
        },
        login: {
          handler: (stores) => {
            stores.isLoggedIn = true
          },
          stores: new Set(['isLoggedIn'])
        }
      },
      storeListeners: [{
        stores: new Set(['menuVisible', 'isLoggedIn']),
        handler: (elements, stores, nCalled) => {
          value = stores.menuVisible && stores.isLoggedIn ? 1 : 0
          elements.highlight.textContent = value ? 'Logged in!' : 'Not logged in'
        }
      }],
      stores: { menuVisible: false, isLoggedIn: false },
      traversal: selectorTraverseHTML(html)
    }

    initializeTemplate(template, options, document, callCount)
    expect(value).toBe(0)
    expect(document.querySelector('[data-s-id="highlight"]')?.textContent).toBe('Not logged in')

    // Hover over nav
    const nav = document.querySelector('[data-s-id="nav"]') as HTMLElement
    nav?.dispatchEvent(new MouseEvent('mouseenter'))
    expect(value).toBe(0)
    expect(document.querySelector('[data-s-id="highlight"]')?.textContent).toBe('Not logged in')

    // Click login
    const loginButton = document.querySelector('[data-s-listener="click:login"]') as HTMLButtonElement
    loginButton?.click()
    expect(value).toBe(1)
    expect(document.querySelector('[data-s-id="highlight"]')?.textContent).toBe('Logged in!')
  })
}) 