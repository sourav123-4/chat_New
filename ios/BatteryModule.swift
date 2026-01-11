//
//  BatteryModule.swift
//  ChatAppNew
//
//  Created by Sourav Mahanty on 12/12/25.
//

import Foundation
import UIKit

@objc(BatteryModule)
class BatteryModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool { return false }

  @objc
  func getBatteryLevel(_ resolve: RCTPromiseResolveBlock,
                       rejecter reject: RCTPromiseRejectBlock) {

    UIDevice.current.isBatteryMonitoringEnabled = true
    let level = UIDevice.current.batteryLevel

    if level < 0 {
      reject("error", "Unable to fetch battery level", nil)
    } else {
      let percentage = Int(level * 100)
      resolve(percentage)
    }
  }
}

