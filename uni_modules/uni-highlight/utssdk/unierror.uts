/* 此规范为 uni 规范，可以按照自己的需要选择是否实现 */
import { MyApiErrorCode, MyApiFail } from "./interface.uts"
/**
 * 错误主题
 * 注意：错误主题一般为插件名称，每个组件不同，需要使用时请更改。
 * [可选实现]
 */
export const UniErrorSubject = 'uts-api';


/**
 * 错误信息
 * @UniError
 * [可选实现]
 */
export const MyAPIErrors : Map<MyApiErrorCode, string> = new Map([
  /**
   * 错误码及对应的错误信息
   */
  [9010001, 'custom error mseeage1'],
  [9010002, 'custom error mseeage2'],
]);


/**
 * 错误对象实现
 */
export class MyApiFailImpl extends UniError implements MyApiFail {

  /**
   * 错误对象构造函数
   */
  constructor(errCode : MyApiErrorCode) {
    super();
    this.errSubject = UniErrorSubject;
    this.errCode = errCode;
    this.errMsg = MyAPIErrors.get(errCode) ?? "";
  }
}
