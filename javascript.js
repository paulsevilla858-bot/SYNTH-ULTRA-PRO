// 1. IMPORTACIÓN DE MÓDULOS DE FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. TUS CREDENCIALES (Copia y pega las tuyas aquí)
const firebaseConfig = {
  apiKey: "AIzaSyBeqUMGvXvAmOcJ2y02fIQiwgB4BZyj4BE",
  authDomain: "synth-ultra-pro.firebaseapp.com",
  projectId: "synth-ultra-pro",
  storageBucket: "synth-ultra-pro.firebasestorage.app",
  messagingSenderId: "425473070473",
  appId: "1:425473070473:web:b62473a9a7241d50cb3d58",
  measurementId: "G-EMD9Q35NPV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 4. LÓGICA DE LA INTERFAZ DE LOGIN/REGISTRO
let isLogin = false;
const btnAuth = document.getElementById('btn-auth-action');
const btnToggle = document.getElementById('btn-toggle');
const statusText = document.getElementById('auth-status');

// Cambiar entre modo Registro y modo Login
btnToggle.onclick = () => {
    isLogin = !isLogin;
    document.getElementById('auth-title').innerText = isLogin ? "Pilot Login" : "Pilot Registration";
    btnAuth.innerText = isLogin ? "ACCESS SYSTEM" : "INITIALIZE SYSTEM";
    document.getElementById('reg-name').style.display = isLogin ? "none" : "block";
    btnToggle.innerText = isLogin ? "NEED AN ACCOUNT? REGISTER" : "ALREADY REGISTERED? LOGIN";
};

// Ejecutar la acción al hacer clic en el botón principal
btnAuth.onclick = async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const name = document.getElementById('reg-name').value;

    if (!email || !pass) {
        statusText.innerText = "ERROR: EMAIL AND KEY REQUIRED";
        return;
    }

    try {
        let userCred;
        if(isLogin) {
            statusText.innerText = "VERIFYING DATA...";
            userCred = await signInWithEmailAndPassword(auth, email, pass);
        } else {
            statusText.innerText = "CREATING PILOT...";
            userCred = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(userCred.user, { displayName: name });
        }
        
        // Mostrar nombre en el sintetizador y entrar
        document.getElementById('pilot-display').innerText = "PILOT: " + (userCred.user.displayName || "GUEST").toUpperCase();
        startSynth();
    } catch (e) {
        // Traducir errores comunes
        if (e.code === 'auth/wrong-password') statusText.innerText = "INVALID SECURITY KEY";
        else if (e.code === 'auth/user-not-found') statusText.innerText = "PILOT NOT FOUND";
        else statusText.innerText = "SYSTEM ERROR: " + e.code;
    }
};

function startSynth() {
    Synth.audio.init();
    document.getElementById('intro-screen').classList.add('hide');
    document.getElementById('main-ui').classList.add('show');
}

// 5. MOTOR DEL SINTETIZADOR (OBJETO GLOBAL)
const Synth = {
    audio: {}, 
    state: { voices: new Map(), pressedKeys: new Set() }
};

Synth.audio.init = () => {
    if (Synth.audio.ctx) return;
    const A = Synth.audio;
    A.ctx = new (window.AudioContext || window.webkitAudioContext)();
    A.master = A.ctx.createGain();
    A.master.gain.value = 0.2;
    
    A.an = A.ctx.createAnalyser();
    A.master.connect(A.an).connect(A.ctx.destination);
    
    // Iniciar dibujo de ondas
    draw();
};

// Funciones de reproducción de notas
function play(note) {
    if (!Synth.audio.ctx) return;
    const f = note.f * Math.pow(2, document.getElementById('k-oct').dataset.val - 3);
    document.getElementById('tel-freq').innerText = f.toFixed(1) + " Hz";
    
    const g = Synth.audio.ctx.createGain();
    g.gain.setValueAtTime(0, Synth.audio.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.5, Synth.audio.ctx.currentTime + 0.05);
    
    const o = Synth.audio.ctx.createOscillator();
    o.frequency.value = f;
    o.type = 'sawtooth';
    
    o.connect(g).connect(Synth.audio.master);
    o.start();
    
    Synth.state.voices.set(note.k, { osc: o, gain: g });
    document.getElementById('key-' + note.k)?.classList.add('active');
}

function stop(note) {
    const v = Synth.state.voices.get(note.k);
    if (v) {
        v.gain.gain.setTargetAtTime(0, Synth.audio.ctx.currentTime, 0.05);
        setTimeout(() => { v.osc.stop(); v.osc.disconnect(); }, 100);
        Synth.state.voices.delete(note.k);
        document.getElementById('key-' + note.k)?.classList.remove('active');
    }
}

// Visualización en Canvas
function draw() {
    requestAnimationFrame(draw);
    const canvas = document.getElementById('osc');
    const ctx = canvas.getContext('2d');
    if (!Synth.audio.an) return;
    
    const data = new Uint8Array(256);
    Synth.audio.an.getByteTimeDomainData(data);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00ffcc';
    ctx.beginPath();
    data.forEach((v, i) => {
        const x = (i / data.length) * canvas.width;
        const y = (v / 255) * canvas.height;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
}

// Configuración de teclas y teclado visual (idéntico a tu lógica anterior)
// ... (Aquí iría la lógica de las notas y eventos de teclado que ya tienes)