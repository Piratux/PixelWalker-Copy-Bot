/** @module QuickConnect */

import HTTPChannel from './channel.ts'
import PlayerIOClient from './client.ts'

import { convertToSegmentArray, convertToKVArray, KeyValue } from './utilities/util.ts'

const QuickConnect = {
  /**
   * @param gameId The game id of the game you wish to connect to. This value can be found in the admin panel.
   * @param usernameOrEmail The username, or email of the account to login via.
   * @param password The password of the account to use to login with.
   * @param playerInsightSegments Custom segments for the user in PlayerInsight.
   */
  simpleConnect: (
    gameId: string,
    usernameOrEmail: string,
    password: string,
    playerInsightSegments?: KeyValue,
  ): Promise<PlayerIOClient> => {
    let channel = new HTTPChannel('')

    return channel
      .simpleConnect(
        gameId,
        usernameOrEmail,
        password,
        convertToSegmentArray(playerInsightSegments),
        'javascript',
        convertToKVArray({}),
      )
      .then((result) => {
        channel.token = result.token

        return new PlayerIOClient(channel, gameId, result.gamefsredirectmap, result.userid)
      })
  },

  /*simpleRegister: (gameId: string, usernameOrEmail: string, password: string, email: string, captchaKey: string, captchaValue: string, extraData?: object, partnerId=null, playerInsightSegments=null) => {
        let channel = new HTTPChannel("");

        return; //channel.simpleRegister(gameId, usernameOrEmail, password, email, captchaKey, captchaKey, util.convertToSegmentArray(playerInsightSegments))
    }*/
}

export default QuickConnect
