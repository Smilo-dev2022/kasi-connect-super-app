package com.example.app.di

import com.example.app.auth.AuthRepository
import com.example.app.auth.FakeAuthRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AuthModule {
	@Provides
	@Singleton
	fun provideAuthRepository(): AuthRepository = FakeAuthRepository()
}

