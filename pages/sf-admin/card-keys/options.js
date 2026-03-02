/**
 * 卡密管理表格列配置
 */
export const columns = [
  { key: 'goods_name', dataKey: 'goods_name', title: '关联商品', width: 150 },
  { key: 'card_no', dataKey: 'card_no', title: '卡号', width: 180 },
  { key: 'card_pwd', dataKey: 'card_pwd', title: '卡密', width: 180 },
  { key: 'exchange_url', dataKey: 'exchange_url', title: '兑换地址', width: 250 },
  { key: 'status', dataKey: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'order_id', dataKey: 'order_id', title: '关联订单', width: 240 },
  { key: 'used_time', dataKey: 'used_time', title: '使用时间', width: 180 },
  { key: 'create_time', dataKey: 'create_time', title: '导入时间', width: 180, sortable: true },
]

export default {
  columns
}
