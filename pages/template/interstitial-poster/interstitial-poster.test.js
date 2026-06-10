const PAGE_PATH = '/pages/template/interstitial-poster/interstitial-poster'
const WAIT_FOR_DIALOG = 600

describe('template-interstitial-poster', () => {
  let page

  async function expectPosterVisible(visible) {
    const container = await page.$('page-container')
    if (container == null) {
      return
    }
    expect(await container.property('show')).toBe(visible)
  }

  async function openPoster() {
    const button = await page.$('.hero-button')
    await button.tap()
    await page.waitFor(WAIT_FOR_DIALOG)
  }

  beforeEach(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('.hero-panel')
    await page.waitFor(300)
  })

  it('renders hero content', async () => {
    const title = await page.$('.hero-title')
    expect(await title.text()).toBe('插屏海报示例')

    const desc = await page.$('.hero-desc')
    expect(await desc.text()).toBe('使用 page-container 实现一个居中的插屏海报。')

    const button = await page.$('.hero-button')
    expect(await button.text()).toBe('打开插屏海报')
    await expectPosterVisible(false)
  })

  it('opens poster by tapping the primary button', async () => {
    await openPoster()
    await expectPosterVisible(true)

    const posterTitle = await page.$('.poster-title')
    expect(await posterTitle.text()).toBe('插屏海报')

    const posterAction = await page.$('.poster-action')
    expect(await posterAction.text()).toBe('立即查看')

    const posterCard = await page.$('.poster-card')
    const { width, height } = await posterCard.size()
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  })

  it('closes poster by tapping the action button', async () => {
    await openPoster()
    const posterAction = await page.$('.poster-action')
    await posterAction.tap()
    await page.waitFor(WAIT_FOR_DIALOG)
    await expectPosterVisible(false)
  })

  it('closes poster by tapping the close button', async () => {
    await openPoster()
    const closeWrap = await page.$('.poster-close-wrap')
    await closeWrap.tap()
    await page.waitFor(WAIT_FOR_DIALOG)
    await expectPosterVisible(false)
  })

})
