const {
  setUserStatus
} = require('../../lib/utils/update-user-info')
const {
  USER_STATUS
} = require('../../common/constants')

/**
 * 注销账户
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#close-account
 * @returns
 */
module.exports = async function () {
  const { uid } = this.authInfo
  return setUserStatus(uid, USER_STATUS.CLOSED)
}
