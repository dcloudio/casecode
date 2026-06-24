const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isWeb = platformInfo.startsWith('web')
const isTablet =
  platformInfo.includes('平板') ||
  platformInfo.includes('matepad') ||
  platformInfo.includes('ipad')

const PAGE_PATH = '/pages/template/news-feed-list/news-feed-list'
const DETAIL_PAGE_PATH = 'pages/template/news-feed-list/detail/detail'

jest.setTimeout(30000)

describe('template-news-feed-list', () => {
  let page

  async function openListPage(useMockData = false) {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('view')
    await page.waitFor('text')
    if (useMockData) {
      await page.callMethod('jest_applyMockData')
      await waitForElements('.uni-list-cell')
    }
  }

  async function getState() {
    return await page.callMethod('jest_getState')
  }

  async function waitForListData(minCount = 1, attempts = 15) {
    for (let index = 0; index < attempts; index++) {
      const state = await getState()
      if (state.listCount >= minCount) {
        return state
      }
      await page.waitFor(200)
    }
    throw new Error(`list data did not reach count ${minCount}`)
  }

  async function waitForElements(selector, minCount = 1, attempts = 15) {
    for (let index = 0; index < attempts; index++) {
      const elements = await page.$$(selector)
      if (elements.length >= minCount) {
        return elements
      }
      await page.waitFor(200)
    }
    throw new Error(`elements for ${selector} did not reach count ${minCount}`)
  }

  async function waitForCurrentPagePath(expectedPath, attempts = 10) {
    for (let index = 0; index < attempts; index++) {
      const currentPage = await program.currentPage()
      if (currentPage.path === expectedPath) {
        page = currentPage
        return currentPage
      }
      await page.waitFor(200)
    }
    throw new Error(`current page did not switch to ${expectedPath}`)
  }

  it('renders real list data in narrow layout', async () => {
    await openListPage()

    const state = await waitForListData()
    if (isTablet) {
      expect(true).toBe(true)
      return
    }
    expect(state.isWideScreen).toBe(false)
    expect(state.bannerTitle.length).toBeGreaterThan(0)
    expect(state.listCount).toBeGreaterThan(0)

    const bannerTitle = await page.$('.banner-title')
    expect((await bannerTitle.text()).length).toBeGreaterThan(0)
  })

  it('navigates to detail page and back in narrow layout', async () => {
    await openListPage()

    const listState = await waitForListData()
    if (isTablet) {
      expect(true).toBe(true)
      return
    }
    expect(listState.listCount).toBeGreaterThan(0)
    expect(listState.isWideScreen).toBe(false)

    const titles = await waitForElements('.uni-media-list-text-top')
    expect(titles.length).toBeGreaterThan(0)
    const firstTitleText = await titles[0].text()
    expect(firstTitleText.length).toBeGreaterThan(0)

    const items = await waitForElements('.uni-list-cell')
    expect(items.length).toBeGreaterThan(0)
    await items[0].tap()

    page = await waitForCurrentPagePath(DETAIL_PAGE_PATH)
    await page.waitFor('text')
    await page.waitFor(1000)
    const detailTitle = await page.$('.banner-title')
    expect(await detailTitle.text()).toBe(firstTitleText)

    await program.navigateBack()

    page = await waitForCurrentPagePath('pages/template/news-feed-list/news-feed-list')
    await page.waitFor('text')
    const backState = await waitForListData()
    expect(backState.isWideScreen).toBe(false)
    expect(backState.listCount).toBeGreaterThan(0)
  })

  it('shows detail in split view on tablet layout', async () => {
    await openListPage()

    const listState = await waitForListData()
    if (isTablet) {
      expect(listState.listCount).toBeGreaterThan(0)
      expect(listState.isWideScreen).toBe(true)

      const titles = await waitForElements('.uni-media-list-text-top')
      expect(titles.length).toBeGreaterThan(0)
      const firstTitleText = await titles[0].text()
      expect(firstTitleText.length).toBeGreaterThan(0)

      const items = await waitForElements('.uni-list-cell')
      expect(items.length).toBeGreaterThan(0)
      await items[0].tap()

      await waitForElements('.detail-container')
      await waitForElements('.detail-container .banner-title')

      const currentPage = await program.currentPage()
      expect(currentPage.path).toBe('pages/template/news-feed-list/news-feed-list')

      const wideState = await getState()
      expect(wideState.isWideScreen).toBe(true)
      expect(wideState.currentIndex).toBe(0)

      const detailTitle = await page.$('.detail-container .banner-title')
      expect(await detailTitle.text()).toBe(firstTitleText)
      return
    }

    expect(true).toBe(true)
  })

  it('shows the first detail in web split view', async () => {
    if (!isWeb) {
      expect(true).toBe(true)
      return
    }

    await openListPage(true)

    await page.callMethod('jest_setWideScreen', true)
    const opened = await page.callMethod('jest_openDetail', 0)
    expect(opened).toBe(true)
    await waitForElements('.detail-container')

    const state = await getState()
    expect(state.isWideScreen).toBe(true)
    expect(state.currentIndex).toBe(0)
    expect(state.postId).toBe('post-1')
    expect(state.title).toBe('列表新闻一')
    expect(state.cover).toBe('/static/logo.png')
    expect(state.currentDetailContentLength).toBeGreaterThan(0)

    const detailTitles = await page.$$('.detail-container .banner-title')
    expect(detailTitles.length).toBeGreaterThan(0)
    expect(await detailTitles[0].text()).toBe('列表新闻一')
  })

  it('switches to the second detail in web split view', async () => {
    if (!isWeb) {
      expect(true).toBe(true)
      return
    }

    await openListPage(true)

    await page.callMethod('jest_setWideScreen', true)
    await page.callMethod('jest_openDetail', 0)
    await waitForElements('.detail-container')

    const switched = await page.callMethod('jest_openDetail', 1)
    expect(switched).toBe(true)
    await page.waitFor(100)

    const nextState = await getState()
    expect(nextState.isWideScreen).toBe(true)
    expect(nextState.currentIndex).toBe(1)
    expect(nextState.postId).toBe('post-2')
    expect(nextState.title).toBe('列表新闻二')
    expect(nextState.cover).toBe('/static/shuijiao.jpg')

    const detailTitles = await page.$$('.detail-container .banner-title')
    expect(detailTitles.length).toBeGreaterThan(0)
    expect(await detailTitles[0].text()).toBe('列表新闻二')
  })
})
