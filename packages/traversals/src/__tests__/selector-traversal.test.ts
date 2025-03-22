import { describe } from 'vitest'
import {traverseHTML} from '../selector-traversal'
import { createTraversalTests } from './shared-traversal'

describe('selector-traversal', () => {
  createTraversalTests(traverseHTML)
}) 