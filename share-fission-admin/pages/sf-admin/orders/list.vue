<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <page-header :title="pageConfig.title" :sub-title="pageConfig.subTitle" />

    <!-- 工具栏区域 -->
    <view class="toolbar">
      <view class="toolbar-left">
        <el-select v-model="statusFilter" placeholder="订单状态" clearable style="width: 120px" @change="handleSearch">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
                      {{ getStatusText(rowData[column.key]) }}
                    </el-tag>
                  </template>
                  <template v-else-if="column.key === 'score_cost'">
                    <span class="score-text">{{ formatNumber(rowData[column.key]) }}</span>
                  </template>
                  <template v-else-if="column.key === 'create_time'">
                    {{ formatTime(rowData[column.key]) }}
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <view class="row-actions">
                      <el-button type="primary" size="small" link @click="handleViewCardKey(rowData)">查看卡密</el-button>
                      <el-button
                        v-if="rowData.status === 'complete'"
                        type="warning"
                        size="small"
                        link
                        @click="handleRefund(rowData)"
                      >退款</el-button>
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
                <text class="card-title">{{ item.goods_name }}</text>
                <el-tag size="small" :type="getStatusType(item.status)">{{ getStatusText(item.status) }}</el-tag>
              </view>
              <text class="card-index">#{{ (pagination.currentPage - 1) * pagination.pageSize + index + 1 }}</text>
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="label">订单编号</text>
                <text class="value">{{ item.order_no }}</text>
              </view>
              <view class="info-row">
                <text class="label">用户昵称</text>
                <text class="value">{{ item.user_nickname || '-' }}</text>
              </view>
              <view class="info-row">
                <text class="label">消耗积分</text>
                <text class="value price">{{ formatNumber(item.score_cost) }}</text>
              </view>
              <view class="info-row">
                <text class="label">下单时间</text>
                <text class="value">{{ formatTime(item.create_time) }}</text>
              </view>
            </view>

            <view class="card-footer">
              <el-button type="primary" link size="small" @click="handleViewCardKey(item)">
                <el-icon><Ticket /></el-icon> 查看卡密
              </el-button>
              <el-button v-if="item.status === 'complete'" type="warning" link size="small" @click="handleRefund(item)">
                <el-icon><RefreshLeft /></el-icon> 退款
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

    <!-- 查看卡密弹窗 -->
    <el-dialog
      v-model="cardKeyDialogVisible"
      title="卡密信息"
      width="500px"
      destroy-on-close
    >
      <div v-loading="cardKeyLoading">
        <template v-if="cardKeyInfo">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="卡号">
              <div class="copy-field">
                <span>{{ cardKeyInfo.card_no || '-' }}</span>
                <el-button v-if="cardKeyInfo.card_no" type="primary" size="small" link @click="copyText(cardKeyInfo.card_no)">复制</el-button>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="卡密">
              <div class="copy-field">
                <span>{{ cardKeyInfo.card_pwd || '-' }}</span>
                <el-button v-if="cardKeyInfo.card_pwd" type="primary" size="small" link @click="copyText(cardKeyInfo.card_pwd)">复制</el-button>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="兑换地址">
              <div class="copy-field">
                <span>{{ cardKeyInfo.exchange_url || '-' }}</span>
                <el-button v-if="cardKeyInfo.exchange_url" type="primary" size="small" link @click="copyText(cardKeyInfo.exchange_url)">复制</el-button>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="cardKeyInfo.status === 1 ? 'success' : 'info'" size="small">
                {{ cardKeyInfo.status === 1 ? '已发放' : '未发放' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="使用时间">
              {{ cardKeyInfo.used_time ? formatTime(cardKeyInfo.used_time) : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </template>
        <el-empty v-else description="暂无卡密信息" />
      </div>
      <template #footer>
        <el-button @click="cardKeyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </view>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ElTableV2, ElAutoResizer, ElMessage, ElMessageBox } from 'element-plus'
import { Search, CaretTop, CaretBottom, Ticket, RefreshLeft } from '@element-plus/icons-vue'
import { columns, statusOptions } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// ========== 配置 ==========
const pageConfig = reactive({
  title: '订单管理',
  subTitle: '查看订单记录，支持退款和查看卡密',
  searchPlaceholder: '搜索订单号、商品名...'
})

// ========== 状态 ==========
const loading = ref(false)
const searchVal = ref('')
const statusFilter = ref('')
const tableHeight = ref(500)
const tableContainer = ref(null)
const tableRef = ref(null)

const tableData = reactive({ list: [], total: 0 })
const pagination = reactive({ currentPage: 1, pageSize: 20 })

// 排序相关
const sortState = reactive({ field: 'create_time', order: 'desc' })

// 卡密弹窗相关
const cardKeyDialogVisible = ref(false)
const cardKeyLoading = ref(false)
const cardKeyInfo = ref(null)

// ========== 计算属性 ==========
const tableColumns = ref([...columns])

const computedColumns = computed(() => [
  { key: 'index', title: '序号', width: 70, align: 'center' },
  ...tableColumns.value,
  { key: 'actions', title: '操作', width: 160, align: 'center', fixed: 'right' }
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
      keyword: searchVal.value.trim(),
      status: statusFilter.value
    }
    // 添加排序参数
    if (sortState.field && sortState.order) {
      data.sortField = sortState.field
      data.sortOrder = sortState.order
    }
    const res = await sfCo.action({
      name: 'admin/orders/getList',
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

const formatNumber = (num) => (num == null ? '-' : num.toLocaleString())

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const getStatusType = (status) => {
  const map = { 'complete': 'success', 'cancel': 'warning' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { 'complete': '已完成', 'cancel': '已退款' }
  return map[status] || status
}

const getRowClass = ({ rowIndex }) => (rowIndex % 2 === 0 ? 'row-even' : 'row-odd')

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleReset = () => {
  searchVal.value = ''
  statusFilter.value = ''
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

// 查看卡密
const handleViewCardKey = async (row) => {
  cardKeyDialogVisible.value = true
  cardKeyLoading.value = true
  cardKeyInfo.value = null
  try {
    const res = await sfCo.action({
      name: 'admin/orders/getCardKey',
      data: { order_id: row._id }
    })
    cardKeyInfo.value = res
  } catch (e) {
    ElMessage.error(e.message || '获取卡密信息失败')
  } finally {
    cardKeyLoading.value = false
  }
}

// 复制文本
const copyText = (text) => {
  uni.setClipboardData({
    data: text,
    success: () => {
      ElMessage.success('复制成功')
    },
    fail: () => {
      ElMessage.error('复制失败')
    }
  })
}

// 退款
const handleRefund = (row) => {
  ElMessageBox.confirm(
    `确定要退款订单 ${row.order_no} 吗？退款后将退还 ${row.score_cost} 积分给用户。`,
    '退款确认',
    {
      confirmButtonText: '确定退款',
      cancelButtonText: '取消',
      type: 'warning',
      beforeClose: async (action, instance, done) => {
        if (action === 'confirm') {
          instance.confirmButtonLoading = true
          try {
            await sfCo.action({
              name: 'admin/orders/refund',
              data: { order_id: row._id }
            })
            ElMessage.success('退款成功')
            loadData()
            done()
          } catch (e) {
            ElMessage.error(e.message || '退款失败')
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

.score-text {
  color: #409eff;
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

.copy-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  span {
    word-break: break-all;
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
              color: #409eff;
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
