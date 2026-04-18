package com.chatappnew

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.WindowManager
import android.widget.TextView
import android.widget.LinearLayout
import android.widget.FrameLayout
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import android.util.TypedValue

class IncomingCallActivity : AppCompatActivity() {

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private val timeoutHandler = Handler(Looper.getMainLooper())
    private val CALL_TIMEOUT_MS = 45_000L // auto-dismiss after 45s

    companion object {
        const val EXTRA_CALLER_NAME = "callerName"
        const val EXTRA_CALL_TYPE   = "callType"
        const val EXTRA_CHANNEL     = "channelName"
        const val EXTRA_TOKEN       = "token"
        const val EXTRA_UID         = "uid"
        const val EXTRA_CONV_ID     = "conversationId"
        const val EXTRA_CALLER_ID   = "callerId"
        const val EXTRA_AVATAR      = "callerAvatar"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Wake screen and show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val km = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            km.requestDismissKeyguard(this, null)
        }

        val callerName = intent.getStringExtra(EXTRA_CALLER_NAME) ?: "Unknown"
        val callType   = intent.getStringExtra(EXTRA_CALL_TYPE)   ?: "audio"
        val isVideo    = callType == "video"

        setContentView(buildUI(callerName, isVideo))

        startRinging()
        startVibration()

        // Auto-dismiss if not answered
        timeoutHandler.postDelayed({ onDecline() }, CALL_TIMEOUT_MS)
    }

    private fun dp(value: Int): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()

    private fun buildUI(callerName: String, isVideo: Boolean): View {
        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#1a1a2e"))
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setPadding(dp(24), dp(80), dp(24), dp(60))
        }

        content.addView(TextView(this).apply {
            text = if (isVideo) "Incoming Video Call" else "Incoming Voice Call"
            setTextColor(Color.parseColor("#99FFFFFF"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            gravity = Gravity.CENTER
        })
        content.addView(spacer(40))
        content.addView(TextView(this).apply {
            text = callerName.firstOrNull()?.uppercaseChar()?.toString() ?: "?"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 48f)
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(dp(120), dp(120)).apply {
                gravity = Gravity.CENTER_HORIZONTAL
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#6A11CB"))
            }
        })
        content.addView(spacer(24))
        content.addView(TextView(this).apply {
            text = callerName
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
            gravity = Gravity.CENTER
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        })
        content.addView(spacer(8))
        content.addView(TextView(this).apply {
            text = "is calling you..."
            setTextColor(Color.parseColor("#AAFFFFFF"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            gravity = Gravity.CENTER
        })
        content.addView(View(this).apply {
            layoutParams = LinearLayout.LayoutParams(1, 0, 1f)
        })

        val btnRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }
        btnRow.addView(buildBtn("✕", "#EF4444", "Decline") { onDecline() })
        btnRow.addView(buildBtn(if (isVideo) "▶" else "✆", "#22C55E", "Accept") { onAccept() })
        content.addView(btnRow)
        root.addView(content)
        return root
    }

    private fun spacer(h: Int) = View(this).apply {
        layoutParams = LinearLayout.LayoutParams(1, dp(h))
    }

    private fun buildBtn(icon: String, color: String, label: String, onClick: () -> Unit) =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            addView(TextView(this@IncomingCallActivity).apply {
                text = icon
                setTextColor(Color.WHITE)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(dp(72), dp(72)).apply {
                    gravity = Gravity.CENTER_HORIZONTAL
                }
                background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(Color.parseColor(color))
                }
                setOnClickListener { onClick() }
            })
            addView(TextView(this@IncomingCallActivity).apply {
                text = label
                setTextColor(Color.parseColor("#AAFFFFFF"))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
                gravity = Gravity.CENTER
                setPadding(0, dp(8), 0, 0)
            })
        }

    private fun startRinging() {
        try {
            audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager

            // Request audio focus on STREAM_RING
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setAcceptsDelayedFocusGain(false)
                    .setOnAudioFocusChangeListener {}
                    .build()
                audioManager?.requestAudioFocus(audioFocusRequest!!)
            } else {
                @Suppress("DEPRECATION")
                audioManager?.requestAudioFocus(null, AudioManager.STREAM_RING, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
            }

            // Use MediaPlayer for reliable looping
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

            mediaPlayer = MediaPlayer().apply {
                setDataSource(applicationContext, uri)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setLegacyStreamType(AudioManager.STREAM_RING)
                        .build()
                )
                isLooping = true
                setVolume(1.0f, 1.0f)
                prepare()
                start()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun startVibration() {
        val pattern = longArrayOf(0, 800, 600) // vibrate 800ms, pause 600ms, repeat

        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(pattern, 0)
        }
    }

    private fun stopAll() {
        timeoutHandler.removeCallbacksAndMessages(null)
        try { mediaPlayer?.stop(); mediaPlayer?.release(); mediaPlayer = null } catch (_: Exception) {}
        try { vibrator?.cancel(); vibrator = null } catch (_: Exception) {}
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest?.let { audioManager?.abandonAudioFocusRequest(it) }
            } else {
                @Suppress("DEPRECATION")
                audioManager?.abandonAudioFocus(null)
            }
        } catch (_: Exception) {}
    }

    private fun onAccept() {
        stopAll()
        packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("callAction", "accept")
            putExtra(EXTRA_CALLER_NAME, intent.getStringExtra(EXTRA_CALLER_NAME))
            putExtra(EXTRA_CALL_TYPE,   intent.getStringExtra(EXTRA_CALL_TYPE))
            putExtra(EXTRA_CHANNEL,     intent.getStringExtra(EXTRA_CHANNEL))
            putExtra(EXTRA_TOKEN,       intent.getStringExtra(EXTRA_TOKEN))
            putExtra(EXTRA_UID,         intent.getStringExtra(EXTRA_UID))
            putExtra(EXTRA_CONV_ID,     intent.getStringExtra(EXTRA_CONV_ID))
            putExtra(EXTRA_CALLER_ID,   intent.getStringExtra(EXTRA_CALLER_ID))
            putExtra(EXTRA_AVATAR,      intent.getStringExtra(EXTRA_AVATAR))
        }?.let { startActivity(it) }
        finish()
    }

    private fun onDecline() {
        stopAll()
        packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("callAction", "decline")
            putExtra(EXTRA_CHANNEL, intent.getStringExtra(EXTRA_CHANNEL))
            putExtra(EXTRA_CONV_ID, intent.getStringExtra(EXTRA_CONV_ID))
        }?.let { startActivity(it) }
        finish()
    }

    override fun onDestroy() {
        stopAll()
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { /* block */ }
}
