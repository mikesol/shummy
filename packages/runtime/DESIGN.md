# Design

```ts
export interface ParentReference {
  type: 'parent';
  element: Element;
}

export interface NodeNeighborReference {
  type: 'node-neighbor';
  element: Node;
}

export interface ChildNeighborReference {
  type: 'child-neighbor';
  leftmostNode: Node | null;
  element: Child;
}

export interface RegionInfo {
  // path to the controlling store
  // ie ['foo','bar','baz','raz','#',<uuid>,'$',<store>]
  store: string;
  // key within the store to use. must be an array
  storeKey: string;
  // path to the template that will be actualized for the region
  // ie ['foo','bar','baz','raz','schnaz']
  template: string;
  // a reference pointing to where to place elements in the region
  reference: Reference;
}

export interface Template {
  // the id of the template for trie indexing
  id: string[];
  // the html to actualize
  html: string;
  // a traversal that fetches the interactive nodes
  traversal: Traversal;
  // listeners to add to the dom
  domListeners: DOMListeners;
  // fires after the component mounts
  mount: StoreListener;
  // fires after the component unmounts
  unmount: StoreListener;
  // stores associated with the template
  stores: Trie<any>;
}

export interface TemplateState {
  // the leftmost node of a template
  leftInnerBound: Node;
  // the rightmost node of a template
  rightInnerBound: Node;
  // the node immediately to the left
  rightOuterBound: Node | null;
  //the parent in the dom
  parent: Node;
  // stores that are actualized for this template
  stores: Record<string, any>;
  // regions where dynamic elements will be inserted into this template
  regions: Record<string, RegionInfo>;
}

export interface ShimmyState {
  // we hold onto all templates so that we can actualize them multiple times
  // the convention is to list the template heirarchically
  // so for example, foo/bar/baz is ['foo','bar','baz']
  templates: Record<string, Template>;
  // we hold onto all templates so that we can actualize them multiple times
  // the convention is to list the template heirarchically
  // so for example, a dynamic element in foo/bar/baz built off of raz is ['foo','bar','baz','raz','#',<uuid>]
  actualizedTemplates: Record<string, TemplateState>;
  // we map dynamic store paths in the form of ['foo','bar','baz','raz']
  // so raz is the dynamic bit
  // then we stall all UUIDs in order
  dynamicMap: Record<string, string[]>;
}
```
