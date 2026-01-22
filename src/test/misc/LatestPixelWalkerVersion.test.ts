import { describe, expect, test } from 'vitest'
import { PWApiClient } from 'pw-js-api'
import { LAST_TESTED_PW_VERSION } from '@/core/constant/General.ts'

describe.sequential('PW version', () => {
  test('PW version matches hardcoded version', async () => {
    const version = await PWApiClient.getVersion()
    expect(version).toEqual(LAST_TESTED_PW_VERSION)
  })
})
