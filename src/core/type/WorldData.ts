import { DeserialisedStructure, Label, Zone } from 'pw-js-world'

export interface WorldData {
  blocks: DeserialisedStructure
  labels: Map<string, Label>
  zones: Map<string, Zone>
}
