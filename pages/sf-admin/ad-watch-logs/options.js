/**
 * 广告观看记录 - 表格列配置
 */
export const columns = [
  { key: '_id', dataKey: '_id', title: 'ID', width: 240 },
  { key: 'user_info', dataKey: 'user_info', title: '用户', width: 220 },
  { key: 'ad_type', dataKey: 'ad_type', title: '广告类型', width: 160 },
  { key: 'ad_id', dataKey: 'ad_id', title: '广告ID', width: 180 },
  { key: 'score', dataKey: 'score', title: '获得积分', width: 100, align: 'right', sortable: true },
  { key: 'revenue', dataKey: 'revenue', title: '广告收益', width: 120, align: 'right', sortable: true },
  { key: 'is_realtime', dataKey: 'is_realtime', title: '实时模式', width: 100, align: 'center' },
  { key: 'watch_time', dataKey: 'watch_time', title: '观看时间', width: 180, sortable: true },
  { key: 'create_time', dataKey: 'create_time', title: '创建时间', width: 180, sortable: true },
]

export default {
  columns
}
