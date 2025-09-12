package com.example.chatapp.ui.chat

import androidx.lifecycle.ViewModel
import com.example.chatapp.data.Message
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class ChatViewModel : ViewModel() {
	private val _messagesByGroup: MutableMap<String, MutableStateFlow<List<Message>>> = mutableMapOf()

	fun messagesFor(groupId: String): StateFlow<List<Message>> {
		return _messagesByGroup.getOrPut(groupId) {
			MutableStateFlow(generateSeedMessages(groupId))
		}.asStateFlow()
	}

	fun sendMessage(groupId: String, text: String, sender: String = "Me") {
		val flow = _messagesByGroup.getOrPut(groupId) {
			MutableStateFlow(emptyList())
		}
		val current = flow.value
		flow.value = current + Message(groupId = groupId, sender = sender, text = text)
	}

	private fun generateSeedMessages(groupId: String): List<Message> {
		return listOf(
			Message(groupId = groupId, sender = "Alice", text = "Welcome to the group!"),
			Message(groupId = groupId, sender = "Bob", text = "Hi everyone"),
		)
	}
}