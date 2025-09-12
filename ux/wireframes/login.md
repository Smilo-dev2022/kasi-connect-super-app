# Wireframe — Login Flow

Goal: Authenticate a resident with phone number and OTP.

Frames:
- Header: App name, language switch (EN / isiZulu / Sesotho)
- Body: Phone number input, Continue button. OTP step with 6-digit input, Verify button.
- Footer: Help link, Privacy notice.

States:
- Phone input (default)
- OTP entry (after Continue)
- Error (invalid number / wrong OTP)

Primary actions:
- Continue → Triggers OTP send
- Verify → Submits OTP

Validation:
- E.164 phone format or local format with country code hint
- Disable continue/verify until valid

i18n placeholders:
- en: Login, Phone number, Continue, One-time passcode (OTP), Verify
- zu: Ngena, Inombolo yocingo, Qhubeka, Ikhodi ye-OTP, Qinisekisa
- st: Kena, Nomoro ea mohala, Tsoela pele, Khoutu ea OTP, Netefatsa

Notes:
- Optionally allow WhatsApp OTP fallback in future.
- Keep copy concise and legible for low-literacy contexts.