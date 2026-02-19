import { BArenaTeam } from '@/bot/barenabot/enum/BArenaTeam.ts'
import { LabelData } from '@/core/service/LabelService.ts'
import { BArenaTeamColourMap } from '@/bot/barenabot/constant/BArenaTeamColourMap.ts'
import { Colours } from '@/core/type/Colour.ts'

export interface BArenaKillEvent {
  kind: 'kill'
  killerName: string
  victimName: string
  killerTeam: BArenaTeam
  victimTeam: BArenaTeam
  killText: string
}

export type BArenaEvent = BArenaKillEvent

export function eventToLabelDataArray(event: BArenaEvent): LabelData[] {
  switch (event.kind) {
    case 'kill':
      return [
        {
          text: event.victimName,
          colour: BArenaTeamColourMap.get(event.victimTeam)!,
        },
        {
          text: event.killText,
          colour: Colours.WHITE,
        },
        {
          text: event.killerName,
          colour: BArenaTeamColourMap.get(event.killerTeam)!,
        },
      ]
  }
}
