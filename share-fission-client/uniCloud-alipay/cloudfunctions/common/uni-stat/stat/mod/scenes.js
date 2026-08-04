/**
 * @class Scenes 场景值模型
 */
const BaseMod = require('./base')
const Platform = require('./platform')
module.exports = class Scenes extends BaseMod {
	constructor() {
		super()
		this.tableName = 'mp-scenes'
		this.defualtCode = '1001'
	}

	/**
	 * 获取场景值
	 * @param {String} platform 平台代码
	 * @param {String} code 场景值代码
	 */
	async getScenes(platform, code) {
		const cacheKey = 'uni-stat-scenes-' + platform + '-' + code
		let scenesData = await this.getCache(cacheKey)
		if (!scenesData) {
			const scenesInfo = await this.getCollection(this.tableName).where({
				platform: platform,
				scene_code: code
			}).limit(1).get()
			scenesData = []
			if (scenesInfo.data.length > 0) {
				scenesData = scenesInfo.data[0]
				await this.setCache(cacheKey, scenesData)
			}
		}
		return scenesData
	}

	/**
	 * 通过平台编号获取场景值
	 * @param {String} platformId 平台编号
	 * @param {String} code 场景值代码
	 */
	async getScenesByPlatformId(platformId, code) {
		const platform = new Platform()
		let platformInfo = await this.getCollection(platform.tableName).where({
			_id: platformId
		}).limit(1).get()
		let scenesData
		if (platformInfo.data.length > 0) {
			platformInfo = platformInfo.data[0]
			scenesData = await this.getScenes(platformInfo.code, code)
		} else {
			scenesData = []
		}
		return scenesData
	}

	/**
	 * 获取场景值名称
	 * @param {String} platform 平台代码
	 * @param {String} code 场景值代码
	 */
	async getScenesName(platform, code) {
		const scenesData = await this.getScenes(platform, code)
		if (scenesData.length === 0) {
			return ''
		}
		return scenesData.scene_name
	}
	
	/**
	 * 通过平台编号获取场景值名称
	 * @param {String} platformId 平台编号
	 * @param {String} code 场景值代码
	 */
	async getScenesNameByPlatformId(platformId, code) {
		const scenesData = await this.getScenesByPlatformId(platformId, code)
		if (scenesData.length === 0) {
			return code === this.defualtCode ? '默认' : ''
		}
		return scenesData.scene_name
	}
}
