const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isMP = platformInfo.startsWith('mp')
describe('scroll-view-refresher-props', () => {
  if (isMP) {
    it('skip', () => {
      expect(1).toBe(1)
    })
    return
  }

  it('screenshot', async () => {
    const page = await program.reLaunch('/pages/component/scroll-view/scroll-view-refresher-props');
    await page.waitFor('view');
    await page.waitFor(1000);

    const image = await program.screenshot({fullPage: true});
    expect(image).toSaveImageSnapshot();
  });
});
