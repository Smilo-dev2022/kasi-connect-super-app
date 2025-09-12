package com.example.androidcore.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Checkbox
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
import coil.compose.AsyncImage
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
fun ChatsScreen(chatRepository: ChatRepository, onOpenChat: (String) -> Unit, onCreateGroup: () -> Unit) {
	val chats by chatRepository.getChats().collectAsState(initial = emptyList())
	Scaffold(topBar = {
		TopAppBar(
			title = { Text("Chats") },
			actions = {
				IconButton(onClick = onCreateGroup) {
					Icon(imageVector = Icons.Filled.Add, contentDescription = "New group")
				}
			}
		)
	}) { inner ->
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
	val mediaPicker = rememberLauncherForActivityResult(
		contract = ActivityResultContracts.PickVisualMedia()
	) { uri ->
		if (uri != null) {
			scope.launch {
				chatRepository.sendMediaMessage(chatId, uri.toString())
			}
		}
	}
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
				IconButton(onClick = {
					mediaPicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
				}) {
					Icon(imageVector = Icons.Filled.AttachFile, contentDescription = "Attach media")
				}
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
				if (message.mediaUri != null) {
					Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
						AsyncImage(model = message.mediaUri, contentDescription = "media", modifier = Modifier
							.fillMaxWidth(0.7f))
						if (message.text.isNotBlank()) {
							Text(text = message.text)
						}
					}
				} else {
					Text(text = message.text)
				}
			}
		}
	}
}

@Composable
fun CreateGroupScreen(
	chatRepository: ChatRepository,
	onBack: () -> Unit,
	onGroupCreated: (String) -> Unit
) {
	val scope = rememberCoroutineScope()
	val contacts = remember { chatRepository.getContacts() }
	val (groupName, setGroupName) = remember { mutableStateOf("") }
	val selected = remember { mutableStateListOf<String>() }
	val canAddMore = selected.size < 256

	Scaffold(topBar = {
		TopAppBar(
			title = { Text("New Group") },
			actions = {
				Button(onClick = {
					scope.launch {
						val chatId = chatRepository.createGroupChat(groupName.trim(), selected.toList())
						onGroupCreated(chatId)
					}
				}, enabled = selected.isNotEmpty()) {
					Text("Create (${selected.size}/256)")
				}
			}
		)
	}) { inner ->
		Column(
			modifier = Modifier
				.fillMaxSize()
				.padding(inner)
		) {
			OutlinedTextField(
				value = groupName,
				onValueChange = setGroupName,
				label = { Text("Group name") },
				modifier = Modifier
					.fillMaxWidth()
					.padding(16.dp),
				singleLine = true
			)
			LazyColumn(
				modifier = Modifier
					.fillMaxSize()
					.padding(16.dp),
				verticalArrangement = Arrangement.spacedBy(8.dp)
			) {
				items(contacts) { name ->
					val isChecked = name in selected
					Row(
						modifier = Modifier
							.fillMaxWidth()
							.clickable {
								if (isChecked) {
									selected.remove(name)
								} else if (canAddMore) {
									selected.add(name)
								}
							},
						verticalAlignment = Alignment.CenterVertically,
						horizontalArrangement = Arrangement.spacedBy(12.dp)
					) {
						Checkbox(checked = isChecked, onCheckedChange = { checked ->
							if (checked && canAddMore) selected.add(name) else if (!checked) selected.remove(name)
						})
						Text(text = name)
					}
				}
			}
		}
	}
}