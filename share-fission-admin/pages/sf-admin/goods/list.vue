<template>
  <view class="page-container">
    <!-- 页面头部 -->
    <page-header :title="pageConfig.title" :sub-title="pageConfig.subTitle" />

    <!-- 工具栏区域 -->
    <view class="toolbar">
      <view class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增商品
        </el-button>
      </view>
      <view class="toolbar-right">
        <el-tree-select
          v-model="filterCategoryId"
          :data="categoryTree"
          :props="{ label: 'name', value: '_id', children: 'children' }"
          placeholder="分类筛选"
          clearable
          check-strictly
          style="width: 160px"
          @change="handleSearch"
        />
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 100px" @change="handleSearch">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
        <el-input
          v-model="searchVal"
          :placeholder="pageConfig.searchPlaceholder"
          clearable
          style="width: 200px"
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
              :row-height="64"
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
                  <template v-else-if="column.key === 'image'">
                    <el-image
                      v-if="rowData.images && rowData.images.length"
                      :src="rowData.images[0]"
                      :preview-src-list="rowData.images"
                      fit="cover"
                      style="width: 50px; height: 50px; border-radius: 4px;"
                    />
                    <span v-else class="no-image">-</span>
                  </template>
                  <template v-else-if="column.key === 'category_name'">
                    {{ rowData.category_name || '-' }}
                  </template>
                  <template v-else-if="column.key === 'sales_count'">
                    {{ rowData.sales_count || 0 }}
                  </template>
                  <template v-else-if="column.key === 'score_cost'">
                    <span class="score-text">{{ formatInteger(rowData[column.key]) }}</span>
                  </template>
                  <template v-else-if="column.key === 'stock'">
                    <span :class="['stock-text', rowData[column.key] <= 10 ? 'low' : '']">
                      {{ rowData[column.key] }}
                    </span>
                  </template>
                  <template v-else-if="column.key === 'status'">
                    <el-switch
                      :model-value="rowData[column.key] === 1"
                      @change="(val) => handleStatusChange(rowData, val)"
                      :loading="rowData._statusLoading"
                    />
                  </template>
                  <template v-else-if="column.key === 'create_time'">
                    {{ formatTime(rowData[column.key]) }}
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <view class="row-actions">
                      <el-button type="warning" size="small" link @click="handleCardKeys(rowData)">卡密</el-button>
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
                <el-image
                  v-if="item.images && item.images.length"
                  :src="item.images[0]"
                  fit="cover"
                  style="width: 60px; height: 60px; border-radius: 4px;"
                />
                <view class="goods-info">
                  <text class="card-title">{{ item.name }}</text>
                  <el-tag size="small">{{ item.category_name || '-' }}</el-tag>
                </view>
              </view>
              <el-switch
                :model-value="item.status === 1"
                @change="(val) => handleStatusChange(item, val)"
              />
            </view>

            <view class="card-body">
              <view class="info-row">
                <text class="label">所需积分</text>
                <text class="value score">{{ formatInteger(item.score_cost) }}</text>
              </view>
              <view class="info-row">
                <text class="label">库存</text>
                <text :class="['value', item.stock <= 10 ? 'low' : '']">{{ item.stock }}</text>
              </view>
              <view class="info-row">
                <text class="label">排序</text>
                <text class="value">{{ item.sort_order }}</text>
              </view>
              <view class="info-row">
                <text class="label">创建时间</text>
                <text class="value">{{ formatTime(item.create_time) }}</text>
              </view>
            </view>

            <view class="card-footer">
              <el-button type="warning" link size="small" @click="handleCardKeys(item)">
                <el-icon><Key /></el-icon> 卡密
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
      :title="dialogType === 'add' ? '新增商品' : '编辑商品'"
      width="700px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品分类" prop="category_id">
          <el-tree-select
            v-model="formData.category_id"
            :data="categoryTree"
            :props="{ label: 'name', value: '_id', children: 'children' }"
            placeholder="请选择分类"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="所需积分" prop="score_cost">
              <el-input-number v-model="formData.score_cost" :min="0" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库存数量" prop="stock">
              <el-input-number v-model="formData.stock" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序权重" prop="sort_order">
              <el-input-number v-model="formData.sort_order" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
        </el-form-item>
        <el-form-item label="商品图片" prop="images">
          <view class="image-list">
            <view class="image-item" v-for="(img, idx) in formData.images" :key="idx">
              <el-image :src="img" fit="cover" style="width: 80px; height: 80px; border-radius: 4px;" />
              <el-icon class="remove-icon" @click="removeImage('images', idx)"><CircleClose /></el-icon>
            </view>
            <view class="image-upload" @click="uploadImage('images')">
              <el-icon><Plus /></el-icon>
              <text>轮播图</text>
            </view>
          </view>
        </el-form-item>
        <el-form-item label="详情图" prop="detail_images">
          <view class="image-list">
            <view class="image-item" v-for="(img, idx) in formData.detail_images" :key="idx">
              <el-image :src="img" fit="cover" style="width: 80px; height: 80px; border-radius: 4px;" />
              <el-icon class="remove-icon" @click="removeImage('detail_images', idx)"><CircleClose /></el-icon>
            </view>
            <view class="image-upload" @click="uploadImage('detail_images')">
              <el-icon><Plus /></el-icon>
              <text>详情图</text>
            </view>
          </view>
        </el-form-item>
        <el-form-item label="商品状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
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
import { Plus, Search, Edit, Delete, CaretTop, CaretBottom, CircleClose, Key } from '@element-plus/icons-vue'
import { columns } from './options.js'

// 云对象
const sfCo = uniCloud.importObject('share-fission-co', { customUI: true })

// ========== 配置 ==========
const pageConfig = reactive({
  title: '商品管理',
  subTitle: '管理积分兑换商品，支持上下架和库存管理',
  searchPlaceholder: '搜索商品名称...'
})

// ========== 状态 ==========
const loading = ref(false)
const searchVal = ref('')
const filterCategoryId = ref('')
const filterStatus = ref('')
const tableHeight = ref(500)
const tableContainer = ref(null)
const tableRef = ref(null)
const formRef = ref(null)

const tableData = reactive({ list: [], total: 0 })
const selectedRows = ref([])
const pagination = reactive({ currentPage: 1, pageSize: 20 })

// 分类树形数据
const categoryTree = ref([])

// 排序相关
const sortState = reactive({ field: 'sort_order', order: 'desc' })

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitLoading = ref(false)

const getDefaultFormData = () => ({
  _id: '',
  name: '',
  description: '',
  images: [],
  detail_images: [],
  category_id: '',
  score_cost: 100,
  stock: 100,
  sort_order: 0,
  status: 1
})

const formData = ref(getDefaultFormData())

const formRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  score_cost: [{ required: true, message: '请输入所需积分', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
}

// ========== 计算属性 ==========
const tableColumns = ref([...columns])

const computedColumns = computed(() => [
  { key: 'selection', title: '', width: 50, align: 'center' },
  { key: 'index', title: '序号', width: 70, align: 'center' },
  ...tableColumns.value,
  { key: 'actions', title: '操作', width: 160, align: 'center', fixed: 'right' }
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
    if (filterCategoryId.value) {
      data.category_id = filterCategoryId.value
    }
    if (filterStatus.value !== '' && filterStatus.value !== null) {
      data.status = filterStatus.value
    }
    if (sortState.field && sortState.order) {
      data.sortField = sortState.field
      data.sortOrder = sortState.order
    }
    const res = await sfCo.action({
      name: 'admin/goods/getList',
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

// 加载分类树形数据
const loadCategories = async () => {
  try {
    const res = await sfCo.action({
      name: 'admin/goodsCategories/getTree',
      data: {}
    })
    categoryTree.value = res.tree || []
  } catch (e) {
    console.error('加载分类失败', e)
  }
}

const formatInteger = (num) => (num == null ? '-' : num.toLocaleString())

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
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
  filterCategoryId.value = ''
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

// 跳转到卡密管理
const handleCardKeys = (row) => {
  uni.navigateTo({
    url: `/pages/sf-admin/card-keys/list?goods_id=${row._id}`
  })
}

// 状态切换
const handleStatusChange = async (row, val) => {
  row._statusLoading = true
  try {
    await sfCo.action({
      name: 'admin/goods/update',
      data: { _id: row._id, status: val ? 1 : 0 }
    })
    row.status = val ? 1 : 0
    ElMessage.success(val ? '已上架' : '已下架')
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    row._statusLoading = false
  }
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
  formData.value = {
    ...getDefaultFormData(),
    _id: row._id,
    name: row.name,
    description: row.description || '',
    images: row.images ? [...row.images] : [],
    detail_images: row.detail_images ? [...row.detail_images] : [],
    category_id: row.category_id || '',
    score_cost: row.score_cost,
    stock: row.stock,
    sort_order: row.sort_order,
    status: row.status
  }
  dialogVisible.value = true
}

function removeUrlParams(url) {
  return url.includes('?') ? url.split('?')[0] : url;
}

// 图片上传
const uploadImage = (field) => {
  uni.chooseImage({
    count: 9 - formData.value[field].length,
    success: async (res) => {
      for (const path of res.tempFilePaths) {
        try {
          const uploadRes = await uniCloud.uploadFile({
            filePath: path,
            cloudPath: `goods/${Date.now()}_${Math.random().toString(36).slice(2)}.png}`
          })
          const tempFileURLRes = await uniCloud.getTempFileURL({
            fileList: [uploadRes.fileID]
          });
          const tempFileURL = removeUrlParams(tempFileURLRes?.fileList[0].tempFileURL);
          formData.value[field].push(tempFileURL)
        } catch (e) {
          console.error('e: ', e);
          ElMessage.error('图片上传失败')
        }
      }
    }
  })
}

const removeImage = (field, index) => {
  formData.value[field].splice(index, 1)
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
    const action = dialogType.value === 'add' ? 'admin/goods/add' : 'admin/goods/update'
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
  const tip = rows.length > 3 ? `${rows.length} 个商品` : rows.map(r => r.name).join('、')
  ElMessageBox.confirm(`确定要删除 ${tip} 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    beforeClose: async (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true
        try {
          await sfCo.action({ name: 'admin/goods/remove', data: { ids: rows.map(r => r._id) } })
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
  loadCategories()
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
  color: #e6a23c;
  font-weight: 500;
}

.stock-text {
  &.low {
    color: #f56c6c;
    font-weight: 500;
  }
}

.no-image {
  color: #c0c4cc;
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

/* 图片上传样式 */
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  .image-item {
    position: relative;

    .remove-icon {
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 20px;
      color: #f56c6c;
      background: #fff;
      border-radius: 50%;
      cursor: pointer;

      &:hover {
        color: #c45656;
      }
    }
  }

  .image-upload {
    width: 80px;
    height: 80px;
    border: 1px dashed #d9d9d9;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #8c939d;
    font-size: 12px;
    gap: 4px;

    &:hover {
      border-color: #409eff;
      color: #409eff;
    }

    .el-icon {
      font-size: 20px;
    }
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

    .el-input,
    .el-select {
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
        align-items: flex-start;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f2f5;

        .header-main {
          display: flex;
          gap: 12px;

          .goods-info {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .card-title {
              font-size: 16px;
              font-weight: 600;
              color: #303133;
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

            &.score {
              color: #e6a23c;
              font-weight: 500;
            }

            &.low {
              color: #f56c6c;
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
