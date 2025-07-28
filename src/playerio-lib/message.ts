/** @module Message */

import { EntryType } from './constants.ts'
import ByteArray from './structures/ByteArray.ts'

/**
 * Represents a message sent between client and server.
 * A message consists of a string type, and a payload of zero or more typed parameters.
 * @example This is how to create a simple message that we send to the server indicating that this player is ready:
 * <listing>
 * //Create a message of type ready with no payload:
 * let m = connection.createMessage("ready");
 *
 * //Send the message to the server:
 * connection.sendMessage(m);
 * </listing>
 *
 * @example Usually, it's much easier to simply use the convenience methods:
 * <listing>
 * //Send the server a message of which maps this player selected:
 * connection.Send("mapsselected", "fields-of-glory", "small-skirmish");
 *
 * //Send a chat message to the server, that it can broadcast:
 * connection.Send("chat", "Hey guys, are you ready to start the game?");
 * </listing>
 * @example You can also build up messages as you go, if you don't know the exact payload until runtime.
 * In this example, imagine the player has multiple pieces and we send in the list of moves this player wants to do in a single turn.
 * <listing>
 * //Create a new message of type moves:
 * let m = connection.createMessage("moves");
 *
 * //Add all pending moves to the message:
 * foreach(let move in moves) {
 *	m.add(move.pieceid, move.x, move.y);
 * }
 *
 * //Send the message to the server:
 * connection.sendMessage(m);
 * </listing>
 */
export default class Message<T = string> {
  /**
   * Type of the message.
   */
  type: T

  protected types: EntryType[]
  protected objects: (string | number | boolean | ByteArray)[]

  constructor(type: T) {
    this.type = type

    this.types = []

    this.objects = []
  }

  /**
   * The number of entries in this message.
   */
  get length() {
    return this.objects.length
  }

  /**
   * Adds data entries to the Message object
   * @param {any[]} args Entries to add. Valid types are Number, String, Boolean and ByteArray. If a Number is passed, and it is an integer, it will be added to the first type it fits in this order: Int, UInt, Long, ULong. If it doesn't fit in any integer type, or if it's not an integer, it will be added as a Double.
   */
  add(...args: any) {
    for (let i = 0; i < args.length; i++) {
      let value = args[i]

      switch (typeof value) {
        case 'string':
          this.addString(value)
          break
        case 'boolean':
          this.addBoolean(value)
          break
        case 'number':
          if (isFinite(value) && Math.floor(value) === value) {
            if (value >= -2147483648 && value <= 2147483647) {
              this.addInt(value)
              break
            } else if (value > 0 && value <= 4294967295) {
              this.addUInt(value)
              break
            } else if (value >= -9223372036854775000 && value <= 9223372036854775000) {
              //Boundary is rounded because max_long and min_long can't be accurately represented as double
              this.addLong(value)
              break
            } else if (value > 0 && value <= 18446744073709550000) {
              //Boundary is rounded because max_ulong can't be accurately represented as double
              this.addULong(value)
              break
            }
          }
          this.addDouble(value)
          break
        // @ts-ignore
        case 'object':
          if (this.isByteArray(value)) {
            this.addByteArray(value)
            break
          }
        default:
          throw Error('The type of the value (' + value + ') cannot be inferred')
      }
    }
  }

  /**
   * Add a value encoded as an int to the message
   * @param {number} value The number to add
   */
  addInt(value: number) {
    this.addT(value >= -2147483648 && value <= 2147483647, Math.trunc(value), EntryType.Integer, 'an integer (32bit)')
  }

  /** Add a value encoded as a uint to the message
   * @param {number} value The number to add
   */
  addUInt(value: number) {
    this.addT(
      value >= 0 && value <= 4294967295,
      Math.trunc(value),
      EntryType.UnsignedInteger,
      'an unsigned integer (32bit)',
    )
  }

  /** Add a value encoded as a long to the message
   * @param {number} value The number to add
   */
  addLong(value: number) {
    //Boundary is rounded because max_long and min_long can't be accurately represented as double
    this.addT(
      value >= -9223372036854775000 && value <= 9223372036854775000,
      Math.trunc(value),
      EntryType.Long,
      'a long (64bit)',
    )
  }

  /** Add a value encoded as a ulong to the message
   * @param {number} value The number to add
   */
  addULong(value: number) {
    //Boundary is rounded because max_ulong can't be accurately represented as double
    this.addT(value >= 0 && value <= 18446744073709550000, value, EntryType.UnsignedLong, 'an unsigned long (64bit)')
  }

  /** Add a boolean value to the message
   * @param {boolean} value The bool to add
   */
  addBoolean(value: boolean) {
    this.addT(true, value ? true : false, EntryType.Boolean, 'a boolean value')
  }

  /** Add a value encoded as a float to the message
   * @param {number} value The number to add
   */
  addFloat(value: number) {
    this.addT(true, Number(value), EntryType.Float, 'a floating point value (32bit)')
  }

  /** Add a value encoded as a double to the message
   * @param {number} value The number to add
   */
  addDouble(value: number) {
    this.addT(true, Number(value), EntryType.Double, 'a double floating point value (64bit)')
  }

  /** Add a byte array value to the message
   * @param {number[]} value The byte array to add
   */
  addByteArray(value: number[] | Uint8Array | Buffer | ByteArray) {
    this.addT(this.isByteArray(value), value, EntryType.ByteArray, 'a bytearray')
  }

  /** Add a string value to the message
   * @param {string} value The string to add
   */
  addString(value: string) {
    this.addT(true, value + '', EntryType.String, 'a string')
  }

  /** Get the int from the message at the given index
   * @param {number} index The zero-based index of the entry to get
   * @return {number} */
  getInt(index: number): number {
    return this.get(index, EntryType.Integer)
  }

  /** Get the uint from the message at the given index
   * @param {number} index The zero-based index of the entry to get
   * @return {number} */
  getUInt(index: number): number {
    return this.get(index, EntryType.UnsignedInteger)
  }

  /** Get the long from the message at the given index
   * @param {number} index The zero-based index of the entry to get
   * @return {number} */
  getLong(index: number): number {
    return this.get(index, EntryType.Long)
  }

  /** Get the ulong from the message at the given index
   * @param {number} index The zero-based index of the entry to get
   * @return {number} */
  getULong(index: number): number {
    return this.get(index, EntryType.UnsignedLong)
  }

  /** Get the bool from the message at the given index
   * @param {number} index The zero-based index of the entry to get
   * @return {boolean} */
  getBoolean(index: number): Boolean {
    return this.get(index, EntryType.Boolean)
  }

  /** Get the double from the message at the given index
   * @param {number} index The zero-based index of the entry to get
   * @return {number} */
  getDouble(index: number): number {
    return this.get(index, EntryType.Double)
  }

  /**
   * Get the number (int, uint, long, ulong, float, double) from the message at the given index.
   * @param {number} index The zero-based index of the entry to get
   * @returns
   */
  getNumber(index: number): number {
    return this.get(index, 69)
  }

  /** Get the float from the message at the given index
   * @param {number} index The zero-based index of the entry to get
   * @return {number} */
  getFloat(index: number): number {
    return this.get(index, EntryType.Float)
  }

  /** Get the int from the message at the given index
   * @param {number} index The zero-based index of the entry to get
   * @return {number} */
  getByteArray(index: number): ByteArray {
    return this.get(index, EntryType.ByteArray)
  }

  /** Get the string from the message at the given index
   * @param {number} index The zero-based index of the entry to get
   * @return {string} */
  getString(index: number): String {
    return this.get(index, EntryType.String)
  }

  /** Get a string representation of the message
   * @return {string} */
  toString() {
    let str = 'msg.Type = ' + this.type + ''
    for (let i = 0; i != this.length; i++) {
      str += ', msg[' + i + '] = ' + this.objects[i] + ' (' + this.getTypeString(this.types[i]) + ')'
    }
    return str
  }

  _internal_(method: 'get-types'): EntryType[]
  _internal_(method: 'get-objects'): (string | number | boolean | ByteArray)[]
  _internal_(method: 'get-objects' | 'get-types') {
    switch (method) {
      case 'get-objects':
        return this.objects
      case 'get-types':
        return this.types
    }
  }

  addT(check: boolean, value: any, type: EntryType, errorMessage: string) {
    if (check) {
      if (type === EntryType.ByteArray) value = new ByteArray(value)

      this.objects.push(value)
      this.types.push(type)
    } else throw Error('The given value (' + value + ') is not ' + errorMessage)
  }

  get(index: number, type: EntryType.Boolean): boolean
  get(index: number, type: EntryType.ByteArray): ByteArray
  get(
    index: number,
    type:
      | EntryType.Double
      | EntryType.Float
      | EntryType.Integer
      | EntryType.Long
      | EntryType.Number
      | EntryType.UnsignedInteger
      | EntryType.UnsignedLong,
  ): number
  get(index: number, type: EntryType.String): string
  get(index: number, type: EntryType) {
    if (index > this.length) {
      throw Error('this message (' + this.type + ') only has ' + this.objects.length + ' entries')
    } else {
      if (this.types[index] == type || (type === 69 && this.types[index] >= 0 && this.types[index] <= 5)) {
        return this.objects[index]
      } else {
        throw Error(
          'Value at index:' +
            index +
            ' is a ' +
            this.getTypeString(this.types[index]) +
            ' and not a ' +
            this.getTypeString(type) +
            ' as requested. The value is: ' +
            this.objects[index],
        )
      }
    }
  }

  getTypeString(type: EntryType = EntryType.Integer) {
    let t = {
      [EntryType.Integer]: 'Integer',
      [EntryType.UnsignedInteger]: 'Unsigned Integer',
      [EntryType.Long]: 'Long',
      [EntryType.UnsignedLong]: 'Unsigned Long',
      [EntryType.Double]: 'Double',
      [EntryType.Float]: 'Float',
      [EntryType.String]: 'String',
      [EntryType.ByteArray]: 'ByteArray',
      [EntryType.Boolean]: 'Boolean',
      [69]: 'Number',
    }

    return t[type]
  }

  /**
   * @param {Buffer} value
   * @returns
   */
  isByteArray(value: Uint8Array | Buffer | number[] | ByteArray) {
    if (value instanceof ByteArray) return true

    let isBytes = typeof value == 'object' && typeof value.length != 'undefined'
    if (isBytes) {
      for (let i = 0; i != value.length; i++) {
        if (value[i] > 255 || value[i] < 0) {
          isBytes = false
          break
        }
      }
    }
    return isBytes
  }
}
