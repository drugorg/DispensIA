# Usa un computer virtuale con Python
FROM python:3.11-slim

# Installa FFmpeg + Node.js
RUN apt-get update && apt-get install -y ffmpeg curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Crea la cartella di lavoro
WORKDIR /app

# Copia e installa dipendenze Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia e builda il frontend React
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copia tutto il resto del codice
COPY . .

# Accendi il server sulla porta assegnata da Render
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-10000}