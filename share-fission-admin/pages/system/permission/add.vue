<template>
  <view class="uni-container">
    <uni-forms ref="form" :value="formData" validateTrigger="bind">
      <uni-forms-item name="permission_id" label="权限ID" required>
        <input placeholder="权限唯一标识，不可修改，不允许重复" @input="binddata('permission_id', $event.detail.value)" class="uni-input-border" v-model="formData.permission_id" trim="both" />
      </uni-forms-item>
      <uni-forms-item name="permission_name" label="权限名称" required>
        <input placeholder="权限名称" @input="binddata('permission_name', $event.detail.value)" class="uni-input-border" v-model="formData.permission_name" trim="both" />
      </uni-forms-item>
      <uni-forms-item name="comment" label="备注">
        <textarea placeholder="备注" @input="binddata('comment', $event.detail.value)" class="uni-textarea-border" v-model="formData.comment" trim="both" />
      </uni-forms-item>
      <view class="uni-button-group">
        <button type="primary" class="uni-button" style="width: 100px;" @click="submit">{{$t('common.button.submit')}}</button>
        <navigator open-type="navigateBack" style="margin-left: 15px;">
            <button class="uni-button" style="width: 100px;">{{$t('common.button.back')}}</button>
        </navigator>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  import { validator } from '@/js_sdk/validator/uni-id-permissions.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'uni-id-permissions';

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.includes(key)) {
        result[key] = validator[key]
      }
    }
    return result
  }

  export default {
    data() {
      let formData = {
        "permission_id": "",
        "permission_name": "",
        "comment": ""
      }
      return {
        formData,
        formOptions: {},
        rules: {
          ...getValidator(Object.keys(formData))
        }
      }
    },
    onReady() {
      this.$refs.form.setRules(this.rules)
    },
    methods: {
      /**
       * 触发表单提交
       */
      submit() {
        uni.showLoading({
          mask: true
        })
        this.$refs.form.validate().then((res) => {
          this.submitForm(res)
        }).catch(() => {
          uni.hideLoading()
        })
      },

      submitForm(value) {
        // 使用 clientDB 提交数据
        db.collection(dbCollectionName).add(value).then((res) => {
          uni.showToast({
            title: '新增成功'
          })
          this.getOpenerEventChannel().emit('refreshData')
          setTimeout(() => uni.navigateBack(), 500)
        }).catch((err) => {
          uni.showModal({
            content: err.message || '请求服务失败',
            showCancel: false
          })
        }).finally(() => {
          uni.hideLoading()
        })
      }
    }
  }
</script>

<style>
	::v-deep .uni-forms-item__label {
		width: 90px !important;
	}
</style>