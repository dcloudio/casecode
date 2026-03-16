/**
 * 资金池流水表格列配置
 */
export const columns = [
  { key: 'type', dataKey: 'type', title: '类型', width: 120, align: 'center' },
  { key: 'cash_change', dataKey: 'cash_change', title: '现金变动', width: 120, align: 'right' },
  { key: 'score_change', dataKey: 'score_change', title: '积分变动', width: 120, align: 'right' },
  { key: 'cash_balance', dataKey: 'cash_balance', title: '现金余额', width: 120, align: 'right' },
  { key: 'score_balance', dataKey: 'score_balance', title: '积分余额', width: 120, align: 'right' },
  { key: 'exchange_rate', dataKey: 'exchange_rate', title: '兑换比例', width: 100, align: 'right' },
  { key: 'remark', dataKey: 'remark', title: '备注', width: 200 },
  { key: 'create_time', dataKey: 'create_time', title: '创建时间', width: 180, sortable: true },
]

export default {
  columns
}
