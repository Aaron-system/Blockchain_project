FROM python:3.11-slim

WORKDIR /app

# Install dependencies from the repo root requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the wallet client source
COPY blockchain_client/ .

EXPOSE 8081

CMD ["python", "blockchain_client_test.py", "--host", "0.0.0.0", "--port", "8081"]
