export interface FileImportAsArrayBufferResult {
  data: ArrayBuffer
  file: File
}

export function downloadFile(buffer: Buffer, fileName: string) {
  const blob = new Blob([buffer])
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
}

export async function getFileAsArrayBuffer(event: Event): Promise<FileImportAsArrayBufferResult | null> {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const fileData = e.target?.result as ArrayBuffer
        if (fileData) {
          target.value = '' // needed, so that importing same file, triggers the event again
          resolve({ data: fileData, file: file })
        } else {
          resolve(null)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }
  return null
}
