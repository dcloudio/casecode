const PAGE_PATH = "/pages/API/pull-down-refresh/pull-down-refresh"
const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isIos = platformInfo.startsWith('ios')
const isWeb = platformInfo.startsWith('web')
const isMP = platformInfo.startsWith('mp')
const isAppWebView = process.env.UNI_AUTOMATOR_APP_WEBVIEW == 'true'
const isDom2 = process.env.UNI_APP_X_DOM2 === "true"

describe("payment", () => {
  if (isAppWebView || isMP) {
    it('not support', () => {
      expect(1).toBe(1)
    })
    return
  }

  if (process.env.UNI_TEST_DEVICES_DIRECTION == 'landscape') {
    it('跳过横屏模式', () => {
      expect(1).toBe(1)
    })
    return
  }

  let page;

  async function setPageData(newData) {
    return await page.setData({ data: newData });
  }

  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
  });

  it("trigger pulldown refresh by swipe", async () => {
    await page.waitFor('view')
    await page.waitFor(4000)
    await setPageData({
      pulldownRefreshTriggered: false
    })

    if (isIos) {
      // 暂时通过点击关闭授权弹框，避免影响 swipe 测试
      await program.tap({
        x: 100,
        y: 500
      })
    }
    expect(await page.data('data.startPullDownRefreshStaus')).toBe(true)

    await program.swipe({
      startPoint: {
        x: 100,
        y: 400
      },
      endPoint: {
        x: 100,
        y: 800
      },
      duration: 1000
    })
    await page.waitFor(1500)
    expect(await page.data('data.pulldownRefreshTriggered')).toBe(true)
  });
});
