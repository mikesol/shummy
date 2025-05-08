import type { Traversal, RegionWithoutReference, Position, RegionInfo } from './types';

interface DownInstruction {
  type: 'down';
}

interface OverInstruction {
  type: 'over';
}

interface ForkInstruction {
  type: 'fork';
  instructions: Instruction[][];
}

type TakeElementInstruction = {
  type: 'take-element';
  id: string;
};

type TakeListenerInstruction = {
  type: 'take-listener';
};

type TakeChildInstruction = {
  type: 'take-child';
  store: string;
  key: string;
  template: string;
};

type Instruction =
  | DownInstruction
  | OverInstruction
  | ForkInstruction
  | TakeElementInstruction
  | TakeListenerInstruction
  | TakeChildInstruction;

const walker = (node: Node): Instruction[][] => {
  const output: Instruction[][] = [];
  if (node instanceof Element) {
    if (node.hasAttribute('data-s-id')) {
      const id = node.getAttribute('data-s-id')!;
      output.push([
        {
          type: 'take-element',
          id,
        },
      ]);
    }
    if (node.hasAttribute('data-s-listener')) {
      output.push([
        {
          type: 'take-listener',
        },
      ]);
    }
    if (node.tagName.toLowerCase() === 'shimmy') {
      const store = node.getAttribute('store')!;
      const key = node.getAttribute('key')!;
      const template = node.getAttribute('template')!;
      output.push([
        {
          type: 'take-child',
          store,
          key,
          template,
        },
      ]);
    }
  }
  const sibling = node.nextSibling;
  if (sibling) {
    const res = walker(sibling);
    if (res.length === 1) {
      output.push([{ type: 'over' as const }, ...res[0]]);
    } else if (res.length !== 0) {
      output.push([{ type: 'over' as const }, { type: 'fork' as const, instructions: res }]);
    }
  }
  const firstChild = node.firstChild;
  if (firstChild && !(node instanceof Element && node.tagName.toLowerCase() === 'shimmy')) {
    const res = walker(firstChild);
    if (res.length === 1) {
      output.push([{ type: 'down' as const }, ...res[0]]);
    } else if (res.length !== 0) {
      output.push([{ type: 'down' as const }, { type: 'fork' as const, instructions: res }]);
    }
  }
  return output;
};

export function traverseHTML(html: string): Traversal {
  // first, parse html into a framgment
  const fragment = new DOMParser().parseFromString(html, 'text/html');
  const root = fragment.body;

  // then, parse the fragment into a tree of instructions
  const instructionsWithOffset: Instruction[][] = root.firstChild ? walker(root.firstChild) : [];
  return (root: Node) => {
    const elementPaths: Record<string, Element> = {};
    const listenerPaths: Element[] = [];
    const childrenWithoutReference: RegionWithoutReference[] = [];
    const children: Record<string, RegionInfo> = {};
    const traverser = (current: Node, instruction: Instruction[]) => {
      for (const step of instruction) {
        if (step.type === 'down') {
          if (!current.firstChild) {
            throw new Error('Down instruction but no child found');
          }
          current = current.firstChild;
        } else if (step.type === 'over') {
          if (!current.nextSibling) {
            throw new Error('Over instruction but no sibling found');
          }
          current = current.nextSibling;
        } else if (step.type === 'fork') {
          for (const fork of step.instructions) {
            traverser(current, fork);
          }
        } else if (step.type === 'take-element') {
          if (!(current instanceof Element)) {
            throw new Error('Take element instruction but current node is not an element');
          }
          elementPaths[step.id] = current;
        } else if (step.type === 'take-listener') {
          if (!(current instanceof Element)) {
            throw new Error('Take listener instruction but current node is not an element');
          }
          listenerPaths.push(current);
        } else if (step.type === 'take-child') {
          if (!(current instanceof Element)) {
            throw new Error('Take child instruction but current node is not an element');
          }
          childrenWithoutReference.push({
            store: step.store,
            key: step.key,
            template: step.template,
            placeholder: current,
          });
        }
      }
    };

    for (const instruction of instructionsWithOffset) {
      traverser(root, instruction);
    }

    for (let i = childrenWithoutReference.length - 1; i >= 0; i--) {
      const currentNode = childrenWithoutReference[i];
      const nextSibling = currentNode.placeholder.nextSibling;
      if (!nextSibling) {
        children[currentNode.template] = {
          ...currentNode,
          reference: {
            type: 'parent',
            element: currentNode.placeholder.parentElement!,
          },
        };
        continue;
      }
      // as a default, do a node neighbor reference
      children[currentNode.template] = {
        ...currentNode,
        reference: {
          type: 'node-neighbor',
          element: nextSibling,
        },
      };
      // then, check if any of the textNode in childrenWithoutReference are the next sibling
      for (let j = 0; j < childrenWithoutReference.length; j++) {
        const otherNode = childrenWithoutReference[j];
        if (otherNode.placeholder === nextSibling) {
          children[currentNode.template] = {
            ...currentNode,
            reference: {
              type: 'region-neighbor',
              leftmostNode: null,
              element: children[otherNode.template].reference,
            },
          };
          break;
        }
      }
    }

    // remove children from the dom
    for (const child of childrenWithoutReference) {
      child.placeholder.remove();
    }

    return {
      elementPaths,
      listenerPaths,
      children,
    };
  };
}
