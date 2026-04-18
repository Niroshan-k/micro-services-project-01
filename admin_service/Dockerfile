# Use the official Python 3.12 image
FROM python:3.12-slim

WORKDIR /app

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your source code
COPY ./src ./src
COPY .env .

# Document that this API runs on port 8000 internally
EXPOSE 8000

# The command to run the API
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]