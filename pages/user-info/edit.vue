<template>
  <view class="uni-container">
    <uni-forms ref="form" :value="formData" validate-trigger="submit" err-show-type="toast">
      <uni-forms-item name="username" label="真实姓名">
        <uni-easyinput placeholder="限制只能输入中文" v-model="formData.username"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="gender" label="性别">
        <uni-data-checkbox v-model="formData.gender" :localdata="formOptions.gender_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="birth_date" label="生日">
        <uni-datetime-picker return-type="timestamp" v-model="formData.birth_date"></uni-datetime-picker>
      </uni-forms-item>
      <uni-forms-item name="weight" label="体重">
        <uni-easyinput placeholder="限输入 >50 && <=500" type="number" v-model="formData.weight"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="mobile" label="手机号码">
        <uni-easyinput placeholder="手机号码" v-model="formData.mobile"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="email" label="邮箱账号">
        <uni-easyinput placeholder="请输入你的邮箱账号" v-model="formData.email"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="url" label="个人博客">
        <uni-easyinput placeholder="请输入网址的地址" v-model="formData.url"></uni-easyinput>
      </uni-forms-item>
      <uni-forms-item name="favorite_book_id" label="喜欢的书">
        <uni-data-checkbox v-model="formData.favorite_book_id" collection="book" field="title as text, _id as value" orderby="desc"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="address_code" label="地址">
        <uni-data-picker self-field="code" parent-field="parent_code" v-model="formData.address_code" collection="opendb-city-china" orderby="value asc" field="code as value, name as text"></uni-data-picker>
      </uni-forms-item>
      <uni-forms-item name="party_member" label="是否为党员">
        <switch @change="binddata('party_member', $event.detail.value)" :checked="formData.party_member"></switch>
      </uni-forms-item>
      <uni-forms-item name="hobby" label="业余爱好">
        <uni-data-checkbox multiple="true" :multiple="true" v-model="formData.hobby" :localdata="formOptions.hobby_localdata"></uni-data-checkbox>
      </uni-forms-item>
      <uni-forms-item name="comment" label="备注">
        <textarea placeholder="拒绝违禁词,如：test" @input="binddata('comment', $event.detail.value)" class="uni-textarea-border" v-model="formData.comment"></textarea>
      </uni-forms-item>
      <view class="uni-button-group">
        <button type="primary" class="uni-button" @click="submit">提交</button>
      </view>
    </uni-forms>
  </view>
</template>

<script>
  import { validator } from '../../js_sdk/validator/user-info.js';

  const db = uniCloud.database();
  const dbCollectionName = 'user-info';

  function getValidator(fields) {
    let result = {}
    for (let key in validator) {
      if (fields.indexOf(key) > -1) {
        result[key] = validator[key]
      }
    }
    return result
  }

  export default {
    data() {
      let formData = {
        "username": "",
        "gender": 0,
        "birth_date": null,
        "weight": null,
        "mobile": "",
        "email": "",
        "url": "",
        "favorite_book_id": "",
        "address_code": "",
        "party_member": null,
        "hobby": [],
        "comment": ""
      }
      return {
        formData,
        formOptions: {
          "gender_localdata": [
            {
              "text": "未知",
              "value": 0
            },
            {
              "text": "男",
              "value": 1
            },
            {
              "text": "女",
              "value": 2
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
          ...getValidator(Object.keys(formData))
        }
      }
    },
    onLoad(e) {
      if (e.id) {
        const id = e.id
        this.formDataId = id
        this.getDetail(id)
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
        db.collection(dbCollectionName).doc(id).field("username,gender,birth_date,weight,mobile,email,url,favorite_book_id,address_code,party_member,hobby,comment").get().then((res) => {
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
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
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
