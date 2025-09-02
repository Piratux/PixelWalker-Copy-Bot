import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Player } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'

export const useBomBotRoundStore = defineStore('BomBotRoundStore', () => {
  const availablePlayerSpawnPositions = ref<vec2[]>([])
  const playersInGame = ref<Player[]>([])
  const lastPlayerSelectedArrayIndex = ref<number>(0)
  const totalPlayersTeleportedToMap = ref<number>(0)
  const totalPlayersTeleportedToMapLastSeenValue = ref<number>(0)
  const totalPlayersTeleportedToMapSecondsPassedSinceValuesMatch = ref<number>(0)
  const playersThatWereSelectedForRoundStart = ref<Player[]>([])
  const bomberPlayerId = ref<number>(0)
  const previousBomberPlayerId = ref<number>(0) // prevent same bomber twice in a row
  // TODO: allow bomber to consecutively place bombs, once death packet contains position of player death
  // const totalTimesBomberKilledSomeoneInARow = ref<number>(0)
  // const playerWasKilledByLastBomb = ref<boolean>(false)
  const secondsSpentByBomber = ref<number>(0)
  const secondsLeftBeforeBombMustBeRemoved = ref<number>(0)
  const secondsLeftBeforeBomberCanBomb = ref<number>(0) // prevent bomber from being to immediately place bombs
  const lastBombPos = ref<vec2>(vec2(0, 0))
  const bombAvailable = ref<boolean>(false) // prevent placing multiple bombs per bomber
  const waitingForMorePlayersMessagePrintedOnce = ref<boolean>(false)

  return {
    availablePlayerSpawnPositions,
    playersInGame,
    lastPlayerSelectedArrayIndex,
    totalPlayersTeleportedToMap,
    totalPlayersTeleportedToMapLastSeenValue,
    totalPlayersTeleportedToMapSecondsPassedSinceValuesMatch,
    playersThatWereSelectedForRoundStart,
    bomberPlayerId,
    previousBomberPlayerId,
    // totalTimesBomberKilledSomeoneInARow,
    // playerWasKilledByLastBomb,
    secondsSpentByBomber,
    secondsLeftBeforeBombMustBeRemoved,
    secondsLeftBeforeBomberCanBomb,
    lastBombPos,
    bombAvailable,
    waitingForMorePlayersMessagePrintedOnce,
  }
})
