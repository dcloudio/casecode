// uni-app自动化测试教程: https://uniapp.dcloud.net.cn/worktile/auto/hbuilderx-extension/

jest.setTimeout(30000)

const PAGE_PATH = '/pages/API/gyroscope/panorama'

async function openPanoramaPage() {
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

async function expectPageTextContains(page, expectedText) {
    const pageText = await getPageText(page)
    expect(pageText).toContain(expectedText)
}

describe('panorama', () => {
    let page

    beforeEach(async () => {
        page = await openPanoramaPage()
    })

    it('页面启动后路径应为 pages/API/gyroscope/panorama', async () => {
        expect(page.path).toBe('pages/API/gyroscope/panorama')
    })

    it('页面顶部应显示标题「全景浏览」', async () => {
        const title = await page.$('.uni-h2')
        expect(title).not.toBeNull()
        expect(await title.text()).toBe('全景浏览')
    })

    it('页面说明应提示左右转动手机查看超宽画卷', async () => {
        const pageText = await getPageText(page)
        expect(pageText).toContain('左右转动手机')
        expect(pageText).toContain('超宽画卷')
    })

    it('页面应按顺序显示当前状态和移动视窗两个区域标题', async () => {
        const headers = await getTexts(page, '.uni-h3')
        expect(headers).toEqual([
            '当前状态',
            '移动视窗'
        ])
    })

    it('当前状态区域应显示水平偏移和角速度 Y 两个指标', async () => {
        const metricLabels = await getTexts(page, '.metric-label')
        expect(metricLabels).toEqual([
            '水平偏移',
            '角速度 Y'
        ])
    })

    it('水平偏移初始值应使用 px 单位展示', async () => {
        const metricValues = await getTexts(page, '.metric-value')
        expect(metricValues.length).toBe(2)
        expect(metricValues[0]).toContain(' px')
    })

    it('角速度 Y 初始值应为四位小数格式', async () => {
        const metricValues = await getTexts(page, '.metric-value')
        expect(metricValues.length).toBe(2)
        expect(metricValues[1]).toMatch(/^-?\d+\.\d{4}$/)
    })

    it('移动视窗区域应渲染全景画卷标题', async () => {
        await expectPageTextContains(page, '渐变全景画卷')
    })

    it('移动视窗区域应渲染全景画卷说明', async () => {
        await expectPageTextContains(page, '从红色过渡到黄色的超宽视界')
    })

    it('移动视窗区域应渲染尾部提示', async () => {
        await expectPageTextContains(page, '到达尾部了')
        await expectPageTextContains(page, '已展示全部内容')
    })

    it('全景视窗容器应存在', async () => {
        const viewport = await page.$('#panoramaViewport')
        expect(viewport).not.toBeNull()
    })

    it('全景画卷应绑定横向位移样式', async () => {
        const strip = await page.$('.panorama-strip')
        expect(strip).not.toBeNull()

        const style = await strip.attribute('style')
        expect(style).toContain('translateX')
    })
})