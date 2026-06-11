const PAGE_PATH = '/pages/template/swipe-tabs-underline/swipe-tabs-underline'
const ACTIVE_COLORS = ['rgb(0, 122, 255)', '#007AFF']
const INACTIVE_COLORS = ['rgb(85, 85, 85)', '#555555']
const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isMP = platformInfo.startsWith('mp')

describe('template-swipe-tabs-underline', () => {
  let page

  function expectOneOfColor(actualColor, expectedColors) {
    expect(expectedColors).toContain(actualColor)
  }

  async function waitForSwiperCurrent(target) {
    const start = Date.now()
    await page.waitFor(async () => {
      const swiper = await getSwiper()
      return await swiper.property('current') == target || Date.now() - start > 3000
    })

    const swiper = await getSwiper()
    expect(await swiper.property('current')).toBe(target)
  }

  async function resetSwiperToFirst() {
    const swiper = await getSwiper()
    if (await swiper.property('current') == 0) {
      return
    }
    const tabs = await getTabs()
    await tabs[0].tap()
    await waitForSwiperCurrent(0)
    await page.waitFor(300)
  }

  async function getTabs() {
    return await page.$$('.swiper-tabs-item')
  }

  async function getSwiper() {
    return await page.$('swiper')
  }

  async function swipeSwiperNext() {
    const swiper = await getSwiper()
    const tabs = await getTabs()
    await tabs[1].tap()
    await waitForSwiperCurrent(1)
  }

  async function getIndicator() {
    return await page.$('.swiper-tabs-indicator')
  }

  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('view')
    await page.waitFor(800)
  })

  beforeEach(async () => {
    await resetSwiperToFirst()
  })

  it('renders tabs and initial active state', async () => {
    const tabs = await getTabs()
    expect(tabs.length).toBe(8)
    expect(await tabs[0].text()).toBe('Tab 0')
    expect(await tabs[7].text()).toBe('Tab        7')
    expectOneOfColor(await tabs[0].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[1].style('color'), INACTIVE_COLORS)
    const swiper = await getSwiper()
    expect(await swiper.property('current')).toBe(0)
  })

  it('switches current tab and indicator after tapping a tab', async () => {
    const tabs = await getTabs()
    const indicator = await getIndicator()
    const beforeTransform = await indicator.style('transform')
    const beforeWidth = (await indicator.size()).width
    await tabs[3].tap()
    await waitForSwiperCurrent(3)
    const swiper = await getSwiper()
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
    const tabs = await getTabs()
    const swiper = await getSwiper()
    await page.callMethod('jest_setSwiperCurrent', 1)
    await waitForSwiperCurrent(1)
    expect(await swiper.property('current')).toBe(1)
    expectOneOfColor(await tabs[1].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[0].style('color'), INACTIVE_COLORS)
  })

  it('switches back to Tab 0 after returning from a non-zero page', async () => {
    const swiper = await getSwiper()
    await swipeSwiperNext()
    expect(await swiper.property('current')).toBe(1)
    const tabs = await getTabs()
    await tabs[0].tap()
    await waitForSwiperCurrent(0)
    expect(await swiper.property('current')).toBe(0)
    expectOneOfColor(await tabs[0].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[1].style('color'), INACTIVE_COLORS)
  })
})
