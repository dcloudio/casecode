// uni-app自动化测试教程: https://uniapp.dcloud.net.cn/worktile/auto/hbuilderx-extension/

jest.setTimeout(30000)

const PAGE_PATH = '/pages/API/gyroscope/panorama'

async function openPanoramaPage() {
    const page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('.uni-h2')
    await page.waitFor(500)
    return page
}

async function getStatusText(page) {
    const status = await page.$('#panoramaStatus')
    expect(status).not.toBeNull()
    return await status.text()
}

async function waitForStatusText(page, matcher, timeout = 5000) {
    const startTime = Date.now()
    let statusText = await getStatusText(page)
    while (Date.now() - startTime < timeout) {
        if (matcher(statusText)) {
            return statusText
        }
        await page.waitFor(200)
        statusText = await getStatusText(page)
    }
    throw new Error(`等待状态文本更新超时，当前文本：${statusText}`)
}

describe('panorama', () => {
    let page

    beforeEach(async () => {
        page = await openPanoramaPage()
    })

    it('页面加载后应触发陀螺仪启动结果', async () => {
        const statusText = await waitForStatusText(page, (text) => {
            return text != '正在初始化陀螺仪...'
        })
        expect(statusText.length).toBeGreaterThan(0)
    })

    it('调用 stopListen 后应更新为已停止监听', async () => {
        await page.callMethod('stopListen')
        const statusText = await waitForStatusText(page, (text) => {
            return text == '已停止监听'
        })
        expect(statusText).toBe('已停止监听')
    })

    it('调用 startListen 后应重新进入运行态或错误态', async () => {
        await page.callMethod('stopListen')
        await waitForStatusText(page, (text) => {
            return text == '已停止监听'
        })
        await page.callMethod('startListen')
        const statusText = await waitForStatusText(page, (text) => {
            return text != '已停止监听' && text != '正在初始化陀螺仪...'
        })
        expect(statusText.length).toBeGreaterThan(0)
    })
})
