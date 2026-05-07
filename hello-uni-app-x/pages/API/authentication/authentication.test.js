// uni-app自动化测试教程: https://uniapp.dcloud.net.cn/worktile/auto/hbuilderx-extension/

jest.setTimeout(30000)

const PAGE_PATH = '/pages/API/authentication/authentication'

async function openAuthenticationPage() {
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

async function getLogTexts(page) {
    return await getTexts(page, '.log-text')
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

function isSupportResultText(text) {
    return text.includes('支持:') ||
        text.includes('不支持任何生物认证') ||
        text.includes('检查失败：[')
}

function isFingerPrintEnrollResultText(text) {
    return text.includes('指纹已录入') ||
        text.includes('指纹未录入') ||
        text.includes('指纹检查失败：[')
}

function isFacialEnrollResultText(text) {
    return text.includes('人脸已录入') ||
        text.includes('人脸未录入') ||
        text.includes('人脸检查失败：[')
}

async function getSupportText(page) {
    const button = await getButtonByText(page, '检查支持的认证方式')
    await button.tap()
    return await waitForPageText(page, isSupportResultText)
}

describe('authentication', () => {
    let page

    beforeEach(async () => {
        page = await openAuthenticationPage()
    })

    it('页面启动后路径应为 /pages/API/authentication/authentication', async () => {
        expect(page.path).toBe('pages/API/authentication/authentication')
    })

    it('页面顶部应显示标题「生物认证」', async () => {
        const title = await page.$('.uni-h2')
        expect(title).not.toBeNull()
        expect(await title.text()).toBe('生物认证')
    })

    it('标题下方应显示 Android 生物认证差异说明', async () => {
        const notice = await page.$('.notice')
        expect(notice).not.toBeNull()
        const noticeText = await notice.text()
        expect(noticeText).toBe('低版本安卓仅支持指纹，高版本 Android 指纹和人脸会弹出统一认证框。')
    })

    it('页面应按顺序显示设备支持、录入状态、认证结果三个区域标题', async () => {
        const headers = await getTexts(page, '.uni-h3')
        expect(headers).toEqual([
            '设备支持情况',
            '录入状态检查',
            '认证结果'
        ])
    })

    it('设备支持状态区域初始文案应为「未检查」', async () => {
        const logTexts = await getLogTexts(page)
        expect(logTexts[0]).toBe('未检查')
    })

    it('认证结果区域初始文案应为「等待认证」', async () => {
        const logTexts = await getLogTexts(page)
        expect(logTexts[1]).toBe('等待认证')
    })

    it('页面应按顺序显示 5 个生物认证操作按钮', async () => {
        const buttonTexts = await getTexts(page, 'button')
        expect(buttonTexts).toEqual([
            '检查支持的认证方式',
            '检查指纹',
            '检查人脸识别',
            '指纹认证',
            '人脸认证'
        ])
    })

    it('所有生物认证操作按钮默认都应可点击', async () => {
        const buttons = await page.$$('button')
        expect(buttons.length).toBe(5)

        for (const button of buttons) {
            const disabled = await button.attribute('disabled')
            expect(disabled == null || disabled == 'false').toBe(true)
        }
    })

    it('点击「检查支持的认证方式」后，设备支持状态区域应显示支持、不支持或检查失败结果', async () => {
        await getSupportText(page)
        const logTexts = await getLogTexts(page)
        expect(isSupportResultText(logTexts[0])).toBe(true)
    })

    it('点击「检查指纹」后，认证结果区域应显示指纹已录入、未录入或检查失败结果', async () => {
        const button = await getButtonByText(page, '检查指纹')
        await button.tap()

        await waitForPageText(page, isFingerPrintEnrollResultText)
        const logTexts = await getLogTexts(page)
        expect(isFingerPrintEnrollResultText(logTexts[1])).toBe(true)
    })

    it('点击「检查人脸识别」后，认证结果区域应显示人脸已录入、未录入或检查失败结果', async () => {
        const button = await getButtonByText(page, '检查人脸识别')
        await button.tap()

        await waitForPageText(page, isFacialEnrollResultText)
        const logTexts = await getLogTexts(page)
        expect(isFacialEnrollResultText(logTexts[1])).toBe(true)
    })

    it('当设备明确不支持指纹时，点击「指纹认证」应在认证结果区域显示失败信息', async () => {
        const supportText = await getSupportText(page)
        const supportsFingerPrint = supportText.includes('支持:') && supportText.includes(
            'fingerPrint')

        if (supportsFingerPrint || supportText.includes('检查失败：[')) {
            expect(await getButtonByText(page, '指纹认证')).not.toBeNull()
            return
        }

        const button = await getButtonByText(page, '指纹认证')
        await button.tap()

        const pageText = await waitForPageText(
            page,
            (text) => text.includes('指纹认证失败，[')
        )
        expect(pageText).toContain('指纹认证失败，[')
    })

    it('当设备明确不支持人脸时，点击「人脸认证」应在认证结果区域显示失败信息', async () => {
        const supportText = await getSupportText(page)
        const supportsFacial = supportText.includes('支持:') && supportText.includes('facial')

        if (supportsFacial || supportText.includes('检查失败：[')) {
            expect(await getButtonByText(page, '人脸认证')).not.toBeNull()
            return
        }

        const button = await getButtonByText(page, '人脸认证')
        await button.tap()

        const pageText = await waitForPageText(
            page,
            (text) => text.includes('人脸认证失败，[')
        )
        expect(pageText).toContain('人脸认证失败，[')
    })
})