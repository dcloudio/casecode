import UniImageMenu from './uni-image-menu.js';
class UniShare extends UniImageMenu{
	constructor(arg) {
		super()
		this.isShow = super.isShow
	}
	async show(param, callback){
		var menus = []
		plus.share.getServices(services => { //只显示有服务的项目
			services = services.filter(item => item.nativeClient)
			let servicesList = services.map(e => e.id)
			param.menus.forEach(item => {
				if (servicesList.includes(item.share.provider) || typeof(item.share) == 'string') {
					menus.push(item)
				}
			})
			super.show({
				list: menus,
				cancelText: param.cancelText
			}, e => {
				callback(e)
				if(e.event == 'clickMenu'){
					if (typeof(menus[e.index]['share']) == 'string') {
						this[menus[e.index]['share']](param)
					} else {
						uni.share({
							...param.content,
							...menus[e.index].share,
							success: res=> {
								console.log("success:" + JSON.stringify(res));
								super.hide()
							},
							fail: function(err) {
								console.log("fail:" + JSON.stringify(err));
								uni.showModal({
									content: JSON.stringify(err),
									showCancel: false,
									confirmText: "知道了"
								});
							}
						})
					}
				}
			})
		}, err => {
			uni.showModal({
				title: '获取服务供应商失败：' + JSON.stringify(err),
				showCancel: false,
				confirmText: '知道了'
			});
			console.error('获取服务供应商失败：' + JSON.stringify(err));
		})
	}
	hide(){
		super.hide()
	}
	copyurl(param) {
		console.log('copyurl',param);
		uni.setClipboardData({
			data: param.content.href,
			success: ()=>{
				console.log('success');
				uni.hideToast() //关闭自带的toast
				uni.showToast({
					title: '复制成功',
					icon: 'none'
				});
				super.hide();
			},
			fail: (err) => {
				uni.showModal({
					content: JSON.stringify(err),
					showCancel: false
				});
			}
		});
	}
	// 使用系统分享发送分享消息 
	shareSystem(param) {
		console.log('shareSystem',param);
		plus.share.sendWithSystem({
			type: 'text',
			content: param.content.title + param.content.summary || '',
			href: param.content.href,
		}, (e)=> {
			console.log('分享成功');
			super.hide()
		}, (err)=> {
			console.log('分享失败：' + JSON.stringify(err));
			uni.showModal({
				title: '获取服务供应商失败：' + JSON.stringify(err),
				showCancel: false,
				confirmText: '知道了'
			});
		});
	}
}
export default UniShare