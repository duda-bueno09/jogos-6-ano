"use strict";
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAmkeJD0SKNgVulQk1yLyngBDU50lPWNuA",
    authDomain: "ano-1bdba.firebaseapp.com",
    databaseURL: "https://ano-1bdba-default-rtdb.firebaseio.com",
    projectId: "ano-1bdba",
    storageBucket: "ano-1bdba.firebasestorage.app",
    messagingSenderId: "818388805249",
    appId: "1:818388805249:web:bc192123a614b21c838f80"
      };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
</script>

/* ---------- PERGUNTAS (mesma ordem para todos) ---------- */
const PERGUNTAS = [
  { icone: "🧭", texto: "Por onde o Sol nasce?", opcoes: [["🌅", "Leste"], ["🌇", "Oeste"], ["🥶", "Norte"], ["🔥", "Sul"]], certa: 0 },
  { icone: "🌳", texto: "Qual bioma é a maior floresta tropical do Brasil?", opcoes: [["🌵", "Caatinga"], ["🌴", "Amazônia"], ["🌾", "Pampa"], ["🐊", "Pantanal"]], certa: 1 },
  { icone: "🐊", texto: "Qual é a maior planície alagável do mundo?", opcoes: [["🐊", "Pantanal"], ["🌵", "Caatinga"], ["🏜️", "Deserto"], ["🌳", "Amazônia"]], certa: 0 },
  { icone: "🌵", texto: "Qual bioma tem clima seco e cactos no Nordeste?", opcoes: [["🌲", "Mata Atlântica"], ["🌵", "Caatinga"], ["🌾", "Pampa"], ["🌴", "Amazônia"]], certa: 1 },
  { icone: "🗺️", texto: "Em um mapa, o que a escala mostra?", opcoes: [["🎨", "As cores"], ["🧭", "O norte"], ["📏", "Tamanho real × desenho"], ["🏷️", "O título"]], certa: 2 },
  { icone: "🌊", texto: "Qual é o maior rio do Brasil em volume de água?", opcoes: [["🏞️", "Rio São Francisco"], ["🌊", "Rio Amazonas"], ["💧", "Rio Tietê"], ["🌉", "Rio Tocantins"]], certa: 1 },
  { icone: "⛰️", texto: "Qual forma de relevo é a parte mais alta?", opcoes: [["🏞️", "Vale"], ["🌾", "Planície"], ["⛰️", "Montanha"], ["🕳️", "Depressão"]], certa: 2 },
  { icone: "🇧🇷", texto: "Quantas regiões tem o Brasil?", opcoes: [["3️⃣", "3"], ["4️⃣", "4"], ["5️⃣", "5"], ["6️⃣", "6"]], certa: 2 },
  { icone: "🌐", texto: "Qual linha imaginária divide a Terra em Norte e Sul?", opcoes: [["➖", "Linha do Equador"], ["↕️", "Meridiano de Greenwich"], ["🐐", "Trópico de Capricórnio"], ["🦀", "Trópico de Câncer"]], certa: 0 },
  { icone: "🌾", texto: "Qual bioma de campos fica no Sul do Brasil?", opcoes: [["🌾", "Pampa"], ["🌴", "Amazônia"], ["🐊", "Pantanal"], ["🌵", "Caatinga"]], certa: 0 }
];
const AVATARES = ["🦜", "🐯", "🐬", "🦊", "🐼", "🐸", "🦉", "🐙"];
const TEMPO_MAX = 15, PONTOS_ACERTO = 10, MAX_JOGADORES = 30;

/* ---------- ELEMENTOS ---------- */
const $ = (id) => document.getElementById(id);
const telas = { entrada: $("tela-entrada"), lobby: $("tela-lobby"), jogo: $("tela-jogo"), fim: $("tela-fim") };
function mostrarTela(n) { Object.values(telas).forEach((t) => t.classList.remove("ativa")); telas[n].classList.add("ativa"); telaAtual = n; }

/* ---------- ESTADO ---------- */
let db, salaRef, codigo, souHost = false, telaAtual = "entrada";
const meuId = "j" + Math.random().toString(36).slice(2, 9);
let avatar = AVATARES[0], sala = null;
let indice = 0, pontos = 0, acertos = 0, tempoRestante = 0, timer = null, respondida = false, jogoLocalIniciado = false;

/* ---------- ENTRADA ---------- */
function montarAvatares() {
  AVATARES.forEach((a, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "avatar" + (i === 0 ? " escolhido" : ""); b.textContent = a;
    b.setAttribute("aria-label", "Bichinho " + a);
    b.addEventListener("click", () => {
      avatar = a;
      document.querySelectorAll(".avatar").forEach((x) => x.classList.remove("escolhido"));
      b.classList.add("escolhido");
    });
    $("avatares").appendChild(b);
  });
}

function erroEntrada(msg) { $("erro-entrada").textContent = msg; }
function nomeValido() {
  const n = $("campo-nome").value.trim();
  if (!n) { erroEntrada("✏️ Escreva seu nome!"); return null; }
  return n;
}
function gerarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * letras.length)]).join("");
}
function travarBotoes(v) { $("btn-criar").disabled = v; $("btn-entrar").disabled = v; }

async function criarSala() {
  erroEntrada("");
  const nome = nomeValido(); if (!nome) return;
  travarBotoes(true);
  try {
    let cod, existe = true;
    while (existe) { cod = gerarCodigo(); existe = (await db.ref("salas/" + cod).once("value")).exists(); }
    codigo = cod; souHost = true;
    salaRef = db.ref("salas/" + codigo);
    await salaRef.set({ estado: "espera", host: meuId, criada: firebase.database.ServerValue.TIMESTAMP });
    await entrarNaSala(nome);
  } catch (e) { erroEntrada("😕 Sem conexão. Confira a configuração do Firebase."); console.error(e); }
  travarBotoes(false);
}

async function entrarSala() {
  erroEntrada("");
  const nome = nomeValido(); if (!nome) return;
  const cod = $("campo-codigo").value.trim().toUpperCase();
  if (cod.length !== 4) { erroEntrada("🔑 Digite o código de 4 letras!"); return; }
  travarBotoes(true);
  try {
    const snap = await db.ref("salas/" + cod).once("value");
    const dados = snap.val();
    if (!dados) erroEntrada("🤔 Sala não encontrada.");
    else if (dados.estado !== "espera") erroEntrada("🚫 Esse jogo já começou.");
    else if (Object.keys(dados.jogadores || {}).length >= MAX_JOGADORES) erroEntrada("👥 Sala cheia.");
    else { codigo = cod; souHost = false; salaRef = db.ref("salas/" + cod); await entrarNaSala(nome); }
  } catch (e) { erroEntrada("😕 Sem conexão. Confira a configuração do Firebase."); console.error(e); }
  travarBotoes(false);
}

async function entrarNaSala(nome) {
  const meuRef = salaRef.child("jogadores/" + meuId);
  await meuRef.set({ nome, avatar, pontos: 0, acertos: 0, feitas: 0, fim: false });
  meuRef.onDisconnect().remove(); // se sair no lobby, some da lista
  salaRef.on("value", (snap) => aoMudar(snap.val()));
  $("codigo-sala").textContent = codigo;
  mostrarTela("lobby");
}

/* ---------- SINCRONIZAÇÃO ---------- */
function listaOrdenada() {
  return Object.entries((sala && sala.jogadores) || {}).map(([id, j]) => ({ id, ...j }))
    .sort((a, b) => b.pontos - a.pontos || b.acertos - a.acertos || a.nome.localeCompare(b.nome));
}

function aoMudar(dados) {
  if (!dados) { alert("A sala foi encerrada."); location.reload(); return; }
  sala = dados;
  if (telaAtual === "lobby") {
    desenharLobby();
    if (sala.estado === "jogando") iniciarJogoLocal();
  } else if (telaAtual === "jogo") {
    desenharMiniRanking();
  } else if (telaAtual === "fim") {
    desenharPodio();
  }
}

function desenharLobby() {
  const ul = $("lista-jogadores"); ul.innerHTML = "";
  listaOrdenada().forEach((j) => {
    const li = document.createElement("li");
    li.textContent = j.avatar + " " + j.nome;
    if (j.id === meuId) li.className = "eu";
    ul.appendChild(li);
  });
  $("btn-comecar").style.display = souHost ? "inline-block" : "none";
  $("msg-espera").style.display = souHost ? "none" : "block";
}

function comecarPartida() { salaRef.child("estado").set("jogando"); }

/* ---------- JOGO ---------- */
function iniciarJogoLocal() {
  if (jogoLocalIniciado) return;
  jogoLocalIniciado = true;
  db.ref("salas/" + codigo + "/jogadores/" + meuId).onDisconnect().cancel();
  indice = 0; pontos = 0; acertos = 0;
  $("pontos").textContent = "0";
  mostrarTela("jogo");
  mostrarPergunta();
}

function embaralhar(l) {
  const a = [...l];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function mostrarPergunta() {
  respondida = false;
  const p = PERGUNTAS[indice];
  $("icone").textContent = p.icone;
  $("pergunta").textContent = p.texto;
  $("progresso").textContent = `${indice + 1}/${PERGUNTAS.length}`;
  $("feedback").textContent = ""; $("feedback").className = "feedback";
  const box = $("opcoes"); box.innerHTML = "";
  embaralhar(p.opcoes.map((o, i) => ({ o, certa: i === p.certa }))).forEach((x) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "opcao"; b.dataset.certa = x.certa;
    b.innerHTML = `<span class="emoji">${x.o[0]}</span><span>${x.o[1]}</span>`;
    box.appendChild(b);
  });
  desenharMiniRanking();
  clearInterval(timer);
  tempoRestante = TEMPO_MAX; atualizarBarra();
  timer = setInterval(() => {
    tempoRestante -= 0.1; atualizarBarra();
    if (tempoRestante <= 0) { clearInterval(timer); tratarResposta(null); }
  }, 100);
}

function atualizarBarra() {
  const pct = Math.max(tempoRestante, 0) / TEMPO_MAX, b = $("barra-tempo");
  b.style.transform = `scaleX(${pct})`;
  b.style.background = pct > 0.5 ? "#2ecc71" : pct > 0.25 ? "#ffd23f" : "#ff4d5e";
}

function tratarResposta(btn) {
  if (respondida) return;
  respondida = true; clearInterval(timer);
  const botoes = [...$("opcoes").querySelectorAll(".opcao")];
  botoes.forEach((b) => (b.disabled = true));
  const acertou = btn && btn.dataset.certa === "true";
  if (acertou) {
    pontos += PONTOS_ACERTO + Math.round((tempoRestante / TEMPO_MAX) * 5);
    acertos++;
    btn.classList.add("certa");
    $("feedback").textContent = "🎉 Muito bem!"; $("feedback").classList.add("ok");
  } else {
    if (btn) btn.classList.add("errada");
    botoes.find((b) => b.dataset.certa === "true").classList.add("certa");
    $("feedback").textContent = btn ? "😅 Quase! Veja a certa." : "⏰ Acabou o tempo!";
    $("feedback").classList.add("erro");
  }
  $("pontos").textContent = pontos;
  indice++;
  const terminou = indice >= PERGUNTAS.length;
  salaRef.child("jogadores/" + meuId).update({ pontos, acertos, feitas: indice, fim: terminou });
  setTimeout(() => (terminou ? mostrarFim() : mostrarPergunta()), 1400);
}

function desenharMiniRanking() {
  const ol = $("mini-ranking"); ol.innerHTML = "";
  const medalhas = ["🥇", "🥈", "🥉"];
  listaOrdenada().slice(0, 3).forEach((j, i) => {
    const li = document.createElement("li");
    li.textContent = `${medalhas[i]} ${j.avatar} ${j.pontos}`;
    if (j.id === meuId) li.className = "eu";
    ol.appendChild(li);
  });
}

/* ---------- FINAL ---------- */
function mostrarFim() { mostrarTela("fim"); desenharPodio(); }

function desenharPodio() {
  const lista = listaOrdenada();
  const podio = $("podio"); podio.innerHTML = "";
  const medalhas = ["🥇", "🥈", "🥉"];
  // ordem visual: 2º, 1º, 3º
  [1, 0, 2].forEach((pos) => {
    const j = lista[pos]; if (!j) return;
    const d = document.createElement("div");
    d.className = `degrau p${pos + 1}` + (j.id === meuId ? " eu" : "");
    const bicho = document.createElement("div"); bicho.className = "bicho"; bicho.textContent = j.avatar;
    const nome = document.createElement("div"); nome.className = "nome"; nome.textContent = j.nome;
    const pts = document.createElement("div"); pts.className = "pts"; pts.textContent = `⭐ ${j.pontos}`;
    const bloco = document.createElement("div"); bloco.className = "bloco"; bloco.textContent = medalhas[pos];
    d.append(bicho, nome, pts, bloco);
    podio.appendChild(d);
  });
  const resto = $("resto-ranking"); resto.innerHTML = "";
  lista.slice(3).forEach((j, i) => {
    const li = document.createElement("li");
    if (j.id === meuId) li.className = "eu";
    const a = document.createElement("span"); a.textContent = `${i + 4}º ${j.avatar} ${j.nome}`;
    const b = document.createElement("span"); b.textContent = `⭐ ${j.pontos}`;
    li.append(a, b); resto.appendChild(li);
  });
  const todosFim = lista.length > 0 && lista.every((j) => j.fim);
  $("fim-titulo").textContent = todosFim ? "🏆 Resultado final" : "🏆 Pódio ao vivo";
  $("fim-status").textContent = todosFim ? "🎉 Todo mundo terminou!" : "⏳ Esperando os outros...";
  $("btn-reiniciar").style.display = todosFim ? "inline-block" : "none";
}

/* ---------- INÍCIO ---------- */
function iniciarApp() {
  montarAvatares();
  try { firebase.initializeApp(FIREBASE_CONFIG); db = firebase.database(); }
  catch (e) { erroEntrada("⚠️ Configure o Firebase no script.js"); console.error(e); }
  $("btn-criar").addEventListener("click", criarSala);
  $("btn-entrar").addEventListener("click", entrarSala);
  $("btn-comecar").addEventListener("click", comecarPartida);
  $("btn-reiniciar").addEventListener("click", () => location.reload());
  $("opcoes").addEventListener("click", (e) => { const b = e.target.closest(".opcao"); if (b) tratarResposta(b); });
}
iniciarApp();