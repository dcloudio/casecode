/**
 * @class UniCrypto 数据加密服务
 * @function init 初始化函数
 * @function showConfig 返回配置信息函数
 * @function getCrypto 返回原始crypto对象函数
 * @function aesEncode AES加密函数
 * @function aesDecode AES解密函数
 * @function md5 MD5加密函数
 */
const crypto = require('crypto')
module.exports = class UniCrypto {
	constructor(config) {
		this.init(config)
	}
	
	/**
	 * 配置初始化函数
	 * @param {Object} config
	 */
	init(config) {
		this.config = {
			//AES加密默认参数
			AES: {
				mod: 'aes-128-cbc',
				pasword: 'UniStat!010',
				iv: 'UniStativ',
				charset: 'utf8',
				encodeReturnType: 'base64'
			},
			//MD5加密默认参数
			MD5: {
				encodeReturnType: 'hex'
			},
			...config || {}
		}
		return this
	}

	/**
	 * 返回配置信息函数
	 */
	showConfig() {
		return this.config
	}

	/**
	 * 返回原始crypto对象函数
	 */
	getCrypto() {
		return crypto
	}

	/**
	 * AES加密函数
	 * @param {String} data 加密数据明文
	 * @param {String} encodeReturnType 返回加密数据类型，如：base64
	 * @param {String} key 密钥
	 * @param {String} iv 偏移量
	 * @param {String} mod 模式
	 * @param {String} charset 编码
	 */
	aesEncode(data, encodeReturnType, key, iv, mod, charset) {
		const cipher = crypto.createCipheriv(mod || this.config.AES.mod, key || this.config.AES.pasword, iv ||
			this.config.AES.iv)
		let crypted = cipher.update(data, charset || this.config.AES.charset, 'binary')
		crypted += cipher.final('binary')
		crypted = Buffer.from(crypted, 'binary').toString(encodeReturnType || this.config.AES.encodeReturnType)
		return crypted
	}

	/**
	 * AES解密函数
	 * @param {Object} crypted 加密数据密文
	 * @param {Object} encodeReturnType 返回加密数据类型，如：base64
	 * @param {Object} key 密钥
	 * @param {Object} iv 偏移量
	 * @param {Object} mod 模式
	 * @param {Object} charset 编码
	 */
	aesDecode(crypted, encodeReturnType, key, iv, mod, charset) {
		crypted = Buffer.from(crypted, encodeReturnType || this.config.AES.encodeReturnType).toString('binary')
		const decipher = crypto.createDecipheriv(mod || this.config.AES.mod, key || this.config.AES.pasword,
			iv || this.config.AES.iv)
		let decoded = decipher.update(crypted, 'binary', charset || this.config.AES.charset)
		decoded += decipher.final(charset || this.config.AES.charset)
		return decoded
	}

	/**
	 * @param {Object} str 加密字符串
	 * @param {Object} encodeReturnType encodeReturnType 返回加密数据类型，如：hex(转为16进制)
	 */
	md5(str, encodeReturnType) {
		const md5Mod = crypto.createHash('md5')
		md5Mod.update(str)
		return md5Mod.digest(encodeReturnType || this.config.MD5.encodeReturnType)
	}
}
