package com.example.chatapp.ui.login

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp

@Composable
fun LoginScreen(onLoginSuccess: () -> Unit) {
	var phoneNumber by remember { mutableStateOf("") }
	var otp by remember { mutableStateOf("") }
	var codeSent by remember { mutableStateOf(false) }
	var error by remember { mutableStateOf<String?>(null) }

	Column(
		modifier = Modifier
			.fillMaxSize()
			.padding(24.dp),
		horizontalAlignment = Alignment.CenterHorizontally,
		verticalArrangement = Arrangement.Center
	) {
		Text(text = "OTP Login")
		Spacer(Modifier.height(16.dp))
		OutlinedTextField(
			value = phoneNumber,
			onValueChange = { phoneNumber = it },
			label = { Text("Phone number") },
			singleLine = true,
			keyboardOptions = androidx.compose.ui.text.input.KeyboardOptions(keyboardType = KeyboardType.Phone)
		)
		Spacer(Modifier.height(12.dp))
		if (codeSent) {
			OutlinedTextField(
				value = otp,
				onValueChange = { otp = it },
				label = { Text("Enter OTP") },
				singleLine = true,
				keyboardOptions = androidx.compose.ui.text.input.KeyboardOptions(keyboardType = KeyboardType.Number),
				visualTransformation = VisualTransformation.None
			)
			Spacer(Modifier.height(12.dp))
		}
		if (error != null) {
			Text(text = error!!)
			Spacer(Modifier.height(8.dp))
		}
		if (!codeSent) {
			Button(onClick = {
				if (phoneNumber.length >= 8) {
					codeSent = true
					error = null
				} else {
					error = "Enter a valid phone number"
				}
			}) { Text("Send OTP") }
		} else {
			Button(onClick = {
				if (otp == "123456") {
					onLoginSuccess()
				} else {
					error = "Invalid OTP. Try 123456"
				}
			}) { Text("Verify") }
			TextButton(onClick = { codeSent = false; otp = "" }) { Text("Resend") }
		}
	}
}