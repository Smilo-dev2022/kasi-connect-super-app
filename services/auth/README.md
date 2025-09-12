# Auth Service

Node.js Express service providing OTP endpoints, JWT issuance/refresh, Redis-backed storage, and rate limiting.

## Endpoints

- POST `/otp/request`: Request OTP for a phone/email (mock channel returns the code)
- POST `/otp/verify`: Verify OTP
- POST `/auth/login`: Issue access/refresh tokens for a userId (demo)
- POST `/auth/refresh`: Refresh access token
- POST `/auth/logout`: Invalidate refresh token
- GET `/auth/me`: Return user info from access token
- GET `/healthz`: Health check

## Env

- `PORT` (default 4010)
- `CORS_ORIGIN` (default `*`)
- `REDIS_HOST` (default `127.0.0.1`)
- `REDIS_PORT` (default `6379`)
- `REDIS_PASSWORD`
- `REDIS_DB` (default `0`)
- `REDIS_KEY_PREFIX` (default `auth:`)
- `JWT_ACCESS_TOKEN_SECRET` (default `dev-access-secret`)
- `JWT_REFRESH_TOKEN_SECRET` (default `dev-refresh-secret`)
- `JWT_ACCESS_TTL_SECONDS` (default 900)
- `JWT_REFRESH_TTL_SECONDS` (default 604800)
- `OTP_CODE_TTL_SECONDS` (default 300)
- `OTP_MAX_REQUESTS_PER_HOUR` (default 5)

## Development

- Install deps: `npm i`
- Run dev: `npm run dev`

## Notes

- OTP delivery is mocked by returning the code in response. Replace with SMS/email provider.
- Refresh tokens stored in Redis under `rt:<tokenId>`.

