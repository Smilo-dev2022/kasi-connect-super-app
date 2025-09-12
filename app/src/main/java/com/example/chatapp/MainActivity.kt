package com.example.chatapp

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.chatapp.ui.chat.ChatScreen
import com.example.chatapp.ui.chat.ChatViewModel
import com.example.chatapp.ui.groups.GroupListScreen
import com.example.chatapp.ui.login.LoginScreen
import com.example.chatapp.ui.theme.AppTheme

class MainActivity : ComponentActivity() {
	private val chatViewModel: ChatViewModel by viewModels()

	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)

		setContent {
			AppTheme {
				Surface(color = MaterialTheme.colorScheme.background) {
					AppNav(modifier = Modifier, chatViewModel = chatViewModel)
				}
			}
		}
	}

	private val requestPermissionLauncher =
		registerForActivityResult(ActivityResultContracts.RequestPermission()) { _: Boolean -> }

	@Composable
	private fun AppNav(modifier: Modifier = Modifier, chatViewModel: ChatViewModel) {
		val navController = rememberNavController()

		// Request notification permission on Android 13+
		LaunchedEffect(Unit) {
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
				val hasPermission = ContextCompat.checkSelfPermission(
					this@MainActivity,
					Manifest.permission.POST_NOTIFICATIONS
				) == PackageManager.PERMISSION_GRANTED
				if (!hasPermission) {
					requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
				}
			}
		}

		NavHost(navController = navController, startDestination = "login") {
			composable("login") {
				LoginScreen(
					onLoginSuccess = {
						navController.navigate("groups") {
							popUpTo("login") { inclusive = true }
						}
					}
				)
			}
			composable("groups") {
				GroupListScreen(
					onOpenChat = { groupId ->
						navController.navigate("chat/${'$'}groupId")
					}
				)
			}
			composable(
				route = "chat/{groupId}",
				arguments = listOf(navArgument("groupId") { type = NavType.StringType })
			) {
				val groupId = it.arguments?.getString("groupId") ?: ""
				ChatScreen(
					groupId = groupId,
					viewModel = chatViewModel,
					onBack = { navController.popBackStack() }
				)
			}
		}
	}
}