// uni-app自动化测试教程: https://uniapp.dcloud.net.cn/worktile/auto/hbuilderx-extension/

jest.setTimeout(30000)

const GYROSCOPE_PAGE_PATH = '/pages/API/gyroscope/gyroscope'

async function openPage(pagePath) {
    const page = await program.reLaunch(pagePath)
    await page.waitFor('.uni-h2')
    await page.waitFor(500)
    return page
}

async function openGyroscopePage() {
    return await openPage(GYROSCOPE_PAGE_PATH)
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

function isStartResultText(text) {
    return text.includes('最近动作：startGyroscope') &&
        (text.includes('状态：成功') || text.includes('状态：失败 ('))
}

function isStopResultText(text) {
    return text.includes('最近动作：stopGyroscope') &&
        (text.includes('状态：成功') || text.includes('状态：失败 ('))
}

describe('gyroscope', () => {
    let page

    beforeEach(async () => {
        page = await openGyroscopePage()
    })

    it('陀螺仪 API 页面启动后路径应为 pages/API/gyroscope/gyroscope', async () => {
        expect(page.path).toBe('pages/API/gyroscope/gyroscope')
    })

    it('陀螺仪 API 页面顶部应显示标题「陀螺仪 API」', async () => {
        const title = await page.$('.uni-h2')
        expect(title).not.toBeNull()
        expect(await title.text()).toBe('陀螺仪 API')
    })

    it('陀螺仪 API 页面说明应列出 start、stop、on、off 四个接口', async () => {
        const pageText = await getPageText(page)
        expect(pageText).toContain('uni.startGyroscope')
        expect(pageText).toContain('uni.stopGyroscope')
        expect(pageText).toContain('uni.onGyroscopeChange')
        expect(pageText).toContain('uni.offGyroscopeChange')
    })

    it('陀螺仪 API 页面应按顺序显示四个功能区域标题', async () => {
        const headers = await getTexts(page, '.uni-h3')
        expect(headers).toEqual([
            '实时状态',
            '调用结果',
            '开始 / 停止',
            '监听日志'
        ])
    })

    it('实时状态区域初始应显示未启动、normal 频率和三轴零值', async () => {
        const logItems = await getTexts(page, '.log-item')
        expect(logItems).toEqual(expect.arrayContaining([
            '监听状态：未启动',
            '当前频率：normal',
            'X：0.0000',
            'Y：0.0000',
            'Z：0.0000'
        ]))
    })

    it('调用结果区域初始应显示等待调用、未执行和绑定提示', async () => {
        const logItems = await getTexts(page, '.log-item')
        expect(logItems).toEqual(expect.arrayContaining([
            '最近动作：等待调用',
            '状态：未执行',
            '说明：请先绑定监听后开始'
        ]))
    })

    it('频率选择区域应显示 game、ui、normal 三个选项', async () => {
        const pageText = await getPageText(page)
        expect(pageText).toContain('game')
        expect(pageText).toContain('ui')
        expect(pageText).toContain('normal')
    })

    it('陀螺仪 API 页面应按顺序显示六个操作按钮', async () => {
        const buttonTexts = await getTexts(page, 'button')
        expect(buttonTexts).toEqual([
            '开始监听',
            '停止监听',
            '绑定主监听',
            '再绑一个监听',
            'off 指定监听',
            'off 全部监听'
        ])
    })

    it('陀螺仪 API 页面所有操作按钮默认都应可点击', async () => {
        const buttons = await page.$$('button')
        expect(buttons.length).toBe(6)

        for (const button of buttons) {
            const disabled = await button.attribute('disabled')
            expect(disabled == null || disabled == 'false').toBe(true)
        }
    })

    it('点击「绑定主监听」后应显示主监听已绑定结果', async () => {
        const button = await getButtonByText(page, '绑定主监听')
        await button.tap()
        await page.waitFor(300)

        await expectPageTextContains(page, '最近动作：onGyroscopeChange(primary)')
        await expectPageTextContains(page, '状态：已绑定')
        await expectPageTextContains(page, '说明：主监听已注册')
    })

    it('点击「再绑一个监听」后应显示额外监听已绑定结果', async () => {
        const button = await getButtonByText(page, '再绑一个监听')
        await button.tap()
        await page.waitFor(300)

        await expectPageTextContains(page, '最近动作：onGyroscopeChange(extra)')
        await expectPageTextContains(page, '状态：已绑定')
        await expectPageTextContains(page, '说明：额外监听已注册')
    })

    it('点击「off 指定监听」后应显示仅移除主监听结果', async () => {
        const bindButton = await getButtonByText(page, '绑定主监听')
        await bindButton.tap()
        await page.waitFor(200)

        const offButton = await getButtonByText(page, 'off 指定监听')
        await offButton.tap()
        await page.waitFor(300)

        await expectPageTextContains(page, '最近动作：offGyroscopeChange(listener)')
        await expectPageTextContains(page, '状态：已解绑')
        await expectPageTextContains(page, '说明：仅移除主监听')
    })

    it('点击「off 全部监听」后应显示所有监听已移除结果', async () => {
        const primaryButton = await getButtonByText(page, '绑定主监听')
        await primaryButton.tap()
        const extraButton = await getButtonByText(page, '再绑一个监听')
        await extraButton.tap()
        await page.waitFor(200)

        const offButton = await getButtonByText(page, 'off 全部监听')
        await offButton.tap()
        await page.waitFor(300)

        await expectPageTextContains(page, '最近动作：offGyroscopeChange()')
        await expectPageTextContains(page, '状态：已解绑')
        await expectPageTextContains(page, '说明：所有监听函数已移除')
    })

    it('点击「开始监听」后应显示 startGyroscope 成功或失败结果', async () => {
        const button = await getButtonByText(page, '开始监听')
        await button.tap()

        const pageText = await waitForPageText(page, isStartResultText)
        expect(pageText).toContain('最近动作：startGyroscope')
    })

    it('点击「停止监听」后应显示 stopGyroscope 成功或失败结果', async () => {
        const startButton = await getButtonByText(page, '开始监听')
        await startButton.tap()
        await page.waitFor(500)

        const stopButton = await getButtonByText(page, '停止监听')
        await stopButton.tap()

        const pageText = await waitForPageText(page, isStopResultText)
        expect(pageText).toContain('最近动作：stopGyroscope')
    })

    it('连续操作后监听日志区域应最多保留十条记录', async () => {
        const buttons = [
            await getButtonByText(page, '绑定主监听'),
            await getButtonByText(page, '再绑一个监听'),
            await getButtonByText(page, 'off 指定监听'),
            await getButtonByText(page, 'off 全部监听')
        ]

        for (let i = 0; i < 12; i += 1) {
            await buttons[i % buttons.length].tap()
            await page.waitFor(80)
        }

        const logItems = await getTexts(page, '.log-item')
        const listenerLogCount = logItems.length - 8
        expect(listenerLogCount).toBeGreaterThan(0)
        expect(listenerLogCount).toBeLessThanOrEqual(10)
    })

})
