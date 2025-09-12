package com.example.androidcore.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.example.androidcore.data.AuthRepository
import com.example.androidcore.data.Chat
import com.example.androidcore.data.ChatRepository
import com.example.androidcore.data.Message
import kotlinx.coroutines.launch

@Composable
fun SplashScreen(authRepository: AuthRepository, onDecide: (Boolean) -> Unit) {
	val isSignedIn by authRepository.isSignedInFlow.collectAsState(initial = false)
	LaunchedEffect(isSignedIn) {
		onDecide(isSignedIn)
	}
	Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
		Text("Loading…")
	}
}

@Composable
fun LoginScreen(authRepository: AuthRepository, onLoggedIn: () -> Unit) {
	val scope = rememberCoroutineScope()
	val (email, setEmail) = remember { mutableStateOf("") }
	val (password, setPassword) = remember { mutableStateOf("") }

	Column(
		modifier = Modifier
			.fillMaxSize()
			.padding(24.dp),
		horizontalAlignment = Alignment.CenterHorizontally,
		verticalArrangement = Arrangement.Center
	) {
		Text(text = "Sign in", style = MaterialTheme.typography.headlineSmall)
		Spacer(Modifier.height(16.dp))
		OutlinedTextField(value = email, onValueChange = setEmail, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth())
		Spacer(Modifier.height(8.dp))
		OutlinedTextField(value = password, onValueChange = setPassword, label = { Text("Password") }, singleLine = true, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
		Spacer(Modifier.height(16.dp))
		Button(onClick = {
			scope.launch {
				val ok = authRepository.signIn(email.trim(), password)
				if (ok) onLoggedIn()
			}
		}, enabled = email.isNotBlank() && password.isNotBlank(), modifier = Modifier.fillMaxWidth()) {
			Text("Continue")
		}
	}
}

@Composable
fun ChatsScreen(chatRepository: ChatRepository, onOpenChat: (String) -> Unit) {
	val chats by chatRepository.getChats().collectAsState(initial = emptyList())
	Scaffold(topBar = { TopAppBar(title = { Text("Chats") }) }) { inner ->
		LazyColumn(
			modifier = Modifier
				.fillMaxSize()
				.padding(inner)
				.padding(16.dp),
			verticalArrangement = Arrangement.spacedBy(12.dp)
		) {
			items(chats, key = { it.id }) { chat ->
				ChatListItem(chat = chat, onClick = { onOpenChat(chat.id) })
			}
		}
	}
}

@Composable
fun ChatListItem(chat: Chat, onClick: () -> Unit) {
	Column(
		modifier = Modifier
			.fillMaxWidth()
			.clickable { onClick() }
			.background(MaterialTheme.colorScheme.surfaceVariant)
			.padding(16.dp)
	) {
		Text(text = chat.title, style = MaterialTheme.typography.titleMedium)
		Text(text = chat.subtitle ?: "Tap to open", style = MaterialTheme.typography.bodyMedium)
	}
}

@Composable
fun ChatDetailScreen(chatId: String, chatRepository: ChatRepository, onBack: () -> Unit) {
	val scope = rememberCoroutineScope()
	val messages by chatRepository.getMessages(chatId).collectAsState(initial = emptyList())
	val (input, setInput) = remember { mutableStateOf("") }
	Scaffold(topBar = { TopAppBar(title = { Text(chatId) }) }) { inner ->
		Column(
			modifier = Modifier
				.fillMaxSize()
				.padding(inner)
		) {
			LazyColumn(
				modifier = Modifier
					.weight(1f)
					.fillMaxWidth()
					.padding(16.dp),
				verticalArrangement = Arrangement.spacedBy(8.dp)
			) {
				items(messages, key = { it.id }) { message ->
					MessageBubble(message = message)
				}
			}
			Row(
				modifier = Modifier
					.fillMaxWidth()
					.padding(8.dp),
				horizontalArrangement = Arrangement.spacedBy(8.dp),
				verticalAlignment = Alignment.CenterVertically
			) {
				OutlinedTextField(
					value = input,
					onValueChange = setInput,
					modifier = Modifier.weight(1f),
					label = { Text("Message") },
					singleLine = true
				)
				Button(onClick = {
					val text = input.trim()
					if (text.isNotEmpty()) {
						scope.launch {
							chatRepository.sendMessage(chatId, text)
							setInput("")
						}
					}
				}, enabled = input.isNotBlank()) {
					Text("Send")
				}
			}
		}
	}
}

@Composable
fun MessageBubble(message: Message) {
	Column(
		modifier = Modifier
			.fillMaxWidth()
			.padding(horizontal = 8.dp)
	) {
		val alignment = if (message.isMine) Alignment.End else Alignment.Start
		Box(modifier = Modifier.fillMaxWidth(), contentAlignment = alignment) {
			Box(
				modifier = Modifier
					.background(
						if (message.isMine) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
					)
					.padding(12.dp)
			) {
				Text(text = message.text)
			}
		}
	}
}