export function getWorldIdIfUrl(url: string): string {
  const match = /\/world\/(.+)/.exec(url)
  return match ? match[1] : url
}
