const url = require('url')
const { userCollection, EXTERNAL_DIRECT_CONNECT_PROVIDER } = require('../../common/constants')
const { ERROR } = require('../../common/error')
const { findUser } = require('../../lib/utils/account')
const PasswordUtils = require('../../lib/utils/password')

/**
 * 使用 uid 或 externalUid 获取用户信息
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#external-update-userinfo
 * @param {object} params
 * @param {string} params.uid   uni-id体系的用户id
 * @param {string} params.externalUid   业务系统的用户id
 * @param {string} params.nickname  昵称
 * @param {string} params.gender  性别
 * @param {string} params.avatar  头像
 * @returns {object}
 */
module.exports = async function (params = {}) {
  const schema = {
    uid: {
      required: false,
      type: 'string'
    },
    externalUid: {
      required: false,
      type: 'string'
    },
    username: {
      required: false,
      type: 'string'
    },
    password: {
      required: false,
      type: 'password'
    },
    authorizedApp: {
      required: false,
      type: 'array<string>'
    }, // 指定允许登录的app，传空数组或不传时表示可以不可以在任何端登录
    nickname: {
      required: false,
      type: 'nickname'
    },
    role: {
      require: false,
      type: 'array<string>'
    },
    mobile: {
      required: false,
      type: 'mobile'
    },
    email: {
      required: false,
      type: 'email'
    },
    tags: {
      required: false,
      type: 'array<string>'
    },
    status: {
      required: false,
      type: 'number'
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
    uid,
    externalUid,
    username,
    password,
    authorizedApp,
    nickname,
    role,
    mobile,
    email,
    tags,
    status,
    avatar,
    gender
  } = params

  if (!uid && !externalUid) {
    throw {
      errCode: ERROR.PARAM_REQUIRED,
      errMsgValue: {
        param: 'uid or externalUid'
      }
    }
  }

  let query
  if (uid) {
    query = {
      _id: uid
    }
  } else {
    query = {
      identities: {
        provider: EXTERNAL_DIRECT_CONNECT_PROVIDER,
        uid: externalUid
      }
    }
  }

  const users = await userCollection.where(query).get()
  const user = users.data && users.data[0]
  if (!user) {
    throw {
      errCode: ERROR.ACCOUNT_NOT_EXISTS
    }
  }

  // 更新的用户数据字段
  const data = {
    username,
    dcloud_appid: authorizedApp,
    nickname,
    role,
    mobile,
    email,
    tags,
    status,
    avatar,
    gender
  }

  const realData = Object.keys(data).reduce((res, key) => {
    const item = data[key]
    if (item !== undefined) {
      res[key] = item
    }
    return res
  }, {})

  // 更新用户名时验证用户名是否重新
  if (username) {
    const {
      userMatched
    } = await findUser({
      userQuery: {
        username
      },
      authorizedApp
    })
    if (userMatched.filter(user => user._id !== uid).length) {
      throw {
        errCode: ERROR.ACCOUNT_EXISTS
      }
    }
  }
  if (password) {
    const passwordUtils = new PasswordUtils({
      clientInfo: this.getUniversalClientInfo(),
      passwordSecret: this.config.passwordSecret
    })
    const {
      passwordHash,
      version
    } = passwordUtils.generatePasswordHash({
      password
    })

    realData.password = passwordHash
    realData.password_secret_version = version
  }

  if (avatar) {
    // eslint-disable-next-line n/no-deprecated-api
    const avatarPath = url.parse(avatar).pathname
    const extName = avatarPath.indexOf('.') > -1 ? avatarPath.split('.').pop() : ''

    realData.avatar_file = {
      name: avatarPath,
      extname: extName,
      url: avatar
    }
  }

  if (user.identities.length) {
    const identity = user.identities.find(item => item.provider === EXTERNAL_DIRECT_CONNECT_PROVIDER)

    if (identity) {
      identity.userInfo = {
        avatar,
        gender,
        nickname
      }
    }

    realData.identities = user.identities
  }

  if (mobile) {
    realData.mobile_confirmed = 1
  }

  if (email) {
    realData.email_confirmed = 1
  }

  await userCollection.where(query).update(realData)

  return {
    errCode: 0
  }
}
