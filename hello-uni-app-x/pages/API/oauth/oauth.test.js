const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isMP = platformInfo.startsWith('mp')
const isWeb = platformInfo.startsWith('web')

const PAGE_PATH = '/pages/API/oauth/oauth'

describe('API-OAuth', () => {
  if (isMP || isWeb) {
    it('not support', () => {
      expect(1).toBe(1)
    })
    return
  }
  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor('view');
  });

  it("OAuth-hw-login", async () => {
    await page.callMethod('setUserInfo', null)

    await page.callMethod('hwLogin')
    // TODO 请求后华为弹出认证窗时间不定，暂定为 10s
    await page.waitFor(10000)

    let userInfo = await page.callMethod('getTestUserInfo')
    // 如果未获取到用户信息，可能有授权弹框，点击允许授权
    if (!userInfo) {
      await program.tap({ x: 330, y: 775 })
      await page.waitFor(2000)
      userInfo = await page.callMethod('getTestUserInfo')
    }
    expect(userInfo).toBeTruthy()

    expect(typeof userInfo.nickName).toBe('string')
    expect(typeof userInfo.avatarUrl).toBe('string')

    const image = await program.screenshot();
    expect(image).toSaveImageSnapshot();

    await page.callMethod('setUserInfo', null)
  })
});
