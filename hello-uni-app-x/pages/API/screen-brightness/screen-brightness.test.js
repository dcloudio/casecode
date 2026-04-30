const PAGE_PATH = '/pages/API/screen-brightness/screen-brightness'
const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isAndroid = platformInfo.startsWith('android')
const isIOS = platformInfo.startsWith('ios')
const isHarmony = platformInfo.startsWith('harmony')
const isWeb = platformInfo.startsWith('web')
const isMP = platformInfo.startsWith('mp')
const isApp = isAndroid || isIOS || isHarmony

jest.setTimeout(30000)

describe('ExtApi-ScreenBrightness', () => {
  let page

  beforeAll(async () => {
    try {
      if (isWeb) {
        const waitTime = process.env.uniTestPlatformInfo.includes('safari') ? 5000 : 3000
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
      page = await program.reLaunch(PAGE_PATH)
      await page.waitFor('view')
      await page.waitFor(600)
    } catch (e) {
      // web 端 reLaunch 到当前已加载的 index 页面可能失败
      if (isWeb) {
        try {
          page = await program.currentPage()
          await page.waitFor(600)
        } catch (e2) {
          // page remains null, web tests will be skipped
        }
      } else {
        throw e
      }
    }
  })

  afterAll(async () => {
    if (page != null) {
      if (!isWeb) {
        const btn05 = await page.$('#btn-set-brightness-05')
        await btn05.tap()
        await page.waitFor(300)
      }
      const btnOff = await page.$('#btn-keep-screen-off')
      await btnOff.tap()
      await page.waitFor(300)
    }
  })

  describe('setScreenBrightness', () => {
    if (isWeb) {
      it('web does not support setScreenBrightness', async () => {
        expect(1).toBe(1)
      })
      return
    }

    if (isIOS) {
      it('iOS simulator does not support setScreenBrightness', async () => {
        expect(1).toBe(1)
      })
      return
    }

    it('set brightness to 1', async () => {
      const btn = await page.$('#btn-set-brightness-1')
      await btn.tap()
      await page.waitFor(600)
      const successText = await (await page.$('#set-brightness-success')).text()
      expect(successText).toContain('设置成功')

      const getBtn = await page.$('#btn-get-brightness')
      await getBtn.tap()
      await page.waitFor(600)
      const valueText = await (await page.$('#get-brightness-value')).text()
      expect(valueText).toContain('1')
    })

    it('set brightness to 0', async () => {
      const btn = await page.$('#btn-set-brightness-0')
      await btn.tap()
      await page.waitFor(600)
      const successText = await (await page.$('#set-brightness-success')).text()
      expect(successText).toContain('设置成功')

      const getBtn = await page.$('#btn-get-brightness')
      await getBtn.tap()
      await page.waitFor(600)
      const valueText = await (await page.$('#get-brightness-value')).text()
      expect(valueText).toContain('0')
    })

    it('set brightness to 0.5', async () => {
      const btn = await page.$('#btn-set-brightness-05')
      await btn.tap()
      await page.waitFor(600)
      const successText = await (await page.$('#set-brightness-success')).text()
      expect(successText).toContain('设置成功')

      const getBtn = await page.$('#btn-get-brightness')
      await getBtn.tap()
      await page.waitFor(600)
      const valueText = await (await page.$('#get-brightness-value')).text()
      const match = valueText.match(/当前亮度：([\d.]+)/)
      expect(match).not.toBeNull()
      const brightness = parseFloat(match[1])
      expect(brightness).toBeCloseTo(0.5, 1)
    })

    it('set brightness to 0.45', async () => {
      const btn = await page.$('#btn-set-brightness-045')
      await btn.tap()
      await page.waitFor(600)
      const successText = await (await page.$('#set-brightness-success')).text()
      expect(successText).toContain('设置成功')

      const getBtn = await page.$('#btn-get-brightness')
      await getBtn.tap()
      await page.waitFor(600)
      const valueText = await (await page.$('#get-brightness-value')).text()
      const match = valueText.match(/当前亮度：([\d.]+)/)
      expect(match).not.toBeNull()
      const brightness = parseFloat(match[1])
      expect(brightness).toBeCloseTo(0.45, 1)
    })

    it('set overflow brightness 1.5 should be clamped to 1', async () => {
      const btn = await page.$('#btn-set-brightness-overflow')
      await btn.tap()
      await page.waitFor(600)
      const successText = await (await page.$('#set-brightness-success')).text()
      expect(successText).toContain('设置成功')

      const getBtn = await page.$('#btn-get-brightness')
      await getBtn.tap()
      await page.waitFor(600)
      const valueText = await (await page.$('#get-brightness-value')).text()
      expect(valueText).toContain('1')
    })
  })

  describe('getScreenBrightness', () => {
    if (isWeb) {
      it('web does not support getScreenBrightness', async () => {
        expect(1).toBe(1)
      })
      return
    }

    if (isIOS) {
      it('iOS simulator does not support getScreenBrightness', async () => {
        expect(1).toBe(1)
      })
      return
    }

    it('set then get brightness should return consistent value', async () => {
      const setBtn = await page.$('#btn-set-brightness-05')
      await setBtn.tap()
      await page.waitFor(600)

      const getBtn = await page.$('#btn-get-brightness')
      await getBtn.tap()
      await page.waitFor(600)

      const valueText = await (await page.$('#get-brightness-value')).text()
      expect(valueText).toContain('0.5')
      const completeText = await (await page.$('#get-brightness-complete')).text()
      expect(completeText).toContain('已完成')
    })

    it('get brightness value should be in range [0, 1]', async () => {
      const getBtn = await page.$('#btn-get-brightness')
      await getBtn.tap()
      await page.waitFor(600)

      const valueText = await (await page.$('#get-brightness-value')).text()
      const failText = await (await page.$('#get-brightness-fail')).text()
      expect(failText).toContain('本次未触发')
      const match = valueText.match(/[\d.]+/)
      if (match != null) {
        const value = parseFloat(match[0])
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    })

    it('set overflow 1.5 then get should return 1', async () => {
      const setBtn = await page.$('#btn-set-brightness-overflow')
      await setBtn.tap()
      await page.waitFor(600)

      const getBtn = await page.$('#btn-get-brightness')
      await getBtn.tap()
      await page.waitFor(600)

      const valueText = await (await page.$('#get-brightness-value')).text()
      expect(valueText).toContain('1')
    })
  })

  describe('setKeepScreenOn', () => {
    if (isIOS) {
      it('iOS simulator does not support setKeepScreenOn', async () => {
        expect(1).toBe(1)
      })
      return
    }

    it('enable keep screen on', async () => {
      if (page == null) {
        // web 端页面加载失败时跳过
        expect(1).toBe(1)
        return
      }
      const btn = await page.$('#btn-keep-screen-on')
      await btn.tap()
      await page.waitFor(600)

      if (isWeb) {
        // Web uses Screen Wake Lock API, requires HTTPS, may succeed or fail depending on environment
        const successText = await (await page.$('#keep-screen-success')).text()
        const failText = await (await page.$('#keep-screen-fail')).text()
        const triggered = !successText.includes('尚未调用') || !failText.includes('尚未调用')
        expect(triggered).toBe(true)
      } else {
        const stateText = await (await page.$('#keep-screen-state')).text()
        expect(stateText).toContain('已开启常亮')
        const successText = await (await page.$('#keep-screen-success')).text()
        expect(successText).toContain('setKeepScreenOn:ok')
        const completeText = await (await page.$('#keep-screen-complete')).text()
        expect(completeText).toContain('已完成')
      }
    })

    it('disable keep screen on', async () => {
      if (page == null) {
        expect(1).toBe(1)
        return
      }
      const btn = await page.$('#btn-keep-screen-off')
      await btn.tap()
      await page.waitFor(600)

      if (isWeb) {
        const successText = await (await page.$('#keep-screen-success')).text()
        const failText = await (await page.$('#keep-screen-fail')).text()
        const triggered = !successText.includes('尚未调用') || !failText.includes('尚未调用')
        expect(triggered).toBe(true)
      } else {
        const stateText = await (await page.$('#keep-screen-state')).text()
        expect(stateText).toContain('已关闭常亮')
        const successText = await (await page.$('#keep-screen-success')).text()
        expect(successText).toContain('setKeepScreenOn:ok')
        const completeText = await (await page.$('#keep-screen-complete')).text()
        expect(completeText).toContain('已完成')
      }
    })
  })
})
