from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import openai
import os
import json
import requests
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

# 1. Carica le chiavi segrete dal file .env (che Git ignorerà)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

app = FastAPI()
client = openai.OpenAI()
from fastapi.staticfiles import StaticFiles
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================================
# 🟢 CONFIGURAZIONE PERCORSI E CHIAVI
# =================================================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FRONTEND_PATH = os.path.join(BASE_DIR, "frontend", "index.html")
TEMP_DIR = os.path.join(BASE_DIR, "temp")

if not os.path.exists(TEMP_DIR): 
    os.makedirs(TEMP_DIR)

# Montaggio cartelle per file statici
app.mount("/frontend", StaticFiles(directory=os.path.join(BASE_DIR, "frontend")), name="frontend")
app.mount("/temp", StaticFiles(directory=TEMP_DIR), name="temp")

# Recupero chiavi dalle variabili d'ambiente
MONGO_DETAILS = os.getenv("MONGO_URL")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

if not MONGO_DETAILS or not OPENAI_KEY:
    print("🚨 ERRORE: Chiavi API non trovate nel file .env o nel sistema!")

# Connessioni Cloud
client_db = AsyncIOMotorClient(MONGO_DETAILS)
db = client_db.ClipKitDB
global_recipes = db.global_recipes
user_vaults = db.user_vaults

client_ai = openai.OpenAI(api_key=OPENAI_KEY)

class LinkRequest(BaseModel):
    url: str
    user_id: str

# =================================================================
# 🟢 LOGICA DI ESTRAZIONE RICETTA
# =================================================================

@app.get("/")
async def serve_home():
    return FileResponse(FRONTEND_PATH)

@app.post("/extract")
async def extract_recipe(request: LinkRequest):
    clean_url = request.url.split("?")[0]
    user_id = request.user_id
    unique_id = str(ObjectId())
    
    temp_video = os.path.join(TEMP_DIR, f"{unique_id}.mp4")
    temp_audio = os.path.join(TEMP_DIR, f"{unique_id}.mp3")
    
    try:
        print(f"\n--- DISPENSIA ANALISI: {clean_url} ---", flush=True)
        
        # ==========================================
        # 🛡️ LIVELLO 0: CACHING GLOBALE
        # ==========================================
        existing_recipe = await global_recipes.find_one({"source_url": clean_url})
        if existing_recipe:
            print("🟢 LIVELLO 0: MATCH TROVATO IN DATABASE!", flush=True)
            recipe_id = existing_recipe["_id"]
            
        else:
            print("🔴 NUOVA CLIP. Interrogo i server di TikTok...", flush=True)
            res = requests.post("https://www.tikwm.com/api/", data={'url': clean_url}).json()
            
            if 'data' in res and 'play' in res['data']:
                video_url = res['data']['play']
                thumb_url = res['data']['cover']
                desc = res['data'].get('title', '') # Contiene la descrizione del video
            else:
                raise HTTPException(status_code=400, detail="TikTok ha bloccato la richiesta.")

            # ==========================================
            # 💡 LIVELLO 1: PIANO A (Lettura della Descrizione)
            # ==========================================
            print(">> PIANO A: Controllo descrizione testuale...", flush=True)
            plan_a_res = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "Analizza il testo. Se contiene chiaramente una ricetta con ingredienti e quantità, estraila in JSON: {\"has_recipe\": true, \"titolo\": \"...\", \"ingredienti\": [{\"nome\": \"...\", \"quantita\": \"...\"}], \"preparazione\": [\"...\"]}. Se NON contiene una ricetta o mancano gli ingredienti, restituisci SOLO: {\"has_recipe\": false}."},
                    {"role": "user", "content": desc}
                ]
            )
            
            plan_a_data = json.loads(plan_a_res.choices[0].message.content)

            if plan_a_data.get("has_recipe") == True:
                print("🟢 BINGO! Ricetta trovata nella descrizione! (Nessun audio scaricato)", flush=True)
                parsed_data = plan_a_data
                del parsed_data["has_recipe"] # Rimuove la flag tecnica
                parsed_data["source_url"] = clean_url
                parsed_data["thumbnail"] = thumb_url
                
                insert_result = await global_recipes.insert_one(parsed_data)
                recipe_id = insert_result.inserted_id

            else:
                # ==========================================
                # 🔊 LIVELLO 2: PIANO B (Estrazione Audio + Whisper)
                # ==========================================
                print("🟡 PIANO B: Nessuna ricetta nel testo. Download video e analisi audio in corso...", flush=True)
                
                headers = {'User-Agent': 'TikTok 26.2.3 rv:262318 (iPhone; iOS 14.4.2; sv_SE) Cronet'}
                video_data = requests.get(video_url, headers=headers).content
                with open(temp_video, 'wb') as f:
                    f.write(video_data)

                # Estrazione audio con taglio silenzi e velocizzato (1.5x)
                print(">> Elaborazione audio ottimizzata...", flush=True)
                os.system(f'ffmpeg -i {temp_video} -vn -af "silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-30dB,atempo=1.5" -b:a 64k {temp_audio} -y > /dev/null 2>&1')
                
                audio_path = temp_audio if os.path.exists(temp_audio) else temp_video
                
                print(">> Trascrizione Whisper...", flush=True)
                with open(audio_path, "rb") as f:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1", 
                        file=("audio.mp3", f, "audio/mpeg"), 
                        language="it"
                    )
                
                print(">> Generazione JSON Finale...", flush=True)
                ai_res = client.chat.completions.create(
                    model="gpt-4o-mini",
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": "Estrai ricetta in JSON rigoroso: {titolo, ingredienti: [{nome, quantita}], preparazione: []}. Sii conciso e ignora le chiacchiere."},
                        {"role": "user", "content": f"Testo a supporto: {desc} | Trascrizione Audio: {transcription.text}"}
                    ]
                )
                
                parsed_data = json.loads(ai_res.choices[0].message.content)
                parsed_data["source_url"] = clean_url
                parsed_data["thumbnail"] = thumb_url
                
                insert_result = await global_recipes.insert_one(parsed_data)
                recipe_id = insert_result.inserted_id

        # ==========================================
        # 🔗 SALVATAGGIO NEL VAULT DELL'UTENTE
        # ==========================================
        await user_vaults.update_one(
            {"user_id": user_id, "recipe_id": recipe_id},
            {"$set": {"user_id": user_id, "recipe_id": recipe_id}},
            upsert=True
        )
        return {"status": "success"}

    except Exception as e:
        print(f"🚨 ERRORE: {str(e)}", flush=True)
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        for f in [temp_video, temp_audio]:
            if os.path.exists(f): os.remove(f)

# --- ALTRE ROTTE (GET e DELETE) ---

if len(recipe_data.get('ingredients', [])) == 0:
    return {"error": "Non ho trovato ingredienti. Questo video sembra non avere testo o audio descrittivo."}

@app.get("/recipes")
async def get_recipes(user_id: str):
    saved_ids = []
    async for link in user_vaults.find({"user_id": user_id}):
        saved_ids.append(link["recipe_id"])
    
    recipes = []
    async for r in global_recipes.find({"_id": {"$in": saved_ids}}):
        r["_id"] = str(r["_id"])
        recipes.append(r)
    return recipes

@app.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, user_id: str):
    await user_vaults.delete_one({"user_id": user_id, "recipe_id": ObjectId(recipe_id)})
    return {"status": "unlinked"}