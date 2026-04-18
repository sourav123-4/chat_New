package com.chatappnew

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class CallLaunchReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val launchIntent = Intent(context, IncomingCallActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_NO_USER_ACTION or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            // Forward all extras
            intent.extras?.let { putExtras(it) }
        }
        context.startActivity(launchIntent)
    }
}
