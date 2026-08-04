const url = require('url')
const { preRegister, postRegister } = require('../../lib/utils/register')
const { EXTERNAL_DIRECT_CONNECT_PROVIDER } = require('../../common/constants')

/**
 * 外部注册用户
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#external-register
 * @param {object} params
 * @param {string} params.externalUid   业务系统的用户id
 * @param {string} params.nickname  昵称
 * @param {number} params.gender  性别
 * @param {string} params.avatar  头像
 * @returns {object}
 */
module.exports = async function (params = {}) {
  const schema = {
    externalUid: 'string',
    nickname: {
      required: false,
      type: 'nickname'
    },
    gender: {
      required: false,
      type: 'number'
    },
    avatar: {
      required: false,
      type: 'string'
    }
  }

  this.middleware.validate(params, schema)

  const {
    externalUid,
    avatar,
    gender,
    nickname
  } = params

  await preRegister.call(this, {
    user: {
      identities: {
        provider: EXTERNAL_DIRECT_CONNECT_PROVIDER,
        uid: externalUid
      }
    }
  })

  const extraData = {}

  if (avatar) {
    // eslint-disable-next-line n/no-deprecated-api
    const avatarPath = url.parse(avatar).pathname
    const extName = avatarPath.indexOf('.') > -1 ? avatarPath.split('.').pop() : ''

    extraData.avatar_file = {
      name: avatarPath,
      extname: extName,
      url: avatar
    }
  }

  const result = await postRegister.call(this, {
    user: {
      avatar,
      gender,
      nickname,
      identities: [
        {
          provider: EXTERNAL_DIRECT_CONNECT_PROVIDER,
          userInfo: {
            avatar,
            gender,
            nickname
          },
          uid: externalUid
        }
      ]
    },
    extraData
  })

  return {
    errCode: result.errCode,
    newToken: result.newToken,
    externalUid,
    avatar,
    gender,
    nickname,
    uid: result.uid
  }
}
