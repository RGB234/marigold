import { beforeAll, afterEach, afterAll } from 'vitest'
import { worker } from '../mocks/browser'

// Start server before all tests
beforeAll(() => {
  // In a Node environment (like jsdom), we'd typically use setupServer from 'msw/node'.
  // However, for pure UI component tests that might run in an actual browser via vitest browser mode,
  // or if using node, we need `setupServer`. Since we are using jsdom, let's mock the server.
  // We'll create a node server inline or separately if needed.
})

// For now, just a placeholder setup
afterEach(() => {
  // reset handlers
})

afterAll(() => {
  // close server
})