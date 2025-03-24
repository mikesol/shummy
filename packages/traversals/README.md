# Traversals

This package provides utilities for traversing HTML and extracting information about elements, listeners, and children.

## Usage

```typescript
import { traverseHTML } from '@shimmy/traversals';

const html = `
  <div>
    <span data-s-id="greeting">Hello</span>
    <button data-s-listener="click:increment">Click me</button>
    <shimmy store="user" template="name" path="display" as="format" />
  </div>
`;

const traversal = traverseHTML(html);
const result = traversal(rootElement, position);
```

## Features

### Element Paths

Elements with `data-s-id` attributes are collected in `elementPaths`:

```html
<span data-s-id="greeting">Hello</span>
```

### Listener Paths

Elements with `data-s-listener` attributes are collected in `listenerPaths`:

```html
<button data-s-listener="click:increment">Click me</button>
```

### Children

Children are specified using the `<shimmy>` element with the following attributes:

- `store`: The store path (e.g. "user")
- `template`: The template path (e.g. "name")
- `path`: The path in the store (e.g. "display")
- `as`: The controller name (e.g. "format")

```html
<shimmy store="user" template="name" path="display" as="format" />
```

Children can be placed anywhere in the DOM and will be processed in order. They can have different reference types:

- `parent`: When it's the last child in its container
- `node-neighbor`: When it has a non-child sibling
- `child-neighbor`: When it has another child as its next sibling
