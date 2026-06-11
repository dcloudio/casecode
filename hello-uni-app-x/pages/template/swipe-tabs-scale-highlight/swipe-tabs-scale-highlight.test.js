const PAGE_PATH = '/pages/template/swipe-tabs-scale-highlight/swipe-tabs-scale-highlight'
const ACTIVE_COLORS = ['rgb(0, 0, 0)', '#000000']
const INACTIVE_COLORS = ['rgb(85, 85, 85)', '#555555']
const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isMP = platformInfo.startsWith('mp')

describe('template-swipe-tabs-scale-highlight', () => {
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

  async function resetToFirstTab() {
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
    return await page.$('.swiper-view')
  }

  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('view')
    await page.waitFor(800)
  })

  beforeEach(async () => {
    await resetToFirstTab()
  })

  it('renders tabs and initial highlighted state', async () => {
    const tabs = await getTabs()
    expect(tabs.length).toBe(4)
    expect(await tabs[0].text()).toBe('Tab 0')
    expect(await tabs[3].text()).toBe('Tab 3')
    expectOneOfColor(await tabs[0].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[1].style('color'), INACTIVE_COLORS)
    if (!isMP) {
      expect(await tabs[0].style('transform')).not.toBe('none')
    }
    const swiper = await getSwiper()
    expect(await swiper.property('current')).toBe(0)
  })

  it('updates highlighted tab after tapping Tab 1', async () => {
    const tabs = await getTabs()
    const tab0BeforeTransform = await tabs[0].style('transform')
    const tab1BeforeTransform = await tabs[1].style('transform')

    await tabs[1].tap()
    await waitForSwiperCurrent(1)

    const swiper = await getSwiper()
    expect(await swiper.property('current')).toBe(1)
    expectOneOfColor(await tabs[1].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[0].style('color'), INACTIVE_COLORS)
    if (!isMP) {
      expect(await tabs[1].style('transform')).not.toBe('none')
      expect(await tabs[1].style('transform')).not.toBe(tab1BeforeTransform)
      expect(await tabs[0].style('transform')).not.toBe(tab0BeforeTransform)
    }
  })

  it('keeps highlighted tab in sync after swiper current changes', async () => {
    const tabs = await getTabs()

    await page.callMethod('jest_setSwiperCurrent', 2)
    await waitForSwiperCurrent(2)

    const swiper = await getSwiper()
    expect(await swiper.property('current')).toBe(2)
    expectOneOfColor(await tabs[2].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[0].style('color'), INACTIVE_COLORS)
    if (!isMP) {
      expect(await tabs[2].style('transform')).not.toBe('none')
    }
  })

  it('switches back to Tab 0 after returning from a non-zero page', async () => {
    await page.callMethod('jest_setSwiperCurrent', 2)
    await waitForSwiperCurrent(2)

    const tabs = await getTabs()
    await tabs[0].tap()
    await waitForSwiperCurrent(0)

    const swiper = await getSwiper()
    expect(await swiper.property('current')).toBe(0)
    expectOneOfColor(await tabs[0].style('color'), ACTIVE_COLORS)
    expectOneOfColor(await tabs[2].style('color'), INACTIVE_COLORS)
    if (!isMP) {
      expect(await tabs[0].style('transform')).not.toBe('none')
    }
  })

})
