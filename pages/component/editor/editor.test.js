jest.setTimeout(30000);
const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isMP = platformInfo.startsWith('mp')
const isWeb = platformInfo.startsWith('web')
const isHarmony = platformInfo.startsWith('harmony')
const isAndroid = platformInfo.startsWith('android')
const isiOS = platformInfo.startsWith('ios')
const isDom2 = process.env.UNI_APP_X_DOM2 === "true"

describe('editor.uvue', () => {
  if (!isHarmony && !isAndroid && (isDom2 || (!isWeb && !isMP))) {
    it('app', () => {
      expect(1).toBe(1)
    })
    return
  }
  let page, editor, options = [];
  beforeAll(async () => {
    page = await program.reLaunch("/pages/component/editor/editor");
    await page.waitFor('view');
    const time = isWeb ? 3000 : 6000
    await page.waitFor(time);
    editor = await page.$('#editor');
    await page.setData({
      data: {
        autoTest: true
      }
    })
  });

  async function setBlur() {
    const start = Date.now();
    await page.callMethod('blur')
    await page.waitFor(async () => {
      return await page.data('data.blurTest') === true || (Date.now() - start > 2000)
    })
  }

  it('editor-wrapper', async () => {
    if (isWeb || isMP) {
      expect(await editor.attribute("placeholder")).toBe("开始输入...")
      if (isMP) {
        expect(await page.data("data.readOnly")).toBe(false)
      } else {
        expect(await editor.attribute("read-only")).toBe("false")
      }
    }
    expect(await program.screenshot()).toSaveImageSnapshot();
  });

  it('editor-toolbar', async () => {
    const iconfontsEl = await page.$$('.iconfont');
    for (var i = 0; i < iconfontsEl.length - 7; i++) {
      await iconfontsEl[i].tap()
      // await page.waitFor(500)
      const getFormats = await page.data('data.formats')
      options.push({
        insert: '文本内容font',
        attributes: getFormats
      })
      await page.callMethod('setContents', options)
      await page.setData({
        data: {
          formats: null
        }
      })
      await iconfontsEl[i].tap()
    }
  });

  it('editor-screenshot', async () => {
    await setBlur()
    await page.waitFor(500);
    expect(await program.screenshot()).toSaveImageSnapshot();
  })

  it('clear', async () => {
    await page.callMethod('clear')
    const start = Date.now();
    await page.waitFor(async () => {
      return await page.data('data.clearTest') === true || (Date.now() - start > 2000)
    })
    if (isWeb || isMP) {
      expect(await editor.attribute("placeholder")).toBe("开始输入...")
    }
  })

  it('undo-redo', async () => {
    await page.callMethod('insertDivider')
    await page.waitFor(500)
    await page.callMethod('undo')
    await page.waitFor(1000)
    expect(await page.data('data.undoTest')).toBe(true)
    await page.callMethod('redo')
    await page.waitFor(1000)
    expect(await page.data('data.redoTest')).toBe(true)
  })

  it('insertImage', async () => {
    await page.waitFor(500)
    await page.callMethod('insertImage', 'https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/uni-app.png')
    const start1 = Date.now();
    await page.waitFor(async () => {
      return await page.data('data.insertImageTest') === true || (Date.now() - start1 > 2000)
    })
  })

  it('insertImage-screenshot', async () => {
    await setBlur()
    const waitTime = process.env.uniTestPlatformInfo.includes('firefox') ? 5000 : 2000
    await page.waitFor(waitTime)
    expect(await program.screenshot()).toSaveImageSnapshot();
  })

  if (!isMP) {
    it('mention', async () => {
      await page.setData({
        data: {
          clearTest: false
        }
      })
      await page.callMethod('clear')
      const start = Date.now();
      await page.waitFor(async () => {
        return await page.data('data.clearTest') === true || (Date.now() - start > 2000)
      })

      await page.callMethod('insertMention')
      await page.waitFor(1000)
      await page.callMethod('getCon')
      await page.waitFor(1000)
      const start1 = Date.now();
      await page.waitFor(async () => {
        return await page.data('data.getContentDeltaTest') || (Date.now() - start1 > 2000)
      })

      const delta = await page.data('data.getContentDeltaTest')
      const ops = delta.ops
      expect(ops.length).toBeGreaterThanOrEqual(2)
      expect(ops[0].insert.mention).toMatchObject({
        "id": "123456",
        "name": "uni-app"
      })
      expect(ops[1].insert.mention).toMatchObject({
        "id": "000",
        "name": "uni-app x"
      })
    })
  }

  it('removeFormat', async () => {
    const bgcolorEl = await page.$('.icon-fontbgcolor');
    await bgcolorEl.tap()
    await page.waitFor(500)
    const getFormats = await page.data('data.formats')
    await page.callMethod('setContents', [{
      insert: '设置字体样式bgcolor',
      attributes: getFormats
    }])
    await page.waitFor(500)
    await page.callMethod('removeFormat')
    await page.waitFor(1000)
    expect(await page.data('data.removeFormatTest')).toBe(true)
    if (!isAndroid) {
      expect(await page.data('data.formats')).toEqual({})
    } else {
      expect(await page.data('data.formats')).toEqual({
        bold: null,
        italic: null,
        underline: null,
        strike: null,
        align: null,
        lineHeight: null,
        letterSpacing: null,
        marginTop: null,
        marginBottom: null,
        fontFamily: null,
        fontSize: null,
        color: null,
        backgroundColor: null,
        list: null,
        header: null,
        script: null,
        direction: null,
      })
    }
  })

});
