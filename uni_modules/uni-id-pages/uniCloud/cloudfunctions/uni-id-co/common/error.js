const ERROR = {
  ACCOUNT_EXISTS: 'uni-id-account-exists',
  ACCOUNT_NOT_EXISTS: 'uni-id-account-not-exists',
  ACCOUNT_NOT_EXISTS_IN_CURRENT_APP: 'uni-id-account-not-exists-in-current-app',
  ACCOUNT_CONFLICT: 'uni-id-account-conflict',
  ACCOUNT_BANNED: 'uni-id-account-banned',
  ACCOUNT_AUDITING: 'uni-id-account-auditing',
  ACCOUNT_AUDIT_FAILED: 'uni-id-account-audit-failed',
  ACCOUNT_CLOSED: 'uni-id-account-closed',
  CAPTCHA_REQUIRED: 'uni-id-captcha-required',
  PASSWORD_ERROR: 'uni-id-password-error',
  PASSWORD_ERROR_EXCEED_LIMIT: 'uni-id-password-error-exceed-limit',
  INVALID_USERNAME: 'uni-id-invalid-username',
  INVALID_PASSWORD: 'uni-id-invalid-password',
  INVALID_PASSWORD_SUPER: 'uni-id-invalid-password-super',
  INVALID_PASSWORD_STRONG: 'uni-id-invalid-password-strong',
  INVALID_PASSWORD_MEDIUM: 'uni-id-invalid-password-medium',
  INVALID_PASSWORD_WEAK: 'uni-id-invalid-password-weak',
  INVALID_MOBILE: 'uni-id-invalid-mobile',
  INVALID_EMAIL: 'uni-id-invalid-email',
  INVALID_NICKNAME: 'uni-id-invalid-nickname',
  INVALID_PARAM: 'uni-id-invalid-param',
  PARAM_REQUIRED: 'uni-id-param-required',
  GET_THIRD_PARTY_ACCOUNT_FAILED: 'uni-id-get-third-party-account-failed',
  GET_THIRD_PARTY_USER_INFO_FAILED: 'uni-id-get-third-party-user-info-failed',
  MOBILE_VERIFY_CODE_ERROR: 'uni-id-mobile-verify-code-error',
  EMAIL_VERIFY_CODE_ERROR: 'uni-id-email-verify-code-error',
  ADMIN_EXISTS: 'uni-id-admin-exists',
  PERMISSION_ERROR: 'uni-id-permission-error',
  SYSTEM_ERROR: 'uni-id-system-error',
  SET_INVITE_CODE_FAILED: 'uni-id-set-invite-code-failed',
  INVALID_INVITE_CODE: 'uni-id-invalid-invite-code',
  CHANGE_INVITER_FORBIDDEN: 'uni-id-change-inviter-forbidden',
  BIND_CONFLICT: 'uni-id-bind-conflict',
  UNBIND_FAIL: 'uni-id-unbind-failed',
  UNBIND_NOT_SUPPORTED: 'uni-id-unbind-not-supported',
  UNBIND_UNIQUE_LOGIN: 'uni-id-unbind-unique-login',
  UNBIND_PASSWORD_NOT_EXISTS: 'uni-id-unbind-password-not-exists',
  UNBIND_MOBILE_NOT_EXISTS: 'uni-id-unbind-mobile-not-exists',
  UNSUPPORTED_REQUEST: 'uni-id-unsupported-request',
  ILLEGAL_REQUEST: 'uni-id-illegal-request',
  CONFIG_FIELD_REQUIRED: 'uni-id-config-field-required',
  CONFIG_FIELD_INVALID: 'uni-id-config-field-invalid',
  FRV_FAIL: 'uni-id-frv-fail',
  FRV_PROCESSING: 'uni-id-frv-processing',
  REAL_NAME_VERIFIED: 'uni-id-realname-verified',
  ID_CARD_EXISTS: 'uni-id-idcard-exists',
  INVALID_ID_CARD: 'uni-id-invalid-idcard',
  INVALID_REAL_NAME: 'uni-id-invalid-realname',
  UNKNOWN_ERROR: 'uni-id-unknown-error',
  REAL_NAME_VERIFY_UPPER_LIMIT: 'uni-id-realname-verify-upper-limit'
}

function isUniIdError (errCode) {
  return Object.values(ERROR).includes(errCode)
}

class UniCloudError extends Error {
  constructor (options) {
    super(options.message)
    this.errMsg = options.message || ''
    this.errCode = options.code
  }
}

module.exports = {
  ERROR,
  isUniIdError,
  UniCloudError
}
