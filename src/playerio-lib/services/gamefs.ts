/** @module GameFS */

export default class GameFS {
  maps: { [idk: string]: any }
  gameId: string

  constructor(gameId: string, redirectMap?: string) {
    this.gameId = gameId
    this.maps = {}

    if (typeof redirectMap === 'string' && redirectMap.length > 0) {
      const parts = redirectMap.split('|')

      if (parts.length >= 1) {
        this.maps[this.gameId.toLowerCase()] = {}

        for (let i = 0; i != parts.length; i++) {
          const part = parts[i]

          if (part === 'alltoredirect' || part === 'cdnmap') this.maps.baseUrl = parts[i + 1]
          else if (part === 'alltoredirectsecure' || part === 'cdnmapsecure') this.maps.secureBaseUrl = parts[i + 1]
          else this.maps['.' + part] = parts[i + 1]
        }
      }
    }
  }

  /**
   * Converts a GameFS path (like '/mygame.swf') into a full url, that can be downloaded over the internet.
   * Important! Do not save or otherwise persist (bigdb, cookies, etc) the returned url, since the url will change over time.
   * @param path The path of the file in the GameFS, including the initial slash. Examples: '/mygame.swf' or '/characters/bob.jpg'
   * @param secure If true, this method returns a secure (https) url.
   * @returns An url that can be used to download the resource over the internet.
   */
  getUrl(path: string, secure: boolean): string {
    if (path[0] !== '/')
      throw Error("The path given to getUrl must start with a slash, like: '/myfile.swf' or '/folder/file.jpg'")

    const map = this.maps[this.gameId]

    if (map) return (secure ? map.secureBaseUrl : map.baseUrl) + (map['.' + path] || path)
    else return (secure ? 'https' : 'http') + '://r.playerio.com/r/' + this.gameId + path
  }
}
