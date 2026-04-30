<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <page-header :title="pageConfig.title" :sub-title="pageConfig.subTitle" />

    <!-- 工具栏区域 -->
    <view class="toolbar">
      <view class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <!-- 筛选标签 -->
        <el-tag v-if="userFilter" closable @close="handleClearFilter" type="info" size="large">
          <view class="parent-filter-tag">
            <el-avatar :size="20" :src="userFilter.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span>{{ filterType === 'parent' ? '查看上级：' : '' }}{{ userFilter.nickname || userFilter.username }}{{ filterType === 'children' ? '的下级' : '' }}</span>
          </view>
        </el-tag>
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
                <template v-if="column.key === 'selection'">
                  <el-checkbox
                    :model-value="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @change="handleSelectAll"
                  />
                </template>
                <template v-else-if="column.sortable">
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
                  <template v-if="column.key === 'selection'">
                    <el-checkbox
                      :model-value="isRowSelected(rowData)"
                      @change="(val) => handleRowSelect(rowData, val)"
                    />
                  </template>
                  <template v-else-if="column.key === 'index'">
                    {{ (pagination.currentPage - 1) * pagination.pageSize + rowIndex + 1 }}
                  </template>
                  <template v-else-if="column.key === 'avatar'">
                    <el-avatar :size="32" :src="rowData.avatar">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                  </template>
                  <template v-else-if="column.key === 'parent_info'">
                    <view v-if="rowData.parent_info" class="parent-info-cell">
                      <el-avatar :size="24" :src="rowData.parent_info.avatar">
                        <el-icon><User /></el-icon>
                      </el-avatar>
                      <span class="parent-name">{{ rowData.parent_info.nickname || rowData.parent_info.username || '-' }}</span>
                    </view>
                    <span v-else>-</span>
                  </template>
                  <template v-else-if="column.key === 'status'">
                    <el-tag :type="getStatusType(rowData.status)" size="small" :disable-transitions="true">
                      {{ getStatusText(rowData.status) }}
                    </el-tag>
                  </template>
                  <template v-else-if="column.key === 'register_date'">
                    {{ formatDate(rowData.register_date) }}
                  </template>
                  <template v-else-if="column.key === 'last_login_date'">
                    {{ formatDate(rowData.last_login_date) }}
                  </template>
                  <template v-else-if="column.key === 'score' || column.key === 'score_total' || column.key === 'score_withdrawn'">
                    {{ formatNumber(rowData[column.key]) }}
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <view class="row-actions">
                      <el-button type="primary" size="small" link @click="handleViewParent(rowData)" :disabled="!rowData.parent_info">上级</el-button>
                      <el-button type="primary" size="small" link @click="handleViewChildren(rowData)">下级</el-button>
                      <el-button type="primary" size="small" link @click="handleEdit(rowData)">编辑</el-button>
                      <el-button type="danger" size="small" link @click="handleDelete([rowData])">删除</el-button>
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
                <el-avatar :size="40" :src="item.avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <view class="user-info">
                  <text class="card-title">{{ item.nickname || item.username || '-' }}</text>
                  <text class="card-subtitle">{{ item.mobile || '-' }}</text>
                </view>
              </view>
              <el-tag size="small" :type="getStatusType(item.status)">{{ getStatusText(item.status) }}</el-tag>
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="label">用户名</text>
                <text class="value">{{ item.username || '-' }}</text>
              </view>
              <view class="info-row">
                <text class="label">上级</text>
                <view v-if="item.parent_info" class="value parent-info-cell">
                  <el-avatar :size="20" :src="item.parent_info.avatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <span>{{ item.parent_info.nickname || item.parent_info.username || '-' }}</span>
                </view>
                <text v-else class="value">-</text>
              </view>
              <view class="info-row">
                <text class="label">手机号</text>
                <text class="value">{{ item.mobile || '-' }}</text>
              </view>
              <view class="info-row">
                <text class="label">积分余额</text>
                <text class="value">{{ formatNumber(item.score) }}</text>
              </view>
              <view class="info-row">
                <text class="label">累计积分</text>
                <text class="value">{{ formatNumber(item.score_total) }}</text>
              </view>
              <view class="info-row">
                <text class="label">已提现积分</text>
                <text class="value">{{ formatNumber(item.score_withdrawn) }}</text>
              </view>
              <view class="info-row">
                <text class="label">注册时间</text>
                <text class="value">{{ formatDate(item.register_date) }}</text>
              </view>
              <view class="info-row">
                <text class="label">最后登录</text>
                <text class="value">{{ formatDate(item.last_login_date) }}</text>
              </view>
            </view>

            <view class="card-footer">
              <el-button type="primary" link size="small" @click="handleViewParent(item)" :disabled="!item.parent_info">
                上级
              </el-button>
              <el-button type="primary" link size="small" @click="handleViewChildren(item)">
                下级
              </el-button>
              <el-button type="primary" link size="small" @click="handleEdit(item)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete([item])">
                <el-icon><Delete /></el-icon> 删除
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
        <template v-if="selectedRows.length > 0">
          <el-button type="danger" size="small" @click="handleDelete(selectedRows)">批量删除</el-button>
          <span class="selected-info">已选择 {{ selectedRows.length }} 项</span>
        </template>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="formData.username" placeholder="请输入用户名" :disabled="dialogType === 'edit'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="formData.nickname" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="mobile">
              <el-input v-model="formData.mobile" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</el-radio>
          </el-radio-group>
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
import { ElTableV2, ElAutoResizer, ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete, User, CaretTop, CaretBottom } from '@element-plus/icons-vue'
import { columns } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// ========== 配置 ==========
const pageConfig = reactive({
  title: '用户管理',
  subTitle: '管理系统用户账号信息',
  searchPlaceholder: '搜索用户名、昵称、手机号...'
})

const statusOptions = [
  { value: 0, label: '正常' },
  { value: 1, label: '禁用' },
  { value: 2, label: '审核中' },
  { value: 3, label: '审核拒绝' }
]

// ========== 状态 ==========
const loading = ref(false)
const searchVal = ref('')
const tableHeight = ref(500)
const tableContainer = ref(null)
const tableRef = ref(null)
const formRef = ref(null)

const tableData = reactive({ list: [], total: 0 })
const selectedRows = ref([])
const pagination = reactive({ currentPage: 1, pageSize: 20 })

// 用户筛选相关
const userFilter = ref(null) // { _id, nickname, avatar, username }
const filterType = ref('') // 'parent' 查看上级 | 'children' 查看下级

// 排序相关
const sortState = reactive({ field: '', order: '' }) // order: 'asc' | 'desc' | ''

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitLoading = ref(false)

const getDefaultFormData = () => ({
  _id: '',
  username: '',
  nickname: '',
  mobile: '',
  email: '',
  status: 0
})

const formData = ref(getDefaultFormData())

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  mobile: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }]
}

// ========== 计算属性 ==========
const tableColumns = ref([...columns])

const computedColumns = computed(() => [
  { key: 'selection', title: '', width: 50, align: 'center' },
  { key: 'index', title: '序号', width: 70, align: 'center' },
  ...tableColumns.value,
  { key: 'actions', title: '操作', width: 220, align: 'center', fixed: 'right' }
])

const isAllSelected = computed(() => {
  if (!tableData.list.length) return false
  return tableData.list.every(row => isRowSelected(row))
})

const isIndeterminate = computed(() => {
  if (!tableData.list.length) return false
  const count = tableData.list.filter(row => isRowSelected(row)).length
  return count > 0 && count < tableData.list.length
})

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
    // 添加筛选参数
    if (userFilter.value) {
      if (filterType.value === 'children') {
        data.parent_id = userFilter.value._id
      } else if (filterType.value === 'parent') {
        data.user_id = userFilter.value._id
      }
    }
    const res = await sfCo.action({
      name: 'admin/user/getList',
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

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatNumber = (val) => {
  if (val === undefined || val === null) return '0'
  return val.toLocaleString()
}

const getStatusType = (status) => {
  const map = { 0: 'success', 1: 'danger', 2: 'warning', 3: 'info' }
  return map[status] || 'success'
}

const getStatusText = (status) => {
  const option = statusOptions.find(s => s.value === status)
  return option ? option.label : '正常'
}

const getRowClass = ({ rowIndex }) => (rowIndex % 2 === 0 ? 'row-even' : 'row-odd')

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  selectedRows.value = []
  loadData()
}

const handleReset = () => {
  searchVal.value = ''
  userFilter.value = null
  filterType.value = ''
  handleSearch()
}

// 查看上级
const handleViewParent = (row) => {
  if (row.parent_info) {
    userFilter.value = row.parent_info
    filterType.value = 'parent'
    pagination.currentPage = 1
    selectedRows.value = []
    loadData()
  }
}

// 查看下级
const handleViewChildren = (row) => {
  userFilter.value = {
    _id: row._id,
    nickname: row.nickname,
    avatar: row.avatar,
    username: row.username
  }
  filterType.value = 'children'
  pagination.currentPage = 1
  selectedRows.value = []
  loadData()
}

// 清除筛选
const handleClearFilter = () => {
  userFilter.value = null
  filterType.value = ''
  pagination.currentPage = 1
  loadData()
}

// 选择
const isRowSelected = (row) => selectedRows.value.some(r => r._id === row._id)

const handleRowSelect = (row, selected) => {
  if (selected) {
    if (!isRowSelected(row)) selectedRows.value.push(row)
  } else {
    selectedRows.value = selectedRows.value.filter(r => r._id !== row._id)
  }
}

const handleSelectAll = (selected) => {
  if (selected) {
    tableData.list.forEach(row => {
      if (!isRowSelected(row)) selectedRows.value.push(row)
    })
  } else {
    const ids = tableData.list.map(r => r._id)
    selectedRows.value = selectedRows.value.filter(r => !ids.includes(r._id))
  }
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

// 新增
const handleAdd = () => {
  dialogType.value = 'add'
  formData.value = getDefaultFormData()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogType.value = 'edit'
  formData.value = Object.assign({}, getDefaultFormData(), row)
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    const action = dialogType.value === 'add' ? 'admin/user/add' : 'admin/user/update'
    const submitData = { ...formData.value }
    if (dialogType.value === 'add') delete submitData._id
    await sfCo.action({ name: action, data: submitData })
    ElMessage.success(dialogType.value === 'add' ? '新增成功' : '编辑成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 删除
const handleDelete = (rows) => {
  const tip = rows.length > 3 ? `${rows.length} 条数据` : rows.map(r => r.nickname || r.username || r._id).join('、')

  ElMessageBox.confirm(`确定要删除 ${tip} 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    beforeClose: async (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true
        try {
          await sfCo.action({ name: 'admin/user/remove', data: { ids: rows.map(r => r._id) } })
          ElMessage.success('删除成功')
          selectedRows.value = selectedRows.value.filter(r => !rows.some(d => d._id === r._id))
          loadData()
          done()
        } catch (e) {
          ElMessage.error(e.message || '删除失败')
          instance.confirmButtonLoading = false
        }
      } else {
        done()
      }
    }
  }).catch(() => {})
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

.parent-info-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .parent-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.parent-filter-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sortable-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
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
          gap: 12px;

          .user-info {
            display: flex;
            flex-direction: column;

            .card-title {
              font-size: 16px;
              font-weight: 600;
              color: #303133;
            }

            .card-subtitle {
              font-size: 12px;
              color: #909399;
              margin-top: 2px;
            }
          }
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
