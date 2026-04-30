/**
 * @class AppCrashLogs 原生应用崩溃日志模型
 * @function clean 原生应用崩溃日志清理函数
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const Channel = require('./channel')
const {
	DateTime,
	UniCrypto
} = require('../lib')
module.exports = class AppCrashLogs extends BaseMod {
	constructor() {
		super()
		this.tableName = 'app-crash-logs'
	}

	/**
	 * 原生应用崩溃日志填充
	 * @param {Object} reportParams 上报参数
	 */
	async fill(reportParams) {
		const platform = new Platform()
		const channel = new Channel()
		const dateTime = new DateTime()
		const fillParams = []

		for (let params of reportParams) {
			fillParams.push({
				appid: params.ak,
				version: params.v || '',
				platform: platform.getPlatformCode(params.ut, params.p),
				channel: channel.getChannelCode(params),
				sdk_version: params.vb || '',
				device_id: params.did,
				device_net: params.net || '',
				device_os: params.os || '',
				device_os_name: params.on ? params.on : platform.getOsName(params.p),
				device_os_version: params.sv || '',
				device_vendor: params.brand || '',
				device_model: params.md || '',
				device_is_root: params.root ? parseInt(params.root) : 0,
				device_batt_level: params.batlevel ? parseInt(params.batlevel) : 0,
				device_batt_temp: params.battemp ? parseInt(params.battemp) : 0,
				device_memory_use_size: params.memuse ? parseInt(params.memuse) : 0,
				device_memory_total_size: params.memtotal ? parseInt(params.memtotal) : 0,
				device_disk_use_size: params.diskuse ? parseInt(params.diskuse) : 0,
				device_disk_total_size: params.disktotal ? parseInt(params.disktotal) : 0,
				device_abis: params.abis ? params.abis : '',
				app_count: params.appcount ? parseInt(params.appcount) : 0,
				app_use_memory_size: params.mem ? parseInt(params.mem) : 0,
				app_webview_count: params.wvcount ? parseInt(params.wvcount) : 0,
				app_use_duration: params.duration ? parseInt(params.duration) : 0,
				app_run_fore: params.fore ? parseInt(params.fore) : 0,
				package_name: params.pn || '',
				package_version: params.pv || '',
				page_url: params.url,
				error_msg: params.log || '',
				create_time: dateTime.getTime()
			})
		}

		if (fillParams.length === 0) {
			console.log('No app crash log params')
			return {
				code: 200,
				msg: 'Invild param'
			}
		}

		//日志数据入库
		const res = await this.insert(this.tableName, fillParams)
		if (res && res.inserted) {
			return {
				code: 0,
				msg: 'success'
			}
		} else {
			return {
				code: 500,
				msg: 'Filled error'
			}
		}
	}

	/**
	 * 原生应用崩溃日志清理函数
	 * @param {Number} days 保留天数, 0为永久保留
	 */
	async clean(days = 7) {
		if (days === 0) {
			return false;
		}
		days = Math.max(parseInt(days), 1)
		console.log('clean app crash logs - day:', days)
		const dateTime = new DateTime()
		const res = await this.delete(this.tableName, {
			create_time: {
				$lt: dateTime.getTimeBySetDays(0 - days)
			}
		})
		if (!res.code) {
			console.log('clean app crash log:', res)
		}
		return res
	}
}
