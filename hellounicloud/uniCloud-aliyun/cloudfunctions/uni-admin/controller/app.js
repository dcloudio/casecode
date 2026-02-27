const {
	Controller
} = require('uni-cloud-router')
module.exports = class UserController extends Controller {
	async init() {
		const currentUserInfo = await this.service.user.getCurrentUserInfo(['_id', 'username'])
		return {
			userInfo: {
				...currentUserInfo.userInfo,
				token: undefined,
				password: undefined,
				role: this.ctx.auth.role,
				permission: this.ctx.auth.permission
			},
			navMenu: await this.service.menu.getMenu()
		}
	}
}
