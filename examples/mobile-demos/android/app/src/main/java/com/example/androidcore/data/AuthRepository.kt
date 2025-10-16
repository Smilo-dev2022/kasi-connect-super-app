package com.example.androidcore.data

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.authDataStore by preferencesDataStore(name = "auth")

class AuthRepository(private val context: Context) {
	private object Keys {
		val EMAIL: Preferences.Key<String> = stringPreferencesKey("email")
		val SIGNED_IN: Preferences.Key<Boolean> = booleanPreferencesKey("signed_in")
	}

	val isSignedInFlow: Flow<Boolean> = context.authDataStore.data.map { prefs ->
		prefs[Keys.SIGNED_IN] ?: false
	}

	val emailFlow: Flow<String?> = context.authDataStore.data.map { prefs ->
		prefs[Keys.EMAIL]
	}

	suspend fun signIn(email: String, password: String): Boolean {
		if (email.isBlank() || password.isBlank()) return false
		context.authDataStore.edit { prefs ->
			prefs[Keys.EMAIL] = email
			prefs[Keys.SIGNED_IN] = true
		}
		return true
	}

	suspend fun signOut() {
		context.authDataStore.edit { prefs ->
			prefs.remove(Keys.EMAIL)
			prefs[Keys.SIGNED_IN] = false
		}
	}
}