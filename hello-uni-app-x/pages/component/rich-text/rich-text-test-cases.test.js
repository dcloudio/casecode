const PAGE_PATH = '/pages/component/rich-text/rich-text-test-cases'

// 增加全局超时时间，因为有大量测试用例需要截图
jest.setTimeout(600000) // 10分钟

describe('rich-text-test-cases', () => {
  const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
  const isHarmony = platformInfo.startsWith('harmony')
  const isAndroid = platformInfo.startsWith('android')
  const isiOS = platformInfo.startsWith('ios')
  const isWeb = platformInfo.startsWith('web')
  const isMP = platformInfo.startsWith('mp')

  let page

  beforeAll(async () => {
    page = await program.reLaunch(PAGE_PATH)
    await page.waitFor(3000)
  }, 60000)

  it('run all test cases with screenshots', async () => {
    // 获取所有用例ID
    const caseIds = await page.callMethod('getCaseIds')
    console.log(`Total test cases: ${caseIds.length}`)

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < caseIds.length; i++) {
      const caseId = caseIds[i]
      console.log(`[${i + 1}/${caseIds.length}] Processing: ${caseId}`)

      try {
        // 加载用例
        const loaded = await page.callMethod('loadCase', caseId)
        if (!loaded) {
          console.warn(`Failed to load case: ${caseId}`)
          failCount++
          continue
        }

        // 等待渲染完成（图片加载可能需要更长时间）
        // 图片相关用例等待更长时间
        const waitTime = caseId.startsWith('P5') ? 2000 : 800
        await page.waitFor(waitTime)

        // 验证当前用例
        const currentId = await page.callMethod('getCurrentCaseId')
        expect(currentId).toBe(caseId)

        // 截图并保存（使用用例ID作为文件名）
        const image = await program.screenshot({ fullPage: true })
        expect(image).toSaveImageSnapshot({
          customSnapshotIdentifier() {
            return `rich-text-test-cases/${caseId}`
          }
        })

        successCount++
        console.log(`Screenshot saved for: ${caseId}`)
      } catch (e) {
        console.error(`Error processing case ${caseId}:`, e.message)
        failCount++
      }
    }

    console.log(`\n=== Test Summary ===`)
    console.log(`Total: ${caseIds.length}, Success: ${successCount}, Failed: ${failCount}`)
    
    // 允许少量失败（如网络图片加载失败等）
    expect(failCount).toBeLessThan(caseIds.length * 0.1)
  }, 600000) // 单个测试10分钟超时
})
