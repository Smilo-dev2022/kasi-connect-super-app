#!/usr/bin/env node

/**
 * Production Readiness Validation Script for iKasiLink
 * Validates environment variables, links, and production configuration
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface ValidationResult {
  category: string;
  item: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

class ProductionValidator {
  private results: ValidationResult[] = [];
  
  private addResult(category: string, item: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
    this.results.push({ category, item, status, message });
  }

  private checkEnvVariable(name: string, required: boolean = true): boolean {
    const value = process.env[name];
    if (!value && required) {
      this.addResult('Environment', name, 'FAIL', 'Required environment variable not set');
      return false;
    } else if (!value && !required) {
      this.addResult('Environment', name, 'WARN', 'Optional environment variable not set');
      return false;
    } else if (value === 'CHANGE_IN_PRODUCTION') {
      this.addResult('Environment', name, 'FAIL', 'Still using placeholder value');
      return false;
    } else {
      this.addResult('Environment', name, 'PASS', 'Environment variable properly set');
      return true;
    }
  }

  private checkFileExists(path: string, name: string): boolean {
    if (existsSync(resolve(path))) {
      this.addResult('Files', name, 'PASS', 'File exists');
      return true;
    } else {
      this.addResult('Files', name, 'FAIL', 'File missing');
      return false;
    }
  }

  private async checkUrl(url: string, name: string): Promise<boolean> {
    try {
      // In a real environment, you would use fetch here
      // For this validation, we'll just check if the URL looks valid
      const urlPattern = /^https?:\/\/.+/;
      if (urlPattern.test(url)) {
        this.addResult('URLs', name, 'PASS', 'URL format is valid');
        return true;
      } else {
        this.addResult('URLs', name, 'FAIL', 'Invalid URL format');
        return false;
      }
    } catch (error) {
      this.addResult('URLs', name, 'FAIL', `URL check failed: ${error}`);
      return false;
    }
  }

  private checkPackageJson(): void {
    try {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
      
      // Check if test/demo data detection scripts exist
      if (packageJson.scripts?.['check-demo-data']) {
        this.addResult('Package', 'demo-data-check', 'PASS', 'Demo data check script exists');
      } else {
        this.addResult('Package', 'demo-data-check', 'WARN', 'No demo data check script defined');
      }

      // Check for production build script
      if (packageJson.scripts?.build) {
        this.addResult('Package', 'build-script', 'PASS', 'Build script exists');
      } else {
        this.addResult('Package', 'build-script', 'FAIL', 'No build script defined');
      }

      // Check for linting
      if (packageJson.scripts?.lint) {
        this.addResult('Package', 'lint-script', 'PASS', 'Lint script exists');
      } else {
        this.addResult('Package', 'lint-script', 'WARN', 'No lint script defined');
      }

    } catch (error) {
      this.addResult('Package', 'package.json', 'FAIL', `Cannot read package.json: ${error}`);
    }
  }

  public async validateEnvironmentVariables(): Promise<void> {
    console.log('🔍 Validating Environment Variables...\n');

    // Critical production environment variables
    this.checkEnvVariable('NODE_ENV');
    this.checkEnvVariable('JWT_SECRET');
    this.checkEnvVariable('OTP_PEPPER');
    this.checkEnvVariable('REDIS_URL');
    
    // Database configuration
    this.checkEnvVariable('USE_DB');
    this.checkEnvVariable('MOD_USE_DB');

    // External services
    this.checkEnvVariable('S3_ACCESS_KEY_ID');
    this.checkEnvVariable('S3_SECRET_ACCESS_KEY');
    this.checkEnvVariable('TYPESENSE_API_KEY');
    this.checkEnvVariable('EVENTS_SECRET_KEY');

    // Optional but recommended
    this.checkEnvVariable('VITE_SERPAPI_KEY', false);
    this.checkEnvVariable('ENABLE_ANALYTICS', false);
    this.checkEnvVariable('ENABLE_CRASH_REPORTING', false);

    // Check for demo data flag
    const enableDemoData = process.env.ENABLE_DEMO_DATA;
    if (enableDemoData === 'true') {
      this.addResult('Environment', 'ENABLE_DEMO_DATA', 'FAIL', 'Demo data is enabled in production');
    } else {
      this.addResult('Environment', 'ENABLE_DEMO_DATA', 'PASS', 'Demo data is disabled');
    }
  }

  public async validateFiles(): Promise<void> {
    console.log('📁 Validating Required Files...\n');

    // Legal documents
    this.checkFileExists('./src/pages/legal/PrivacyPolicy.tsx', 'Privacy Policy Component');
    this.checkFileExists('./src/pages/legal/TermsOfService.tsx', 'Terms of Service Component');

    // Configuration files
    this.checkFileExists('./.env.production', 'Production Environment Config');
    this.checkFileExists('./LICENSE', 'License File');
    this.checkFileExists('./COPYRIGHT', 'Copyright File');

    // Essential app files
    this.checkFileExists('./public/ikasilink.logo.png.png', 'App Logo');
    this.checkFileExists('./public/robots.txt', 'Robots.txt');

    // Build configuration
    this.checkFileExists('./vite.config.ts', 'Vite Config');
    this.checkFileExists('./tsconfig.json', 'TypeScript Config');
  }

  public async validateUrls(): Promise<void> {
    console.log('🔗 Validating URLs and Links...\n');

    const urls = [
      { name: 'Privacy Policy', url: process.env.VITE_PRIVACY_POLICY_URL || 'https://ikasilink.co.za/privacy' },
      { name: 'Terms of Service', url: process.env.VITE_TERMS_OF_SERVICE_URL || 'https://ikasilink.co.za/terms' },
      { name: 'App Store', url: process.env.VITE_APP_STORE_URL || 'https://apps.apple.com/app/ikasilink' },
      { name: 'Play Store', url: process.env.VITE_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=za.co.ikasilink' },
    ];

    for (const { name, url } of urls) {
      await this.checkUrl(url, name);
    }
  }

  public validateBuildArtifacts(): void {
    console.log('🏗️  Validating Build Configuration...\n');

    this.checkPackageJson();

    // Check for TypeScript configuration
    try {
      const tsConfig = JSON.parse(readFileSync('./tsconfig.json', 'utf-8'));
      if (tsConfig.compilerOptions?.strict) {
        this.addResult('Build', 'TypeScript strict', 'PASS', 'TypeScript strict mode enabled');
      } else {
        this.addResult('Build', 'TypeScript strict', 'WARN', 'TypeScript strict mode not enabled');
      }
    } catch (error) {
      this.addResult('Build', 'TypeScript config', 'FAIL', 'Cannot read tsconfig.json');
    }

    // Check for production-specific configurations
    if (existsSync('./vite.config.ts')) {
      this.addResult('Build', 'Vite config', 'PASS', 'Vite configuration exists');
    } else {
      this.addResult('Build', 'Vite config', 'FAIL', 'Vite configuration missing');
    }
  }

  public validateSecurity(): void {
    console.log('🔒 Validating Security Configuration...\n');

    // Check NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      this.addResult('Security', 'NODE_ENV', 'PASS', 'NODE_ENV set to production');
    } else {
      this.addResult('Security', 'NODE_ENV', 'FAIL', 'NODE_ENV not set to production');
    }

    // Check JWT configuration
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      this.addResult('Security', 'JWT_SECRET', 'FAIL', 'JWT_SECRET not configured');
    } else if (jwtSecret === 'dev-secret-change-me' || jwtSecret === 'devsecret') {
      this.addResult('Security', 'JWT_SECRET', 'FAIL', 'JWT_SECRET using development value');
    } else if (jwtSecret.length < 32) {
      this.addResult('Security', 'JWT_SECRET', 'WARN', 'JWT_SECRET should be at least 32 characters');
    } else {
      this.addResult('Security', 'JWT_SECRET', 'PASS', 'JWT_SECRET properly configured');
    }

    // Check CORS configuration
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin === '*') {
      this.addResult('Security', 'CORS_ORIGIN', 'FAIL', 'CORS_ORIGIN set to wildcard (*)');
    } else if (corsOrigin && corsOrigin.startsWith('https://')) {
      this.addResult('Security', 'CORS_ORIGIN', 'PASS', 'CORS_ORIGIN properly configured');
    } else {
      this.addResult('Security', 'CORS_ORIGIN', 'WARN', 'CORS_ORIGIN not configured or not HTTPS');
    }
  }

  public async validateAll(): Promise<void> {
    console.log('🚀 iKasiLink Production Readiness Validation\n');
    console.log('================================================\n');

    await this.validateEnvironmentVariables();
    await this.validateFiles();
    await this.validateUrls();
    this.validateBuildArtifacts();
    this.validateSecurity();

    this.printResults();
  }

  private printResults(): void {
    console.log('\n📊 Validation Results\n');
    console.log('=====================\n');

    const categories = [...new Set(this.results.map(r => r.category))];
    
    let totalPass = 0;
    let totalFail = 0;
    let totalWarn = 0;

    for (const category of categories) {
      console.log(`\n${category}:`);
      console.log('-'.repeat(category.length + 1));

      const categoryResults = this.results.filter(r => r.category === category);
      
      for (const result of categoryResults) {
        const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`  ${statusIcon} ${result.item}: ${result.message}`);
        
        if (result.status === 'PASS') totalPass++;
        else if (result.status === 'FAIL') totalFail++;
        else totalWarn++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Passed: ${totalPass}`);
    console.log(`   ❌ Failed: ${totalFail}`);
    console.log(`   ⚠️  Warnings: ${totalWarn}`);
    console.log(`   📊 Total: ${this.results.length}`);

    const successRate = Math.round((totalPass / this.results.length) * 100);
    console.log(`   🎯 Success Rate: ${successRate}%`);

    if (totalFail > 0) {
      console.log('\n❌ Production readiness validation FAILED');
      console.log('   Please fix the failed items before deploying to production.');
      process.exit(1);
    } else if (totalWarn > 0) {
      console.log('\n⚠️  Production readiness validation PASSED with warnings');
      console.log('   Consider addressing the warnings for optimal production deployment.');
    } else {
      console.log('\n✅ Production readiness validation PASSED');
      console.log('   Your application is ready for production deployment!');
    }
  }
}

// Run validation if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ProductionValidator();
  validator.validateAll().catch(console.error);
}

export default ProductionValidator;