//
//  ScopeparserBridge.h
//
//
//  Created by apple2 on 2025/10/9.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ScopeparserBridge : NSObject

/// 初始化cmark-gfm库
/// @return 初始化是否成功
- (BOOL)initializeCmarkGfm;

/// 将markdown文本转换为JSON格式
/// @param markdownText markdown文本
/// @return JSON格式的字符串，失败时返回nil
- (nullable NSString *)md2json:(NSString *)markdownText;

/// 将markdown文本转换为HTML格式
/// @param markdownText markdown文本
/// @return HTML格式的字符串，失败时返回nil
- (nullable NSString *)md2html:(NSString *)markdownText;

@end

NS_ASSUME_NONNULL_END
