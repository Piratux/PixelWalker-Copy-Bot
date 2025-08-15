export function bufferToArrayBuffer(buffer: Buffer<ArrayBufferLike>): ArrayBuffer {
  return new Uint8Array(buffer).buffer
}
