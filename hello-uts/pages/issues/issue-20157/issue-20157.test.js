const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isHarmony = platformInfo.startsWith('harmony')

let page 
if(isHarmony) {
  beforeAll(async () => {
    page = await program.reLaunch('/pages/issues/issue-20157/issue-20157')
  });
}

describe('issue-20157', () => {
  if(!isHarmony) {
    it('skip',() => {
      expect(1).toBe(1)
    })
    return
  }
  
  it('issue-20157', async () => {
    const data = await page.data('data')
    expect(data.a).toBe('ab')
    expect(data.b).toBe(12)
  })
});