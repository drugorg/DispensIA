from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
import io
import json
import base64
import re
import requests
import subprocess
from urllib.parse import urlparse
from PIL import Image
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
 
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# =================================================================
# 🟢 CONFIGURAZIONE
# =================================================================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMP_DIR = os.path.join(BASE_DIR, "temp")
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

MONGO_DETAILS = os.getenv("MONGO_URL")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

if not MONGO_DETAILS or not OPENAI_KEY:
    print("🚨 ERRORE: Chiavi API non trovate!")

client_db = AsyncIOMotorClient(MONGO_DETAILS)
db = client_db.ClipKitDB
global_recipes = db.global_recipes
user_vaults = db.user_vaults
usage = db.usage

DAILY_LIMIT = int(os.getenv("DAILY_EXTRACT_LIMIT", "10"))

client_ai = openai.OpenAI(api_key=OPENAI_KEY)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await usage.create_index("created_at", expireAfterSeconds=172800)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
 
class LinkRequest(BaseModel):
    url: str
    user_id: str
    lang: str = "it"


class IngredientUpdate(BaseModel):
    nome: str
    quantita: str


class RecipeUpdate(BaseModel):
    titolo: str | None = None
    ingredienti: list[IngredientUpdate] | None = None
    preparazione: list[str] | None = None


class RecipeCreate(BaseModel):
    user_id: str
    titolo: str
    ingredienti: list[IngredientUpdate] = []
    preparazione: list[str] = []
    porzioni: int | None = None
 
 
# =================================================================
# 🧭 PLATFORM DETECTION
# =================================================================
def detect_platform(url: str) -> str:
    host = (urlparse(url).hostname or '').lower()
    if 'tiktok.com' in host:
        return 'tiktok'
    if 'instagram.com' in host:
        return 'instagram'
    return 'unknown'
 
 
def is_instagram_story(url: str) -> bool:
    return '/stories/' in url.lower()
 
 
# =================================================================
# 🎬 METADATA EXTRACTION — multi-provider, multi-piattaforma
# =================================================================
def _fetch_tiktok_via_tikwm(clean_url: str) -> dict | None:
    try:
        res = requests.post(
            "https://www.tikwm.com/api/",
            data={'url': clean_url},
            timeout=15,
        ).json()
        if 'data' in res and 'play' in res['data']:
            d = res['data']
            return {
                'video_url': d['play'],
                'thumb_url': d.get('cover', ''),
                'desc': d.get('title', ''),
                'has_video': True,
                'source': 'tikwm',
            }
    except Exception as e:
        print(f"⚠️  tikwm fallito: {e}", flush=True)
    return None
 
 
def _fetch_via_ytdlp(clean_url: str) -> dict | None:
    """Funziona per TikTok, Instagram Reels e Post video."""
    try:
        result = subprocess.run(
            ['yt-dlp', '--dump-json', '--no-playlist', '--skip-download', clean_url],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            err = result.stderr.lower()
            if 'login' in err or 'private' in err or 'not available' in err:
                raise HTTPException(
                    status_code=403,
                    detail="Contenuto privato o non accessibile. Il profilo deve essere pubblico."
                )
            print(f"⚠️  yt-dlp errore: {result.stderr[:300]}", flush=True)
            return None
 
        info = json.loads(result.stdout)
        video_url = info.get('url')
        return {
            'video_url': video_url,
            'thumb_url': info.get('thumbnail', ''),
            'desc': info.get('description') or info.get('title', '') or '',
            'has_video': bool(video_url),
            'source': 'yt-dlp',
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️  yt-dlp exception: {e}", flush=True)
    return None
 
 
def _fetch_instagram_photo_post(clean_url: str) -> dict | None:
    """Fallback per Post Instagram solo foto: legge gli Open Graph tag."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                          'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        resp = requests.get(clean_url, headers=headers, timeout=15)
        if resp.status_code != 200:
            return None
 
        html = resp.text
 
        def og(prop: str) -> str:
            m = re.search(
                rf'<meta\s+property="og:{prop}"\s+content="([^"]*)"',
                html,
                re.IGNORECASE,
            )
            return m.group(1) if m else ''
 
        desc = og('description')
        img = og('image')
        if not desc:
            return None
 
        return {
            'video_url': None,
            'thumb_url': img,
            'desc': desc,
            'has_video': False,
            'source': 'og-tags',
        }
    except Exception as e:
        print(f"⚠️  OG scrape fallito: {e}", flush=True)
    return None
 
 
def get_content_metadata(clean_url: str) -> dict:
    """
    Strategia:
    - TikTok → tikwm primario, yt-dlp fallback
    - Instagram Reel/Post video → yt-dlp
    - Instagram Post foto → OG tags
    """
    platform = detect_platform(clean_url)
 
    if platform == 'instagram' and is_instagram_story(clean_url):
        raise HTTPException(
            status_code=400,
            detail="Le Stories Instagram non sono supportate. Usa un Reel o un Post."
        )
 
    if platform == 'tiktok':
        print(">> tikwm...", flush=True)
        data = _fetch_tiktok_via_tikwm(clean_url)
        if data:
            print(f"🟢 OK via {data['source']}", flush=True)
            return data
 
    print(">> yt-dlp...", flush=True)
    data = _fetch_via_ytdlp(clean_url)
    if data:
        print(f"🟢 OK via {data['source']} (video={data['has_video']})", flush=True)
        return data
 
    if platform == 'instagram':
        print(">> OG tags (post foto)...", flush=True)
        data = _fetch_instagram_photo_post(clean_url)
        if data:
            print(f"🟢 OK via {data['source']}", flush=True)
            return data
 
    raise HTTPException(
        status_code=503,
        detail="Impossibile accedere al contenuto. Verifica che il link sia valido e il profilo pubblico."
    )
 
 
# =================================================================
# 🖼️ THUMBNAIL → base64 (~15-25KB)
# =================================================================
def download_thumbnail_base64(thumb_url: str) -> str:
    if not thumb_url:
        return ""
    try:
        resp = requests.get(thumb_url, timeout=10)
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content)).convert("RGB")
 
        target_ratio = 9 / 16
        w, h = img.size
        current_ratio = w / h
        if current_ratio > target_ratio:
            new_w = int(h * target_ratio)
            left = (w - new_w) // 2
            img = img.crop((left, 0, left + new_w, h))
        else:
            new_h = int(w / target_ratio)
            top = (h - new_h) // 2
            img = img.crop((0, top, w, top + new_h))
 
        img = img.resize((200, 356), Image.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=60, optimize=True)
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{encoded}"
    except Exception as e:
        print(f"⚠️ Thumbnail non scaricabile: {e}", flush=True)
        return ""
 
 
# =================================================================
# 🧠 AI EXTRACTION
# =================================================================
_LANG_RULE = (
    "REGOLA LINGUA (OBBLIGATORIA, SENZA ECCEZIONI): "
    "Ogni singolo campo testuale dell'output JSON — titolo, ingredienti[].nome, "
    "ingredienti[].quantita, ogni elemento di preparazione[] — "
    "DEVE essere scritto ESCLUSIVAMENTE in lingua \"{lang}\". "
    "Mescolare lingue diverse nel JSON è assolutamente vietato. "
    "Se il contenuto del video è in un'altra lingua, traduci TUTTO in \"{lang}\" senza eccezioni. "
    "Se il contenuto è già in \"{lang}\", mantienilo in \"{lang}\". "
    "Non lasciare mai nessun campo in una lingua diversa da \"{lang}\"."
)

_ING_RULE = (
    "REGOLE INGREDIENTI: "
    "(1) Il campo 'nome' di ogni ingrediente deve avere la prima lettera maiuscola (es. 'Olio di sesamo'). "
    "(2) Il campo 'quantita' NON deve mai essere vuoto o null: "
    "se la quantità non è specificata o non è determinabile, scrivi il termine per 'quanto basta' "
    "nella lingua \"{lang}\" (it: 'q.b.', en: 'to taste', fr: 'q.s.', es: 'c.s.')."
)


def _system_text_only(lang: str) -> str:
    lang_rule = _LANG_RULE.replace('"{lang}"', f'"{lang}"')
    ing_rule = _ING_RULE.replace('"{lang}"', f'"{lang}"')
    return (
        f"Analizza il testo. Se contiene chiaramente una ricetta con ingredienti e quantità, "
        f'estraila in JSON: {{"has_recipe": true, "titolo": "...", '
        f'"porzioni": <numero intero di persone se esplicitamente menzionato altrimenti null>, '
        f'"ingredienti": [{{"nome": "...", "quantita": "..."}}], "preparazione": ["..."]}}. '
        f'{lang_rule} {ing_rule} '
        f'Se NON contiene una ricetta o mancano gli ingredienti, restituisci SOLO: {{"has_recipe": false}}.'
    )


def _system_combined(lang: str) -> str:
    lang_rule = _LANG_RULE.replace('"{lang}"', f'"{lang}"')
    ing_rule = _ING_RULE.replace('"{lang}"', f'"{lang}"')
    return (
        f"Estrai la ricetta in JSON rigoroso: {{titolo, "
        f"porzioni: <numero intero persone se menzionato esplicitamente altrimenti null>, "
        f"ingredienti: [{{nome, quantita}}], preparazione: []}}. "
        f'{lang_rule} {ing_rule} '
        f"Sii conciso e ignora le chiacchiere."
    )


def _normalize_parsed(parsed: dict, lang: str) -> dict:
    """Post-process AI output: capitalize ingredient names, fill empty quantities."""
    fallback_title = {"it": "Ricetta senza titolo", "en": "Untitled recipe"}.get(lang, "Untitled recipe")
    if not (parsed.get("titolo") or "").strip():
        parsed["titolo"] = fallback_title
    qb = {"it": "q.b.", "en": "to taste", "fr": "q.s.", "es": "c.s."}.get(lang, "q.b.")
    for ing in parsed.get("ingredienti", []):
        nome = (ing.get("nome") or "").strip()
        ing["nome"] = nome[0].upper() + nome[1:] if nome else nome
        qty = (ing.get("quantita") or "").strip()
        ing["quantita"] = qty if qty else qb
    return parsed
 
 
def extract_from_text(desc: str, lang: str = "it") -> dict | None:
    res = client_ai.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _system_text_only(lang)},
            {"role": "user", "content": desc},
        ],
    )
    data = json.loads(res.choices[0].message.content)
    if data.get("has_recipe"):
        data.pop("has_recipe", None)
        return data
    return None
 
 
def extract_from_text_and_audio(desc: str, transcription: str, lang: str = "it") -> dict:
    res = client_ai.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _system_combined(lang)},
            {"role": "user", "content": f"Testo: {desc} | Audio: {transcription}"},
        ],
    )
    return json.loads(res.choices[0].message.content)
 
 
# =================================================================
# 🛡️ RATE LIMITING
# =================================================================
_RATE_LIMIT_MSG = {
    "it": "Hai raggiunto il limite di {n} estrazioni al giorno. Riprova domani.",
    "en": "You have reached the daily limit of {n} extractions. Try again tomorrow.",
}

async def check_rate_limit(user_id: str, lang: str) -> None:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    doc = await usage.find_one({"user_id": user_id, "date": today})
    count = (doc or {}).get("count", 0)
    if count >= DAILY_LIMIT:
        msg = _RATE_LIMIT_MSG.get(lang, _RATE_LIMIT_MSG["en"]).format(n=DAILY_LIMIT)
        raise HTTPException(status_code=429, detail=msg)
    await usage.update_one(
        {"user_id": user_id, "date": today},
        {
            "$inc": {"count": 1},
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)},
        },
        upsert=True,
    )


# =================================================================
# 🟢 ROTTE API
# =================================================================
 
@app.get("/")
async def health_check():
    return {"status": "DispensIA API online"}
 
 
@app.post("/extract")
async def extract_recipe(request: LinkRequest):
    clean_url = request.url.split("?")[0].rstrip('/')
    user_id = request.user_id
    lang = request.lang or "it"
    unique_id = str(ObjectId())
    platform = detect_platform(clean_url)
 
    if platform == 'unknown':
        raise HTTPException(
            status_code=400,
            detail="Link non riconosciuto. Supportiamo TikTok e Instagram."
        )
 
    temp_video = os.path.join(TEMP_DIR, f"{unique_id}.mp4")
    temp_audio = os.path.join(TEMP_DIR, f"{unique_id}.mp3")
 
    try:
        print(f"\n--- DISPENSIA [{platform.upper()}] {clean_url} ---", flush=True)
 
        existing = await global_recipes.find_one({"source_url": clean_url, "lang": lang})
        if existing:
            print("🟢 già in database", flush=True)
            recipe_id = existing["_id"]
        else:
            await check_rate_limit(user_id, lang)
            print("🔴 Nuova clip. Recupero metadati...", flush=True)
            metadata = get_content_metadata(clean_url)
            video_url = metadata['video_url']
            thumb_url = metadata['thumb_url']
            desc = metadata['desc']
            has_video = metadata['has_video']
 
            print(">> Thumbnail...", flush=True)
            thumbnail_b64 = download_thumbnail_base64(thumb_url)
 
            # 💡 PIANO A: solo testo
            print(">> PIANO A: analisi testo...", flush=True)
            parsed = extract_from_text(desc, lang)
 
            if parsed:
                print("🟢 Ricetta trovata nel testo!", flush=True)
            elif not has_video:
                raise HTTPException(
                    status_code=422,
                    detail="Nessuna ricetta trovata nella descrizione di questo post. Prova con un Reel o un video."
                )
            else:
                # 🔊 PIANO B: audio + testo
                print("🟡 PIANO B: video + audio...", flush=True)
                headers = {
                    'User-Agent': 'TikTok 26.2.3 rv:262318 (iPhone; iOS 14.4.2; sv_SE) Cronet'
                }
                video_data = requests.get(video_url, headers=headers, timeout=30).content
                with open(temp_video, 'wb') as f:
                    f.write(video_data)
 
                os.system(
                    f'ffmpeg -i {temp_video} -vn '
                    f'-af "silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-30dB,atempo=1.5" '
                    f'-b:a 64k {temp_audio} -y > /dev/null 2>&1'
                )
                audio_path = temp_audio if os.path.exists(temp_audio) else temp_video
 
                print(">> Whisper...", flush=True)
                with open(audio_path, "rb") as f:
                    transcription = client_ai.audio.transcriptions.create(
                        model="whisper-1",
                        file=("audio.mp3", f, "audio/mpeg"),
                    )
 
                print(">> JSON finale...", flush=True)
                parsed = extract_from_text_and_audio(desc, transcription.text, lang)
 
            parsed = _normalize_parsed(parsed, lang)
            parsed["source_url"] = clean_url
            parsed["thumbnail"] = thumbnail_b64
            parsed["platform"] = platform
            parsed["lang"] = lang
            result = await global_recipes.insert_one(parsed)
            recipe_id = result.inserted_id
 
        await user_vaults.update_one(
            {"user_id": user_id, "recipe_id": recipe_id},
            {"$set": {"user_id": user_id, "recipe_id": recipe_id}},
            upsert=True,
        )
        return {"status": "success"}
 
    except HTTPException:
        raise
    except Exception as e:
        print(f"🚨 ERRORE: {str(e)}", flush=True)
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        for f in [temp_video, temp_audio]:
            if os.path.exists(f):
                os.remove(f)
 
 
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
 
 
@app.post("/recipes")
async def create_recipe(payload: RecipeCreate):
    if not payload.titolo.strip():
        raise HTTPException(status_code=400, detail="Titolo richiesto")

    doc = {
        "titolo": payload.titolo.strip(),
        "ingredienti": [i.model_dump() for i in payload.ingredienti],
        "preparazione": [s for s in payload.preparazione if s.strip()],
        "porzioni": payload.porzioni,
        "thumbnail": None,
        "source_url": None,
        "platform": "manual",
        "created_at": datetime.now(timezone.utc),
    }
    result = await global_recipes.insert_one(doc)
    await user_vaults.insert_one({"user_id": payload.user_id, "recipe_id": result.inserted_id})

    doc["_id"] = str(result.inserted_id)
    return doc


@app.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, user_id: str):
    await user_vaults.delete_one({"user_id": user_id, "recipe_id": ObjectId(recipe_id)})
    return {"status": "unlinked"}


@app.patch("/recipes/{recipe_id}")
async def update_recipe(recipe_id: str, user_id: str, update: RecipeUpdate):
    oid = ObjectId(recipe_id)
    update_data = {}
    if update.titolo is not None:
        update_data["titolo"] = update.titolo
    if update.ingredienti is not None:
        update_data["ingredienti"] = [i.model_dump() for i in update.ingredienti]
    if update.preparazione is not None:
        update_data["preparazione"] = update.preparazione
    if not update_data:
        return {"status": "ok"}

    ref_count = await user_vaults.count_documents({"recipe_id": oid})

    if ref_count > 1:
        original = await global_recipes.find_one({"_id": oid})
        if not original:
            raise HTTPException(status_code=404, detail="Ricetta non trovata")
        new_doc = {k: v for k, v in original.items() if k != "_id"}
        new_doc.update(update_data)
        new_doc.pop("source_url", None)
        result = await global_recipes.insert_one(new_doc)
        await user_vaults.update_one(
            {"user_id": user_id, "recipe_id": oid},
            {"$set": {"recipe_id": result.inserted_id}},
        )
    else:
        await global_recipes.update_one({"_id": oid}, {"$set": update_data})

    return {"status": "ok"}