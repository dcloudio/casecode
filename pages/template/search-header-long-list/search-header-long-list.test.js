const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isMP = platformInfo.startsWith('mp')
const PAGE_PATH = '/pages/template/search-header-long-list/search-header-long-list'
const ACTIVE_COLORS = ['rgb(0, 122, 255)', '#007AFF', '#007AFFFF']
const INACTIVE_COLORS = ['rgb(85, 85, 85)', '#555555', '#555555FF']

jest.setTimeout(30000)

describe('template-search-header-long-list', () => {
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
    await page.waitFor(3000)
  })

  beforeEach(async () => {
    await page.callMethod('jest_setSwiperCurrent', 0)
    await page.callMethod('jest_prepareMockData')
    await waitForListState(0, (state) => state != null && state.renderedCount > 0)
    await page.waitFor(200)
  })

  it('renders search header tabs and initial mocked list', async () => {
    const input = await page.$('input')
    const tabs = await page.$$('.swiper-tabs-item')
    const firstListState = await page.callMethod('jest_getListState', 0)
    const secondListState = await page.callMethod('jest_getListState', 1)
    const pageState = await page.callMethod('jest_getState')

    expect(input).not.toBeNull()
    expect(tabs.length).toBe(4)
    expect(await tabs[0].text()).toBe('最新上架')
    expect(await tabs[3].text()).toBe('热门总榜')
    expect(pageState.tabCount).toBe(4)
    expect(pageState.currentType).toBe('UpdatedDate')
    expect(firstListState.renderedCount).toBe(10)
    expect(firstListState.firstTitle).toBe('UpdatedDate mock 1')
    expect(firstListState.mockEnabled).toBe(true)
    expect(secondListState.renderedCount).toBe(0)
    expect(ACTIVE_COLORS).toContain(await tabs[0].style('color'))
    expect(INACTIVE_COLORS).toContain(await tabs[1].style('color'))

    if (!isMP) {
      const firstItem = await page.$('.list-item')
      expect(firstItem).not.toBeNull()
    }
  })

  it('switches to the second tab and lazy loads its list', async () => {
    const tabs = await page.$$('.swiper-tabs-item')
    const indicator = await page.$('.swiper-tabs-indicator')
    const beforeTransform = await indicator.style('transform')
    const beforeWidth = (await indicator.size()).width

    await tabs[1].tap()
    await waitForSwiperCurrent(1)
    const secondListState = await waitForListState(1, (state) => state != null && state.renderedCount > 0)
    const pageState = await page.callMethod('jest_getState')

    expect(pageState.currentType).toBe('FreeHot')
    expect(pageState.currentPreload).toBe(true)
    expect(secondListState.firstTitle).toBe('FreeHot mock 1')
    expect(ACTIVE_COLORS).toContain(await tabs[1].style('color'))
    expect(INACTIVE_COLORS).toContain(await tabs[0].style('color'))

    await waitForIndicatorChange(indicator, beforeTransform, beforeWidth)
  })

  it('supports programmatic swiper switching for web fallback', async () => {
    const changed = await page.callMethod('jest_setSwiperCurrent', 3)
    expect(changed).toBe(true)
    await waitForSwiperCurrent(3)

    const fourthListState = await waitForListState(3, (state) => state != null && state.renderedCount > 0)
    const pageState = await page.callMethod('jest_getState')

    expect(pageState.currentType).toBe('HotList')
    expect(fourthListState.firstTitle).toBe('HotList mock 1')
  })
})
