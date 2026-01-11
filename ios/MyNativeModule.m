//
//  MyNativeModule.m
//  ChatAppNew
//
//  Created by Sourav Mahanty on 11/12/25.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(MyNativeModule, NSObject)

RCT_EXTERN_METHOD(addNumbers:(nonnull NSNumber)a
                  b:(nonnull NSNumber)b
                  resolver:(RCTPromiseResolveBlock)resolver
                  rejecter:(RCTPromiseRejectBlock)rejecter)

@end
