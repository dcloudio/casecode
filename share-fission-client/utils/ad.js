// ad.js
const ADType = {
  RewardedVideo: "RewardedVideo",
  FullScreenVideo: "FullScreenVideo"
}

class AdHelper {

  constructor() {
    this._ads = {}
  }

  load(options, onload, onerror) {
    let ops = this._fixOldOptions(options)
    let {
      adpid
    } = ops

    if (!adpid || this.isBusy(adpid)) {
      return
    }

    this.get(ops).load(onload, onerror)
  }

  show(options, onsuccess, onfail) {
    let ops = this._fixOldOptions(options)
    let {
      adpid
    } = ops

    if (!adpid) {
      return
    }

    uni.showLoading({
      mask: true
    })

    var ad = this.get(ops)

    ad.load(() => {
      uni.hideLoading()
      ad.show((e) => {
        onsuccess && onsuccess(e)
      })
    }, (err) => {
      uni.hideLoading()
      onfail && onfail(err)
    })
  }

  isBusy(adpid) {
    return (this._ads[adpid] && this._ads[adpid].isLoading)
  }

  get(options) {
    const {
      adpid,
      singleton = true
    } = options
    if (singleton === false) {
      if (this._ads[adpid]) {
        this._ads[adpid].destroy()
        delete this._ads[adpid]
      }
    }
    delete options.singleton
    if (!this._ads[adpid]) {
      this._ads[adpid] = this._createAdInstance(options)
    }

    return this._ads[adpid]
  }

  _createAdInstance(options) {
    const adType = options.adType || ADType.RewardedVideo
    delete options.adType

    let ad = null;
    if (adType === ADType.RewardedVideo) {
      ad = new RewardedVideo(options)
    } else if (adType === ADType.FullScreenVideo) {
      ad = new FullScreenVideo(options)
    }

    return ad
  }

  _fixOldOptions(options) {
    return (typeof options === "string") ? {
      adpid: options
    } : options
  }
}

const EXPIRED_TIME = 1000 * 60 * 30
const ProviderType = {
  CSJ: 'csj',
  GDT: 'gdt'
}

const RETRY_COUNT = 1

class AdBase {
  constructor(adInstance, options = {}) {
    this._isLoad = false
    this._isLoading = false
    this._lastLoadTime = 0
    this._lastError = null
    this._retryCount = 0

    this._loadCallback = null
    this._closeCallback = null
    this._errorCallback = null

    const ad = this._ad = adInstance
    ad.onLoad((e) => {
      this._isLoading = false
      this._isLoad = true
      this._lastLoadTime = Date.now()

      this.onLoad()
    })
    ad.onClose((e) => {
      this._isLoad = false
      this.onClose(e)
    })
    ad.onVerify && ad.onVerify((e) => {
      // e.isValid
    })
    ad.onError(({
      code,
      message
    }) => {
      this._isLoading = false
      const data = {
        code: code,
        errMsg: message
      }

      if (code === -5008) {
        this._loadAd()
        return
      }

      if (this._retryCount < RETRY_COUNT) {
        this._retryCount += 1
        this._loadAd()
        return
      }

      this._lastError = data
      this.onError(data)
    })
  }

  get isExpired() {
    return (this._lastLoadTime !== 0 && (Math.abs(Date.now() - this._lastLoadTime) > EXPIRED_TIME))
  }

  get isLoading() {
    return this._isLoading
  }

  getProvider() {
    return this._ad.getProvider()
  }

  load(onload, onerror) {
    this._loadCallback = onload
    this._errorCallback = onerror

    if (this._isLoading) {
      return
    }

    if (this._isLoad) {
      this.onLoad()
      return
    }

    this._retryCount = 0

    this._loadAd()
  }

  show(onclose) {
    this._closeCallback = onclose

    if (this._isLoading || !this._isLoad) {
      return
    }

    if (this._lastError !== null) {
      this.onError(this._lastError)
      return
    }

    const provider = this.getProvider()
    if (provider === ProviderType.CSJ && this.isExpired) {
      this._loadAd()
      return
    }

    this._ad.show()
  }

  onLoad(e) {
    if (this._loadCallback != null) {
      this._loadCallback()
    }
  }

  onClose(e) {
    if (this._closeCallback != null) {
      this._closeCallback({
        isEnded: e.isEnded
      })
    }
  }

  onError(e) {
    if (this._errorCallback != null) {
      this._errorCallback(e)
    }
  }

  destroy() {
    this._ad.destroy()
  }

  _loadAd() {
    this._isLoad = false
    this._isLoading = true
    this._lastError = null
    this._ad.load()
  }
}

class RewardedVideo extends AdBase {
  constructor(options = {}) {
    super(plus.ad.createRewardedVideoAd(options), options)
  }
}

class FullScreenVideo extends AdBase {
  constructor(options = {}) {
    super(plus.ad.createFullScreenVideoAd(options), options)
  }
}

/**
 * 通用广告辅助方法
 * @param {Object} options 配置选项
 * @param {Number} options.adpid 广告位ID（可选，默认从配置文件读取）
 * @param {String} options.adType 广告类型（RewardedVideo/FullScreenVideo）
 * @param {Object} options.urlCallback 服务端回调参数（可选）
 * @param {Function} options.onSuccess 广告播放完成的回调
 * @param {Function} options.onCancel 用户中途退出的回调（可选）
 * @param {Function} options.onError 广告加载/播放错误的回调（可选）
 * @param {String} options.cancelMessage 中途退出的提示文字（可选）
 */
const showRewardedAd = (options) => {
  // 从全局配置读取默认广告位ID
  const appConfig = getApp().globalData.config
  const defaultAdpid = appConfig?.ad?.rewardedVideo

  const {
    adpid = defaultAdpid,
    adType = "RewardedVideo",
    urlCallback = null,
    onSuccess,
    onCancel,
    onError,
    cancelMessage = '请完整观看广告'
  } = options

  const adOptions = {
    adpid,
    adType
  }

  if (urlCallback) {
    adOptions.urlCallback = urlCallback
  }

  const adHelper = new AdHelper()
  adHelper.show(adOptions, (res) => {
    // 用户点击了【关闭广告】按钮
    if (res?.isEnded) {
      // 正常播放结束
      console.log("广告播放完成");
      onSuccess && onSuccess(res)
    } else {
      // 播放中途退出
      console.log("广告播放中途退出");
      if (onCancel) {
        onCancel(res)
      } else {
        uni.showToast({
          title: cancelMessage,
          icon: 'none',
          duration: 3000
        })
      }
    }
  }, (err) => {
    // 广告加载或播放错误
    console.log("广告错误：", err);
    if (onError) {
      onError(err)
    } else {
      uni.showToast({
        title: err.errMsg || '广告加载失败',
        icon: 'none',
        duration: 3000
      })
    }
  })
}

const adHelper = new AdHelper()
adHelper.showRewardedAd = showRewardedAd

export default adHelper