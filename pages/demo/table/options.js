/**
 * 定义表格列配置
 */
export const columns = [
  { key: '_id', dataKey: '_id', title: 'ID', width: 220 },
  { key: 'name', dataKey: 'name', title: '姓名', width: 120 },
  { key: 'age', dataKey: 'age', title: '年龄', width: 80, align: 'center', sortable: true },
  { key: 'department', dataKey: 'department', title: '部门', width: 120 },
  { key: 'city', dataKey: 'city', title: '城市', width: 100 },
  { key: 'email', dataKey: 'email', title: '邮箱', width: 200 },
  { key: 'phone', dataKey: 'phone', title: '电话', width: 140 },
  { key: 'address', dataKey: 'address', title: '地址', width: 280 },
  { key: 'salary', dataKey: 'salary', title: '薪资', width: 120, align: 'right', sortable: true },
  { key: 'joinDate', dataKey: 'joinDate', title: '入职日期', width: 120 },
  { key: 'status', dataKey: 'status', title: '状态', width: 100, align: 'center' },
]

export default {
  columns
}
