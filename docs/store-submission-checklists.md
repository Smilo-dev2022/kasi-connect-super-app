# Store Submission Checklists (Google Play and Apple App Store)

## Google Play
- App bundle signed with release key; Play App Signing configured
- Package name consistent; versionCode incremented
- Privacy policy URL accessible and up to date
- Data safety form completed (collection, sharing, encryption, deletion)
- Content rating questionnaire submitted
- Screenshots (7"/10" tablets if applicable), feature graphic, short/full description
- App category and tags selected
- Target audience and Families policy compliance (if applicable)
- Permissions justifications provided; background location/camera/mic noted
- Ads declaration (if any) and SDK versions compliant
- Testers configured for internal/closed testing
- Pre-launch report reviewed; device compatibility checked
- Rollout plan: staged % with rollback criteria
- Release notes include key fixes and known issues

## Apple App Store
- App Store Connect record complete; bundle ID matches
- Version and build incremented; archived in Release configuration
- App Privacy details updated (data collection, tracking)
- Export compliance answered; encryption usage declared
- Screenshots per device sizes; app previews optional
- App Review notes with demo account and steps
- Sign-in flows fully testable; deep links validated
- In-app purchases configured and metadata approved (if any)
- Background modes and permissions purpose strings present
- TestFlight internal and external groups configured
- Phased release plan and manual release ready
- Release notes and What’s New prepared

## Common Preflight
- Crash-free session rate ≥ 99.5% in last 24–48 hours on candidate build
- No blocker analytics events missing; logging levels acceptable
- Feature flags defaulted safe; server kill switches tested
- Legal, security, branding sign-offs complete
- Monitoring and alerting dashboards linked in runbooks
- Rollback plan verified (store, server flags, version pinning)

## Attachments
- Reviewer demo creds and test data
- Network domains list and test endpoints
- Contact for expedited review if needed