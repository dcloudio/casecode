(function(owner) {
	var Intent = null;
	var main = null;
	var Share = {
		shares: {},
		init: function() {
			if (mui.os.plus && mui.os.android) {
				mui.plusReady(function() {
					Intent = plus.android.importClass("android.content.Intent");
					main = plus.android.runtimeMainActivity();
					this.supportShare() && plus.share.getServices(function(services) {
						this.shares = {};
						mui.each(services, function(index, service) {
							this.shares[service.id] = service;
						}.bind(this));
					}.bind(this), function(e) {
						console.log("获取分享服务列表失败：" + e.message);
					});
				}.bind(this));
			}
		},
		supportShare: function() {
			var versions = plus.runtime.innerVersion.split('.');
			return versions[versions.length - 1] >= 20133;
		},
		open: function(message, callback) {
			var self = this;
			if (this.supportShare() && this.shares.weixin) { //高版本，可以使用plus share
				plus.nativeUI.actionSheet({
					title: '分享到',
					cancel: "取消",
					buttons: [{
						title: "微信消息"
					}, {
						title: "微信朋友圈"
					}, {
						title: "更多分享"
					}]
				}, function(e) {
					var index = e.index;
					switch (index) {
						case 1: //分享到微信好友
							self.share('weixin', mui.extend(true, {}, message, {
								extra: {
									scene: 'WXSceneSession'
								}
							}), callback);
							break;
						case 2: //分享到微信朋友圈
							message.title = message.content;
							self.share('weixin', mui.extend(true, {}, message, {
								extra: {
									scene: 'WXSceneTimeline'
								}
							}), callback);
							break;
						case 3: //更多分享
							self.openSysShare(message, callback);
							break;
					}
				});
			} else { //低版本，系统分享
				self.openSysShare(message, callback);
			}
		},
		share: function(id, message, callback) {
			var self = this;
			var service = self.shares[id];
			if (!service) {
				plus.nativeUI.alert('无效的分享服务[' + id + ']');
				callback && callback(false);
				return;
			}
			if (service.authenticated) {
				self._share(service, message, callback);
			} else {
				service.authorize(function() {
					self._share(service, message, callback);
				}, function(e) {
					plus.nativeUI.alert("认证授权失败");
					callback && callback(false);
				});
			}
		},
		_share: function(service, message, callback) {
			service.send(message, function() {
				plus.nativeUI.toast("分享到\"" + service.description + "\"成功！");
				callback && callback(true);
			}, function(e) {
				plus.nativeUI.toast("分享到\"" + service.description + "\"失败！");
				callback && callback(false);
			});
		},
		openSysShare: function(message, callback) {
			var intent = new Intent(Intent.ACTION_SEND);
			intent.setType("text/plain");
			intent.putExtra(Intent.EXTRA_TEXT, message.content);
			intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
			main.startActivity(Intent.createChooser(intent, "系统分享"));
			callback && callback(true);
		}
	};
	Share.init();
	owner.share = Share;
})(window);