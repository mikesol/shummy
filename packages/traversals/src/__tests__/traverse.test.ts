import { it, expect, beforeEach, afterEach } from 'vitest'
import type { Position } from '../types'
import { traverseHTML } from '../index'
interface TraversalContext {
  parent: HTMLDivElement
  referenceIndex: number
}

function insertHtml(html: string, reference: HTMLDivElement, anchor: Position): Node {
  const fragment = document.createRange().createContextualFragment(html)
  const nodes = Array.from(fragment.childNodes)
  const anchorNode = reference.childNodes[anchor]
  for (let i = 0; i < nodes.length; i++) {
    reference.insertBefore(nodes[i], anchorNode)
  }
  return nodes[0]
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
  const reference = ctx.parent.querySelector('div:nth-child(3)') as HTMLDivElement
  ctx.referenceIndex = Array.from(ctx.parent.childNodes).indexOf(reference)
})

afterEach<TraversalContext>((ctx) => {
  document.body.removeChild(ctx.parent)
})

it<TraversalContext>('should generate traversals for elements with data-s-id', (ctx) => {
  const html = `
      <div>
        <span data-s-id="foo">Foo</span>
        <span data-s-id="bar">Bar</span>
      </div>
    `
  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test element paths
  expect(traversals.elementPaths.foo).toBeDefined()
  expect(traversals.elementPaths.bar).toBeDefined()
  expect(traversals.elementPaths.foo.textContent).toBe('Foo')
  expect(traversals.elementPaths.bar.textContent).toBe('Bar')
})

it<TraversalContext>('should generate traversals for elements with data-s-listener', (ctx) => {
  const html = `
      <div>
        <button data-s-listener="click:increment">Click me</button>
        <button data-s-listener="click:decrement">Click me too</button>
      </div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test listener paths
  expect(traversals.listenerPaths).toHaveLength(2)
  expect(traversals.listenerPaths[0].getAttribute('data-s-listener')).toBe('click:increment')
  expect(traversals.listenerPaths[1].getAttribute('data-s-listener')).toBe('click:decrement')
})

it<TraversalContext>('should handle nested elements', (ctx) => {
  const html = `
      <div>
        <div data-s-id="outer">
          <span data-s-id="inner">Nested</span>
        </div>
      </div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test nested element paths
  expect(traversals.elementPaths.outer).toBeDefined()
  expect(traversals.elementPaths.inner).toBeDefined()
  expect(traversals.elementPaths.outer.getAttribute('data-s-id')).toBe('outer')
  expect(traversals.elementPaths.inner.getAttribute('data-s-id')).toBe('inner')
})

it<TraversalContext>('should handle empty HTML', (ctx) => {
  const node = insertHtml('', ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML('')(node)
  expect(traversals.elementPaths).toEqual({})
  expect(traversals.listenerPaths).toEqual([])
})

it<TraversalContext>('should handle complex nested structures', (ctx) => {
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

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  expect(traversals.elementPaths.deep1.textContent).toBe('Deep 1')
  expect(traversals.elementPaths.deep2.textContent).toBe('Deep 2')
  expect(traversals.elementPaths.deep3.textContent).toBe('Deep 3')
})

it<TraversalContext>('should handle multiple listeners on a single element', (ctx) => {
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

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  const element = traversals.elementPaths['multi-button']
  const listeners = element.getAttribute('data-s-listener')?.split(' ') || []

  expect(listeners).toContain('click:onClick')
  expect(listeners).toContain('mouseenter:onEnter')
  expect(listeners).toContain('mouseleave:onLeave')

  expect(traversals.listenerPaths).toHaveLength(1)
  expect(traversals.listenerPaths[0]).toBe(element)
})

it<TraversalContext>('should handle data-s-id on top-level element', (ctx) => {
  const html = `
      <div data-s-id="top-level">
        <span>Inner content</span>
      </div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  expect(traversals.elementPaths['top-level']).toBeDefined()
  expect(traversals.elementPaths['top-level'].getAttribute('data-s-id')).toBe('top-level')
})

it<TraversalContext>('should handle data-s-listener on top-level element', (ctx) => {
  const html = `
      <div data-s-listener="click:topClick">
        <span>Inner content</span>
      </div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  expect(traversals.listenerPaths).toHaveLength(1)
  expect(traversals.listenerPaths[0].getAttribute('data-s-listener')).toBe('click:topClick')
})

it<TraversalContext>('should handle both data-s-id and data-s-listener on top-level element', (ctx) => {
  const html = `
      <div data-s-id="top" data-s-listener="click:topClick mouseenter:topHover">
        <span>Inner content</span>
      </div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  const topElement = traversals.elementPaths['top']
  expect(topElement).toBeDefined()
  expect(topElement.getAttribute('data-s-id')).toBe('top')
  expect(topElement.getAttribute('data-s-listener')).toBe('click:topClick mouseenter:topHover')

  expect(traversals.listenerPaths).toHaveLength(1)
  expect(traversals.listenerPaths[0]).toBe(topElement)
})

it<TraversalContext>('should handle template with no enclosing element', (ctx) => {
  const html = `
      Hello <span data-s-id="greeting">World</span>!
      <button data-s-listener="click:greet">Click me</button>
      <span data-s-id="farewell">Goodbye</span> World
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test element paths
  expect(traversals.elementPaths.greeting).toBeDefined()
  expect(traversals.elementPaths.farewell).toBeDefined()
  expect(traversals.elementPaths.greeting.textContent).toBe('World')
  expect(traversals.elementPaths.farewell.textContent).toBe('Goodbye')

  // Test listener paths
  expect(traversals.listenerPaths).toHaveLength(1)
  expect(traversals.listenerPaths[0].getAttribute('data-s-listener')).toBe('click:greet')
})

it<TraversalContext>('should handle template starting with text node', (ctx) => {
  const html = `
      Welcome to <span data-s-id="app-name">Shimmy</span>
      <div data-s-id="nav" data-s-listener="mouseenter:showMenu">
        <button data-s-listener="click:login">Login</button>
      </div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test element paths
  expect(traversals.elementPaths['app-name']).toBeDefined()
  expect(traversals.elementPaths.nav).toBeDefined()
  expect(traversals.elementPaths['app-name'].textContent).toBe('Shimmy')

  // Test listener paths
  expect(traversals.listenerPaths).toHaveLength(2)
  expect(traversals.listenerPaths[0].getAttribute('data-s-listener')).toBe('mouseenter:showMenu')
  expect(traversals.listenerPaths[1].getAttribute('data-s-listener')).toBe('click:login')
})

it<TraversalContext>('should handle template ending with text node', (ctx) => {
  const html = `
      <div data-s-id="header" data-s-listener="click:toggle">
        <h1>Welcome</h1>
      </div>
      <p>This is a paragraph with <span data-s-id="highlight">important</span> text.</p>
      Thanks for visiting!
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test element paths
  expect(traversals.elementPaths.header).toBeDefined()
  expect(traversals.elementPaths.highlight).toBeDefined()
  expect(traversals.elementPaths.highlight.textContent).toBe('important')

  // Test listener paths
  expect(traversals.listenerPaths).toHaveLength(1)
  expect(traversals.listenerPaths[0].getAttribute('data-s-listener')).toBe('click:toggle')
})

it<TraversalContext>('kitchen sink', (ctx) => {
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

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

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

it<TraversalContext>('should handle child that needs a parent', (ctx) => {
  const html = `
      <div><shimmy store="foo" template="baz" path="raz" as="bar" /></div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test children object
  expect(Object.keys(traversals.children)).toHaveLength(1)
  const child = traversals.children['baz']
  
  // Test all fields
  expect(child.storePath).toBe('foo')
  expect(child.pathPath).toBe('raz')
  expect(child.templatePath).toBe('baz')
  expect(child.controllerName).toBe('bar')
  expect(child.reference).toEqual({
    type: 'parent',
    element: expect.any(HTMLDivElement)
  })
})

it<TraversalContext>('should handle child that needs a node neighbor', (ctx) => {
  const html = `
      <div><shimmy store="foo" template="baz" path="raz" as="bar"></shimmy>   </div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test children object
  expect(Object.keys(traversals.children)).toHaveLength(1)
  const child = traversals.children['baz']
  
  // Test all fields
  expect(child.storePath).toBe('foo')
  expect(child.pathPath).toBe('raz')
  expect(child.templatePath).toBe('baz')
  expect(child.controllerName).toBe('bar')
  expect(child.reference).toEqual({
    type: 'node-neighbor',
    element: expect.any(Text)
  })
})

it<TraversalContext>('should handle child with element to its right', (ctx) => {
  const html = `
      <div>
        <shimmy store="foo" template="bar" path="baz" as="raz"></shimmy><span data-s-id="prefix">Hello</span>
      </div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test element path
  expect(traversals.elementPaths.prefix).toBeDefined()
  expect(traversals.elementPaths.prefix.textContent).toBe('Hello')

  // Test child
  expect(Object.keys(traversals.children)).toHaveLength(1)
  const child = traversals.children['bar']
  expect(child.storePath).toBe('foo')
  expect(child.templatePath).toBe('bar')
  expect(child.controllerName).toBe('raz')
  expect(child.reference).toEqual({
    type: 'node-neighbor',
    element: expect.any(HTMLSpanElement)
  })
})

it<TraversalContext>('should handle multiple children in sequence', (ctx) => {
  const html = `
      <div><shimmy store="foo" template="bar" path="baz" as="raz"></shimmy><shimmy store="zfoo" template="zbar" path="zbaz" as="zraz"></shimmy></div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test children object
  expect(Object.keys(traversals.children)).toHaveLength(2)
  
  const firstChild = traversals.children['bar']
  expect(firstChild.storePath).toBe('foo')
  expect(firstChild.templatePath).toBe('bar')
  expect(firstChild.controllerName).toBe('raz')
  expect(firstChild.reference).toEqual({
    type: 'child-neighbor',
    leftmostNode: null,
    element: expect.any(Object)
  })

  const secondChild = traversals.children['zbar']
  expect(secondChild.storePath).toBe('zfoo')
  expect(secondChild.templatePath).toBe('zbar')
  expect(secondChild.controllerName).toBe('zraz')
  expect(secondChild.reference).toEqual({
    type: 'parent',
    element: expect.any(HTMLDivElement)
  })
})

it<TraversalContext>('should handle complex nested structure with multiple children', (ctx) => {
  const html = `
      <div>
        <div data-s-id="header">
          Welcome <shimmy store="user" template="name" path="display" as="format"></shimmy></div>
        <div>
          <p>Your balance is <shimmy store="user" template="balance" path="format" as="format"></shimmy></p>
          <p>Last updated: <shimmy store="user" template="lastUpdate" path="format" as="format"></shimmy></p>
        </div>
        <div data-s-id="footer">
          <p>Thanks for visiting!</p>
          <p>Please <shimmy store="user" template="action" path="handle" as="handle"></shimmy> to continue</p>
        </div>
      </div>
    `

  const node = insertHtml(html, ctx.parent, ctx.referenceIndex)
  const traversals = traverseHTML(html)(node)

  // Test element paths
  expect(traversals.elementPaths.header).toBeDefined()
  expect(traversals.elementPaths.footer).toBeDefined()

  // Test children object
  expect(Object.keys(traversals.children)).toHaveLength(4)
  
  const nameChild = traversals.children['name']
  expect(nameChild.storePath).toBe('user')
  expect(nameChild.templatePath).toBe('name')
  expect(nameChild.controllerName).toBe('format')
  expect(nameChild.reference).toEqual({
    type: 'parent',
    element: expect.any(HTMLDivElement)
  })

  const balanceChild = traversals.children['balance']
  expect(balanceChild.storePath).toBe('user')
  expect(balanceChild.templatePath).toBe('balance')
  expect(balanceChild.controllerName).toBe('format')
  expect(balanceChild.reference).toEqual({
    type: 'parent',
    element: expect.any(HTMLParagraphElement)
  })

  const updateChild = traversals.children['lastUpdate']
  expect(updateChild.storePath).toBe('user')
  expect(updateChild.templatePath).toBe('lastUpdate')
  expect(updateChild.controllerName).toBe('format')
  expect(updateChild.reference).toEqual({
    type: 'parent',
    element: expect.any(HTMLParagraphElement)
  })

  const actionChild = traversals.children['action']
  expect(actionChild.storePath).toBe('user')
  expect(actionChild.templatePath).toBe('action')
  expect(actionChild.controllerName).toBe('handle')
  expect(actionChild.reference).toEqual({
    type: 'node-neighbor',
    element: expect.any(Text)
  })
})