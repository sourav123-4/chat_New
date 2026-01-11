package com.chatappnew

import android.os.BatteryManager
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class BatteryModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "BatteryModule"
    }

    @ReactMethod
    fun getBatteryLevel(promise: Promise) {
        try {
            val bm = reactContext.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            val batteryLevel = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            promise.resolve(batteryLevel)
        } catch (e: Exception) {
            promise.reject("BATTERY_ERROR", e)
        }
    }
}
