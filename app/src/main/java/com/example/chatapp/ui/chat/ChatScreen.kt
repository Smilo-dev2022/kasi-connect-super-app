package com.example.chatapp.ui.chat

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun ChatScreen(groupId: String, viewModel: ChatViewModel, onBack: () -> Unit) {
	val messages by viewModel.messagesFor(groupId).collectAsStateWithLifecycle()
	var input by remember { mutableStateOf("") }

	Column(modifier = Modifier.fillMaxSize()) {
		TopAppBar(
			title = { Text("Chat") },
			navigationIcon = {
				IconButton(onClick = onBack) {
					Icon(Icons.Default.ArrowBack, contentDescription = "Back")
				}
			}
		)
		LazyColumn(
			modifier = Modifier.weight(1f).fillMaxWidth().padding(8.dp),
			reverseLayout = false
		) {
			items(messages) { msg ->
				val mine = msg.sender == "Me"
				Row(
					modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
					horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start
				) {
					Surface(
						shape = MaterialTheme.shapes.medium,
						color = if (mine) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
					) {
						Text(
							text = msg.text,
							modifier = Modifier.padding(12.dp),
							textAlign = TextAlign.Start
						)
					}
				}
			}
		}
		Row(
			modifier = Modifier.fillMaxWidth().padding(8.dp),
			verticalAlignment = Alignment.CenterVertically
		) {
			OutlinedTextField(
				value = input,
				onValueChange = { input = it },
				modifier = Modifier.weight(1f),
				placeholder = { Text("Message") }
			)
			Spacer(Modifier.width(8.dp))
			Button(onClick = {
				if (input.isNotBlank()) {
					viewModel.sendMessage(groupId, input.trim())
					input = ""
				}
			}) { Text("Send") }
		}
	}
}