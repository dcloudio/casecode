const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isAndroid = platformInfo.startsWith('android')

let page 

beforeAll(async () => {
  page = await program.reLaunch('/pages/issues/issue-26943/issue-26943')
});


describe('issue-26943', () => {
  it('issue-26943', async () => {
    const testStatus26943 = await page.data('data.testStatus26943')
    expect(testStatus26943).toBe('测试通过')
  })
});