//
//  MyNativeModule.swift
//  ChatAppNew
//
//  Created by Sourav Mahanty on 11/12/25.
//

import Foundation

@objc(MyNativeModule)
class MyNativeModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func addNumbers(_ a: NSNumber, b: NSNumber, resolver: RCTPromiseResolveBlock, rejecter: RCTPromiseRejectBlock) {
    let result = a.intValue + b.intValue
    resolver(result)
  }
}
