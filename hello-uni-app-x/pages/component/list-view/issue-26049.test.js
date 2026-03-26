describe('issue-26049', () => {
  let page

  beforeAll(async () => {
    page = await program.reLaunch('/pages/component/list-view/issue-26049')
    await page.waitFor(600)
  })

  it('screenshot', async () => {
    const image = await program.screenshot({
      fullPage: true
    });
    expect(image).toSaveImageSnapshot();
  })
})
