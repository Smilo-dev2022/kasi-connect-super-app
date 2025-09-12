package com.example.agentone.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class Message(val id: String, val author: String, val content: String, val isMine: Boolean)

@Composable
fun ChatScreen(onBack: () -> Unit) {
    val messages = remember {
        mutableStateListOf(
            Message("1", "Alex", "Welcome to the group!", false),
            Message("2", "You", "Thanks! Happy to be here.", true),
            Message("3", "Sam", "Let's plan today's tasks.", false)
        )
    }
    val inputState = remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(title = { Text("Group Chat") })
        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 12.dp),
            reverseLayout = false
        ) {
            items(messages) { message ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                    horizontalArrangement = if (message.isMine) Arrangement.End else Arrangement.Start
                ) {
                    Box(
                        modifier = Modifier
                            .background(
                                if (message.isMine) Color(0xFFDCF8C6) else Color(0xFFEDEDED),
                                shape = MaterialTheme.shapes.medium
                            )
                            .padding(12.dp)
                    ) {
                        Column(horizontalAlignment = if (message.isMine) Alignment.End else Alignment.Start) {
                            Text(message.author, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Text(message.content)
                        }
                    }
                }
            }
        }
        Row(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = inputState.value,
                onValueChange = { inputState.value = it },
                modifier = Modifier.weight(1f)
            )
            Spacer(Modifier.width(8.dp))
            Button(onClick = {
                val content = inputState.value.trim()
                if (content.isNotEmpty()) {
                    messages.add(Message((messages.size + 1).toString(), "You", content, true))
                    inputState.value = ""
                }
            }) {
                Text("Send")
            }
        }
    }
}

