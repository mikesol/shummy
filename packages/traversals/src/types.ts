export type Position = number;

export type Traversal = (element: Node) => Traversals;

export interface Traversals {
  elementPaths: Record<string, Element>;
  listenerPaths: Element[];
  children: Record<string, Child>;
}

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

export interface ChildWithoutReference {
  storePath: string;
  pathPath: string;
  templatePath: string;
  controllerName: string;
  placeholder: Element;
}

export type Reference = ParentReference | NodeNeighborReference | ChildNeighborReference;

export interface Child {
  storePath: string;
  pathPath: string;
  templatePath: string;
  controllerName: string;
  reference: Reference;
}
