plugins {
	id("com.android.application")
	id("org.jetbrains.kotlin.android")
}

val hasGoogleServices = file("google-services.json").exists()

android {
	namespace = "com.example.chatapp"
	compileSdk = 35

	defaultConfig {
		applicationId = "com.example.chatapp"
		minSdk = 24
		targetSdk = 35
		versionCode = 1
		versionName = "1.0"

		testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

		// Gate FCM components in manifest
		manifestPlaceholders["fcmEnabled"] = hasGoogleServices.toString()
	}

	buildTypes {
		release {
			isMinifyEnabled = false
			proguardFiles(
				getDefaultProguardFile("proguard-android-optimize.txt"),
				"proguard-rules.pro"
			)
		}
	}

	compileOptions {
		sourceCompatibility = JavaVersion.VERSION_17
		targetCompatibility = JavaVersion.VERSION_17
	}
	kotlinOptions {
		jvmTarget = "17"
	}

	buildFeatures {
		compose = true
	}
	composeOptions {
		kotlinCompilerExtensionVersion = "1.6.10"
	}

	packaging {
		resources {
			excludes += "/META-INF/{AL2.0,LGPL2.1}"
		}
	}
}

dependencies {
	val composeBom = platform("androidx.compose:compose-bom:2024.09.02")
	implementation(composeBom)
	androidTestImplementation(composeBom)

	implementation("androidx.core:core-ktx:1.13.1")
	implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
	implementation("androidx.activity:activity-compose:1.9.2")
	implementation("androidx.navigation:navigation-compose:2.8.0")
	implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")
	implementation("androidx.compose.material3:material3")
	implementation("androidx.compose.ui:ui")
	implementation("androidx.compose.ui:ui-tooling-preview")
	implementation("androidx.compose.material:material-icons-extended")

	// Firebase BOM + Messaging (optional at runtime)
	implementation(platform("com.google.firebase:firebase-bom:33.4.0"))
	implementation("com.google.firebase:firebase-messaging-ktx")
	implementation("com.google.firebase:firebase-analytics-ktx")

	testImplementation("junit:junit:4.13.2")
	androidTestImplementation("androidx.test.ext:junit:1.2.1")
	androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
	androidTestImplementation("androidx.compose.ui:ui-test-junit4")
	debugImplementation("androidx.compose.ui:ui-tooling")
	debugImplementation("androidx.compose.ui:ui-test-manifest")
}

// Apply Google Services only if google-services.json is present
if (file("google-services.json").exists()) {
	apply(plugin = "com.google.gms.google-services")
}
