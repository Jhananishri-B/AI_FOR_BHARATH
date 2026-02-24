# Use Python runtime as base
FROM python:3.10-slim

# Install system dependencies for OpenCV, MediaPipe, WeasyPrint, and code execution
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    gcc \
    g++ \
    nodejs \
    npm \
    default-jdk \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file from its location relative to the root
COPY services/api/requirements.txt .

# Install dependencies with SSL workaround
RUN pip install --no-cache-dir --timeout 1000 --retries 5 --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt

# Copy your application's source code AND the scripts
COPY services/api/src ./src
COPY scripts ./scripts

# Copy certificate template
COPY certificate_template_default.html ./certificate_template_default.html

# Create directory for generated certificates
RUN mkdir -p /app/certificates

# Command to run the application with auto-reload for development
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]