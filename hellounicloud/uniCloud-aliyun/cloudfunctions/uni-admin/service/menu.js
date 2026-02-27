const {
	Service
} = require('uni-cloud-router')

const {
	buildMenus
} = require('./util')

module.exports = class MenuService extends Service {

	constructor(ctx) {
		super(ctx)
		this.collection = this.db.collection('opendb-admin-menus')
	}

	async getMenu() {
		const permission = this.ctx.auth.permission
		let {
			data: menuList
		} = await this.collection.where({
			enable: true
		}).orderBy('sort', 'asc').limit(1000).get()

		// 标记叶子节点
		menuList.map(item => {
			if (!menuList.some(subMenuItem => subMenuItem.parent_id === item.menu_id)) {
				item.isLeafNode = true
			}
		})

		// 删除无权限访问的菜单
		if (!this.ctx.auth.role.includes('admin')) {
			menuList = menuList.filter(item => {
				if (item.isLeafNode) {
					if(item.permission && item.permission.length){
						return item.permission.some(item => permission.indexOf(item) > -1)
					}
					return false
				}
				return true
			})
		}
		return buildMenus(menuList)
	}
}
