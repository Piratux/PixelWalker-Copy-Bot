<script lang="ts" setup>
import PiCardContainer from '@/component/PiCardContainer.vue'
import { getPwBlocks, getPwBlocksByPwName, getPwGameWorldHelper } from '@/core/store/PwClientStore.ts'
import { computed, ref } from 'vue'
import PiButton from '@/component/PiButton.vue'
import { Block, BlockArg, Point } from 'pw-js-world'
import { vec2 } from '@basementuniverse/vec'
import { teleportPlayer } from '@/core/service/PwClientService.ts'
import { mapGetOrInsert } from '@/core/util/MapGetOrInsert.ts'
import { sortBy } from 'lodash-es'
import { TOTAL_PW_LAYERS } from '@/core/constant/General.ts'
import { VAutocomplete } from 'vuetify/components'

interface BlockItem {
  header: string
  block: Block
  positions: Point[]
}

interface BlockArgumentFilterItem {
  argName: string | null
  valueString: string | null
  valueNumber: number | null
  valueBoolean: boolean
}

interface BlockArgumentNameListItem {
  value?: string
  type?: string
  title?: string
  meta?: {
    argType: string
  }
}

const headers = [{ value: 'header' }]

const blockNameList = getPwBlocks()
  .filter((block) => block.Id !== 0)
  .map((block) => block.PaletteId)
const blockListSearchValue = ref<string>('')
const selectedBlocks = ref<string[]>([])

const blockMapUpdatedOnce = ref(false)
const blockMap = new Map<string, Map<string, BlockItem>>()

const blockArgumentFilterList = ref<BlockArgumentFilterItem[]>([getDefaultBlockArgumentFilterItem()])

const totalBlockCount = computed<number>(() => {
  let total = 0
  for (const item of blockItems.value) {
    total += item.positions.length
  }
  return total
})

const expandedBlockItems = computed<string[]>(() => blockItems.value.map((item) => item.header))

const blockItems = computed<BlockItem[]>(() => {
  const blockItemList: BlockItem[] = []
  for (const selectedBlock of selectedBlocks.value) {
    const blockNameMap = blockMap.get(selectedBlock)
    if (!blockNameMap) {
      continue
    }

    const blockNameValues = blockNameMap.values()

    const blockNameItemList = Array.from(blockNameValues)
      .filter((blockItem) =>
        blockArgumentFilterList.value.every((blockArgumentFilter) => {
          if (blockArgumentFilter.argName == null) {
            return true
          }
          const argValue = blockItem.block.args[blockArgumentFilter.argName]
          if (argValue === undefined) {
            return true
          }
          const argType = blockArgumentNameMap.value.get(blockArgumentFilter.argName)!
          switch (argType) {
            case 'String':
              return (
                [null, ''].includes(blockArgumentFilter.valueString) ||
                (argValue as string).includes(blockArgumentFilter.valueString!)
              )
            case 'Int32':
            case 'Uint32':
              return blockArgumentFilter.valueNumber === null || argValue === blockArgumentFilter.valueNumber
            case 'Boolean':
              return argValue === blockArgumentFilter.valueBoolean
            default:
              return false
          }
        }),
      )
      .map((blockItem) => ({
        header: computeBlockItemHeader(blockItem),
        block: blockItem.block,
        positions: blockItem.positions,
      }))

    const sortedBlockNameItemList = sortBy(blockNameItemList).sort((a, b) => {
      const namesMatch = a.block.name.localeCompare(b.block.name)
      if (namesMatch !== 0) {
        return namesMatch
      }
      const argKeysSorted = Object.keys(a.block.args).sort()
      for (const key of argKeysSorted) {
        const compareResult = compareBlockArg(a.block.args[key], b.block.args[key])
        if (compareResult !== 0) {
          return compareResult
        }
      }
      return 0 // Should never be reached
    })

    blockItemList.push(...sortedBlockNameItemList)
  }
  return blockItemList
})

const blockArgumentNameMap = computed<Map<string, string>>(() => {
  const map = new Map<string, string>()
  for (const blockName of blockNameList) {
    for (const blockArgument of getPwBlocksByPwName().get(blockName)!.Fields) {
      // It's hard to support other argument types
      if (!['Int32', 'Uint32', 'Boolean', 'String'].includes(blockArgument.Type)) {
        continue
      }
      map.set(blockArgument.Name, blockArgument.Type)
    }
  }
  return map
})

const blockArgumentNameList = computed<BlockArgumentNameListItem[]>(() => {
  const usedArgumentNames = []
  const unusedArgumentNames = []
  const sortedBlockArguments = Array.from(blockArgumentNameMap.value.keys()).sort()
  for (const sortedBlockArgument of sortedBlockArguments) {
    const entry = {
      title: sortedBlockArgument,
      value: sortedBlockArgument,
      meta: { argType: blockArgumentNameMap.value.get(sortedBlockArgument)! },
    }
    if (
      selectedBlocks.value.some((selectedBlock) =>
        getPwBlocksByPwName()
          .get(selectedBlock)!
          .Fields.some((blockField) => blockField.Name === sortedBlockArgument),
      )
    ) {
      usedArgumentNames.push(entry)
    } else {
      unusedArgumentNames.push(entry)
    }
  }

  return [
    { type: 'subheader', title: 'Argument names in selected blocks' },
    ...usedArgumentNames,
    { type: 'divider' },
    { type: 'subheader', title: 'Remaining argument names' },
    ...unusedArgumentNames,
  ]
})

function getDefaultBlockArgumentFilterItem() {
  return { argName: null, valueString: '', valueNumber: 0, valueBoolean: false }
}

function computeBlockItemHeader(blockItem: BlockItem) {
  if (Object.keys(blockItem.block.args).length > 0) {
    return `${blockItem.block.name}: ${JSON.stringify(blockItem.block.args)}`
  }
  return `${blockItem.block.name}`
}

function updateBlockMap() {
  blockMap.clear()
  const blocks = getPwGameWorldHelper().blocks
  const width = getPwGameWorldHelper().width
  const height = getPwGameWorldHelper().height

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let layer = 0; layer < TOTAL_PW_LAYERS; layer++) {
        const block = blocks[layer][x][y]
        const blockArgs = `${JSON.stringify(block.args)}`
        const blocksByName = mapGetOrInsert(blockMap, block.name, new Map<string, BlockItem>())
        mapGetOrInsert(blocksByName, blockArgs, {
          header: '',
          block: block,
          positions: [],
        }).positions.push(vec2(x, y))
      }
    }
  }
}

function compareBlockArg(a: BlockArg, b: BlockArg): number {
  if (typeof a !== typeof b) {
    throw new Error('Cannot compare BlockArgs of different types')
  }
  if (a === b) return 0
  if (a === undefined) return -1
  if (b === undefined) return 1
  if (a.constructor === Uint8Array && b.constructor === Uint8Array) {
    if (a.length !== b.length) return a.length - b.length
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return a[i] - b[i]
    }
    return 0
  }
  return a < b ? -1 : 1
}

function onBlockNameSelected() {
  if (blockMapUpdatedOnce.value === false) {
    blockMapUpdatedOnce.value = true
    updateBlockMap()
  }

  blockListSearchValue.value = ''
}

function onArgumentFilterNameSelected() {
  if (blockArgumentFilterList.value.every((blockArgumentFilter) => blockArgumentFilter.argName != null)) {
    blockArgumentFilterList.value.push(getDefaultBlockArgumentFilterItem())
  }
}
function onRemoveBlockArgumentFilterClicked(index: number) {
  blockArgumentFilterList.value.splice(index, 1)
}
</script>

<template>
  <PiCardContainer>
    <h2>Block finder</h2>
    <v-autocomplete
      v-model:search="blockListSearchValue"
      v-model="selectedBlocks"
      label="Block names"
      :items="blockNameList"
      clearable
      multiple
      chips
      closable-chips
      @update:model-value="onBlockNameSelected"
    ></v-autocomplete>
    <div v-for="(blockArgumentFilter, index) in blockArgumentFilterList" :key="index">
      <v-row>
        <v-col>
          <v-autocomplete
            v-model="blockArgumentFilter.argName"
            :items="blockArgumentNameList"
            label="Argument name"
            clearable
            @update:model-value="onArgumentFilterNameSelected"
          ></v-autocomplete>
        </v-col>
        <v-col>
          <v-text-field
            v-if="['String'].includes(blockArgumentNameMap.get(blockArgumentFilter.argName ?? '')!)"
            v-model="blockArgumentFilter.valueString"
            label="Argument value"
          ></v-text-field>
          <v-number-input
            v-if="['Int32', 'Uint32'].includes(blockArgumentNameMap.get(blockArgumentFilter.argName ?? '')!)"
            v-model="blockArgumentFilter.valueNumber"
            label="Argument value"
          ></v-number-input>
          <v-checkbox
            v-if="['Boolean'].includes(blockArgumentNameMap.get(blockArgumentFilter.argName ?? '')!)"
            v-model="blockArgumentFilter.valueBoolean"
            label="ON/OFF"
          ></v-checkbox>
        </v-col>
        <v-col cols="2">
          <v-btn v-if="blockArgumentFilterList.length > 1" icon @click="onRemoveBlockArgumentFilterClicked(index)">
            <v-icon color="red" icon="mdi-close"></v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <p>Total Blocks: {{ totalBlockCount }}</p>
    <v-data-table
      v-model:expanded="expandedBlockItems"
      :items="blockItems"
      :headers="headers"
      item-value="header"
      show-expand
      hide-default-header
      density="compact"
    >
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-row>
              <v-col v-for="pos in item.positions" :key="`${pos.x}:${pos.y}`" cols="4" sm="2">
                <PiButton color="green" min-width="6em" @click="teleportPlayer(pos)">
                  {{ pos.x }}:{{ pos.y }}
                </PiButton>
              </v-col>
            </v-row>
          </td>
        </tr>
      </template>
    </v-data-table>
  </PiCardContainer>
</template>

<style scoped>
/*Waiting for fix: https://github.com/vuetifyjs/vuetify/issues/17633*/
ul {
  padding-left: 2rem;
}
/*For some reason scrollbars randomly appear and disappear on v-data-table when expanding items.*/
:deep(.v-table__wrapper) {
  overflow: hidden;
}
</style>
