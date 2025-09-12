package com.example.chatapp

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

class ChatApp : Application() {
	override fun onCreate() {
		super.onCreate()
		createDefaultNotificationChannel()
	}

	private fun createDefaultNotificationChannel() {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			val channel = NotificationChannel(
				DEFAULT_CHANNEL_ID,
				"Chat Notifications",
				NotificationManager.IMPORTANCE_DEFAULT
			)
			channel.description = "Notifications for chat messages"
			val manager = getSystemService(NotificationManager::class.java)
			manager.createNotificationChannel(channel)
		}
	}

	companion object {
		const val DEFAULT_CHANNEL_ID = "chat_default_channel"
	}
}