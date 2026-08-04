const {
  findUser
} = require('../../lib/utils/account')
const {
  ERROR
} = require('../../common/error')
const {
  userCollection
} = require('../../common/constants')
const PasswordUtils = require('../../lib/utils/password')

/**
 * 新增用户
 * @tutorial https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#add-user
 * @param {Object}  params
 * @param {String}  params.username       用户名
 * @param {String}  params.password       密码
 * @param {String}  params.nickname       昵称
 * @param {Array}   params.authorizedApp  允许登录的AppID列表
 * @param {Array}   params.role           用户角色列表
 * @param {String}  params.mobile         手机号
 * @param {String}  params.email          邮箱
 * @param {Array}   params.tags           用户标签
 * @param {Number}  params.status         用户状态
 * @returns
 */
module.exports = async function (params = {}) {
  const schema = {
    username: 'username',
    password: 'password',
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
    }
  }
  this.middleware.validate(params, schema)
  const {
    username,
    password,
    authorizedApp,
    nickname,
    role,
    mobile,
    email,
    tags,
    status
  } = params
  const {
    userMatched
  } = await findUser({
    userQuery: {
      username,
      mobile,
      email
    },
    authorizedApp
  })
  if (userMatched.length) {
    throw {
      errCode: ERROR.ACCOUNT_EXISTS
    }
  }
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
  const data = {
    username,
    password: passwordHash,
    password_secret_version: version,
    dcloud_appid: authorizedApp || [],
    nickname,
    role: role || [],
    mobile,
    email,
    tags: tags || [],
    status
  }
  if (email) {
    data.email_confirmed = 1
  }
  if (mobile) {
    data.mobile_confirmed = 1
  }

  // 触发 beforeRegister 钩子
  const beforeRegister = this.hooks.beforeRegister
  let userRecord = data
  if (beforeRegister) {
    userRecord = await beforeRegister({
      userRecord,
      clientInfo: this.getUniversalClientInfo()
    })
  }

  await userCollection.add(userRecord)
  return {
    errCode: 0,
    errMsg: ''
  }
}
