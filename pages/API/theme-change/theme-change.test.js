const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isAndroid = platformInfo.startsWith('android')
const isIos = platformInfo.startsWith('ios')
const isAppWebView = process.env.UNI_AUTOMATOR_APP_WEBVIEW == 'true'

describe('API-theme-change', () => {
  let page;
  let originalTheme;
  let deviceShotOptions = {};
  if (!(isAndroid || isIos) || isAppWebView) {
    it('dummyTest', () => {
      expect(1).toBe(1)
    })
    return
  }

  beforeAll(async () => {
    page = await program.reLaunch('/pages/API/theme-change/theme-change')
    await page.waitFor('view');
    originalTheme = await page.data('data.originalTheme')

    const windowInfo = await program.callUniMethod('getWindowInfo');
    deviceShotOptions = {
      deviceShot: true,
      area: {
        x: 0,
        y: windowInfo.safeAreaInsets.top + 44,
        width: windowInfo.safeArea.width - 8,
        // 规避底部手势导航栏的影响
        height: windowInfo.safeArea.height - 40
      },
    };
  });

  it("check-set-app-theme", async () => {
    await page.callMethod('setAppTheme', "dark")
    await page.waitFor(300)
    expect(await page.data('data.appTheme')).toBe("dark")
    const image = await program.screenshot(deviceShotOptions);
    expect(image).toSaveImageSnapshot();
  })

  afterAll(async () => {
    await page.callMethod('setAppTheme', originalTheme)
    await page.waitFor(600)
  })
});
