<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <page-header :title="pageConfig.title" :sub-title="pageConfig.subTitle" />

    <!-- 工具栏区域 -->
    <view class="toolbar">
      <view class="toolbar-left">
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
                  <template v-else-if="column.key === 'type'">
                    <el-tag :type="rowData[column.key] === 1 ? 'success' : 'danger'" size="small" :disable-transitions="true">
                      {{ rowData[column.key] === 1 ? '收入' : '支出' }}
                    </el-tag>
                  </template>
                  <template v-else-if="column.key === 'score'">
                    <span :class="rowData.type === 1 ? 'score-income' : 'score-expense'">
                      {{ rowData.type === 1 ? '+' : '-' }}{{ Math.abs(rowData[column.key]) }}
                    </span>
                  </template>
                  <template v-else-if="column.key === 'balance'">
                    <span class="balance-text">{{ formatNumber(rowData[column.key]) }}</span>
                  </template>
                  <template v-else-if="column.key === 'source'">
                    <el-tag :type="getSourceType(rowData[column.key])" size="small" :disable-transitions="true">
                      {{ getSourceLabel(rowData[column.key]) }}
                    </el-tag>
                  </template>
                  <template v-else-if="column.key === 'create_date'">
                    {{ formatDate(rowData[column.key]) }}
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <view class="row-actions">
                      <el-button type="primary" size="small" link @click="handleEdit(rowData)">备注</el-button>
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
                <el-tag :type="item.type === 1 ? 'success' : 'danger'" size="small">
                  {{ item.type === 1 ? '收入' : '支出' }}
                </el-tag>
                <el-tag :type="getSourceType(item.source)" size="small">
                  {{ getSourceLabel(item.source) }}
                </el-tag>
              </view>
              <text class="card-index">#{{ (pagination.currentPage - 1) * pagination.pageSize + index + 1 }}</text>
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="label">用户ID</text>
                <text class="value">{{ item.user_id || '-' }}</text>
              </view>
              <view class="info-row">
                <text class="label">积分变化</text>
                <text :class="['value', item.type === 1 ? 'score-income' : 'score-expense']">
                  {{ item.type === 1 ? '+' : '-' }}{{ Math.abs(item.score) }}
                </text>
              </view>
              <view class="info-row">
                <text class="label">余额</text>
                <text class="value balance-text">{{ formatNumber(item.balance) }}</text>
              </view>
              <view class="info-row">
                <text class="label">时间</text>
                <text class="value">{{ formatDate(item.create_date) }}</text>
              </view>
            </view>

            <view class="card-footer">
              <el-button type="primary" link size="small" @click="handleEdit(item)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
            </view>
          </view>
        </template>
        <el-empty v-else description="暂无数据" />
      </div>
    </view>

    <!-- 底部区域 -->
    <view class="table-footer">
      <view class="footer-left">
      </view>
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

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑备注"
      width="500px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" label-width="80px">
        <el-form-item label="备注" prop="comment">
          <el-input v-model="formData.comment" type="textarea" placeholder="请输入备注" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </view>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ElTableV2, ElAutoResizer, ElMessage } from 'element-plus'
import { Search, Edit, CaretTop, CaretBottom } from '@element-plus/icons-vue'
import { columns } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// ========== 配置 ==========
const pageConfig = reactive({
  title: '积分记录',
  subTitle: '管理用户积分变动记录',
  searchPlaceholder: '搜索用户ID...'
})

const sourceMap = {
  'ad_watch': '观看广告',
  'sign_in': '签到奖励',
  'team_reward': '团队奖励',
  'exchange': '兑换商品',
  'withdraw': '提现',
  'withdraw_fee_return': '提现手续费返还',
  'admin_adjust': '管理员调整',
  'withdraw_refund': '提现拒绝后退还'
}

// ========== 状态 ==========
const loading = ref(false)
const searchVal = ref('')
const tableHeight = ref(500)
const tableContainer = ref(null)
const tableRef = ref(null)
const formRef = ref(null)

const tableData = reactive({ list: [], total: 0 })
const pagination = reactive({ currentPage: 1, pageSize: 20 })

// 排序相关
const sortState = reactive({ field: '', order: '' })

// 弹窗相关
const dialogVisible = ref(false)
const submitLoading = ref(false)

const formData = ref({
  _id: '',
  comment: ''
})

// ========== 计算属性 ==========
const tableColumns = ref([...columns])

const computedColumns = computed(() => [
  { key: 'index', title: '序号', width: 70, align: 'center' },
  ...tableColumns.value,
  { key: 'actions', title: '操作', width: 80, align: 'center', fixed: 'right' }
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
    // 添加排序参数
    if (sortState.field && sortState.order) {
      data.sortField = sortState.field
      data.sortOrder = sortState.order
    }
    const res = await sfCo.action({
      name: 'admin/scores/getList',
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

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getSourceLabel = (source) => {
  return sourceMap[source] || source || '-'
}

const getSourceType = (source) => {
  const map = {
    'ad_watch': 'success',
    'sign_in': 'success',
    'team_reward': 'warning',
    'exchange': 'info',
    'withdraw': 'danger',
    'withdraw_fee_return': 'success',
    'admin_adjust': '',
    'withdraw_refund': 'warning'
  }
  return map[source] || 'info'
}

const getRowClass = ({ rowIndex }) => (rowIndex % 2 === 0 ? 'row-even' : 'row-odd')

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleReset = () => {
  searchVal.value = ''
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

// 编辑
const handleEdit = (row) => {
  formData.value = {
    _id: row._id,
    comment: row.comment || ''
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  submitLoading.value = true
  try {
    await sfCo.action({
      name: 'admin/scores/update',
      data: {
        _id: formData.value._id,
        comment: formData.value.comment
      }
    })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
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

.score-income {
  color: #67c23a;
  font-weight: 500;
}

.score-expense {
  color: #f56c6c;
  font-weight: 500;
}

.balance-text {
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

    .selected-info {
      color: #409eff;
      font-size: 14px;
      margin-left: 8px;
    }
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
