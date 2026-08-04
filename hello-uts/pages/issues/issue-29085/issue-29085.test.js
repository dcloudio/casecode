
let page

beforeAll(async () => {
  page = await program.reLaunch('/pages/issues/issue-29085/issue-29085')
});


describe('issue-29085', () => {
  it('issue-29085', async () => {
    const testStatus29085 = await page.data('data.testStatus29085')
    expect(testStatus29085).toBe('测试通过')
  })
});
