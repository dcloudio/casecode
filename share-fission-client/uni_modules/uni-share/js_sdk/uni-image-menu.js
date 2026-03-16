var nvMask, nvImageMenu;
class NvImageMenu {
	constructor(arg) {
		this.isShow = false
	}
	show({
		list,
		cancelText
	}, callback) {
		if (!list) {
			list = [{
				"img": "/static/sharemenu/wechatfriend.png",
				"text": "图标文字"
			}]
		}
		//以下为计算菜单的nview绘制布局，为固定算法，使用者无关关心
		var screenWidth = plus.screen.resolutionWidth
		//以360px宽度屏幕为例，上下左右边距及2排按钮边距留25像素，图标宽度55像素，同行图标间的间距在360宽的屏幕是30px，但需要动态计算，以此原则计算4列图标分别的left位置
		//图标下的按钮文字距离图标5像素，文字大小12像素
		//底部取消按钮高度固定为44px
		//TODO 未处理横屏和pad，这些情况6个图标应该一排即可
		var margin = 20,
			iconWidth = 60,
			icontextSpace = 5,
			textHeight = 12
		var left1 = margin / 360 * screenWidth
		var iconSpace = (screenWidth - (left1 * 2) - (iconWidth * 4)) / 3 //屏幕宽度减去左右留白间距，再减去4个图标的宽度，就是3个同行图标的间距
		if (iconSpace <= 5) { //屏幕过窄时，缩小边距和图标大小，再算一次
			margin = 15
			iconWidth = 40
			left1 = margin / 360 * screenWidth
			iconSpace = (screenWidth - (left1 * 2) - (iconWidth * 4)) / 3 //屏幕宽度减去左右留白间距，再减去4个图标的宽度，就是3个同行图标的间距
		}
		var left2 = left1 + iconWidth + iconSpace
		var left3 = left1 + (iconWidth + iconSpace) * 2
		var left4 = left1 + (iconWidth + iconSpace) * 3
		var top1 = left1
		var top2 = top1 + iconWidth + icontextSpace + textHeight + left1

		const TOP = {
				top1,
				top2
			},
			LEFT = {
				left1,
				left2,
				left3,
				left4
			};

		nvMask = new plus.nativeObj.View("nvMask", { //先创建遮罩层
			top: '0px',
			left: '0px',
			height: '100%',
			width: '100%',
			backgroundColor: 'rgba(0,0,0,0.2)'
		});
		nvImageMenu = new plus.nativeObj.View("nvImageMenu", { //创建底部图标菜单
			bottom: '0px',
			left: '0px',
			height: (iconWidth + textHeight + 2 * margin) * Math.ceil(list.length / 4) + 44 +
				'px', //'264px',
			width: '100%',
			backgroundColor: 'rgb(255,255,255)'
		});
		nvMask.addEventListener("click", () => { //处理遮罩层点击
			// console.log('处理遮罩层点击');
			this.hide()
			callback({
				event: "clickMask"
			})
		})
		let myList = []
		list.forEach((item, i) => {
			myList.push({
				tag: 'img',
				src: item.img,
				position: {
					top: TOP['top' + (parseInt(i / 4) + 1)],
					left: LEFT['left' + (1 + i % 4)],
					width: iconWidth,
					height: iconWidth
				}
			})
			myList.push({
				tag: 'font',
				text: item.text,
				textStyles: {
					size: textHeight
				},
				position: {
					top: TOP['top' + (parseInt(i / 4) + 1)] + iconWidth + icontextSpace,
					left: LEFT['left' + (1 + i % 4)],
					width: iconWidth,
					height: textHeight
				}
			})
		})

		//绘制底部图标菜单的内容
		nvImageMenu.draw([{
				tag: 'rect', //菜单顶部的分割灰线
				color: '#e7e7e7',
				position: {
					top: '0px',
					height: '1px'
				}
			},
			{
				tag: 'font',
				text: cancelText, //底部取消按钮的文字
				textStyles: {
					size: '14px'
				},
				position: {
					bottom: '0px',
					height: '44px'
				}
			},
			{
				tag: 'rect', //底部取消按钮的顶部边线
				color: '#e7e7e7',
				position: {
					bottom: '45px',
					height: '1px'
				}
			},
			...myList
		])
		nvMask.show()
		nvImageMenu.show()
		// 开始动画
		/*
			plus.nativeObj.View.startAnimation({
				type: 'slide-in-bottom',
				duration: 300
			}, nvImageMenu, {}, function() {
				console.log('plus.nativeObj.View.startAnimation动画结束');
				// 关闭原生动画
				plus.nativeObj.View.clearAnimation();
				nvImageMenu.show()
			});
		*/


		this.isShow = true
		nvImageMenu.addEventListener("click", e => { //处理底部图标菜单的点击事件，根据点击位置触发不同的逻辑
			// console.log("click menu"+JSON.stringify(e));
			if (e.screenY > plus.screen.resolutionHeight - 44) { //点击了底部取消按钮
				// callback({event:"clickCancelButton"})
				this.hide()
			} else if (e.clientX < 5 || e.clientX > screenWidth - 5 || e.clientY < 5) {
				//屏幕左右边缘5像素及菜单顶部5像素不处理点击
			} else { //点击了图标按钮
				var iClickIndex = -1 //点击的图标按钮序号，第一个图标按钮的index为0
				var iRow = e.clientY < (top2 - (left1 / 2)) ? 0 : 1
				var iCol = -1
				if (e.clientX < (left2 - (iconSpace / 2))) {
					iCol = 0
				} else if (e.clientX < (left3 - (iconSpace / 2))) {
					iCol = 1
				} else if (e.clientX < (left4 - (iconSpace / 2))) {
					iCol = 2
				} else {
					iCol = 3
				}
				if (iRow == 0) {
					iClickIndex = iCol
				} else {
					iClickIndex = iCol + 4
				}
				// console.log("点击按钮的序号: " + iClickIndex);
				// if (iClickIndex >= 0 && iClickIndex <= 5) { //处理具体的点击逻辑，此处也可以自行定义逻辑。如果增减了按钮，此处也需要跟着修改
				// }
				callback({
					event: "clickMenu",
					index: iClickIndex
				})
			}
		})
		/* nvImageMenu.addEventListener("touchstart", function(e) {
			if (e.screenY > (plus.screen.resolutionHeight - 44)) {
				//TODO 这里可以处理按下背景变灰的效果
			}
		})
		nvImageMenu.addEventListener("touchmove", function(e) {
			//TODO 这里可以处理按下背景变灰的效果
			if (e.screenY > plus.screen.resolutionHeight - 44) {}
		})
		nvImageMenu.addEventListener("touchend", function(e) {
			//TODO 这里可以处理释放背景恢复的效果
		})
		*/
	}

	hide() {
		if (this.isShow) {
			nvMask.hide()
			nvImageMenu.hide()
			this.isShow = false
		}
	}
}
export default NvImageMenu