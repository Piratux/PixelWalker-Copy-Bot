/* eslint-disable */
// @ts-nocheck

/** @module Connection */
import Message from './message.ts'
import MessageSerializer, { Base64Processer } from './utilities/messageserialiser.ts'
import WebSocket from 'isomorphic-ws'
import type { CloseEvent, ErrorEvent } from 'isomorphic-ws'
import PlayerIOError from './error.ts'

interface Endpoint {
  port: number
  address: string
}

type MessageCallback = (arg0: Message) => any
type DisconnectCallback = (arg0: CloseEvent) => any

export default class Connection {
  /**
   * An object mapped by message types leading to an array of callbacks that takes in the message for first parameter. If undefined, no callbacks for it exists.
   */
  protected messageCallback: { [type: string]: MessageCallback[] } = {}
  protected disconnectCallback: DisconnectCallback[] = []

  private waitingForJoinResult: boolean
  private joinKey: string
  private joinData: { [key: string]: unknown } = {}
  private endpoints: Endpoint[]
  private endpointStrings: string[]

  private timeout: number | NodeJS.Timeout = 0

  developmentServer: string | null

  connected: boolean

  protected socket!: WebSocket

  constructor(
    developmentServer: string | null,
    endpoints: Endpoint[],
    joinKey: string,
    joinData?: { [key: string]: unknown },
  ) {
    this.waitingForJoinResult = true
    this.endpoints = endpoints
    this.joinKey = joinKey
    if (joinData) this.joinData = joinData
    this.developmentServer = developmentServer

    this.connected = false

    //this.socket = null;

    if (this.developmentServer !== null) this.endpointStrings = [this.developmentServer]
    else {
      this.endpointStrings = []
      for (let i = 0; i < this.endpoints.length; i++) {
        if ([80].some((v) => v === this.endpoints[i].port)) continue

        this.endpointStrings.push(this.endpoints[i].address + ':' + this.endpoints[i].port)
      }
    }
  }

  connect(): Promise<Connection> {
    return new Promise((res, rej) => {
      if (this.connected) throw Error("Socket's already connected, disconnect first.")

      let index = 0

      let tryNextEndpoint = () => {
        if (this.endpointStrings.length < 1)
          return rej('Could not establish a socket connection to any of the given endpoints for the room')

        let chosen = index

        // grab the first endpoint off the list
        let endpoint = this.endpointStrings.splice(0, 1)[0]

        // attempt to create a socket connection
        this.socket = new WebSocket((this.developmentServer ? 'ws://' : 'wss://') + endpoint + '/')
        this.socket.binaryType = 'arraybuffer'

        // I'm using addeventlistener since it's the common thing in browser/node/bun.
        // unfortunately, for some bleeping reason the intellisense shows nothing for websocket.addEventListener

        this.socket.addEventListener('message', (event) => {
          if (!this.connected) return

          if (Array.isArray(event.data)) throw Error("uh oh, i wasn't expecting an array of buffer lmaoo")

          let data: Buffer | Uint8Array | string =
            event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data

          let msg = MessageSerializer.deserializeMessage(
            typeof data === 'string' ? Base64Processer.decode(data) : data,
            0,
            data.length,
          )

          if (this.waitingForJoinResult) {
            if (msg.type === 'playerio.joinresult') {
              this.waitingForJoinResult = false

              if (!msg.getBoolean(0)) {
                rej([msg.getInt(1), msg.getString(2)])
              } else res(this)
            } else
              rej(
                new PlayerIOError(
                  PlayerIOError.PlayerIOErrorCode.GeneralError,
                  'The expected inital messagetype is: playerio.joinresult, received: ' + msg.type,
                ),
              )
          } else {
            this.executeCallbacks(msg.type, msg)
            this.executeCallbacks('*', msg)
          }
        })

        this.socket.addEventListener(
          'close',
          (closeevent) => {
            if (index === chosen) {
              if (this.disconnectCallback.length) this.disconnectCallback.forEach((v) => v(closeevent))
              else {
                // TODO: debug mode!
                console.log('Disconnected, code: ' + closeevent.code + ', reason: ' + closeevent.reason)
              }

              if (this.connected) {
                this.connected = false
              }
            }
          },
          { once: true },
        )

        this.socket.addEventListener(
          'open',
          () => {
            clearTimeout(this.timeout)
            this.connected = true

            // send join data
            let msg = this.createMessage('join')
            msg.addString(this.joinKey)

            if (this.joinData != null) {
              for (let x in this.joinData) {
                msg.addString(x)
                msg.addString('' + this.joinData[x])
              }
            }

            this.sendMessage(msg)
          },
          { once: true },
        )

        this.socket.addEventListener('error', this.socketOnError, { once: true })

        this.timeout = setTimeout(() => {
          if (this.connected) return

          // DEBUGLOG
          console.log(
            'Unable to connect to endpoint: ' +
              endpoint +
              '. reason: "' +
              'idk' +
              (this.endpointStrings.length > 0 ? '". Trying next endpoint.' : '". No more endpoints to try.'),
          )
          index++
          tryNextEndpoint()
        }, 4000)
      }

      tryNextEndpoint()
    })
  }

  /**
   * Disconnect from the multiplayer room
   */
  disconnect() {
    if (this.connected) {
      this.connected = false
      //onDisconnect();
      try {
        this.socket.close()
      } catch (e) {
        console.log(e)
      }
    }
  }

  protected socketOnError(msg: ErrorEvent) {
    console.error(msg)
    this.disconnect()
  }

  sendMessage(message: Message) {
    let serialized = MessageSerializer.serializeMessage(message)

    let bytes = Uint8Array.from(serialized)
    for (let i = 0; i < serialized.length; i++) {
      bytes[i] = serialized[i]
    }
    this.socket.send(bytes.buffer)
  }

  /**
   * Create a message with arguments inline: connection.createMessage('invite', arg1, arg2...)
   * @param {string} type
   * @param args NOTE THIS PROPERTY ISN'T MEANT TO BE GIVEN AS AN ARRAY, just spread it across many arguments.
   * @returns {Message} The message
   */
  createMessage<T = string>(type: T, ...args: any[]) {
    let msg = new Message<T>(type)

    for (let i = 0; i < args.length; i++) {
      msg.add(args[i])
    }
    return msg
  }

  /**
   * Send a message with arguments inline: connection.createMessage('invite', arg1, arg2...)
   * @param {string} type The string type to give to the message.
   */
  send(type: string, ...args: any[]) {
    this.sendMessage(this.createMessage(type, ...args))
  }

  /**
   * @param {string} type Use * for all message types.
   * @param {Message} msg
   * @protected
   */
  executeCallbacks(type: string, msg: Message) {
    let arr = this.messageCallback[type]
    if (arr && arr.length) {
      for (let i = 0; i < arr.length; i++) {
        arr[i](msg)
      }
    }
  }

  /**
   * Add a message callback for the given message type.
   * @param {string} type The type of message to invoke the callback for. Use '*' or null to handle all message types.
   * @param {function(Message)} callback The callback to be called when a message of the given type is received
   *
   * An example usage:
   * @example connection.addMessageCallback("*", (message) => {
   *      if (message.type === "init") message.send("init2");
   * });
   */
  addMessageCallback(type: string, callback: MessageCallback) {
    if (type == null) type = '*'
    let list = this.messageCallback[type]
    if (!list) {
      this.messageCallback[type] = list = []
    }
    list.push(callback)
  }

  /**
   * Add a callback that triggers when the connection closes.
   *
   * The CloseEvent will always have the code property, reason is provided but may be empty string.
   */
  addDisconnectCallback(callback: DisconnectCallback) {
    this.disconnectCallback.push(callback)
  }
}
