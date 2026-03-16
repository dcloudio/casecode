const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isAndroid = platformInfo.startsWith('android')

let page 
if(isAndroid) {
  beforeAll(async () => {
    page = await program.reLaunch('/pages/issues/issue-26943/issue-26943')
  });
}

describe('issue-26943', () => {
  if(!isAndroid) {
    it('skip',() => {
      expect(1).toBe(1)
    })
    return
  }
  
  it('issue-26943', async () => {
    const {
      testStatus26943,
    } = await page.data()
    expect(testStatus26943).toBe('测试通过')
  })
});