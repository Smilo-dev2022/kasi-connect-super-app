package com.example.app.auth

import kotlinx.coroutines.flow.StateFlow

interface AuthRepository {
	val isAuthenticated: StateFlow<Boolean>
	suspend fun signIn(email: String, password: String): Result<Unit>
	fun signOut()
}

