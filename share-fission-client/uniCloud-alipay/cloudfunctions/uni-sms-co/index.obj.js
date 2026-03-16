// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129

// 导入 createConfig 模块
const createConfig = require('uni-config-center');
// 导入 buildTemplateData 模块
const buildTemplateData = require('./build-template-data');
// 导入 utils 模块中的 parserDynamicField 函数
const {
	parserDynamicField
} = require('./utils');
// 导入 schema-name-adapter 模块
const schemaNameAdapter = require('./schema-name-adapter');
// 导入 preset-condition 模块中的 presetCondition 和 conditionConvert 函数
const {
	presetCondition,
	conditionConvert
} = require("./preset-condition");

// 导入 uni-sms-co 模块
const uniSmsCo = uniCloud.importObject('uni-sms-co');
// 导入 uniCloud.database 模块
const db = uniCloud.database();
// 使用 createConfig 函数创建 smsConfig 对象
const smsConfig = createConfig({
	pluginId: 'uni-sms-co'
}).config();
// 定义 errCode 函数，返回错误码
function errCode(code) {
	return 'uni-sms-co-' + code;
}

// 定义 tableNames 对象
const tableNames = {
	template: 'opendb-sms-template', // 模板表名为 'opendb-sms-template'
	task: 'opendb-sms-task', // 任务表名为 'opendb-sms-task'
	log: 'opendb-sms-log' // 日志表名为 'opendb-sms-log'
};


module.exports = {
	_before: async function() { // 通用预处理器
		this.tableNames = tableNames

		/**
		 * 优化 schema 的命名规范，需要兼容 uni-admin@2.1.6 以下版本
		 * 如果是在uni-admin@2.1.6版本以上创建的项目可以将其注释
		 * */
		await schemaNameAdapter.call(this)
	},
	_after: function(error, result) {
		if (error) {
			console.error(error);
			if (error instanceof Error) {
				// 如果错误是 Error 实例，则返回包含错误信息的对象
				return {
					errCode: 'error',
					errMsg: error.message
				};
			}
			if (error.errCode) {
				// 如果错误对象中包含 errCode 属性，则直接返回错误对象
				return error;
			}
			// 抛出其他类型的错误
			throw error;
		}
		// 返回结果
		return result;
	},

	/**
	 * 创建短信任务
	 * @param {{receiver: *[], type: string}} to
	 * @param {String} to.type=user to.all=true时用来区分发送类型
	 * @param {Array} to.receiver 用户ID's / 用户标签ID's
	 * @param {Object} to.condition 用户筛选条件
	 * @param {String} templateId 短信模板ID
	 * @param {Array} templateData 短信模板数据
	 * @param {Object} options
	 * @param {String} options.taskName 任务名称
	 */
	async createSmsTask(to, templateId, templateData, options = {}) {
		if (!templateId) {
			// 如果缺少 templateId，则返回错误信息
			return {
				errCode: errCode('template-id-required'),
				errMsg: '缺少templateId'
			};
		}

		if (!to.condition && (!to.receiver || to.receiver.length <= 0)) {
			// 如果没有预设条件且没有接收者，则返回错误信息
			return {
				errCode: errCode('send-users-is-null'),
				errMsg: '请选择要发送的用户'
			};
		}

		const clientInfo = this.getClientInfo();

		// 查询短信模板
		const {
			data: templates
		} = await db.collection(this.tableNames.template).where({
			_id: templateId
		}).get();
		if (templates.length <= 0) {
			// 如果短信模板不存在，则返回错误信息
			return {
				errCode: errCode('template-not-found'),
				errMsg: '短信模板不存在'
			};
		}
		const [template] = templates;

		// 预设条件
		if (presetCondition[to.condition]) {
			to.condition = typeof presetCondition[to.condition] === "function" ? presetCondition[to.condition]
			() : presetCondition[to.condition];
		}

		// 创建短信任务
		const task = await db.collection(this.tableNames.task).add({
			app_id: clientInfo.appId,
			name: options.taskName,
			template_id: templateId,
			template_content: template.content,
			vars: templateData,
			to,
			send_qty: 0,
			success_qty: 0,
			fail_qty: 0,
			create_date: Date.now()
		});

		uniSmsCo.createUserSmsMessage(task.id);

		// 返回任务创建成功的异步结果
		return new Promise(resolve => setTimeout(() => resolve({
			errCode: 0,
			errMsg: '任务创建成功',
			taskId: task.id
		}), 300));
	},

	async createUserSmsMessage(taskId, execData = {}) {
		const parallel = 100
		let beforeId
		const {
			data: tasks
		} = await db.collection(this.tableNames.task).where({
			_id: taskId
		}).get()

		if (tasks.length <= 0) {
			return {
				errCode: errCode('task-id-not-found'),
				errMsg: '任务ID不存在'
			}
		}

		const [task] = tasks
		let query = {
			mobile: db.command.exists(true)
		}

		// 指定用户发送
		if (task.to.type === 'user' && task.to.receiver.length > 0 && !task.to.condition) {
			let index = 0
			if (execData.beforeId) {
				const i = task.to.receiver.findIndex(id => id === execData.beforeId)
				index = i !== -1 ? i + 1 : 0
			}

			const receiver = task.to.receiver.slice(index, index + parallel)
			query._id = db.command.in(receiver)
			beforeId = receiver[receiver.length - 1]
		}

		// 指定用户标签
		if (task.to.type === 'userTags') {
			query.tags = db.command.in(task.to.receiver)
		}

		// 自定义条件
		if (task.to.condition) {
			const condition = conditionConvert(task.to.condition, db.command)

			query = {
				...query,
				...condition
			}
		}

		if ((task.to.condition || task.to.type === "userTags") && execData.beforeId) {
			query._id = db.command.gt(execData.beforeId)
		}

		// 动态数据仅支持uni-id-users表字段
		const dynamicField = parserDynamicField(task.vars)
		const userFields = dynamicField['uni-id-users'] ? dynamicField['uni-id-users'].reduce((res, field) => {
			res[field] = true
			return res
		}, {}) : {}

		const {
			data: users
		} = await db.collection('uni-id-users')
			.where(query)
			.field({
				mobile: true,
				...userFields
			})
			.limit(parallel)
			.orderBy('_id', 'asc')
			.get()

		if (users.length <= 0) {
			// 更新要发送的短信数量
			const count = await db.collection(this.tableNames.log).where({
				task_id: taskId
			}).count()
			await db.collection(this.tableNames.task).where({
				_id: taskId
			}).update({
				send_qty: count.total
			})

			// 开始发送
			uniSmsCo.sendSms(taskId)

			return new Promise(resolve => setTimeout(() => resolve({
				errCode: 0,
				errMsg: '创建完成'
			}), 500))
		}

		if (!beforeId) {
			beforeId = users[users.length - 1]._id
		}

		let docs = []
		for (const user of users) {
			const varData = await buildTemplateData(task.vars, user)
			docs.push({
				uid: user._id,
				task_id: taskId,
				mobile: user.mobile,
				var_data: varData,
				status: 0,
				create_date: Date.now()
			})
		}

		await db.collection(this.tableNames.log).add(docs)

		uniSmsCo.createUserSmsMessage(taskId, {
			beforeId
		})

		return new Promise(resolve => setTimeout(() => resolve(), 500))
	},
	async sendSms(taskId) {
		const {
			data: tasks
		} = await db.collection(this.tableNames.task).where({
			_id: taskId
		}).get();
		if (tasks.length <= 0) {
			// 如果找不到任务，则输出警告信息并返回
			console.warn(`task [${taskId}] not found`);
			return;
		}

		const [task] = tasks;
		const isStaticTemplate = !task.vars.length;

		let sendData = {
			appid: task.app_id,
			templateId: task.template_id,
			data: {}
		};

		const {
			data: records
		} = await db.collection(this.tableNames.log)
			.where({
				task_id: taskId,
				status: 0
			})
			.limit(isStaticTemplate ? 50 : 1)
			.field({
				mobile: true,
				var_data: true
			})
			.get();

		if (records.length <= 0) {
			// 如果没有要发送的记录，则返回发送完成的异步结果
			return {
				errCode: 0,
				errMsg: '发送完成'
			};
		}

		if (isStaticTemplate) {
			sendData.phoneList = records.reduce((res, user) => {
				res.push(user.mobile);
				return res;
			}, []);
		} else {
			const [record] = records;
			sendData.phone = record.mobile;
			sendData.data = record.var_data;
		}

		try {
			// 发送短信
			await uniCloud.sendSms(sendData);
			// 修改发送状态为已发送
			await db.collection(this.tableNames.log).where({
				_id: db.command.in(records.map(record => record._id))
			}).update({
				status: 1,
				send_date: Date.now()
			});
			// 更新任务的短信成功数
			await db.collection(this.tableNames.task).where({
					_id: taskId
				})
				.update({
					success_qty: db.command.inc(records.length)
				});
		} catch (e) {
			console.error('[sendSms Fail]', e);
			// 修改发送状态为发送失败
			await db.collection(this.tableNames.log).where({
				_id: db.command.in(records.map(record => record._id))
			}).update({
				status: 2,
				reason: e.errMsg || '未知原因',
				send_date: Date.now()
			});
			// 更新任务的短信失败数
			await db.collection(this.tableNames.task).where({
					_id: taskId
				})
				.update({
					fail_qty: db.command.inc(records.length)
				});
		}

		uniSmsCo.sendSms(taskId);

		return new Promise(resolve => setTimeout(() => resolve(), 500));
	},
	async template() {
		const {
			data: templates = []
		} = await db.collection(this.tableNames.template).get();
		// 获取所有短信模板
		return templates;
	},

	async task(id) {
		const {
			data: tasks
		} = await db.collection(this.tableNames.task).where({
			_id: id
		}).get();
		if (tasks.length <= 0) {
			// 如果找不到任务，则返回 null
			return null;
		}

		// 返回第一个找到的任务
		return tasks[0];
	},

	async updateTemplates(templates) {
		if (templates.length <= 0) {
			// 如果模板信息为空，则返回错误
			return {
				errCode: errCode('template-is-null'),
				errMsg: '缺少模板信息'
			};
		}

		let group = [];
		for (const template of templates) {
			group.push(
				db.collection(this.tableNames.template).doc(String(template.templateId)).set({
					name: template.templateName,
					content: template.templateContent,
					type: template.templateType,
					sign: template.templateSign
				})
			);
		}

		await Promise.all(group);

		return {
			errCode: 0,
			errMsg: '更新成功'
		};
	},
	/**
	 * @param to
	 * @param templateId
	 * @param templateData
	 * @param options {Object}
	 * @param options.condition 群发条件
	 * */
	async preview(to, templateId, templateData, options = {}) {
		const count = 1
		let query = {
			mobile: db.command.exists(true)
		}

		// 指定用户发送
		if (to.type === 'user' && to.receiver.length > 0 && !to.condition) {
			// const receiver = to.receiver.slice(0, 10)
			query._id = db.command.in(to.receiver)
		}

		// 指定用户标签
		if (to.type === 'userTags') {
			query.tags = db.command.in(to.receiver)
		}

		// 自定义条件
		let condition = to.condition
		if (presetCondition[to.condition]) {
			condition = typeof presetCondition[to.condition] === "function" ? presetCondition[to.condition]() :
				presetCondition[to.condition]
		}

		if (condition) {
			query = {
				...query,
				...conditionConvert(condition, db.command)
			}
		}

		const {
			data: users
		} = await db.collection('uni-id-users').where(query).limit(count).get()
		const {
			total
		} = await db.collection('uni-id-users').where(query).count()

		if (users.length <= 0) {
			return {
				errCode: errCode('users-is-null'),
				errMsg: '请添加要发送的用户'
			}
		}

		const {
			data: templates
		} = await db.collection(this.tableNames.template).where({
			_id: templateId
		}).get()
		if (templates.length <= 0) {
			return {
				errCode: errCode('template-not-found'),
				errMsg: '模板不存在'
			}
		}
		const [template] = templates

		let docs = []
		for (const user of users) {
			const varData = buildTemplateData(templateData, user)
			const content = template.content.replace(/\$\{(.*?)\}/g, ($1, param) => varData[param] || $1)
			docs.push(`【${template.sign}】${content}`)
		}

		return {
			errCode: 0,
			errMsg: '',
			list: docs,
			total
		}
	}
}
