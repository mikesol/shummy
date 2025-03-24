import { Traversal } from '@shimmy/traversals'
import { Reference, Child } from 'packages/traversals/src/types'

export type Store = Record<string, any>

export type EventHandler = (stores: Store, event: Event) => void

export type Elements = Record<string, Element>

export interface StoreListener {
  stores: Set<string>
  handler: (elements: Elements, stores: Store, inDom: boolean) => void
}

export interface DOMListener {
  stores: Set<string>
  handler: EventHandler
}

export interface DOMListenerConfig {
  handler: EventHandler
  stores: Set<string>
}

export type DOMListeners = Record<string, DOMListenerConfig>

export interface Template {
  id: string
  html: string
  traversal: Traversal
  domListeners: DOMListeners
  storeListeners: StoreListener[]
  stores: Store
}

export interface Runtime {
  registerTemplate(template: Template): void
  actualizeTemplate(templateId: string, reference: Reference): void
}

export interface RuntimeOptions {
  inDom: boolean
}


export interface TemplateState {
  leftmostNode: Node
  children: Record<string, Child>
}

export interface RuntimeState {
  templates: Record<string, Template>
  actualizedTemplates: Record<string, TemplateState>  // Maps template IDs to their leftmost elements
  stores: Record<string, object>     // Maps store namespaces to their values
} 