package com.example.app

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SignInScreen(onSignIn: (String, String) -> Unit) {
	var email by remember { mutableStateOf("") }
	var password by remember { mutableStateOf("") }
	Column(
		modifier = Modifier.fillMaxSize().padding(16.dp),
		horizontalAlignment = Alignment.CenterHorizontally,
		verticalArrangement = Arrangement.Center
	) {
		Text(text = "Sign In", style = MaterialTheme.typography.headlineMedium)
		Spacer(Modifier.height(16.dp))
		OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") })
		Spacer(Modifier.height(8.dp))
		OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Password") })
		Spacer(Modifier.height(16.dp))
		Button(onClick = { onSignIn(email, password) }, modifier = Modifier.fillMaxWidth()) { Text("Continue") }
	}
}

@Composable
fun ChatScreen(onSignOut: () -> Unit) {
	var input by remember { mutableStateOf("") }
	var messages by remember { mutableStateOf(listOf("Welcome to chat")) }
	Scaffold(topBar = { TopAppBar(title = { Text("Chat") }, actions = {
		TextButton(onClick = onSignOut) { Text("Sign out") }
	}) }) { inner ->
		Column(Modifier.fillMaxSize().padding(inner)) {
			LazyColumn(Modifier.weight(1f).fillMaxWidth().padding(16.dp)) {
				items(messages) { msg -> Text(msg) }
			}
			Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
				OutlinedTextField(
					value = input,
					onValueChange = { input = it },
					modifier = Modifier.weight(1f),
					placeholder = { Text("Type a message") }
				)
				Spacer(Modifier.width(8.dp))
				Button(onClick = {
					if (input.isNotBlank()) {
						messages = messages + input
						input = ""
					}
				}) { Text("Send") }
			}
		}
	}
}
