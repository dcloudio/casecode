const {
  ERROR
} = require('../common/error')

function hasRole (...roleList) {
  const userRole = this.authInfo.role || []
  if (userRole.includes('admin')) {
    return
  }
  const isMatch = roleList.every(roleItem => {
    return userRole.includes(roleItem)
  })
  if (!isMatch) {
    throw {
      errCode: ERROR.PERMISSION_ERROR
    }
  }
}

function hasPermission (...permissionList) {
  const userRole = this.authInfo.role || []
  const userPermission = this.authInfo.permission || []
  if (userRole.includes('admin')) {
    return
  }
  const isMatch = permissionList.every(permissionItem => {
    return userPermission.includes(permissionItem)
  })
  if (!isMatch) {
    throw {
      errCode: ERROR.PERMISSION_ERROR
    }
  }
}

module.exports = {
  hasRole,
  hasPermission
}
