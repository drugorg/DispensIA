# 🍲 DispensIA

**L'Intelligenza Artificiale che trasforma i video di TikTok in ricette perfette, in un lampo.**

DispensIA è un'applicazione mobile (iOS/Android) e web che permette agli utenti di incollare il link di una video-ricetta di TikTok e ottenere istantaneamente ingredienti, dosi e passaggi strutturati, pronti per essere salvati nel proprio Vault personale e aggiunti alla lista della spesa.

## ✨ Funzionalità Principali (Core Features)

* 🧠 **Motore AI Ibrido (Smart Extraction):** Il sistema analizza prima la descrizione testuale del video con GPT-4o-mini (costo prossimo allo zero). Solo se la ricetta non è presente nel testo, il sistema scarica il video, isola l'audio, rimuove i silenzi, lo velocizza (1.5x) e lo trascrive con Whisper, garantendo il massimo risparmio sui token.
* 🌍 **Global Caching:** Se un utente richiede una ricetta già estratta in precedenza da un altro utente, il backend la recupera dal database istantaneamente, abbattendo i costi API di OpenAI a $0.00.
* 🔐 **Autenticazione Sicura:** Gestione utenti e login (anche social) tramite Clerk.
* 📱 **Native Ready:** Frontend ottimizzato e impacchettato per iOS e Android tramite Capacitor.

## 🛠️ Stack Tecnologico

**Backend:**
* [FastAPI](https://fastapi.tiangolo.com/) (Python) - *Veloce, moderno e asincrono.*
* [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - *Database NoSQL per gestire il Global Caching e i Vault degli utenti.*
* [OpenAI API](https://openai.com/) - *GPT-4o-mini per il parsing JSON e Whisper-1 per la trascrizione audio.*
* [FFmpeg](https://ffmpeg.org/) - *Elaborazione e ottimizzazione audio in tempo reale.*

**Frontend & Mobile:**
* Vanilla HTML/CSS/JS - *Leggero, senza framework pesanti.*
* [Clerk](https://clerk.dev/) - *User Identity e UI di login.*
* [Capacitor](https://capacitorjs.com/) - *Per la compilazione nativa su iOS (Xcode) e Android (Android Studio).*