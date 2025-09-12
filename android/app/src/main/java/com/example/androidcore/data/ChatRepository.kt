package com.example.androidcore.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

data class Chat(
	val id: String,
	val title: String,
	val subtitle: String? = null,
	val isGroup: Boolean = false,
	val memberNames: List<String> = emptyList()
)

data class Message(
	val id: String,
	val chatId: String,
	val text: String,
	val timestampMs: Long,
	val isMine: Boolean,
	val mediaUri: String? = null
)

class ChatRepository {
	private val chatsState: MutableStateFlow<List<Chat>>
	private val chatIdToMessages: MutableMap<String, MutableStateFlow<List<Message>>> = LinkedHashMap()

	private val contacts: List<String> = (1..300).map { index -> "User $index" }

	init {
		val initialChats = (1..12).map { index ->
			val chatId = UUID.randomUUID().toString()
			val isGroup = index % 4 == 0
			val members = if (isGroup) listOf("User ${index}", "User ${index + 1}", "User ${index + 2}") else emptyList()
			val chat = Chat(
				id = chatId,
				title = if (isGroup) "Group $index" else "Chat $index",
				subtitle = "Last message preview…",
				isGroup = isGroup,
				memberNames = members
			)
			chatIdToMessages[chatId] = MutableStateFlow(
				listOf(
					Message(
						id = UUID.randomUUID().toString(),
						chatId = chatId,
						text = "Welcome to ${chat.title}",
						timestampMs = System.currentTimeMillis(),
						isMine = false
					)
				)
			)
			chat
		}
		chatsState = MutableStateFlow(initialChats)
	}

	fun getChats(): Flow<List<Chat>> = chatsState.asStateFlow()

	fun getMessages(chatId: String): Flow<List<Message>> =
		chatIdToMessages.getOrPut(chatId) { MutableStateFlow(emptyList()) }.asStateFlow()

	fun getContacts(): List<String> = contacts

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

	suspend fun sendMediaMessage(chatId: String, mediaUri: String) {
		val flow = chatIdToMessages.getOrPut(chatId) { MutableStateFlow(emptyList()) }
		val newMessage = Message(
			id = UUID.randomUUID().toString(),
			chatId = chatId,
			text = "",
			timestampMs = System.currentTimeMillis(),
			isMine = true,
			mediaUri = mediaUri
		)
		flow.value = flow.value + newMessage
	}

	suspend fun createGroupChat(title: String, memberNames: List<String>): String {
		val limitedMembers = memberNames.take(256)
		val chatId = UUID.randomUUID().toString()
		val chat = Chat(
			id = chatId,
			title = title.ifBlank { "New Group" },
			subtitle = "Group created",
			isGroup = true,
			memberNames = limitedMembers
		)
		chatIdToMessages[chatId] = MutableStateFlow(
			listOf(
				Message(
					id = UUID.randomUUID().toString(),
					chatId = chatId,
					text = "You created the group",
					timestampMs = System.currentTimeMillis(),
					isMine = true
				)
			)
		)
		chatsState.value = chatsState.value + chat
		return chatId
	}
}