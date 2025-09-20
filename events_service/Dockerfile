# syntax=docker/dockerfile:1.7-labs

FROM python:3.11-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

RUN groupadd -r app && useradd -r -g app app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY static ./static
COPY templates ./templates

USER app
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD python - <<'PY' || exit 1
import urllib.request, sys
try:
    with urllib.request.urlopen('http://127.0.0.1:8001/health') as r:
        sys.exit(0 if r.status == 200 else 1)
except Exception:
    sys.exit(1)
PY

CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8001"]
