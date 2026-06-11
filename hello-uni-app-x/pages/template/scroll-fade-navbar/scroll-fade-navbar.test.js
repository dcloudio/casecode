const PAGE_PATH = '/pages/template/scroll-fade-navbar/scroll-fade-navbar'

function getAlpha(color) {
  if (!color || color === 'transparent') {
    return 0
  }
  const matched = color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/)
  if (matched) {
    return parseFloat(matched[1])
  }
  return 1
}

function getRgb(color) {
  const matched = color.match(/rgba?\(\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+)/)
  if (!matched) {
    return []
  }
  return [parseFloat(matched[1]), parseFloat(matched[2]), parseFloat(matched[3])]
}

async function expectNavbarState(navbar, title, expectedOpacity, options = {}){
  const shouldBeBlue = options.shouldBeBlue ?? false
  const navbarColor = await navbar.style('background-color')
  const navbarAlpha = getAlpha(navbarColor)
  const titleOpacity = parseFloat(await title.style('opacity'))

  expect(navbarAlpha).toBeCloseTo(expectedOpacity, 1)
  expect(titleOpacity).toBeCloseTo(expectedOpacity, 1)

  if (shouldBeBlue) {
    const navbarRgb = getRgb(navbarColor)
    expect(navbarRgb[0]).toBeCloseTo(0, 0)
    expect(navbarRgb[1]).toBeCloseTo(122, 0)
    expect(navbarRgb[2]).toBeCloseTo(255, 0)
  }

}

describe('scroll-fade-navbar', () => {
  let page

  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('view')
    await page.waitFor(800)
  })

  async function scrollTo(scrollTop) {
    const scrollView = await page.$('.list-container')
    if (scrollView != null && typeof scrollView.scrollTo == 'function') {
      await scrollView.scrollTo(0, scrollTop)
    }
    else {
      await program.pageScrollTo(scrollTop)
    }
    await page.waitFor(500)
  }

  // 抽取公共元素
  async function getElements() {
    const navbar = await page.$('.custom-navbar')
    const title = await page.$('.content-inner-text')
    return { navbar, title }
  }

  it('keeps navbar transparent and title hidden before scroll', async () => {
    const { navbar, title } = await getElements()
    await scrollTo(0)
    expect((await title.text()).trim()).toBe('标题')
    await expectNavbarState(navbar, title, 0)
  })

  it('fades navbar and title with scroll progress before threshold', async () => {
    const { navbar, title } = await getElements()
    await scrollTo(50)
    await expectNavbarState(navbar, title, 0.5, { shouldBeBlue: true })

    await scrollTo(99)
    await expectNavbarState(navbar, title, 0.99, { shouldBeBlue: true })
  })

  it('caps navbar and title opacity at full visibility after threshold', async () => {
    const { navbar, title } = await getElements()
    await scrollTo(100)
    await expectNavbarState(navbar, title, 1, { shouldBeBlue: true })

    await scrollTo(120)
    await expectNavbarState(navbar, title, 1, { shouldBeBlue: true })
  })

  it('restores transparent navbar after scrolling back to top', async () => {
    const { navbar, title } = await getElements()
    await scrollTo(120)
    await scrollTo(0)
    await expectNavbarState(navbar, title, 0)
  })
})
