// 微信小程序专用的WASM加载器
// 参考uni-highlight的实现方式，适配微信小程序环境

// 全局变量
let globalModule = null;
let isInitialized = false;
let isInitializing = false;

// WASM模块接口定义
class CmarkGfmModule {
	constructor() {
		this._malloc = null;
		this._free = null;
		this.ccall = null;
		this.HEAPU8 = null;
		this.calledRun = false;
	}
	
	// 初始化WASM模块
	async init(options) {
		try {
			// 获取WASM文件路径
			const wasmPath = options.path || options;
			// 使用微信小程序的WXWebAssembly API，直接传入文件路径
			const wasmModule = await WXWebAssembly.instantiate(wasmPath, {
				env: {
					emscripten_get_now: () => Date.now(),
					__assert_fail: (condition, filename, line, func) => {
						console.error(`Assertion failed: ${condition}, at: ${filename}:${line} in ${func}`);
						throw new Error(`Assertion failed: ${condition}`);
					},
					_abort_js: () => {
						throw new Error('Abort called');
					},
					emscripten_resize_heap: (size) => {
						// 简单的堆大小调整实现
						return true;
					},
					environ_get: (environ, environBuf) => {
						// 环境变量获取
						return 0;
					},
					environ_sizes_get: (environCount, environSize) => {
						// 环境变量大小获取
						return 0;
					},
					fd_close: (fd) => {
						// 文件描述符关闭
						return 0;
					},
					fd_seek: (fd, offset, whence, newOffset) => {
						// 文件定位
						return 0;
					},
					fd_write: (fd, iovs, iovsLen, nwritten) => {
						// 文件写入
						return 0;
					}
				},
				wasi_snapshot_preview1: {
					emscripten_get_now: () => Date.now(),
					environ_get: (environ, environBuf) => {
						// 环境变量获取
						return 0;
					},
					environ_sizes_get: (environCount, environSize) => {
						// 环境变量大小获取
						return 0;
					},
					fd_close: (fd) => {
						// 文件描述符关闭
						return 0;
					},
					fd_seek: (fd, offset, whence, newOffset) => {
						// 文件定位
						return 0;
					},
					fd_write: (fd, iovs, iovsLen, nwritten) => {
						// 文件写入
						return 0;
					}
				}
			});
			
			// 绑定WASM函数
			this._malloc = wasmModule.instance.exports.malloc;
			this._free = wasmModule.instance.exports.free;
			this.ccall = this.createCcall(wasmModule.instance.exports);
			this.HEAPU8 = new Uint8Array(wasmModule.instance.exports.memory.buffer);
			this.calledRun = true;
			
			return this;
		} catch (error) {
			console.error('Failed to initialize WASM module:', error);
			throw error;
		}
	}
	
	// 创建ccall函数
	createCcall(exports) {
		return (funcName, returnType, argTypes, args) => {
			try {
				const func = exports[funcName];
				if (!func) {
					throw new Error(`Function ${funcName} not found`);
				}
				return func.apply(null, args);
			} catch (error) {
				console.error(`Error calling ${funcName}:`, error);
				throw error;
			}
		};
	}
}

// 加载WASM文件
function loadWASM(options) {
	if (isInitialized) return Promise.resolve(globalModule);
	if (isInitializing) {
		return new Promise((resolve, reject) => {
			const checkInit = () => {
				if (isInitialized) {
					resolve(globalModule);
				} else if (!isInitializing) {
					reject(new Error('Initialization failed'));
				} else {
					setTimeout(checkInit, 100);
				}
			};
			checkInit();
		});
	}
	
	isInitializing = true;
	
	return new Promise(async (resolve, reject) => {
		try {
			// WASM文件路径 - 使用绝对路径，参考 uni-highlight 的实现
			const wasmPath = '/uni_modules/uni-cmark/static/mp-weixin/cmark-gfm-md2json.wasm';
			
			// 创建并初始化模块，传递包含 path 的对象
			globalModule = new CmarkGfmModule();
			await globalModule.init({path: wasmPath});
			
			isInitialized = true;
			isInitializing = false;
			resolve(globalModule);
		} catch (error) {
			isInitializing = false;
			reject(error);
		}
	});
}

// md2json函数
function md2json(markdown) {
	if (!isInitialized || !globalModule || !globalModule.calledRun) {
		throw new Error('WASM module not initialized. Call loadWASM() first.');
	}
	
	try {
		// 将markdown字符串转换为UTF-8字节数组
		const markdownBytes = stringToUtf8Bytes(markdown);
		
		// 分配内存并写入数据
		const markdownPtr = globalModule._malloc(markdownBytes.length + 1);
		globalModule.HEAPU8.set(markdownBytes, markdownPtr);
		globalModule.HEAPU8[markdownPtr + markdownBytes.length] = 0; // 空字符结束
		
		try {
			// 调用C函数 - md2json 函数只接受一个参数（markdownPtr）
			const resultPtr = globalModule.ccall('md2json', 'number', ['number'], [markdownPtr]);
			
			if (resultPtr === 0) {
				throw new Error('Failed to convert markdown to JSON');
			}
			
			// 读取结果字符串
			const resultBytes = [];
			let currentPtr = resultPtr;
			let byte = globalModule.HEAPU8[currentPtr];
			while (byte !== 0) {
				resultBytes.push(byte);
				currentPtr++;
				byte = globalModule.HEAPU8[currentPtr];
			}
			
			const jsonString = utf8BytesToString(resultBytes);
			
			// 释放C侧的内存
			globalModule.ccall('free_output_buffer', '', [], []);
			
			// 解析JSON字符串为对象数组
			const result = JSON.parse(jsonString);
			return {
				data: result,
				errorMsg: ''
			};
		} finally {
			// 释放输入内存
			globalModule._free(markdownPtr);
		}
	} catch (error) {
		console.error('Error in md2json:', error);
		throw error;
	}
}

// 辅助函数：将字符串转换为UTF-8字节数组
function stringToUtf8Bytes(str) {
	const bytes = [];
	for (let i = 0; i < str.length; i++) {
		const charCode = str.charCodeAt(i);
		if (charCode < 0x80) {
			bytes.push(charCode);
		} else if (charCode < 0x800) {
			bytes.push(0xc0 | (charCode >> 6));
			bytes.push(0x80 | (charCode & 0x3f));
		} else if (charCode < 0xd800 || charCode >= 0xe000) {
			bytes.push(0xe0 | (charCode >> 12));
			bytes.push(0x80 | ((charCode >> 6) & 0x3f));
			bytes.push(0x80 | (charCode & 0x3f));
		} else {
			// 代理对 (surrogate pair)
			i++;
			const nextCharCode = str.charCodeAt(i);
			const codePoint = 0x10000 + (((charCode & 0x3ff) << 10) | (nextCharCode & 0x3ff));
			bytes.push(0xf0 | (codePoint >> 18));
			bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
			bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
			bytes.push(0x80 | (codePoint & 0x3f));
		}
	}
	return bytes;
}

// 辅助函数：将UTF-8字节数组转换为字符串
function utf8BytesToString(bytes) {
	let str = '';
	let i = 0;
	while (i < bytes.length) {
		const byte1 = bytes[i++];
		if (byte1 < 0x80) {
			str += String.fromCharCode(byte1);
		} else if (byte1 < 0xe0) {
			const byte2 = bytes[i++];
			str += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
		} else if (byte1 < 0xf0) {
			const byte2 = bytes[i++];
			const byte3 = bytes[i++];
			str += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f));
		} else {
			const byte2 = bytes[i++];
			const byte3 = bytes[i++];
			const byte4 = bytes[i++];
			let codePoint = (((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f));
			if (codePoint > 0xffff) {
				codePoint -= 0x10000;
				str += String.fromCharCode(0xd800 + (codePoint >> 10));
				str += String.fromCharCode(0xdc00 + (codePoint & 0x3ff));
			} else {
				str += String.fromCharCode(codePoint);
			}
		}
	}
	return str;
}

// 导出模块
const cmarkLoader = {
	loadWASM,
	md2json,
	CmarkGfmModule
};

export default cmarkLoader;
