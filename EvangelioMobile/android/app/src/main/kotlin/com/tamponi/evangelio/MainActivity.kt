package com.tamponi.evangelio

import android.content.Intent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel

class MainActivity : FlutterActivity() {
    private var events: EventChannel.EventSink? = null
    private var pending: String? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, "tumirada/oauth_links")
            .setStreamHandler(
                object : EventChannel.StreamHandler {
                    override fun onListen(arguments: Any?, sink: EventChannel.EventSink) {
                        events = sink
                        pending?.let {
                            sink.success(it)
                            pending = null
                        }
                    }

                    override fun onCancel(arguments: Any?) {
                        events = null
                    }
                },
            )
        handleUri(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleUri(intent)
    }

    private fun handleUri(intent: Intent?) {
        val data = intent?.data?.toString() ?: return
        if (!data.startsWith("com.tamponi.evangelio://oauth")) return
        val sink = events
        if (sink != null) {
            sink.success(data)
        } else {
            pending = data
        }
    }
}
