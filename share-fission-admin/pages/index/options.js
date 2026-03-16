/**
 * 每日统计 - 表格列配置
 */
export const columns = [
  { key: 'statement_date', dataKey: 'statement_date', title: '日期', width: 140, sortable: true },
  { key: 'ad_revenue', dataKey: 'ad_revenue', title: '广告收益(元)', width: 120, align: 'right' },
  { key: 'score_added', dataKey: 'score_added', title: '新增积分', width: 100, align: 'right' },
  { key: 'score_consumed', dataKey: 'score_consumed', title: '消耗积分', width: 100, align: 'right' },
  { key: 'score_withdrawn', dataKey: 'score_withdrawn', title: '提现积分', width: 100, align: 'right' },
  { key: 'new_users', dataKey: 'new_users', title: '新增用户', width: 100, align: 'center' },
  { key: 'active_users', dataKey: 'active_users', title: '活跃用户', width: 100, align: 'center' },
  { key: 'viewers_count', dataKey: 'viewers_count', title: '观看人数', width: 100, align: 'center' },
  { key: 'views_count', dataKey: 'views_count', title: '观看次数', width: 100, align: 'center' },
  { key: 'total_cash', dataKey: 'total_cash', title: '总金额(元)', width: 120, align: 'right' },
  { key: 'total_score', dataKey: 'total_score', title: '总积分', width: 110, align: 'right' },
  { key: 'exchange_rate', dataKey: 'exchange_rate', title: '兑换比例', width: 100, align: 'center' },
  { key: 'is_settled', dataKey: 'is_settled', title: '状态', width: 100, align: 'center' },
  { key: 'remark', dataKey: 'remark', title: '备注', width: 150, align: 'left' },
]

/**
 * 图表分组配置
 */
export const chartGroups = [
  {
    id: 'revenue',
    name: '收益趋势',
    fields: [
      { key: 'ad_revenue', name: '广告收益', color: '#e6a23c' },
      { key: 'total_cash', name: '总金额', color: '#67c23a' }
    ]
  },
  {
    id: 'score',
    name: '积分流动',
    fields: [
      { key: 'score_added', name: '新增积分', color: '#409eff' },
      { key: 'score_consumed', name: '消耗积分', color: '#f56c6c' },
      { key: 'score_withdrawn', name: '提现积分', color: '#e6a23c' }
    ]
  },
  {
    id: 'users',
    name: '用户增长',
    fields: [
      { key: 'new_users', name: '新增用户', color: '#409eff' },
      { key: 'active_users', name: '活跃用户', color: '#67c23a' }
    ]
  }
]

export default {
  columns,
  chartGroups
}
