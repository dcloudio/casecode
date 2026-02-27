const {
	Controller
} = require('uni-cloud-router')
const uniID = require('uni-id')
module.exports = class UserController extends Controller {
	async login() {
		const {
			username,
			password,
			captchaText,
			captchaOptions
		} = this.ctx.data
		return this.service.user.login({
			username,
			password,
			captchaText,
			captchaOptions
		})
	}

	async register() {
		const {
			username,
			password
		} = this.ctx.data
		const admin = await this.service.user.hasAdmin()
		if (admin) {
			return {
				code: 10001,
				message: '超级管理员已存在，请登录...'
			}
		}
		return uniID.register({
			username,
			password,
			role: ["admin"]
		})
	}

	async logout() {
		return this.service.user.logout(this.ctx.event.uniIdToken)
	}

	async createCaptcha() {
		return await this.service.user.createCaptcha(this.ctx.data)
	}

	async getNeedCaptcha() {
		return await this.service.user.getNeedCaptcha(this.ctx.data)
	}
}
