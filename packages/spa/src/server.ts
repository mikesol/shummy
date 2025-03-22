import { SPAServer } from './types'
import { Template, Message } from '@shimmy/runtime'
import { ShimmyRuntime } from '@shimmy/runtime'

export class ShimmySPAServer implements SPAServer {
  private runtime: ShimmyRuntime

  constructor() {
    this.runtime = new ShimmyRuntime()
  }

  sendTemplate(template: Template): void {
    const message: Message = {
      type: 'template',
      template
    }
    this.runtime.handleMessage(message)
  }

} 