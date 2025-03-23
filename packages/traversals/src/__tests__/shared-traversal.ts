import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Traversal } from '../types'
import type { Anchor } from '../types'

interface TraversalContext {
  reference: HTMLDivElement
  parent: HTMLDivElement
  referenceIndex: number
}

function insertHtml(html: string, reference: HTMLDivElement, anchor: Anchor): void {
  if (anchor === 'parent') {
    reference.innerHTML = html
  } else {
    const fragment = document.createRange().createContextualFragment(html)
    const nodes = Array.from(fragment.childNodes)
    for (let i = nodes.length - 1; i >= 0; i--) {
      reference.parentElement?.insertBefore(nodes[i], reference)
    }
  }
}

export function createTraversalTests(implementation: (html: string) => Traversal) {
  // Helper function to run tests with different anchors


  // Helper function to run a single test with different anchors
  function testWithAnchors(name: string, testFn: (ctx: TraversalContext, anchor: Anchor) => void) {
      it<TraversalContext>(`${name} (parent anchor)`, (ctx) => testFn(ctx, 'parent'))
      it<TraversalContext>(`${name} (left anchor)`, (ctx) => testFn(ctx, ctx.referenceIndex))
  }

  beforeEach<TraversalContext>((ctx) => {
    // Create a parent with 5 divs, where our reference is the third one
    ctx.parent = document.createElement('div')
    ctx.parent.innerHTML = `
      <div>First div</div>
      <div>Second div</div>
      <div>Third div</div>
      <div>Fourth div</div>
      <div>Fifth div</div>
    `
    document.body.appendChild(ctx.parent)
    ctx.reference = ctx.parent.querySelector('div:nth-child(3)') as HTMLDivElement
    ctx.referenceIndex = Array.from(ctx.parent.childNodes).indexOf(ctx.reference)
  })

  afterEach<TraversalContext>((ctx) => {
    document.body.removeChild(ctx.parent)
  })

  testWithAnchors('should generate traversals for elements with data-s-id', (ctx, anchor) => {
    const html = `
      <div>
        <span data-s-id="foo">Foo</span>
        <span data-s-id="bar">Bar</span>
      </div>
    `
    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    // Test element paths
    expect(traversals.elementPaths.foo).toBeDefined()
    expect(traversals.elementPaths.bar).toBeDefined()
    expect(traversals.elementPaths.foo.textContent).toBe('Foo')
    expect(traversals.elementPaths.bar.textContent).toBe('Bar')
  })

  testWithAnchors('should generate traversals for elements with data-s-listener', (ctx, anchor) => {
    const html = `
      <div>
        <button data-s-listener="click:increment">Click me</button>
        <button data-s-listener="click:decrement">Click me too</button>
      </div>
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    // Test listener paths
    expect(traversals.listenerPaths).toHaveLength(2)
    expect(traversals.listenerPaths[0].getAttribute('data-s-listener')).toBe('click:increment')
    expect(traversals.listenerPaths[1].getAttribute('data-s-listener')).toBe('click:decrement')
  })

  testWithAnchors('should handle nested elements', (ctx, anchor) => {
    const html = `
      <div>
        <div data-s-id="outer">
          <span data-s-id="inner">Nested</span>
        </div>
      </div>
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    // Test nested element paths
    expect(traversals.elementPaths.outer).toBeDefined()
    expect(traversals.elementPaths.inner).toBeDefined()
    expect(traversals.elementPaths.outer.getAttribute('data-s-id')).toBe('outer')
    expect(traversals.elementPaths.inner.getAttribute('data-s-id')).toBe('inner')
  })

  testWithAnchors('should handle empty HTML', (ctx, anchor) => {
    insertHtml('', ctx.reference, anchor)
    const traversals = implementation('')(ctx.reference, anchor)
    expect(traversals.elementPaths).toEqual({})
    expect(traversals.listenerPaths).toEqual([])
  })

  testWithAnchors('should handle complex nested structures', (ctx, anchor) => {
    const html = `
      <div>
        <div>
          <span data-s-id="deep1">Deep 1</span>
          <span data-s-id="deep2">Deep 2</span>
        </div>
        <div>
          <span data-s-id="deep3">Deep 3</span>
        </div>
      </div>
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    expect(traversals.elementPaths.deep1.textContent).toBe('Deep 1')
    expect(traversals.elementPaths.deep2.textContent).toBe('Deep 2')
    expect(traversals.elementPaths.deep3.textContent).toBe('Deep 3')
  })

  testWithAnchors('should handle multiple listeners on a single element', (ctx, anchor) => {
    const html = `
      <div>
        <button 
          data-s-id="multi-button"
          data-s-listener="click:onClick mouseenter:onEnter mouseleave:onLeave"
        >
          Multiple Listeners
        </button>
      </div>
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    const element = traversals.elementPaths['multi-button']
    const listeners = element.getAttribute('data-s-listener')?.split(' ') || []
    
    expect(listeners).toContain('click:onClick')
    expect(listeners).toContain('mouseenter:onEnter')
    expect(listeners).toContain('mouseleave:onLeave')

    expect(traversals.listenerPaths).toHaveLength(1)
    expect(traversals.listenerPaths[0]).toBe(element)
  })

  testWithAnchors('should handle data-s-id on top-level element', (ctx, anchor) => {
    const html = `
      <div data-s-id="top-level">
        <span>Inner content</span>
      </div>
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    expect(traversals.elementPaths['top-level']).toBeDefined()
    expect(traversals.elementPaths['top-level'].getAttribute('data-s-id')).toBe('top-level')
  })

  testWithAnchors('should handle data-s-listener on top-level element', (ctx, anchor) => {
    const html = `
      <div data-s-listener="click:topClick">
        <span>Inner content</span>
      </div>
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    expect(traversals.listenerPaths).toHaveLength(1)
    expect(traversals.listenerPaths[0].getAttribute('data-s-listener')).toBe('click:topClick')
  })

  testWithAnchors('should handle both data-s-id and data-s-listener on top-level element', (ctx, anchor) => {
    const html = `
      <div data-s-id="top" data-s-listener="click:topClick mouseenter:topHover">
        <span>Inner content</span>
      </div>
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    const topElement = traversals.elementPaths['top']
    expect(topElement).toBeDefined()
    expect(topElement.getAttribute('data-s-id')).toBe('top')
    expect(topElement.getAttribute('data-s-listener')).toBe('click:topClick mouseenter:topHover')
    
    expect(traversals.listenerPaths).toHaveLength(1)
    expect(traversals.listenerPaths[0]).toBe(topElement)
  })

  testWithAnchors('should handle template with no enclosing element', (ctx, anchor) => {
    const html = `
      Hello <span data-s-id="greeting">World</span>!
      <button data-s-listener="click:greet">Click me</button>
      <span data-s-id="farewell">Goodbye</span> World
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    // Test element paths
    expect(traversals.elementPaths.greeting).toBeDefined()
    expect(traversals.elementPaths.farewell).toBeDefined()
    expect(traversals.elementPaths.greeting.textContent).toBe('World')
    expect(traversals.elementPaths.farewell.textContent).toBe('Goodbye')

    // Test listener paths
    expect(traversals.listenerPaths).toHaveLength(1)
    expect(traversals.listenerPaths[0].getAttribute('data-s-listener')).toBe('click:greet')
  })

  testWithAnchors('should handle template starting with text node', (ctx, anchor) => {
    const html = `
      Welcome to <span data-s-id="app-name">Shimmy</span>
      <div data-s-id="nav" data-s-listener="mouseenter:showMenu">
        <button data-s-listener="click:login">Login</button>
      </div>
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    // Test element paths
    expect(traversals.elementPaths['app-name']).toBeDefined()
    expect(traversals.elementPaths.nav).toBeDefined()
    expect(traversals.elementPaths['app-name'].textContent).toBe('Shimmy')

    // Test listener paths
    expect(traversals.listenerPaths).toHaveLength(2)
    expect(traversals.listenerPaths[0].getAttribute('data-s-listener')).toBe('mouseenter:showMenu')
    expect(traversals.listenerPaths[1].getAttribute('data-s-listener')).toBe('click:login')
  })

  testWithAnchors('should handle template ending with text node', (ctx, anchor) => {
    const html = `
      <div data-s-id="header" data-s-listener="click:toggle">
        <h1>Welcome</h1>
      </div>
      <p>This is a paragraph with <span data-s-id="highlight">important</span> text.</p>
      Thanks for visiting!
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    // Test element paths
    expect(traversals.elementPaths.header).toBeDefined()
    expect(traversals.elementPaths.highlight).toBeDefined()
    expect(traversals.elementPaths.highlight.textContent).toBe('important')

    // Test listener paths
    expect(traversals.listenerPaths).toHaveLength(1)
    expect(traversals.listenerPaths[0].getAttribute('data-s-listener')).toBe('click:toggle')
  })

  testWithAnchors('kitchen sink', (ctx, anchor) => {
    const html = `
      <div class="app">
        <nav>
          <div data-s-id="multi-listener" data-s-listener="mouseenter:highlight mouseleave:unhighlight click:select">
            <button data-s-id="deep-button" data-s-listener="click:deepAction mouseenter:deepHover">
              Deep Button
            </button>
          </div>
        </nav>
        <main>
          <div data-s-id="content">
            <h1>Welcome</h1>
            <p>Content goes here</p>
          </div>
        </main>
        <footer>
          <div data-s-id="footer-signup" data-s-listener="click:subscribe mouseenter:showTooltip">
            Sign up for updates
          </div>
        </footer>
      </div>
    `

    insertHtml(html, ctx.reference, anchor)
    const traversals = implementation(html)(ctx.reference, anchor)

    // Check element paths
    const elements = ['multi-listener', 'deep-button', 'content', 'footer-signup']
    elements.forEach(id => {
      const element = traversals.elementPaths[id]
      expect(element).toBeTruthy()
      expect(element.getAttribute('data-s-id')).toBe(id)
    })

    // Count total listeners (3 elements with listeners)
    expect(traversals.listenerPaths).toHaveLength(3)

    // Verify each listener element exists and has correct attributes
    const multiListener = traversals.elementPaths['multi-listener']
    const multiListeners = multiListener.getAttribute('data-s-listener')?.split(' ') || []
    expect(multiListeners).toContain('mouseenter:highlight')
    expect(multiListeners).toContain('mouseleave:unhighlight')
    expect(multiListeners).toContain('click:select')

    const deepButton = traversals.elementPaths['deep-button']
    const deepListeners = deepButton.getAttribute('data-s-listener')?.split(' ') || []
    expect(deepListeners).toContain('click:deepAction')
    expect(deepListeners).toContain('mouseenter:deepHover')

    const footerSignup = traversals.elementPaths['footer-signup']
    const footerListeners = footerSignup.getAttribute('data-s-listener')?.split(' ') || []
    expect(footerListeners).toContain('click:subscribe')
    expect(footerListeners).toContain('mouseenter:showTooltip')
  })
} 