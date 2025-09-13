import http from 'http'
import WebSocket from 'ws'
import { createApp } from '../src/app'
import { attachWebSocketServer } from '../src/ws'

describe('WS auth', () => {
  const server = http.createServer(createApp())
  attachWebSocketServer(server)

  beforeAll((done) => server.listen(0, done))
  afterAll((done) => server.close(done))

  it('refuses invalid token', (done) => {
    const address = server.address()
    const port = typeof address === 'object' && address ? address.port : 0
    const ws = new WebSocket(`ws://localhost:${port}/ws?token=invalid`)
    ws.on('close', (code) => {
      expect(code).toBe(1008)
      done()
    })
  })
})
