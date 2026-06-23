const PAGE_PATH = '/pages/template/interstitial-poster/interstitial-poster'
const WAIT_FOR_RENDER = 3000
const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isAndroid = platformInfo.startsWith('android')
const isIOS = platformInfo.startsWith('ios')
const isHarmony = platformInfo.startsWith('harmony')
const isWeb = platformInfo.startsWith('web') || platformInfo.startsWith('h5')
const isMP = platformInfo.startsWith('mp')
// 原生 page-container 遮罩层的坐标点击命中在不同系统版本上存在差异，当前仅在已验证通过的版本执行该用例。
const allowOverlayTap = isWeb ||
  (isAndroid && platformInfo.indexOf('14') != -1) ||
  (isIOS && platformInfo.indexOf('16.4') != -1) ||
  (isHarmony && platformInfo.indexOf('22') != -1)

describe('template-interstitial-poster', () => {
  let page

  async function isPosterRendered() {
    const cardEl = await page.$('.poster-card')
    await page.waitFor(300)
    return cardEl != null
  }

  async function waitForPosterRendered(rendered) {
    const start = Date.now()
    await page.waitFor(async () => {
      return await isPosterRendered() == rendered || Date.now() - start > WAIT_FOR_RENDER
    })
    expect(await isPosterRendered()).toBe(rendered)
  }

  async function openPoster() {
    const button = await page.$('.hero-button')
    expect(button).not.toBeNull()
    await button.tap()
    await waitForPosterRendered(true)
  }

  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('view')
    await waitForPosterRendered(false)
  })

  beforeEach(async () => {
    await waitForPosterRendered(false)
  })

  it('renders hero content', async () => {
    const title = await page.$('.hero-title')
    expect(await title.text()).toBe('插屏海报示例')
    const desc = await page.$('.hero-desc')
    expect(await desc.text()).toBe('使用 page-container 实现一个居中的插屏海报。')
    const button = await page.$('.hero-button')
    expect(await button.text()).toBe('打开插屏海报')
    await waitForPosterRendered(false)
  })

  it('opens poster by tapping the primary button', async () => {
    await openPoster()
    const posterTitle = await page.$('.poster-title')
    expect(await posterTitle.text()).toBe('插屏海报')
    const posterAction = await page.$('.poster-action')
    expect(await posterAction.text()).toBe('立即查看')
    const posterCard = await page.$('.poster-card')
    const { width, height } = await posterCard.size()
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
    expect(posterAction).not.toBeNull()
    await posterAction.tap()
    await waitForPosterRendered(false)
  })

  it('closes poster by tapping the action button', async () => {
    await openPoster()
    const posterAction = await page.$('.poster-action')
    expect(posterAction).not.toBeNull()
    await posterAction.tap()
    await waitForPosterRendered(false)
  })

  it('closes poster by tapping the close button', async () => {
    await openPoster()
    const closeWrap = await page.$('.poster-close-wrap')
    expect(closeWrap).not.toBeNull()
    await closeWrap.tap()
    await waitForPosterRendered(false)
  })

  if (!isMP && allowOverlayTap) {
    it('closes poster by tapping the overlay', async () => {
      await openPoster()
      const posterCard = await page.$('.poster-card')
      const closeCircle = await page.$('.poster-close-circle')
      expect(posterCard).not.toBeNull()
      expect(closeCircle).not.toBeNull()
      const windowInfo = await program.callUniMethod('getWindowInfo')
      const posterCardSize = await posterCard.size()
      const closeRect = await closeCircle.offset()
      const closeSize = await closeCircle.size()
      const closeCenterX = closeRect.left + closeSize.width / 2
      const dialogHeight = posterCardSize.height + 18 + closeSize.height
      const dialogTop = (windowInfo.windowHeight - dialogHeight) / 2
      const closeCenterY = closeRect.top + closeSize.height / 2
      const overlayTapY = isWeb
        ? closeCenterY
        : dialogTop + posterCardSize.height + 18 + closeSize.height / 2
      const tapPoint = {
        x: Math.round(closeCenterX - 50),
        y: Math.round(overlayTapY)
      }
      await program.tap(tapPoint)
      await waitForPosterRendered(false)
    })
  } else if (!isMP) {
    it('skips overlay tap on unsupported platform versions', () => {
      expect(1).toBe(1)
    })
  }


})
