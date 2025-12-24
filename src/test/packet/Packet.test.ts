import { beforeEach, describe, expect, test } from 'vitest'
import { getPwApiClient, getPwGameClient, getPwGameWorldHelper, usePwClientStore } from '@/core/store/PwClientStore.ts'
import { compareDeserialisedStructureData } from '@/test/RuntimeTestsUtil.ts'
import { authenticate, clearWorld, getAllWorldBlocks, joinWorld } from '@/core/service/PwClientService.ts'
import { getAnotherWorldBlocks, placeWorldDataBlocks } from '@/core/service/WorldService.ts'
import { CustomBotEvents, PWApiClient, PWGameClient, WorldEventNames } from 'pw-js-api'
import { PWGameWorldHelper } from 'pw-js-world'
import { workerWaitUntil } from '@/core/util/WorkerWaitUntil.ts'

const everyBlockWorldId = 'ewki341n7ve153l'

// NOTE: These tests should be done by pw-js-api/pw-js-world libraries author, but author does not do them.
describe.sequential('Packets', () => {
  beforeEach(async () => {
    await clearWorld()
  })

  test('Map update from WorldBlockPlacedPacket', { timeout: 60_000 }, async () => {
    const expectedData = await getAnotherWorldBlocks(everyBlockWorldId, getPwApiClient())

    await expect(placeWorldDataBlocks(expectedData), 'Failed to place world data blocks').resolves.toBe(true)

    const receivedData = getAllWorldBlocks(getPwGameWorldHelper())

    compareDeserialisedStructureData(receivedData, expectedData)
  })

  test('Map update from PlayerInitPacket.world_data', { timeout: 60_000 }, async () => {
    const expectedData = await getAnotherWorldBlocks(everyBlockWorldId, getPwApiClient())

    await expect(placeWorldDataBlocks(expectedData), 'Failed to place world data blocks').resolves.toBe(true)

    getPwGameClient().disconnect(false)

    const pwApiClient = new PWApiClient(usePwClientStore().email, usePwClientStore().password)

    await authenticate(pwApiClient)

    const worldId = usePwClientStore().worldId

    const pwGameClient = new PWGameClient(pwApiClient)
    const pwGameWorldHelper = new PWGameWorldHelper()

    let initReceived = false
    pwGameClient.addHook(pwGameWorldHelper.receiveHook).addCallback('playerInitPacket', async () => {
      pwGameClient.send('playerInitReceived')

      const receivedData = getAllWorldBlocks(pwGameWorldHelper)
      compareDeserialisedStructureData(receivedData, expectedData)
      pwGameClient.disconnect(false)

      const eventName: WorldEventNames | keyof CustomBotEvents = 'playerInitPacket'

      const playerInitPacketReceived = () => {
        getPwGameClient().removeCallback(eventName, playerInitPacketReceived)
        initReceived = true
      }

      getPwGameClient().addCallback(eventName, playerInitPacketReceived)

      await joinWorld(getPwGameClient(), worldId)
    })

    await joinWorld(pwGameClient, worldId)
    await workerWaitUntil(() => initReceived, { timeout: 30000, intervalBetweenAttempts: 1000 })
  })
})
