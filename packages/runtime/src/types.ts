import { Traversal } from '@shimmy/traversals';
import { Reference, RegionInfo } from 'packages/traversals/src/types';

// Path rules
// - foo.bar#foo.month$january@<uuid>/baz.raz#foo.bar.baz.chores$sunday@<uuid>
// - foo.bar#foo.month$january@<uuid>/baz
//
// anything between # and / is the dynamic bit and reads
// store$key@uuid for the template before it
// for example, in foo.bar#foo.month$january@<uuid>/baz, the # applies to the template bar
// uuids are not repeated in the internal store paths, but can always be derived from the full store path
// meaning that foo.bar#foo.month$january@<uuid>/baz.raz#foo.bar.baz.chores$sunday@<uuid> has a
// store path foo.bar.baz.chores, but we can derive that bar corresponds to a dynamic template
// because of the preceding part of the path

export type Store = Record<string, Object>;

export type EventHandler = (stores: Store, event: Event) => void;

export type Elements = Record<string, Element>;

export interface StoreListener {
  handler: (elements: Elements, stores: Store, inDom: boolean) => void;
  stores: Set<string>;
}

export interface DOMListener {
  handler: EventHandler;
  stores: Set<string>;
}

export type DOMListeners = Record<string, DOMListener>;

export interface Template {
  id: string;
  html: string;
  traversal: Traversal;
  domListeners: DOMListeners;
  storeListeners: StoreListener[];
  stores: Store;
}

export interface Runtime {
  registerTemplate(template: Template): void;
  // the template id is the fully qualified template name
  actualizeTemplate(templateId: string, reference: Reference): void;
}

export interface RuntimeOptions {
  inDom: boolean;
}

export interface TemplateState {
  // the leftmost node of a template
  leftInnerBound: Node | null;
  // the rightmost node of a template
  rightInnerBound: Node | null;
  // the node immediately to the left
  rightOuterBound: Node | null;
  //the parent in the dom
  parent: Element | null;
  // stores that are actualized for this template
  // the keys are the pure store name, as the path to the store is present int the runtime state
  stores: Record<string, any>;
  // regions where dynamic elements will be inserted into this template
  // regions are named after their template id, which is also present in RegionInfo
  regions: Record<string, RegionInfo>;
}

export interface RuntimeState {
  // we hold onto all templates so that we can actualize them multiple times
  // the convention is to list the template heirarchically
  // so for example, foo/bar/baz is foo.bar.baz
  templates: Record<string, Template>;
  // we hold onto all templates so that we can actualize them multiple times
  // the convention is to list the template heirarchically
  // - foo.bar#foo.month$january@<uuid>/baz.raz#foo.bar.baz.chores$sunday@<uuid>
  // - foo.bar#foo.month$january@<uuid>/baz
  actualizedTemplates: Record<string, TemplateState>;
  // we map dynamic store paths to their uuids
  // - foo.bar#foo.month$january@<uuid>/baz.raz#foo.bar.baz.chores$sunday
  // - foo.bar#foo.month$january
  dynamicMap: Record<string, string[]>;
}
