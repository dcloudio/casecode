
<template>
  <view class="uni-container">
    <uni-forms ref="form" :value="formData" validate-trigger="submit" err-show-type="toast">
      <uni-forms-item name="type" label="主体" required>
  <uni-data-checkbox :multiple="false" v-model="formData.type" :localdata="formOptions.type_localdata" />
</uni-forms-item>
<uni-forms-item name="type_name" label="主体名称" required>
  <uni-easyinput placeholder="企业输入公司名称，个人输入姓名" v-model="formData.type_name" />
</uni-forms-item>
<uni-forms-item name="comment" label="备注">
  <textarea placeholder="备注" @input="binddata('comment', $event.detail.value)" class="uni-textarea-border" :value="formData.comment"></textarea>
</uni-forms-item>
<uni-forms-item name="username" label="负责人姓名">
  <uni-easyinput placeholder="正则，限输入中文" v-model="formData.username" />
</uni-forms-item>
<uni-forms-item name="email" label="邮箱">
  <uni-easyinput placeholder="邮箱" v-model="formData.email" />
</uni-forms-item>
<uni-forms-item name="dowload_url" label="下载地址">
  <uni-easyinput placeholder="如：https://uniapp.dcloud.io" v-model="formData.dowload_url" />
</uni-forms-item>
<uni-forms-item name="weight" label="体重">
  <uni-easyinput placeholder="限输入 >50 && <=500" type="number" v-model="formData.weight" />
</uni-forms-item>
<uni-forms-item name="favorite_book" label="喜欢的书">
  <uni-data-checkbox v-model="formData.favorite_book" collection="book" field="title as text, _id as value" orderby="desc" />
</uni-forms-item>
<uni-forms-item name="party_member" label="是否为党员">
  <switch @change="binddata('party_member', $event.detail.value)" :checked="formData.party_member" />
</uni-forms-item>
<uni-forms-item name="hobby" label="业余爱好">
  <uni-data-checkbox :multiple="true" v-model="formData.hobby" :localdata="formOptions.hobby_localdata" />
</uni-forms-item>
<uni-forms-item name="address" label="地址">
  <uni-data-picker self-field="code" parent-field="parent_code" v-model="formData.address" collection="opendb-city-china" orderby="value asc" field="code as value, name as text"></uni-data-picker>
</uni-forms-item>

      <view class="uni-button-group">
        <button type="primary" class="uni-button" @click="submit">提交</button>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  import { validator } from '@/js_sdk/validator/validate-demo.js';

  const db = uniCloud.database();
  const dbCollectionName = 'validate-demo';

  function getValidator(fields) {
    let reuslt = {}
    for (let key in validator) {
      if (fields.indexOf(key) > -1) {
        reuslt[key] = validator[key]
      }
    }
    return reuslt
  }

  export default {
    data() {
      return {
        formData: {
  "type": -1,
  "type_name": "",
  "comment": "",
  "username": "",
  "email": "",
  "dowload_url": "",
  "weight": null,
  "favorite_book": "",
  "party_member": null,
  "hobby": [],
  "address": ""
},
        formOptions: {
  "type_localdata": [
    {
      "text": "个人",
      "value": 0
    },
    {
      "text": "企业",
      "value": 1
    }
  ],
  "hobby_localdata": [
    {
      "text": "唱歌",
      "value": "Sing"
    },
    {
      "text": "跳舞",
      "value": "dance"
    },
    {
      "text": "画画",
      "value": "draw"
    }
  ]
},
        rules: {
          ...getValidator(["type","type_name","comment","username","email","dowload_url","weight","favorite_book","party_member","hobby","address"])
        }
      }
    },
    onLoad(e) {
      const id = e.id
      this.formDataId = id
      this.getDetail(id)
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
        this.$refs.form.submit().then((res) => {
          this.submitForm(res)
        }).catch((errors) => {
          uni.hideLoading()
        })
      },

      submitForm(value) {
        // 使用 clientDB 提交数据
        db.collection(dbCollectionName).doc(this.formDataId).update(value).then((res) => {
          uni.showToast({
            icon: 'none',
            title: '修改成功'
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
      },

      /**
       * 获取表单数据
       * @param {Object} id
       */
      getDetail(id) {
        uni.showLoading({
          mask: true
        })
        db.collection(dbCollectionName).doc(id).field('type,type_name,comment,username,email,dowload_url,weight,favorite_book,party_member,hobby,address').get().then((res) => {
          const data = res.result.data[0]
          if (data) {
            this.formData = data
          }
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
  .uni-container {
    padding: 15px;
  }

  .uni-input-border,
  .uni-textarea-border {
    width: 100%;
    font-size: 14px;
    color: #666;
    border: 1px #e5e5e5 solid;
    border-radius: 5px;
    box-sizing: border-box;
  }

  .uni-input-border {
    padding: 0 10px;
    height: 35px;

  }

  .uni-textarea-border {
    padding: 10px;
    height: 80px;
  }

  .uni-button-group {
    margin-top: 50px;
    display: flex;
    justify-content: center;
  }

  .uni-button {
    width: 184px;
    padding: 12px 20px;
    font-size: 14px;
    border-radius: 4px;
    line-height: 1;
    margin: 0;
  }
</style>
