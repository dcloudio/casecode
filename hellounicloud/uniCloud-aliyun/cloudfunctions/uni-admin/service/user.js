const {
	Service
} = require('uni-cloud-router')
const uniID = require('uni-id')
const uniCaptcha = require('uni-captcha')
module.exports = class UserService extends Service {
	async login({
		username,
		password,
		captchaText,
		captchaOptions
	}) {
		let needCaptcha = await this.getNeedCaptcha(captchaOptions)
		if (needCaptcha) {
			if (!captchaText) {
				const captchaRes = await this.createCaptcha(captchaOptions)
				captchaRes.needCaptcha = needCaptcha;
				return captchaRes
			} else {
				const verifyRes = await uniCaptcha.verify({
					captcha: captchaText,
					...captchaOptions
				})
				// 验证失败
				if (verifyRes.code !== 0) {
					const newCaptcha = await this.createCaptcha(captchaOptions)
					verifyRes.captchaBase64 = newCaptcha.captchaBase64
					verifyRes.needCaptcha = needCaptcha;
					return verifyRes
				}
			}
		}

		const res = await uniID.login({
			username,
			password,
			needPermission: true
		})
		await this.loginLog(res, captchaOptions)
		if (res.code) {
			res.needCaptcha = true
			return res
		}
		res.needCaptcha = false
		await this.checkToken(res.token, {
			needPermission: true,
			needUserInfo: false
		})
		if (this.ctx.auth.role.includes('admin')) {
			return res
		}
		const navMenu = await this.service.menu.getMenu()
		if (navMenu.length) {
			return res
		}
		return {
			code: 10001,
			message: '该账户没有被赋予登录admin系统的权限, 请联系系统管理员绑定角色赋权'
		}
	}

	async logout(token) {
		return await uniID.logout(token)
	}

	async checkToken(token) {
		const auth = await uniID.checkToken(token, {
			needPermission: true,
			needUserInfo: false
		})
		if (auth.code) {
			// 校验失败，抛出错误信息
			this.ctx.throw('TOKEN_INVALID', `${auth.message}，${auth.code}`)
		}
		this.ctx.auth = auth // 设置当前请求的 auth 对象
	}

	async hasAdmin() {
		const {
			total
		} = await this.db.collection('uni-id-users').where({
			role: 'admin'
		}).count()

		return !!total
	}

	async getCurrentUserInfo(field = []) {
		return uniID.getUserInfo({
			uid: this.ctx.auth.uid,
			field
		})
	}

	// 登录记录
	async loginLog(res = {}, params, type = 'login') {
		const now = Date.now()
		const uniIdLogCollection = this.db.collection('uni-id-log')
		let logData = {
			deviceId: params.deviceId || this.ctx.DEVICEID,
			ip: params.ip || this.ctx.CLIENTIP,
			type,
			create_date: now
		};

		Object.assign(logData,
			res.code === 0 ? {
				user_id: res.uid,
				state: 1
			} : {
				state: 0
			})

		return uniIdLogCollection.add(logData)
	}

	async getNeedCaptcha(params) {
		const now = Date.now()
		// 查询是否在 {2小时} 内 {前2条} 有 {登录失败} 数据，来确定是否需要验证码
		const recordSize = 1;
		const recordDate = 120 * 60 * 1000;

		const uniIdLogCollection = this.db.collection('uni-id-log')
		let recentRecord = await uniIdLogCollection.where({
				deviceId: params.deviceId || this.ctx.DEVICEID,
				create_date: this.db.command.gt(now - recordDate),
				type: 'login'
			})
			.orderBy('create_date', 'desc')
			.limit(2)
			.get(recordSize);

		return !!recentRecord.data.filter(item => item.state === 0).length;
	}

	async createCaptcha(params) {
		const createRes = await uniCaptcha.create(params)
		createRes.needCaptcha = true
		return createRes
	}
}
