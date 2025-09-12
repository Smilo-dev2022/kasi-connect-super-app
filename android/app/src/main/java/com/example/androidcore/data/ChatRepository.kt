package com.example.androidcore.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

data class Chat(
	val id: String,
	val title: String,
	val subtitle: String? = null
)

data class Message(
	val id: String,
	val chatId: String,
	val text: String,
	val timestampMs: Long,
	val isMine: Boolean
)

class ChatRepository {
	private val chatsState: MutableStateFlow<List<Chat>>
	private val chatIdToMessages: MutableMap<String, MutableStateFlow<List<Message>>> = LinkedHashMap()

	init {
		val initialChats = (1..12).map { index ->
			val chatId = UUID.randomUUID().toString()
			val chat = Chat(id = chatId, title = "Chat $index", subtitle = "Last message preview…")
			chatIdToMessages[chatId] = MutableStateFlow(
				listOf(
					Message(id = UUID.randomUUID().toString(), chatId = chatId, text = "Welcome to ${chat.title}", timestampMs = System.currentTimeMillis(), isMine = false)
				)
			)
			chat
		}
		chatsState = MutableStateFlow(initialChats)
	}

	fun getChats(): Flow<List<Chat>> = chatsState.asStateFlow()

	fun getMessages(chatId: String): Flow<List<Message>> =
		chatIdToMessages.getOrPut(chatId) { MutableStateFlow(emptyList()) }.asStateFlow()

	suspend fun sendMessage(chatId: String, text: String) {
		val flow = chatIdToMessages.getOrPut(chatId) { MutableStateFlow(emptyList()) }
		val newMessage = Message(
			id = UUID.randomUUID().toString(),
			chatId = chatId,
			text = text,
			timestampMs = System.currentTimeMillis(),
			isMine = true
		)
		flow.value = flow.value + newMessage
	}
}