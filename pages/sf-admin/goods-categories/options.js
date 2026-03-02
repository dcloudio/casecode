/**
 * 商品分类表格列配置
 */
export const columns = [
  { key: 'name', dataKey: 'name', title: '分类名称', width: 180 },
  { key: 'parent_name', dataKey: 'parent_name', title: '父分类', width: 180 },
  { key: 'level', dataKey: 'level', title: '层级', width: 100, align: 'center' },
  { key: 'sort', dataKey: 'sort', title: '排序', width: 100, align: 'center', sortable: true },
  { key: 'status', dataKey: 'status', title: '状态', width: 100, align: 'center' },
  { key: '_id', dataKey: '_id', title: 'ID', width: 240 },
]

export default {
  columns
}
