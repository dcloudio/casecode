const {
  userCollection
} = require('../../common/constants')
const {
  coverMobile
} = require('../../common/utils')

/**
 * 获取受邀用户
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-invited-user
 * @param {Object} params
 * @param {Number} params.level       获取受邀用户的级数，1表示直接邀请的用户
 * @param {Number} params.limit       返回数据大小
 * @param {Number} params.offset      返回数据偏移
 * @param {Boolean} params.needTotal  是否需要返回总数
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    level: 'number',
    limit: {
      required: false,
      type: 'number'
    },
    offset: {
      required: false,
      type: 'number'
    },
    needTotal: {
      required: false,
      type: 'boolean'
    }
  }
  this.middleware.validate(params, schema)
  const {
    level,
    limit = 20,
    offset = 0,
    needTotal = false
  } = params
  const uid = this.authInfo.uid
  const query = {
    [`inviter_uid.${level - 1}`]: uid
  }
  const getUserRes = await userCollection.where(query)
    .field({
      _id: true,
      avatar: true,
      avatar_file: true,
      username: true,
      nickname: true,
      mobile: true,
      invite_time: true
    })
    .orderBy('invite_time', 'desc')
    .skip(offset)
    .limit(limit)
    .get()

  const invitedUser = getUserRes.data.map(item => {
    return {
      uid: item._id,
      username: item.username,
      nickname: item.nickname,
      mobile: coverMobile(item.mobile),
      inviteTime: item.invite_time,
      avatar: item.avatar,
      avatarFile: item.avatar_file
    }
  })
  const result = {
    errCode: 0,
    invitedUser
  }
  if (needTotal) {
    const getTotalRes = await userCollection.where(query).count()
    result.total = getTotalRes.total
  }
  return result
}
