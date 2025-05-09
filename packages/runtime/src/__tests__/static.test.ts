import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Template, RuntimeOptions } from '../types';
import { ShimmyRuntime } from '../runtime';
import { traverseHTML } from '@shimmy/traversals';

interface StaticContext {
  options: RuntimeOptions;
  reference: Element;
  runtime: ShimmyRuntime;
}

describe('Static Runtime', () => {
  beforeEach<StaticContext>(ctx => {
    // Set up DOM
    document.body.innerHTML = '<div id="app"></div>';
    ctx.reference = document.querySelector('#app')!;
    ctx.options = { inDom: false };
    ctx.runtime = new ShimmyRuntime(ctx.options);
  });

  afterEach<StaticContext>(() => {
    document.body.innerHTML = '';
  });

  it<StaticContext>('should mount HTML and handle DOM events', ctx => {
    const html =
      '<div data-s-id="counter">0</div><button data-s-listener="click:increment">Click me</button>';

    const template: Template = {
      id: 'counter-template',
      html,
      traversal: traverseHTML(html),
      domListeners: {
        increment: {
          handler: (stores /* event */) => {
            stores.counterStore.count++;
          },
          stores: new Set(['counterStore']),
        },
      },
      storeListeners: [
        {
          stores: new Set(['counterStore']),
          handler: (elements, stores) => {
            elements.counter.textContent = String(stores.counterStore.count);
          },
        },
      ],
      stores: { counterStore: { count: 0 } },
    };

    ctx.runtime.registerTemplate(template);
    ctx.runtime.actualizeTemplate('counter-template', { type: 'parent', element: ctx.reference });

    // Check initial state
    expect(document.querySelector('#app')?.innerHTML).toBe(template.html);
    expect(document.querySelector('[data-s-id="counter"]')?.textContent).toBe('0');

    // Simulate click
    const button = document.querySelector('button') as HTMLButtonElement;
    button?.click();

    // Check updated state
    expect(document.querySelector('[data-s-id="counter"]')?.textContent).toBe('1');
  });

  it<StaticContext>('should handle store listeners with inDom flag and element paths', ctx => {
    let value = 0;
    let inDomValue = false;
    let elementsValue: Record<string, Element> = {};

    const html =
      '<div data-s-id="counter">Hello World</div><button data-s-listener="click:increment">Click me</button>';

    const template: Template = {
      id: 'counter-template',
      html,
      traversal: traverseHTML(html),
      domListeners: {
        increment: {
          handler: stores => {
            stores.counterStore.count++;
          },
          stores: new Set(['counterStore']),
        },
      },
      storeListeners: [
        {
          stores: new Set(['counterStore']),
          handler: (elements, stores, inDom) => {
            value = stores.counterStore.count;
            inDomValue = inDom;
            elementsValue = elements;
          },
        },
      ],
      stores: { counterStore: { count: 0 } },
    };

    ctx.runtime.registerTemplate(template);
    ctx.runtime.actualizeTemplate('counter-template', { type: 'parent', element: ctx.reference });
    expect(value).toBe(0);
    expect(inDomValue).toBe(false);
    expect(elementsValue.counter).toBeDefined();
    expect(elementsValue.counter?.textContent).toBe('Hello World');

    // Update stores via click
    const button = document.querySelector('button') as HTMLButtonElement;
    button?.click();
    expect(value).toBe(1);
    expect(inDomValue).toBe(false);
    expect(elementsValue.counter).toBeDefined();
    expect(elementsValue.counter?.textContent).toBe('Hello World');

    // Update again
    button?.click();
    expect(value).toBe(2);
    expect(inDomValue).toBe(false);
    expect(elementsValue.counter).toBeDefined();
    expect(elementsValue.counter?.textContent).toBe('Hello World');
  });

  it<StaticContext>('should handle multiple stores and listeners', ctx => {
    let value = 0;
    let inDomValue = false;
    let elementsValue: Record<string, Element> = {};

    const html = `
      <div data-s-id="display">0</div>
      <button data-s-listener="click:incrementCount">Increment Count</button>
      <button data-s-listener="click:incrementMultiplier">Increment Multiplier</button>
    `;

    const template: Template = {
      id: 'calculator-template',
      html,
      traversal: traverseHTML(html),
      domListeners: {
        incrementCount: {
          handler: stores => {
            stores.counterStore.count++;
          },
          stores: new Set(['counterStore']),
        },
        incrementMultiplier: {
          handler: stores => {
            stores.multiplierStore.multiplier++;
          },
          stores: new Set(['multiplierStore']),
        },
      },
      storeListeners: [
        {
          stores: new Set(['counterStore', 'multiplierStore']),
          handler: (elements, stores, inDom) => {
            value = stores.counterStore.count * stores.multiplierStore.multiplier;
            inDomValue = inDom;
            elementsValue = elements;
            elements.display.textContent = String(value);
          },
        },
      ],
      stores: {
        counterStore: { count: 0 },
        multiplierStore: { multiplier: 1 },
      },
    };

    ctx.runtime.registerTemplate(template);
    ctx.runtime.actualizeTemplate('calculator-template', {
      type: 'parent',
      element: ctx.reference,
    });
    expect(value).toBe(0);
    expect(inDomValue).toBe(false);
    expect(elementsValue.display).toBeDefined();
    expect(elementsValue.display?.textContent).toBe('0');

    // Update one store - listener should not fire
    const countButton = document.querySelector(
      '[data-s-listener="click:incrementCount"]'
    ) as HTMLButtonElement;
    countButton?.click();
    expect(value).toBe(1);
    expect(inDomValue).toBe(false);
    expect(elementsValue.display).toBeDefined();
    expect(elementsValue.display?.textContent).toBe('1');

    // Update both stores - listener should fire
    const multiplierButton = document.querySelector(
      '[data-s-listener="click:incrementMultiplier"]'
    ) as HTMLButtonElement;
    multiplierButton?.click();
    expect(value).toBe(2);
    expect(inDomValue).toBe(false);
    expect(elementsValue.display).toBeDefined();
    expect(elementsValue.display?.textContent).toBe('2');
  });

  it<StaticContext>('should handle template without enclosing element', ctx => {
    let value = 0;

    const html = `
      Hello <span data-s-id="greeting">World</span>!
      <button data-s-listener="click:greet">Click me</button>
      <span data-s-id="farewell">Goodbye</span> World
    `;

    const template: Template = {
      id: 'greeting-template',
      html,
      traversal: traverseHTML(html),
      domListeners: {
        greet: {
          handler: stores => {
            stores.uiStore.isGreeting = true;
          },
          stores: new Set(['uiStore']),
        },
      },
      storeListeners: [
        {
          stores: new Set(['uiStore']),
          handler: (elements, stores) => {
            value = stores.uiStore.isGreeting ? 1 : 0;
            elements.farewell.textContent = value ? 'Logged in!' : 'Not logged in';
          },
        },
      ],
      stores: { uiStore: { isGreeting: false } },
    };

    ctx.runtime.registerTemplate(template);
    ctx.runtime.actualizeTemplate('greeting-template', { type: 'parent', element: ctx.reference });
    expect(value).toBe(0);
    expect(document.querySelector('[data-s-id="farewell"]')?.textContent).toBe('Not logged in');

    // Click greet
    const button = document.querySelector('button') as HTMLButtonElement;
    button?.click();
    expect(value).toBe(1);
    expect(document.querySelector('[data-s-id="farewell"]')?.textContent).toBe('Logged in!');
  });
});
