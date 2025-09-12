package com.example.app.auth

import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class FakeAuthRepository : AuthRepository {
	private val _isAuthenticated = MutableStateFlow(false)
	override val isAuthenticated: StateFlow<Boolean> = _isAuthenticated

	override suspend fun signIn(email: String, password: String): Result<Unit> {
		// Simulate network
		delay(300)
		_isAuthenticated.value = true
		return Result.success(Unit)
	}

	override fun signOut() {
		_isAuthenticated.value = false
	}
}

