<template>
	<view class="feedback-page">
		<view class="feedback-scene">
			<view class="feedback-hero" :style="heroLayoutStyle">
				<image
					class="hero-background"
					src="/static/mall/mall-header.png"
					mode="aspectFill"
					:draggable="false"
				></image>

				<view class="hero-content">
					<view class="hero-title-row" aria-label="意见反馈">
						<view
							class="back-button"
							hover-class="back-button-pressed"
							role="button"
							tabindex="0"
							aria-label="返回"
							@click="goBack"
							@keyup.enter="goBack"
						>
							<uni-icons type="back" size="22" color="#71300c"></uni-icons>
						</view>

						<view class="title-cloud" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
						<text class="hero-title">意见反馈</text>
						<view class="title-cloud title-cloud-right" aria-hidden="true">
							<view class="title-cloud-curl"></view>
							<view class="title-cloud-tail"></view>
						</view>
					</view>
				</view>

				<text class="lantern-word" aria-hidden="true">诉</text>
			</view>

			<view class="page-content">
				<uni-forms
					ref="form"
					class="feedback-form"
					:value="formData"
					validate-trigger="submit"
					err-show-type="toast"
				>
					<view class="section-panel ornate-panel">
						<view class="panel-content section-panel-content">
							<view class="section-heading">
								<view class="heading-rule"></view>
								<text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
								<text class="section-title">问题描述</text>
								<text class="heading-ornament" aria-hidden="true">❧</text>
								<view class="heading-rule heading-rule-right"></view>
							</view>

							<uni-forms-item class="feedback-form-item" name="content">
								<view class="field-block">
									<view class="field-heading">
										<view class="field-title-wrap">
											<view class="field-icon field-icon-content">
												<uni-icons type="compose" size="17" color="#a96835"></uni-icons>
											</view>
											<text class="field-label">留言内容</text>
											<text class="required-mark">*</text>
										</view>
									</view>

									<view
										class="textarea-shell"
										:class="{
											'field-control-focused': focusedField === 'content',
											'field-control-error': fieldErrors.content
										}"
									>
										<textarea
											v-model="formData.content"
											class="feedback-textarea"
											:disabled="submitting"
											placeholder="请详细描述遇到的问题或想告诉我们的建议"
											placeholder-class="feedback-placeholder"
											trim="right"
											@input="binddata('content', $event.detail.value), clearFieldError('content')"
											@focus="focusedField = 'content'"
											@blur="focusedField = ''"
										></textarea>
									</view>
									<text v-if="fieldErrors.content" class="field-error-text">{{ fieldErrors.content }}</text>
								</view>
							</uni-forms-item>

							<uni-forms-item class="feedback-form-item" name="imgs">
								<view class="field-block field-block-upload">
									<view class="field-heading">
										<view class="field-title-wrap">
											<view class="field-icon field-icon-image">
												<uni-icons type="image-filled" size="17" color="#477c69"></uni-icons>
											</view>
											<text class="field-label">相关图片</text>
											<text class="optional-mark">选填</text>
										</view>
										<text class="upload-count">{{ displayImageCount }}/6</text>
									</view>

									<view
										class="upload-shell"
										:class="{
											'upload-shell-busy': hasUploadsInProgress,
											'field-control-error': fieldErrors.imgs || hasUploadErrors
										}"
									>
										<uni-file-picker
											v-model="formData.imgs"
											file-mediatype="image"
											:limit="6"
											:disabled="submitting"
											:readonly="submitting"
											return-type="array"
											:image-styles="imageStyles"
											@select="handleUploadSelect"
											@progress="handleUploadProgress"
											@success="handleUploadSuccess"
											@fail="handleUploadFailure"
											@delete="handleUploadDelete"
										>
											<view class="upload-trigger">
												<uni-icons type="camera-filled" size="21" color="#ba7b3e"></uni-icons>
												<text class="upload-trigger-text">添加</text>
											</view>
										</uni-file-picker>
									</view>
									<text v-if="hasUploadsInProgress" class="upload-state-text">图片上传中</text>
									<text v-else-if="hasUploadErrors" class="field-error-text">图片上传失败，请重试或删除</text>
									<text v-else-if="fieldErrors.imgs" class="field-error-text">{{ fieldErrors.imgs }}</text>
								</view>
							</uni-forms-item>
						</view>
					</view>

					<view class="section-panel ornate-panel">
						<view class="panel-content section-panel-content">
							<view class="section-heading">
								<view class="heading-rule"></view>
								<text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
								<text class="section-title">联系信息</text>
								<text class="heading-ornament" aria-hidden="true">❧</text>
								<view class="heading-rule heading-rule-right"></view>
							</view>

							<uni-forms-item class="feedback-form-item" name="contact">
								<view class="field-block field-block-compact">
									<view class="field-heading">
										<view class="field-title-wrap">
											<view class="field-icon field-icon-contact">
												<uni-icons type="person-filled" size="17" color="#a66f42"></uni-icons>
											</view>
											<text class="field-label">联系人</text>
											<text class="optional-mark">选填</text>
										</view>
									</view>

									<view
										class="input-shell"
										:class="{
											'field-control-focused': focusedField === 'contact',
											'field-control-error': fieldErrors.contact
										}"
									>
										<uni-easyinput
											v-model="formData.contact"
											:disabled="submitting"
											:input-border="false"
											:styles="inputStyles"
											primary-color="#d65a24"
											placeholder="请输入联系人姓名"
											trim="both"
											@input="clearFieldError('contact')"
											@focus="focusedField = 'contact'"
											@blur="focusedField = ''"
										></uni-easyinput>
									</view>
									<text v-if="fieldErrors.contact" class="field-error-text">{{ fieldErrors.contact }}</text>
								</view>
							</uni-forms-item>

							<uni-forms-item class="feedback-form-item" name="mobile">
								<view class="field-block field-block-compact">
									<view class="field-heading">
										<view class="field-title-wrap">
											<view class="field-icon field-icon-mobile">
												<uni-icons type="phone-filled" size="17" color="#c45f2b"></uni-icons>
											</view>
											<text class="field-label">联系电话</text>
											<text class="optional-mark">选填</text>
										</view>
									</view>

									<view
										class="input-shell"
										:class="{
											'field-control-focused': focusedField === 'mobile',
											'field-control-error': fieldErrors.mobile
										}"
									>
										<uni-easyinput
											v-model="formData.mobile"
											:disabled="submitting"
											:input-border="false"
											:styles="inputStyles"
											primary-color="#d65a24"
											placeholder="请输入联系电话"
											trim="both"
											@input="clearFieldError('mobile')"
											@focus="focusedField = 'mobile'"
											@blur="focusedField = ''"
										></uni-easyinput>
									</view>
									<text v-if="fieldErrors.mobile" class="field-error-text">{{ fieldErrors.mobile }}</text>
								</view>
							</uni-forms-item>
						</view>
					</view>

					<button
						class="submit-button"
						:class="{ 'submit-button-disabled': submitting }"
						:disabled="submitting"
						hover-class="submit-button-pressed"
						@click="submit"
					>
						<uni-icons type="paperplane-filled" size="18" color="#fffdf5"></uni-icons>
						<text class="submit-button-text">{{ submitSucceeded ? '提交成功' : submitting ? '提交中' : '提交反馈' }}</text>
					</button>
				</uni-forms>
			</view>
		</view>
	</view>
</template>

<script>
	import { validator } from '../../js_sdk/validator/opendb-feedback.js'

	const db = uniCloud.database()
	const dbCollectionName = 'opendb-feedback'

	function getValidator(fields) {
		const result = {}
		for (const key in validator) {
			if (fields.includes(key)) {
				result[key] = validator[key]
			}
		}
		return result
	}

	export default {
		data() {
			const formData = {
				content: '',
				imgs: [],
				contact: '',
				mobile: ''
			}

			return {
				statusBarHeight: Number(uni.getSystemInfoSync().statusBarHeight) || 0,
				focusedField: '',
				submitting: false,
				submitSucceeded: false,
				navigationTimer: null,
				uploadStates: {},
				fieldErrors: {
					content: '',
					imgs: '',
					contact: '',
					mobile: ''
				},
				formData,
				formOptions: {},
				rules: {
					...getValidator(Object.keys(formData))
				},
				inputStyles: {
					color: '#4b2118',
					backgroundColor: 'transparent',
					disableColor: '#f6e8ce',
					borderColor: 'transparent'
				},
				imageStyles: {
					border: {
						color: '#dfb169',
						width: 1,
						radius: 12
					}
				}
			}
		},
		computed: {
			heroLayoutStyle() {
				const safeAreaOffset = Math.max(0, this.statusBarHeight - 42)
				const heroHeight = 178 + safeAreaOffset

				return {
					'--feedback-status-bar-height': `${this.statusBarHeight}px`,
					height: `${heroHeight}px`,
					flexBasis: `${heroHeight}px`
				}
			},
			uploadStateValues() {
				return Object.values(this.uploadStates)
			},
			hasUploadsInProgress() {
				return this.uploadStateValues.includes('uploading')
			},
			hasUploadErrors() {
				return this.uploadStateValues.includes('error')
			},
			displayImageCount() {
				const imageKeys = new Set()

				this.formData.imgs.forEach((file, index) => {
					imageKeys.add(this.getUploadStateKey(file) || `form-image-${index}`)
				})
				Object.keys(this.uploadStates).forEach((key) => imageKeys.add(key))

				return Math.min(6, imageKeys.size)
			}
		},
		onReady() {
			this.$refs.form.setRules(this.rules)
		},
		onUnload() {
			if (this.navigationTimer) {
				clearTimeout(this.navigationTimer)
				this.navigationTimer = null
			}
		},
		methods: {
			goBack() {
				if (getCurrentPages().length > 1) {
					uni.navigateBack({ delta: 1 })
					return
				}

				uni.switchTab({ url: '/pages/ucenter/ucenter' })
			},
			clearFieldError(field) {
				if (!this.fieldErrors[field]) return
				this.fieldErrors = {
					...this.fieldErrors,
					[field]: ''
				}
			},
			clearValidationErrors() {
				this.fieldErrors = {
					content: '',
					imgs: '',
					contact: '',
					mobile: ''
				}
			},
			applyValidationErrors(errors) {
				this.clearValidationErrors()
				const errorList = Array.isArray(errors) ? errors : errors ? [errors] : []
				const nextErrors = { ...this.fieldErrors }

				errorList.forEach((error) => {
					if (error && Object.prototype.hasOwnProperty.call(nextErrors, error.key)) {
						nextErrors[error.key] = error.errorMessage || '请检查此项内容'
					}
				})

				this.fieldErrors = nextErrors
			},
			getUploadStateKey(file) {
				const sourceFile = file && file.file ? file.file : {}
				const uuid = file && file.uuid ? file.uuid : sourceFile.uuid || ''
				const path = (file && (file.path || file.url)) || sourceFile.path || sourceFile.name || ''
				const size = (file && file.size) || sourceFile.size || ''
				return uuid || path || size ? `${uuid}|${path}|${size}` : ''
			},
			setUploadState(file, state) {
				const key = this.getUploadStateKey(file)
				if (!key) return
				this.uploadStates = {
					...this.uploadStates,
					[key]: state
				}
			},
			removeUploadState(file) {
				const key = this.getUploadStateKey(file)
				if (!key || !Object.prototype.hasOwnProperty.call(this.uploadStates, key)) return
				const nextStates = { ...this.uploadStates }
				delete nextStates[key]
				this.uploadStates = nextStates
			},
			handleUploadSelect(event) {
				this.clearFieldError('imgs')
				;(event.tempFiles || []).forEach((file) => {
					this.setUploadState(file, 'uploading')
				})
			},
			handleUploadProgress(event) {
				if (event && event.tempFile) {
					this.setUploadState(event.tempFile, 'uploading')
				}
			},
			handleUploadSuccess(event) {
				;(event.tempFiles || []).forEach((file) => {
					this.removeUploadState(file)
				})
			},
			handleUploadFailure(event) {
				;(event.tempFiles || []).forEach((file) => {
					this.setUploadState(file, 'error')
				})
			},
			handleUploadDelete(event) {
				if (event && event.tempFile) {
					this.removeUploadState(event.tempFile)
				}
			},
			submit() {
				if (this.submitting) return
				if (this.hasUploadsInProgress) {
					uni.showToast({
						title: '图片上传中，请稍候',
						icon: 'none'
					})
					return
				}
				if (this.hasUploadErrors) {
					uni.showToast({
						title: '图片上传失败，请重试或删除',
						icon: 'none'
					})
					return
				}

				this.clearValidationErrors()
				this.submitSucceeded = false
				this.submitting = true
				uni.showLoading({
					title: '提交中',
					mask: true
				})

				this.$refs.form.validate().then((res) => {
					this.submitForm(res)
				}).catch((errors) => {
					this.applyValidationErrors(errors)
					this.submitting = false
					uni.hideLoading()
				})
			},
			submitForm(value) {
				db.collection(dbCollectionName).add(value).then(() => {
					this.submitSucceeded = true
					uni.showToast({
						icon: 'none',
						title: '提交成功'
					})

					const eventChannel = this.getOpenerEventChannel()
					if (eventChannel) {
						eventChannel.emit('refreshData')
					}

					this.navigationTimer = setTimeout(() => {
						this.goBack()
					}, 500)
				}).catch((error) => {
					this.submitSucceeded = false
					uni.showModal({
						content: error.message || '请求服务失败',
						showCancel: false
					})
				}).finally(() => {
					if (!this.submitSucceeded) {
						this.submitting = false
					}
					uni.hideLoading()
				})
			}
		}
	}
</script>

<style scoped>
	page,
	view,
	text,
	image,
	button,
	textarea {
		box-sizing: border-box;
		letter-spacing: 0;
	}

	page {
		min-height: 100%;
		background: #f9e7bd;
	}

	view {
		display: flex;
		flex-direction: column;
	}

	.feedback-page {
		min-height: 100vh;
		background: #f9e7bd;
		color: #4b170d;
	}

	.feedback-scene {
		position: relative;
		width: 100%;
		max-width: 430px;
		min-height: 100vh;
		margin: 0 auto;
		overflow: hidden;
		background: #fae8be;
	}

	.feedback-hero {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 178px;
		flex: 0 0 178px;
		overflow: hidden;
	}

	.hero-background {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		display: block;
		width: 100%;
		height: 100%;
	}

	.hero-content {
		position: relative;
		z-index: 2;
		width: 100%;
		height: 100%;
		padding-top: calc(8px + var(--feedback-status-bar-height, 0px));
	}

	.hero-title-row {
		position: relative;
		width: 100%;
		height: 53px;
		flex: 0 0 53px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.back-button {
		position: absolute;
		top: 7px;
		left: 14px;
		z-index: 3;
		width: 39px;
		height: 39px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(218, 151, 58, 0.58);
		border-radius: 50%;
		background: rgba(255, 249, 229, 0.76);
		box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.58), 0 2px 6px rgba(112, 58, 18, 0.14);
		transition: opacity 120ms ease, transform 120ms ease;
	}

	.back-button-pressed {
		opacity: 0.78;
		transform: scale(0.94);
	}

	.hero-title {
		display: block;
		flex-shrink: 0;
		margin: 0 10px;
		color: #71300c;
		font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
		font-size: 38px;
		font-weight: 900;
		line-height: 53px;
		text-align: center;
		text-shadow: 0 1px 0 rgba(255, 248, 220, 0.72), 0 2px 2px rgba(102, 46, 8, 0.12);
		white-space: nowrap;
	}

	.title-cloud {
		width: 36px;
		height: 20px;
		flex-shrink: 1;
		flex-direction: row;
		align-items: flex-end;
		opacity: 0.88;
	}

	.title-cloud-right {
		transform: scaleX(-1);
	}

	.title-cloud-curl {
		width: 15px;
		height: 10px;
		flex-shrink: 0;
		border: 2px solid #d99331;
		border-right: 0;
		border-bottom: 0;
		border-radius: 12px 0 0;
	}

	.title-cloud-tail {
		width: 21px;
		height: 2px;
		margin-bottom: 1px;
		background: linear-gradient(90deg, #d99331 0%, rgba(217, 147, 49, 0.08) 100%);
	}

	.lantern-word {
		position: absolute;
		top: 101px;
		left: 31px;
		z-index: 2;
		display: block;
		width: 28px;
		color: #d83711;
		font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', serif;
		font-size: 27px;
		font-weight: 900;
		line-height: 34px;
		text-align: center;
		text-shadow: 0 1px 0 rgba(255, 244, 213, 0.72);
	}

	.page-content {
		position: relative;
		z-index: 3;
		width: 100%;
		margin-top: -34px;
		padding: 0 16px 24px;
		padding-bottom: calc(24px + constant(safe-area-inset-bottom));
		padding-bottom: calc(24px + env(safe-area-inset-bottom));
	}

	.feedback-form {
		display: block;
		width: 100%;
	}

	.ornate-panel {
		position: relative;
		width: 100%;
		border: 2px solid #dfa153;
		background: rgba(254, 248, 235, 0.98);
		box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.92), inset 0 0 0 4px rgba(218, 151, 58, 0.2), 0 5px 13px rgba(125, 66, 19, 0.16);
	}

	.ornate-panel::before {
		position: absolute;
		top: 7px;
		right: 7px;
		bottom: 7px;
		left: 7px;
		z-index: 0;
		border: 1px solid rgba(223, 164, 82, 0.25);
		content: '';
		pointer-events: none;
	}

	.panel-content {
		position: relative;
		z-index: 1;
		width: 100%;
	}

	.section-panel {
		border-radius: 22px;
	}

	.section-panel + .section-panel {
		margin-top: 12px;
	}

	.section-panel::before {
		border-radius: 15px;
	}

	.section-panel-content {
		padding: 12px 13px 8px;
	}

	.section-heading {
		height: 28px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		padding: 0 10px;
	}

	.section-title {
		display: block;
		flex-shrink: 0;
		margin: 0 6px;
		color: #4d190f;
		font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
		font-size: 18px;
		font-weight: 700;
		line-height: 26px;
	}

	.heading-rule {
		height: 1px;
		min-width: 12px;
		flex: 1;
		background: linear-gradient(90deg, transparent, #dda143);
	}

	.heading-rule-right {
		background: linear-gradient(90deg, #dda143, transparent);
	}

	.heading-ornament {
		display: block;
		flex-shrink: 0;
		color: #dda143;
		font-family: Georgia, serif;
		font-size: 19px;
		line-height: 20px;
	}

	.heading-ornament-left {
		transform: scaleX(-1);
	}

	:deep(.feedback-form-item) {
		display: flex;
		width: 100%;
		margin-bottom: 0;
		flex-direction: column;
	}

	:deep(.feedback-form-item + .feedback-form-item) {
		border-top: 1px dashed rgba(211, 146, 68, 0.26);
	}

	:deep(.feedback-form-item .uni-forms-item__label) {
		display: none;
	}

	:deep(.feedback-form-item .uni-forms-item__content) {
		display: block;
		width: 100%;
		min-width: 0;
		flex: none;
	}

	.field-block {
		width: 100%;
		padding: 9px 4px 12px;
	}

	.field-block-upload {
		padding-bottom: 14px;
	}

	.field-block-compact {
		padding-top: 9px;
		padding-bottom: 11px;
	}

	.field-heading {
		width: 100%;
		height: 32px;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}

	.field-title-wrap {
		min-width: 0;
		flex: 1;
		flex-direction: row;
		align-items: center;
	}

	.field-icon {
		width: 30px;
		height: 30px;
		flex: 0 0 30px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(218, 151, 58, 0.3);
		border-radius: 50%;
		box-shadow: inset 0 0 0 2px rgba(255, 252, 242, 0.5);
	}

	.field-icon-content,
	.field-icon-contact {
		background: #f7e8c8;
	}

	.field-icon-image {
		border-color: rgba(71, 124, 105, 0.3);
		background: #e0eadf;
	}

	.field-icon-mobile {
		background: #f4dfd0;
	}

	.field-label {
		display: block;
		margin-left: 9px;
		color: #4b170d;
		font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
		font-size: 16px;
		font-weight: 700;
		line-height: 22px;
		white-space: nowrap;
	}

	.required-mark {
		display: block;
		margin-left: 4px;
		color: #dc4b1c;
		font-size: 16px;
		font-weight: 700;
		line-height: 20px;
	}

	.optional-mark {
		display: block;
		margin-left: 7px;
		padding: 1px 5px;
		border: 1px solid rgba(211, 156, 83, 0.34);
		border-radius: 7px;
		background: rgba(250, 234, 202, 0.48);
		color: #9b765f;
		font-size: 10px;
		line-height: 14px;
		white-space: nowrap;
	}

	.upload-count {
		display: block;
		flex-shrink: 0;
		margin-left: 8px;
		color: #96745f;
		font-family: Georgia, 'Songti SC', 'STSong', serif;
		font-size: 12px;
		line-height: 18px;
	}

	.textarea-shell,
	.input-shell,
	.upload-shell {
		width: 100%;
		border: 1px solid rgba(222, 183, 147, 0.58);
		background: rgba(255, 253, 247, 0.88);
		box-shadow: inset 0 2px 5px rgba(117, 70, 36, 0.04);
		transition: border-color 120ms ease, box-shadow 120ms ease;
	}

	.textarea-shell {
		height: 128px;
		padding: 10px 12px;
		border-radius: 13px;
	}

	.feedback-textarea {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		color: #4b2118;
		font-size: 15px;
		line-height: 23px;
	}

	.feedback-placeholder {
		color: #b39782;
		font-size: 14px;
		line-height: 23px;
	}

	.input-shell {
		height: 48px;
		overflow: hidden;
		border-radius: 12px;
		padding: 0 3px;
	}

	.input-shell :deep(.uni-easyinput),
	.input-shell :deep(.uni-easyinput__content) {
		width: 100%;
		height: 100%;
	}

	.input-shell :deep(.uni-easyinput__content-input) {
		height: 46px;
		color: #4b2118;
		font-size: 15px;
		line-height: 46px;
	}

	.input-shell :deep(.uni-easyinput__placeholder-class) {
		color: #b39782;
		font-size: 13px;
	}

	.field-control-focused {
		border-color: rgba(214, 137, 43, 0.76);
		box-shadow: inset 0 2px 5px rgba(117, 70, 36, 0.03), 0 0 0 2px rgba(232, 166, 74, 0.14);
	}

	.field-control-error {
		border-color: rgba(194, 65, 35, 0.78);
		background: rgba(255, 244, 236, 0.9);
		box-shadow: inset 0 2px 5px rgba(117, 70, 36, 0.03), 0 0 0 2px rgba(204, 77, 39, 0.1);
	}

	.field-error-text,
	.upload-state-text {
		display: block;
		width: 100%;
		margin-top: 6px;
		padding: 0 2px;
		font-size: 12px;
		line-height: 18px;
	}

	.field-error-text {
		color: #bd4a2b;
	}

	.upload-state-text {
		color: #a56d2f;
	}

	.upload-shell {
		min-height: 104px;
		padding: 10px;
		border-radius: 14px;
		background: rgba(255, 250, 237, 0.74);
	}

	.upload-shell-busy {
		border-color: rgba(207, 145, 58, 0.74);
	}

	.upload-shell :deep(.uni-file-picker) {
		width: 100%;
	}

	.upload-shell :deep(.uni-file-picker__container) {
		margin: -4px;
	}

	.upload-shell :deep(.file-picker__box-content) {
		margin: 4px;
		background: rgba(255, 253, 247, 0.9);
	}

	.upload-shell :deep(.file-picker__box-content.is-add) {
		border-style: dashed !important;
		background: rgba(247, 232, 200, 0.48);
	}

	.upload-shell :deep(.icon-del-box) {
		background: rgba(142, 64, 28, 0.78);
	}

	.upload-trigger {
		width: 100%;
		height: 100%;
		align-items: center;
		justify-content: center;
	}

	.upload-trigger-text {
		display: block;
		margin-top: 4px;
		color: #9a6c45;
		font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
		font-size: 12px;
		font-weight: 600;
		line-height: 17px;
	}

	.submit-button {
		display: flex;
		width: 100%;
		height: 52px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		margin: 16px 0 0;
		padding: 0 16px;
		border: 2px solid #efa950;
		border-radius: 15px;
		background: linear-gradient(180deg, #f2551d 0%, #e33e0f 100%);
		box-shadow: inset 0 0 0 1px rgba(255, 203, 100, 0.7), inset 0 -2px 4px rgba(133, 49, 4, 0.15), 0 3px 8px rgba(141, 54, 9, 0.2);
		line-height: 1;
		transition: opacity 120ms ease, transform 120ms ease;
	}

	.submit-button::after {
		border: 0;
	}

	.submit-button-pressed {
		opacity: 0.86;
		transform: scale(0.985);
	}

	.submit-button-disabled {
		opacity: 0.64;
	}

	.submit-button-text {
		margin-left: 7px;
		color: #fffdf5;
		font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
		font-size: 18px;
		font-weight: 700;
		line-height: 24px;
		text-shadow: 0 1px 1px rgba(112, 36, 3, 0.24);
	}

	@media (min-width: 431px) {
		.feedback-scene {
			box-shadow: 0 0 28px rgba(107, 59, 17, 0.18);
		}
	}

	@media (min-width: 414px) {
		.hero-title {
			margin-right: 12px;
			margin-left: 12px;
			font-size: 42px;
		}

		.title-cloud {
			width: 50px;
		}

		.title-cloud-curl {
			width: 20px;
			height: 11px;
		}

		.title-cloud-tail {
			width: 30px;
		}
	}

	@media (max-width: 360px) {
		.back-button {
			left: 11px;
		}

		.hero-title {
			margin: 0 7px;
			font-size: 34px;
		}

		.title-cloud {
			width: 28px;
		}

		.title-cloud-curl {
			width: 12px;
		}

		.title-cloud-tail {
			width: 16px;
		}

		.page-content {
			padding-right: 12px;
			padding-left: 12px;
		}

		.section-panel-content {
			padding-right: 10px;
			padding-left: 10px;
		}

		.field-block {
			padding-right: 2px;
			padding-left: 2px;
		}

		.field-label {
			margin-left: 8px;
			font-size: 15px;
		}

		.textarea-shell {
			height: 120px;
			padding-right: 10px;
			padding-left: 10px;
		}

		.upload-shell {
			padding: 8px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.back-button,
		.textarea-shell,
		.input-shell,
		.upload-shell,
		.submit-button {
			transition: none;
		}
	}
</style>
