//
//  ScopeparserBridge.h
//
//
//  Created by apple2 on 2025/10/9.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ScopeparserBridge : NSObject

/// 添加语法定义并返回句柄
/// @param langId 语言ID
/// @param jsonText JSON格式的语法定义
/// @return 语法句柄，用于后续操作
- (id)addGrammarWithLangId:(NSString *)langId jsonText:(NSString *)jsonText;

/// 重置语法句柄，以便再次使用
/// @param handle 语法句柄
- (void)resetStackHandle:(id)handle;

/// 销毁语法句柄，释放资源
/// @param handle 语法句柄
- (void)destroyStackHandle:(id)handle;

/// 解析文本行并返回token信息
/// @param handle 语法句柄
/// @param langId 语言ID
/// @param text 要解析的文本行
/// @return JSON格式的token信息数组
- (NSString *)tokenizeLineWithHandle:(id)handle langId:(NSString *)langId text:(NSString *)text;

@end

NS_ASSUME_NONNULL_END
