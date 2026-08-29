const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isAndroid = platformInfo.startsWith('android')
const isDom2 = process.env.UNI_APP_X_DOM2 === 'true'
const shouldRun = isAndroid && isDom2
let page

if (shouldRun) {
  beforeAll(async () => {
    page = await program.reLaunch('/pages/SyntaxCase/paramTest')
    await page.waitFor(1000)
  })
}

describe('BridgeResultSerializer shared reference', () => {
  if (!shouldRun) {
    it('skip', () => {
      expect(true).toBe(true)
    })
    return
  }

  it('preserves a shared array in a synchronous gen_bridge result', async () => {
    const passed = await page.callMethod('jest_testSharedArraySync')
    expect(passed).toBe(true)
  })

  it('preserves a shared array in a gen_bridge callback result', async () => {
    const passed = await page.callMethod('jest_testSharedArrayCallback')
    expect(passed).toBe(true)
  })
})
