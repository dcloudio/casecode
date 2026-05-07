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

    it('点击「绑定主监听」后应显示主监听已绑定结果', async () => {
        const button = await getButton(page, '#btn-bind-primary-listener')
        await button.tap()
        await page.waitFor(300)

        await expectPageTextContains(page, '最近动作：onGyroscopeChange(primary)')
        await expectPageTextContains(page, '状态：已绑定')
        await expectPageTextContains(page, '说明：主监听已注册')
    })

    it('点击「再绑一个监听」后应显示额外监听已绑定结果', async () => {
        const button = await getButton(page, '#btn-bind-extra-listener')
        await button.tap()
        await page.waitFor(300)

        await expectPageTextContains(page, '最近动作：onGyroscopeChange(extra)')
        await expectPageTextContains(page, '状态：已绑定')
        await expectPageTextContains(page, '说明：额外监听已注册')
    })

    it('点击「off 指定监听」后应显示仅移除主监听结果', async () => {
        const bindButton = await getButton(page, '#btn-bind-primary-listener')
        await bindButton.tap()
        await page.waitFor(200)

        const offButton = await getButton(page, '#btn-remove-primary-listener')
        await offButton.tap()
        await page.waitFor(300)

        await expectPageTextContains(page, '最近动作：offGyroscopeChange(listener)')
        await expectPageTextContains(page, '状态：已解绑')
        await expectPageTextContains(page, '说明：仅移除主监听')
    })

    it('点击「off 全部监听」后应显示所有监听已移除结果', async () => {
        const primaryButton = await getButton(page, '#btn-bind-primary-listener')
        await primaryButton.tap()
        const extraButton = await getButton(page, '#btn-bind-extra-listener')
        await extraButton.tap()
        await page.waitFor(200)

        const offButton = await getButton(page, '#btn-remove-all-listeners')
        await offButton.tap()
        await page.waitFor(300)

        await expectPageTextContains(page, '最近动作：offGyroscopeChange()')
        await expectPageTextContains(page, '状态：已解绑')
        await expectPageTextContains(page, '说明：所有监听函数已移除')
    })

    it('点击「开始监听」后应显示 startGyroscope 成功或失败结果', async () => {
        const button = await getButton(page, '#btn-start-gyroscope')
        await button.tap()

        const pageText = await waitForPageText(page, isStartResultText)
        expect(pageText).toContain('最近动作：startGyroscope')
    })

    it('点击「停止监听」后应显示 stopGyroscope 成功或失败结果', async () => {
        const startButton = await getButton(page, '#btn-start-gyroscope')
        await startButton.tap()
        await page.waitFor(500)

        const stopButton = await getButton(page, '#btn-stop-gyroscope')
        await stopButton.tap()

        const pageText = await waitForPageText(page, isStopResultText)
        expect(pageText).toContain('最近动作：stopGyroscope')
    })
})
