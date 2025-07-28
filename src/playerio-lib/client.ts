/** @module PlayerIOClient */

// Classes

import HTTPChannel from './channel.ts'
import GameFS from './services/gamefs.ts'
import PayVault from './services/payvault.ts'
import BigDB from './services/bigdb.ts'
import Multiplayer from './services/multiplayer.ts'
import Achievements from './services/achievements.ts'

// Misc
import { KeyValue, convertToKVArray, convertToSegmentArray } from './utilities/util.ts'
//const util = require("./utilities.js");

/**
 * If you're creating a new one, use authenticate/quickconnect (via the class, not an instance of itself!)
 */
export default class PlayerIOClient {
  /**
   * User id of the currently connected user.
   */
  connectUserId: string

  /**
   * The game id of the client.
   */
  gameId: string

  /**
   * This is where the api requests are made, don't use this unless you know what you're doing.
   * This is for internal use mainly.
   */
  channel: HTTPChannel

  /**
   * The GameFS service.
   */
  gameFS: GameFS

  /**
   * The PayVault service.
   */
  payVault: PayVault

  /**
   * The BigDB service.
   */
  bigDB: BigDB

  /**
   * The Multiplayer service.
   */
  multiplayer: Multiplayer

  /**
   * The Achievements service.
   */
  achievements: Achievements

  constructor(channel: HTTPChannel, gameId: string, gameFsRedirectMap: any, userId: string) {
    this.channel = channel
    this.connectUserId = userId

    this.gameId = gameId

    this.gameFS = new GameFS(gameId, gameFsRedirectMap)
    this.payVault = new PayVault(channel)
    this.bigDB = new BigDB(channel)
    this.multiplayer = new Multiplayer(channel)
    this.achievements = new Achievements(channel)

    // /**
    // * The GameRequests service
    // */
    // this.gameRequests = new _pio.gameRequests(channel);

    // /**
    // * The Achievements service
    // */
    // this.achievements = new _pio.achievements(channel);

    // /**
    // * The PlayerInsight service
    // */
    // this.playerInsight = new _pio.playerInsight(channel);

    // /**
    // * The OneScore service
    // */
    // this.oneScore = new _pio.oneScore(channel);

    // /**
    // * The Leaderboards service
    // */
    // this.leaderboards = new _pio.leaderboards(channel, this.connectUserId);

    // /**
    // * The Notifications service
    // */
    // this.notifications = new _pio.notifications(channel);

    // /**
    // * The PlayerIO Publishing Network service
    // */
    // this.publishingNetwork = new _pio.publishingNetwork(channel, this.connectUserId);/**/
  }

  /**
   * Authenticates a user to Player.IO. See the Authentication documentation on which authenticationArguments that are needed for each authentication provider.
   * @param gameId The game id of the game you wish to connect to. This value can be found in the admin panel.
   * @param connectionId The id of the connection, as given in the settings section of the admin panel. 'public' should be used as the default
   * @param authenticationArguments A dictionary of arguments for the given connection.
   * @param playerInsightSegments Custom segments for the user in PlayerInsight.
   */
  static authenticate(
    gameId: string,
    connectionId: string,
    authenticationArguments?: KeyValue,
    playerInsightSegments?: KeyValue,
  ): Promise<PlayerIOClient> {
    let channel = new HTTPChannel('')
    return channel
      .authenticate(
        gameId,
        connectionId,
        convertToKVArray(authenticationArguments),
        convertToSegmentArray(playerInsightSegments),
        'javascript',
        convertToKVArray({}),
        null,
      )
      .then((result) => {
        channel.token = result.token
        return new this(channel, gameId, result.gamefsredirectmap, result.userid)
      })
  }
}
