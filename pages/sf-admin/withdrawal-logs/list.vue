<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <page-header :title="pageConfig.title" :sub-title="pageConfig.subTitle" />

    <!-- 工具栏区域 -->
    <view class="toolbar">
      <view class="toolbar-left">
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 120px" @change="handleSearch">
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </view>
      <view class="toolbar-right">
        <el-input
          v-model="searchVal"
          :placeholder="pageConfig.searchPlaceholder"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
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
                  <template v-else-if="column.key === 'status'">
                    <el-tag :type="getStatusType(rowData[column.key])" size="small" :disable-transitions="true">
                      {{ getStatusLabel(rowData[column.key]) }}
                    </el-tag>
                  </template>
                  <template v-else-if="column.key === 'method'">
                    {{ getMethodLabel(rowData[column.key]) }}
                  </template>
                  <template v-else-if="column.key === 'account_name'">
                    {{ rowData.account_info?.name || '-' }}
                  </template>
                  <template v-else-if="column.key === 'account'">
                    {{ rowData.account_info?.account || '-' }}
                  </template>
                  <template v-else-if="column.key === 'amount' || column.key === 'fee' || column.key === 'actual_amount'">
                    <span class="amount-text">¥ {{ formatNumber(rowData[column.key]) }}</span>
                  </template>
                  <template v-else-if="column.key === 'create_time'">
                    {{ formatTime(rowData[column.key]) }}
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <view class="row-actions">
                      <el-button type="primary" size="small" link @click="handleView(rowData)">查看</el-button>
                      <el-button
                        v-if="rowData.status === 0"
                        type="success"
                        size="small"
                        link
                        @click="handleAudit(rowData, 1)"
                      >通过</el-button>
                      <el-button
                        v-if="rowData.status === 0"
                        type="danger"
                        size="small"
                        link
                        @click="handleAudit(rowData, 2)"
                      >拒绝</el-button>
                      <el-button
                        v-if="rowData.status === 1"
                        type="warning"
                        size="small"
                        link
                        @click="handlePay(rowData)"
                      >打款</el-button>
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
                <text class="card-title">{{ item.account_info?.name || '未知用户' }}</text>
                <el-tag size="small" :type="getStatusType(item.status)">{{ getStatusLabel(item.status) }}</el-tag>
              </view>
              <text class="card-index">#{{ (pagination.currentPage - 1) * pagination.pageSize + index + 1 }}</text>
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="label">提现积分</text>
                <text class="value">{{ item.score }}</text>
              </view>
              <view class="info-row">
                <text class="label">提现金额</text>
                <text class="value price">¥ {{ formatNumber(item.amount) }}</text>
              </view>
              <view class="info-row">
                <text class="label">实际到账</text>
                <text class="value price">¥ {{ formatNumber(item.actual_amount) }}</text>
              </view>
              <view class="info-row">
                <text class="label">提现方式</text>
                <text class="value">{{ getMethodLabel(item.method) }}</text>
              </view>
              <view class="info-row">
                <text class="label">收款账号</text>
                <text class="value">{{ item.account_info?.account || '-' }}</text>
              </view>
              <view class="info-row">
                <text class="label">申请时间</text>
                <text class="value">{{ formatTime(item.create_time) }}</text>
              </view>
            </view>

            <view class="card-footer">
              <el-button type="primary" link size="small" @click="handleView(item)">
                <el-icon><View /></el-icon> 查看
              </el-button>
              <el-button v-if="item.status === 0" type="success" link size="small" @click="handleAudit(item, 1)">
                <el-icon><Check /></el-icon> 通过
              </el-button>
              <el-button v-if="item.status === 0" type="danger" link size="small" @click="handleAudit(item, 2)">
                <el-icon><Close /></el-icon> 拒绝
              </el-button>
              <el-button v-if="item.status === 1" type="warning" link size="small" @click="handlePay(item)">
                <el-icon><Money /></el-icon> 打款
              </el-button>
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

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="提现详情"
      width="600px"
      destroy-on-close
    >
      <el-descriptions :column="2" border v-if="currentRow">
        <el-descriptions-item label="记录ID" :span="2">{{ currentRow._id }}</el-descriptions-item>
        <el-descriptions-item label="用户ID" :span="2">{{ currentRow.user_id }}</el-descriptions-item>
        <el-descriptions-item label="提现积分">{{ currentRow.score }}</el-descriptions-item>
        <el-descriptions-item label="兑换比例">{{ currentRow.exchange_rate }} 元/积分</el-descriptions-item>
        <el-descriptions-item label="提现金额">¥ {{ formatNumber(currentRow.amount) }}</el-descriptions-item>
        <el-descriptions-item label="手续费率">{{ (currentRow.fee_rate * 100).toFixed(1) }}%</el-descriptions-item>
        <el-descriptions-item label="手续费">¥ {{ formatNumber(currentRow.fee) }}</el-descriptions-item>
        <el-descriptions-item label="实际到账">¥ {{ formatNumber(currentRow.actual_amount) }}</el-descriptions-item>
        <el-descriptions-item label="提现方式">{{ getMethodLabel(currentRow.method) }}</el-descriptions-item>
        <el-descriptions-item label="收款人">{{ currentRow.account_info?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收款账号" :span="2">{{ currentRow.account_info?.account || '-' }}</el-descriptions-item>
        <el-descriptions-item label="银行名称" :span="2" v-if="currentRow.method === 'bank_card'">
          {{ currentRow.account_info?.bank_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRow.status)" size="small">{{ getStatusLabel(currentRow.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatTime(currentRow.create_time) }}</el-descriptions-item>
        <el-descriptions-item label="审核时间" v-if="currentRow.audit_time">{{ formatTime(currentRow.audit_time) }}</el-descriptions-item>
        <el-descriptions-item label="打款时间" v-if="currentRow.pay_time">{{ formatTime(currentRow.pay_time) }}</el-descriptions-item>
        <el-descriptions-item label="拒绝原因" :span="2" v-if="currentRow.status === 2 && currentRow.reject_reason">
          {{ currentRow.reject_reason }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝原因弹窗 -->
    <el-dialog
      v-model="rejectVisible"
      title="拒绝提现"
      width="500px"
      destroy-on-close
    >
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-width="80px">
        <el-form-item label="拒绝原因" prop="reject_reason">
          <el-input
            v-model="rejectForm.reject_reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitLoading" @click="handleRejectSubmit">确认拒绝</el-button>
      </template>
    </el-dialog>
  </view>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ElTableV2, ElAutoResizer, ElMessage, ElMessageBox } from 'element-plus'
import { Search, CaretTop, CaretBottom, View, Check, Close, Money } from '@element-plus/icons-vue'
import { columns } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// ========== 配置 ==========
const pageConfig = reactive({
  title: '提现记录',
  subTitle: '管理用户提现申请，支持审核和打款操作',
  searchPlaceholder: '搜索用户ID、收款账号...'
})

const statusOptions = [
  { label: '待审核', value: 0 },
  { label: '已通过', value: 1 },
  { label: '已拒绝', value: 2 },
  { label: '已打款', value: 3 }
]

// ========== 状态 ==========
const loading = ref(false)
const searchVal = ref('')
const filterStatus = ref('')
const tableHeight = ref(500)
const tableContainer = ref(null)
const tableRef = ref(null)

const tableData = reactive({ list: [], total: 0 })
const pagination = reactive({ currentPage: 1, pageSize: 20 })

// 排序相关
const sortState = reactive({ field: 'create_time', order: 'desc' })

// 详情弹窗
const detailVisible = ref(false)
const currentRow = ref(null)

// 拒绝弹窗
const rejectVisible = ref(false)
const rejectFormRef = ref(null)
const rejectForm = reactive({ _id: '', reject_reason: '' })
const rejectRules = {
  reject_reason: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }]
}

const submitLoading = ref(false)

// ========== 计算属性 ==========
const tableColumns = ref([...columns])

const computedColumns = computed(() => [
  { key: 'index', title: '序号', width: 70, align: 'center' },
  ...tableColumns.value,
  { key: 'actions', title: '操作', width: 180, align: 'center', fixed: 'right' }
])

// ========== 方法 ==========
const calculateTableHeight = () => {
  nextTick(() => {
    const windowHeight = uni.getSystemInfoSync().windowHeight
    const container = tableContainer.value?.$el || tableContainer.value
    tableHeight.value = container
      ? windowHeight - container.getBoundingClientRect().top - 100
      : windowHeight - 280
  })
}

const loadData = async () => {
  loading.value = true
  try {
    const data = {
      pageIndex: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchVal.value.trim()
    }
    // 状态筛选
    if (filterStatus.value !== '' && filterStatus.value !== null) {
      data.status = filterStatus.value
    }
    // 添加排序参数
    if (sortState.field && sortState.order) {
      data.sortField = sortState.field
      data.sortOrder = sortState.order
    }
    const res = await sfCo.action({
      name: 'admin/withdrawalLogs/getList',
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

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const getStatusType = (status) => {
  const map = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'primary' }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = { 0: '待审核', 1: '已通过', 2: '已拒绝', 3: '已打款' }
  return map[status] || '未知'
}

const getMethodLabel = (method) => {
  const map = { 'bank_card': '银行卡', 'alipay': '支付宝' }
  return map[method] || method || '-'
}

const getRowClass = ({ rowIndex }) => (rowIndex % 2 === 0 ? 'row-even' : 'row-odd')

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleReset = () => {
  searchVal.value = ''
  filterStatus.value = ''
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

// 查看详情
const handleView = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

// 审核
const handleAudit = (row, status) => {
  if (status === 2) {
    // 拒绝需要填写原因
    rejectForm._id = row._id
    rejectForm.reject_reason = ''
    rejectVisible.value = true
  } else {
    // 通过
    ElMessageBox.confirm('确定要通过此提现申请吗？', '审核确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      beforeClose: async (action, instance, done) => {
        if (action === 'confirm') {
          instance.confirmButtonLoading = true
          try {
            await sfCo.action({
              name: 'admin/withdrawalLogs/audit',
              data: { _id: row._id, status: 1 }
            })
            ElMessage.success('审核通过')
            loadData()
            done()
          } catch (e) {
            ElMessage.error(e.message || '操作失败')
            instance.confirmButtonLoading = false
          }
        } else {
          done()
        }
      }
    }).catch(() => {})
  }
}

// 拒绝提交
const handleRejectSubmit = async () => {
  try {
    await rejectFormRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    await sfCo.action({
      name: 'admin/withdrawalLogs/audit',
      data: {
        _id: rejectForm._id,
        status: 2,
        reject_reason: rejectForm.reject_reason
      }
    })
    ElMessage.success('已拒绝')
    rejectVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 打款
const handlePay = (row) => {
  ElMessageBox.confirm(
    `确定已完成打款？\n收款人：${row.account_info?.name}\n收款账号：${row.account_info?.account}\n打款金额：¥${formatNumber(row.actual_amount)}`,
    '打款确认',
    {
      confirmButtonText: '确认已打款',
      cancelButtonText: '取消',
      type: 'warning',
      beforeClose: async (action, instance, done) => {
        if (action === 'confirm') {
          instance.confirmButtonLoading = true
          try {
            await sfCo.action({
              name: 'admin/withdrawalLogs/pay',
              data: { _id: row._id }
            })
            ElMessage.success('打款成功')
            loadData()
            done()
          } catch (e) {
            ElMessage.error(e.message || '操作失败')
            instance.confirmButtonLoading = false
          }
        } else {
          done()
        }
      }
    }
  ).catch(() => {})
}

// ========== 生命周期 ==========
onLoad(() => {
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

      .el-table-v2__row:hover .row-actions {
        opacity: 1;
      }
    }
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

.amount-text {
  color: #f56c6c;
  font-weight: 500;
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

    .el-input {
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
              color: #f56c6c;
              font-weight: 500;
            }
          }
        }
      }

      .card-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        border-top: 1px solid #f0f2f5;
        padding-top: 12px;
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

        /* Mobile: show only total, prev, next */
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
