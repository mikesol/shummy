import { describe } from 'vitest'
import {traverseHTML} from '../dsl-traversal'
import { createTraversalTests } from './shared-traversal'

describe('dsl-traversal', () => {
  createTraversalTests(traverseHTML)
}) 