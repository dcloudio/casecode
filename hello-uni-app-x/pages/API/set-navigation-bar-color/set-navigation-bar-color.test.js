const isAppWebView = process.env.UNI_AUTOMATOR_APP_WEBVIEW == 'true'
const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isMP = platformInfo.startsWith('mp')

describe('setNavigationBarColor', () => {
  if (isAppWebView || isMP) {
    it('skip', () => {
      expect(1).toBe(1)
    })
    return
  }

  const CURRENT_PAGE_PATH = '/pages/API/set-navigation-bar-color/set-navigation-bar-color'
  let page
  let originLifeCycleNum
  beforeAll(async () => {
    page = await program.navigateTo(CURRENT_PAGE_PATH)
    await page.waitFor('view')
    originLifeCycleNum = await page.callMethod('getLifeCycleNum')
  })

  afterAll(async () => {
    await page.callMethod('setLifeCycleNum', originLifeCycleNum)
    const lifeCycleNum = await page.callMethod('getLifeCycleNum')
    expect(lifeCycleNum).toBe(originLifeCycleNum)
  })

  it("setNavigationBarColor1", async () => {
    await page.callMethod("setNavigationBarColor1");
    await page.waitFor(1000);
    const image = await program.screenshot();
    expect(image).toSaveImageSnapshot();
    const lifeCycleNum = await page.callMethod("getLifeCycleNum");
    expect(lifeCycleNum - originLifeCycleNum).toBe(2);
  });
  it("setNavigationBarColor2", async () => {
    await page.callMethod("setNavigationBarColor2");
    await page.waitFor(1000);
    const image = await program.screenshot();
    expect(image).toSaveImageSnapshot();
    const lifeCycleNum = await page.callMethod("getLifeCycleNum");
    expect(lifeCycleNum - originLifeCycleNum).toBe(4);
  });
})
