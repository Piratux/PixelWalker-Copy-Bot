/** @module Multiplayer */

import type HTTPChannel from '../channel.ts'
import Connection from '../connection.ts'
import { convertToKVArray, convertFromKVArray } from '../utilities/util.ts'

//const { convertToKVArray, convertFromKVArray } = require("./utilities.js");
//const RoomInfo = require("./room.js");
//const Connection = require("./connection.js");
//const PlayerIOError = require("./playerioerror.js");

interface GenericObject {
  [key: string]: unknown
}

export default class Multiplayer {
  protected channel: HTTPChannel

  /**
   * If not null, rooms will be created on the development server at the address defined by the server endpoint, instead of using the live multiplayer servers.
   */
  developmentServer: string | null

  constructor(channel: HTTPChannel) {
    this.channel = channel

    this.developmentServer = null
  }

  /**
   * Create a multiplayer room on the Player.IO infrastructure.
   * @param {string} roomId The id you wish to assign to your new room - You can use this to connect to the specific room later as long as it still exists.
   * @param {string} roomType The name of the room type you wish to run the room as. This value should match one of the [RoomType(...)] attributes of your uploaded code. A room type of 'bounce' is always available.
   * @param {number} visible Should the room be visible when listing rooms with GetRooms or not?
   * @param {object} roomData The data to initialize the room with, this can be read with ListRooms and changed from the serverside.
   */
  createRoom(roomId: string, roomType: string, visible: boolean, roomData?: GenericObject) {
    return this.channel
      .createRoom(roomId, roomType, visible, convertToKVArray(roomData), this.developmentServer != null)
      .then((result) => {
        return result.roomid
      })
  }

  /**
   * Join a running multiplayer room.
   * @param {string} roomId The id of the room you wish to connect to.
   * @param {string} joinData Data to send to the room with additional information about the join.
   * @returns {Promise<Connection|Error>}
   */
  joinRoom(roomId: string, joinData?: GenericObject) {
    return this.channel
      .joinRoom(roomId, convertToKVArray(joinData), this.developmentServer != null, true)
      .then((result) => {
        let conn = new Connection(this.developmentServer, result.endpoints, result.joinkey, joinData || {})

        return conn.connect()
      })
  }

  /**
   * Creates a multiplayer room (if it does not exist already) and joins it.
   * @param {string} roomId The id of the room you wish to create/join.
   * @param {string} roomType The name of the room type you wish to run the room as. This value should match one of the [RoomType(...)] attributes of your uploaded code. A room type of 'bounce' is always available.
   * @param {number} visible If the room doesn't exist: Should the room be visible when listing rooms with GetRooms upon creation?
   * @param {object} roomData If the room doesn't exist: The data to initialize the room with upon creation.
   * @param {object} joinData Data to send to the room with additional information about the join.
   * @returns {Promise<Connection|Error>}
   */
  createJoinRoom(
    roomId: string,
    roomType: string,
    visible: boolean,
    roomData?: GenericObject,
    joinData?: GenericObject,
  ) {
    return this.channel
      .createJoinRoom(
        roomId,
        roomType,
        visible,
        convertToKVArray(roomData),
        convertToKVArray(joinData),
        this.developmentServer != null,
        true,
      )
      .then((result) => {
        let conn = new Connection(this.developmentServer, result.endpoints, result.joinkey, joinData || {})

        return conn.connect()
      })
  }

  /**
   * List the currently running multiplayer rooms.
   * @param {string} roomType The type of room you wish to list.
   * @param {object} searchCriteria Only rooms with the same values in their roomdata will be returned.
   * @param {number} resultLimit The maximum amount of rooms you want to receive. Use 0 for 'as many as possible'.
   * @param {number} resultOffset The offset into the list you wish to start listing at.
   * @returns {Promise<RoomInfo[]>}
   */
  listRooms(
    roomType: string,
    searchCriteria: GenericObject | undefined,
    resultLimit: number = 0,
    resultOffset?: number,
  ) {
    return this.channel
      .listRooms(roomType, convertToKVArray(searchCriteria), resultLimit, resultOffset, this.developmentServer != null)
      .then((result) => {
        let arr: RoomInfo[] = []

        if (result.rooms?.length > 0) {
          for (let i = 0; i < result.rooms.length; i++) {
            let item = result.rooms[i]

            arr.push(new RoomInfo(item.id, item.roomtype, item.onlineusers, convertFromKVArray(item.roomdata)))
          }
        }
        return arr
      })
  }
}

/**
 * Information about a room returned from listRooms.
 */
export class RoomInfo {
  /**
   * The id of the room.
   */
  id: string
  /**
   * The type of the room (coresponding to the [RoomType(...)] attribute assignd to the room).
   */
  roomType: string
  /**
   * How many users are currently in the room
   */
  onlineUsers: number
  /**
   * lmao
   */
  roomData: object

  constructor(id: string, roomType: string, onlineUsers: number, roomData: object) {
    this.id = id
    this.roomType = roomType
    this.onlineUsers = onlineUsers
    this.roomData = roomData
  }
}
