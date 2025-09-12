package com.example.agentone.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import android.Manifest
import android.os.Build
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
// import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.SideEffect
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts

@Composable
fun OtpLoginScreen(onLoginSuccess: () -> Unit) {
    val phoneNumberState = remember { mutableStateOf("") }
    val otpState = remember { mutableStateOf("") }

    val requestPermissionLauncher = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        @Suppress("DEPRECATION")
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { _ -> }
    } else null

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissionLauncher?.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "Sign in", style = MaterialTheme.typography.headlineMedium)

        OutlinedTextField(
            value = phoneNumberState.value,
            onValueChange = { phoneNumberState.value = it },
            label = { Text("Phone number") },
            modifier = Modifier.fillMaxWidth().padding(top = 24.dp)
        )

        OutlinedTextField(
            value = otpState.value,
            onValueChange = { otpState.value = it },
            label = { Text("OTP") },
            modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
        )

        Button(onClick = onLoginSuccess, modifier = Modifier.fillMaxWidth().padding(top = 24.dp)) {
            Text("Continue")
        }
    }
}

