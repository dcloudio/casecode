const PAGE_PATH = '/pages/template/issue-27552/issue-27552'

describe(PAGE_PATH, () => {
  let page
  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('view')
    await page.waitFor('1000')
  })
  it('snapshot', async () => {
    const image = await program.screenshot({
      fullPage: true
    })
    expect(image).toSaveImageSnapshot()
  })
})
