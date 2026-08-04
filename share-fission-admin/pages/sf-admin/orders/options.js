/**
 * 订单管理 - 表格列配置
 */
export const columns = [
  { key: 'order_no', dataKey: 'order_no', title: '订单编号', width: 240 },
  { key: 'goods_name', dataKey: 'goods_name', title: '商品名称', width: 180 },
  { key: 'user_nickname', dataKey: 'user_nickname', title: '用户昵称', width: 120 },
  { key: 'score_cost', dataKey: 'score_cost', title: '消耗积分', width: 100, align: 'right' },
  { key: 'status', dataKey: 'status', title: '订单状态', width: 100, align: 'center' },
  { key: 'create_time', dataKey: 'create_time', title: '下单时间', width: 180, sortable: true },
]

export const statusOptions = [
  { label: '全部', value: '' },
  { label: '已完成', value: 'complete' },
  { label: '已退款', value: 'cancel' },
]

export default {
  columns,
  statusOptions
}
