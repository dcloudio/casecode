import {
	validator,
	mpPlatform
} from '@/js_sdk/validator/opendb-app-list.js';

const formatFilePickerValue = (url) => (url ? {
	"name": "",
	"extname": "",
	"url": url,
} : {})

function getValidator(fields) {
	let result = {}
	for (let key in validator) {
		if (fields.includes(key)) {
			result[key] = validator[key]
		}
	}
	return result
}

const schemes = ["mimarket", "samsungapps", "appmarket", "oppomarket", "vivomarket"]
const schemeBrand = ["xiaomi", "samsung", "huawei", "oppo", "vivo"]

export default {
	data() {
		let formData = {
			"appid": "",
			"name": "",
			"app_type": 0,
			"icon_url": "",
			"introduction": "",
			"alias": "",
			"description": "",
			"screenshot": [],
			"store_list": [],
			"app_android": {},
			"app_ios": {},
			"app_harmony": {},
			"mp_weixin": {},
			"mp_alipay": {},
			"mp_baidu": {},
			"mp_toutiao": {},
			"mp_qq": {},
			"mp_lark": {},
			"mp_kuaishou": {},
			"mp_dingtalk": {},
			"mp_jd": {},
			"h5": {},
			"quickapp": {}
		}
		const data = {
			formData,
			rules: Object.freeze(getValidator(Object.keys(formData))),
			mpPlatform: Object.freeze(mpPlatform),
			screenshotList: [],
			middleware_img: {},
			middleware_checkbox: {},
			appPackageInfo: {},
			appPlatformKeys: Object.freeze(['app_ios', 'app_android', 'app_harmony']),
			appPlatformValues: Object.freeze({
				app_android: 'Android',
				app_ios: 'iOS',
				app_harmony: 'Harmony'
			}),
			keepItems: Object.freeze([]),
			isEdit: false,
			deletedStore: []
		}
		const mpKeys = Object.keys(mpPlatform);
		data.mpPlatformKeys = Object.freeze(mpKeys);
		[].concat(mpKeys, ['icon_url', 'quickapp']).forEach(key => data.middleware_img[key] = {});
		data.platFormKeys = Object.freeze([].concat(mpKeys, data.appPlatformKeys))
		data.platFormKeys.forEach(key => data.middleware_checkbox[key] = false)
		return data
	},
	methods: {
		requestCloudFunction(functionName, params = {}) {
			return this.$request(functionName, params, {
				functionName: 'uni-upgrade-center'
			})
		},
		hasValue(value) {
			if (typeof value !== 'object') return !!value
			if (value instanceof Array) return !!value.length
			return !!(value && Object.keys(value).length)
		},
		initFormData(obj) {
			if (!obj || !Object.keys(obj).length) return;
			// TODO delete
			for (let key in obj) {
				const value = obj[key]
				switch (key) {
					case 'icon_url':
						this.middleware_img[key] = formatFilePickerValue(value)
						break;
					case 'screenshot':
						this.screenshotList = value.map(item => formatFilePickerValue(item))
						break;
					default:
						if ((key.indexOf('mp') !== -1 || key.indexOf('app') !== -1) && this.hasValue(value)) {
							this.setPlatformChcekbox(key, true)
							if (value.qrcode_url)
								this.middleware_img[key] = formatFilePickerValue(value.qrcode_url)
						}
						break;
				}
				this.setFormData(key, value)
			}
		},
		setFormData(key, value) {
			const keys = key.indexOf('.') !== -1 ? key.split('.') : [key];
			const lens = keys.length - 1
			let tempObj = this.formData
			keys.forEach((key, index) => {
				const obj = tempObj[key]
				if (typeof obj === 'object' && index < lens) {
					tempObj = obj
				} else {
					tempObj[key] = value
				}
			})
		},
		getFormData(key) {
			const keys = key.indexOf('.') !== -1 ? key.split('.') : [key];
			const lens = keys.length - 1
			let tempObj = this.formData
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i]
				tempObj = tempObj[key]
				if (tempObj == null) {
					return false
				}
			}
			return tempObj
		},
		formatFormData() {
			this.setFormData('screenshot', this.screenshotList.map(item => item.fileID || item.url))

			for (let i = 0; i < this.formData.store_list.length; i++) {
				const item = this.formData.store_list[i]

				if (item.scheme.trim().length === 0) {
					this.formData.store_list.splice(i, 1)
					i--
					continue;
				}

				const index = schemes.indexOf((item.scheme.match(/(.*):\/\//) || [])[1])
				if (index !== -1) {
					if (item.id !== schemeBrand[index]) {
						this.deletedStore.push(item.id)
					}
					item.id = schemeBrand[index]
				}
				item.priority = parseFloat(item.priority)
			}

			this.keepItems = this.platFormKeys
				.filter(key =>
					this.getPlatformChcekbox(key) &&
					(this.formData[key].url || this.formData[key].abm_url || this.formData[key].qrcode_url)
				)
				.concat(['icon_url', 'screenshot', 'create_date', 'store_list', 'app_type'])

			if (this.formData.h5 && this.formData.h5.url)
				this.keepItems.push('h5');
		},
		// 根据 appid 自动填充
		autoFill() {
			const appid = this.getFormData('appid')
			if (!appid) {
				return
			}

			uni.showLoading({
				mask: true
			})

			this.requestCloudFunction('getAppInfo', {
					appid
				})
				.then(res => {
					if (res.success) {
						this.setFormData('description', res.description)
						this.setFormData('name', res.name)
						return
					}
				}).catch(e => {
					console.error(e)
				}).finally(() => {
					uni.hideLoading()
				})
		},
		autoFillApp() {
			const appid = this.getFormData('appid')
			if (!appid) {
				return
			}

			this.appPlatformKeys.forEach(key => {
				this.fetchAppInfo(appid, this.appPlatformValues[key]).then(res => {
					if (res && res.success) {
						this.setPlatformChcekbox(key, true)
						this.setFormData(key, {
							name: res.name,
							url: res.url
						})
						return;
					}
				})
			})
		},
		fetchAppInfo(appid, platform) {
			uni.showLoading({
				mask: true
			})
			return this.requestCloudFunction('getAppVersionInfo', {
				appid,
				platform
			}).then(res => {
				return res
			}).catch(e => {
				console.error(e)
			}).finally(() => {
				uni.hideLoading()
			})
		},
		iconUrlSuccess(res, key) {
			uni.showToast({
				icon: 'success',
				title: '上传成功',
				duration: 500
			})
			this.setFormData(key, res.tempFilePaths[0])
		},
		async iconUrlDelete(res, key) {
			let deleteRes = await this.requestCloudFunction('deleteFile', {
				fileList: [res.tempFile.fileID || res.tempFile.url]
			})
			uni.showToast({
				icon: 'success',
				title: '删除成功',
				duration: 800
			})
			if (!key) return;
			this.setFormData(key, '')
			this.$refs.form.clearValidate(key)
		},
		getPlatformChcekbox(mp_name) {
			return this.middleware_checkbox[mp_name]
		},
		setPlatformChcekbox(mp_name, value = false) {
			this.middleware_checkbox[mp_name] = value
		},
		selectFile() {
			if (this.hasPackage) {
				uni.showToast({
					icon: 'none',
					title: '只可上传一个文件，请删除已上传后重试',
					duration: 1000
				});
			}
		}
	},
	computed: {
		hasPackage() {
			return this.appPackageInfo && !!Object.keys(this.appPackageInfo).length
		},
	}
}
