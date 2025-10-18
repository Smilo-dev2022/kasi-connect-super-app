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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import android.content.Context
import java.net.HttpURLConnection
import java.net.URL

@Composable
fun OtpLoginScreen(onLoginSuccess: () -> Unit) {
    val phoneNumberState = remember { mutableStateOf("") }
    val otpState = remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

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

        Button(onClick = {
            scope.launch(Dispatchers.IO) {
                try {
                    val requestUrl = URL("https://api.kasilink.example/auth/otp/verify")
                    val conn = (requestUrl.openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        setRequestProperty("Content-Type", "application/json")
                        doOutput = true
                    }
                    val prefs = context.getSharedPreferences("push", Context.MODE_PRIVATE)
                    val fcm = prefs.getString("fcm", null)
                    val body = buildString {
                        append('{')
                        append("\"channel\":\"sms\",")
                        append("\"to\":\"${phoneNumberState.value}\",")
                        append("\"code\":\"${otpState.value}\"")
                        if (fcm != null) {
                            append(',')
                            append("\"device\":{\"platform\":\"android\",\"token\":\"$fcm\"}")
                        }
                        append('}')
                    }
                    conn.outputStream.use { it.write(body.toByteArray()) }
                    val data = conn.inputStream.readBytes().toString(Charsets.UTF_8)
                    val token = Regex("\\\"token\\\":\\\"([^\\\"]+)\\\"").find(data)?.groupValues?.get(1)
                    if (token != null) {
                        val authPrefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
                        authPrefs.edit().putString("jwt", token).apply()
                        launch(Dispatchers.Main) { onLoginSuccess() }
                    }
                } catch (_: Exception) {}
            }
        }, modifier = Modifier.fillMaxWidth().padding(top = 24.dp)) {
            Text("Continue")
        }
    }
}

