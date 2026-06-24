const PAGE_PATH = '/pages/template/swipe-tabs-underline/swipe-tabs-underline'
const ACTIVE_COLORS = ['rgb(0, 122, 255)', '#007AFF', '#007AFFFF']
const INACTIVE_COLORS = ['rgb(85, 85, 85)', '#555555', '#555555FF']
const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isMP = platformInfo.startsWith('mp')

jest.setTimeout(30000)

describe('template-swipe-tabs-underline', () => {
  let page

  async function launchPage() {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('view')
    await page.waitFor(800)
  }

  function expectOneOfColor(actualColor, expectedColors) {
    expect(expectedColors).toContain(actualColor)
  }

  async function waitForSwiperCurrent(target) {
    const start = Date.now()
    await page.waitFor(async () => {
      const swiper = await page.$('swiper')
      return await swiper.property('current') == target || Date.now() - start > 8000
    })

    const swiper = await page.$('swiper')
    expect(await swiper.property('current')).toBe(target)
  }

  async function swipeSwiperNext() {
    const tabs = await page.$$('.swiper-tabs-item')
    await tabs[1].tap()
    await waitForSwiperCurrent(1)
  }

  async function waitForIndicatorStateChange(beforeTransform, beforeWidth) {
    await page.waitFor(async () => {
      const indicator = await page.$('.swiper-tabs-indicator')
      const currentTransform = await indicator.style('transform')
      const currentWidth = (await indicator.size()).width
      return currentTransform !== beforeTransform || currentWidth !== beforeWidth
    })
  }

  beforeEach(async () => {
    await launchPage()
  })

  it('renders tabs and initial active state', async () => {
    const tabs = await page.$$('.swiper-tabs-item')
    expect(tabs.length).toBe(8)
    expect(await tabs[0].text()).toBe('Tab 0')
    expect(await tabs[7].text()).toBe('Tab        7')
    expectOneOfColor(await tabs[0].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[1].style('color'), INACTIVE_COLORS)
    const swiper = await page.$('swiper')
    expect(await swiper.property('current')).toBe(0)
  })

  it('switches current tab and indicator after tapping a tab', async () => {
    const tabs = await page.$$('.swiper-tabs-item')
    const indicator = await page.$('.swiper-tabs-indicator')
    const beforeTransform = await indicator.style('transform')
    const beforeWidth = (await indicator.size()).width
    await tabs[3].tap()
    await waitForSwiperCurrent(3)
    await waitForIndicatorStateChange(beforeTransform, beforeWidth)
    const swiper = await page.$('swiper')
    expect(await swiper.property('current')).toBe(3)
    expectOneOfColor(await tabs[3].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[0].style('color'), INACTIVE_COLORS)
    if (isMP) {
      expect((await indicator.size()).width).not.toBe(beforeWidth)
    } else {
      expect(await indicator.style('transform')).not.toBe(beforeTransform)
    }
  })

  it('keeps tabs in sync after swiper changes current', async () => {
    const tabs = await page.$$('.swiper-tabs-item')
    const swiper = await page.$('swiper')
    await page.callMethod('jest_setSwiperCurrent', 1)
    await waitForSwiperCurrent(1)
    expect(await swiper.property('current')).toBe(1)
    expectOneOfColor(await tabs[1].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[0].style('color'), INACTIVE_COLORS)
  })

  it('switches back to Tab 0 after returning from a non-zero page', async () => {
    const swiper = await page.$('swiper')
    await swipeSwiperNext()
    expect(await swiper.property('current')).toBe(1)
    const tabs = await page.$$('.swiper-tabs-item')
    await tabs[0].tap()
    await waitForSwiperCurrent(0)
    expect(await swiper.property('current')).toBe(0)
    expectOneOfColor(await tabs[0].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[1].style('color'), INACTIVE_COLORS)
  })
})
