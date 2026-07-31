const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isMP = platformInfo.startsWith('mp')
const isWeb = platformInfo.startsWith('web')
const isIos = platformInfo.startsWith('ios')
const isHarmony = platformInfo.startsWith('harmony')
const isAndroid = platformInfo.startsWith('android')
const isAppWebView = process.env.UNI_AUTOMATOR_APP_WEBVIEW == 'true'

const PAGE_PATH = '/pages/component/rich-text/rich-text'

describe('rich-text-test', () => {
  if (isMP) {
    it('skip', () => {
      expect(1).toBe(1)
    })
    return
  }

  let page
  let deviceShotOptions = { fullPage: true }
  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor(1500);

    if (!isWeb) {
      const windowInfo = await program.callUniMethod('getWindowInfo');
      let topSafeArea = windowInfo.safeAreaInsets.top;
      if (isAppWebView) {
        if (isIos) {
          topSafeArea = 59
          if (platformInfo.includes('26')) {
            topSafeArea = 62
          }
        } else if (isAndroid) {
          topSafeArea = 24
          windowInfo.safeArea.bottom = 867
          if (platformInfo.startsWith('android 5')) {
            topSafeArea = 25
          }if (platformInfo.startsWith('android 6')) {
            windowInfo.safeArea.bottom = 592
          }if (platformInfo.startsWith('android 8')) {
            windowInfo.safeArea.bottom = 534
          } else if (platformInfo.startsWith('android 11')) {
            topSafeArea = 52
          } else if (platformInfo.startsWith('android 12')) {
            topSafeArea = 24
            windowInfo.safeArea.bottom = 716
          } else if (platformInfo.startsWith('android 13') || platformInfo.startsWith('android 15')) {
            topSafeArea = 49
            windowInfo.safeArea.bottom = 891
          } else if (platformInfo.startsWith('android 14')) {
            windowInfo.safeArea.bottom = 891
          }
        } else if (isHarmony) {
          topSafeArea = 39
          if (platformInfo.includes('nova_12')) {
            topSafeArea = 35
          }
        }
      }
      const top = topSafeArea + 44
      const bottom = Math.min(top + windowInfo.windowHeight, windowInfo.safeArea.bottom)
      const left = windowInfo.safeArea.left
      const right = windowInfo.safeArea.right - 10
      deviceShotOptions = {
        deviceShot: true,
        area: {
          x: left,
          y: top,
          width: right - left,
          height: bottom - top
        },
      }
    }
  })

  async function setPageData(newData) {
    return await page.setData({ data: newData });
  }

  it('richt-text-height', async () => {
    let beforeValue = await page.data('data.richTextHeight')
    if (beforeValue < 10) {
      await page.waitFor(2000)
      beforeValue = await page.data('data.richTextHeight')

      if (beforeValue < 10) {
        await page.waitFor(2000)
        beforeValue = await page.data('data.richTextHeight')
      }
    }
    await page.callMethod('changeText')
    await page.waitFor(2000)
    await page.callMethod('changeText')
    await page.waitFor(2000)
    let afterValue = await page.data('data.richTextHeight')
    console.log('beforeValue:', beforeValue)
    console.log('afterValue:', afterValue)
    expect(Math.abs(beforeValue - afterValue) < 0.1).toBe(true)
  })

  it('rich-text parent click', async () => {
    const element = await page.$('#rich-text-parent')
    await element.tap()
    await page.waitFor(500)
    const element2 = await page.$('#rich-text-str')
    expect(await element2.text()).toBe("true")
  })

  it('test style font-size-12px', async () => {
    await page.callMethod('changeFontSize')
    await page.waitFor(500)
    const image = await program.screenshot({ fullPage: true })
    expect(image).toSaveImageSnapshot()
  })

  it('test style font-size-16px', async () => {
    await page.callMethod('changeFontSize')
    await page.waitFor(500)
    const image = await program.screenshot({ fullPage: true })
    expect(image).toSaveImageSnapshot()
    // 重置为默认
    await setPageData({
      currentFontSize: "默认",
      currentColor: "默认",
      currentLineHeight: "默认",
      currentFontFamily: "默认",
      fontSizeIndex: 0,
      colorIndex: 0,
      lineHeightIndex: 0,
      fontFamilyIndex: 0,
      richTextStyle: 'border: 1px; border-style: solid; border-color: red;'
    })
    await page.waitFor(300)
  })

  it('test style color-red', async () => {
    await page.callMethod('changeColor')
    await page.waitFor(500)
    const image = await program.screenshot({ fullPage: true })
    expect(image).toSaveImageSnapshot()
  })

  it('test style color-blue', async () => {
    await page.callMethod('changeColor')
    await page.waitFor(500)
    const image = await program.screenshot({ fullPage: true })
    expect(image).toSaveImageSnapshot()
    // 重置为默认
    await setPageData({
      currentFontSize: "默认",
      currentColor: "默认",
      currentLineHeight: "默认",
      currentFontFamily: "默认",
      fontSizeIndex: 0,
      colorIndex: 0,
      lineHeightIndex: 0,
      fontFamilyIndex: 0,
      richTextStyle: 'border: 1px; border-style: solid; border-color: red;'
    })
    await page.waitFor(300)
  })

  it('test style line-height-1', async () => {
    await page.callMethod('changeLineHeight')
    await page.waitFor(500)
    const image = await program.screenshot({ fullPage: true })
    expect(image).toSaveImageSnapshot()
  })

  it('test style line-height-1.5', async () => {
    await page.callMethod('changeLineHeight')
    await page.waitFor(500)
    const image = await program.screenshot({ fullPage: true })
    expect(image).toSaveImageSnapshot()
    // 重置为默认
    await setPageData({
      currentFontSize: "默认",
      currentColor: "默认",
      currentLineHeight: "默认",
      currentFontFamily: "默认",
      fontSizeIndex: 0,
      colorIndex: 0,
      lineHeightIndex: 0,
      fontFamilyIndex: 0,
      richTextStyle: 'border: 1px; border-style: solid; border-color: red;'
    })
    await page.waitFor(300)
  })

  it('test style font-family-serif', async () => {
    await page.callMethod('changeFontFamily')
    await page.waitFor(500)
    const image = await program.screenshot({ fullPage: true })
    expect(image).toSaveImageSnapshot()
  })

  it('test style font-family-sans-serif', async () => {
    await page.callMethod('changeFontFamily')
    await page.waitFor(500)
    const image = await program.screenshot({ fullPage: true })
    expect(image).toSaveImageSnapshot()
    // 重置为默认
    await setPageData({
      currentFontSize: "默认",
      currentColor: "默认",
      currentLineHeight: "默认",
      currentFontFamily: "默认",
      fontSizeIndex: 0,
      colorIndex: 0,
      lineHeightIndex: 0,
      fontFamilyIndex: 0,
      richTextStyle: 'border: 1px; border-style: solid; border-color: red;'
    })
    await page.waitFor(300)
  })

  it('test dialogPage', async () => {
    await page.callMethod('testOpenDialogPage');
    await page.waitFor(1000);
    const image = await program.screenshot(deviceShotOptions);
    expect(image).toSaveImageSnapshot();
    await page.callMethod('testCloseDialogPage');
  })
})
