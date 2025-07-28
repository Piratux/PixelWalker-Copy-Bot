// Taken from a github repo of ByteArray-Node, and converted to typescript, and made more compact.

import { decode, encode, encodingExists } from 'iconv-lite'
import { deflateRawSync, inflateRawSync } from 'zlib'
import type { InputType, ZlibOptions } from 'zlib'

export enum Endian {
  LITTLE_ENDIAN = 'LE',
  BIG_ENDIAN = 'BE',
}

export default class ByteArray {
  buffer: Buffer

  /**
   * The current position
   */
  hashposition: number = 0
  /**
   * The byte order (default is Big Endian)
   */
  protected hashendian: 'LE' | 'BE' = 'BE'

  constructor(buffer: Buffer | Array<number> | number | Uint8Array) {
    this.buffer = Buffer.isBuffer(buffer)
      ? buffer
      : Array.isArray(buffer) || buffer instanceof Uint8Array
        ? Buffer.from(buffer)
        : Number.isInteger(buffer)
          ? Buffer.alloc(buffer)
          : Buffer.alloc(0)
  }

  /**
   * Override for Object.prototype.toString.call
   */
  get [Symbol.toStringTag]() {
    return 'ByteArray'
  }

  /**
   * Returns the current endian mode ("LE" or "BE")
   */
  get endian() {
    return this.hashendian
  }

  /**
   * Sets the endian.
   */
  set endian(value: 'LE' | 'BE') {
    this.hashendian = value
  }

  /**
   * Returns the length of the buffer.
   */
  get length() {
    return this.buffer.length
  }

  /**
   * Sets the length of the buffer
   */
  set length(value: number) {
    if (!Number.isInteger(value) || value < 0) throw new TypeError(`Invalid value for length: '${value}'.`)

    if (value === 0) {
      this.clear()
    } else if (value !== this.length) {
      if (value < this.length) {
        this.buffer = this.buffer.slice(0, value)
        this.hashposition = this.length
      } else this.hashexpand(value)
    }
  }

  /**
   * Returns the amount of bytes available
   */
  get bytesAvailable(): number {
    return this.length - this.hashposition
  }

  /**
   * Reads a buffer function
   */
  private hashreadBufferFunc(
    func:
      | 'readDouble'
      | 'readFloat'
      | 'readInt32'
      | 'readBigInt64'
      | 'readInt16'
      | 'readUInt32'
      | 'readUInt16'
      | 'readBigUInt64',
    pos: number,
  ): any {
    const value = this.buffer[`${func}${this.hashendian}`](this.hashposition)

    this.hashposition += pos

    return value
  }

  /**
   * Writes a buffer function
   */
  private hashwriteBufferFunc(
    value: number | bigint,
    func:
      | 'writeDouble'
      | 'writeFloat'
      | 'writeInt32'
      | 'writeBigInt64'
      | 'writeInt16'
      | 'writeUInt32'
      | 'writeUInt16'
      | 'writeBigUInt64',
    pos: number,
  ) {
    this.hashexpand(pos)

    this.buffer[`${func}${this.hashendian}`](value as never, this.hashposition)
    this.hashposition += pos
  }

  //#region ok

  /**
   * Expands the buffer when needed
   */
  hashexpand(value: number) {
    if (this.bytesAvailable < value) {
      const old = this.buffer
      const size = old.length + (value - this.bytesAvailable)

      this.buffer = Buffer.alloc(size)
      old.copy(this.buffer)
    }
  }

  /**
   * Simulates signed overflow
   * @author truelossless
   */
  signedOverflow(value: number, bits: number): number {
    const sign = 1 << (bits - 1)

    return (value & (sign - 1)) - (value & sign)
  }

  /**
   * Clears the buffer and sets the position to 0
   */
  clear() {
    this.buffer = Buffer.alloc(0)
    this.hashposition = 0
  }

  /**
   * idk wtf
   */
  compress() {
    // TODO: compress duh
    if (this.length === 0) return

    this.buffer = deflateRawSync(this.buffer)
    this.hashposition = this.length
  }

  static compressor(buf: InputType, options?: ZlibOptions) {
    return deflateRawSync(buf, options)
  }

  /**
   * Reads a boolean
   */
  readBoolean(): boolean {
    return this.readByte() !== 0
  }

  /**
   * Reads a signed byte
   * @returns
   */
  readByte(): number {
    return this.buffer.readInt8(this.hashposition++)
  }

  /**
   * Reads multiple signed bytes from a ByteArray
   */
  readBytes(bytes: ByteArray, offset: number = 0, length: number = 0): void {
    if (length === 0) {
      length = this.bytesAvailable
    }

    if (length > this.bytesAvailable) throw new RangeError('End of buffer was encountered.')

    if (bytes.length < offset + length) bytes.hashexpand(offset + length)

    for (let i = 0; i < length; i++) {
      bytes.buffer[i + offset] = this.buffer[i + this.hashposition]
    }

    this.hashposition += length
  }

  /**
   * @description Reads a double
   */
  readDouble(): number {
    return this.hashreadBufferFunc('readDouble', 8)
  }

  /**
   * Reads a float
   */
  readFloat(): number {
    return this.hashreadBufferFunc('readFloat', 4)
  }

  /**
   * Reads a signed int
   */
  readInt(): number {
    return this.hashreadBufferFunc('readInt32', 4)
  }

  /**
   * Reads a signed long
   */
  readLong(): bigint {
    return this.hashreadBufferFunc('readBigInt64', 8)
  }

  /**
   * Reads a multibyte string
   */
  readMultiByte(length: number, charset: string = 'utf8') {
    const position = this.hashposition
    this.hashposition += length

    if (encodingExists(charset)) {
      const b = this.buffer.slice(position, this.hashposition)
      const stripBOM =
        (charset === 'utf8' || charset === 'utf-8') && b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf
      const value = decode(b, charset, { stripBOM })

      stripBOM ? (length -= 3) : 0

      if (Buffer.byteLength(value) !== length) {
        throw new RangeError('End of buffer was encountered.')
      }

      return value
    } else throw Error(`Invalid character set: '${charset}'.`)
  }

  /**
   * Reads a signed short
   */
  readShort(): number {
    return this.hashreadBufferFunc('readInt16', 2)
  }

  /**
   * Reads an unsigned byte
   */
  readUnsignedByte(): number {
    return this.buffer.readUInt8(this.hashposition++)
  }

  /**
   * Reads an unsigned int
   */
  readUnsignedInt(): number {
    return this.hashreadBufferFunc('readUInt32', 4)
  }

  /**
   * Reads an unsigned short
   */
  readUnsignedShort(): number {
    return this.hashreadBufferFunc('readUInt16', 2)
  }

  /**
   * Reads an unsigned long
   */
  readUnsignedLong(): bigint {
    return this.hashreadBufferFunc('readBigUInt64', 8)
  }

  /**
   * Reads a UTF-8 string
   */
  readUTF(): string {
    return this.readMultiByte(this.readUnsignedShort())
  }

  /**
   * Reads UTF-8 bytes
   */
  readUTFBytes(length: number): string {
    return this.readMultiByte(length)
  }

  /**
   * Converts the buffer to JSON
   */
  toJSON() {
    return Object.assign({}, this.buffer.toJSON().data)
  }

  /**
   * Converts the buffer to a string
   */
  toString(charset: string = 'utf8') {
    if (encodingExists(charset)) {
      return decode(this.buffer, charset)
    } else throw Error(`Invalid character set: '${charset}'.`)
  }

  /**
   * Decompresses the buffer
   */
  uncompress() {
    // TODO: compress duh
    if (this.length === 0) return

    this.buffer = inflateRawSync(this.buffer)
    this.hashposition = 0
  }

  static uncompressor(buf: InputType, options?: ZlibOptions) {
    return inflateRawSync(buf, options)
  }

  /**
   * Writes a boolean (internally a 0 or 1)
   */
  writeBoolean(value: boolean) {
    this.writeByte(value ? 1 : 0)
  }

  /**
   * Writes a signed byte
   */
  writeByte(value: number) {
    this.hashexpand(1)
    this.buffer.writeInt8(this.signedOverflow(value, 8), this.hashposition++)
  }

  /**
   * Writes multiple signed bytes to a ByteArray
   */
  writeBytes(bytes: ByteArray | Buffer | Array<any>, offset: number = 0, length: number = 0): void {
    if (length === 0) {
      length = bytes.length - offset
    }

    this.hashexpand(length)

    for (let i = 0; i < length; i++) {
      this.buffer[i + this.hashposition] =
        Buffer.isBuffer(bytes) || bytes instanceof Array ? bytes[i + offset] : bytes.buffer[i + offset]
    }

    this.hashposition += length
  }

  //#endregion

  /**
   * Writes a double
   */
  writeDouble(value: number): void {
    this.hashwriteBufferFunc(value, 'writeDouble', 8)
  }

  /**
   * Writes a float
   */
  writeFloat(value: number): void {
    this.hashwriteBufferFunc(value, 'writeFloat', 4)
  }

  /**
   * Writes a signed int
   */
  writeInt(value: number): void {
    this.hashwriteBufferFunc(this.signedOverflow(value, 32), 'writeInt32', 4)
  }

  /**
   * Writes a signed long
   */
  writeLong(value: bigint): void {
    this.hashwriteBufferFunc(value, 'writeBigInt64', 8)
  }

  /**
   * Writes a multibyte string
   */
  writeMultiByte(value: string, charset: string = 'utf8'): void {
    this.hashposition += Buffer.byteLength(value)

    if (encodingExists(charset)) {
      this.buffer = Buffer.concat([this.buffer, encode(value, charset)])
    } else throw Error(`Invalid character set: '${charset}'.`)
  }

  /**
   * Writes a signed short
   */
  writeShort(value: number): void {
    this.hashwriteBufferFunc(this.signedOverflow(value, 16), 'writeInt16', 2)
  }

  /**
   * Writes an unsigned byte
   */
  writeUnsignedByte(value: number): void {
    this.hashexpand(1)
    this.buffer.writeUInt8(value, this.hashposition++)
  }

  /**
   * Writes a unsigned int
   */
  writeUnsignedInt(value: number): void {
    this.hashwriteBufferFunc(value, 'writeUInt32', 4)
  }

  /**
   * Writes an unsigned short
   */
  writeUnsignedShort(value: number): void {
    this.hashwriteBufferFunc(value, 'writeUInt16', 2)
  }

  /**
   * Writes an unsigned long
   */
  writeUnsignedLong(value: bigint): void {
    this.hashwriteBufferFunc(value, 'writeBigUInt64', 8)
  }

  /**
   * Writes a UTF-8 string
   */
  writeUTF(value: string): void {
    this.writeUnsignedShort(Buffer.byteLength(value))
    this.writeMultiByte(value)
  }

  /**
   * Writes UTF-8 bytes
   */
  writeUTFBytes(value: string): void {
    this.writeMultiByte(value)
  }
}
