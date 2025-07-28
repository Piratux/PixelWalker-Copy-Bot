/* eslint-disable */
// @ts-nocheck

/** @module Utilities */
import { ValueType } from '../constants.ts'
import PlayerIOError from '../error.ts'

const { PlayerIOErrorCode } = PlayerIOError

// NOTE: some types are intentionally poorly documented, as they're mostly for internal pio uses.

export type KVArray = {
  key: string
  value: string
}[]

export type KeyValue<T = unknown> = {
  [key: string]: T
}

export function convertToKVArray(obj?: KeyValue): KVArray {
  let result: KVArray = []

  if (obj) {
    for (let k in obj) {
      result.push({ key: k, value: '' + obj[k] })
    }
  }
  return result
}

/**
 * KVArray is a dictionary in C#
 */
export function convertFromKVArray(arr?: KVArray): KeyValue<string> {
  let result: { [key: string]: string } = {}

  if (arr && arr.length) {
    for (let k in arr) {
      result[arr[k].key] = arr[k].value
    }
  }
  return result
}

export function convertToSegmentArray(obj?: KeyValue): string[] {
  let result: string[] = []

  if (obj) {
    for (let k in obj) {
      result.push(k + ':' + obj[k])
    }
  }
  return result
}

export function compareForChanges(original: any, current: any, isObject: any, isRoot: any) {
  let changes: any[] = []

  // loop over all values in the current object
  // to find sets and changes
  for (let key in current) {
    let value = current[key]
    let valueOriginal = original ? original[key] : null

    switch (key) {
      case 'table':
      case 'key':
      case 'save':
      case 'existsInDatabase':
      case '_internal_':
      case '_circular_reference_finder_':
        continue
    }

    if (value != null) {
      let prop: any = isObject ? { name: key } : { index: parseInt(key) }

      switch (typeof value) {
        case 'boolean':
          if (value != valueOriginal) {
            prop.value = { valuetype: ValueType.Bool, bool: value }
            changes.push(prop)
          }
          break
        case 'number':
          if (value != valueOriginal) {
            if (isFinite(value) && Math.floor(value) === value) {
              if (value >= -2147483648 && value <= 2147483647) {
                prop.value = { valuetype: ValueType.Int, int: value }
              } else if (value > 0 && value <= 4294967295) {
                prop.value = { valuetype: ValueType.UInt, uint: value }
              } else if (value >= -9223372036854775000 && value <= 9223372036854775000) {
                //Boundary is rounded because max_long and min_long can't be accurately represented as double
                prop.value = { valuetype: ValueType.Long, long: value }
                //} else if (value > 0 && value <= 18446744073709550000) { //Boundary is rounded because max_ulong can't be accurately represented as double
                //prop.value = { valuetype: ValueType.ULong, ulong: value }
              } else {
                prop.value = { valuetype: ValueType.Double, double: value }
              }
            } else {
              prop.value = { valuetype: ValueType.Double, double: value }
            }
            changes.push(prop)
          }
          break
        case 'string':
          if (value != valueOriginal) {
            prop.value = { valuetype: ValueType.String, string: value }
            changes.push(prop)
          }
          break
        case 'object': // date, object & array
          if (value.getTime && value.getMilliseconds) {
            // date
            if (value + '' != valueOriginal + '') {
              prop.value = { valuetype: ValueType.DateTime, datetime: value.getTime() }
              changes.push(prop)
            }
          } else {
            // check for circular references
            if (value._circular_reference_finder_) {
              throw new PlayerIOError(
                PlayerIOErrorCode.CircularReference,
                "The object you're trying to save contains a circular reference for " +
                  (isObject ? 'a property named' : 'the array entry') +
                  '): ' +
                  key,
              )
            } else {
              value._circular_reference_finder_ = true
            }

            let valueIsArray = value instanceof Array
            if (valueIsArray && value.bytearray) {
              let bytes = new Array(value.length)
              for (let i = 0; i != bytes.length; i++) {
                let val = value[i]
                if (val >= 0 && val <= 255) {
                  bytes[i] = val
                } else {
                  throw new PlayerIOError(
                    PlayerIOErrorCode.GeneralError,
                    "The bytearray property '" +
                      key +
                      "' was supposed to only contain byte (0-255) values, but contained the value: " +
                      val,
                  )
                }
              }
              prop.value = { valuetype: ValueType.ByteArray, bytearray: bytes }
            } else {
              let subChanges = compareForChanges(valueOriginal, value, !valueIsArray, false)
              if (valueIsArray) {
                prop.value = { valuetype: ValueType.Array, arrayproperties: subChanges }
              } else {
                prop.value = { valuetype: ValueType.Obj, objectproperties: subChanges }
              }
            }
            changes.push(prop)

            // remove circular reference finder
            delete value._circular_reference_finder_
          }
          break
        case 'undefined':
          break
        case 'function':
          break
        default:
          throw new Error("Don't know how to serialize type '" + typeof value + "' for BigDB")
      }
    }
  }

  // loop over all values in the original object to find
  // properties that were deleted
  for (let key in original) {
    if (current[key] == null || typeof current[key] == 'undefined') {
      // property was deleted
      changes.push(isObject ? { name: key } : { index: parseInt(key) }) //getProp(null, key, isObject));
    }
  }

  return changes
}
