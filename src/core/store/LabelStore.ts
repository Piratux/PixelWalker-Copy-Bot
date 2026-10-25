interface LabelStore {
  totalLabelsLeftToReceive: number
}

const store = createLabelStore()

function createLabelStore(): LabelStore {
  return {
    totalLabelsLeftToReceive: 0,
  }
}

export function resetLabelStore() {
  Object.assign(store, createLabelStore())
}

export function useLabelStore(): LabelStore {
  return store
}
