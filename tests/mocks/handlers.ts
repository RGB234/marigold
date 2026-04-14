import { http, HttpResponse } from 'msw'

export const handlers = [
  // Example handler
  http.get('/api/example', () => {
    return HttpResponse.json({
      success: true,
      data: { message: 'Mock data from MSW' }
    })
  }),
]