FROM python:3.11-slim

WORKDIR /app

# Install dependencies from the repo root requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the node source
COPY blockchain/ .

EXPOSE 5001

CMD ["python", "blockchain_test.py", "--host", "0.0.0.0", "--port", "5001"]
