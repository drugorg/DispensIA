# DispensIA — Privacy Labels checklist

Risposte campo-per-campo per:
- **Apple App Store Connect → App Privacy** (Nutrition Labels)
- **Google Play Console → Data safety**

Compila esattamente come scritto qui. Salva. Hai finito in ~15 min totale.

---

## 🍎 APPLE — App Privacy (Nutrition Labels)

App Store Connect → DispensIA → tab **App Privacy** → **Edit**

### Step 1 — Privacy Policy URL
```
https://dispensia.app/privacy
```

### Step 2 — Data Types Collected

Apple ti chiede "Does this app collect data from this app?" → **Yes**.

Poi devi dichiarare ogni tipologia di dato. Per ogni "Yes", Apple chiede 3 cose:
1. Linked to user identity? (Yes/No)
2. Used for tracking? (Yes/No)
3. Purposes (puoi selezionarne più di uno)

Compila come segue:

#### ✅ Contact Info → Email Address
- Linked to user: **Yes**
- Used for tracking: **No**
- Purposes: **App Functionality** (autenticazione)

#### ✅ Identifiers → User ID
- Linked to user: **Yes**
- Used for tracking: **No**
- Purposes: **App Functionality**, **Analytics**

#### ✅ Identifiers → Device ID
⚠️ Solo se gli utenti free vedono ads (che è il nostro caso). AdMob accede a IDFA per frequency capping anche in NPA mode.
- Linked to user: **No** (IDFA non è linkato all'identità Clerk)
- Used for tracking: **No** (usiamo solo Non-Personalized Ads, no cross-app tracking)
- Purposes: **Third-Party Advertising** (AdMob)

> ⚠️ Nota: se Apple rejecta l'app per questa dichiarazione, dobbiamo aggiungere il prompt **App Tracking Transparency (ATT)** all'app. L'ho già predisposto in app.json (`userTrackingUsageDescription`), serve solo aggiungere il codice che lo mostra. Fammi sapere se rejectano.

#### ✅ User Content → Other User Content
(Le ricette estratte e i link ai video condivisi)
- Linked to user: **Yes**
- Used for tracking: **No**
- Purposes: **App Functionality** (è il core del prodotto)

#### ✅ Usage Data → Product Interaction
(I contatori delle estrazioni giornaliere, lo stato premium)
- Linked to user: **Yes**
- Used for tracking: **No**
- Purposes: **App Functionality**, **Analytics**

#### ✅ Purchases → Purchase History
(Lo stato dell'abbonamento Pro, anche se non vediamo direttamente i numeri di carta)
- Linked to user: **Yes**
- Used for tracking: **No**
- Purposes: **App Functionality**

### Step 3 — Data NOT Collected

Per tutte queste tipologie Apple ti chiede se le raccogli. Rispondi **No**:

- Health & Fitness (tutti i sotto-tipi)
- Financial Info → Payment Info, Credit Info, Other Financial Info ❌ NON le raccogliamo (gestite da Apple/Google)
- Location (Precise + Coarse) — DispensIA non usa GPS
- Sensitive Info (orientamento sessuale, religione, ecc.)
- Contacts
- User Content → Photos or Videos, Audio Data — gli audio Whisper non vengono archiviati
- Browsing History
- Search History
- Diagnostics (se non hai integrato Sentry/Crashlytics, **No**)
- Other (lascia vuoto)

### Step 4 — Tracking

Apple chiede una conferma finale: "Does this app track users?"
→ **No** (perché usiamo solo Non-Personalized Ads).

Save.

---

## 🤖 GOOGLE PLAY — Data Safety

Play Console → DispensIA → sidebar **Policy** → **App content** → sezione **Data safety** → **Manage**

### Step 1 — Data collection and security

- **Does your app collect or share any of the required user data types?** → **Yes**
- **Is all of the user data collected by your app encrypted in transit?** → **Yes** (HTTPS sempre)
- **Do you provide a way for users to request that their data be deleted?** → **Yes** (link: `mailto:info@dispensia.app`)

### Step 2 — Data Types

Per ogni categoria, Google chiede:
- Collected? (yes/no)
- Shared with third parties? (yes/no)
- Optional or required?
- Purposes (multipli)

Compila come segue:

#### ✅ Personal info → Email address
- Collected: **Yes**
- Shared: **No**
- Optional or required: **Required** (serve per il login)
- Processed ephemerally: **No**
- Purposes: **Account management**

#### ✅ Personal info → User IDs
- Collected: **Yes**
- Shared: **No**
- Required: **Required**
- Purposes: **Account management**, **App functionality**, **Analytics**

#### ✅ App activity → App interactions
(Conta delle estrazioni giornaliere)
- Collected: **Yes**
- Shared: **No**
- Required: **Required**
- Purposes: **App functionality** (rate limiting), **Fraud prevention, security, and compliance**

#### ✅ App activity → In-app search history
- Collected: **No** (NON tracciamo le ricerche nel vault)

#### ✅ Files and docs → Files and docs
- Collected: **No**

#### ✅ Photos and videos → Photos
- Collected: **Yes** (solo se l'utente carica una foto su una ricetta manuale)
- Shared: **No**
- Optional: **Optional**
- Processed ephemerally: **No**
- Purposes: **App functionality**

#### ✅ Photos and videos → Videos
- Collected: **No** (non archiviamo video)

#### ✅ Audio files
- Collected: **No** (Whisper processa in memoria, niente storage)

#### ✅ Device or other IDs
(IDFA / Advertising ID via AdMob)
- Collected: **Yes**
- Shared: **Yes** (con Google AdMob)
- Required: **Required**
- Processed ephemerally: **No**
- Purposes: **Advertising or marketing**, **Fraud prevention, security, and compliance**

#### ✅ Purchase history
- Collected: **Yes** (lo stato premium ricevuto da RevenueCat)
- Shared: **No**
- Required: **Required**
- Purposes: **App functionality**

#### ❌ Tutto il resto (Health, Financial, Location, Contacts, Messages, Web browsing, ecc.)
- Collected: **No**

### Step 3 — Riepilogo
Google ti mostra un riepilogo di quello che hai dichiarato. Salva.

---

## Domande comuni che possono uscire al review

### Q: "Why do you collect Email Address?"
A: User authentication via Clerk (third-party identity provider).

### Q: "Why do you use Advertising IDs?"
A: To show non-personalized ads via Google AdMob to free-tier users only. Subscription users have ads disabled. We do not link ad identifiers to user identity for cross-app tracking.

### Q: "What is purpose of App interactions?"
A: To enforce daily extraction limits per user (anti-abuse) and to deliver tier-specific quotas (free vs premium subscription).

### Q: "Do you process audio?"
A: For premium users, when video description doesn't contain a recipe, we send the video audio to OpenAI Whisper for transcription. The audio file is processed in-memory and discarded immediately after extraction. We do not store audio.

---

## Aggiornamento Privacy Policy URL

Sia Apple che Google chiedono un link pubblico alla Privacy Policy. Il tuo:

```
https://dispensia.app/privacy
```

(Confermato live e aggiornato).

Anche `https://dispensia.app/terms` (Termini di Servizio) — Google Play lo chiede in alcuni form.
