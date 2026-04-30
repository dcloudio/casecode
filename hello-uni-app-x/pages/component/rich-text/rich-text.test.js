const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isMP = platformInfo.startsWith('mp')

const PAGE_PATH = '/pages/component/rich-text/rich-text'

describe('rich-text-test', () => {
  if (isMP) {
    it('skip', () => {
      expect(1).toBe(1)
    })
    return
  }

  let page
  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor(1500);
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
      fontSizeIndex: 0,
      currentFontSize: '默认',
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
      lineHeightIndex: 0,
      currentLineHeight: '默认',
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
      fontFamilyIndex: 0,
      currentFontFamily: '默认',
      richTextStyle: 'border: 1px; border-style: solid; border-color: red;'
    })
    await page.waitFor(300)
  })

  if (!isMP) {
    it('test dialogPage', async () => {
      await page.callMethod('testOpenDialogPage');
      await page.waitFor(1000);
      const image = await program.screenshot({ deviceShot: true });
      expect(image).toSaveImageSnapshot();
      await page.callMethod('testCloseDialogPage');
    })
  }
})
