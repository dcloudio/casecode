/**
 * uni-app x 自动化测试用例 - 罗盘 API 页面 (pages/API/compass/compass.uvue)
 *
 * 测试框架 API 参考: https://uniapp.dcloud.net.cn/worktile/auto/api.html
 *
 * 测试范围：
 *   - 页面基础内容与罗盘视图渲染
 *   - 初始状态信息展示
 *   - 主监听、额外监听的注册与注销交互
 *   - startCompass / stopCompass 按钮触发后的页面状态更新
 *   - 按钮可交互性
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

async function getButtonByText(page, expectedText) {
  const buttons = await page.$$('button')
  for (const button of buttons) {
    const buttonText = await button.text()
    if (buttonText == expectedText) {
      return button
    }
  }
  throw new Error(`未找到按钮：${expectedText}`)
}

async function expectPageTextContains(page, expectedText) {
  const pageText = await getPageText(page)
  expect(pageText).toContain(expectedText)
}

describe('pages/API/compass/compass.uvue', () => {
  let page

  beforeEach(async () => {
    page = await openCompassPage()
  })

  describe('页面渲染', () => {
    it('应打开罗盘页面并展示标题与说明', async () => {
      expect(page.path).toBe('pages/API/compass/compass')

      const title = await page.$('.uni-h2')
      expect(title).not.toBeNull()
      expect(await title.text()).toBe('罗盘 API')

      const notice = await page.$('.notice')
      expect(notice).not.toBeNull()
      const noticeText = await notice.text()
      expect(noticeText).toContain('uni.startCompass')
      expect(noticeText).toContain('uni.stopCompass')
      expect(noticeText).toContain('uni.onCompassChange')
      expect(noticeText).toContain('uni.offCompassChange')
    })

    it('应展示实时信息、当前方位和监听日志区域', async () => {
      const headers = await getTexts(page, '.uni-h3')
      expect(headers).toEqual(expect.arrayContaining(['实时信息', '当前方位', '监听日志']))

      const panelItems = await getTexts(page, '.panel-item')
      expect(panelItems).toEqual(expect.arrayContaining([
        '监听状态：未启动',
        '主监听：未绑定',
        '额外监听：未绑定',
        'accuracy：null',
        '最近动作：等待调用',
        '状态：未执行',
        '说明：请先绑定监听并开始采集'
      ]))
    })

    it('应展示初始罗盘方位与罗盘图片', async () => {
      const directionValue = await page.$('.direction-value')
      expect(directionValue).not.toBeNull()
      expect(await directionValue.text()).toBe('北')

      const directionDegree = await page.$('.direction-degree')
      expect(directionDegree).not.toBeNull()
      expect(await directionDegree.text()).toBe('0.0°')

      const compassImage = await page.$('.bg-compass')
      expect(compassImage).not.toBeNull()
      const src = await compassImage.attribute('src')
      expect(src).toContain('compass.png')
    })

    it('应展示全部操作按钮且按钮文案正确', async () => {
      const buttonTexts = await getTexts(page, 'button')
      expect(buttonTexts).toEqual([
        '注册罗盘Change',
        '注销罗盘Change',
        'uni.startCompass',
        'uni.stopCompass',
        '注册罗盘Change2',
        '注销罗盘Change2'
      ])
    })
  })

  describe('监听绑定交互', () => {
    it('点击注册主监听后应更新主监听状态并写入日志', async () => {
      const button = await getButtonByText(page, '注册罗盘Change')
      await button.tap()
      await page.waitFor(300)

      await expectPageTextContains(page, '主监听：已绑定')
      await expectPageTextContains(page, '最近动作：onCompassChange(primary)')
      await expectPageTextContains(page, '状态：已绑定')
      await expectPageTextContains(page, '说明：主监听已注册')
      await expectPageTextContains(page, 'onCompassChange(primary) -> 已绑定')
    })

    it('点击注销主监听后应更新主监听状态并写入日志', async () => {
      const bindButton = await getButtonByText(page, '注册罗盘Change')
      await bindButton.tap()
      await page.waitFor(200)

      const removeButton = await getButtonByText(page, '注销罗盘Change')
      await removeButton.tap()
      await page.waitFor(300)

      await expectPageTextContains(page, '主监听：未绑定')
      await expectPageTextContains(page, '最近动作：offCompassChange(primary)')
      await expectPageTextContains(page, '状态：已解绑')
      await expectPageTextContains(page, '说明：主监听已移除')
      await expectPageTextContains(page, 'offCompassChange(primary) -> 已解绑')
    })

    it('点击注册额外监听后应更新额外监听状态并写入日志', async () => {
      const button = await getButtonByText(page, '注册罗盘Change2')
      await button.tap()
      await page.waitFor(300)

      await expectPageTextContains(page, '额外监听：已绑定')
      await expectPageTextContains(page, '最近动作：onCompassChange(extra)')
      await expectPageTextContains(page, '状态：已绑定')
      await expectPageTextContains(page, '说明：额外监听已注册')
      await expectPageTextContains(page, 'onCompassChange(extra) -> 已绑定')
    })

    it('点击注销额外监听后应更新额外监听状态并写入日志', async () => {
      const bindButton = await getButtonByText(page, '注册罗盘Change2')
      await bindButton.tap()
      await page.waitFor(200)

      const removeButton = await getButtonByText(page, '注销罗盘Change2')
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
    it('点击 startCompass 后应自动绑定主监听，并展示调用结果或保持等待回调状态', async () => {
      const button = await getButtonByText(page, 'uni.startCompass')
      await button.tap()
      await page.waitFor(1000)

      const pageText = await getPageText(page)
      expect(pageText).toContain('主监听：已绑定')

      const hasStartResult =
        pageText.includes('最近动作：startCompass') &&
        (pageText.includes('状态：成功') || pageText.includes('状态：失败'))
      const isWaitingCallback = pageText.includes('最近动作：等待调用')
      expect(hasStartResult || isWaitingCallback).toBe(true)
    })

    it('点击 stopCompass 后应展示停止调用结果', async () => {
      const startButton = await getButtonByText(page, 'uni.startCompass')
      await startButton.tap()
      await page.waitFor(500)

      const stopButton = await getButtonByText(page, 'uni.stopCompass')
      await stopButton.tap()
      await page.waitFor(800)

      const pageText = await getPageText(page)
      const hasStopResult =
        pageText.includes('最近动作：stopCompass') &&
        (pageText.includes('状态：成功') || pageText.includes('状态：失败'))
      expect(hasStopResult).toBe(true)
    })
  })

  describe('页面元素属性', () => {
    it('所有操作按钮应处于可交互状态', async () => {
      const buttons = await page.$$('button')
      expect(buttons.length).toBe(6)

      for (const button of buttons) {
        const disabled = await button.attribute('disabled')
        expect(disabled == null || disabled == 'false').toBe(true)
      }
    })

    it('监听日志区域在交互后应最多保留 10 条日志', async () => {
      const buttons = [
        await getButtonByText(page, '注册罗盘Change'),
        await getButtonByText(page, '注销罗盘Change'),
        await getButtonByText(page, '注册罗盘Change2'),
        await getButtonByText(page, '注销罗盘Change2')
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
