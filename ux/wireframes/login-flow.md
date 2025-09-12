# Wireframe: Login Flow

Goal: Simple, low-friction onboarding with language choice, phone verification, ward selection, and role capture.

## 0) Splash + Language

```
┌─────────────────────────────────────┐
│          App Logo / Name           │
│                                     │
│  Select Language                    │
│  ● English                          │
│  ○ isiZulu                          │
│  ○ Sesotho                          │
│                                     │
│             [Continue]              │
└─────────────────────────────────────┘
```

- Secondary link: Change later in Settings

## 1) Phone Number

```
┌─────────────────────────────────────┐
│  Login                              │
│  Enter your phone number            │
│  [+27] [ _____________ ]            │
│                                     │
│ [Continue]          [Help]          │
└─────────────────────────────────────┘
```

- Notes: Auto-format number; show country picker; explain why we use phone

## 2) OTP Verification

```
┌─────────────────────────────────────┐
│  Verify code                        │
│  Code sent to +27 61 234 5678       │
│  [ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]│
│                                     │
│ [Resend in 23s]    [Call me]        │
└─────────────────────────────────────┘
```

- Error state: invalid/expired code; rate limit messaging

## 3) Ward Detection / Selection

```
┌─────────────────────────────────────┐
│  Find your ward                     │
│  [Allow Location] [Not now]         │
│                                     │
│  Or search: [ Ward/City Search ]    │
│  Results:                           │
│   • Ward 68 (Johannesburg)          │
│   • Ward 72 (eThekwini)             │
└─────────────────────────────────────┘
```

- If denied: require manual search; explain why ward is needed

## 4) Consent & Privacy

```
┌─────────────────────────────────────┐
│  Consent                            │
│  • I agree to the Privacy Policy    │
│  • I agree to Terms of Use          │
│                                     │
│ [View Policy]       [Accept & Continue]
└─────────────────────────────────────┘
```

## 5) Profile & Role

```
┌─────────────────────────────────────┐
│  Create your profile                │
│  Name: [______________]             │
│  Role: ( ) Resident                 │
│        ( ) CPF Member               │
│        ( ) Ward Official            │
│                                     │
│ [Continue]                          │
└─────────────────────────────────────┘
```

## 6) Success → Ward Dashboard

```
┌─────────────────────────────────────┐
│  You're in Ward 68 (Johannesburg)!  │
│  Explore updates, report issues,    │
│  and join groups.                   │
│                                     │
│           [Go to Dashboard]         │
└─────────────────────────────────────┘
```

---

## Edge Cases
- No SMS received: offer Call me / WhatsApp / retry after timer
- Offline: queue verification request; surface offline banner
- No SIM: allow manual code input if sent to another device
- Location denied: require manual ward search; allow change later
- Rate limits: clear messaging; support fallback verification methods

## Acceptance Criteria
- Users can complete login in ≤ 90 seconds on a 3G connection
- Language choice persists across sessions and can be changed in Settings
- OTP: mask phone, support resend with cooldown; voice call fallback
- Ward stored and editable later; dashboard scoped to ward

