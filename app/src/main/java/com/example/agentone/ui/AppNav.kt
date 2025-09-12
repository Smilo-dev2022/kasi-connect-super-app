package com.example.agentone.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.agentone.ui.screens.ChatScreen
import com.example.agentone.ui.screens.OtpLoginScreen

object Routes {
    const val LOGIN = "login"
    const val CHAT = "chat"
}

@Composable
fun AgentOneApp() {
    val navController = rememberNavController()
    AppNavHost(navController)
}

@Composable
fun AppNavHost(navController: NavHostController) {
    NavHost(navController = navController, startDestination = Routes.LOGIN) {
        composable(Routes.LOGIN) {
            OtpLoginScreen(onLoginSuccess = {
                navController.navigate(Routes.CHAT) {
                    popUpTo(Routes.LOGIN) { inclusive = true }
                }
            })
        }
        composable(Routes.CHAT) {
            ChatScreen(onBack = { navController.popBackStack() })
        }
    }
}

