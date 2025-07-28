/** @module Constants */
export enum ValueType {
  String = 0,
  Int = 1,
  UInt = 2,
  Long = 3,
  Bool = 4,
  Float = 5,
  Double = 6,
  ByteArray = 7,
  DateTime = 8,
  Array = 9,
  Obj = 10,
}

export enum LockType {
  NoLocks = 0,
  LockIndividual = 1,
  LockAll = 2,
}

export enum EntryType {
  Integer = 0,
  UnsignedInteger = 1,
  Long = 2,
  UnsignedLong = 3,
  Double = 4,
  Float = 5,
  String = 6,
  ByteArray = 7,
  Boolean = 8,
  /**
   * NOTE THIS IS CUSTOM, IT BYPASSES ALL CHECK FOR WHETHER IF IT HAS A DECIMAL PLACE OR NOT, WHETHER IF IT'S BIGGER THAN YOUR MOTHER OR NOT.
   */
  Number = 69,
}
