import { Runtime, RuntimeOptions, Template, RuntimeState } from './types';
import { Reference } from '@shimmy/traversals';
import { produceWithPatches, enablePatches, Patch } from 'immer';
import { RegionInfo } from 'packages/traversals/src/types';

enablePatches();

const getLeftmostNode = (reference: Reference): Node => {
  if (reference.type === 'node-neighbor') {
    return reference.element;
  } else if (reference.type === 'region-neighbor') {
    if (reference.leftmostNode) {
      return reference.leftmostNode;
    } else {
      return getLeftmostNode(reference.element);
    }
  }
  // it must be a parent reference
  // in which case it is a programming error
  throw new Error('Parent reference does not have a leftmost node');
};

function insertHtml(html: string, reference: Reference): [Node | null, Node | null] {
  const fragment = document.createRange().createContextualFragment(html);
  const firstNode = fragment.firstChild;
  const lastNode = fragment.lastChild;

  const nodes = Array.from(fragment.childNodes);
  const eltToUse =
    reference.type === 'parent'
      ? reference.element
      : reference.type === 'node-neighbor'
        ? reference.element
        : getLeftmostNode(reference.element);
  for (let i = 0; i < nodes.length; i++) {
    if (reference.type === 'parent') {
      eltToUse.appendChild(nodes[i]);
    } else if (reference.type === 'node-neighbor') {
      eltToUse.parentNode?.insertBefore(nodes[i], eltToUse);
    } else if (reference.type === 'region-neighbor') {
      eltToUse.insertBefore(nodes[i], eltToUse);
    }
  }

  return [firstNode, lastNode];
}

export class ShimmyRuntime implements Runtime {
  private options: RuntimeOptions;
  private state: RuntimeState;

  constructor(options: RuntimeOptions = { inDom: false }) {
    this.options = options;
    this.state = {
      templates: {},
      actualizedTemplates: {},
      dynamicMap: {},
    };
  }

  private respondToPatches(patches: readonly Patch[]) {}

  private invokeDomListener(handler: Function, event: Event) {
    const [nextState, patches] = produceWithPatches(this.state.stores, draft => {
      handler(draft, event);
    });
    this.state.stores = nextState;
    this.respondToPatches(patches);
  }

  private invokeStoreListener(handler: Function, elements: Record<string, Element>): void {
    const [nextState, patches] = produceWithPatches(this.state.stores, draft => {
      handler(elements, draft, this.options.inDom);
    });
    this.state.stores = nextState;
    this.respondToPatches(patches);
  }

  // register a template for actualization
  // templates can be actualized multiple times
  registerTemplate(template: Template): void {
    this.state.templates[template.id] = template;
  }

  // actualize a registered template
  // templateId is the id of the template to actualize
  // reference tells us where to insert the template in the DOM
  actualizeTemplate(templateId: string, reference: Reference): void {
    // Register template and get its leftmost element
    const template = this.state.templates[templateId];
    const [leftInnerBound, rightInnerBound] = insertHtml(template.html, reference);
    this.state.actualizedTemplates[template.id] = {
      leftInnerBound,
      rightInnerBound,
      regions: {},
      stores: template.stores,
      rightOuterBound: rightInnerBound?.nextSibling ?? null,
      parent: rightInnerBound?.parentElement ?? null,
    };

    // Get element and listener paths
    const { elementPaths, listenerPaths } = leftInnerBound
      ? template.traversal(leftInnerBound)
      : { elementPaths: {}, listenerPaths: [] };

    // Create listener paths
    const domListeners: Record<string, (event: Event) => void> = {};
    for (const element of listenerPaths) {
      const listenAttr = element.getAttribute('data-s-listener');
      if (!listenAttr) continue;

      const [event, id] = listenAttr.split(':');
      if (!event || !id || !template.domListeners[id]) continue;

      const handler = template.domListeners[id];
      // each handler gets resolved stores
      // the stores in the handler are in the form 'foo.bar.baz$raz$.maz$faz'
      // the period separator indicates that the path is present in the actualized templates
      // for example
      // - foo
      // - foo.bar
      // - foo.bar.baz
      // will all be present
      domListeners[id] = (event: Event) => {
        this.invokeDomListener(handler.handler, event);
        // Call store listeners
        for (const listener of template.storeListeners) {
          const shouldCall = Array.from(listener.stores).some(store => handler.stores.has(store));
          if (shouldCall) {
            this.invokeStoreListener(listener.handler, elementPaths);
          }
        }
      };
      element.addEventListener(event, domListeners[id]);
    }

    // Call store listeners
    for (const listener of template.storeListeners) {
      this.invokeStoreListener(listener.handler, elementPaths);
    }
  }
}
