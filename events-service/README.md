# Events Service

Simple Node.js/TypeScript Express service for events and RSVPs with an in-memory store.

## Scripts

- dev: `npm run dev`
- build: `npm run build`
- start: `npm start`

## Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Endpoints

- GET `/health`
- Events
  - GET `/api/events`
  - GET `/api/events/:id`
  - POST `/api/events`
  - PUT `/api/events/:id`
  - DELETE `/api/events/:id`
- RSVPs
  - GET `/api/rsvps?eventId=:eventId`
  - GET `/api/rsvps/:id`
  - POST `/api/rsvps`
  - PUT `/api/rsvps/:id`
  - DELETE `/api/rsvps/:id`

## Notes

- Uses in-memory arrays. Data resets on restart.
- Reminder scheduler logs reminders around the minute a reminder should fire.

## Security

- Set `ENFORCE_HTTPS=true` in production to force HTTPS via reverse proxy headers.
- Security headers are applied via Helmet.