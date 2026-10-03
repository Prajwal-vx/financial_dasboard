FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home --uid 10001 app && mkdir /data && chown app:app /data
COPY --chown=app:app backend ./backend
COPY --chown=app:app app.js index.html login.html login.js styles.css ./

ENV DATABASE_URL=sqlite:////data/finsight.db \
    APP_ENV=production
USER app
VOLUME ["/data"]
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
