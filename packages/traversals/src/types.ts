export type Position = number;

export type Traversal = (element: Node) => Traversals;

export interface Traversals {
  elementPaths: Record<string, Element>;
  listenerPaths: Element[];
  children: Record<string, RegionInfo>;
}

export interface ParentReference {
  type: 'parent';
  element: Element;
}

export interface NodeNeighborReference {
  type: 'node-neighbor';
  element: Node;
}

export interface RegionNeighborReference {
  type: 'region-neighbor';
  leftmostNode: Node | null;
  element: Reference;
}

export interface RegionWithoutReference {
  store: string;
  key: string;
  template: string;
  placeholder: Element;
}

export type Reference = ParentReference | NodeNeighborReference | RegionNeighborReference;

export interface RegionInfo {
  store: string;
  key: string;
  template: string;
  reference: Reference;
}
