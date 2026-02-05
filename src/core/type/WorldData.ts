import { DeserialisedStructure, Label } from 'pw-js-world'

export interface WorldData {
  blocks: DeserialisedStructure
  labels: Map<string, Label>
}
