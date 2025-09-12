package com.example.agentone

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import com.example.agentone.ui.AgentOneApp
import com.example.agentone.ui.theme.AgentOneTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AgentOneTheme() {
                Surface(color = Color.White) {
                    AgentOneApp()
                }
            }
        }
    }
}

@Preview
@Composable
fun PreviewMain() {
    AgentOneTheme { AgentOneApp() }
}

