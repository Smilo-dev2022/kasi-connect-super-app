plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android") // Added from the second block
    kotlin("kapt") // Added from the second block - ensure you have the kapt plugin configured in your root build.gradle if needed
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.example.agentone" // Using from the second block, verify this
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.app" // Using from the second block, verify this
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner" // From the second block
        vectorDrawables.useSupportLibrary = true // From the second block
    }

    buildTypes {
        release {
            isMinifyEnabled = false // Consistent in both
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            // You can add debug specific configurations here if needed
        }
    }

    buildFeatures {
        compose = true // Consistent in both
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.15" // Using the slightly newer version
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // kotlinOptions from the first block, jvmTarget = "17" is good
    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}" // Consistent in both
        }
    }
}

dependencies {
    // Using the newer Compose BOM from the second block
    val composeBom = platform("androidx.compose:compose-bom:2024.09.02")
    implementation(composeBom)
    androidTestImplementation(composeBom) //androidTest also uses the BOM

    implementation("androidx.core:core-ktx:1.13.1") // Consistent
    implementation("androidx.activity:activity-compose:1.9.2") // Consistent
    implementation("androidx.compose.ui:ui") // Consistent
    implementation("androidx.compose.ui:ui-tooling-preview") // Consistent
    implementation("androidx.compose.material3:material3:1.3.0") // Using version from second block
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6") // From first block (newer than if not specified)
    implementation("androidx.navigation:navigation-compose:2.8.0") // Consistent
    implementation("com.google.android.material:material:1.13.0")

    // Hilt dependencies from the second block
    implementation("com.google.dagger:hilt-android:2.52")
    kapt("com.google.dagger:hilt-compiler:2.52")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Coroutines from the second block
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

    // Firebase from the first block
    implementation(platform("com.google.firebase:firebase-bom:33.2.0"))
    implementation("com.google.firebase:firebase-messaging-ktx")

    // Test dependencies (merged and using consistent versions)
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4") // Already covered by composeBom forandroidTest

    // Debug dependencies (merged)
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}

// kapt block from the second half
kapt {
    correctErrorTypes = true
}
