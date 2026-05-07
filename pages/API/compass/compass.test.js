/**
 * uni-app x 自动化测试用例 - 罗盘 API 页面 (pages/API/compass/compass.uvue)
 *
 * 测试框架 API 参考: https://uniapp.dcloud.net.cn/worktile/auto/api.html
 *
 * 测试范围：
 *   - 主监听、额外监听的注册与注销交互
 *   - startCompass / stopCompass 调用结果
 *   - 监听日志条数上限
 *
 * 说明：罗盘能力依赖设备、权限、HTTPS 等运行环境。用例只断言页面状态与成功/失败
 * 回调的通用展示，不要求真实传感器一定返回方向数据。
 */

jest.setTimeout(20000)

const PAGE_PATH = '/pages/API/compass/compass'

async function openCompassPage() {
  const page = await program.reLaunch(PAGE_PATH)
  await page.waitFor('.uni-h2')
  await page.waitFor(500)
  return page
}

async function getTexts(page, selector) {
  const elements = await page.$$(selector)
  const texts = []
  for (const element of elements) {
    texts.push(await element.text())
  }
  return texts
}

async function getPageText(page) {
  const texts = await getTexts(page, 'text')
  return texts.join('\n')
}

async function getButton(page, selector) {
  const button = await page.$(selector)
  expect(button).not.toBeNull()
  return button
}

async function expectPageTextContains(page, expectedText) {
  const pageText = await getPageText(page)
  expect(pageText).toContain(expectedText)
}

async function waitForPageText(page, matcher, timeout = 5000) {
  const startTime = Date.now()
  let pageText = await getPageText(page)
  while (Date.now() - startTime < timeout) {
    if (matcher(pageText)) {
      return pageText
    }
    await page.waitFor(200)
    pageText = await getPageText(page)
  }
  throw new Error(`等待页面文本更新超时，当前文本：${pageText}`)
}

describe('pages/API/compass/compass.uvue', () => {
  let page

  beforeEach(async () => {
    page = await openCompassPage()
  })

  describe('监听绑定交互', () => {
    it('点击注册主监听后应更新主监听状态并写入日志', async () => {
      const button = await getButton(page, '#btn-bind-primary-listener')
      await button.tap()
      await page.waitFor(300)

      await expectPageTextContains(page, '主监听：已绑定')
      await expectPageTextContains(page, '最近动作：onCompassChange(primary)')
      await expectPageTextContains(page, '状态：已绑定')
      await expectPageTextContains(page, '说明：主监听已注册')
      await expectPageTextContains(page, 'onCompassChange(primary) -> 已绑定')
    })

    it('点击注销主监听后应更新主监听状态并写入日志', async () => {
      const bindButton = await getButton(page, '#btn-bind-primary-listener')
      await bindButton.tap()
      await page.waitFor(200)

      const removeButton = await getButton(page, '#btn-remove-primary-listener')
      await removeButton.tap()
      await page.waitFor(300)

      await expectPageTextContains(page, '主监听：未绑定')
      await expectPageTextContains(page, '最近动作：offCompassChange(primary)')
      await expectPageTextContains(page, '状态：已解绑')
      await expectPageTextContains(page, '说明：主监听已移除')
      await expectPageTextContains(page, 'offCompassChange(primary) -> 已解绑')
    })

    it('点击注册额外监听后应更新额外监听状态并写入日志', async () => {
      const button = await getButton(page, '#btn-bind-secondary-listener')
      await button.tap()
      await page.waitFor(300)

      await expectPageTextContains(page, '额外监听：已绑定')
      await expectPageTextContains(page, '最近动作：onCompassChange(extra)')
      await expectPageTextContains(page, '状态：已绑定')
      await expectPageTextContains(page, '说明：额外监听已注册')
      await expectPageTextContains(page, 'onCompassChange(extra) -> 已绑定')
    })

    it('点击注销额外监听后应更新额外监听状态并写入日志', async () => {
      const bindButton = await getButton(page, '#btn-bind-secondary-listener')
      await bindButton.tap()
      await page.waitFor(200)

      const removeButton = await getButton(page, '#btn-remove-secondary-listener')
      await removeButton.tap()
      await page.waitFor(300)

      await expectPageTextContains(page, '额外监听：未绑定')
      await expectPageTextContains(page, '最近动作：offCompassChange(extra)')
      await expectPageTextContains(page, '状态：已解绑')
      await expectPageTextContains(page, '说明：额外监听已移除')
      await expectPageTextContains(page, 'offCompassChange(extra) -> 已解绑')
    })
  })

  describe('罗盘启动与停止交互', () => {
    it('点击 startCompass 后应自动绑定主监听，并记录本次 API 调用结果', async () => {
      const button = await getButton(page, '#btn-start-compass')
      await button.tap()
      const pageText = await waitForPageText(page, (text) => {
        return text.includes('主监听：已绑定') &&
          text.includes('最近动作：startCompass') &&
          (text.includes('状态：成功') || text.includes('状态：失败 ('))
      })
      expect(pageText).toContain('主监听：已绑定')
      expect(pageText).toContain('最近动作：startCompass')
    })

    it('点击 stopCompass 后应展示停止调用结果', async () => {
      const startButton = await getButton(page, '#btn-start-compass')
      await startButton.tap()
      await page.waitFor(500)

      const stopButton = await getButton(page, '#btn-stop-compass')
      await stopButton.tap()
      const pageText = await waitForPageText(page, (text) => {
        return text.includes('最近动作：stopCompass') &&
          (text.includes('状态：成功') || text.includes('状态：失败 ('))
      })
      expect(pageText).toContain('最近动作：stopCompass')
    })
  })

  describe('日志行为', () => {
    it('监听日志区域在交互后应最多保留 10 条日志', async () => {
      const buttons = [
        await getButton(page, '#btn-bind-primary-listener'),
        await getButton(page, '#btn-remove-primary-listener'),
        await getButton(page, '#btn-bind-secondary-listener'),
        await getButton(page, '#btn-remove-secondary-listener')
      ]

      for (let i = 0; i < 12; i += 1) {
        await buttons[i % buttons.length].tap()
        await page.waitFor(80)
      }

      const panelItems = await page.$$('.panel-item')
      const logItemCount = panelItems.length - 7
      expect(logItemCount).toBeLessThanOrEqual(10)
      expect(logItemCount).toBeGreaterThan(0)
    })
  })
})
