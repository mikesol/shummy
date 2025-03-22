import { Traversal } from '@shimmy/traversals'

export type Store = Record<string, any>

export type EventHandler = (stores: Store, event: Event) => void

export type Elements = Record<string, Element>

export interface StoreListener {
  stores: Set<string>
  handler: (elements: Elements, stores: Store, nCalled: number, inDom: boolean) => void
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
  html: string
  domListeners: DOMListeners
  storeListeners: StoreListener[]
  stores: Store
  traversal: Traversal
}

export interface Message {
  type: 'template'
  template: Template
}

export interface Runtime {
  handleMessage(message: Message): void
}

export interface RuntimeOptions {
  inDom: boolean
} 