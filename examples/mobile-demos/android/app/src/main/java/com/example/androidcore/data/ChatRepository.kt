package com.example.androidcore.data

import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

data class Chat(
	val id: String,
	val title: String,
	val subtitle: String? = null,
	val isGroup: Boolean = false,
	val members: List<String> = emptyList()
)

data class Message(
	val id: String,
	val chatId: String,
	val text: String,
	val timestampMs: Long,
	val isMine: Boolean,
	val mediaUrl: String? = null
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

	/**
	 * Creates a new group chat. Enforces 1..256 members.
	 * Returns the new chatId.
	 */
	suspend fun createGroup(title: String, members: List<String>): String {
		require(title.isNotBlank()) { "Title must not be blank" }
		require(members.isNotEmpty()) { "At least one member required" }
		require(members.size <= 256) { "A group can have at most 256 members" }
		val chatId = UUID.randomUUID().toString()
		val chat = Chat(
			id = chatId,
			title = title.trim(),
			subtitle = "Group created",
			isGroup = true,
			members = members
		)
		chatIdToMessages[chatId] = MutableStateFlow(
			listOf(
				Message(
					id = UUID.randomUUID().toString(),
					chatId = chatId,
					text = "Group ${chat.title} created",
					timestampMs = System.currentTimeMillis(),
					isMine = true
				)
			)
		)
		chatsState.value = listOf(chat) + chatsState.value
		return chatId
	}

	suspend fun sendMediaMessage(chatId: String, mediaUrl: String, caption: String? = null) {
		val flow = chatIdToMessages.getOrPut(chatId) { MutableStateFlow(emptyList()) }
		val messageText = caption?.takeIf { it.isNotBlank() } ?: ""
		val newMessage = Message(
			id = UUID.randomUUID().toString(),
			chatId = chatId,
			text = messageText,
			timestampMs = System.currentTimeMillis(),
			isMine = true,
			mediaUrl = mediaUrl
		)
		flow.value = flow.value + newMessage
	}

	// Media picker/upload stubs
	suspend fun pickMediaStub(): String {
		return "https://picsum.photos/seed/${UUID.randomUUID()}/640/360"
	}

	suspend fun uploadMediaStub(localUri: String): String {
		// Simulate network upload
		delay(500)
		return localUri
	}

	suspend fun pickAndUploadMedia(): String {
		val local = pickMediaStub()
		return uploadMediaStub(local)
	}
}