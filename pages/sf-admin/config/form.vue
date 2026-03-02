<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <page-header title="系统参数配置" sub-title="配置系统运行的关键参数，修改后立即生效" />

    <!-- 表单区域 -->
    <view class="form-container" v-loading="loading">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="180px"
        label-position="right"
      >
        <!-- 广告积分配置 -->
        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">广告积分配置</span>
            </div>
          </template>

          <el-row :gutter="40">
            <el-col :span="24" :xs="24">
              <el-form-item label="积分模式" prop="ad_score_mode">
                <el-radio-group v-model="formData.ad_score_mode">
                  <el-radio :value="0">非实时模式</el-radio>
                  <el-radio :value="1">实时模式</el-radio>
                </el-radio-group>
                <div class="form-tip">非实时模式：固定积分；实时模式：根据广告实际收益计算积分</div>
              </el-form-item>
            </el-col>
            <el-col :span="24" :xs="24" v-show="formData.ad_score_mode === 0">
              <el-form-item label="基础积分" prop="ad_score_base">
                <el-input-number v-model="formData.ad_score_base" :min="0" :step="1" class="input-width" />
                <div class="form-tip">非实时模式下，观看单次广告获得的基础积分</div>
              </el-form-item>
            </el-col>
            <el-col :span="24" :xs="24" v-show="formData.ad_score_mode === 1">
              <el-form-item label="积分兑换比例" prop="ad_score_rate">
                <el-input-number v-model="formData.ad_score_rate" :min="0" :step="10" class="input-width" />
                <div class="form-tip">实时模式下，1元广告收益兑换的积分数量</div>
                <div class="form-tip" style="color: #E6A23C; margin-top: 8px;">
                  <el-icon style="vertical-align: middle;"><WarningFilled /></el-icon>
                  使用实时模式需要确认您的应用已在 uni-ad 后台开通广告收益实时计价模式，否则依然会按照非实时模式处理
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="24" :xs="24">
              <el-form-item label="每日观看上限" prop="ad_daily_limit">
                <el-input-number v-model="formData.ad_daily_limit" :min="0" :step="1" class="input-width" />
                <div class="form-tip">用户每日最多可观看广告的次数</div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 分销比例配置 -->
        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">分销比例配置</span>
              <el-tag size="small" type="info">总和建议为 1 (100%)</el-tag>
            </div>
          </template>

          <el-row :gutter="40">
            <el-col :span="24" :xs="24">
              <el-form-item label="个人收益比例" prop="ad_score_self_rate">
                <el-input-number v-model="adScoreSelfRatePercent" :min="0" :max="100" :step="1" class="input-width">
                  <template #suffix><span>%</span></template>
                </el-input-number>
                <div class="form-tip">用户自己观看广告获得的收益比例</div>
              </el-form-item>
            </el-col>
            <el-col :span="24" :xs="24">
              <el-form-item label="一级上线比例" prop="ad_score_l1_rate">
                <el-input-number v-model="adScoreL1RatePercent" :min="0" :max="100" :step="1" class="input-width">
                  <template #suffix><span>%</span></template>
                </el-input-number>
                <div class="form-tip">一级上线（直接推荐人）获得的收益比例</div>
              </el-form-item>
            </el-col>
            <el-col :span="24" :xs="24">
              <el-form-item label="二级上线比例" prop="ad_score_l2_rate">
                <el-input-number v-model="adScoreL2RatePercent" :min="0" :max="100" :step="1" class="input-width">
                  <template #suffix><span>%</span></template>
                </el-input-number>
                <div class="form-tip">二级上线（间接推荐人）获得的收益比例</div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 提现配置 -->
        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">提现配置</span>
            </div>
          </template>

          <el-row :gutter="40">
            <el-col :span="24" :xs="24">
              <el-form-item label="最低提现积分" prop="withdrawal_min_score">
                <el-input-number v-model="formData.withdrawal_min_score" :min="0" :step="100" class="input-width" />
              </el-form-item>
            </el-col>
            <el-col :span="24" :xs="24">
              <el-form-item label="提现手续费" prop="withdrawal_fee_rate">
                <el-input-number v-model="withdrawalFeeRatePercent" :min="0" :max="50" :step="1" class="input-width">
                  <template #suffix><span>%</span></template>
                </el-input-number>
                <div class="form-tip">用户提现时扣除的手续费比例，建议设置为10%-30%左右（扣除的手续费会回流到总资金中，即只要有人提现，则剩余积分就会增值）</div>
              </el-form-item>
            </el-col>
            <el-col :span="24" :xs="24">
              <el-form-item label="保底兑换比例" prop="minimum_exchange_ratio">
                <el-input-number v-model="formData.minimum_exchange_ratio" :min="0" :step="1" class="input-width" />
                <div class="form-tip">当实际兑换比例小于保底兑换比例时，用户提现将按保底兑换比例结算，设为0则不启用保底机制</div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 提交按钮 -->
        <div class="form-footer">
          <el-button type="primary" size="large" :loading="submitLoading" @click="handleSubmit">
            保存配置
          </el-button>
        </div>
      </el-form>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ElMessage } from 'element-plus'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// 状态
const loading = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

const formData = ref({})

const ratePercentComputed = (key) => {
  return {
    get: () => {
      const val = formData.value[key]
      return val != null ? Math.round(val * 100) : 0
    },
    set: (val) => {
      formData.value[key] = (val ?? 0) / 100
    }
  }
}

// 计算属性 - 百分比转换
const adScoreSelfRatePercent = computed(ratePercentComputed("ad_score_self_rate"))
const adScoreL1RatePercent = computed(ratePercentComputed("ad_score_l1_rate"))
const adScoreL2RatePercent = computed(ratePercentComputed("ad_score_l2_rate"))
const withdrawalFeeRatePercent = computed(ratePercentComputed("withdrawal_fee_rate"))

const formRules = {
  ad_score_base: [{ required: true, message: '请输入基础积分', trigger: 'blur' }],
  ad_score_rate: [{ required: true, message: '请输入兑换比例', trigger: 'blur' }],
  ad_daily_limit: [{ required: true, message: '请输入每日限制', trigger: 'blur' }],
  withdrawal_min_score: [{ required: true, message: '请输入最低提现积分', trigger: 'blur' }]
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await sfCo.action({
      name: 'admin/config/get'
    })

    // 如果返回空对象，保留默认值；否则覆盖
    if (res && Object.keys(res).length > 0) {
      formData.value = res.info;
    }
  } catch (e) {
    ElMessage.error('加载配置失败: ' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  // 校验比例总和
  const totalRate = formData.value.ad_score_self_rate + formData.value.ad_score_l1_rate + formData.value.ad_score_l2_rate
  // 浮点数比较，允许微小误差
  if (Math.abs(totalRate - 1) > 0.001) {
    ElMessage.warning(`当前分销比例总和为 ${(totalRate * 100).toFixed(0)}%，建议总和为 100%`)
    // 只是警告，允许提交
  }

  submitLoading.value = true
  try {
    await sfCo.action({
      name: 'admin/config/update',
      data: formData.value
    })
    ElMessage.success('配置保存成功')
  } catch (e) {
    ElMessage.error('保存失败: ' + (e.message || '未知错误'))
  } finally {
    submitLoading.value = false
  }
}

onLoad(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
page {
  background-color: #f5f7fa;
}

.page-container {
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;
  margin: 0 auto;
}


.form-container {
  flex: 1;
}

.form-card {
  margin-bottom: 16px;
  border-radius: 8px;
  border: none;

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f2f5;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
  margin-left: 10px;
}

.form-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 24px;
  margin-bottom: 40px;
}

.input-width {
  width: 180px;
  max-width: 100%;
}

@media screen and (max-width: 768px) {
  .page-container {
    padding: 10px;
  }

  :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    padding: 0 0 8px;
  }

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}
</style>
