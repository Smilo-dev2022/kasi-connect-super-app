# Moderation Service (Agent 12)

Day 1 scaffold: FastAPI service exposing a simple abuse reporting API, an in-memory queue that forwards reports to a group chat stub, and an admin review panel stub.

## Requirements
- Python 3.11+

## Setup
```bash
cd /workspace/moderation_service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
chmod +x run.sh
./run.sh
```

The service runs at `http://localhost:8082`.

## Endpoints
- `GET /api/health` – service liveness
- `POST /api/reports` – create a report
- `GET /api/reports` – list reports, optional `?status_filter=pending|queued|in_review|action_taken|dismissed`
- `GET /api/reports/{id}` – get a specific report
- `PATCH /api/reports/{id}/status` – update report status (admin)
- `GET /admin` – admin review panel stub

## Example: Create a report
```bash
curl -sS -X POST http://localhost:8082/api/reports \
  -H 'content-type: application/json' \
  -d '{
    "content_id": "post_123",
    "content_text": "This is the content body with suspected abuse",
    "reason": "harassment",
    "reporter_id": "user_42"
  }' | jq .
```

## Notes
- Storage is in-memory and volatile.
- Abuse queue is an async background task that notifies the group chat stub and moves reports to `in_review`.
- Replace `GroupChatClient` with a real integration later.