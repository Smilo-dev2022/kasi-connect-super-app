package com.example.chatapp.data

import java.util.UUID

data class Group(
	val id: String = UUID.randomUUID().toString(),
	val name: String
)

data class Message(
	val id: String = UUID.randomUUID().toString(),
	val groupId: String,
	val sender: String,
	val text: String,
	val timestampMs: Long = System.currentTimeMillis()
)