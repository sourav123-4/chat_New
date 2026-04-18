package com.chatappnew

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {

  // Store pending intent data when React context isn't ready yet
  private var pendingCallAction: String? = null
  private var pendingCallData: Bundle? = null

  override fun getMainComponentName(): String = "ChatAppNew"

  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)
    storeCallIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    // Try to emit immediately if React is ready, otherwise store
    val emitted = tryEmitCallAction(intent)
    if (!emitted) storeCallIntent(intent)
  }

  override fun onResume() {
    super.onResume()
    // Try to flush pending call action when app resumes
    flushPendingCallAction()
  }

  private fun storeCallIntent(intent: Intent?) {
    val action = intent?.getStringExtra("callAction") ?: return
    pendingCallAction = action
    pendingCallData = intent.extras
  }

  private fun tryEmitCallAction(intent: Intent?): Boolean {
    val action = intent?.getStringExtra("callAction") ?: return false
    val ctx = reactInstanceManager?.currentReactContext ?: return false
    emitCallAction(ctx, action, intent)
    return true
  }

  private fun flushPendingCallAction() {
    val action = pendingCallAction ?: return
    val data = pendingCallData ?: return
    val ctx = reactInstanceManager?.currentReactContext ?: return

    val fakeIntent = Intent().apply { putExtras(data) }
    emitCallAction(ctx, action, fakeIntent)

    pendingCallAction = null
    pendingCallData = null
  }

  private fun emitCallAction(ctx: ReactContext, action: String, intent: Intent) {
    try {
      val params = Arguments.createMap().apply {
        putString("action", action)
        putString("callerName",     intent.getStringExtra(IncomingCallActivity.EXTRA_CALLER_NAME) ?: "")
        putString("callType",       intent.getStringExtra(IncomingCallActivity.EXTRA_CALL_TYPE)   ?: "audio")
        putString("channelName",    intent.getStringExtra(IncomingCallActivity.EXTRA_CHANNEL)     ?: "")
        putString("token",          intent.getStringExtra(IncomingCallActivity.EXTRA_TOKEN)       ?: "")
        putString("uid",            intent.getStringExtra(IncomingCallActivity.EXTRA_UID)         ?: "0")
        putString("conversationId", intent.getStringExtra(IncomingCallActivity.EXTRA_CONV_ID)     ?: "")
        putString("callerId",       intent.getStringExtra(IncomingCallActivity.EXTRA_CALLER_ID)   ?: "")
        putString("callerAvatar",   intent.getStringExtra(IncomingCallActivity.EXTRA_AVATAR)      ?: "")
      }
      ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("onCallAction", params)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
