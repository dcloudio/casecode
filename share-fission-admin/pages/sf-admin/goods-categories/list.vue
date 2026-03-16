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
        <el-button @click="expandAll">展开全部</el-button>
        <el-button @click="collapseAll">折叠全部</el-button>
      </view>
      <view class="toolbar-right">
        <el-select v-model="filterParentId" placeholder="选择父分类" clearable style="width: 160px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="顶级分类" value="top" />
          <el-option v-for="item in parentCategories" :key="item._id" :label="item.name" :value="item._id" />
        </el-select>
        <el-input
          v-model="searchVal"
          :placeholder="pageConfig.searchPlaceholder"
          clearable
          style="width: 180px"
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
                    {{ rowIndex + 1 }}
                  </template>
                  <template v-else-if="column.key === 'name'">
                    <view class="tree-cell" :style="{ paddingLeft: (rowData.level - 1) * 20 + 'px' }">
                      <span class="expand-icon" @click.stop="toggleExpand(rowData)" v-if="rowData.hasChildren">
                        <el-icon><ArrowRight v-if="!rowData.isExpanded" /><ArrowDown v-else /></el-icon>
                      </span>
                      <span class="expand-placeholder" v-else></span>
                      <span>{{ rowData.name }}</span>
                    </view>
                  </template>
                  <template v-else-if="column.key === 'parent_name'">
                    <span>{{ rowData.parent_name || '-' }}</span>
                  </template>
                  <template v-else-if="column.key === 'level'">
                    <el-tag :type="getLevelType(rowData.level)" size="small" :disable-transitions="true">
                      {{ rowData.level }}级
                    </el-tag>
                  </template>
                  <template v-else-if="column.key === 'status'">
                    <el-switch
                      :model-value="rowData.status === 1"
                      @change="(val) => handleStatusChange(rowData, val)"
                      :loading="rowData._statusLoading"
                    />
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <view class="row-actions">
                      <el-button v-if="rowData.level === 1" type="primary" size="small" link @click="handleAddChild(rowData)">添加子分类</el-button>
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
                <text class="card-title">{{ item.name }}</text>
                <el-tag size="small" :type="getLevelType(item.level)">{{ item.level }}级</el-tag>
              </view>
              <text class="card-index">#{{ index + 1 }}</text>
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="label">父分类</text>
                <text class="value">{{ item.parent_name || '无（顶级）' }}</text>
              </view>
              <view class="info-row">
                <text class="label">排序</text>
                <text class="value">{{ item.sort }}</text>
              </view>
              <view class="info-row">
                <text class="label">状态</text>
                <el-switch
                  :model-value="item.status === 1"
                  @change="(val) => handleStatusChange(item, val)"
                  :loading="item._statusLoading"
                  size="small"
                />
              </view>
            </view>

            <view class="card-footer">
              <el-button v-if="item.level === 1" type="primary" link size="small" @click="handleAddChild(item)">
                <el-icon><Plus /></el-icon> 子分类
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
        <span class="total-info">共 {{ tableData.total }} 条</span>
      </view>
    </view>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="父分类" prop="parent_id">
          <el-select v-model="formData.parent_id" placeholder="选择父分类（不选则为顶级）" clearable style="width: 100%">
            <el-option label="无（顶级分类）" value="" />
            <el-option v-for="item in availableParents" :key="item._id" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="9999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
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
import { Plus, Search, Edit, Delete, CaretTop, CaretBottom, CaretRight, ArrowRight, ArrowDown } from '@element-plus/icons-vue'
import { columns } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// ========== 配置 ==========
const pageConfig = reactive({
  title: '商品分类管理',
  subTitle: '管理商品的多级分类结构',
  searchPlaceholder: '搜索分类名称...'
})

// ========== 状态 ==========
const loading = ref(false)
const searchVal = ref('')
const filterParentId = ref('')
const tableHeight = ref(500)
const tableContainer = ref(null)
const tableRef = ref(null)
const formRef = ref(null)

const tableData = reactive({ list: [], total: 0 })
const selectedRows = ref([])

// 树形结构相关
const allData = ref([]) // 原始数据
const expandedKeys = ref(new Set()) // 展开的节点

// 父分类列表（用于筛选）
const parentCategories = ref([])

// 排序相关
const sortState = reactive({ field: 'sort', order: 'asc' })

// ========== 树形结构方法 ==========
// 构建树形结构
const buildTree = (list, parentId = '') => {
  const tree = []
  for (const item of list) {
    const itemParentId = item.parent_id || ''
    if (itemParentId === parentId) {
      const children = buildTree(list, item._id)
      tree.push({
        ...item,
        children,
        hasChildren: children.length > 0
      })
    }
  }
  // 按 sort 排序
  tree.sort((a, b) => (a.sort || 0) - (b.sort || 0))
  return tree
}

// 将树形结构扁平化为列表（用于表格显示）
const flattenTree = (tree, result = [], level = 1) => {
  for (const node of tree) {
    const isExpanded = expandedKeys.value.has(node._id)
    result.push({
      ...node,
      level,
      isExpanded,
      hasChildren: node.children && node.children.length > 0
    })
    if (isExpanded && node.children && node.children.length > 0) {
      flattenTree(node.children, result, level + 1)
    }
  }
  return result
}

// 切换展开/折叠
const toggleExpand = (row) => {
  if (expandedKeys.value.has(row._id)) {
    expandedKeys.value.delete(row._id)
  } else {
    expandedKeys.value.add(row._id)
  }
  updateDisplayList()
}

// 展开所有
const expandAll = () => {
  allData.value.forEach(item => {
    if (item.children && item.children.length > 0) {
      expandedKeys.value.add(item._id)
    }
  })
  // 递归添加所有有子节点的项
  const addAllExpandable = (list) => {
    list.forEach(item => {
      if (item.hasChildren) {
        expandedKeys.value.add(item._id)
      }
    })
  }
  const tree = buildTree(allData.value)
  const flatList = []
  const collectAll = (nodes) => {
    nodes.forEach(node => {
      if (node.hasChildren) {
        expandedKeys.value.add(node._id)
      }
      if (node.children) {
        collectAll(node.children)
      }
    })
  }
  collectAll(tree)
  updateDisplayList()
}

// 折叠所有
const collapseAll = () => {
  expandedKeys.value.clear()
  updateDisplayList()
}

// 更新显示列表
const updateDisplayList = () => {
  const tree = buildTree(allData.value)
  tableData.list = flattenTree(tree)
  tableData.total = tableData.list.length
}

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitLoading = ref(false)

const getDefaultFormData = () => ({
  _id: '',
  parent_id: '',
  name: '',
  sort: 0,
  status: 1
})

const formData = ref(getDefaultFormData())

const formRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
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

const dialogTitle = computed(() => {
  if (dialogType.value === 'add') return '新增分类'
  if (dialogType.value === 'addChild') return '添加子分类'
  return '编辑分类'
})

// 可选的父分类（编辑时排除自己及其子分类）
const availableParents = computed(() => {
  if (dialogType.value === 'edit' && formData.value._id) {
    // 编辑时排除自己
    return parentCategories.value.filter(item => item._id !== formData.value._id)
  }
  return parentCategories.value
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
      pageIndex: 1,
      pageSize: 10000, // 加载所有数据用于树形展示
      keyword: searchVal.value.trim(),
      parent_id: filterParentId.value
    }
    const res = await sfCo.action({
      name: 'admin/goodsCategories/getList',
      data
    })
    allData.value = res.list || []
    // 默认展开第一级
    allData.value.forEach(item => {
      if (!item.parent_id) {
        expandedKeys.value.add(item._id)
      }
    })
    updateDisplayList()
  } catch (e) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载父分类列表
const loadParentCategories = async () => {
  try {
    const res = await sfCo.action({
      name: 'admin/goodsCategories/getParentList',
      data: {}
    })
    parentCategories.value = res.list || []
  } catch (e) {
    console.error('加载父分类失败', e)
  }
}

const getLevelType = (level) => {
  const map = { 1: 'primary', 2: 'success', 3: 'warning' }
  return map[level] || 'info'
}

const getRowClass = ({ rowIndex }) => (rowIndex % 2 === 0 ? 'row-even' : 'row-odd')

// 搜索
const handleSearch = () => {
  selectedRows.value = []
  loadData()
}

const handleReset = () => {
  searchVal.value = ''
  filterParentId.value = ''
  handleSearch()
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

// 新增
const handleAdd = () => {
  dialogType.value = 'add'
  formData.value = getDefaultFormData()
  dialogVisible.value = true
}

// 添加子分类
const handleAddChild = (row) => {
  dialogType.value = 'addChild'
  formData.value = {
    ...getDefaultFormData(),
    parent_id: row._id
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogType.value = 'edit'
  formData.value = {
    _id: row._id,
    parent_id: row.parent_id || '',
    name: row.name,
    sort: row.sort,
    status: row.status
  }
  dialogVisible.value = true
}

// 状态切换
const handleStatusChange = async (row, val) => {
  row._statusLoading = true
  try {
    await sfCo.action({
      name: 'admin/goodsCategories/update',
      data: { _id: row._id, status: val ? 1 : 0 }
    })
    row.status = val ? 1 : 0
    ElMessage.success('状态更新成功')
  } catch (e) {
    ElMessage.error(e.message || '状态更新失败')
  } finally {
    row._statusLoading = false
  }
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
    const isEdit = dialogType.value === 'edit'
    const action = isEdit ? 'admin/goodsCategories/update' : 'admin/goodsCategories/add'
    const submitData = { ...formData.value }
    if (!isEdit) delete submitData._id
    await sfCo.action({ name: action, data: submitData })
    ElMessage.success(isEdit ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    loadData()
    loadParentCategories() // 刷新父分类列表
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 删除
const handleDelete = (rows) => {
  const tip = rows.length > 3 ? `${rows.length} 条数据` : rows.map(r => r.name).join('、')
  ElMessageBox.confirm(`确定要删除 ${tip} 吗？删除分类会同时删除其下所有子分类！`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    beforeClose: async (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true
        try {
          await sfCo.action({ name: 'admin/goodsCategories/remove', data: { ids: rows.map(r => r._id) } })
          ElMessage.success('删除成功')
          selectedRows.value = selectedRows.value.filter(r => !rows.some(d => d._id === r._id))
          loadData()
          loadParentCategories()
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
  loadParentCategories()
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

.tree-cell {
  display: flex;
  align-items: center;

  .expand-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    cursor: pointer;
    margin-right: 4px;
    color: #909399;
    transition: color 0.2s;

    &:hover {
      color: #409eff;
    }
  }

  .expand-placeholder {
    display: inline-block;
    width: 18px;
    margin-right: 4px;
  }
}

.total-info {
  color: #909399;
  font-size: 14px;
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
          align-items: center;
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
