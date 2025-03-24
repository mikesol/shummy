import { SPAServer } from './types'
import { Template } from '@shimmy/runtime'
import { ShimmyRuntime } from '@shimmy/runtime'

export class ShimmySPAServer implements SPAServer {
  private runtime: ShimmyRuntime

  constructor(reference: Element) {
    this.runtime = new ShimmyRuntime({ inDom: false }, reference)
  }

  sendTemplate(template: Template): void {
    this.runtime.actualizeTempalte(template)
  }
} 