import openSocket from 'socket.io-client'

export function createSocket(socketAddress) {
  return openSocket(socketAddress, {
    'transports': ['websocket'],
    reconnect: true
  })
}