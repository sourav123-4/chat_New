package com.chatappnew

import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.util.Log
import android.widget.Toast
import android.widget.TextView
import android.widget.LinearLayout
import android.widget.ImageView
import android.graphics.Typeface
import android.graphics.Color
import android.util.TypedValue
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ToastModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val TAG = "NativeToast"

  override fun getName(): String = "NativeToast"

  @ReactMethod
  fun show(message: String, duration: Int, position: String?) {

    Handler(Looper.getMainLooper()).post {

      // Convert ms → Toast length
      val toastDuration =
        if (duration < 2500) Toast.LENGTH_SHORT else Toast.LENGTH_LONG

      // Create a custom view for the toast so we can reliably control position
      val toast = Toast(reactContext)

      val scale = reactContext.resources.displayMetrics.density
      val padding = (14 * scale + 0.5f).toInt()

      // Container: horizontal layout with logo (ImageView) + bold text (TextView)
      val container = LinearLayout(reactContext).apply {
        orientation = LinearLayout.HORIZONTAL
        setBackgroundResource(android.R.drawable.toast_frame)
        setPadding(padding, padding / 2, padding, padding / 2)
        gravity = Gravity.CENTER_VERTICAL
      }

      // Try to use app launcher icon as logo; fall back to a system icon
      val logoResId = reactContext.resources.getIdentifier("ic_launcher", "mipmap", reactContext.packageName)
      val logoDrawable = if (logoResId != 0) logoResId else android.R.drawable.ic_dialog_info

      val imageSize = (20 * scale + 0.5f).toInt()
      val imageMargin = (8 * scale + 0.5f).toInt()
      val iv = ImageView(reactContext).apply {
        setImageResource(logoDrawable)
        layoutParams = LinearLayout.LayoutParams(imageSize, imageSize).apply {
          marginEnd = imageMargin
        }
        scaleType = ImageView.ScaleType.FIT_CENTER
        contentDescription = "toast_logo"
      }

      val tv = TextView(reactContext).apply {
        text = message
        setTextColor(Color.GRAY)
        setTypeface(null, Typeface.NORMAL)
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
        gravity = Gravity.CENTER_VERTICAL
      }

      container.addView(iv)
      container.addView(tv)

      toast.view = container
      toast.duration = toastDuration

      // Decide gravity: use TOP + CENTER_HORIZONTAL for top, CENTER for center,
      // and BOTTOM + CENTER_HORIZONTAL for default/bottom
      val gravity = when (position?.lowercase()) {
        "top" -> Gravity.TOP or Gravity.CENTER_HORIZONTAL
        "center" -> Gravity.CENTER
        else -> Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
      }

      // Offset for visuals: push in from the top/bottom edges so toast isn't flush
      val yOffset = when (position?.lowercase()) {
        "top" -> 140
        "center" -> 0
        else -> 140
      }

      // Debug: log parameters so we can confirm behavior when testing
      try {
        Log.d(TAG, "show: message=$message duration=$duration position=$position toastDuration=$toastDuration gravity=$gravity yOffset=$yOffset customView=${tv != null}")
        toast.setGravity(gravity, 0, yOffset)
        toast.show()
      } catch (e: Exception) {
        Log.e(TAG, "Error showing toast", e)
      }
    }
  }
}
