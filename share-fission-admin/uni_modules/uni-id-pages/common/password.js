// 导入配置
import config from '@/uni_modules/uni-id-pages/config.js'

const {passwordStrength} = config

// 密码强度表达式
const passwordRules = {
	// 密码必须包含大小写字母、数字和特殊符号
	super: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/])[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{8,16}$/,
	// 密码必须包含字母、数字和特殊符号
	strong: /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/])[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{8,16}$/,
	// 密码必须为字母、数字和特殊符号任意两种的组合
	medium: /^(?![0-9]+$)(?![a-zA-Z]+$)(?![~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]+$)[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{8,16}$/,
	// 密码必须包含字母和数字
	weak: /^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z~!@#$%^&*_\-+=`|\\(){}[\]:;"'<>,.?/]{6,16}$/
}

const ERROR = {
	normal: {
		noPwd: '请输入密码',
		noRePwd: '再次输入密码',
		rePwdErr: '两次输入密码不一致'
	},
	passwordStrengthError: {
		super: '密码必须包含大小写字母、数字和特殊符号，密码长度必须在8-16位之间',
		strong: '密码必须包含字母、数字和特殊符号，密码长度必须在8-16位之间',
		medium: '密码必须为字母、数字和特殊符号任意两种的组合，密码长度必须在8-16位之间',
		weak: '密码必须包含字母，密码长度必须在6-16位之间'
	}
}

function validPwd(password) {
	//强度校验
	if (passwordStrength && passwordRules[passwordStrength]) {
		if (!new RegExp(passwordRules[passwordStrength]).test(password)) {
			return ERROR.passwordStrengthError[passwordStrength]
		}
	}
	return true
}

function getPwdRules(pwdName = 'password', rePwdName = 'password2') {
	const rules = {}
	rules[pwdName] = {
		rules: [{
				required: true,
				errorMessage: ERROR.normal.noPwd,
			},
			{
				validateFunction: function(rule, value, data, callback) {
					const checkRes = validPwd(value)
					if (checkRes !== true) {
						callback(checkRes)
					}
					return true
				}
			}
		]
	}

	if (rePwdName) {
		rules[rePwdName] = {
			rules: [{
					required: true,
					errorMessage: ERROR.normal.noRePwd,
				},
				{
					validateFunction: function(rule, value, data, callback) {
						if (value != data[pwdName]) {
							callback(ERROR.normal.rePwdErr)
						}
						return true
					}
				}
			]
		}
	}
	return rules
}

export default {
	ERROR,
	validPwd,
	getPwdRules
}
