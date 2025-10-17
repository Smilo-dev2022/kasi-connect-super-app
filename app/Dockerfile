FROM python:3.12-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

# Copy app
COPY app ./app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD python -c "import urllib.request,sys; \
    import os; \
    url=os.environ.get('HEALTH_URL','http://127.0.0.1:8000/health'); \
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    try: \
      r=urllib.request.urlopen(url,timeout=2); \
      sys.exit(0 if r.status==200 else 1) \
    except Exception: sys.exit(1)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
