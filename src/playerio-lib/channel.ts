/** @module HTTPChannel */
import type { LockType } from './constants.ts'
import PlayerIOError from './error.ts'
import type { KVArray } from './utilities/util.ts'

/**
 * This is based on PIO's implementation of their own channel, it's essentially a wrapper for HTTP requests.
 */
export default class HTTPChannel {
  /**
   * Authorization token. (Note if this isn't passed, simply using a connect method will supplement this)
   *
   * DO NOT TOUCH THIS!
   */
  token: string

  constructor(token: string) {
    this.token = token
  }

  /**
   * @param method NOT TO BE CONFUSED WITH THINGS LIKE "get", "post" et This is essentially the type of request you're sending, for eg 10 is connect
   * @param args
   */
  async call(method: number, args: any) {
    const result = await fetch('https://api.playerio.com/json/', {
      method: 'POST',
      body: '[' + method + '|' + (this.token || '') + ']' + JSON.stringify(args),
    })

    let text = await result.text()

    if (text[0] === '[') {
      let end = text.indexOf(']')
      this.token = text.substring(1, end)
      text = text.substring(end + 1)
    }

    // bandage fix for bigdb load where pio may add in NaN, which can't be parsed...?
    const json = JSON.parse(text.replace(/:NaN/g, ':null'))

    if (json.errorcode) throw new PlayerIOError(json.errorcode, json.message)

    return json
  }

  // no, i dont care and im not willing to go through each and every single one of these.

  connect(
    gameId: string,
    connectionId: string,
    userId: string,
    auth: any,
    partnerId: any,
    playerInsightSegments: any,
    clientAPI: any,
    clientInfo: any,
  ) {
    return this.call(10, {
      gameid: gameId,
      connectionid: connectionId,
      userid: userId,
      auth: auth,
      partnerid: partnerId,
      playerinsightsegments: playerInsightSegments,
      clientapi: clientAPI,
      clientinfo: clientInfo,
    })
  }

  authenticate(
    gameId: string,
    connectionId: string,
    authenticationArguments: KVArray,
    playerInsightSegments: string[],
    clientAPI: string,
    clientInfo: KVArray,
    playCodes: null,
  ) {
    return this.call(13, {
      gameid: gameId,
      connectionid: connectionId,
      authenticationarguments: authenticationArguments,
      playerinsightsegments: playerInsightSegments,
      clientapi: clientAPI,
      clientinfo: clientInfo,
      playcodes: playCodes,
    })
  }
  createRoom(roomId: string, roomType: string, visible: boolean, roomData: KVArray, isDevRoom: boolean) {
    return this.call(21, {
      roomid: roomId,
      roomtype: roomType,
      visible: visible,
      roomdata: roomData,
      isdevroom: isDevRoom,
    })
  }
  joinRoom(roomId: string, joinData: KVArray, isDevRoom: boolean, serverDomainNameNeeded: boolean) {
    return this.call(24, {
      roomid: roomId,
      joindata: joinData,
      isdevroom: isDevRoom,
      serverdomainnameneeded: serverDomainNameNeeded,
    })
  }
  createJoinRoom(
    roomId: string,
    roomType: string,
    visible: boolean,
    roomData: KVArray,
    joinData: KVArray,
    isDevRoom: boolean,
    serverDomainNameNeeded: boolean,
  ) {
    return this.call(27, {
      roomid: roomId,
      roomtype: roomType,
      visible: visible,
      roomdata: roomData,
      joindata: joinData,
      isdevroom: isDevRoom,
      serverdomainnameneeded: serverDomainNameNeeded,
    })
  }
  listRooms(
    roomType: string,
    searchCriteria: KVArray,
    resultLimit: number,
    resultOffset: number | undefined,
    onlyDevRooms: boolean,
  ) {
    return this.call(30, {
      roomtype: roomType,
      searchcriteria: searchCriteria,
      resultlimit: resultLimit,
      resultoffset: resultOffset,
      onlydevrooms: onlyDevRooms,
    })
  }
  userLeftRoom(extendedRoomId: any, newPlayerCount: any, closed: any) {
    return this.call(40, { extendedroomid: extendedRoomId, newplayercount: newPlayerCount, closed: closed })
  }
  writeError(source: any, error: any, details: any, stacktrace: any, extraData: any) {
    return this.call(50, {
      source: source,
      error: error,
      details: details,
      stacktrace: stacktrace,
      extradata: extraData,
    })
  }
  updateRoom(extendedRoomId: any, visible: any, roomData: any) {
    return this.call(53, { extendedroomid: extendedRoomId, visible: visible, roomdata: roomData })
  }
  //
  createObjects(objects: any, loadExisting: boolean) {
    return this.call(82, { objects: objects, loadexisting: loadExisting })
  }
  loadObjects(objectIds: any) {
    return this.call(85, { objectids: objectIds })
  }
  //_pio.LockType = {NoLocks:0,LockIndividual:1,LockAll:2}
  saveObjectChanges(lockType: LockType, changesets: any, createIfMissing: boolean | undefined) {
    return this.call(88, { locktype: lockType, changesets: changesets, createifmissing: createIfMissing })
  }
  deleteObjects(objectIds: any) {
    return this.call(91, { objectids: objectIds })
  }
  loadMatchingObjects(table: string, index: string, indexValue: any, limit: number) {
    return this.call(94, { table: table, index: index, indexvalue: indexValue, limit: limit })
  }
  loadIndexRange(table: string, index: string, startIndexValue: any, stopIndexValue: any, limit: number | undefined) {
    return this.call(97, {
      table: table,
      index: index,
      startindexvalue: startIndexValue,
      stopindexvalue: stopIndexValue,
      limit: limit,
    })
  }
  deleteIndexRange(table: string, index: string, startIndexValue: any, stopIndexValue: any) {
    return this.call(100, {
      table: table,
      index: index,
      startindexvalue: startIndexValue,
      stopindexvalue: stopIndexValue,
    })
  }
  loadMyPlayerObject() {
    return this.call(103, {})
  }
  payVaultReadHistory(page: number, pageSize: number, targetUserId: null) {
    return this.call(160, { page: page, pagesize: pageSize, targetuserid: targetUserId })
  }
  payVaultRefresh(lastVersion: string | null, targetUserId: null) {
    return this.call(163, { lastversion: lastVersion, targetuserid: targetUserId })
  }
  payVaultConsume(ids: string[], targetUserId: null) {
    return this.call(166, { ids: ids, targetuserid: targetUserId })
  }
  payVaultCredit(amount: number, reason: string, targetUserId: null) {
    return this.call(169, { amount: amount, reason: reason, targetuserid: targetUserId })
  }
  payVaultDebit(amount: number, reason: string, targetUserId: null) {
    return this.call(172, { amount: amount, reason: reason, targetuserid: targetUserId })
  }
  payVaultBuy(items: any, storeItems: boolean, targetUserId: null) {
    return this.call(175, { items: items, storeitems: storeItems, targetuserid: targetUserId })
  }
  payVaultGive(items: any, targetUserId: null) {
    return this.call(178, { items: items, targetuserid: targetUserId })
  }
  payVaultPaymentInfo(provider: string, purchaseArguments: KVArray, items: any) {
    return this.call(181, { provider: provider, purchasearguments: purchaseArguments, items: items })
  }
  payVaultUsePaymentInfo(provider: any, providerArguments: any) {
    return this.call(184, { provider: provider, providerarguments: providerArguments })
  }
  partnerPayTrigger(key: any, count: any) {
    return this.call(200, { key: key, count: count })
  }
  partnerPaySetTag(partnerId: any) {
    return this.call(203, { partnerid: partnerId })
  }
  notificationsRefresh(lastVersion: any) {
    return this.call(213, { lastversion: lastVersion })
  }
  notificationsRegisterEndpoints(lastVersion: any, endpoints: any) {
    return this.call(216, { lastversion: lastVersion, endpoints: endpoints })
  }
  notificationsSend(notifications: any) {
    return this.call(219, { notifications: notifications })
  }
  notificationsToggleEndpoints(lastVersion: any, endpoints: any, enabled: any) {
    return this.call(222, { lastversion: lastVersion, endpoints: endpoints, enabled: enabled })
  }
  notificationsDeleteEndpoints(lastVersion: any, endpoints: any) {
    return this.call(225, { lastversion: lastVersion, endpoints: endpoints })
  }
  gameRequestsSend(requestType: any, requestData: any, requestRecipients: any) {
    return this.call(241, { requesttype: requestType, requestdata: requestData, requestrecipients: requestRecipients })
  }
  gameRequestsRefresh(playCodes: any) {
    return this.call(244, { playcodes: playCodes })
  }
  gameRequestsDelete(requestIds: any) {
    return this.call(247, { requestids: requestIds })
  }
  achievementsRefresh(lastVersion: string | null) {
    return this.call(271, { lastversion: lastVersion })
  }
  achievementsLoad(userIds: string[]) {
    return this.call(274, { userids: userIds })
  }
  achievementsProgressSet(achievementId: string, progress: number) {
    return this.call(277, { achievementid: achievementId, progress: progress })
  }
  achievementsProgressAdd(achievementId: string, progressDelta: number) {
    return this.call(280, { achievementid: achievementId, progressdelta: progressDelta })
  }
  achievementsProgressMax(achievementId: string, progress: number) {
    return this.call(283, { achievementid: achievementId, progress: progress })
  }
  achievementsProgressComplete(achievementId: string) {
    return this.call(286, { achievementid: achievementId })
  }
  playerInsightRefresh() {
    return this.call(301, {})
  }
  playerInsightSetSegments(segments: any) {
    return this.call(304, { segments: segments })
  }
  playerInsightTrackInvitedBy(invitingUserId: any, invitationChannel: any) {
    return this.call(307, { invitinguserid: invitingUserId, invitationchannel: invitationChannel })
  }
  playerInsightTrackEvents(events: any) {
    return this.call(311, { events: events })
  }
  playerInsightTrackExternalPayment(currency: any, amount: any) {
    return this.call(314, { currency: currency, amount: amount })
  }
  playerInsightSessionKeepAlive() {
    return this.call(317, {})
  }
  playerInsightSessionStop() {
    return this.call(320, {})
  }
  oneScoreLoad(userIds: any) {
    return this.call(351, { userids: userIds })
  }
  oneScoreSet(score: any) {
    return this.call(354, { score: score })
  }
  oneScoreAdd(score: any) {
    return this.call(357, { score: score })
  }
  oneScoreRefresh() {
    return this.call(360, {})
  }
  simpleConnect(
    gameId: string,
    usernameOrEmail: string,
    password: string,
    playerInsightSegments: string[],
    clientAPI: string,
    clientInfo: KVArray,
  ) {
    return this.call(400, {
      gameid: gameId,
      usernameoremail: usernameOrEmail,
      password: password,
      playerinsightsegments: playerInsightSegments,
      clientapi: clientAPI,
      clientinfo: clientInfo,
    })
  }
  simpleRegister(
    gameId: any,
    username: any,
    password: any,
    email: any,
    captchaKey: any,
    captchaValue: any,
    extraData: any,
    partnerId: any,
    playerInsightSegments: any,
    clientAPI: any,
    clientInfo: any,
  ) {
    return this.call(403, {
      gameid: gameId,
      username: username,
      password: password,
      email: email,
      captchakey: captchaKey,
      captchavalue: captchaValue,
      extradata: extraData,
      partnerid: partnerId,
      playerinsightsegments: playerInsightSegments,
      clientapi: clientAPI,
      clientinfo: clientInfo,
    })
  }
  simpleRecoverPassword(gameId: any, usernameOrEmail: any) {
    return this.call(406, { gameid: gameId, usernameoremail: usernameOrEmail })
  }
  kongregateConnect(
    gameId: any,
    userId: any,
    gameAuthToken: any,
    playerInsightSegments: any,
    clientAPI: any,
    clientInfo: any,
  ) {
    return this.call(412, {
      gameid: gameId,
      userid: userId,
      gameauthtoken: gameAuthToken,
      playerinsightsegments: playerInsightSegments,
      clientapi: clientAPI,
      clientinfo: clientInfo,
    })
  }
  simpleGetCaptcha(gameId: any, width: any, height: any) {
    return this.call(415, { gameid: gameId, width: width, height: height })
  }
  facebookOAuthConnect(
    gameId: any,
    accessToken: any,
    partnerId: any,
    playerInsightSegments: any,
    clientAPI: any,
    clientInfo: any,
  ) {
    return this.call(418, {
      gameid: gameId,
      accesstoken: accessToken,
      partnerid: partnerId,
      playerinsightsegments: playerInsightSegments,
      clientapi: clientAPI,
      clientinfo: clientInfo,
    })
  }
  steamConnect(
    gameId: any,
    steamAppId: any,
    steamSessionTicket: any,
    playerInsightSegments: any,
    clientAPI: any,
    clientInfo: any,
  ) {
    return this.call(421, {
      gameid: gameId,
      steamappid: steamAppId,
      steamsessionticket: steamSessionTicket,
      playerinsightsegments: playerInsightSegments,
      clientapi: clientAPI,
      clientinfo: clientInfo,
    })
  }
  simpleUserGetSecureLoginInfo() {
    return this.call(424, {})
  }
  leaderboardsGet(group: any, leaderboard: any, index: any, count: any, neighbourUserId: any, filterUserIds: any) {
    return this.call(431, {
      group: group,
      leaderboard: leaderboard,
      index: index,
      count: count,
      neighbouruserid: neighbourUserId,
      filteruserids: filterUserIds,
    })
  }
  leaderboardsSet(group: any, leaderboard: any, score: any) {
    return this.call(434, { group: group, leaderboard: leaderboard, score: score })
  }
  leaderboardsCount(group: any, leaderboard: any) {
    return this.call(437, { group: group, leaderboard: leaderboard })
  }
  joinCluster(
    clusterAccessKey: any,
    isDevelopmentServer: any,
    ports: any,
    machineName: any,
    version: any,
    machineId: any,
    os: any,
    cpu: any,
    cpuCores: any,
    cpuLogicalCores: any,
    cpuAddressWidth: any,
    cpuMaxClockSpeed: any,
    ramMegabytes: any,
    ramSpeed: any,
  ) {
    return this.call(504, {
      clusteraccesskey: clusterAccessKey,
      isdevelopmentserver: isDevelopmentServer,
      ports: ports,
      machinename: machineName,
      version: version,
      machineid: machineId,
      os: os,
      cpu: cpu,
      cpucores: cpuCores,
      cpulogicalcores: cpuLogicalCores,
      cpuaddresswidth: cpuAddressWidth,
      cpumaxclockspeed: cpuMaxClockSpeed,
      rammegabytes: ramMegabytes,
      ramspeed: ramSpeed,
    })
  }
  serverHeartbeat(
    serverId: any,
    appDomains: any,
    serverTypes: any,
    machineCPU: any,
    processCPU: any,
    memoryUsage: any,
    avaliableMemory: any,
    freeMemory: any,
    runningRooms: any,
    usedResources: any,
    aPIRequests: any,
    aPIRequestsError: any,
    aPIRequestsFailed: any,
    aPIRequestsExecuting: any,
    aPIRequestsQueued: any,
    aPIRequestsTime: any,
    serverUnixTimeUtc: any,
  ) {
    return this.call(510, {
      serverid: serverId,
      appdomains: appDomains,
      servertypes: serverTypes,
      machinecpu: machineCPU,
      processcpu: processCPU,
      memoryusage: memoryUsage,
      avaliablememory: avaliableMemory,
      freememory: freeMemory,
      runningrooms: runningRooms,
      usedresources: usedResources,
      apirequests: aPIRequests,
      apirequestserror: aPIRequestsError,
      apirequestsfailed: aPIRequestsFailed,
      apirequestsexecuting: aPIRequestsExecuting,
      apirequestsqueued: aPIRequestsQueued,
      apirequeststime: aPIRequestsTime,
      serverunixtimeutc: serverUnixTimeUtc,
    })
  }
  getGameAssemblyUrl(clusterAccessKey: any, gameCodeId: any, machineId: any) {
    return this.call(513, { clusteraccesskey: clusterAccessKey, gamecodeid: gameCodeId, machineid: machineId })
  }
  devServerLogin(username: any, password: any) {
    return this.call(524, { username: username, password: password })
  }
  webserviceOnlineTest() {
    return this.call(533, {})
  }
  getServerInfo(machineId: any) {
    return this.call(540, { machineid: machineId })
  }
  socialRefresh() {
    return this.call(601, {})
  }
  socialLoadProfiles(userIds: any) {
    return this.call(604, { userids: userIds })
  }
}
