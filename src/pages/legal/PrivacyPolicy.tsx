import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Privacy Policy
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Effective Date: January 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Welcome to iKasiLink ("we," "our," or "us"). This Privacy Policy explains how 
              Kasi Connect KC Pty Ltd collects, uses, and protects your personal information 
              when you use our township super-app platform.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Information</h3>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Profile information and preferences</li>
              <li>Community and location data</li>
              <li>Communication preferences</li>
            </ul>

            <h3>2.2 Usage Information</h3>
            <ul>
              <li>App usage patterns and features accessed</li>
              <li>Device information and technical specifications</li>
              <li>Log data and performance metrics</li>
              <li>Communication and messaging data (encrypted)</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and improve our services</li>
              <li>Enable community features and connections</li>
              <li>Process stokvel and business transactions</li>
              <li>Send safety alerts and community notifications</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal requirements</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share information only:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To provide requested services</li>
              <li>For legal compliance or safety purposes</li>
              <li>With service providers under strict confidentiality agreements</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul>
              <li>End-to-end encryption for messages</li>
              <li>Secure data storage and transmission</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
            </ul>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of non-essential communications</li>
              <li>Request data portability</li>
              <li>Withdraw consent where applicable</li>
            </ul>

            <h2>7. Data Retention</h2>
            <p>
              We retain your information only as long as necessary to provide services 
              and comply with legal obligations. You can request deletion at any time.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              Our services are not intended for children under 13. We do not knowingly 
              collect personal information from children under 13.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify users of 
              significant changes through the app or email.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              For privacy-related questions or concerns, please contact us at:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p><strong>Kasi Connect KC Pty Ltd</strong></p>
              <p>Email: privacy@kasiconnectkc.com</p>
              <p>Phone: 087 265 7453</p>
              <p>Address: South Africa</p>
            </div>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground text-center">
                © 2025 Kasi Connect KC Pty Ltd. All rights reserved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;