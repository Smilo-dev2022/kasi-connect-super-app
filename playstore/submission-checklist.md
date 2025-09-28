# Google Play Store Submission Checklist

## Pre-Submission Requirements

### ✅ App Configuration
- [ ] Package name: `za.co.ikasilink.app`
- [ ] Version code: Integer (increments each release)
- [ ] Version name: Semantic versioning (e.g., 1.0.0)
- [ ] Target SDK: Latest (34 or higher)
- [ ] Minimum SDK: 24 (Android 7.0)
- [ ] App bundle (AAB) generated
- [ ] Release signing configured

### ✅ App Bundle (AAB)
- [ ] Generate with `./gradlew bundleProductionRelease`
- [ ] Verify bundle size < 150MB
- [ ] Test AAB with bundletool (optional)
- [ ] Upload to Play Console

### ✅ Store Listing Assets
- [ ] App icon (512x512 PNG, <1MB)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (8+ phone, 1080x1920+)
- [ ] Tablet screenshots (if applicable)
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] Privacy policy URL live

### ✅ Content Rating
- [ ] Complete content rating questionnaire
- [ ] Target age: 13+ (Teen)
- [ ] No objectionable content
- [ ] Appropriate for township communities

### ✅ Data Safety
- [ ] Declare data types collected
- [ ] Specify data usage purposes
- [ ] Confirm data sharing practices
- [ ] Security practices declared

### ✅ App Access
- [ ] No login required for basic features (if applicable)
- [ ] Demo credentials provided (if login required)
- [ ] Clear signup process

### ✅ Technical Requirements
- [ ] App installs without crashes
- [ ] Core features functional
- [ ] No debug logs in release
- [ ] Network security config enforced
- [ ] Cleartext traffic disabled
- [ ] ProGuard/R8 enabled

### ✅ Permissions
- [ ] Only necessary permissions requested
- [ ] Permission rationale provided
- [ ] Runtime permissions handled properly

### ✅ Testing
- [ ] Internal testing completed
- [ ] Closed testing with 50+ users
- [ ] Crash-free sessions >99%
- [ ] Performance acceptable
- [ ] Battery usage optimized

## Submission Process

### 1. Create Release
- [ ] Go to Play Console > App Bundle Explorer
- [ ] Click "Create new release"
- [ ] Upload production AAB
- [ ] Add release notes
- [ ] Set rollout percentage (start with 10%)

### 2. Review Information
- [ ] Verify store listing details
- [ ] Check pricing and distribution
- [ ] Confirm content rating
- [ ] Review data safety form

### 3. Submit for Review
- [ ] Click "Review release"
- [ ] Confirm all requirements met
- [ ] Submit to Google for review
- [ ] Monitor review status

### 4. Post-Submission
- [ ] Monitor crash reports
- [ ] Track user reviews
- [ ] Respond to feedback
- [ ] Plan next release

## Rollout Strategy

### Phase 1: Internal Testing (Week 1)
- [ ] Core team testing
- [ ] Bug fixes and stability
- [ ] Performance optimization

### Phase 2: Closed Testing (Week 2)
- [ ] 50-200 trusted users
- [ ] Township community members
- [ ] Feature validation
- [ ] User feedback collection

### Phase 3: Open Testing (Week 3)
- [ ] Public beta release
- [ ] Broader user testing
- [ ] Load testing
- [ ] Final polish

### Phase 4: Production (Week 4)
- [ ] 10% rollout
- [ ] Monitor metrics
- [ ] Scale to 50% after 24h
- [ ] Full rollout after 48h

## Monitoring & Metrics

### Key Performance Indicators
- [ ] Crash-free sessions >99.5%
- [ ] App startup time <2 seconds
- [ ] Message send latency <1 second
- [ ] Daily active users growth
- [ ] User retention (D1, D7, D30)
- [ ] Feature adoption rates

### Alert Thresholds
- [ ] Crash rate >1%
- [ ] ANR rate >0.5%
- [ ] App startup time >3 seconds
- [ ] Message delivery failure >5%
- [ ] User complaints >10/day

## Emergency Procedures

### If Critical Issues Found
1. [ ] Pause rollout immediately
2. [ ] Investigate root cause
3. [ ] Prepare hotfix if needed
4. [ ] Communicate with users
5. [ ] Deploy fix and resume rollout

### Rollback Plan
- [ ] Keep previous version ready
- [ ] Document rollback procedure
- [ ] Test rollback process
- [ ] Communicate rollback to team

## Success Criteria

### Launch Success Metrics
- [ ] 1000+ downloads in first week
- [ ] 4.0+ star rating
- [ ] <2% uninstall rate
- [ ] 80%+ feature adoption
- [ ] Positive user feedback
- [ ] No critical security issues
- [ ] Stable performance metrics
