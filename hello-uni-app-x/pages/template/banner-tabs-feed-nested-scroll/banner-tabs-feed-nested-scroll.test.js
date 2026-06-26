const PAGE_PATH = '/pages/template/banner-tabs-feed-nested-scroll/banner-tabs-feed-nested-scroll'
const ACTIVE_COLORS = ['rgb(0, 122, 255)', '#007AFF', '#007AFFFF']
const INACTIVE_COLORS = ['rgb(85, 85, 85)', '#555555', '#555555FF']

jest.setTimeout(30000)

describe('template-banner-tabs-feed-nested-scroll', () => {
  let page

  async function waitForSwiperCurrent(target, timeout = 4000) {
    const start = Date.now()
    await page.waitFor(async () => {
      const state = await page.callMethod('jest_getState')
      return state != null && state.swiperIndex == target && state.animationFinishIndex == target || Date.now() - start > timeout
    })

    const state = await page.callMethod('jest_getState')
    expect(state.swiperIndex).toBe(target)
    expect(state.animationFinishIndex).toBe(target)
  }

  async function waitForListState(index, matcher, timeout = 5000) {
    const start = Date.now()
    await page.waitFor(async () => {
      const state = await page.callMethod('jest_getListState', index)
      return matcher(state) || Date.now() - start > timeout
    })

    return await page.callMethod('jest_getListState', index)
  }

  async function waitForIndicatorChange(indicator, beforeTransform, beforeWidth, timeout = 4000) {
    const start = Date.now()
    await page.waitFor(async () => {
      const transform = await indicator.style('transform')
      const width = (await indicator.size()).width
      return transform !== beforeTransform || width !== beforeWidth || Date.now() - start > timeout
    })

    const transform = await indicator.style('transform')
    const width = (await indicator.size()).width
    expect(transform !== beforeTransform || width !== beforeWidth).toBe(true)
  }

  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('view')
    await page.waitFor('scroll-view')
    await page.waitFor('swiper')
    await page.waitFor(800)
  })

  beforeEach(async () => {
    await page.callMethod('jest_setSwiperCurrent', 0)
    await page.callMethod('jest_prepareMockData')
    await waitForListState(0, (state) => state != null && state.renderedCount > 0)
    await page.waitFor(200)
  })

  it('renders banner tabs and initial mocked feed list', async () => {
    const swipers = await page.$$('swiper')
    const tabs = await page.$$('.swiper-tabs-item')
    const firstListState = await page.callMethod('jest_getListState', 0)
    const secondListState = await page.callMethod('jest_getListState', 1)
    const pageState = await page.callMethod('jest_getState')

    expect(swipers.length).toBe(2)
    expect(tabs.length).toBe(4)
    expect(await tabs[0].text()).toBe('最新上架')
    expect(await tabs[2].text()).toBe('付费热榜')
    expect(pageState.currentType).toBe('UpdatedDate')
    expect(pageState.nestedScrollChildId).toBe('list-id-1')
    expect(firstListState.renderedCount).toBe(10)
    expect(firstListState.firstTitle).toBe('UpdatedDate mock 1')
    expect(secondListState.renderedCount).toBe(0)
    expect(ACTIVE_COLORS).toContain(await tabs[0].style('color'))
    expect(INACTIVE_COLORS).toContain(await tabs[1].style('color'))
  })

  it('updates nested child id and indicator after tapping another tab', async () => {
    const tabs = await page.$$('.swiper-tabs-item')
    const indicator = await page.$('.swiper-tabs-indicator')
    const beforeTransform = await indicator.style('transform')
    const beforeWidth = (await indicator.size()).width

    await tabs[1].tap()
    await waitForSwiperCurrent(1)
    const secondListState = await waitForListState(1, (state) => state != null && state.renderedCount > 0)
    const pageState = await page.callMethod('jest_getState')

    expect(pageState.currentType).toBe('FreeHot')
    expect(pageState.nestedScrollChildId).toBe('list-id-2')
    expect(secondListState.firstTitle).toBe('FreeHot mock 1')
    expect(ACTIVE_COLORS).toContain(await tabs[1].style('color'))
    expect(INACTIVE_COLORS).toContain(await tabs[0].style('color'))

    await waitForIndicatorChange(indicator, beforeTransform, beforeWidth)
  })

  it('supports programmatic switch to later feed tabs', async () => {
    const changed = await page.callMethod('jest_setSwiperCurrent', 2)
    expect(changed).toBe(true)
    await waitForSwiperCurrent(2)

    const thirdListState = await waitForListState(2, (state) => state != null && state.renderedCount > 0)
    const pageState = await page.callMethod('jest_getState')

    expect(pageState.currentType).toBe('PaymentHot')
    expect(pageState.nestedScrollChildId).toBe('list-id-3')
    expect(thirdListState.firstTitle).toBe('PaymentHot mock 1')
  })
})
