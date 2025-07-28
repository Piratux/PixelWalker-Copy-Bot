import Message from '../message.ts'
import { EntryType } from '../constants.ts'

export const topPattern = 192 //11000000
export const bottomPattern = 60 //00111100
//------------------------------------------------
export const stringTopPattern = 192 //11000000
export const integerTopPattern = 128 //10000000
export const byteArrayTopPattern = 64 //01000000
//------------------------------------------------
export const integerBottomPattern = 4 //00000100
export const unsignedIntegerBottomPattern = 8 //00001000
export const stringBottomPattern = 12 //00001100
export const byteArrayBottomPattern = 16 //00010000
export const shortLongBottomPattern = 48 //00110000
export const longBottomPattern = 52 //00110100
export const shortUnsignedLongBottomPattern = 56 //00111000
export const unsignedLongBottomPattern = 60 //00111100
//------------------------------------------------
export const doublePattern = 3 //00000011
export const floatPattern = 2 //00000010
export const booleanTruePattern = 1 //00000001
export const booleanFalsePattern = 0 //00000000

export default class MessageSerializer {
  static serializeMessage(message: Message) {
    const writer = new ByteWriter()

    // write the amount of items as first thing
    writer.writeTagWithLength(message.length, integerTopPattern, integerBottomPattern)

    // write the type as the second thing
    let bytes = BinarySerializer.bytesFromString(message.type)
    writer.writeTagWithLength(bytes.length, stringTopPattern, stringBottomPattern)
    writer.writeBytes(bytes)

    // write all the contents of the message
    for (let i = 0; i != message.length; i++) {
      let value = message._internal_('get-objects')[i] as any
      switch (message._internal_('get-types')[i]) {
        case EntryType.String:
          let bytes = BinarySerializer.bytesFromString(value)
          writer.writeTagWithLength(bytes.length, stringTopPattern, stringBottomPattern)
          writer.writeBytes(bytes)
          break
        case EntryType.Integer:
          writer.writeTagWithLength(value, integerTopPattern, integerBottomPattern)
          break
        case EntryType.UnsignedInteger:
          writer.writeBottomPatternAndBytes(unsignedIntegerBottomPattern, BinarySerializer.bytesFromUInt(value))
          break
        case EntryType.Long:
          writer.writeLongPattern(shortLongBottomPattern, longBottomPattern, BinarySerializer.bytesFromLong(value))
          break
        case EntryType.UnsignedLong:
          writer.writeLongPattern(
            shortUnsignedLongBottomPattern,
            unsignedLongBottomPattern,
            BinarySerializer.bytesFromULong(value),
          )
          break
        case EntryType.ByteArray:
          writer.writeTagWithLength(value.length, byteArrayTopPattern, byteArrayBottomPattern)
          writer.writeBytes(value)
          break
        case EntryType.Double:
          writer.writeByte(doublePattern)
          writer.writeBytes(BinarySerializer.bytesFromDouble(value))
          break
        case EntryType.Float:
          writer.writeByte(floatPattern)
          let fb = BinarySerializer.bytesFromFloat(value)
          writer.writeBytes(fb)
          break
        case EntryType.Boolean:
          writer.writeByte(value ? booleanTruePattern : booleanFalsePattern)
          break
      }
    }

    return writer.bytes
  }

  static deserializeMessage(bytes: number[] | Uint8Array | Buffer, start: number, count: number) {
    let position = start
    let end = start + count
    let output: Message | null = null
    let partsInMessage = 0

    while (position < end) {
      let length = 0
      let value = 0

      // find the pattern used
      let tag = bytes[position]
      position++ // pass the tag
      let pattern = tag & topPattern
      if (pattern == 0) {
        pattern = tag & bottomPattern
        if (pattern == 0) {
          pattern = tag
        }
      }

      // find the length of the actual data
      switch (pattern) {
        case stringBottomPattern:
        case byteArrayBottomPattern:
          length = (tag & 3) + 1 // bytes

          // do we have the bytes for the length?
          if (position + length > end) {
            throw new Error('Unexpected: Unfinished message')
          }

          // read the bytes containing the length
          let jump = length
          length = BinarySerializer.intFromBytes(bytes, position, length)
          position += jump // move forward over the bytes containing the length
          break
        case stringTopPattern:
          length = tag & 63
          break
        case integerTopPattern:
          value = tag & 63
          break
        case byteArrayTopPattern:
          length = tag & 63
          break
        case integerBottomPattern:
        case unsignedIntegerBottomPattern:
        case shortLongBottomPattern:
        case shortUnsignedLongBottomPattern:
          length = (tag & 3) + 1 // 3 = 00000011;
          break
        case longBottomPattern:
        case unsignedLongBottomPattern:
          length = (tag & 3) + 5 // 3 = 00000011;
          break
        case doublePattern:
          length = 8
          break
        case floatPattern:
          length = 4
          break
        case booleanTruePattern:
          break
        case booleanFalsePattern:
          break
      }

      // move forward and ensure we've got those bytes
      if (position + length > end) {
        throw new Error('Unexpected: Unfinished message')
      }

      switch (pattern) {
        case stringBottomPattern:
        case stringTopPattern:
          if (output == null) {
            output = new Message(BinarySerializer.stringFromBytes(bytes, position, length))
            partsInMessage++ //Add one to parts since the type of the message isn't counted as a parameter.
          } else {
            output.addString(BinarySerializer.stringFromBytes(bytes, position, length))
          }
          break
        // @ts-ignore
        case integerBottomPattern:
          value = BinarySerializer.intFromBytes(bytes, position, length)
        case integerTopPattern:
          if (partsInMessage == 0) {
            //If partsInMessage is 0, then we've just started deserializing a new message, which means that
            //the first integer is the number of parameters in the message.
            partsInMessage = value
          } else {
            output!.addInt(value)
          }
          break
        case byteArrayBottomPattern:
        case byteArrayTopPattern:
          output!.addByteArray(bytes.slice(position, position + length))
          break
        case unsignedIntegerBottomPattern:
          output!.addUInt(BinarySerializer.uintFromBytes(bytes, position, length))
          break
        case shortLongBottomPattern:
        case longBottomPattern:
          output!.addLong(BinarySerializer.longFromBytes(bytes, position, length))
          break
        case shortUnsignedLongBottomPattern:
        case unsignedLongBottomPattern:
          output!.addULong(BinarySerializer.ulongFromBytes(bytes, position, length))
          break
        case doublePattern:
          output!.addDouble(BinarySerializer.doubleFromBytes(bytes, position, length))
          break
        case floatPattern:
          output!.addFloat(BinarySerializer.floatFromBytes(bytes, position, length))
          break
        case booleanTruePattern:
          output!.addBoolean(true)
          break
        case booleanFalsePattern:
          output!.addBoolean(false)
          break
      }

      // move forward
      position += length

      // no parts left in the message -- then it's done!
      if (output != null && --partsInMessage == 0) {
        return output
      }
    }
    throw new Error('Unexpected: Misaligned message')
  }
}

export class BinarySerializer {
  protected static power2: { [n: number]: number } = {}

  static pow2(n: number): number {
    return n >= 0 && n < 31 ? 1 << n : this.power2[n] || (this.power2[n] = Math.pow(2, n))
  }

  static _intEncode(value: number, bytes: number) {
    let b = new Array(bytes)
    if (bytes == 4) {
      b = [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]
    } else {
      if (value >= 0) {
        let hi = Math.floor(value / this.pow2(32))
        let lo = value - hi * this.pow2(32)
        b = [
          (hi >>> 24) & 0xff,
          (hi >>> 16) & 0xff,
          (hi >>> 8) & 0xff,
          hi & 0xff,
          (lo >>> 24) & 0xff,
          (lo >>> 16) & 0xff,
          (lo >>> 8) & 0xff,
          lo & 0xff,
        ]
      } else {
        let hi = Math.floor(value / this.pow2(32))
        let lo = value - hi * this.pow2(32)
        hi += this.pow2(32)
        b = [
          (hi >>> 24) & 0xff,
          (hi >>> 16) & 0xff,
          (hi >>> 8) & 0xff,
          hi & 0xff,
          (lo >>> 24) & 0xff,
          (lo >>> 16) & 0xff,
          (lo >>> 8) & 0xff,
          lo & 0xff,
        ]
      }
    }
    return b
  }

  static _floatEncode(value: number, mantSize: number, expSize: number) {
    let signBit = value < 0 ? 1 : 0,
      exponent: number,
      mantissa: number,
      eMax = ~(-1 << (expSize - 1)),
      eMin = 1 - eMax

    if (value < 0) {
      value = -value
    }

    if (value === 0) {
      exponent = 0
      mantissa = 0
    } else if (isNaN(value)) {
      exponent = 2 * eMax + 1
      mantissa = 1
    } else if (value === Infinity) {
      exponent = 2 * eMax + 1
      mantissa = 0
    } else {
      exponent = Math.floor(Math.log(value) / Math.LN2)
      if (exponent >= eMin && exponent <= eMax) {
        mantissa = Math.floor((value * this.pow2(-exponent) - 1) * this.pow2(mantSize))
        exponent += eMax
      } else {
        mantissa = Math.floor(value / this.pow2(eMin - mantSize))
        exponent = 0
      }
    }

    let b: number[] = []
    while (mantSize >= 8) {
      b.push(mantissa % 256)
      mantissa = Math.floor(mantissa / 256)
      mantSize -= 8
    }
    exponent = (exponent << mantSize) | mantissa
    expSize += mantSize
    while (expSize >= 8) {
      b.push(exponent & 0xff)
      exponent >>>= 8
      expSize -= 8
    }
    b.push((signBit << expSize) | exponent)
    b.reverse() //big endian
    return b
  }

  static bytesFromString(value: string) {
    let byteArray: number[] = []
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) <= 0x7f) {
        byteArray.push(value.charCodeAt(i))
      } else {
        let h = encodeURIComponent(value.charAt(i)).substr(1).split('%')
        for (let j = 0; j < h.length; j++) {
          byteArray.push(parseInt(h[j], 16))
        }
      }
    }
    return byteArray
  }

  static bytesFromInt(value: number) {
    return this._intEncode(value, 4)
  }

  static bytesFromUInt(value: number) {
    return this._intEncode(value, 4)
  }

  static bytesFromLong(value: number) {
    return this._intEncode(value, 8)
  }

  static bytesFromULong(value: number) {
    return this._intEncode(value, 8)
  }

  static bytesFromFloat(value: number) {
    return this._floatEncode(value, 23, 8)
  }

  static bytesFromDouble(value: number) {
    return this._floatEncode(value, 52, 11)
  }

  static _intDecode(
    bytes: number[] | Uint8Array | Buffer,
    position: number,
    length: number,
    typeBytes: number,
    signed: boolean,
  ) {
    let end = position + length - 1
    let negate = signed && length == typeBytes && bytes[position] & 0x80
    let value = 0,
      carry = 1
    for (let i = 0; i < length; i++) {
      let v = bytes[end - i]
      if (negate) {
        v = (v ^ 0xff) + carry
        carry = v >> 8
        v = v & 0xff
      }
      value += v * this.pow2(i * 8)
    }
    value = negate ? -value : value
    return value
  }

  static _float32Decode(bytes: number[] | Uint8Array | Buffer, position: number) {
    let b = bytes.slice(position, position + 4).reverse(),
      sign = 1 - 2 * (b[3] >> 7),
      exponent = (((b[3] << 1) & 0xff) | (b[2] >> 7)) - 127,
      mantissa = ((b[2] & 0x7f) << 16) | (b[1] << 8) | b[0]

    if (exponent === 128) {
      if (mantissa !== 0) {
        return NaN
      } else {
        return sign * Infinity
      }
    }

    if (exponent === -127) {
      // Denormalized
      return sign * mantissa * this.pow2(-126 - 23)
    }

    return sign * (1 + mantissa * this.pow2(-23)) * this.pow2(exponent)
  }

  static _float64Decode(bytes: number[] | Uint8Array | Buffer, position: number) {
    let b = bytes.slice(position, position + 8).reverse(),
      sign = 1 - 2 * (b[7] >> 7),
      exponent = ((((b[7] << 1) & 0xff) << 3) | (b[6] >> 4)) - ((1 << 10) - 1),
      mantissa =
        (b[6] & 0x0f) * this.pow2(48) +
        b[5] * this.pow2(40) +
        b[4] * this.pow2(32) +
        b[3] * this.pow2(24) +
        b[2] * this.pow2(16) +
        b[1] * this.pow2(8) +
        b[0]

    if (exponent === 1024) {
      if (mantissa !== 0) {
        return NaN
      } else {
        return sign * Infinity
      }
    }

    if (exponent === -1023) {
      // Denormalized
      return sign * mantissa * this.pow2(-1022 - 52)
    }

    return sign * (1 + mantissa * this.pow2(-52)) * this.pow2(exponent)
  }

  static stringFromBytes(bytes: number[] | Uint8Array | Buffer, position: number, length: number) {
    let str = ''
    for (let i = position; i < position + length; i++)
      str +=
        bytes[i] <= 0x7f
          ? bytes[i] === 0x25
            ? '%25' // %
            : String.fromCharCode(bytes[i])
          : '%' + bytes[i].toString(16).toUpperCase()
    return decodeURIComponent(str)
  }

  static intFromBytes(bytes: number[] | Uint8Array | Buffer, position: number, length: number) {
    return this._intDecode(bytes, position, length, 4, true)
  }

  static uintFromBytes(bytes: number[] | Uint8Array | Buffer, position: number, length: number) {
    return this._intDecode(bytes, position, length, 4, false)
  }

  static longFromBytes(bytes: number[] | Uint8Array | Buffer, position: number, length: number) {
    return this._intDecode(bytes, position, length, 8, true)
  }

  static ulongFromBytes(bytes: number[] | Uint8Array | Buffer, position: number, length: number) {
    return this._intDecode(bytes, position, length, 8, false)
  }

  static floatFromBytes(bytes: number[] | Uint8Array | Buffer, position: number, length: number) {
    if (length == 4) {
      return this._float32Decode(bytes, position)
    }
    return NaN
  }

  static doubleFromBytes(bytes: number[] | Uint8Array | Buffer, position: number, length: number) {
    if (length == 8) {
      return this._float64Decode(bytes, position)
    }
    return NaN
  }
}

export class ByteWriter {
  bytes: number[]

  constructor() {
    this.bytes = []
  }

  writeByte(byte: number) {
    if (byte >= 0 && byte < 256) this.bytes.push(byte)
    else throw Error('This is not a byte value: ' + byte)
  }

  writeBytes(bytes: number[]) {
    for (let i = 0; i != bytes.length; i++) {
      this.writeByte(bytes[i])
    }
  }

  writeTagWithLength(length: number, topPattern: number, bottomPattern: number) {
    if (length > 63 || length < 0) {
      this.writeBottomPatternAndBytes(bottomPattern, BinarySerializer.bytesFromInt(length))
    } else {
      this.writeByte(topPattern | length)
    }
  }

  writeBottomPatternAndBytes(pattern: number, bytes: number[]) {
    let count = 0
    if (bytes[0] != 0) count = 3
    else if (bytes[1] != 0) count = 2
    else if (bytes[2] != 0) count = 1

    this.writeByte(pattern | count)
    for (let i = bytes.length - count - 1; i != bytes.length; i++) {
      this.writeByte(bytes[i])
    }
  }

  writeLongPattern(shortPattern: number, longPattern: number, bytes: number[]) {
    let count = 0
    for (let i = 0; i != 7; i++) {
      if (bytes[i] != 0) {
        count = 7 - i
        break
      }
    }

    if (count > 3) {
      this.writeByte(longPattern | (count - 4))
    } else {
      this.writeByte(shortPattern | count)
    }

    for (let i = bytes.length - count - 1; i != bytes.length; i++) {
      this.writeByte(bytes[i])
    }
  }
}

/**
 * simple bas64 round trip methods for arrays of bytes (0-255)
 */
export class Base64Processer {
  static readonly codex = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  static readonly _inverseCodex: { [codexCharCode: number]: number } = {} //this.codex.split("").map(v => );

  static get inverseCodex() {
    if (this._inverseCodex[43]) {
      // 43 exists
      return this._inverseCodex
    }

    for (let i = 0; i < this.codex.length; i++) {
      this._inverseCodex[this.codex.charCodeAt(i)] = i
    }

    return this._inverseCodex
  }

  static encode(bytes: number[] | Uint8Array | Buffer) {
    const output = []

    for (var b = 0; b < bytes.length; b++) {
      // pick the 3 bytes
      var b1 = bytes[b]
      var b2 = ++b <= bytes.length ? bytes[b] : NaN
      var b3 = ++b <= bytes.length ? bytes[b] : NaN

      // encode them together
      var enc1 = b1 >> 2
      var enc2 = ((b1 & 3) << 4) | (b2 >> 4)
      var enc3 = ((b2 & 15) << 2) | (b3 >> 6)
      var enc4 = b3 & 63

      // overflow w. /
      if (Number.isNaN(b2)) {
        enc3 = enc4 = 64
      } else if (Number.isNaN(b3)) {
        enc4 = 64
      }

      output.push(this.codex.charAt(enc1))
      output.push(this.codex.charAt(enc2))
      output.push(this.codex.charAt(enc3))
      output.push(this.codex.charAt(enc4))
    }

    return output.join('')
  }

  static decode(str: string) {
    const output = []

    for (var c = 0; c < str.length; c++) {
      // pick the 4 characters representing 3 bytes
      var chr1 = this.inverseCodex[str.charCodeAt(c)]
      var chr2 = ++c < str.length ? this.inverseCodex[str.charCodeAt(c)] : 64
      var chr3 = ++c < str.length ? this.inverseCodex[str.charCodeAt(c)] : 64
      var chr4 = ++c < str.length ? this.inverseCodex[str.charCodeAt(c)] : 64

      // encode them together
      var b1 = (chr1 << 2) | (chr2 >> 4)
      var b2 = ((chr2 & 15) << 4) | (chr3 >> 2)
      var b3 = ((chr3 & 3) << 6) | chr4

      output.push(b1)
      if (chr3 != 64) {
        output.push(b2)
        if (chr4 != 64) {
          output.push(b3)
        }
      }
    }
    return output
  }
}
