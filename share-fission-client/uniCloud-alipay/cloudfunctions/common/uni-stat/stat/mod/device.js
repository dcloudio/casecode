/**
 * @class Device 设备模型
 */
const BaseMod = require('./base')
const Platform = require('./platform')
const {
	DateTime
} = require('../lib')
module.exports = class Device extends BaseMod {
	constructor() {
		super()
		this.tableName = 'opendb-device'
		this.tablePrefix = false
		this.cacheKeyPre = 'uni-stat-device-'
	}

	/**
	 * 通过设备编号获取设备信息
	 * @param {Object} deviceId 设备编号
	 */
	async getDeviceById(deviceId) {
		const cacheKey = this.cacheKeyPre + deviceId
		let deviceData = await this.getCache(cacheKey)
		if (!deviceData) {
			const deviceRes = await this.getCollection().where({
				device_id: deviceId
			}).get()
			deviceData = []
			if (deviceRes.data.length > 0) {
				deviceData = deviceRes.data[0]
				await this.setCache(cacheKey, deviceData)
			}
		}
		return deviceData
	}

	/**
	 * 设置设备信息
	 * @param {Object} params 上报参数
	 */
	async setDevice(params) {
		// 设备信息
		if (!params.did) {
			return {
				code: 200,
				msg: 'Parameter "did" not found'
			}
		}
		const deviceData = await this.getDeviceById(params.did)
		//不存在则添加
		if(deviceData.length === 0) {
			return await this.addDevice(params)
		} else {
			return await this.updateDevice(params, deviceData)
		}
	}

	/**
	 * 添加设备信息
	 * @param {Object} params 上报参数
	 */
	async addDevice(params) {
		const dateTime = new DateTime()
		const platform = new Platform()
		const fillParams = {
			device_id: params.did,
			appid: params.ak,
			vendor: params.brand ? params.brand : '',
			push_clientid: params.cid ? params.cid : '',
			imei: params.imei ? params.imei : '',
			oaid: params.oaid ? params.oaid : '',
			idfa: params.idfa ? params.idfa : '',
			imsi: params.imsi ? params.imsi : '',
			model: params.md ? params.md : '',
			uni_platform: params.up ? params.up : '',
			os_name: params.on ? params.on : platform.getOsName(params.p),
			os_version: params.sv ? params.sv : '',
			os_language: params.lang ? params.lang : '',
			os_theme: params.ot ? params.ot : '',
			pixel_ratio: params.pr ? params.pr : '',
			network_model: params.net ? params.net : '',
			window_width: params.ww ? params.ww : '',
			window_height: params.wh ? params.wh : '',
			screen_width: params.sw ? params.sw : '',
			screen_height: params.sh ? params.sh : '',
			rom_name: params.rn ? params.rn : '',
			rom_version: params.rv ? params.rv : '',
			location_ip: params.ip ? params.ip : '',
			location_latitude: params.lat ? parseFloat(params.lat) : 0,
			location_longitude: params.lng ? parseFloat(params.lng) : 0,
			location_country: params.cn ? params.cn : '',
			location_province: params.pn ? params.pn : '',
			location_city: params.ct ? params.ct : '',
			create_date: dateTime.getTime(),
			last_update_date: dateTime.getTime()
		}
		const res = await this.insert(this.tableName, fillParams)
		if (res && res.id) {
			return {
				code: 0,
				msg: 'success',
			}
		} else {
			return {
				code: 500,
				msg: 'Device data filled error'
			}
		}
	}
	
	/**
	 * 修改设备信息
	 * @param {Object} params
	 * @param {Object} deviceData
	 */
	async updateDevice(params, deviceData) {
		//最新的参数
		const dateTime = new DateTime()
		const platform = new Platform()
		console.log('device params', params)
		const newDeviceParams = {
			appid: params.ak,
			push_clientid: params.cid ? params.cid : '',
			imei: params.imei ? params.imei : '',
			oaid: params.oaid ? params.oaid : '',
			idfa: params.idfa ? params.idfa : '',
			imsi: params.imsi ? params.imsi : '',
			uni_platform: params.up ? params.up : '',
			os_name: params.on ? params.on : platform.getOsName(params.p),
			os_version: params.sv ? params.sv : '',
			os_language: params.lang ? params.lang : '',
			pixel_ratio: params.pr ? params.pr : '',
			network_model: params.net ? params.net : '',
			window_width: params.ww ? params.ww : '',
			window_height: params.wh ? params.wh : '',
			screen_width: params.sw ? params.sw : '',
			screen_height: params.sh ? params.sh : '',
			rom_name: params.rn ? params.rn : '',
			rom_version: params.rv ? params.rv : '',
			location_ip: params.ip ? params.ip : '',
			location_latitude: params.lat ? parseFloat(params.lat) : '',
			location_longitude: params.lng ? parseFloat(params.lng) : '',
			location_country: params.cn ? params.cn : '',
			location_province: params.pn ? params.pn : '',
			location_city: params.ct ? params.ct : '',
		}

		//检查是否有需要更新的数据
		const updateData = {}
		for(let key in newDeviceParams) {
			if(newDeviceParams[key] && newDeviceParams[key] !== deviceData[key]) {
				updateData[key] = newDeviceParams[key]
			}
		}
		
		if(Object.keys(updateData).length) {
			if(this.debug) {
				console.log('Device need to update', updateData)
			}
			//数据更新
			updateData.last_update_date = dateTime.getTime()
			await this.update(this.tableName, updateData, {device_id: params.did})
		} else {
			if(this.debug) {
				console.log('Device not need update', newDeviceParams)
			}
		}

		return {
			code: 0,
			msg: 'success'
		}
	}

	async bindPush(params) {
		if (!params.cid) {
			return {
				code: 200,
				msg: 'Parameter "cid" not found'
			}
		}
		return await this.setDevice(params)
	}
}
