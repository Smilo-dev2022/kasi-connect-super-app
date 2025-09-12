package com.example.chatapp.notifications

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.chatapp.ChatApp
import com.example.chatapp.MainActivity
import com.example.chatapp.R
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class AppFirebaseMessagingService : FirebaseMessagingService() {
	override fun onNewToken(token: String) {
		// You can log or send the token to your server here.
	}

	override fun onMessageReceived(message: RemoteMessage) {
		super.onMessageReceived(message)

		val title = message.notification?.title ?: message.data["title"] ?: "New message"
		val body = message.notification?.body ?: message.data["body"] ?: "You have a new message"

		val intent = Intent(this, MainActivity::class.java)
		intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
		val pendingIntent = PendingIntent.getActivity(
			this,
			0,
			intent,
			PendingIntent.FLAG_IMMUTABLE
		)

		val notification = NotificationCompat.Builder(this, ChatApp.DEFAULT_CHANNEL_ID)
			.setSmallIcon(R.drawable.ic_notification)
			.setContentTitle(title)
			.setContentText(body)
			.setContentIntent(pendingIntent)
			.setAutoCancel(true)
			.build()

		NotificationManagerCompat.from(this).notify(1001, notification)
	}
}