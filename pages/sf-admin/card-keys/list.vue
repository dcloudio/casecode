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
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button @click="handleDownloadTemplate">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
      </view>
      <view class="toolbar-right">
        <el-select v-model="filterGoodsId" placeholder="选择商品" clearable style="width: 180px" @change="handleSearch">
          <el-option v-for="item in goodsList" :key="item._id" :label="item.name" :value="item._id" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px" @change="handleSearch">
          <el-option label="未发放" :value="0" />
          <el-option label="已发放" :value="1" />
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
                    {{ (pagination.currentPage - 1) * pagination.pageSize + rowIndex + 1 }}
                  </template>
                  <template v-else-if="column.key === 'goods_name'">
                    {{ rowData.goods_name || '-' }}
                  </template>
                  <template v-else-if="column.key === 'status'">
                    <el-tag :type="rowData[column.key] === 0 ? 'info' : 'success'" size="small" :disable-transitions="true">
                      {{ rowData[column.key] === 0 ? '未发放' : '已发放' }}
                    </el-tag>
                  </template>
                  <template v-else-if="column.key === 'create_time' || column.key === 'used_time'">
                    {{ rowData[column.key] ? formatTime(rowData[column.key]) : '-' }}
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <view class="row-actions">
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
                <text class="card-title">{{ item.card_no }}</text>
                <el-tag size="small" :type="item.status === 0 ? 'info' : 'success'">{{ item.status === 0 ? '未发放' : '已发放' }}</el-tag>
              </view>
              <text class="card-index">#{{ (pagination.currentPage - 1) * pagination.pageSize + index + 1 }}</text>
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="label">商品</text>
                <text class="value">{{ item.goods_name || '-' }}</text>
              </view>
              <view class="info-row">
                <text class="label">卡密</text>
                <text class="value">{{ item.card_pwd || '-' }}</text>
              </view>
              <view class="info-row">
                <text class="label">兑换地址</text>
                <text class="value">{{ item.exchange_url || '-' }}</text>
              </view>
              <view class="info-row">
                <text class="label">导入时间</text>
                <text class="value">{{ item.create_time ? formatTime(item.create_time) : '-' }}</text>
              </view>
            </view>

            <view class="card-footer">
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
      :title="dialogType === 'add' ? '新增卡密' : '编辑卡密'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="关联商品" prop="goods_id">
          <el-select v-model="formData.goods_id" placeholder="请选择商品" style="width: 100%">
            <el-option v-for="item in goodsList" :key="item._id" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="卡号" prop="card_no">
          <el-input v-model="formData.card_no" placeholder="请输入卡号" />
        </el-form-item>
        <el-form-item label="卡密" prop="card_pwd">
          <el-input v-model="formData.card_pwd" placeholder="请输入卡密" />
        </el-form-item>
        <el-form-item label="兑换地址" prop="exchange_url">
          <el-input v-model="formData.exchange_url" placeholder="请输入兑换地址" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="0">未发放</el-radio>
            <el-radio :value="1">已发放</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog
      v-model="importDialogVisible"
      title="批量导入卡密"
      width="600px"
      destroy-on-close
    >
      <el-form ref="importFormRef" :model="importFormData" :rules="importFormRules" label-width="100px">
        <el-form-item label="关联商品" prop="goods_id">
          <el-select v-model="importFormData.goods_id" placeholder="请选择商品" style="width: 100%">
            <el-option v-for="item in goodsList" :key="item._id" :label="item.name" :value="item._id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Excel文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">只能上传 xlsx/xls 文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleImportSubmit">导入</el-button>
      </template>
    </el-dialog>
  </view>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ElTableV2, ElAutoResizer, ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete, CaretTop, CaretBottom, Upload, Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { columns } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// ========== 配置 ==========
const pageConfig = reactive({
  title: '卡密管理',
  subTitle: '管理商品兑换卡密，支持批量导入',
  searchPlaceholder: '搜索卡号...'
})

// ========== 状态 ==========
const loading = ref(false)
const searchVal = ref('')
const filterGoodsId = ref('')
const filterStatus = ref('')
const tableHeight = ref(500)
const tableContainer = ref(null)
const tableRef = ref(null)
const formRef = ref(null)
const uploadRef = ref(null)
const importFormRef = ref(null)

const tableData = reactive({ list: [], total: 0 })
const selectedRows = ref([])
const pagination = reactive({ currentPage: 1, pageSize: 20 })
const goodsList = ref([])

// 排序相关
const sortState = reactive({ field: '', order: '' })

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitLoading = ref(false)

// 导入弹窗相关
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importFile = ref(null)

const getDefaultFormData = () => ({
  _id: '',
  goods_id: '',
  card_no: '',
  card_pwd: '',
  exchange_url: '',
  status: 0
})

const formData = ref(getDefaultFormData())

const formRules = {
  goods_id: [{ required: true, message: '请选择关联商品', trigger: 'change' }],
  card_no: [{ required: true, message: '请输入卡号', trigger: 'blur' }]
}

const importFormData = ref({
  goods_id: '',
  file: null
})

const importFormRules = {
  goods_id: [{ required: true, message: '请选择关联商品', trigger: 'change' }]
}

// ========== 计算属性 ==========
const tableColumns = ref([...columns])

const computedColumns = computed(() => [
  { key: 'selection', title: '', width: 50, align: 'center' },
  { key: 'index', title: '序号', width: 70, align: 'center' },
  ...tableColumns.value,
  { key: 'actions', title: '操作', width: 140, align: 'center', fixed: 'right' }
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

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const loadGoodsList = async () => {
  try {
    const res = await sfCo.action({
      name: 'admin/cardKeys/getGoodsList',
      data: {}
    })
    goodsList.value = res.list || []
  } catch (e) {
    console.error('加载商品列表失败', e)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const data = {
      pageIndex: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchVal.value.trim(),
      goods_id: filterGoodsId.value,
      status: filterStatus.value
    }
    if (sortState.field && sortState.order) {
      data.sortField = sortState.field
      data.sortOrder = sortState.order
    }
    const res = await sfCo.action({
      name: 'admin/cardKeys/getList',
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

const getRowClass = ({ rowIndex }) => (rowIndex % 2 === 0 ? 'row-even' : 'row-odd')

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  selectedRows.value = []
  loadData()
}

const handleReset = () => {
  searchVal.value = ''
  filterGoodsId.value = ''
  filterStatus.value = ''
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
    const action = dialogType.value === 'add' ? 'admin/cardKeys/add' : 'admin/cardKeys/update'
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
  const tip = rows.length > 3 ? `${rows.length} 条数据` : rows.map(r => r.card_no).join('、')
  ElMessageBox.confirm(`确定要删除 ${tip} 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    beforeClose: async (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true
        try {
          await sfCo.action({ name: 'admin/cardKeys/remove', data: { ids: rows.map(r => r._id) } })
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

// 批量导入
const handleImport = () => {
  importFormData.value = { goods_id: '', file: null }
  importFile.value = null
  importDialogVisible.value = true
}

const handleFileChange = (file) => {
  importFile.value = file.raw
}

const handleFileRemove = () => {
  importFile.value = null
}

const handleImportSubmit = async () => {
  try {
    await importFormRef.value.validate()
  } catch {
    return
  }

  if (!importFile.value) {
    ElMessage.warning('请选择Excel文件')
    return
  }

  importLoading.value = true
  try {
    // 读取Excel文件
    const data = await readExcelFile(importFile.value)
    if (!data || data.length === 0) {
      ElMessage.warning('Excel文件中没有数据')
      return
    }

    // 调用后端批量导入接口
    const res = await sfCo.action({
      name: 'admin/cardKeys/batchImport',
      data: {
        goods_id: importFormData.value.goods_id,
        list: data
      }
    })

    ElMessage.success(`导入成功，共导入 ${res.count} 条数据`)
    importDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '导入失败')
  } finally {
    importLoading.value = false
  }
}

const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['card_no', 'card_pwd', 'exchange_url'], range: 1 })
        // 过滤空行
        const filteredData = jsonData.filter(row => row.card_no && String(row.card_no).trim())
        resolve(filteredData)
      } catch (err) {
        reject(new Error('Excel文件解析失败'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

// 下载模板
const handleDownloadTemplate = () => {
  const templateData = [
    ['卡号', '卡密', '兑换地址'],
    ['示例卡号001', '示例卡密001', 'https://example.com/exchange'],
    ['示例卡号002', '示例卡密002', '']
  ]
  const ws = XLSX.utils.aoa_to_sheet(templateData)
  // 设置列宽
  ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 40 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '卡密导入模板')
  XLSX.writeFile(wb, '卡密导入模板.xlsx')
}

// ========== 生命周期 ==========
onLoad((options) => {
  // 支持从 URL 参数获取商品ID进行筛选
  if (options.goods_id) {
    filterGoodsId.value = options.goods_id
  }
  loadGoodsList()
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
