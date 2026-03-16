import {
	validator,
	enumConverter
} from '@/js_sdk/validator/opendb-app-versions.js';

export const platform_iOS = 'iOS';
export const platform_Android = 'Android';
export const platform_Harmony = 'Harmony'
const db = uniCloud.database();

function getValidator(fields) {
	let reuslt = {}
	for (let key in validator) {
		if (fields.includes(key)) {
			reuslt[key] = validator[key]
		}
	}
	return reuslt
}

export const fields =
	'appid,name,title,contents,platform,type,version,min_uni_version,url,stable_publish,is_silently,is_mandatory,create_date,store_list'

export default {
	data() {
		return {
			labelWidth: '100px',
			enableiOSWgt: true, // 是否开启iOS的wgt更新
			silentlyContent: '静默更新：App升级时会在后台下载wgt包并自行安装。新功能在下次启动App时生效',
			mandatoryContent: '强制更新：App升级弹出框不可取消',
			stablePublishContent: '同时只可有一个线上发行版，线上发行不可更设为下线。\n未上线可以设为上线发行并自动替换当前线上发行版',
			stablePublishContent2: '使用本包替换当前线上发行版',
			uploadFileContent: '可下载安装包地址。上传文件到云存储自动填写，也可以手动填写',
			minUniVersionContent: '上次使用新Api或打包新模块的App版本',
			priorityContent: '检查更新时，按照优先级从大到小依次尝试跳转商店。如果都跳转失败，则会打开浏览器使用下载链接下载apk安装包',
			latestStableData: [], // 库中最新已上线版
			appFileList: null, // 上传包
			type_valuetotext: enumConverter.type_valuetotext,
			preUrl: '',
			formData: {
				"appid": "",
				"name": "",
				"title": "",
				"contents": "",
				"platform": [],
				"store_list": [],
				"type": "",
				"version": "",
				"min_uni_version": "",
				"url": "",
				"stable_publish": false,
				"create_date": null
			},
			formOptions: {
				"platform_localdata": [
					{
						"value": "Android",
						"text": "安卓"
					},
					{
						"value": "iOS",
						"text": "苹果"
					},
					{
						"value": "Harmony",
						"text": "鸿蒙 Next"
					}
				],
				"type_localdata": [
					{
						"value": "native_app",
						"text": "原生App安装包"
					},
					{
						"value": "wgt",
						"text": "App资源包"
					}
				]
			},
			rules: {
				...getValidator([
					"appid", "contents", "platform", "type",
					"version", "min_uni_version", "url", "stable_publish",
					"title", "name", "is_silently", "is_mandatory", "store_list"
				])
			}
		}
	},
	onReady() {
		this.$refs.form.setRules(this.rules)
	},
	computed: {
		isWGT() {
			return this.formData.type === 'wgt'
		},
		isNativeApp() {
			return this.formData.type === 'native_app'
		},
		isiOS() {
			return this.formData.platform.includes(platform_iOS);
		},
		isAndroid() {
			return this.formData.platform.includes(platform_Android)
		},
		isHarmony() {
			return this.formData.platform.includes(platform_Harmony)
		},
		hasPackage() {
			return this.appFileList && !!Object.keys(this.appFileList).length
		},
		fileExtname() {
			return this.isWGT ? ['wgt'] : ['apk']
		},
		platformLocaldata() {
			return !this.isWGT ? this.formOptions.platform_localdata : this.enableiOSWgt ? this.formOptions
				.platform_localdata : [this.formOptions.platform_localdata[0], this.formOptions.platform_localdata[2]]
		},
		uni_platform() {
			if (this.isiOS) return platform_iOS.toLocaleLowerCase()
			else if (this.isAndroid) return platform_Android.toLocaleLowerCase()
			return platform_Harmony.toLocaleLowerCase()
		},
		enableUploadPackage() {
			return this.isWGT || !(this.isiOS || this.isHarmony)
		},
		urlLabel() {
			if (this.isWGT || this.isAndroid) return '下载链接'
			if (this.isiOS) return 'AppStore'
			else if (this.isHarmony) return '应用商店'
		},
		isApk() {
			const apkIndex = this.formData.url.indexOf('apk')
			return this.formData.url && (apkIndex > -1 && apkIndex === this.formData.url.length - 3)
		}
	},
	methods: {
		getStoreList(appid) {
			return db.collection('opendb-app-list')
				.where({
					appid
				})
				.get()
				.then(res => {
					const data = res.result.data[0]
					return data ? data.store_list || [] : []
				})
		},
		packageUploadSuccess(res) {
			uni.showToast({
				icon: 'success',
				title: '上传成功',
				duration: 800
			})
			this.preUrl = this.formData.url
			this.formData.url = res.tempFilePaths[0]
		},
		deleteFile(fileList) {
			return this.$request('deleteFile', {
				fileList
			}, {
				functionName: 'uni-upgrade-center'
			})
		},
		async packageDelete(res) {
			if (!this.hasPackage) return;
			await this.deleteFile([res.tempFilePath])
			uni.showToast({
				icon: 'success',
				title: '删除成功',
				duration: 800
			})
			this.formData.url = this.preUrl
			this.$refs.form.clearValidate('url')
		},
		selectFile() {
			if (this.hasPackage) {
				uni.showToast({
					icon: 'none',
					title: '只可上传一个文件，请删除已上传后重试',
					duration: 1000
				});
			}
		},
		createCenterRecord(value) {
			return {
				...value,
				uni_platform: this.uni_platform,
				create_env: 'upgrade-center'
			}
		},
		createCenterQuery({
			appid
		}) {
			return {
				appid,
				create_env: 'upgrade-center'
			}
		},
		createStatQuery({
			appid,
			type,
			version,
			uni_platform
		}) {
			return {
				appid,
				type,
				version,
				uni_platform: uni_platform ? uni_platform : this.uni_platform,
				create_env: 'uni-stat',
				stable_publish: false
			}
		},
		async toUrl(url){
			if (/^cloud:\/\//.test(url)) {
				const tcbRes = await uniCloud.getTempFileURL({ fileList: [url] });
				if (typeof tcbRes.fileList[0].tempFileURL !== 'undefined') url = tcbRes.fileList[0].tempFileURL;
			}
			// #ifdef H5
			window.open(url);
			// #endif
			// #ifndef H5
			uni.showToast({
				title: '请在浏览器中打开',
				icon: 'none'
			});
			// #endif
		},
		getCloudStorageConfig(){
			return uni.getStorageSync('uni-admin-cloud-storage-config') || {};
		},
		setCloudStorageConfig(data={}){
			uni.setStorageSync('uni-admin-cloud-storage-config', data);
		},
		// 临时方法，后面会优化
		setCloudStorage(data){
			// uniCloud.setCloudStorage 不是标准的API，临时挂载在uniCloud对象上的，后面会优化
			if (typeof uniCloud.setCloudStorage === "function") {
				uniCloud.setCloudStorage(data);
			}
		}
	}
}
