FROM python:3.12-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir . && python -m playwright install --with-deps chromium
CMD ["gas-fair-calendar", "update"]
