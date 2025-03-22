import { Template, Message } from '@shimmy/runtime'

export interface SPAServer {
  sendTemplate: (template: Template) => void
} 