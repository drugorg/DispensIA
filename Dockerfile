# Usa un computer virtuale con Python
FROM python:3.11-slim

# Installa FFmpeg (Fondamentale per il nostro motore audio)
RUN apt-get update && apt-get install -y ffmpeg

# Crea la cartella di lavoro
WORKDIR /app

# Copia il file dei requisiti e installa le librerie (FastAPI, OpenAI, ecc.)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia tutto il resto del tuo codice
COPY . .

# Accendi il server sulla porta 10000 (che è quella usata da Render)
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "10000"]