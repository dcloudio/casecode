export default {
	methods:{
		/**
		 * 获取所有父元素
		 * @param {Object} name
		 * @param {Object} parent
		 */
		getParentAll(name, parent) {
			parent = this.getParent(`uni${name}`, parent)
			if (parent) {
				this.rootMenu[name].push(parent)
				this.getParentAll(name, parent)
			}
		},
		/**
		 * 获取父元素实例
		 */
		getParent(name, parent, type) {
			parent = parent.$parent;
			let parentName = parent.$options.name;
			while (parentName !== name) {
				parent = parent.$parent;
				if (!parent) return false
				parentName = parent.$options.name;
			}
			return parent;
		}
	}
}