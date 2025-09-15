# iKasiLink - Kasi Connect Super App

iKasiLink is a multi-technology township super-app built with React/TypeScript frontend, Python FastAPI backend services, Android mobile app, and various microservices for messaging, search, events, media, and authentication.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test the Repository

**Root Web Application (React/TypeScript/Vite):**
- `npm install` -- takes 45s, has deprecated package warnings (expected)
- `npm run build` -- takes 8s. NEVER CANCEL. Set timeout to 120+ seconds.
- `npm run lint` -- has existing linting errors (17 errors, 7 warnings - expected in current state)
- `npm test` -- takes 4s, may have test dependency issues
- `npm run dev` -- starts dev server on http://localhost:8080/ (not 5173)

**Python FastAPI Services:**
- Create Python virtual environment: `python3 -m venv .venv`
- Activate: `source .venv/bin/activate`
- Install dependencies: `pip install -U pip wheel setuptools && pip install -r requirements.txt` -- takes 20s
- **Root Events Service DOES NOT START**: Has SQLAlchemy relationship mapping errors
- Individual service setup below works correctly

**Individual Services (all have working builds):**
- `agent7-messaging/`: `npm install && npm test && npm run build` -- test passes, build has tsconfig issue
- `events-service/`: `npm install && npm run build` -- builds in 2.5s  
- `agent9-search/`: requires Typesense setup for full functionality
- `web-admin/`: separate Node.js project
- Android: requires Android SDK setup (not available in CI environment)

### Development Environment Options

**Local Development:**
- Web app: `npm run dev` (http://localhost:8080/)
- Individual services: see service READMEs
- Docker Compose: `docker compose -f docker-compose.dev.yml up` (full stack)

**Docker Compose Services Available:**
- Redis (port 6379)
- MinIO (ports 9000, 9001) 
- Typesense (port 8108)
- Agent7-messaging (port 8080)
- Auth service (port 4010)
- Media service (port 4008)
- Search service (port 4009)
- Events service (port 8000) - Python FastAPI
- Moderation service (port 8082)
- Web frontend (port 5173)

## Build Times and Critical Timeouts

**NEVER CANCEL these operations - always set appropriate timeouts:**
- `npm install` (root): 45s - Set timeout to 120+ seconds
- `npm run build` (root): 8s - Set timeout to 120+ seconds
- `pip install -r requirements.txt`: 20s - Set timeout to 180+ seconds
- Individual service builds: 2-5s each - Set timeout to 60+ seconds
- Tests: 3-10s - Set timeout to 60+ seconds

## Known Issues and Workarounds

**Root Python Events Service:**
- DOES NOT START due to SQLAlchemy relationship mapping errors
- Error: "relationship('List[RSVP]')" mapping issue
- Use individual service `events-service/` instead which builds correctly

**Linting:**
- Root project has 17 errors, 7 warnings in current state (expected)
- Most are TypeScript `any` type usage and empty blocks
- Some UI component fast-refresh warnings

**Testing:**
- Root tests pass except for agent7-messaging integration test (supertest missing)  
- TypeScript compilation fails on test files (missing test type definitions)

**Android:**
- Requires Android SDK setup
- Gradle available but Android plugin dependencies fail without SDK

## Validation Steps

**Always run before completing changes:**
- Root: `npm run lint` (expect existing errors)
- Root: `npm run build` (should succeed)
- Root: `npm test` (partial success expected)
- Individual services: navigate to service directory and run `npm test && npm run build`
- TypeScript check: `npx tsc -p tsconfig.app.json --noEmit` (expect some errors)

**Manual Testing:**
- Start web dev server: `npm run dev`
- Verify http://localhost:8080/ loads iKasiLink homepage
- Check React app renders correctly with no console errors
- Test major navigation flows through the application

## Repository Structure

### Key Components
- `/src/` - React/TypeScript web application source
- `/agent7-messaging/` - E2EE messaging service (Node.js/TypeScript)
- `/agent9-search/` - Search service with Typesense (Node.js)
- `/events-service/` - Events service (Node.js/TypeScript)
- `/services/auth/` - Authentication service
- `/services/media/` - Media upload/storage service
- `/android/` - Android mobile application (Kotlin)
- `/web-admin/` - Admin web interface
- `/moderation_service/` - Content moderation (Python)

### Configuration Files
- `package.json` - Root web app dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `docker-compose.dev.yml` - Development environment setup
- `.github/workflows/ci.yml` - CI pipeline configuration

## CI/CD Pipeline

**GitHub Actions Workflow:**
- Node.js 20 for all Node.js projects
- Python 3.12 for Python services  
- Runs on: root, backend, web-admin, agent7-messaging, agent9-search, media-service, events-service
- Linting only runs on root project
- Terraform validation for infrastructure

**CI Commands:**
- `npm ci --no-fund --no-audit` for dependencies
- `npm run lint --if-present`
- `npm test --if-present`  
- `npm run build --if-present`
- `npx tsc -p tsconfig.app.json --noEmit` for root TypeScript check

## Environment Variables

**Web App (VITE_*):**
- `VITE_SERPAPI_KEY` - For search functionality
- `VITE_MSG_API` - Messaging service URL (default: http://localhost:8080)

**Services:**
- See individual service READMEs for specific environment setup
- Docker Compose sets appropriate development defaults

## Common Issues

1. **Web dev server port confusion**: Runs on 8080, not 5173
2. **Python virtual environment**: Always activate `.venv` before Python commands
3. **SQLAlchemy errors**: Use `events-service/` instead of root Python service
4. **Test failures**: Some integration tests missing dependencies (expected)
5. **Lint errors**: Many existing errors in codebase (do not fix unrelated ones)

## Service-Specific Instructions

**Agent7-Messaging:**
- Supports WebSocket connections, JWT auth, E2EE key registry
- Build has tsconfig rootDir issue (exclude tests from build)
- Tests pass, provides messaging functionality

**Agent9-Search:**  
- Requires Typesense running for full functionality
- Can build and start without Typesense for validation
- Use Docker Compose for Typesense dependency

**Events Service (Node.js version in events-service/):**
- Builds successfully in 2.5s
- Separate from broken root Python events service
- Use this for events functionality

## Manual Validation Scenarios

**Complete end-to-end validation workflow:**
1. Start web application: `npm run dev`
2. Visit http://localhost:8080/ in browser
3. Verify iKasiLink homepage loads with branding and features
4. Confirm no console errors in browser dev tools
5. Test navigation elements and CTAs render correctly

**Expected results:**
- Homepage displays "iKasiLink - The Township Super-App for Chat • Money • Community"
- Three feature cards: Chat, Money, Community
- Orange to blue gradient hero section with community imagery
- Footer with newsletter signup and navigation links
- No JavaScript console errors

## Quick Reference Commands

**Root project validation:**
```bash
npm install                    # 45s - NEVER CANCEL, timeout 120s+
npm run build                  # 8s - NEVER CANCEL, timeout 120s+
npm run lint                   # expect 17 errors, 7 warnings
npm test                       # partial success, some dependency issues
npm run dev                    # starts on :8080, NOT 5173
npx tsc -p tsconfig.app.json --noEmit  # type check, expect some errors
```

**Python service validation:**
```bash
python3 -m venv .venv
source .venv/bin/activate  
pip install -U pip wheel setuptools && pip install -r requirements.txt  # 20s
# Skip uvicorn start - root service has SQLAlchemy errors
```

**Individual service validation:**
```bash
cd agent7-messaging && npm install && npm test && npm run build  # test mostly passes
cd ../events-service && npm install && npm run build             # builds successfully
cd ../agent9-search && npm install && npm run build             # requires Typesense for full function
```

**Docker Compose (full stack):**
```bash
docker compose -f docker-compose.dev.yml up  # starts all services
# Web app: http://localhost:5173/
# Individual services on documented ports
```