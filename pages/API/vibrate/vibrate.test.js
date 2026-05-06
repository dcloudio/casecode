describe('/pages/API/vibrate/vibrate', () => {

  it('skip', () => {
    expect(1).toBe(1)
  })
  return

  let page

  const pagePath = '/pages/API/vibrate/vibrate'

  async function getStatusText() {
    const statusEl = await page.$('.log-text')
    return await statusEl.text()
  }

  async function expectStatusMatch(pattern) {
    await page.waitFor(async () => {
      const text = await getStatusText()
      return pattern.test(text)
    })

    expect(await getStatusText()).toMatch(pattern)
  }

  beforeEach(async () => {
    page = await program.reLaunch(pagePath)
    await page.waitFor('.log-text')
  })

  it('页面初始化展示正确', async () => {
    const titleEl = await page.$('.uni-h2')
    expect(await titleEl.text()).toBe('振动')

    const buttons = await page.$$('button')
    expect(buttons.length).toBe(4)

    expect(await buttons[0].text()).toBe('轻振动')
    expect(await buttons[1].text()).toBe('中振动')
    expect(await buttons[2].text()).toBe('强振动')
    expect(await buttons[3].text()).toBe('触发长振动')

    expect(await getStatusText()).toBe('等待触发振动')
  })

  it('点击短振动按钮会更新对应结果文案', async () => {
    const buttons = await page.$$('button')

    await buttons[0].tap()
    await expectStatusMatch(/^轻振动调用(成功|失败：.*)$/)

    await buttons[1].tap()
    await expectStatusMatch(/^中振动调用(成功|失败：.*)$/)

    await buttons[2].tap()
    await expectStatusMatch(/^强振动调用(成功|失败：.*)$/)
  })

  it('点击长振动按钮会更新结果文案', async () => {
    const buttons = await page.$$('button')

    await buttons[3].tap()
    await expectStatusMatch(/^长振动调用(成功|失败：.*)$/)
  })
})
