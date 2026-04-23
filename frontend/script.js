const API_BASE = "https://dispensia.onrender.com";
let userId = null;
let allRecipes = [];
let cartIds = [];
let isListView = false;

async function init() {
    if (!window.Clerk) { setTimeout(init, 100); return; }
    try {
        await window.Clerk.load();
        if (window.Clerk.user) {
            userId = window.Clerk.user.id;
            document.getElementById('app-content').classList.remove('hidden');
            document.getElementById('bottom-nav').classList.remove('hidden');
            document.getElementById('login-screen').classList.add('hidden');
            window.Clerk.mountUserButton(document.getElementById('user-button-container'));
            loadRecipes();
        } else {
            document.getElementById('login-screen').classList.remove('hidden');
            window.Clerk.mountSignIn(document.getElementById('sign-in-container'));
        }
    } catch (e) { console.error(e); }
}
init();

function changeTab(view, el) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    if(view === 'cart') renderCart();
}

async function loadRecipes() {
    if(!userId) return;
    const res = await fetch(`${API_BASE}/recipes?user_id=${userId}`);
    allRecipes = await res.json();
    const grid = document.getElementById('recipes-grid');
    document.getElementById('recipe-count').innerText = `${allRecipes.length} ricette`;
    grid.innerHTML = allRecipes.map(r => `
        <div class="recipe-card" onclick="openRecipe('${r._id}')">
            <div class="delete-badge" onclick="event.stopPropagation(); deleteRec('${r._id}')">✕</div>
            <img src="${r.thumbnail || ''}" loading="lazy">
            <div style="padding:12px">
                <h3 style="font-size:0.85rem; font-weight:600; line-height:1.3;">${r.titolo}</h3>
            </div>
        </div>
    `).join('');
}

function openRecipe(id) {
    const r = allRecipes.find(x => x._id === id);
    const inCart = cartIds.includes(id);
    
    document.getElementById('modal-body').innerHTML = `
        <h2 style="margin-bottom:10px; font-size: 1.4rem;">${r.titolo}</h2>
        
        <div class="progress-container"><div id="p-bar" class="progress-bar"></div></div>
        <p id="p-text" style="font-size:12px; text-align:right; color:var(--gray); font-weight:bold;">0% in dispensa</p>
        
        <div style="background: #eef2ff; padding: 12px; border-radius: 12px; margin: 15px 0; font-size: 0.85rem; color: #3b82f6; line-height: 1.4;">
            💡 <strong>Come funziona:</strong> Tocca gli ingredienti che hai già in dispensa per depennarli. Poi aggiungi la ricetta al carrello per comprare solo ciò che manca!
        </div>

        <h3 style="color:var(--primary); margin: 20px 0 10px 0; font-size: 1.1rem;">🛒 Ingredienti</h3>
        <ul id="m-list" style="list-style:none; margin:0 0 20px 0">
            ${r.ingredienti.map(i => `<li class="ingredient-item" onclick="this.classList.toggle('checked'); updP()">
                <span class="ingredient-name" style="flex:1;">${i.nome}</span>
                <strong class="ingredient-qty" style="color:var(--primary);">${i.quantita}</strong>
            </li>`).join('')}
        </ul>

        <h3 style="color:var(--primary); margin: 20px 0 10px 0; font-size: 1.1rem;">👨‍🍳 Procedimento</h3>
        <div style="font-size:0.95rem; color:#444; line-height:1.6; margin-bottom: 25px;">
            ${r.preparazione.map((p, i) => `<p style="margin-bottom:12px;"><strong>${i+1}.</strong> ${p}</p>`).join('')}
        </div>

        <button onclick="toggleC('${r._id}', this)" style="width:100%; padding:16px; border-radius:16px; border:none; background:${inCart?'#ffeeee':'#f2f2f7'}; color:${inCart?'var(--primary)':'#1c1c1e'}; font-weight:700; cursor:pointer; font-size:1rem; transition:0.2s;">
            ${inCart ? '➖ Rimuovi dalla spesa' : '➕ Aggiungi alla spesa'}
        </button>
        <a href="${r.source_url||r.url}" target="_blank" class="tiktok-link-btn">Guarda Video originale</a>
    `;
    
    document.getElementById('recipe-modal').classList.remove('hidden');
    updP(); // Forza l'aggiornamento a 0% appena si apre
}

function updP() {
    const items = document.querySelectorAll('.ingredient-item');
    const checked = document.querySelectorAll('.ingredient-item.checked').length;
    const p = items.length === 0 ? 0 : Math.round((checked / items.length) * 100);
    document.getElementById('p-bar').style.width = p+'%';
    const pText = document.getElementById('p-text');
    if(p === 100) {
        pText.innerHTML = '✅ <span style="color:#34c759;">Tutto in dispensa!</span>';
    } else {
        pText.innerText = p+'% in dispensa';
    }
}

function toggleC(id, btn) {
    const i = cartIds.indexOf(id);
    if(i>-1) { 
        cartIds.splice(i,1); 
        btn.innerText='➕ Aggiungi alla spesa'; 
        btn.style.background='#f2f2f7'; 
        btn.style.color='#1c1c1e';
    } else { 
        cartIds.push(id); 
        btn.innerText='➖ Rimuovi dalla spesa'; 
        btn.style.background='#ffeeee'; 
        btn.style.color='var(--primary)';
    }
}

function renderCart() {
    const cont = document.getElementById('cart-content');
    if(!cartIds.length) { 
        cont.innerHTML='<p style="text-align:center; margin-top:50px; color:var(--gray);">Nessuna ricetta nella lista della spesa.<br>Aggiungile dal tuo Vault!</p>'; 
        return; 
    }
    
    let html = '<p style="font-size:0.85rem; color:var(--gray); margin-bottom:15px; text-align:center;">🛒 Tocca gli ingredienti mentre li metti nel carrello al supermercato per depennarli.</p>';
    
    html += cartIds.map(id => {
        const r = allRecipes.find(x => x._id === id);
        return `<div style="background:white; padding:20px; border-radius:20px; margin-bottom:15px; box-shadow: 0 4px 15px rgba(0,0,0,0.04);">
            <h3 style="color:var(--primary); margin-bottom:15px; font-size:1.1rem;">${r.titolo}</h3>
            ${r.ingredienti.map(i => `<div class="ingredient-item" onclick="this.classList.toggle('checked')">
                <span style="flex:1;">${i.nome}</span>
                <strong style="color:var(--primary);">${i.quantita}</strong>
            </div>`).join('')}
        </div>`;
    }).join('');
    
    cont.innerHTML = html;
}

async function extractRecipe() {
    const url = document.getElementById('tiktok-url').value;
    if(!url) return;
    const btn = document.getElementById('extract-btn');
    btn.innerHTML = '...'; btn.disabled = true;
    
    const msg = document.getElementById('status-msg');
    msg.innerText = "Analisi video in corso...";
    msg.style.color = "var(--gray)";
    
    try {
        const res = await fetch(`${API_BASE}/extract`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({url, user_id:userId}) });
        if(res.ok) {
            msg.innerText = "✅ Ricetta estratta!";
            msg.style.color = "#34c759";
            document.getElementById('tiktok-url').value = '';
            loadRecipes();
        } else {
            msg.innerText = "❌ Impossibile estrarre.";
            msg.style.color = "var(--primary)";
        }
    } catch(e) {
        msg.innerText = "❌ Errore di connessione.";
        msg.style.color = "var(--primary)";
    } finally {
        btn.innerHTML = 'Estrai'; btn.disabled = false;
        setTimeout(() => msg.innerText = "", 3000);
    }
}

async function deleteRec(id) {
    if(!confirm("Vuoi davvero eliminare questa ricetta?")) return;
    await fetch(`${API_BASE}/recipes/${id}?user_id=${userId}`, { method:'DELETE' });
    
    // Rimuove la ricetta dal carrello se era stata aggiunta
    const i = cartIds.indexOf(id);
    if(i>-1) cartIds.splice(i,1);
    
    loadRecipes();
}

function toggleLayout() {
    isListView = !isListView;
    document.getElementById('recipes-grid').classList.toggle('list-mode');
    document.getElementById('toggle-view-btn').innerText = isListView ? "🔲 Griglia" : "📋 Lista";
}

function closeModal() { 
    document.getElementById('recipe-modal').classList.add('hidden'); 
}