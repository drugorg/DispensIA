"""
Script di migrazione: ripara le thumbnail delle ricette vecchie.

Per ogni ricetta con thumbnail mancante/scaduta:
1. Prende source_url (link TikTok originale)
2. Chiama tikwm per recuperare la thumbnail fresca
3. La scarica, ritaglia 9:16, comprime in base64
4. Aggiorna il documento in MongoDB

Usage:
    cd api
    python migrate_thumbnails.py
"""
import asyncio
import os
import io
import base64
import requests
from PIL import Image
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

MONGO_DETAILS = os.getenv("MONGO_URL")
client_db = AsyncIOMotorClient(MONGO_DETAILS)
db = client_db.ClipKitDB
global_recipes = db.global_recipes


def download_thumbnail_base64(thumb_url: str) -> str:
    """Scarica, ritaglia 9:16, comprime a ~15-25KB."""
    try:
        resp = requests.get(thumb_url, timeout=15)
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
        print(f"  ⚠️  Download fallito: {e}", flush=True)
        return ""


def get_fresh_thumb_from_tiktok(source_url: str) -> str:
    """Chiama tikwm per prendere URL thumbnail fresca."""
    try:
        clean_url = source_url.split("?")[0]
        res = requests.post("https://www.tikwm.com/api/", data={'url': clean_url}, timeout=15).json()
        if 'data' in res and 'cover' in res['data']:
            return res['data']['cover']
    except Exception as e:
        print(f"  ⚠️  tikwm fallito: {e}", flush=True)
    return ""


async def needs_migration(recipe: dict) -> bool:
    """Ritorna True se la thumbnail è mancante o non è base64."""
    thumb = recipe.get("thumbnail", "")
    if not thumb:
        return True
    if not thumb.startswith("data:image"):
        return True  # è ancora un URL esterno, scaduto
    return False


async def migrate():
    total = await global_recipes.count_documents({})
    print(f"\n🔍 Trovate {total} ricette totali nel database")

    to_fix = []
    async for r in global_recipes.find({}):
        if await needs_migration(r):
            to_fix.append(r)

    print(f"📋 {len(to_fix)} ricette da riparare\n")

    if not to_fix:
        print("✅ Nessuna migrazione necessaria!")
        return

    success = 0
    skipped = 0
    for i, r in enumerate(to_fix, 1):
        titolo = r.get("titolo", "(senza titolo)")[:50]
        print(f"[{i}/{len(to_fix)}] {titolo}...")

        source_url = r.get("source_url") or r.get("url")
        if not source_url:
            print(f"  ⏭️  Skip: nessuna URL sorgente")
            skipped += 1
            continue

        fresh_url = get_fresh_thumb_from_tiktok(source_url)
        if not fresh_url:
            print(f"  ⏭️  Skip: impossibile recuperare thumbnail")
            skipped += 1
            continue

        b64 = download_thumbnail_base64(fresh_url)
        if not b64:
            skipped += 1
            continue

        await global_recipes.update_one(
            {"_id": r["_id"]},
            {"$set": {"thumbnail": b64}}
        )
        print(f"  ✅ Aggiornata ({len(b64) // 1024} KB)")
        success += 1

    print(f"\n🎉 Fatto! {success} riparate, {skipped} saltate")


if __name__ == "__main__":
    asyncio.run(migrate())