jest.setTimeout(60000);

const platformInfo = process.env.uniTestPlatformInfo.toLocaleLowerCase()
const isAndroid = platformInfo.startsWith('android')
const isHarmony = platformInfo.startsWith('harmony')
const isIOS = platformInfo.startsWith('ios')
const isMP = platformInfo.startsWith('mp')
const isWeb = platformInfo.startsWith('web')
const isDev = process.env.HX_Version.endsWith('-dev')
const isAppWebView = process.env.UNI_AUTOMATOR_APP_WEBVIEW == 'true'
const isDom2 = process.env.UNI_APP_X_DOM2 === "true"
const platformInfos = platformInfo.split(' ');
const version = parseInt(platformInfos[platformInfos.length - 1]);

describe('component-native-video', () => {
  if (isMP) {
    it('skip', () => {
      expect(1).toBe(1)
    })
    return
  }

  // TODO: web 端暂不支持测试 harmony 模拟器异常
  if (isWeb || isAppWebView || (isHarmony && platformInfo.includes('模拟器')) || (isAndroid && version == 5)) {
    it('web', async () => {
      expect(1).toBe(1)
    })
    return
  }
  let page;
  let start = 0;

  // 辅助函数：简化页面数据设置
  async function setPageData(newData) {
    return await page.setData({ data: newData });
  }

  beforeAll(async () => {
    page = await program.reLaunch('/pages/component/video/video');
    if (isWeb) {
      await setPageData({
        muted: true
      });
    }
    await page.$('.video');
  });

  it('screenshot', async () => {
    // 等待视频封面图加载完成
    await page.waitFor(2000);
    const image = await program.screenshot({ fullPage: true });
    expect(image).toSaveImageSnapshot();
  });

  it('test play pause', async () => {
    expect(await page.data('data.isError')).toBe(false);
    // play
    await page.callMethod('play');
    await page.waitFor(10000);
    expect(await page.data('data.isPlaying')).toBe(true);
    // pause
    await page.callMethod('pause');
    await page.waitFor(3000);
    expect(await page.data('data.isPause')).toBe(true);
  });

  if (!isMP) {
    it('test download source', async () => {
      await setPageData({
        autoTest: true,
        isError: false
      });
      const oldSrc = await page.data('data.src');
      await page.callMethod('downloadSource');
      await page.waitFor(5000);
      expect(await page.data('data.isError')).toBe(false);
      await setPageData({
        src: oldSrc
      });
      // 在性能差一些的 harmony 机器上，设置 src 后再次播放可能需要等待一段时间
      await page.waitFor(2000);
    });

    it('test video local mp4', async () => {
      await setPageData({
        autoTest: true,
        isError: false
      });
      const oldSrc = await page.data('data.src');
      await setPageData({
        src: '/static/test-video/10second-demo.mp4'
      });
      await page.waitFor(1000);
      expect(await page.data('data.isError')).toBe(false);
      await setPageData({
        src: oldSrc
      });
      // 在性能差一些的 harmony 机器上，设置 src 后再次播放可能需要等待一段时间
      await page.waitFor(2000);
    })
    // 鸿蒙不播放本地 m3u8
    if (!isHarmony) {
      it('test video local m3u8', async () => {
        await setPageData({
          autoTest: true,
          isError: false
        });
        const oldSrc = await page.data('data.src');
        await setPageData({
          src: '/static/test-video/2minute-demo.m3u8'
        });
        await page.waitFor(100);
        expect(await page.data('data.isError')).toBe(false);
        await setPageData({
          src: oldSrc
        });
      })
    }

    if (isAndroid) {
      it('android test assets path', async () => {
        const oldSrc = await page.data('data.src');
        await setPageData({
          isError: false,
          src: 'file:///android_asset/uni-autoTest/demo10s.mp4'
        });
        await page.waitFor(500);
        expect(await page.data('data.isError')).toBe(false);
        await setPageData({
          src: oldSrc
        });
      });
    }
  }
  it('test event play pause', async () => {
    await setPageData({
      isPause: false,
      isPlaying: false,
      autoTest: true,
    });
    await page.callMethod('play');
    start = Date.now();
    await page.waitFor(async () => {
      return (await page.data('data.isPlaying')) || (Date.now() - start > 3000);
    });
    start = Date.now();
    await page.waitFor(async () => {
      return (await page.data('data.eventPlay')) || (Date.now() - start > 500);
    });
    if (!isIOS) {
      expect(await page.data('data.eventPlay')).toEqual({
        tagName: 'VIDEO',
        type: 'play'
      });
    }
    await page.callMethod('pause');
    start = Date.now();
    await page.waitFor(async () => {
      return (await page.data('data.isPause')) || (Date.now() - start > 3000);
    });
    start = Date.now();
    await page.waitFor(async () => {
      return (await page.data('data.eventPause')) || (Date.now() - start > 1000);
    });
    if (!isIOS) {
      expect(await page.data('data.eventPause')).toEqual({
        tagName: 'VIDEO',
        type: 'pause'
      });
    }
    if (isAndroid || isIOS) {
      await page.callMethod('play');
    }
  });

  it('test video parent touch events', async () => {
    await setPageData({
      autoTest: true,
      eventParentTouchstart: null,
      eventParentTouchmove: null,
      eventParentTouchend: null
    });
    const videoRect = await page.callMethod('getVideoRect');
    expect(videoRect).not.toBeNull();
    let x = Math.ceil(videoRect.x + videoRect.width / 2);
    let y = Math.ceil(videoRect.y + videoRect.height / 2);
    if (isIOS || isHarmony) {
      const windowInfo = await page.callMethod('getWindowInfo');
      y += windowInfo.safeArea.top + 44;
    }
    await program.swipe({
      startPoint: { x, y },
      endPoint: { x: x + 10, y: y + 10 },
      duration: 200
    });
    await page.waitFor(500);
    expect(await page.data('data.eventParentTouchstart')).toEqual({
      tagName: 'VIEW',
      currentTargetTagName: 'VIEW',
      type: 'touchstart'
    });
    expect(await page.data('data.eventParentTouchmove')).toEqual({
      tagName: 'VIEW',
      currentTargetTagName: 'VIEW',
      type: 'touchmove'
    });
    expect(await page.data('data.eventParentTouchend')).toEqual({
      tagName: 'VIEW',
      currentTargetTagName: 'VIEW',
      type: 'touchend'
    });
  });


  if (isAndroid || isHarmony) {
    if (isAndroid) {
      it('test event waiting progress', async () => {
        await page.callMethod('seek', 10);
        start = Date.now();
        await page.waitFor(async () => {
          return ((await page.data('data.eventWaiting')) && (await page.data('eventProgress'))) || (Date.now() - start > 1000);
        });
        expect(await page.data('data.eventWaiting')).toEqual({
          tagName: 'VIDEO',
          type: 'waiting'
        });
        expect(await page.data('data.eventProgress')).toEqual({
          tagName: 'VIDEO',
          type: 'progress',
          isBufferedValid: true
        });
      });
    }

    it('test event fullscreenchange fullscreenclick controlstoggle', async () => {
      await page.callMethod('requestFullScreen');
      start = Date.now();
      await page.waitFor(async () => {
        return (await page.data('data.eventFullscreenchange')) || (Date.now() - start > 1000);
      });
      expect(await page.data('data.eventFullscreenchange')).toEqual({
        tagName: 'VIDEO',
        type: 'fullscreenchange',
        fullScreen: true,
        direction: 'horizontal'
      });
      if (isAndroid) {
        await program.adbCommand('settings put secure immersive_mode_confirmations confirmed');
        await page.waitFor(5000);
        await program.adbCommand('input tap 10 10');
        start = Date.now();
        await page.waitFor(async () => {
          return (await page.data('data.eventFullscreenclick')) || (Date.now() - start > 1000);
        });
        const res = await program.adbCommand('wm size');
        const width = res.data.split(' ').at(-1).split('x')[0];
        const height = res.data.split(' ').at(-1).split('x')[1];
        const res2 = await program.adbCommand('wm density');
        const scale = res2.data.split(' ').at(-1) / 160;
        expect(await page.data('data.eventFullscreenclick')).toEqual({
          tagName: 'VIDEO',
          type: 'fullscreenclick',
          screenX: parseInt(10 / scale),
          screenY: parseInt(10 / scale),
          screenWidth: parseInt(height / scale),
          screenHeight: parseInt(width / scale)
        });
        start = Date.now();
        await page.waitFor(async () => {
          return (await page.data('data.eventControlstoggle')) || (Date.now() - start > 1000);
        });
        expect(await page.data('data.eventControlstoggle')).toEqual({
          tagName: 'VIDEO',
          type: 'controlstoggle',
          show: true
        });
      }
      await page.callMethod('exitFullScreen');
      await page.waitFor(1000);
      await page.callMethod('requestVerticalFullScreen');
      await page.waitFor(1000);
      expect(await page.data('data.eventFullscreenchange')).toEqual({
        tagName: 'VIDEO',
        type: 'fullscreenchange',
        fullScreen: true,
        direction: 'vertical'
      });
      await page.callMethod('exitFullScreen');
    });

    it('test event ended timeupdate', async () => {
      await page.callMethod('seek', 120);
      if (isAndroid) {
        start = Date.now();
        await page.waitFor(async () => {
          return (await page.data('data.eventEnded')) || (Date.now() - start > 30000);
        });
        expect(await page.data('data.eventEnded')).toEqual({
          tagName: 'VIDEO',
          type: 'ended'
        });
      }
      await page.waitFor(3000);
      if (isAndroid || isHarmony) {
        let currentTime = 121
        if (isHarmony) currentTime = 120
        start = Date.now();
        await page.waitFor(async () => {
          return (await page.data('data.eventTimeupdate')) || (Date.now() - start > 500);
        });
        expect(await page.data('data.eventTimeupdate')).toEqual({
          tagName: 'VIDEO',
          type: 'timeupdate',
          currentTime,
          duration: 121
        });
      }
    });

    it('test event error', async () => {
      const oldSrc = await page.data('data.src');
      await setPageData({
        src: 'invalid url'
      });
      start = Date.now();
      await page.waitFor(async () => {
        return (await page.data('data.eventError')) || (Date.now() - start > 5000);
      });
      const eventError = await page.data('data.eventError')
      expect(eventError.tagName).toEqual('VIDEO')
      expect(eventError.type).toEqual('error')
      if (!isHarmony) {
        expect(eventError.errCode).toEqual(300001)
      } else {
        // 鸿蒙 video onError 没有错误信息，恒为 200001 内部错误
        expect(eventError.errCode).toEqual(200001)
      }
      await setPageData({
        autoTest: false,
        src: oldSrc
      });
    });

    if (isAndroid) {
      it('test sub component', async () => {
        await setPageData({
          subCompEnable: true,
          subCompShow: true
        });
        await page.waitFor(100);
        expect(await page.callMethod('hasSubComponent')).toBe(true);
        await page.callMethod('requestFullScreen');
        await page.waitFor(2000);
        const image = await program.screenshot({ deviceShot: true });
        expect(image).toSaveImageSnapshot();
        await page.callMethod('exitFullScreen');
        await page.waitFor(2000);
        await page.callMethod('requestVerticalFullScreen');
        await page.waitFor(2000);
        const image2 = await program.screenshot({ deviceShot: true });
        expect(image2).toSaveImageSnapshot();
        await page.callMethod('exitFullScreen');
        await setPageData({
          subCompEnable: false,
          subCompShow: false
        });
      });
    }

    it('test enable-danmu', async () => {
      await page.callMethod('play');
      await page.waitFor(5000);
      await setPageData({
        enableDanmu: false
      });
      const windowInfo = await program.callUniMethod('getWindowInfo');
      const image = await program.screenshot({
        deviceShot: true,
        area: {
          x: 0,
          y: windowInfo.statusBarHeight + 44
        }
      });
      expect(image).toSaveImageSnapshot();
    });
  }

  it('test dialog video', async () => {
    if (isAppWebView || isMP || isWeb) {
      expect(1).toBe(1)
      return
    }
    await page.callMethod('openDialogPageVideo')
    // TODO 先测试 closeThisPage 一次
    await program.tap({ x: 154, y: 577 }) // closeThisPage
    await page.callMethod('openDialogPageVideo')
    await program.tap({ x: 154, y: 492 }) // requestFullScreen
    await page.waitFor(2000);
    const image = await program.screenshot({ deviceShot: true });
    expect(image).toSaveImageSnapshot();
    await page.callMethod('closeDialogPageVideo')
  });

  it('test format', async () => {
    page = await program.navigateTo('/pages/component/video/video-format');
    await page.waitFor(1000);
    expect((await page.data('isError')).value).toBe(false);
  });
});
