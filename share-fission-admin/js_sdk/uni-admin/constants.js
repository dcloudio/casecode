const uniAdminPrefix = 'UNI_ADMIN'

export const MENU = `${uniAdminPrefix}_MENU`

/** uni-id 云端错误码 */
export const UNI_ID_ERR_CODE = {
	/** 登陆状态失效，token已过期 */
	TOKEN_EXPIRED: 'UNI-ID-TOKEN-EXPIRED',
	/** token校验未通过 */
	CHECK_TOKEN_FAILED: 'uni-id-check-token-failed',
	/** 账户已存在 */
	ACCOUNT_EXISTS: 'uni-id-account-exists',
	/** 账户不存在 */
	ACCOUNT_NOT_EXISTS: 'uni-id-account-not-exists',
	/** 用户账号冲突,可能会由开发者手动更新数据库导致,正常情况下不应 */
	ACCOUNT_CONFLICT: 'uni-id-account-conflict',
	/** 此账号已封禁 */
	ACCOUNT_BANNED: 'uni-id-account-banned',
	/** 此账号正在审核中 */
	ACCOUNT_AUDITING: 'uni-id-account-auditing',
	/** 此账号审核失败 */
	ACCOUNT_AUDIT_FAILED: 'uni-id-account-audit-failed',
	/** 此账号已注销 */
	ACCOUNT_CLOSED: 'uni-id-account-closed',
	/** 请输入图形验证码 */
	CAPTCHA_REQUIRED: 'uni-id-captcha-required',
	/** 用户名或密码错误 */
	PASSWORD_ERROR: 'uni-id-password-error',
	/** 用户名不合法 */
	INVALID_USERNAME: 'uni-id-invalid-username',
	/** 密码不合法 */
	INVALID_PASSWORD: 'uni-id-invalid-password',
	/** 手机号码不合法 */
	INVALID_MOBILE: 'uni-id-invalid-mobile',
	/** 邮箱不合法 */
	INVALID_EMAIL: 'uni-id-invalid-email',
	/** 昵称不合法 */
	INVALID_NICKNAME: 'uni-id-invalid-nickname',
	/** 参数错误 */
	INVALID_PARAM: 'uni-id-invalid-param',
	/** 缺少参数 */
	PARAM_REQUIRED: 'uni-id-param-required',
	/** 获取第三方账号失败 */
	GET_THIRD_PARTY_ACCOUNT_FAILED: 'uni-id-get-third-party-account-failed',
	/** 获取第三方用户信息失败 */
	GET_THIRD_PARTY_USER_INFO_FAILED: 'uni-id-get-third-party-user-info-failed',
	/** 手机验证码错误或已过期 */
	MOBILE_VERIFY_CODE_ERROR: 'uni-id-mobile-verify-code-error',
	/** 邮箱验证码错误或已过期 */
	EMAIL_VERIFY_CODE_ERROR: 'uni-id-email-verify-code-error',
	/** 超级管理员已存在 */
	ADMIN_EXISTS: 'uni-id-admin-exists',
	/** 权限错误 */
	PERMISSION_ERROR: 'uni-id-permission-error',
	/** 系统错误 */
	SYSTEM_ERROR: 'uni-id-system-error',
	/** 设置邀请码失败 */
	SET_INVITE_CODE_FAILED: 'uni-id-set-invite-code-failed',
	/** 邀请码不可用 */
	INVALID_INVITE_CODE: 'uni-id-invalid-invite-code',
	/** 禁止修改邀请人 */
	CHANGE_INVITER_FORBIDDEN: 'uni-id-change-inviter-forbidden',
	/** 此账号（微信、QQ、手机号等）已被绑定 */
	BIND_CONFLICT: 'uni-id-bind-conflict',

}
