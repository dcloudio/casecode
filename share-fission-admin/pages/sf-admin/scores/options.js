/**
 * 积分记录表格列配置
 */
export const columns = [
  { key: '_id', dataKey: '_id', title: 'ID', width: 240 },
  { key: 'user_id', dataKey: 'user_id', title: '用户ID', width: 240 },
  { key: 'type', dataKey: 'type', title: '类型', width: 100, align: 'center' },
  { key: 'score', dataKey: 'score', title: '积分变化', width: 100, align: 'right', sortable: true },
  { key: 'balance', dataKey: 'balance', title: '余额', width: 100, align: 'right', sortable: true },
  { key: 'source', dataKey: 'source', title: '来源', width: 120, align: 'center' },
  { key: 'source_user_id', dataKey: 'source_user_id', title: '来源用户ID', width: 240 },
  { key: 'comment', dataKey: 'comment', title: '备注', width: 200 },
  { key: 'create_date', dataKey: 'create_date', title: '创建时间', width: 180, sortable: true },
]

export default {
  columns
}
