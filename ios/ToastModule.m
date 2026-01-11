//
//  ToastModule.m
//  ChatAppNew
//
//  Created by Sourav Mahanty on 12/12/25.
//

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NativeToast, NSObject)
RCT_EXTERN_METHOD(
  show:(NSString *)message
  duration:(nonnull NSNumber *)duration
  position:(NSString *)position
)
@end

