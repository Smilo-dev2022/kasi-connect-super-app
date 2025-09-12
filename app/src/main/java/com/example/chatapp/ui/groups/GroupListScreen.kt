package com.example.chatapp.ui.groups

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ListItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.chatapp.data.Group

@Composable
fun GroupListScreen(onOpenChat: (String) -> Unit) {
	val groups = remember {
		listOf(
			Group(name = "General"),
			Group(name = "Announcements"),
			Group(name = "Random")
		)
	}
	Column(modifier = Modifier.fillMaxSize().padding(8.dp)) {
		Text(text = "Groups", modifier = Modifier.padding(8.dp))
		LazyColumn {
			items(groups) { group ->
				ListItem(
					headlineContent = { Text(group.name) },
					modifier = Modifier.clickable { onOpenChat(group.id) }
				)
			}
		}
	}
}