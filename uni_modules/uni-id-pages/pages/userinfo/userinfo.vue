<!-- 用户资料页 -->
<template>
  <view class="userinfo-page">
    <view class="userinfo-scene">
      <view class="userinfo-hero" :style="heroLayoutStyle">
        <image class="hero-background" src="/static/mall/mall-header.png" mode="aspectFill" :draggable="false"></image>

        <view class="hero-content">
          <view class="hero-title-row" aria-label="个人资料">
            <view
              class="back-button"
              hover-class="back-button-pressed"
              role="button"
              tabindex="0"
              aria-label="返回"
              @click="goBack"
              @keyup.enter="goBack"
            >
              <uni-icons type="back" size="22" color="#71300c"></uni-icons>
            </view>

            <view class="title-cloud" aria-hidden="true">
              <view class="title-cloud-curl"></view>
              <view class="title-cloud-tail"></view>
            </view>
            <text class="hero-title">个人资料</text>
            <view class="title-cloud title-cloud-right" aria-hidden="true">
              <view class="title-cloud-curl"></view>
              <view class="title-cloud-tail"></view>
            </view>
          </view>
        </view>

        <text class="lantern-word" aria-hidden="true">资</text>
      </view>

      <view class="page-content">
        <view class="profile-panel ornate-panel">
          <view class="panel-content profile-content">
            <view class="avatar-editor" aria-label="更换头像">
              <view class="avatar-frame">
                <uni-id-pages-avatar class="avatar-control" width="84px" height="84px"></uni-id-pages-avatar>
              </view>
              <view class="avatar-edit-badge">
                <uni-icons type="compose" size="14" color="#fffdf5"></uni-icons>
              </view>
            </view>
            <text class="profile-name">{{ profileName }}</text>
            <text class="profile-subtitle">账号资料</text>
          </view>
        </view>

        <view class="section-panel ornate-panel">
          <view class="panel-content section-panel-content">
            <view class="section-heading">
              <view class="heading-rule"></view>
              <text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
              <text class="section-title">基本资料</text>
              <text class="heading-ornament" aria-hidden="true">❧</text>
              <view class="heading-rule heading-rule-right"></view>
            </view>

            <view class="menu-list">
              <view
                class="list-item"
                hover-class="list-item-pressed"
                role="button"
                tabindex="0"
                @click="openNicknameDialog"
                @keyup.enter="openNicknameDialog"
              >
                <view class="item-left">
                  <view class="item-icon item-icon-nickname">
                    <uni-icons type="person-filled" size="18" color="#a66f42"></uni-icons>
                  </view>
                  <text class="item-title">昵称</text>
                </view>
                <view class="item-right">
                  <text class="item-value">{{ userInfo.nickname || '未设置' }}</text>
                  <view class="list-arrow">
                    <uni-icons type="right" size="16" color="#b98253"></uni-icons>
                  </view>
                </view>
              </view>

              <view
                class="list-item"
                hover-class="list-item-pressed"
                role="button"
                tabindex="0"
                @click="bindMobile"
                @keyup.enter="bindMobile"
              >
                <view class="item-left">
                  <view class="item-icon item-icon-mobile">
                    <uni-icons type="phone-filled" size="17" color="#477c69"></uni-icons>
                  </view>
                  <text class="item-title">手机号</text>
                </view>
                <view class="item-right">
                  <text class="item-value">{{ userInfo.mobile || '未绑定' }}</text>
                  <view class="list-arrow">
                    <uni-icons type="right" size="16" color="#b98253"></uni-icons>
                  </view>
                </view>
              </view>

              <view v-if="userInfo.email" class="list-item list-item-static">
                <view class="item-left">
                  <view class="item-icon item-icon-email">
                    <uni-icons type="email-filled" size="17" color="#c9852d"></uni-icons>
                  </view>
                  <text class="item-title">电子邮箱</text>
                </view>
                <view class="item-right item-right-static">
                  <text class="item-value">{{ userInfo.email }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="showSecuritySection" class="section-panel ornate-panel">
          <view class="panel-content section-panel-content">
            <view class="section-heading">
              <view class="heading-rule"></view>
              <text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
              <text class="section-title">账号与安全</text>
              <text class="heading-ornament" aria-hidden="true">❧</text>
              <view class="heading-rule heading-rule-right"></view>
            </view>

            <view class="menu-list">
              <!-- #ifdef APP -->
              <!-- 如未开通实人认证服务，可以将实名认证入口注释 -->
              <view
                class="list-item"
                hover-class="list-item-pressed"
                role="button"
                tabindex="0"
                @click="realNameVerify"
                @keyup.enter="realNameVerify"
              >
                <view class="item-left">
                  <view class="item-icon item-icon-auth">
                    <uni-icons type="auth-filled" size="18" color="#d25223"></uni-icons>
                  </view>
                  <text class="item-title">实名认证</text>
                </view>
                <view class="item-right">
                  <text class="status-tag" :class="{ 'status-tag-verified': realNameStatus === 2 }">{{ realNameStatus === 2 ? '已认证' : '未认证' }}</text>
                  <view class="list-arrow">
                    <uni-icons type="right" size="16" color="#b98253"></uni-icons>
                  </view>
                </view>
              </view>
              <!-- #endif -->

              <view
                v-if="hasPwd"
                class="list-item"
                hover-class="list-item-pressed"
                role="button"
                tabindex="0"
                @click="changePassword"
                @keyup.enter="changePassword"
              >
                <view class="item-left">
                  <view class="item-icon item-icon-password">
                    <uni-icons type="locked-filled" size="17" color="#9a5a31"></uni-icons>
                  </view>
                  <text class="item-title">修改密码</text>
                </view>
                <view class="item-right">
                  <text class="item-value">更新登录密码</text>
                  <view class="list-arrow">
                    <uni-icons type="right" size="16" color="#b98253"></uni-icons>
                  </view>
                </view>
              </view>

              <!-- #ifndef MP -->
              <view
                class="list-item"
                hover-class="list-item-pressed"
                role="button"
                tabindex="0"
                @click="deactivate"
                @keyup.enter="deactivate"
              >
                <view class="item-left">
                  <view class="item-icon item-icon-danger">
                    <uni-icons type="trash-filled" size="17" color="#b9432d"></uni-icons>
                  </view>
                  <text class="item-title item-title-danger">注销账号</text>
                </view>
                <view class="item-right">
                  <text class="item-value item-value-danger">永久注销</text>
                  <view class="list-arrow">
                    <uni-icons type="right" size="16" color="#b98253"></uni-icons>
                  </view>
                </view>
              </view>
              <!-- #endif -->
            </view>
          </view>
        </view>

        <template v-if="showLoginManage">
          <button v-if="userInfo._id" class="login-button" hover-class="login-button-pressed" @click="logout">
            <uni-icons type="undo" size="18" color="#fffdf5"></uni-icons>
            <text class="login-button-text">退出登录</text>
          </button>
          <button v-else class="login-button" hover-class="login-button-pressed" @click="login">
            <uni-icons type="person-filled" size="18" color="#fffdf5"></uni-icons>
            <text class="login-button-text">立即登录</text>
          </button>
        </template>
      </view>
    </view>

    <uni-popup ref="dialog" type="center" :is-mask-click="false">
      <view class="nickname-dialog" role="dialog" aria-label="设置昵称">
        <view class="dialog-content">
          <view class="section-heading dialog-heading">
            <view class="heading-rule"></view>
            <text class="heading-ornament heading-ornament-left" aria-hidden="true">❧</text>
            <text class="section-title">设置昵称</text>
            <text class="heading-ornament" aria-hidden="true">❧</text>
            <view class="heading-rule heading-rule-right"></view>
          </view>
          <view class="nickname-input-wrap">
            <input
              v-model="nicknameDraft"
              class="nickname-input"
              :type="setNicknameIng ? 'nickname' : 'text'"
              :focus="nicknameDialogOpen"
              maxlength="32"
              placeholder="请输入昵称"
              placeholder-style="color: #b69a84; font-size: 14px;"
              confirm-type="done"
              @confirm="confirmNickname"
            />
          </view>
          <view class="dialog-actions">
            <button class="dialog-button dialog-button-cancel" hover-class="dialog-button-pressed" @click="closeNicknameDialog">取消</button>
            <button class="dialog-button dialog-button-confirm" hover-class="dialog-button-pressed" @click="confirmNickname">确定</button>
          </view>
        </view>
      </view>
    </uni-popup>
    <uni-id-pages-bind-mobile ref="bind-mobile-by-sms" @success="bindMobileSuccess"></uni-id-pages-bind-mobile>
  </view>
</template>
<script>
  import { store, mutations } from '@/uni_modules/uni-id-pages/common/store.js';

  const uniIdCo = uniCloud.importObject('uni-id-co');

  export default {
    data() {
      return {
        statusBarHeight: Number(uni.getSystemInfoSync().statusBarHeight) || 0,
        univerifyStyle: {
          authButton: {
            title: '本机号码一键绑定',
          },
          otherLoginButton: {
            title: '其他号码绑定',
          },
        },
        hasPwd: false,
        showLoginManage: false,
        setNicknameIng: false,
        nicknameDraft: '',
        nicknameDialogOpen: false,
      };
    },
    computed: {
      userInfo() {
        return store.userInfo;
      },
      profileName() {
        return this.userInfo.nickname || this.userInfo.username || this.userInfo.mobile || '用户';
      },
      realNameStatus() {
        if (!this.userInfo.realNameAuth) {
          return 0;
        }

        return this.userInfo.realNameAuth.authStatus;
      },
      heroLayoutStyle() {
        const safeAreaOffset = Math.max(0, this.statusBarHeight - 42);
        const heroHeight = 178 + safeAreaOffset;

        return {
          '--userinfo-status-bar-height': `${this.statusBarHeight}px`,
          '--userinfo-safe-area-offset': `${safeAreaOffset}px`,
          height: `${heroHeight}px`,
          flexBasis: `${heroHeight}px`,
        };
      },
      showSecuritySection() {
        let visible = this.hasPwd;
        // #ifdef APP
        visible = true;
        // #endif
        // #ifndef MP
        visible = true;
        // #endif
        return visible;
      },
    },
    async onShow() {
      this.univerifyStyle.authButton.title = '本机号码一键绑定';
      this.univerifyStyle.otherLoginButton.title = '其他号码绑定';
    },
    async onLoad(e) {
      if (e.showLoginManage) {
        this.showLoginManage = true;
      }
      // 判断当前用户是否有密码，否则不显示修改密码入口
      const res = await uniIdCo.getAccountInfo();
      this.hasPwd = res.isPasswordSet;
    },
    methods: {
      goBack() {
        if (getCurrentPages().length > 1) {
          uni.navigateBack({ delta: 1 });
          return;
        }

        uni.switchTab({ url: '/pages/ucenter/ucenter' });
      },
      login() {
        uni.navigateTo({
          url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd',
          complete: () => {},
        });
      },
      logout() {
        mutations.logout();
      },
      bindMobileSuccess() {
        mutations.updateUserInfo();
      },
      changePassword() {
        uni.navigateTo({
          url: '/uni_modules/uni-id-pages/pages/userinfo/change_pwd/change_pwd',
          complete: () => {},
        });
      },
      bindMobile() {
        // #ifdef APP-PLUS
        uni.preLogin({
          provider: 'univerify',
          success: this.univerify(),
          fail: (res) => {
            console.log(res);
            this.bindMobileBySmsCode();
          },
        });
        // #endif

        // #ifdef MP-WEIXIN
        this.$refs['bind-mobile-by-sms'].open();
        // #endif

        // #ifdef H5
        this.bindMobileBySmsCode();
        // #endif
      },
      univerify() {
        uni.login({
          provider: 'univerify',
          univerifyStyle: this.univerifyStyle,
          success: async (e) => {
            uniIdCo
              .bindMobileByUniverify(e.authResult)
              .then(() => {
                mutations.updateUserInfo();
              })
              .catch((error) => {
                console.log(error);
              })
              .finally(() => {
                uni.closeAuthView();
              });
          },
          fail: (err) => {
            console.log(err);
            if (err.code == '30002' || err.code == '30001') {
              this.bindMobileBySmsCode();
            }
          },
        });
      },
      bindMobileBySmsCode() {
        uni.navigateTo({
          url: './bind-mobile/bind-mobile',
        });
      },
      openNicknameDialog() {
        this.nicknameDraft = this.userInfo.nickname || '';
        this.nicknameDialogOpen = true;
        this.$refs.dialog.open();
      },
      closeNicknameDialog() {
        this.setNicknameIng = false;
        this.nicknameDialogOpen = false;
        this.$refs.dialog.close();
      },
      confirmNickname() {
        const nickname = this.nicknameDraft.trim();
        if (!nickname) {
          uni.showToast({
            title: '请输入昵称',
            icon: 'none',
          });
          return;
        }

        this.setNickname(nickname);
      },
      setNickname(nickname) {
        mutations.updateUserInfo({ nickname });
        this.setNicknameIng = false;
        this.nicknameDialogOpen = false;
        this.$refs.dialog.close();
      },
      deactivate() {
        uni.navigateTo({
          url: '/uni_modules/uni-id-pages/pages/userinfo/deactivate/deactivate',
        });
      },
      async bindThirdAccount(provider) {
        const uniIdCo = uniCloud.importObject('uni-id-co');
        const bindField = {
          weixin: 'wx_openid',
          alipay: 'ali_openid',
          apple: 'apple_openid',
          qq: 'qq_openid',
        }[provider.toLowerCase()];

        if (this.userInfo[bindField]) {
          await uniIdCo['unbind' + provider]();
          await mutations.updateUserInfo();
        } else {
          uni.login({
            provider: provider.toLowerCase(),
            onlyAuthorize: true,
            success: async (e) => {
              const res = await uniIdCo['bind' + provider]({
                code: e.code,
              });
              if (res.errCode) {
                uni.showToast({
                  title: res.errMsg || '绑定失败',
                  duration: 3000,
                });
              }
              await mutations.updateUserInfo();
            },
            fail: async (err) => {
              console.log(err);
              uni.hideLoading();
            },
          });
        }
      },
      realNameVerify() {
        uni.navigateTo({
          url: '/uni_modules/uni-id-pages/pages/userinfo/realname-verify/realname-verify',
        });
      },
    },
  };
</script>
<style scoped>
  page,
  view,
  text,
  image,
  button,
  input,
  uni-id-pages-avatar {
    box-sizing: border-box;
    letter-spacing: 0;
  }

  page {
    min-height: 100%;
    background: #f9e7bd;
  }

  view {
    display: flex;
    flex-direction: column;
  }

  .userinfo-page {
    min-height: 100vh;
    background: #f9e7bd;
    color: #4b170d;
  }

  .userinfo-scene {
    position: relative;
    width: 100%;
    max-width: 430px;
    min-height: 100vh;
    margin: 0 auto;
    overflow: hidden;
    background: #fae8be;
  }

  .userinfo-hero {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 178px;
    flex: 0 0 178px;
    overflow: hidden;
  }

  .hero-background {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    padding-top: calc(8px + var(--userinfo-status-bar-height, 0px));
  }

  .hero-title-row {
    position: relative;
    width: 100%;
    height: 53px;
    flex: 0 0 53px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 0 60px;
  }

  .back-button {
    position: absolute;
    top: 7px;
    left: 14px;
    z-index: 3;
    width: 39px;
    height: 39px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(218, 151, 58, 0.58);
    border-radius: 50%;
    background: rgba(255, 249, 229, 0.76);
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.58), 0 2px 6px rgba(112, 58, 18, 0.14);
    transition: opacity 120ms ease, transform 120ms ease;
  }

  .back-button-pressed {
    opacity: 0.78;
    transform: scale(0.94);
  }

  .hero-title {
    display: block;
    flex-shrink: 0;
    margin: 0 10px;
    color: #71300c;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
    font-size: 40px;
    font-weight: 900;
    line-height: 53px;
    text-align: center;
    text-shadow: 0 1px 0 rgba(255, 248, 220, 0.72), 0 2px 2px rgba(102, 46, 8, 0.12);
    white-space: nowrap;
  }

  .title-cloud {
    width: 44px;
    min-width: 0;
    height: 20px;
    flex-shrink: 1;
    flex-direction: row;
    align-items: flex-end;
    overflow: hidden;
    opacity: 0.88;
  }

  .title-cloud-right {
    transform: scaleX(-1);
  }

  .title-cloud-curl {
    width: 18px;
    height: 11px;
    flex-shrink: 0;
    border: 2px solid #d99331;
    border-right: 0;
    border-bottom: 0;
    border-radius: 13px 0 0;
  }

  .title-cloud-tail {
    width: 26px;
    height: 2px;
    margin-bottom: 1px;
    background: linear-gradient(90deg, #d99331 0%, rgba(217, 147, 49, 0.08) 100%);
  }

  .lantern-word {
    position: absolute;
    top: calc(101px + var(--userinfo-safe-area-offset, 0px));
    left: 31px;
    z-index: 2;
    display: block;
    width: 28px;
    color: #d83711;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', serif;
    font-size: 27px;
    font-weight: 900;
    line-height: 34px;
    text-align: center;
    text-shadow: 0 1px 0 rgba(255, 244, 213, 0.72);
  }

  .page-content {
    position: relative;
    z-index: 3;
    width: 100%;
    margin-top: -34px;
    padding: 0 16px 24px;
    padding-bottom: calc(24px + constant(safe-area-inset-bottom));
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }

  .ornate-panel {
    position: relative;
    width: 100%;
    border: 2px solid #dfa153;
    background: rgba(254, 248, 235, 0.98);
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.92), inset 0 0 0 4px rgba(218, 151, 58, 0.2), 0 5px 13px rgba(125, 66, 19, 0.16);
  }

  .ornate-panel::before {
    position: absolute;
    top: 7px;
    right: 7px;
    bottom: 7px;
    left: 7px;
    z-index: 0;
    border: 1px solid rgba(223, 164, 82, 0.25);
    content: '';
    pointer-events: none;
  }

  .panel-content {
    position: relative;
    z-index: 1;
    width: 100%;
  }

  .profile-panel {
    border-radius: 24px;
  }

  .profile-panel::before {
    border-radius: 17px;
  }

  .profile-content {
    min-height: 148px;
    align-items: center;
    justify-content: center;
    padding: 15px 16px 14px;
  }

  .avatar-editor {
    position: relative;
    width: 94px;
    height: 94px;
    flex: 0 0 94px;
  }

  .avatar-frame {
    width: 94px;
    height: 94px;
    flex: 0 0 94px;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 2px solid rgba(221, 159, 73, 0.7);
    border-radius: 50%;
    background: #f6e8ce;
    box-shadow: inset 0 0 0 3px rgba(255, 251, 239, 0.7), 0 3px 7px rgba(111, 61, 21, 0.14);
  }

  .avatar-control {
    display: block;
    width: 84px;
    height: 84px;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border-radius: 50%;
    background: transparent;
  }

  .avatar-control::after {
    border: 0;
  }

  .avatar-edit-badge {
    position: absolute;
    right: -1px;
    bottom: 2px;
    z-index: 2;
    width: 28px;
    height: 28px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff7e4;
    border-radius: 50%;
    background: #e84a17;
    box-shadow: 0 2px 5px rgba(133, 49, 4, 0.2);
    pointer-events: none;
  }

  .profile-name,
  .profile-subtitle {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-name {
    margin-top: 8px;
    color: #4b170d;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
    font-size: 20px;
    font-weight: 700;
    line-height: 27px;
  }

  .profile-subtitle {
    margin-top: 1px;
    color: #96745f;
    font-size: 12px;
    line-height: 18px;
  }

  .section-panel {
    margin-top: 12px;
    border-radius: 22px;
  }

  .section-panel::before {
    border-radius: 15px;
  }

  .section-panel-content {
    padding: 12px 13px 7px;
  }

  .section-heading {
    width: 100%;
    height: 28px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 0 10px;
  }

  .section-title {
    display: block;
    flex-shrink: 0;
    margin: 0 6px;
    color: #4d190f;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
    font-size: 18px;
    font-weight: 700;
    line-height: 26px;
    white-space: nowrap;
  }

  .heading-rule {
    height: 1px;
    min-width: 12px;
    flex: 1;
    background: linear-gradient(90deg, transparent, #dda143);
  }

  .heading-rule-right {
    background: linear-gradient(90deg, #dda143, transparent);
  }

  .heading-ornament {
    display: block;
    flex-shrink: 0;
    color: #dda143;
    font-family: Georgia, serif;
    font-size: 19px;
    line-height: 20px;
  }

  .heading-ornament-left {
    transform: scaleX(-1);
  }

  .menu-list {
    width: 100%;
    margin-top: 4px;
  }

  .list-item {
    width: 100%;
    min-height: 60px;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 8px 4px;
    border-bottom: 1px dashed rgba(211, 146, 68, 0.26);
    transition: background-color 120ms ease, opacity 120ms ease;
  }

  .list-item:last-child {
    border-bottom: 0;
  }

  .list-item-pressed {
    background: rgba(245, 224, 187, 0.42);
    opacity: 0.82;
  }

  .list-item-static {
    cursor: default;
  }

  .item-left {
    min-width: 108px;
    max-width: 47%;
    flex: 0 1 47%;
    flex-direction: row;
    align-items: center;
  }

  .item-icon {
    width: 38px;
    height: 38px;
    flex: 0 0 38px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(218, 151, 58, 0.3);
    border-radius: 50%;
    box-shadow: inset 0 0 0 2px rgba(255, 252, 242, 0.5);
  }

  .item-icon-nickname {
    background: #f7e8c8;
  }

  .item-icon-mobile {
    border-color: rgba(71, 124, 105, 0.3);
    background: #e0eadf;
  }

  .item-icon-email {
    background: #f8e6be;
  }

  .item-icon-auth {
    background: #f4dfd0;
  }

  .item-icon-password {
    background: #eee0d1;
  }

  .item-icon-danger {
    border-color: rgba(185, 67, 45, 0.26);
    background: #f3ddd3;
  }

  .item-title {
    display: block;
    min-width: 0;
    margin-left: 11px;
    overflow: hidden;
    color: #4b170d;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
    font-size: 16px;
    font-weight: 700;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-title-danger {
    color: #9e3928;
  }

  .item-right {
    min-width: 0;
    flex: 1;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    margin-left: 8px;
  }

  .item-right-static {
    padding-right: 7px;
  }

  .item-value {
    display: block;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: #96745f;
    font-size: 13px;
    line-height: 20px;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-value-danger {
    color: #b76854;
  }

  .list-arrow {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
  }

  .status-tag {
    display: block;
    flex-shrink: 0;
    padding: 2px 8px;
    border: 1px solid rgba(211, 117, 61, 0.26);
    border-radius: 10px;
    background: #f6e2d2;
    color: #a84b2e;
    font-size: 12px;
    line-height: 16px;
    white-space: nowrap;
  }

  .status-tag-verified {
    border-color: rgba(71, 124, 105, 0.25);
    background: #e0eadf;
    color: #477c69;
  }

  .login-button {
    display: flex;
    width: 100%;
    height: 52px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin: 16px 0 0;
    padding: 0 16px;
    border: 2px solid #efa950;
    border-radius: 15px;
    background: linear-gradient(180deg, #f2551d 0%, #e33e0f 100%);
    box-shadow: inset 0 0 0 1px rgba(255, 203, 100, 0.7), inset 0 -2px 4px rgba(133, 49, 4, 0.15), 0 3px 8px rgba(141, 54, 9, 0.2);
    line-height: 1;
    transition: opacity 120ms ease, transform 120ms ease;
  }

  .login-button::after,
  .dialog-button::after {
    border: 0;
  }

  .login-button-pressed,
  .dialog-button-pressed {
    opacity: 0.86;
    transform: scale(0.985);
  }

  .login-button-text {
    margin-left: 7px;
    color: #fffdf5;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
    font-size: 18px;
    font-weight: 700;
    line-height: 24px;
    text-shadow: 0 1px 1px rgba(112, 36, 3, 0.24);
  }

  .nickname-dialog {
    position: relative;
    width: calc(100vw - 40px);
    max-width: 360px;
    overflow: hidden;
    border: 2px solid #dfa153;
    border-radius: 18px;
    background: #fef8eb;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.92), inset 0 0 0 4px rgba(218, 151, 58, 0.2), 0 10px 26px rgba(88, 44, 15, 0.24);
  }

  .nickname-dialog::before {
    position: absolute;
    top: 7px;
    right: 7px;
    bottom: 7px;
    left: 7px;
    z-index: 0;
    border: 1px solid rgba(223, 164, 82, 0.25);
    border-radius: 11px;
    content: '';
    pointer-events: none;
  }

  .dialog-content {
    position: relative;
    z-index: 1;
    width: 100%;
    padding: 18px 18px 16px;
  }

  .dialog-heading {
    padding: 0;
  }

  .nickname-input-wrap {
    width: 100%;
    height: 48px;
    margin-top: 14px;
    overflow: hidden;
    border: 1px solid #e2b66f;
    border-radius: 10px;
    background: #fffaf0;
    box-shadow: inset 0 2px 4px rgba(114, 65, 24, 0.06);
  }

  .nickname-input {
    display: block;
    width: 100%;
    height: 46px;
    padding: 0 13px;
    color: #4b170d;
    font-size: 15px;
    line-height: 46px;
  }

  .dialog-actions {
    width: 100%;
    flex-direction: row;
    margin-top: 14px;
  }

  .dialog-button {
    display: block;
    height: 44px;
    flex: 1;
    margin: 0;
    padding: 0 12px;
    border-radius: 10px;
    font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Songti SC', serif;
    font-size: 16px;
    font-weight: 700;
    line-height: 42px;
    transition: opacity 120ms ease, transform 120ms ease;
  }

  .dialog-button-cancel {
    margin-right: 8px;
    border: 1px solid #e4bf82;
    background: #fff8e9;
    color: #805138;
  }

  .dialog-button-confirm {
    margin-left: 8px;
    border: 1px solid #efa950;
    background: linear-gradient(180deg, #f2551d 0%, #e33e0f 100%);
    color: #fffdf5;
    box-shadow: inset 0 0 0 1px rgba(255, 203, 100, 0.62), 0 2px 5px rgba(141, 54, 9, 0.16);
  }

  @media (min-width: 431px) {
    .userinfo-scene {
      box-shadow: 0 0 28px rgba(107, 59, 17, 0.18);
    }
  }

  @media (max-width: 360px) {
    .back-button {
      left: 11px;
    }

    .hero-title {
      margin: 0 7px;
      font-size: 36px;
    }

    .hero-title-row {
      padding-right: 56px;
      padding-left: 56px;
    }

    .title-cloud {
      width: 28px;
    }

    .title-cloud-curl {
      width: 12px;
    }

    .title-cloud-tail {
      width: 16px;
    }

    .page-content {
      padding-right: 12px;
      padding-left: 12px;
    }

    .section-panel-content {
      padding-right: 10px;
      padding-left: 10px;
    }

    .list-item {
      padding-right: 2px;
      padding-left: 2px;
    }

    .item-left {
      min-width: 102px;
    }

    .item-icon {
      width: 36px;
      height: 36px;
      flex-basis: 36px;
    }

    .item-title {
      margin-left: 9px;
    }

    .item-right {
      margin-left: 5px;
    }

    .list-arrow {
      width: 24px;
      flex-basis: 24px;
      margin-left: 2px;
    }

    .dialog-content {
      padding-right: 14px;
      padding-left: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .back-button,
    .list-item,
    .login-button,
    .dialog-button {
      transition: none;
    }
  }
</style>
