import { NativeEmbedBuilderOptions, defineNativeEmbed } from "@dcloudio/uni-app-runtime";
import { authentication, loginComponentManager, LoginPanel } from '@kit.AccountKit';
import { util } from '@kit.ArkTS';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { BusinessError } from '@kit.BasicServicesKit';

interface ComponentBuilderOptions extends NativeEmbedBuilderOptions {
  show: boolean
  privacyConfig?: string[]
}

interface OnClickPrivacyTextEventDetail {
  tag: string
}

interface OnGetPhoneNumberEventDetail {
	code: string
}

interface OnErrorEventDetail {
	errCode: number
	errMsg: string
}

enum ErrorCode {
  // 账号未登录
  ERROR_CODE_LOGIN_OUT = 1001502001,
  // 网络错误
  ERROR_CODE_NETWORK_ERROR = 1001502005,
  // 系统服务异常
  ERROR_CODE_SYSTEM_SERVICE = 12300001
}

@Entry
@Component
struct GetAuthPhoneNumber {
	@State quickLoginAnonymousPhone: string = '';
	@Prop show: boolean = false;
	@Prop privacyConfig?: string[] = [];
	onClickPrivacyText?: Function;
	onGetPhoneNumber?: Function;
	onReady?: Function;
	onClose?: Function;
	onError?: Function;

	privacyText: loginComponentManager.PrivacyText[] = [];

  controller: loginComponentManager.LoginPanelController = new loginComponentManager.LoginPanelController()
    .setAgreementStatus(loginComponentManager.AgreementStatus.ACCEPTED)
    .onClickLoginWithHuaweiIDButton((error: BusinessError, response: loginComponentManager.HuaweiIDCredential) => {
      hilog.info(0x0000, 'GetAuthPhoneNumberComponent', 'onClickLoginWithHuaweiIDButton');
      if (error) {
        this.dealAllError(error);
        return;
      }
      if (response) {
        hilog.info(0x0000, 'GetAuthPhoneNumberComponent', 'Succeeded in getting response.');
        if (this.onGetPhoneNumber) {
          const detail = {
            code: response.authorizationCode
          } as OnGetPhoneNumberEventDetail

          this.onGetPhoneNumber({
            detail
          })

          if (this.onClose) {
            this.onClose()
          }
        }
      }
    })
    .onClickPrivacyText((error: BusinessError, tag: string) => {
      if (error) {
        this.dealAllError(error);
        return;
      }

      const detail = {
        tag
      } as OnClickPrivacyTextEventDetail

      if (this.onClickPrivacyText) {
        this.onClickPrivacyText({
          detail
        })
      }
    })
    .onClickCloseButton(() => {
      if (this.onClose) {
        this.onClose()
      }
    })

	aboutToAppear () {
    this.buildPrivacyText();
		this.getQuickLoginAnonymousPhone().then(() => {
      if (this.onReady) {
        this.onReady();
      }
    })
	}

  buildPrivacyText () {
    let userCustomPrivacy: loginComponentManager.PrivacyText[] = [];

    if (this.privacyConfig && this.privacyConfig.length > 0) {
      userCustomPrivacy = this.privacyConfig.map((item: string) => {
        return {
          text: `《${item}》`,
          tag: item,
          type: loginComponentManager.TextType.RICH_TEXT
        } as loginComponentManager.PrivacyText
      });
    }

    this.privacyText = [{
      text: '已阅读并同意',
      type: loginComponentManager.TextType.PLAIN_TEXT
    },
      ...userCustomPrivacy,
      {
      text: '和',
      type: loginComponentManager.TextType.PLAIN_TEXT
    }, {
      text: '《华为账号用户认证协议》',
      tag: '华为账号用户认证协议',
      type: loginComponentManager.TextType.RICH_TEXT
    }] as loginComponentManager.PrivacyText[]
  }

	async getQuickLoginAnonymousPhone() {
		const authRequest = new authentication.HuaweiIDProvider().createAuthorizationWithHuaweiIDRequest();

    authRequest.scopes = ['quickLoginAnonymousPhone'];
		authRequest.state = util.generateRandomUUID();
		authRequest.forceAuthorization = false;

    const controller = new authentication.AuthenticationController();
		try {
		  return controller.executeRequest(authRequest).then((response: authentication.AuthorizationWithHuaweiIDResponse) => {
			const anonymousPhone = response.data?.extraInfo?.quickLoginAnonymousPhone as string;
			if (anonymousPhone) {
			  hilog.info(0x0000, 'GetAuthPhoneNumberComponent', anonymousPhone);
			  this.quickLoginAnonymousPhone = anonymousPhone;
			  return;
			}
			hilog.info(0x0000, 'GetAuthPhoneNumberComponent', 'Succeeded in authentication. AnonymousPhone is empty.');
		  }).catch((error: BusinessError) => {
        this.dealAllError(error);
        })
      } catch (error) {
        this.dealAllError(error);
      }
	  }

  // 错误处理
  dealAllError(error: BusinessError): void {
    hilog.error(0x0000, 'GetAuthPhoneNumberComponent', `Failed to login, errorCode=${error.code}, errorMsg=${error.message}`);

    const detail = {
      errCode: error.code,
      errMsg: ''
    } as OnErrorEventDetail

    if (error.code === ErrorCode.ERROR_CODE_LOGIN_OUT) {
      detail.errMsg = '请登录华为账号并重试或者尝试使用其他方式登录'
    } else if (error.code === ErrorCode.ERROR_CODE_NETWORK_ERROR) {
      detail.errMsg = '网络异常，请检查当前网络状态并重试或者尝试使用其他方式登录'
    } else if (error.code === ErrorCode.ERROR_CODE_SYSTEM_SERVICE) {
      detail.errMsg = '系统服务异常，请稍后重试或者尝试使用其他方式登录'
    } else {
      detail.errMsg = '登录失败，请尝试使用其他方式登录'
    }

    if (this.onError) {
      this.onError({
        detail
      })
    }
  }

  build() {
    if (this.show && this.quickLoginAnonymousPhone) {
      Stack() {
        LoginPanel({
          show: this.show,
          params: {
            appInfo: {
              appIcon: $r('app.media.app_icon'),
              appName: $r('app.string.app_name'),
            },
            privacyText: this.privacyText,
            anonymousPhoneNumber: this.quickLoginAnonymousPhone,
            loginType: loginComponentManager.LoginType.QUICK_LOGIN
          },
          controller: this.controller
        })
      }
      .height('100%')
      .width('100%')
    }
  }
}

@Builder
function ComponentBuilder(options: ComponentBuilderOptions) {
  GetAuthPhoneNumber({
	show: options.show,
    privacyConfig: options.privacyConfig,
    onReady: options?.on?.get('ready'),
	onClose: options?.on?.get('close'),
	onClickPrivacyText: options?.on?.get('clickprivacytext'),
	onGetPhoneNumber: options?.on?.get('getphonenumber'),
	onError: options?.on?.get('error')
  })
}

defineNativeEmbed('appharmonygetphonenumber', {
  builder: ComponentBuilder
})
