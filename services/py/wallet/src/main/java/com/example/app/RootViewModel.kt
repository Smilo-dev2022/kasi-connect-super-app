package com.example.app

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.app.auth.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RootViewModel @Inject constructor(
	private val authRepository: AuthRepository
): ViewModel() {
	val isAuthenticated: StateFlow<Boolean> = authRepository.isAuthenticated
		.stateIn(
			viewModelScope,
			SharingStarted.WhileSubscribed(5_000),
			authRepository.isAuthenticated.value
		)

	fun signIn(email: String, password: String) {
		viewModelScope.launch { authRepository.signIn(email, password) }
	}

	fun signOut() {
		authRepository.signOut()
	}
}
