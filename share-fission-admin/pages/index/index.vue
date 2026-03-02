<template>
  <view class="page-container">
    <!-- 未结算提示 -->
    <!-- 页面头部 -->
    <page-header :title="pageConfig.title" :sub-title="pageConfig.subTitle" />
    <!-- 工具栏区域 -->
    <view class="toolbar">
      <view class="toolbar-left"></view>
      <view class="toolbar-right">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 260px"
          :shortcuts="dateShortcuts"
          @change="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </view>
    </view>

    <!-- 未结算提示 -->
    <el-alert
      v-if="unsettledCount > 0"
      type="warning"
      show-icon
      :closable="false"
      class="unsettled-alert"
    >
      <template #title>
        <span>重要：您有 <strong>{{ unsettledCount }}</strong> 条未结算记录，请及时填写广告收入完成结算</span>
      </template>
    </el-alert>

    <!-- Tab选项卡区域 -->
    <view class="content-tabs">
      <el-tabs type="border-card" v-model="activeTab" class="main-tabs">
        <el-tab-pane label="数据列表" name="table">
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
                    :height="height"
                    :row-height="54"
                    :header-height="48"
                    row-key="statement_date"
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
                        <template v-else-if="column.key === 'ad_revenue' || column.key === 'total_cash'">
                          <span class="money-text">{{ formatMoney(rowData[column.key]) }}</span>
                        </template>
                        <template v-else-if="column.key === 'exchange_rate'">
                          <span>{{ rowData[column.key]?.toFixed(4) || '-' }}</span>
                        </template>
                        <template v-else-if="['score_added', 'score_consumed', 'score_withdrawn', 'total_score', 'viewers_count', 'views_count'].includes(column.key)">
                          <span class="score-text">{{ formatNumber(rowData[column.key]) }}</span>
                        </template>
                        <template v-else-if="column.key === 'is_settled'">
                          <el-tag :type="rowData[column.key] ? 'success' : 'warning'" size="small" :disable-transitions="true">
                            {{ rowData[column.key] ? '已结算' : '未结算' }}
                          </el-tag>
                        </template>
                        <template v-else-if="column.key === 'actions'">
                          <view class="row-actions">
                            <el-button v-if="!rowData.is_settled" type="primary" size="small" link @click="handleFillRevenue(rowData)">填写广告收入</el-button>
                            <el-button type="primary" size="small" link @click="handleEditRemark(rowData)">备注</el-button>
                          </view>
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
                        <text class="card-title">{{ item._id }}</text>
                        <el-tag :type="item.is_settled ? 'success' : 'warning'" size="small">
                          {{ item.is_settled ? '已结算' : '未结算' }}
                        </el-tag>
                      </view>
                      <text class="card-index">#{{ (pagination.currentPage - 1) * pagination.pageSize + index + 1 }}</text>
                    </view>

                    <view class="card-body">
                      <view class="info-row">
                        <text class="label">广告收益</text>
                        <text class="value price">{{ formatMoney(item.ad_revenue) }} 元</text>
                      </view>
                      <view class="info-row">
                        <text class="label">新增积分</text>
                        <text class="value">{{ formatNumber(item.score_added) }}</text>
                      </view>
                      <view class="info-row">
                        <text class="label">消耗积分</text>
                        <text class="value">{{ formatNumber(item.score_consumed) }}</text>
                      </view>
                      <view class="info-row">
                        <text class="label">提现积分</text>
                        <text class="value">{{ formatNumber(item.score_withdrawn) }}</text>
                      </view>
                      <view class="info-row">
                        <text class="label">新增/活跃用户</text>
                        <text class="value">{{ item.new_users || 0 }} / {{ item.active_users || 0 }}</text>
                      </view>
                      <view class="info-row">
                        <text class="label">资金池</text>
                        <text class="value price">{{ formatMoney(item.total_cash) }} 元</text>
                      </view>
                      <view class="info-row" v-if="item.remark">
                        <text class="label">备注</text>
                        <text class="value">{{ item.remark }}</text>
                      </view>
                    </view>

                    <view class="card-footer">
                      <el-button v-if="!item.is_settled" type="primary" link size="small" @click="handleFillRevenue(item)">
                        <el-icon><Money /></el-icon> 填写广告收入
                      </el-button>
                      <el-button type="primary" link size="small" @click="handleEditRemark(item)">
                        <el-icon><Edit /></el-icon> 备注
                      </el-button>
                    </view>
                  </view>
                </template>
                <el-empty v-else description="暂无数据" />
              </div>
            </view>

            <!-- 分页区域 -->
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
        </el-tab-pane>

        <el-tab-pane label="数据趋势" name="chart" class="pc-only">
          <!-- 图表区域 -->
          <view class="chart-section">
            <view class="chart-header">
              <view class="chart-tabs">
                <el-radio-group v-model="currentChartGroup" size="small" @change="updateChart">
                  <el-radio-button v-for="group in chartGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </el-radio-button>
                </el-radio-group>
              </view>
            </view>
            <view class="chart-container">
              <div ref="chartRef" class="chart-dom"></div>
              <el-empty v-if="!hasChartData" description="暂无图表数据" />
            </view>
          </view>
        </el-tab-pane>
      </el-tabs>
    </view>

    <!-- 填写广告收入弹窗 -->
    <el-dialog
      v-model="revenueDialogVisible"
      title="填写广告收入"
      width="400px"
      destroy-on-close
    >
      <el-alert
        type="warning"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #default>
          <text style="font-size: 14px;">填写广告收入后，该记录将变为<strong>已结算</strong>状态，对应的金额和积分将进入奖池。</text>
        </template>
      </el-alert>
      <el-form ref="revenueFormRef" :model="revenueFormData" :rules="revenueFormRules" label-width="100px">
        <el-form-item label="结算日期">
          <el-input v-model="revenueFormData.statement_date" disabled />
        </el-form-item>
        <el-form-item label="新增积分">
          <el-input v-model="revenueFormData.score_added" disabled />
        </el-form-item>
        <el-form-item label="广告收入" prop="ad_revenue">
          <el-input
            ref="revenueCashInputRef"
            v-model="revenueFormData.ad_revenue"
            type="number"
            min="0"
            class="text-left-input"
            style="width: 100%"
            placeholder="请输入广告收入金额"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="revenueFormData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="revenueDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleRevenueSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑备注弹窗 -->
    <el-dialog
      v-model="remarkDialogVisible"
      title="编辑备注"
      width="500px"
      destroy-on-close
    >
      <el-form ref="remarkFormRef" :model="remarkFormData" label-width="100px">
        <el-form-item label="结算日期">
          <el-input v-model="remarkFormData.statement_date" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="remarkFormData.remark"
            type="textarea"
            :rows="5"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleRemarkSubmit">确定</el-button>
      </template>
    </el-dialog>
  </view>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ElTableV2, ElAutoResizer, ElMessage } from 'element-plus'
import { Edit, Money, CaretTop, CaretBottom } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { columns, chartGroups } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// 图表相关
const chartRef = ref(null)
let chartInstance = null
const currentChartGroup = ref('revenue')
const hasChartData = computed(() => chartData.value && chartData.value.length > 0)

// ========== 配置 ==========
const pageConfig = reactive({
  title: '每日统计',
  subTitle: '查看每日运营数据统计'
})

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]

// ========== 状态 ==========
const loading = ref(false)
const dateRange = ref([])
const activeTab = ref('table') // 当前激活的tab
const tableContainer = ref(null)
const tableRef = ref(null)

const tableData = reactive({ list: [], total: 0 })
const pagination = reactive({ currentPage: 1, pageSize: 10 })

// 图表数据（不分页，用于显示完整趋势）
const chartData = ref([])

// 未结算提示
const unsettledCount = ref(0)

// 排序相关
const sortState = reactive({ field: '_id', order: 'desc' })

// 填写广告收入弹窗
const revenueDialogVisible = ref(false)
const submitLoading = ref(false)
const revenueCashInputRef = ref(null)
const revenueFormRef = ref(null)
const revenueFormData = ref({
  _id: '',
  statement_date: '',
  ad_revenue: 0,
  score_added: 0,
  remark: ''
})

const revenueFormRules = {
  ad_revenue: [{ required: true, message: '请输入广告收入', trigger: 'blur' }]
}

// 编辑备注弹窗
const remarkDialogVisible = ref(false)
const remarkFormRef = ref(null)
const remarkFormData = ref({
  _id: '',
  statement_date: '',
  remark: ''
})

// ========== 计算属性 ==========
const tableColumns = ref([...columns])

const computedColumns = computed(() => [
  { key: 'index', title: '序号', width: 70, align: 'center' },
  ...tableColumns.value,
  { key: 'actions', title: '操作', width: 200, align: 'center', fixed: 'right' }
])

// ========== 方法 ==========
const loadData = async () => {
  loading.value = true
  try {
    const data = {
      pageIndex: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    // 日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      data.startDate = dateRange.value[0]
      data.endDate = dateRange.value[1]
    }
    // 添加排序参数
    if (sortState.field && sortState.order) {
      data.sortField = sortState.field
      data.sortOrder = sortState.order
    }
    const res = await sfCo.action({
      name: 'admin/dailyStatistics/getList',
      data
    })
    tableData.list = res.list || []
    tableData.total = res.total || 0

    // 同时加载图表数据（不分页）
    loadChartData()
  } catch (e) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载图表数据（不分页，获取完整数据）
const loadChartData = async () => {
  try {
    const data = {
      pageIndex: 1,
      pageSize: 1000 // 获取足够多的数据用于图表显示
    }
    // 日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      data.startDate = dateRange.value[0]
      data.endDate = dateRange.value[1]
    }
    const res = await sfCo.action({
      name: 'admin/dailyStatistics/getList',
      data
    })
    chartData.value = res.list || []
    // 更新图表
    nextTick(() => updateChart())
  } catch (e) {
    console.error('加载图表数据失败', e)
  }
}

// 检查未结算数量
const checkUnsettled = async () => {
  try {
    const res = await sfCo.action({
      name: 'admin/dailyStatistics/getList',
      data: { is_settled: false, pageSize: 1 }
    })
    unsettledCount.value = res.total || 0
  } catch (e) {
    // 忽略错误
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  window.addEventListener('resize', handleResize)
}

// 更新图表
const updateChart = () => {
  if (!chartInstance || !chartData.value || chartData.value.length === 0) return

  const group = chartGroups.find(g => g.id === currentChartGroup.value)
  if (!group) return

  // 按日期升序排列
  const sortedList = [...chartData.value].sort((a, b) => a.statement_date.localeCompare(b.statement_date))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: group.fields.map(f => f.name),
      bottom: 0
    },
    grid: {
      left: 40,
      right: 40,
      top: 30,
      bottom: 30,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: sortedList.map(item => item.statement_date),
      axisLabel: { color: '#666' },
      axisLine: { lineStyle: { color: '#ddd' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#666' },
      splitLine: { lineStyle: { color: '#eee' } }
    },
    series: group.fields.map(field => ({
      name: field.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: field.color, width: 2 },
      itemStyle: { color: field.color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: field.color + '40' },
          { offset: 1, color: field.color + '05' }
        ])
      },
      data: sortedList.map(item => item[field.key] || 0)
    }))
  }

  chartInstance.setOption(option, true)
}

// 图表自适应
const handleResize = () => {
  chartInstance?.resize()
}

// 销毁图表
const destroyChart = () => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
}

const formatNumber = (num) => (num == null ? '-' : num.toLocaleString())

const formatMoney = (num) => {
  if (num == null) return '-'
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getRowClass = ({ rowIndex }) => (rowIndex % 2 === 0 ? 'row-even' : 'row-odd')

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleReset = () => {
  dateRange.value = []
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

// 填写广告收入
const handleFillRevenue = (row) => {
  revenueFormData.value = {
    _id: row._id,
    statement_date: row.statement_date,
    ad_revenue: row.ad_revenue || "",
    score_added: row.score_added || 0,
    remark: row.remark || ''
  }
  revenueDialogVisible.value = true
  setTimeout(() => {
    revenueCashInputRef.value?.focus()
  }, 300);
}

const handleRevenueSubmit = async () => {
  try {
    await revenueFormRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    await sfCo.action({
      name: 'admin/dailyStatistics/fillRevenue',
      data: {
        _id: revenueFormData.value._id,
        ad_revenue: Number(revenueFormData.value.ad_revenue),
        score_added: Number(revenueFormData.value.score_added),
        remark: revenueFormData.value.remark
      }
    })
    ElMessage.success('填写成功')
    revenueDialogVisible.value = false
    loadData()
    checkUnsettled()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 编辑备注
const handleEditRemark = (row) => {
  remarkFormData.value = {
    _id: row._id,
    statement_date: row.statement_date,
    remark: row.remark || ''
  }
  remarkDialogVisible.value = true
}

const handleRemarkSubmit = async () => {
  submitLoading.value = true
  try {
    await sfCo.action({
      name: 'admin/dailyStatistics/updateRemark',
      data: {
        _id: remarkFormData.value._id,
        remark: remarkFormData.value.remark
      }
    })
    ElMessage.success('备注更新成功')
    remarkDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 监听tab切换
watch(activeTab, (newTab) => {
  if (newTab === 'chart') {
    nextTick(() => {
      if (!chartInstance) {
        initChart()
      }
      updateChart()
    })
  }
})

// ========== 生命周期 ==========
onLoad(() => {
  loadData()
  checkUnsettled()
})

onMounted(() => {
  // 如果默认显示图表tab，则初始化图表
  if (activeTab.value === 'chart') {
    nextTick(() => {
      initChart()
    })
  }
})

onUnmounted(() => {
  destroyChart()
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
  height: calc(100vh - 90px);
}

.unsettled-alert {
  margin-bottom: 16px;
  flex-shrink: 0;

  strong {
    color: #e6a23c;
    font-size: 16px;
  }
}


.content-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  :deep(.main-tabs) {
    display: flex;
    flex-direction: column;
    height: 100%;

    .el-tabs__header {
      margin-bottom: 16px;
    }

    .el-tabs__content {
      flex: 1;
      overflow: hidden;
    }

    .el-tab-pane {
      height: 100%;
      display: flex;
      flex-direction: column;
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
  flex-shrink: 0;

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
  display: flex;
  flex-direction: column;

  .virtual-table-wrapper {
    flex: 1;
    min-height: 0;

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

.cell-content {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.money-text {
  color: #e6a23c;
  font-weight: 500;
}

.score-text {
  color: #409eff;
  font-weight: 500;
}

.chart-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .chart-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
    flex-shrink: 0;

    .chart-tabs {
      display: flex;
      align-items: center;
    }
  }

  .chart-container {
    flex: 1;
    width: 100%;
    position: relative;
    min-height: 0;

    .chart-dom {
      width: 100%;
      height: 100%;
    }

    .el-empty {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 12px 24px;
  border-radius: 0 0 8px 8px;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
  border-top: 1px solid #f0f2f5;

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

          .card-title {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
          }
        }

        .card-index {
          font-size: 12px;
          color: #909399;
        }
      }

      .card-body {
        margin-bottom: 12px;

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
            &.price {
              color: #e6a23c;
              font-weight: 500;
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
/* 广告收入输入框文字左对齐 */
:deep(.text-left-input) {
  .el-input__inner {
    text-align: left !important;
  }
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.mobile-card {
  /* ... */
  .card-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid #f0f2f5;
    padding-top: 12px;
    margin-top: 12px;
  }
}
</style>
