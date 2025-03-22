import type { Traversal, Traversals } from './types'

type TraversalStep = 
  | { type: 'takeChild'; index: number }
  | { type: 'takeSibling'; index: number }
  | { type: 'takeParent' }

type PathFork = {
  id?: string
  steps: TraversalStep[]
  forks: PathFork[]
}

type PathEntry = [string | undefined, TraversalStep[]]

function findTraversalPath(root: Element, target: Element): TraversalStep[] {
  const steps: TraversalStep[] = []
  let current = target

  while (current !== root) {
    const parent = current.parentElement
    if (!parent) break

    const siblings = Array.from(parent.children)
    const index = siblings.indexOf(current)
    if (index === -1) break

    steps.unshift({ type: 'takeChild', index })
    current = parent
  }

  return steps
}

function traverseElement(root: Element, steps: TraversalStep[]): Element {
  let current = root
  for (const step of steps) {
    switch (step.type) {
      case 'takeChild':
        current = current.children[step.index]
        break
      case 'takeSibling':
        current = current.parentElement?.children[step.index] || current
        break
      case 'takeParent':
        current = current.parentElement || current
        break
    }
  }
  return current
}

function buildPathTree(root: Element): PathFork {
  const elementPaths: Record<string, TraversalStep[]> = {}
  const listenerElements: Array<{steps: TraversalStep[], listeners: string[]}> = []

  // Find elements with data-s-id
  const elements = root.querySelectorAll('[data-s-id]')
  elements.forEach(element => {
    const id = element.getAttribute('data-s-id')!
    elementPaths[id] = findTraversalPath(root, element)
  })

  // Find elements with data-s-listener
  const listeners = root.querySelectorAll('[data-s-listener]')
  listeners.forEach(element => {
    const steps = findTraversalPath(root, element)
    const listenerStr = element.getAttribute('data-s-listener')!
    const listenerList = listenerStr.split(' ')
    listenerElements.push({ steps, listeners: listenerList })
  })

  // Build a tree structure by finding common paths
  const paths: PathEntry[] = [
    ...Object.entries(elementPaths),
    ...listenerElements.map(({ steps }) => [undefined, steps] as PathEntry)
  ]
  const tree: PathFork = { steps: [], forks: [] }

  // Sort paths by length to process shorter paths first
  paths.sort(([, a], [, b]) => a.length - b.length)

  for (const [id, steps] of paths) {
    let current = tree
    let i = 0

    // Find the longest common path
    while (i < steps.length && i < current.steps.length) {
      if (JSON.stringify(steps[i]) !== JSON.stringify(current.steps[i])) {
        break
      }
      i++
    }

    // If we found a common path, create a fork
    if (i > 0) {
      const commonPath = steps.slice(0, i)
      const remainingPath = steps.slice(i)

      // Find or create a fork with the common path
      let fork = current.forks.find(f => 
        JSON.stringify(f.steps) === JSON.stringify(commonPath)
      )

      if (!fork) {
        fork = { steps: commonPath, forks: [] }
        current.forks.push(fork)
      }

      // Add the remaining path as a new fork
      if (remainingPath.length > 0) {
        fork.forks.push({
          id,
          steps: remainingPath,
          forks: []
        })
      }
    } else {
      // No common path, add as a new fork
      current.forks.push({
        id,
        steps,
        forks: []
      })
    }
  }

  return tree
}

function traverseTree(root: Element, tree: PathFork): { elementPaths: Record<string, Element>, listenerPaths: Element[] } {
  const elementPaths: Record<string, Element> = {}
  const listenerPaths: Element[] = []

  function traverseFork(element: Element, fork: PathFork) {
    // Traverse the common path
    const current = traverseElement(element, fork.steps)

    // Process each fork
    for (const subFork of fork.forks) {
      if (subFork.id) {
        // This is an element with an ID
        elementPaths[subFork.id] = traverseElement(current, subFork.steps)
      } else {
        // This is a listener element
        listenerPaths.push(traverseElement(current, subFork.steps))
      }

      // Recursively process any nested forks
      if (subFork.forks.length > 0) {
        traverseFork(current, subFork)
      }
    }
  }

  traverseFork(root, tree)
  return { elementPaths, listenerPaths }
}

export function traverseHTML(html: string): Traversal {
  const container = document.createElement('div')
  container.innerHTML = html
  const tree = buildPathTree(container)
  
  return (element: Element) => {
    return traverseTree(element, tree)
  }
} 
