<template>
  <view class="uni-container">
    <uni-forms ref="form" :value="formData" validateTrigger="bind">
      <uni-forms-item name="role_id" label="唯一ID" required>
        <uni-easyinput placeholder="角色唯一标识，不可修改，不允许重复" v-model="formData.role_id" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="role_name" label="名称" required>
        <uni-easyinput placeholder="角色名称" v-model="formData.role_name" trim="both"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="permission" label="权限" class="flex-center-x">
        <uni-data-checkbox :multiple="true" v-model="formData.permission" collection="uni-id-permissions" :page-size="500" field="permission_name as text, permission_id as value"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="comment" label="备注">
        <uni-easyinput type="textarea" placeholder="备注" v-model="formData.comment" trim="both"></uni-easyinput>
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
  import { validator } from '@/js_sdk/validator/uni-id-roles.js';

  const db = uniCloud.database();
  const dbCmd = db.command;
  const dbCollectionName = 'uni-id-roles';

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
        "role_id": "",
        "role_name": "",
        "permission": [],
        "comment": "",
        "create_date": null
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
