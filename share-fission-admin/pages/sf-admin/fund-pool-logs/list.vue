<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <page-header :title="pageConfig.title" :sub-title="pageConfig.subTitle" />

    <!-- 资金池概览卡片 -->
    <view class="fund-pool-card" v-loading="poolLoading">
      <view class="pool-item">
        <text class="pool-label">现金余额</text>
        <view class="pool-value-row">
          <text class="pool-value cash">¥ {{ formatNumber(fundPool.total_cash) }}</text>
          <el-button type="primary" size="small" @click="showAddFundDialog">投入资金</el-button>
        </view>
      </view>
      <view class="pool-item">
        <text class="pool-label">积分余额</text>
        <text class="pool-value score">{{ formatInteger(fundPool.total_score) }}</text>
      </view>
      <view class="pool-item">
        <text class="pool-label">当前兑换比例</text>
        <text class="pool-value rate">{{ fundPool.exchange_rate }} 元/积分</text>
      </view>
      <view class="pool-item">
        <text class="pool-label">保底兑换比例</text>
        <view class="pool-value-row">
          <text class="pool-value" :class="{ 'warning-text': isMinimumRatioExceeded }">{{ minimumExchangeRatio }}</text>
          <el-tag v-if="isMinimumRatioExceeded" type="warning" size="small">已启用保底</el-tag>
          <el-button type="primary" size="small" @click="showSetMinimumRatioDialog">设置</el-button>
        </view>
      </view>
      <view class="pool-item">
        <text class="pool-label">更新时间</text>
        <text class="pool-value time">{{ formatTime(fundPool.update_time) }}</text>
      </view>
    </view>

    <!-- 保底兑换比例警告提示 -->
    <el-alert
      v-if="isMinimumRatioExceeded"
      type="warning"
      :closable="false"
      show-icon
      style="margin-top: 10px"
    >
      <template #title>
        <span style="font-weight: 600;">保底兑换比例已启用</span>
      </template>
      <template #default>
        当前兑换比例 <strong>{{ fundPool.exchange_rate }}</strong> 元/积分低于保底比例 <strong>{{ minimumExchangeRatio }}</strong>，
        用户提现将按保底比例 <strong>{{ minimumExchangeRatio }}</strong> 结算，请注意资金池的余额变化。
      </template>
    </el-alert>

    <!-- 投入资金弹窗 -->
    <el-dialog
      v-model="addFundDialogVisible"
      title="投入资金"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="addFundForm" :rules="addFundRules" ref="addFundFormRef" label-width="100px">
        <el-form-item label="投入金额" prop="amount">
          <el-input-number
            v-model="addFundForm.amount"
            :min="0.01"
            :precision="2"
            :step="100"
            placeholder="请输入投入金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="addFundForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addFundDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddFund" :loading="addFundLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设置保底兑换比例弹窗 -->
    <el-dialog
      v-model="setMinimumRatioDialogVisible"
      title="设置保底兑换比例"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form :model="minimumRatioForm" :rules="minimumRatioRules" ref="minimumRatioFormRef" label-width="130px">
        <el-form-item label="保底兑换比例" prop="ratio">
          <el-input-number
            v-model="minimumRatioForm.ratio"
            :min="0"
            :precision="3"
            :step="0.001"
            placeholder="请输入保底兑换比例"
            style="width: 100%"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 8px; line-height: 1.5;">
            当前兑换比例：{{ fundPool.exchange_rate }} 元/积分<br/>
            设为 0 则不启用保底机制，大于 0 且大于当前兑换比例时生效
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="setMinimumRatioDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSetMinimumRatio" :loading="setMinimumRatioLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 工具栏区域 -->
    <view class="toolbar">
      <view class="toolbar-left">
        <el-select v-model="filterType" placeholder="类型筛选" clearable style="width: 140px" @change="handleSearch">
          <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="x"
          style="width: 260px"
          @change="handleSearch"
        />
      </view>
      <view class="toolbar-right">
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </view>
    </view>

    <!-- 表格区域 -->
    <view class="table-container" ref="tableContainer">
      <div class="virtual-table-wrapper pc-only" v-loading="loading">
        <el-auto-resizer>
          <template #default="{ height, width }">
            <el-table-v2
              ref="tableRef"
              :columns="computedColumns"
              :data="tableData.list"
              :width="width"
              :height="tableHeight"
              :row-height="54"
              :header-height="48"
              row-key="_id"
              fixed
              :row-class="getRowClass"
            >
              <template #header-cell="{ column }">
                <template v-if="column.sortable">
                  <view class="sortable-header" @click="handleSort(column.key)">
                    <span>{{ column.title }}</span>
                    <view class="sort-icons">
                      <el-icon :class="{ active: sortState.field === column.key && sortState.order === 'asc' }"><CaretTop /></el-icon>
                      <el-icon :class="{ active: sortState.field === column.key && sortState.order === 'desc' }"><CaretBottom /></el-icon>
                    </view>
                  </view>
                </template>
                <template v-else>{{ column.title }}</template>
              </template>
              <template #cell="{ column, rowData, rowIndex }">
                <div class="cell-content">
                  <template v-if="column.key === 'index'">
                    {{ (pagination.currentPage - 1) * pagination.pageSize + rowIndex + 1 }}
                  </template>
                  <template v-else-if="column.key === 'type'">
                    <el-tag :type="getTypeTagType(rowData[column.key])" size="small" :disable-transitions="true">
                      {{ getTypeLabel(rowData[column.key]) }}
                    </el-tag>
                  </template>
                  <template v-else-if="column.key === 'cash_change'">
                    <span :class="['change-value', rowData[column.key] >= 0 ? 'positive' : 'negative']">
                      {{ rowData[column.key] >= 0 ? '+' : '' }}¥ {{ formatNumber(rowData[column.key]) }}
                    </span>
                  </template>
                  <template v-else-if="column.key === 'score_change'">
                    <span :class="['change-value', rowData[column.key] >= 0 ? 'positive' : 'negative']">
                      {{ rowData[column.key] >= 0 ? '+' : '' }}{{ formatInteger(rowData[column.key]) }}
                    </span>
                  </template>
                  <template v-else-if="column.key === 'cash_balance'">
                    <span class="balance-value">¥ {{ formatNumber(rowData[column.key]) }}</span>
                  </template>
                  <template v-else-if="column.key === 'score_balance'">
                    <span class="balance-value">{{ formatInteger(rowData[column.key]) }}</span>
                  </template>
                  <template v-else-if="column.key === 'exchange_rate'">
                    {{ rowData[column.key] }}
                  </template>
                  <template v-else-if="column.key === 'create_time'">
                    {{ formatTime(rowData[column.key]) }}
                  </template>
                  <template v-else>{{ rowData[column.key] ?? '-' }}</template>
                </div>
              </template>
            </el-table-v2>
          </template>
        </el-auto-resizer>
      </div>

      <!-- 移动端列表视图 -->
      <div class="mobile-list-container mobile-only" v-loading="loading">
        <template v-if="tableData.list.length > 0">
          <view class="mobile-card" v-for="(item, index) in tableData.list" :key="item._id">
            <view class="card-header">
              <view class="header-main">
                <el-tag size="small" :type="getTypeTagType(item.type)">{{ getTypeLabel(item.type) }}</el-tag>
              </view>
              <text class="card-index">#{{ (pagination.currentPage - 1) * pagination.pageSize + index + 1 }}</text>
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="label">现金变动</text>
                <text :class="['value', item.cash_change >= 0 ? 'positive' : 'negative']">
                  {{ item.cash_change >= 0 ? '+' : '' }}¥ {{ formatNumber(item.cash_change) }}
                </text>
              </view>
              <view class="info-row">
                <text class="label">积分变动</text>
                <text :class="['value', item.score_change >= 0 ? 'positive' : 'negative']">
                  {{ item.score_change >= 0 ? '+' : '' }}{{ formatInteger(item.score_change) }}
                </text>
              </view>
              <view class="info-row">
                <text class="label">现金余额</text>
                <text class="value">¥ {{ formatNumber(item.cash_balance) }}</text>
              </view>
              <view class="info-row">
                <text class="label">积分余额</text>
                <text class="value">{{ formatInteger(item.score_balance) }}</text>
              </view>
              <view class="info-row">
                <text class="label">兑换比例</text>
                <text class="value">{{ item.exchange_rate }}</text>
              </view>
              <view class="info-row" v-if="item.remark">
                <text class="label">备注</text>
                <text class="value">{{ item.remark }}</text>
              </view>
              <view class="info-row">
                <text class="label">时间</text>
                <text class="value">{{ formatTime(item.create_time) }}</text>
              </view>
            </view>
          </view>
        </template>
        <el-empty v-else description="暂无数据" />
      </div>
    </view>

    <!-- 底部区域 -->
    <view class="table-footer">
      <view class="footer-left"></view>
      <view class="footer-right">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="tableData.total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ElTableV2, ElAutoResizer, ElMessage } from 'element-plus'
import { CaretTop, CaretBottom } from '@element-plus/icons-vue'
import { columns } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// ========== 配置 ==========
const pageConfig = reactive({
  title: '资金池流水',
  subTitle: '查看资金池现金和积分变动记录'
})

const typeOptions = [
  { label: '广告收入', value: 'ad_income' },
  { label: '提现支出', value: 'withdrawal' },
  { label: '手续费返还', value: 'fee_return' },
  { label: '投入资金', value: 'deposit' }
]

// ========== 状态 ==========
const loading = ref(false)
const poolLoading = ref(false)
const filterType = ref('')
const dateRange = ref(null)
const tableHeight = ref(500)
const tableContainer = ref(null)
const tableRef = ref(null)

// 投入资金相关
const addFundDialogVisible = ref(false)
const addFundLoading = ref(false)
const addFundFormRef = ref(null)
const addFundForm = reactive({
  amount: null,
  remark: ''
})

const addFundRules = {
  amount: [
    { required: true, message: '请输入投入金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ]
}

// 设置保底兑换比例相关
const setMinimumRatioDialogVisible = ref(false)
const setMinimumRatioLoading = ref(false)
const minimumRatioFormRef = ref(null)
const minimumRatioForm = reactive({
  ratio: 0
})

const minimumRatioRules = {
  ratio: [
    { required: true, message: '请输入保底兑换比例', trigger: 'blur' },
    { type: 'number', min: 0, message: '保底兑换比例不能为负数', trigger: 'blur' }
  ]
}

// 资金池信息
const fundPool = reactive({
  total_cash: 0,
  total_score: 0,
  exchange_rate: 0.01,
  update_time: null
})

// 系统配置
const systemConfig = reactive({
  minimum_exchange_ratio: 0
})

const tableData = reactive({ list: [], total: 0 })
const pagination = reactive({ currentPage: 1, pageSize: 20 })

// 排序相关
const sortState = reactive({ field: 'create_time', order: 'desc' })

// ========== 计算属性 ==========
const tableColumns = ref([...columns])

const computedColumns = computed(() => [
  { key: 'index', title: '序号', width: 70, align: 'center' },
  ...tableColumns.value
])

// 保底兑换比例显示文本
const minimumExchangeRatio = computed(() => {
  const ratio = systemConfig.minimum_exchange_ratio
  return ratio > 0 ? `${ratio} 元/积分` : '未设置'
})

// 判断保底兑换比例是否大于当前比例
const isMinimumRatioExceeded = computed(() => {
  const minRatio = systemConfig.minimum_exchange_ratio
  const currentRatio = fundPool.exchange_rate
  return minRatio > 0 && minRatio > currentRatio
})

// ========== 方法 ==========
const calculateTableHeight = () => {
  nextTick(() => {
    const windowHeight = uni.getSystemInfoSync().windowHeight
    const container = tableContainer.value?.$el || tableContainer.value
    tableHeight.value = container
      ? windowHeight - container.getBoundingClientRect().top - 100
      : windowHeight - 350
  })
}

// 加载系统配置
const loadSystemConfig = async () => {
  try {
    const res = await sfCo.action({
      name: 'admin/config/get'
    })
    if (res && res.info) {
      systemConfig.minimum_exchange_ratio = res.info.minimum_exchange_ratio || 0
    }
  } catch (e) {
    console.error('加载系统配置失败', e)
  }
}

// 加载资金池信息
const loadFundPool = async () => {
  poolLoading.value = true
  try {
    const res = await sfCo.action({
      name: 'admin/fundPoolLogs/getPool'
    })
    if (res) {
      Object.assign(fundPool, res)
    }
  } catch (e) {
    ElMessage.error('加载资金池信息失败')
  } finally {
    poolLoading.value = false
  }
}

// 加载流水列表
const loadData = async () => {
  loading.value = true
  try {
    const data = {
      pageIndex: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    // 类型筛选
    if (filterType.value) {
      data.type = filterType.value
    }
    // 时间范围筛选
    if (dateRange.value && dateRange.value.length === 2) {
      data.startTime = dateRange.value[0]
      data.endTime = dateRange.value[1] + 86400000 - 1 // 结束日期包含当天
    }
    // 添加排序参数
    if (sortState.field && sortState.order) {
      data.sortField = sortState.field
      data.sortOrder = sortState.order
    }
    const res = await sfCo.action({
      name: 'admin/fundPoolLogs/getList',
      data
    })
    tableData.list = res.list || []
    tableData.total = res.total || 0
  } catch (e) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const formatNumber = (num) => (num == null ? '-' : num.toFixed(2))
const formatInteger = (num) => (num == null ? '-' : num.toLocaleString())

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const getTypeTagType = (type) => {
  const map = {
    'ad_income': 'success',
    'withdrawal': 'danger',
    'fee_return': 'warning',
    'deposit': 'primary'
  }
  return map[type] || 'info'
}

const getTypeLabel = (type) => {
  const map = {
    'ad_income': '广告收入',
    'withdrawal': '提现支出',
    'fee_return': '手续费返还',
    'deposit': '投入资金'
  }
  return map[type] || type || '-'
}

const getRowClass = ({ rowIndex }) => (rowIndex % 2 === 0 ? 'row-even' : 'row-odd')

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleReset = () => {
  filterType.value = ''
  dateRange.value = null
  handleSearch()
}

// 分页
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadData()
}

const handlePageChange = (page) => {
  pagination.currentPage = page
  loadData()
}

// 排序
const handleSort = (field) => {
  if (sortState.field === field) {
    if (sortState.order === 'asc') {
      sortState.order = 'desc'
    } else if (sortState.order === 'desc') {
      sortState.field = ''
      sortState.order = ''
    } else {
      sortState.order = 'asc'
    }
  } else {
    sortState.field = field
    sortState.order = 'asc'
  }
  pagination.currentPage = 1
  loadData()
}

// 显示投入资金弹窗
const showAddFundDialog = () => {
  addFundForm.amount = null
  addFundForm.remark = ''
  addFundDialogVisible.value = true
  nextTick(() => {
    addFundFormRef.value?.clearValidate()
  })
}

// 处理投入资金
const handleAddFund = async () => {
  try {
    await addFundFormRef.value?.validate()
  } catch (e) {
    return
  }

  addFundLoading.value = true
  try {
    await sfCo.action({
      name: 'admin/fundPoolLogs/addFund',
      data: {
        amount: addFundForm.amount,
        remark: addFundForm.remark
      }
    })
    ElMessage.success('投入资金成功')
    addFundDialogVisible.value = false
    // 重新加载数据
    await loadFundPool()
    await loadData()
  } catch (e) {
    ElMessage.error(e.message || '投入资金失败')
  } finally {
    addFundLoading.value = false
  }
}

// 显示设置保底兑换比例弹窗
const showSetMinimumRatioDialog = () => {
  minimumRatioForm.ratio = systemConfig.minimum_exchange_ratio || 0
  setMinimumRatioDialogVisible.value = true
  nextTick(() => {
    minimumRatioFormRef.value?.clearValidate()
  })
}

// 处理设置保底兑换比例
const handleSetMinimumRatio = async () => {
  try {
    await minimumRatioFormRef.value?.validate()
  } catch (e) {
    return
  }

  setMinimumRatioLoading.value = true
  try {
    // 获取当前所有配置
    const configRes = await sfCo.action({
      name: 'admin/config/get'
    })

    const configData = configRes?.info || {}
    configData.minimum_exchange_ratio = minimumRatioForm.ratio

    // 更新配置
    await sfCo.action({
      name: 'admin/config/update',
      data: configData
    })

    ElMessage.success('保底兑换比例设置成功')
    setMinimumRatioDialogVisible.value = false

    // 重新加载系统配置
    await loadSystemConfig()
  } catch (e) {
    ElMessage.error(e.message || '设置失败')
  } finally {
    setMinimumRatioLoading.value = false
  }
}

// ========== 生命周期 ==========
onLoad(() => {
  loadSystemConfig()
  loadFundPool()
  loadData()
  setTimeout(calculateTableHeight, 300)
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
}

.fund-pool-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 24px;

  .warning-text {
    color: #e6a23c;
    font-weight: 600;
  }
  margin-bottom: 16px;

  .pool-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .pool-label {
      font-size: 14px;
      color: #909399;
    }

    .pool-value-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pool-value {
      font-size: 20px;
      font-weight: 600;
      color: #303133;

      &.cash {
        color: #f56c6c;
      }

      &.score {
        color: #409eff;
      }

      &.rate {
        color: #67c23a;
      }

      &.time {
        font-size: 14px;
        font-weight: normal;
        color: #909399;
      }
    }
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  :deep(.toolbar-right) {
    .el-button + .el-button {
      margin-left: 0;
    }
  }
}

.table-container {
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;

  .virtual-table-wrapper {
    height: 100%;

    :deep(.el-table-v2) {
      .el-table-v2__header-cell,
      .el-table-v2__header {
        background-color: #fafafa;
        font-weight: 600;
        color: #606266;
      }

      .el-table-v2__row-cell {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

.sortable-header {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  gap: 4px;

  &:hover {
    color: #409eff;
  }

  .sort-icons {
    display: flex;
    flex-direction: column;
    line-height: 1;

    .el-icon {
      font-size: 12px;
      color: #c0c4cc;
      height: 8px;
      overflow: hidden;

      &.active {
        color: #409eff;
      }
    }
  }
}

.change-value {
  font-weight: 500;

  &.positive {
    color: #67c23a;
  }

  &.negative {
    color: #f56c6c;
  }
}

.balance-value {
  color: #606266;
}

.cell-content {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
  gap: 12px;

  .footer-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .footer-right {
    display: flex;
    align-items: center;
  }
}

/* Responsive visibility */
.mobile-only {
  display: none;
}

@media screen and (max-width: 768px) {
  .pc-only {
    display: none !important;
  }

  .mobile-only {
    display: block;
  }

  .page-container {
    padding: 12px;
    height: 100vh;
    overflow: hidden;
  }

  .fund-pool-card {
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;

    .pool-item {
      width: 45%;

      .pool-value {
        font-size: 16px;
      }
    }
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
    gap: 12px;

    .toolbar-left,
    .toolbar-right {
      width: 100%;
      justify-content: space-between;
    }

    .el-select,
    :deep(.el-date-editor) {
      width: 100% !important;
    }
  }

  .table-container {
    background: transparent;
    border-radius: 0;

    .mobile-list-container {
      height: 100%;
      overflow-y: auto;
      padding-bottom: 20px;
    }

    .mobile-card {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f2f5;

        .header-main {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .card-index {
          font-size: 12px;
          color: #909399;
        }
      }

      .card-body {
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 8px;

          .label {
            color: #909399;
          }

          .value {
            color: #606266;

            &.positive {
              color: #67c23a;
            }

            &.negative {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }

  .table-footer {
    flex-direction: column;
    gap: 12px;
    padding: 12px;

    .footer-left {
      display: none;
    }

    .footer-right {
      width: 100%;
      justify-content: center;

      :deep(.el-pagination) {
        flex-wrap: wrap;
        justify-content: center;

        .el-pagination__sizes,
        .el-pager,
        .el-pagination__jump {
          display: none !important;
        }
      }
    }
  }
}
</style>
