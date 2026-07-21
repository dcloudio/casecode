// uni-app自动化测试教程: uni-app自动化测试教程: https://uniapp.dcloud.net.cn/worktile/auto/hbuilderx-extension/
describe('test-previewImage-multi', () => {
  const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
  const isWeb = platformInfo.startsWith('web')
  const isMP = platformInfo.startsWith('mp')
  const isAndroid = platformInfo.startsWith('android')
  const isIos = platformInfo.startsWith('ios')
  const isHarmony = platformInfo.startsWith('harmony')
  const isAppWebView = process.env.UNI_AUTOMATOR_APP_WEBVIEW == 'true'
  if (isWeb || isMP) {
    it('other platform', () => {
      expect(1).toBe(1)
    })
    return
  }
  let page;
  let screenShotOptions = {};

  async function screenshot() {
    const image = await program.screenshot(screenShotOptions);
    expect(image).toSaveImageSnapshot()
  }

  beforeAll(async () => {
    page = await program.reLaunch('/pages/API/preview-image/preview-image-multi');
    await page.waitFor(3000);

    const windowInfo = await program.callUniMethod('getWindowInfo');
    let topSafeArea = windowInfo.safeAreaInsets.top;
    if (isAppWebView) {
      if (isIos) {
        topSafeArea = 59
      } else if (isAndroid) {
        topSafeArea = 24
        if (platformInfo.startsWith('android 5')) {
          topSafeArea = 25
        } else if (platformInfo.startsWith('android 11')) {
          topSafeArea = 52
        } else if (platformInfo.startsWith('android 13') || platformInfo.startsWith('android 15')) {
          topSafeArea = 49
        }
      } else if (isHarmony) {
        // mate 60
        // topSafeArea = 33
        // mate 60 pro
        topSafeArea = 38
      }
    }
    screenShotOptions = {
      deviceShot: true,
      area: {
        x: 0,
        y: topSafeArea + 44,
        width: windowInfo.safeArea.width - 10,
        // 规避底部手势导航栏的影响
        height: windowInfo.safeArea.height - 40
      },
    }
  });

  it('test-previewImage-multi-1-url-number', async () => {
    await page.setData({
      data: {
        urls: ["/static/test-image/logo.png"],
        indicatorType: "number"
      }
    })
    await page.callMethod('testPreviewImage')
    await page.waitFor(1000)
    await screenshot()
    await page.callMethod('testClosePreviewImage')
    await page.waitFor(300)
  });
  it('test-previewImage-multi-1-url-default', async () => {
    await page.setData({
      data: {
        urls: ["/static/test-image/logo.png"],
        indicatorType: "default"
      }
    })
    await page.callMethod('testPreviewImage')
    await page.waitFor(1000)
    await screenshot()
    await page.callMethod('testClosePreviewImage')
    await page.waitFor(300)
  });
  it('test-previewImage-multi-1-url-none', async () => {
    await page.setData({
      data: {
        urls: ["/static/test-image/logo.png"],
        indicatorType: "none"
      }
    })
    await page.callMethod('testPreviewImage')
    await page.waitFor(1000)
    await screenshot()
    await page.callMethod('testClosePreviewImage')
    await page.waitFor(300)
  });
  // 3图
  it('test-previewImage-multi-3-url-number', async () => {
    await page.setData({
      data: {
        urls: ["/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png"],
        indicatorType: "number"
      }
    })
    await page.callMethod('testPreviewImage')
    await page.waitFor(1000)
    await screenshot()
    await page.callMethod('testClosePreviewImage')
    await page.waitFor(300)
  });
  it('test-previewImage-multi-3-url-default', async () => {
    await page.setData({
      data: {
        urls: ["/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png"],
        indicatorType: "default"
      }
    })
    await page.callMethod('testPreviewImage')
    await page.waitFor(1000)
    await screenshot()
    await page.callMethod('testClosePreviewImage')
    await page.waitFor(300)
  });
  it('test-previewImage-multi-3-url-none', async () => {
    await page.setData({
      data: {
        urls: ["/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png"],
        indicatorType: "none",
      }
    })
    await page.callMethod('testPreviewImage')
    await page.waitFor(1000)
    await screenshot()
    await page.callMethod('testClosePreviewImage')
    await page.waitFor(300)
  });

  // 20 图
  it('test-previewImage-multi-20-url-number', async () => {
    await page.setData({
      data: {
        urls: ["/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png",
          "/static/compass.png", "/static/test-image/logo.png", "/static/compass.png",
          "/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png",
          "/static/compass.png", "/static/test-image/logo.png", "/static/compass.png",
          "/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png",
          "/static/compass.png", "/static/test-image/logo.png", "/static/compass.png",
          "/static/test-image/logo.png", "/static/compass.png"
        ],
        indicatorType: "number"
      }
    })
    await page.callMethod('testPreviewImage')
    await page.waitFor(1000)
    await screenshot()
    await page.callMethod('testClosePreviewImage')
    await page.waitFor(300)
  });
  it('test-previewImage-multi-20-url-default', async () => {
    await page.setData({
      data: {
        urls: ["/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png",
          "/static/compass.png", "/static/test-image/logo.png", "/static/compass.png",
          "/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png",
          "/static/compass.png", "/static/test-image/logo.png", "/static/compass.png",
          "/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png",
          "/static/compass.png", "/static/test-image/logo.png", "/static/compass.png",
          "/static/test-image/logo.png", "/static/compass.png"
        ],
        indicatorType: "default"
      }
    })
    await page.callMethod('testPreviewImage')
    await page.waitFor(1000)
    await screenshot()
    await page.callMethod('testClosePreviewImage')
    await page.waitFor(300)
  });
  it('test-previewImage-multi-20-url-none', async () => {
    await page.setData({
      data: {
        urls: ["/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png",
          "/static/compass.png", "/static/test-image/logo.png", "/static/compass.png",
          "/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png",
          "/static/compass.png", "/static/test-image/logo.png", "/static/compass.png",
          "/static/test-image/logo.png", "/static/compass.png", "/static/test-image/logo.png",
          "/static/compass.png", "/static/test-image/logo.png", "/static/compass.png",
          "/static/test-image/logo.png", "/static/compass.png"
        ],
        indicatorType: "none"
      }
    })
    await page.callMethod('testPreviewImage')
    await page.waitFor(1000)
    await screenshot()
    await page.callMethod('testClosePreviewImage')
    await page.waitFor(300)
  });
});
