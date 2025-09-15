import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Terms of Service
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Effective Date: January 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using iKasiLink, you agree to be bound by these Terms of Service 
              and our Privacy Policy. If you disagree with any part of these terms, you may not 
              use our service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              iKasiLink is a township super-app platform operated by Kasi Connect KC Pty Ltd that 
              provides:
            </p>
            <ul>
              <li>Community chat and messaging services</li>
              <li>Stokvel management and financial services</li>
              <li>Local business directory and marketplace</li>
              <li>Safety alerts and community notifications</li>
              <li>Event management and RSVP systems</li>
            </ul>

            <h2>3. User Accounts</h2>
            <h3>3.1 Registration</h3>
            <p>
              To use certain features, you must register for an account. You agree to provide 
              accurate, current, and complete information during registration.
            </p>

            <h3>3.2 Account Security</h3>
            <p>
              You are responsible for safeguarding your account credentials and for all activities 
              that occur under your account.
            </p>

            <h3>3.3 Age Requirement</h3>
            <p>
              You must be at least 13 years old to use iKasiLink. Users under 18 require parental 
              consent.
            </p>

            <h2>4. Acceptable Use</h2>
            <h3>4.1 Permitted Use</h3>
            <p>You may use iKasiLink for legitimate community and business purposes.</p>

            <h3>4.2 Prohibited Activities</h3>
            <p>You agree not to:</p>
            <ul>
              <li>Use the service for illegal activities or fraud</li>
              <li>Harass, threaten, or intimidate other users</li>
              <li>Share false information or impersonate others</li>
              <li>Spam or send unsolicited communications</li>
              <li>Attempt to hack or compromise the platform</li>
              <li>Upload malicious content or viruses</li>
              <li>Violate intellectual property rights</li>
            </ul>

            <h2>5. Community Guidelines</h2>
            <p>
              iKasiLink is designed to strengthen South African communities. We expect users to:
            </p>
            <ul>
              <li>Treat others with respect and dignity</li>
              <li>Share accurate and helpful information</li>
              <li>Report inappropriate content or behavior</li>
              <li>Support local businesses and community initiatives</li>
              <li>Use safety features responsibly</li>
            </ul>

            <h2>6. Financial Services</h2>
            <h3>6.1 Stokvel Management</h3>
            <p>
              Our stokvel features are tools to assist with group financial management. Users 
              remain fully responsible for their financial decisions and agreements.
            </p>

            <h3>6.2 Payment Processing</h3>
            <p>
              Payment processing is handled by third-party providers. We are not responsible 
              for payment failures or disputes outside our control.
            </p>

            <h3>6.3 Transaction Fees</h3>
            <p>
              Certain transactions may incur fees, which will be clearly disclosed before 
              completion.
            </p>

            <h2>7. Content and Intellectual Property</h2>
            <h3>7.1 User Content</h3>
            <p>
              You retain ownership of content you post but grant us a license to use, display, 
              and distribute it within the platform.
            </p>

            <h3>7.2 Platform Content</h3>
            <p>
              The iKasiLink platform, including design, features, and algorithms, is owned by 
              Kasi Connect KC Pty Ltd and protected by intellectual property laws.
            </p>

            <h2>8. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand 
              how we collect, use, and protect your information.
            </p>

            <h2>9. Moderation and Enforcement</h2>
            <p>
              We reserve the right to:
            </p>
            <ul>
              <li>Remove content that violates these terms</li>
              <li>Suspend or terminate accounts for violations</li>
              <li>Cooperate with law enforcement when required</li>
              <li>Update community guidelines as needed</li>
            </ul>

            <h2>10. Service Availability</h2>
            <p>
              We strive for high availability but do not guarantee uninterrupted service. 
              We may temporarily suspend service for maintenance or technical issues.
            </p>

            <h2>11. Disclaimers</h2>
            <p>
              The service is provided "as is" without warranties. We disclaim liability for:
            </p>
            <ul>
              <li>Service interruptions or technical issues</li>
              <li>User-generated content or third-party actions</li>
              <li>Financial losses from stokvel or business activities</li>
              <li>Accuracy of community-shared information</li>
            </ul>

            <h2>12. Limitation of Liability</h2>
            <p>
              Our liability is limited to the maximum extent permitted by South African law. 
              We are not liable for indirect, incidental, or consequential damages.
            </p>

            <h2>13. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Kasi Connect KC Pty Ltd from claims 
              arising from your use of the service or violation of these terms.
            </p>

            <h2>14. Changes to Terms</h2>
            <p>
              We may modify these terms periodically. Significant changes will be communicated 
              through the app with 30 days' notice. Continued use constitutes acceptance.
            </p>

            <h2>15. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. Upon termination, your 
              right to use the service ceases immediately.
            </p>

            <h2>16. Governing Law</h2>
            <p>
              These terms are governed by South African law. Disputes will be resolved in 
              South African courts.
            </p>

            <h2>17. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p><strong>Kasi Connect KC Pty Ltd</strong></p>
              <p>Email: legal@kasiconnectkc.com</p>
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

export default TermsOfService;