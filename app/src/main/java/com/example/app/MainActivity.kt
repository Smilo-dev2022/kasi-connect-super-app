package com.example.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		setContent { AppRoot() }
	}
}

sealed class Dest(val route: String) {
	data object SignIn : Dest("sign_in")
	data object Chat : Dest("chat")
}

@Composable
fun AppRoot() {
	val navController = rememberNavController()
	MaterialTheme {
		Surface { AppNavHost(navController) }
	}
}

@Composable
fun AppNavHost(navController: NavHostController, vm: RootViewModel = hiltViewModel()) {
	var startDest by remember { mutableStateOf(Dest.SignIn.route) }
	val isAuthed by vm.isAuthenticated.collectAsState()
	LaunchedEffect(isAuthed) {
		startDest = if (isAuthed) Dest.Chat.route else Dest.SignIn.route
		if (navController.currentDestination == null) return@LaunchedEffect
		when (startDest) {
			Dest.Chat.route -> navController.navigate(Dest.Chat.route) { popUpTo(0) }
			else -> navController.navigate(Dest.SignIn.route) { popUpTo(0) }
		}
	}
	NavHost(navController, startDestination = startDest) {
		composable(Dest.SignIn.route) { SignInScreen(onSignIn = { email, password -> vm.signIn(email, password) }) }
		composable(Dest.Chat.route) { ChatScreen(onSignOut = { vm.signOut() }) }
	}
}
