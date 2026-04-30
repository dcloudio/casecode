const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isWeb = platformInfo.startsWith('web')

let page

describe('calendar', () => {
  if (!isWeb) {
    it('not support', async () => {
      expect(1).toBe(1)
    })
    return
  }

  beforeAll(async () => {
    page = await program.reLaunch('/pages/API/calendar/calendar')
    await page.waitFor('view')
    await page.waitFor(1200)
  })

  it('screenshot', async () => {
    const image = await program.screenshot({ fullPage: true })
    expect(image).toSaveImageSnapshot()
  })
})
