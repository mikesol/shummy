import { Runtime, RuntimeOptions, Message } from './types'
import { handleStaticTemplate } from './static'

export class ShimmyRuntime implements Runtime {
  private callCount: number = 1
  private options: RuntimeOptions

  constructor(options: RuntimeOptions = { inDom: false }) {
    this.options = options
  }

  handleMessage(message: Message): void {
    if (message.type === 'template') {
      handleStaticTemplate(message.template, this.options, document, this.callCount++)
    }
  }
} 