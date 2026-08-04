/**
 * 提现记录表格列配置
 */
export const columns = [
  { key: '_id', dataKey: '_id', title: 'ID', width: 240 },
  { key: 'user_id', dataKey: 'user_id', title: '用户ID', width: 240 },
  { key: 'score', dataKey: 'score', title: '提现积分', width: 100, align: 'right', sortable: true },
  { key: 'amount', dataKey: 'amount', title: '提现金额', width: 100, align: 'right', sortable: true },
  { key: 'fee', dataKey: 'fee', title: '手续费', width: 100, align: 'right' },
  { key: 'actual_amount', dataKey: 'actual_amount', title: '实际到账', width: 100, align: 'right' },
  { key: 'method', dataKey: 'method', title: '提现方式', width: 100, align: 'center' },
  { key: 'account_name', dataKey: 'account_name', title: '收款人', width: 100 },
  { key: 'account', dataKey: 'account', title: '收款账号', width: 180 },
  { key: 'status', dataKey: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'create_time', dataKey: 'create_time', title: '申请时间', width: 180, sortable: true },
]

export default {
  columns
}
