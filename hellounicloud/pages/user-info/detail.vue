<template>
  <view class="container">
    <unicloud-db ref="udb" v-slot:default="{data, loading, error, options}" :options="options" collection="user-info,book,opendb-city-china" field="username,gender,birth_date,weight,mobile,email,url,favorite_book_id{title},address_code{name},party_member,hobby,comment" :where="queryWhere" :getone="true" :manual="true">
      <view v-if="error">{{error.message}}</view>
      <view v-else-if="loading">
        <uni-load-more :contentText="loadMore" status="loading"></uni-load-more>
      </view>
      <view v-else-if="data">
        <view>
          <text>真实姓名</text>
          <text>{{data.username}}</text>
        </view>
        <view>
          <text>性别</text>
          <text>{{options.gender_valuetotext[data.gender]}}</text>
        </view>
        <view>
          <text>生日</text>
          <uni-dateformat :threshold="[0, 0]" :date="data.birth_date"></uni-dateformat>
        </view>
        <view>
          <text>体重</text>
          <text>{{data.weight}}</text>
        </view>
        <view>
          <text>手机号码</text>
          <text>{{data.mobile}}</text>
        </view>
        <view>
          <text>邮箱账号</text>
          <uni-link :href="'mailto:'+data.email" :text="data.email"></uni-link>
        </view>
        <view>
          <text>个人博客</text>
          <uni-link :href="data.url" :download="data.url" :text="data.url"></uni-link>
        </view>
        <view>
          <text>喜欢的书</text>
          <text>{{data.favorite_book_id && data.favorite_book_id[0] && data.favorite_book_id[0].title}}</text>
        </view>
        <view>
          <text>地址</text>
          <text>{{data.address_code && data.address_code[0] && data.address_code[0].name}}</text>
        </view>
        <view>
          <text>是否为党员</text>
          <text>{{data.party_member == true ? '✅' : '❌'}}</text>
        </view>
        <view>
          <text>业余爱好</text>
          <uni-data-picker :localdata="options.hobby_valuetotext" :value="data.hobby" :multiple="false" :readonly="true" :arrow="false" split=","></uni-data-picker>
        </view>
        <view>
          <text>备注</text>
          <text>{{data.comment}}</text>
        </view>
      </view>
    </unicloud-db>
    <view class="btns">
      <button type="primary" @click="handleUpdate">修改</button>
      <button type="warn" class="btn-delete" @click="handleDelete">删除</button>
    </view>
  </view>
</template>

<script>
  // 由schema2code生成，包含校验规则和enum静态数据
  import { enumConverter } from '../../js_sdk/validator/user-info.js';

  export default {
    data() {
      return {
        queryWhere: '',
        loadMore: {
          contentdown: '',
          contentrefresh: '',
          contentnomore: ''
        },
        options: {
          // 将scheme enum 属性静态数据中的value转成text
          ...enumConverter
        }
      }
    },
    onLoad(e) {
      this._id = e.id
    },
    onReady() {
      if (this._id) {
        this.queryWhere = '_id=="' + this._id + '"'
      }
    },
    methods: {
      handleUpdate() {
        // 打开修改页面
        uni.navigateTo({
          url: './edit?id=' + this._id,
          events: {
            // 监听修改页面成功修改数据后, 刷新当前页面数据
            refreshData: () => {
              this.$refs.udb.loadData({
                clear: true
              })
            }
          }
        })
      },
      handleDelete() {
        this.$refs.udb.remove(this._id, {
          success: (res) => {
            // 删除数据成功后跳转到list页面
            uni.navigateTo({
              url: './list'
            })
          }
        })
      }
    }
  }
</script>

<style>
  .container {
    padding: 10px;
  }

  .btns {
    margin-top: 10px;
    /* #ifndef APP-NVUE */
    display: flex;
    /* #endif */
    flex-direction: row;
  }

  .btns button {
    flex: 1;
  }

  .btn-delete {
    margin-left: 10px;
  }
</style>
