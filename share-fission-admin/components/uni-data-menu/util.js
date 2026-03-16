function buildMenu(menu, menuList, menuIds) {
	let nextLayer = []
	for (let i = menu.length - 1; i > -1; i--) {
		const currentMenu = menu[i]
		const subMenu = menuList.filter(item => {
			if (item.parent_id === currentMenu.menu_id) {
				menuIds.push(item.menu_id)
				return true
			}
		})
		nextLayer = nextLayer.concat(subMenu)
		currentMenu.children = subMenu
	}
	if (nextLayer.length) {
		buildMenu(nextLayer, menuList, menuIds)
	}
}

function getParentIds(menuItem, menuList) {
	const parentArr = []
	let currentItem = menuItem
	while (currentItem && currentItem.parent_id) {
		parentArr.push(currentItem.parent_id)
		currentItem = menuList.find(item => item.menu_id === currentItem.parent_id)
	}
	return parentArr
}

function buildMenus(menuList, trim = true) {
	// 保证父子级顺序
	menuList = menuList.sort(function(a, b) {
		const parentIdsA = getParentIds(a, menuList)
		const parentIdsB = getParentIds(b, menuList)
		if (parentIdsA.includes(b.menu_id)) {
			return 1
		}
		return parentIdsA.length - parentIdsB.length || a.sort - b.sort
	})
	// 删除无subMenu且非子节点的菜单项
	if (trim) {
		for (let i = menuList.length - 1; i > -1; i--) {
			const currentMenu = menuList[i]
			const subMenu = menuList.filter(subMenuItem => subMenuItem.parent_id === currentMenu.menu_id)
			if (!currentMenu.isLeafNode && !subMenu.length) {
				menuList.splice(i, 1)
			}
		}
	}
	const menuIds = []
	const menu = menuList.filter(item => {
		if (!item.parent_id) {
			menuIds.push(item.menu_id)
			return true
		}
	})
	buildMenu(menu, menuList, menuIds)
	// 包含所有无效菜单
	if (!trim && menuIds.length !== menuList.length) {
		menu.push(...menuList.filter(item => !menuIds.includes(item.menu_id)))
	}
	return menu
}

export {
	buildMenu,
	buildMenus
}
