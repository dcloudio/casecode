<template>
  <view class="container">
    <unicloud-db ref="udb" v-slot:default="{data, loading, error, options}" :options="options" collection="validate-demo,book,opendb-city-china" field="type,type_name,comment,username,email,dowload_url,weight,favorite_book{title},party_member,hobby,address{name}" :where="queryWhere" :getone="true" :manual="true">
      <view v-if="error">{{error.message}}</view>
      <view v-else-if="loading">
        <uni-load-more :contentText="loadMore" status="loading"></uni-load-more>
      </view>
      <view v-else-if="data">
           <view>
     <text>主体:</text>
                                <text>{{options.type_valuetotext[data.type]}}</text>                     
   </view> 
    <view>
     <text>主体名称:</text>
                     <text>{{data.type_name}}</text>            
   </view> 
    <view>
     <text>备注:</text>
                     <text>{{data.comment}}</text>            
   </view> 
    <view>
     <text>负责人姓名:</text>
                     <text>{{data.username}}</text>            
   </view> 
    <view>
     <text>邮箱:</text>
                     <text>{{data.email}}</text>            
   </view> 
    <view>
     <text>下载地址:</text>
                     <text>{{data.dowload_url}}</text>            
   </view> 
    <view>
     <text>体重:</text>
                     <text>{{data.weight}}</text>            
   </view> 
    <view>
     <text>喜欢的书:</text>
                     <text>{{data.favorite_book[0].title}}</text>            
   </view> 
    <view>
     <text>是否为党员:</text>
                     <text>{{data.party_member}}</text>            
   </view> 
    <view>
     <text>业余爱好:</text>
                                <uni-data-picker :localdata="options.hobby_valuetotext" :value="data.hobby" :multiple="true" :readonly="true" :arrow="false" :border="false" split="," />                     
   </view> 
    <view>
     <text>地址:</text>
                     <text>{{data.address[0].name}}</text>            
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
  import { enumConverter } from '@/js_sdk/validator/validate-demo.js';

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
          url: '/pages/validate-demo/edit?id=' + this._id,
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
              url: '/pages/validate-demo/list'
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
    display: flex;
    flex-direction: row;
  }

  .btns button {
    flex: 1;
  }

  .btn-delete {
    margin-left: 10px;
  }
</style>
