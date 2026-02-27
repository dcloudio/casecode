const {
	Service
} = require('uni-cloud-router')

const {
	buildMenu,
	buildMenus
} = require('../util')

function flatMenuIds(menus, ids = []) {
	ids.push(...menus.map(item => {
		if (item.children) {
			flatMenuIds(item.children, ids)
		}
		return item.menu_id
	}))
	return ids
}

function getChildMenuIds(menu, menus) {
	buildMenu([menu], menus, [])
	return flatMenuIds(menu.children)
}

const builtInMenus = {
	'system_menu': '菜单管理',
	'system_management': '系统管理'
}

module.exports = class MenuService extends Service {
	constructor(ctx) {
		super(ctx)
		this.collection = this.db.collection('opendb-admin-menus')
	}

	async list() {
		const {
			data: menuList
		} = await this.collection.orderBy('sort', 'asc').get()
		return buildMenus(menuList, false)
	}

	async add(menu) {
		await this._validate(menu, 'add')
		if (menu.enable !== false) {
			menu.enable = true
		}
		menu.create_date = Date.now()
		return this.collection.add(this.pick(menu, [
			'menu_id',
			'name',
			'icon',
			'url',
			'sort',
			'parent_id',
			'permission',
			'enable'
		]))
	}

	async update(menu) {
		await this._validate(menu, 'update')
		return this.collection.doc(menu._id).update(this.pick(menu, [
			'name',
			'icon',
			'url',
			'sort',
			'parent_id',
			'permission',
			'enable'
		]))
	}

	async delete(id) {
		if (!id) {
			this.throw('未指定要删除的菜单')
		}
		const menus = await this._getAll()
		const menu = menus.find(item => item._id === id)
		if (!menu) {
			this.throw('要删除的菜单不存在')
		}
		const builtInMenu = builtInMenus[menu.menu_id]
		if (builtInMenu) {
			this.throw('不能删除 ' + builtInMenu)
		}
		const ids = getChildMenuIds(menu, menus).filter(id => {
			return !builtInMenus[id] // 不能删除内置菜单
		})
		return this.collection.where({
			menu_id: this.db.command.in(ids.concat(menu.menu_id))
		}).remove()
	}

	async _getAll() {
		const {
			data
		} = await this.collection.orderBy('sort', 'asc').get()
		return data
	}

	async _validate(menu, type = 'add') {
		if (type === 'update') {
			if (!menu._id) {
				this.throw('未指定要修改的菜单')
			}
		}
		// 常规参数校验
		if (!menu.menu_id) {
			this.throw('菜单标识不能为空')
		}
		if (!menu.name) {
			this.throw('菜单名称不能为空')
		}
		// parent_id 校验
		if (menu.menu_id === menu.parent_id) {
			this.throw('不能选择自己作为父菜单')
		}
		const menus = await this._getAll()
		let dbMenu
		if (type === 'add') {
			dbMenu = menus.find(item => item.menu_id === menu.menu_id)
			if (dbMenu) { // menu_id 重复校验
				this.throw(`菜单标识 ${menu.menu_id} 不能重复`)
			}
		} else if (type === 'update') {
			dbMenu = menus.find(item => item._id === menu._id)
			if (!dbMenu) {
				this.throw(`菜单 ${menu.menu_id} 不存在`)
			}
		}
		if (menu.parent_id) {
			const parentMenu = menus.find(item => item.menu_id === menu.parent_id)
			if (!parentMenu) {
				this.throw(`父菜单 ${menu.parent_id} 不存在`)
			}
		}
		if (type === 'update') {
			// parent_id 不能是自己的子菜单
			const ids = getChildMenuIds(dbMenu, menus)
			if (ids.includes(menu.parent_id)) {
				this.throw(`不能将自己的子菜单设置为自己的父菜单`)
			}
		}
	}
}
