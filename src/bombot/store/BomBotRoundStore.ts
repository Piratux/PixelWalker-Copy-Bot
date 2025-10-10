import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Player } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { PlayerBomBotRoundData } from '@/bombot/type/BomBotPlayerRoundData.ts'
import { BomBotSpecialBomb } from '@/bombot/enum/BomBotSpecialBomb.ts'

export const useBomBotRoundStore = defineStore('BomBotRoundStore', () => {
  const availablePlayerSpawnPositions = ref<vec2[]>([])
  const playersInGame = ref<Player[]>([])
  const lastPlayerSelectedArrayIndex = ref<number>(0)
  const totalPlayersTeleportedToMap = ref<number>(0)
  const totalPlayersTeleportedToMapLastSeenValue = ref<number>(0)
  const totalPlayersTeleportedToMapSecondsPassedSinceValuesMatch = ref<number>(0)
  const playersThatWereSelectedForRoundStart = ref<Player[]>([])
  const playerIdsBomberQueueOriginal = ref<number[]>([]) // couldn't think of better name for this
  const playerIdsBomberQueueRemainder = ref<number[]>([])
  const bomberPlayerId = ref<number>(0)
  // TODO: allow bomber to consecutively place bombs, once death packet contains position of player death
  // const totalTimesBomberKilledSomeoneInARow = ref<number>(0)
  // const playerWasKilledByLastBomb = ref<boolean>(false)
  const secondsSpentByBomber = ref<number>(0)
  const secondsLeftBeforeBombMustBeRemoved = ref<number>(0)
  const secondsLeftBeforeBomberCanBomb = ref<number>(0) // prevent bomber from being to immediately place bombs
  const lastBombPos = ref<vec2>(vec2(0, 0))
  const lastBombType = ref<BomBotSpecialBomb | null>(null) // null indicates normal bomb type
  const bombAvailable = ref<boolean>(false) // prevent placing multiple bombs per bomber
  const waitingForMorePlayersMessagePrintedOnce = ref<boolean>(false)
  const playerBombotRoundData = ref<PlayerBomBotRoundData>({})

  return {
    availablePlayerSpawnPositions,
    playersInGame,
    lastPlayerSelectedArrayIndex,
    totalPlayersTeleportedToMap,
    totalPlayersTeleportedToMapLastSeenValue,
    totalPlayersTeleportedToMapSecondsPassedSinceValuesMatch,
    playersThatWereSelectedForRoundStart,
    playerIdsBomberQueueOriginal,
    playerIdsBomberQueueRemainder,
    bomberPlayerId,
    // totalTimesBomberKilledSomeoneInARow,
    // playerWasKilledByLastBomb,
    secondsSpentByBomber,
    secondsLeftBeforeBombMustBeRemoved,
    secondsLeftBeforeBomberCanBomb,
    lastBombPos,
    lastBombType,
    bombAvailable,
    waitingForMorePlayersMessagePrintedOnce,
    playerBombotRoundData,
  }
})
