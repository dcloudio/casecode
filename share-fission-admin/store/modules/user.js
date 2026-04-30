import * as uniIdPagesStore from '@/uni_modules/uni-id-pages/common/store'
export default {
    namespaced: true,
    state: {},
    mutations: {},
    actions: {
		getUserInfo ({commit}) {
			const db = uniCloud.database()
			return db
				.collection('uni-id-users')
				.where('_id==$cloudEnv_uid')
				.field('username,nickname,mobile,email,role,permission')
				.get()
				.then(({result}) => {
					const [userInfo] = result.data

					uniIdPagesStore.mutations.setUserInfo(userInfo, true)

					return Promise.resolve(userInfo)
				})
		}
	}
}
