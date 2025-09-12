package com.example.androidcore

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.androidcore.data.AuthRepository
import com.example.androidcore.data.ChatRepository
import com.example.androidcore.ui.ChatDetailScreen
import com.example.androidcore.ui.ChatsScreen
import com.example.androidcore.ui.LoginScreen
import com.example.androidcore.ui.SplashScreen

class MainActivity : ComponentActivity() {
	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		setContent {
			App()
		}
	}
}

sealed class Screen(val route: String) {
	data object Splash : Screen("splash")
	data object Login : Screen("login")
	data object Chats : Screen("chats")
	data object ChatDetail : Screen("chat/{chatId}") {
		fun route(chatId: String) = "chat/$chatId"
	}
}

@Composable
fun App() {
	val navController = rememberNavController()
	val context = LocalContext.current
	val authRepository = androidx.compose.runtime.remember(context) { AuthRepository(context.applicationContext) }
	val chatRepository = androidx.compose.runtime.remember { ChatRepository() }
	MaterialTheme {
		Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
			AppNavHost(navController, authRepository, chatRepository)
		}
	}
}

@Composable
fun AppNavHost(navController: NavHostController, authRepository: AuthRepository, chatRepository: ChatRepository) {
	NavHost(navController = navController, startDestination = Screen.Splash.route) {
		composable(Screen.Splash.route) {
			SplashScreen(authRepository = authRepository) { isSignedIn ->
				if (isSignedIn) {
					navController.navigate(Screen.Chats.route) {
						popUpTo(Screen.Splash.route) { inclusive = true }
					}
				} else {
					navController.navigate(Screen.Login.route) {
						popUpTo(Screen.Splash.route) { inclusive = true }
					}
				}
			}
		}
		composable(Screen.Login.route) {
			LoginScreen(authRepository = authRepository, onLoggedIn = {
				navController.navigate(Screen.Chats.route) {
					popUpTo(Screen.Login.route) { inclusive = true }
				}
			})
		}
		composable(Screen.Chats.route) {
			ChatsScreen(chatRepository = chatRepository, onOpenChat = { chatId ->
				navController.navigate(Screen.ChatDetail.route(chatId))
			})
		}
		composable(Screen.ChatDetail.route) {
			val chatId = it.arguments?.getString("chatId") ?: ""
			ChatDetailScreen(chatId = chatId, chatRepository = chatRepository, onBack = { navController.popBackStack() })
		}
	}
}