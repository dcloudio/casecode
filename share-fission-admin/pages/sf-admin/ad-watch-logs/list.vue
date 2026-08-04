<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <page-header :title="pageConfig.title" :sub-title="pageConfig.subTitle" />

    <!-- 工具栏区域 -->
    <view class="toolbar">
      <view class="toolbar-left"></view>
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
                  <template v-else-if="column.key === 'user_info'">
                    <view class="user-info-cell">
                      <el-avatar :size="32" :src="rowData.user_avatar" v-if="rowData.user_avatar">
                        <template #default>
                          <el-icon><User /></el-icon>
                        </template>
                      </el-avatar>
                      <el-avatar :size="32" v-else>
                        <el-icon><User /></el-icon>
                      </el-avatar>
                      <view class="user-text">
                        <span class="user-nickname">{{ rowData.user_nickname || '未知用户' }}</span>
                        <span class="user-id">{{ rowData.user_id }}</span>
                      </view>
                    </view>
                  </template>
                  <template v-else-if="column.key === 'is_realtime'">
                    <el-tag :type="rowData[column.key] ? 'success' : 'info'" size="small" :disable-transitions="true">
                      {{ rowData[column.key] ? '是' : '否' }}
                    </el-tag>
                  </template>
                  <template v-else-if="column.key === 'score'">
                    <span class="score-text">{{ rowData[column.key] ?? '-' }}</span>
                  </template>
                  <template v-else-if="column.key === 'revenue'">
                    <span class="revenue-text">{{ rowData[column.key] != null ? '¥ ' + rowData[column.key].toFixed(4) : '-' }}</span>
                  </template>
                  <template v-else-if="column.key === 'watch_time' || column.key === 'create_time'">
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
                <text class="card-title">{{ item.ad_type || '广告' }}</text>
                <el-tag size="small" :type="item.is_realtime ? 'success' : 'info'">{{ item.is_realtime ? '实时' : '非实时' }}</el-tag>
              </view>
              <text class="card-index">#{{ (pagination.currentPage - 1) * pagination.pageSize + index + 1 }}</text>
            </view>

            <view class="card-body">
              <view class="info-row user-row">
                <text class="label">用户</text>
                <view class="user-info-mobile">
                  <el-avatar :size="24" :src="item.user_avatar" v-if="item.user_avatar">
                    <template #default>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-avatar>
                  <el-avatar :size="24" v-else>
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <text class="value">{{ item.user_nickname || item.user_username || '未知用户' }}</text>
                </view>
              </view>
              <view class="info-row">
                <text class="label">获得积分</text>
                <text class="value score">{{ item.score ?? '-' }}</text>
              </view>
              <view class="info-row">
                <text class="label">广告收益</text>
                <text class="value price">{{ item.revenue != null ? '¥ ' + item.revenue.toFixed(4) : '-' }}</text>
              </view>
              <view class="info-row">
                <text class="label">观看时间</text>
                <text class="value">{{ formatTime(item.watch_time) }}</text>
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
import { Search, CaretTop, CaretBottom, User } from '@element-plus/icons-vue'
import { columns } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// ========== 配置 ==========
const pageConfig = reactive({
  title: '广告观看记录',
  subTitle: '查看用户广告观看记录及积分收益',
  searchPlaceholder: '搜索用户ID、广告ID...'
})

// ========== 状态 ==========
const loading = ref(false)
const searchVal = ref('')
const tableHeight = ref(500)
const tableContainer = ref(null)
const tableRef = ref(null)

const tableData = reactive({ list: [], total: 0 })
const pagination = reactive({ currentPage: 1, pageSize: 20 })

// 排序相关
const sortState = reactive({ field: 'watch_time', order: 'desc' }) // order: 'asc' | 'desc' | ''

// ========== 计算属性 ==========
const tableColumns = ref([...columns])

const computedColumns = computed(() => [
  { key: 'index', title: '序号', width: 70, align: 'center' },
  ...tableColumns.value
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
      name: 'admin/adWatchLogs/getList',
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

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
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
    // 同一字段：asc -> desc -> 无排序
    if (sortState.order === 'asc') {
      sortState.order = 'desc'
    } else if (sortState.order === 'desc') {
      sortState.field = ''
      sortState.order = ''
    } else {
      sortState.order = 'asc'
    }
  } else {
    // 切换字段，默认升序
    sortState.field = field
    sortState.order = 'asc'
  }
  pagination.currentPage = 1
  loadData()
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

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;

  .user-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    .user-nickname {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }

    .user-id {
      font-size: 12px;
      color: #909399;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.score-text {
  color: #409eff;
  font-weight: 500;
}

.revenue-text {
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

          &.user-row {
            align-items: center;
          }

          .label {
            color: #909399;
          }
          .value {
            color: #606266;
            &.price {
              color: #f56c6c;
              font-weight: 500;
            }
            &.score {
              color: #409eff;
              font-weight: 500;
            }
          }

          .user-info-mobile {
            display: flex;
            align-items: center;
            gap: 8px;
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
