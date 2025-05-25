// ==================== BLOCO 1 — IMPORTAÇÕES E CONFIGURAÇÕES INICIAIS ====================
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import gsap from 'gsap';
import { ethers } from 'ethers';

console.log('🎨 Initializing NANdART 3D Gallery...');

// Verificação de dependências críticas
if (!THREE || !gsap || !ethers) {
    showCriticalError("Essential libraries failed to load. Please check your connection and reload.");
    throw new Error('❌ Essential libraries missing');
}

// Configurações responsivas
const configMap = {
    XS: { obraSize: 1.2, circleRadius: 2.4, wallDistance: 8, cameraZ: 44, cameraY: 10, textSize: 0.4 },
    SM: { obraSize: 1.4, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 48, cameraY: 10.5, textSize: 0.45 },
    MD: { obraSize: 1.6, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 52, cameraY: 11, textSize: 0.5 },
    LG: { obraSize: 1.8, circleRadius: 3.6, wallDistance: 11, cameraZ: 56, cameraY: 11.5, textSize: 0.55 }
};

function getViewportLevel() {
    const width = window.innerWidth;
    if (width < 480) return 'XS';
    if (width < 768) return 'SM';
    if (width < 1024) return 'MD';
    return 'LG';
}

const config = configMap[getViewportLevel()];

// Dados das obras
const dadosObras = [
    { id: 'obra1', titulo: 'Obra 1', artista: 'Artista A', ano: '2024', descricao: 'Descrição da Obra 1.', preco: '0.5', imagem: 'assets/obras/obra1.jpg' },
    { id: 'obra2', titulo: 'Obra 2', artista: 'Artista B', ano: '2024', descricao: 'Descrição da Obra 2.', preco: '0.85', imagem: 'assets/obras/obra2.jpg' },
    { id: 'obra3', titulo: 'Obra 3', artista: 'Artista C', ano: '2024', descricao: 'Descrição da Obra 3.', preco: '0.6', imagem: 'assets/obras/obra3.jpg' },
    { id: 'obra4', titulo: 'Obra 4', artista: 'Artista D', ano: '2024', descricao: 'Descrição da Obra 4.', preco: '0.35', imagem: 'assets/obras/obra4.jpg' },
    { id: 'obra5', titulo: 'Obra 5', artista: 'Artista E', ano: '2024', descricao: 'Descrição da Obra 5.', preco: '0.45', imagem: 'assets/obras/obra5.jpg' },
    { id: 'obra6', titulo: 'Obra 6', artista: 'Artista F', ano: '2024', descricao: 'Descrição da Obra 6.', preco: '0.75', imagem: 'assets/obras/obra6.jpg' },
    { id: 'obra7', titulo: 'Obra 7', artista: 'Artista G', ano: '2024', descricao: 'Descrição da Obra 7.', preco: '0.6', imagem: 'assets/obras/obra7.jpg' },
    { id: 'obra8', titulo: 'Obra 8', artista: 'Artista H', ano: '2020', descricao: 'Descrição da Obra 8.', preco: '0.58', imagem: 'assets/obras/obra8.jpg' }
];

// Variáveis globais
let obraDestacada = null;
const obrasNormais = [];
const relogio = new THREE.Clock();
let anguloAtual = 0;
let provider, signer, walletAddress, walletBalance;
let overlay, infoPanel;

// ==================== BLOCO 2 — INICIALIZAÇÃO DA CENA ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Renderer com configurações otimizadas
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('scene'),
    antialias: true,
    powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 3.5;

// Câmera com ajuste responsivo
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 200);
function updateCamera() {
    camera.position.set(0, config.cameraY, config.cameraZ * 2);
    camera.lookAt(0, 6.5, -config.wallDistance);
    camera.updateProjectionMatrix();
}
updateCamera();

// Gerenciamento de redimensionamento
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== BLOCO 3 — CARREGAMENTO DE TEXTURAS E RECURSOS ====================
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);

// Fallback para textura antracite
let antraciteTexture;
try {
    antraciteTexture = textureLoader.load('assets/textures/antracite.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 4);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    });
} catch (error) {
    console.warn('Using fallback texture');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, 128, 128);
    antraciteTexture = new THREE.CanvasTexture(canvas);
}

// ==================== BLOCO 4 — CONSTRUÇÃO DO AMBIENTE 3D ====================
// Materiais
const paredeMaterial = new THREE.MeshStandardMaterial({
    map: antraciteTexture,
    color: 0x222222,
    roughness: 0.8,
    metalness: 0.4,
    emissive: 0x444444,
    emissiveIntensity: 0.5
});

// Geometrias
const paredeGeoFundo = new THREE.BoxGeometry(84, 29, 0.4);
const paredeGeoLateral = new THREE.BoxGeometry(60, 29, 0.4);

// Paredes
const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial.clone());
paredeFundo.position.set(0, 14.6, -config.wallDistance);
scene.add(paredeFundo);

const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial.clone());
paredeEsquerda.position.set(-42, 14.5, 0);
paredeEsquerda.rotation.y = Math.PI / 2;
scene.add(paredeEsquerda);

const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial.clone());
paredeDireita.position.set(42, 14.5, 0);
paredeDireita.rotation.y = -Math.PI / 2;
scene.add(paredeDireita);

// Chão reflexivo
const floorReflector = new Reflector(new THREE.PlaneGeometry(100, 100), {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0x111111
});
floorReflector.rotation.x = -Math.PI / 2;
floorReflector.position.y = -0.05;
scene.add(floorReflector);

// Iluminação
const ambientLight = new THREE.AmbientLight(0xffeedd, 1.0);
scene.add(ambientLight);

const light1 = new THREE.PointLight(0xffeedd, 0.8, 100);
light1.position.set(0, 20, 0);
scene.add(light1);

// ==================== BLOCO 5 — CRIAÇÃO DAS OBRAS DE ARTE ====================
function criarObrasCirculares() {
    const tamanho = config.obraSize;
    const raio = config.circleRadius;

    dadosObras.forEach((dados, index) => {
        textureLoader.load(dados.imagem, (texture) => {
            const obraMaterial = new THREE.MeshStandardMaterial({
                map: texture,
                side: THREE.DoubleSide,
                roughness: 0.2,
                metalness: 0.1
            });
            
            const obra = new THREE.Mesh(
                new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
                obraMaterial
            );
            obra.castShadow = true;

            const grupo = new THREE.Group();
            grupo.add(obra);

            const angulo = (index / dadosObras.length) * Math.PI * 2;
            grupo.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
            grupo.lookAt(0, 4.2, 0);

            grupo.userData = { dados, index, isObra: true };
            scene.add(grupo);
            obrasNormais.push(grupo);
        }, undefined, (err) => {
            console.error('Error loading artwork:', err);
        });
    });
}

// ==================== BLOCO 6 — INTERAÇÕES E CONTROLES ====================
// Conexão com carteira
async function connectWallet() {
    try {
        if (window.ethereum) {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            walletAddress = await signer.getAddress();
            walletBalance = await provider.getBalance(walletAddress);

            const walletBtn = document.getElementById('wallet-button');
            if (walletBtn) {
                walletBtn.textContent = `${walletAddress.slice(0, 6)}... | ${ethers.formatEther(walletBalance).slice(0, 6)} ETH`;
                walletBtn.onclick = disconnectWallet;
            }
            return true;
        } else {
            alert('Please install MetaMask!');
            return false;
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        alert(`Connection error: ${error.message}`);
        return false;
    }
}

function disconnectWallet() {
    walletAddress = null;
    walletBalance = null;
    provider = null;
    signer = null;

    const walletBtn = document.getElementById('wallet-button');
    if (walletBtn) {
        walletBtn.textContent = 'Connect Wallet';
        walletBtn.onclick = connectWallet;
    }
}

// Criação do botão de carteira
function criarBotoesInterface() {
    const walletBtn = document.createElement('button');
    walletBtn.id = 'wallet-button';
    walletBtn.textContent = 'Connect Wallet';
    walletBtn.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 200;
        padding: 10px 20px; background: #FFD700; color: #111;
        border: none; border-radius: 4px; cursor: pointer;
        font-weight: bold; transition: all 0.3s;
    `;
    walletBtn.addEventListener('click', connectWallet);
    document.body.appendChild(walletBtn);
}

// ==================== BLOCO 7 — ANIMAÇÃO E INICIALIZAÇÃO ====================
function animate() {
    requestAnimationFrame(animate);
    const delta = relogio.getDelta();
    const speedFactor = obraDestacada ? 0.5 : 1;
    anguloAtual += 0.25 * delta * speedFactor;

    const raio = config.circleRadius;
    obrasNormais.forEach((obra, i) => {
        if (obra !== obraDestacada) {
            const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
            obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
            obra.lookAt(0, 4.2, 0);
        }
    });

    renderer.render(scene, camera);
}

function iniciarGaleria() {
    criarObrasCirculares();
    criarBotoesInterface();
    animate();
}

// ==================== BLOCO 8 — UTILITÁRIOS E MANIPULAÇÃO DE ERROS ====================
function showCriticalError(message) {
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: #111; color: #ff6b6b; display: flex;
        justify-content: center; align-items: center; z-index: 10000;
        padding: 20px; font-family: Arial, sans-serif; text-align: center;
    `;
    errorMsg.innerHTML = `
        <div>
            <h2>Critical Error</h2>
            <p>${message}</p>
            <button onclick="window.location.reload()" style="
                margin-top: 15px; padding: 10px 20px;
                background: #ff6b6b; color: white;
                border: none; border-radius: 4px; cursor: pointer;
            ">Reload Page</button>
        </div>
    `;
    document.body.appendChild(errorMsg);
}

// Inicialização final
window.addEventListener('load', () => {
    try {
        iniciarGaleria();
    } catch (error) {
        console.error('Initialization error:', error);
        showCriticalError('Failed to initialize gallery. Please try again later.');
    }
});

// Verificação de WebGL
if (!(function() {
    try {
        const canvas = document.createElement('canvas');
        return !!window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch(e) {
        return false;
    }
})()) {
    showCriticalError('WebGL is not supported in your browser. Please try with Chrome, Firefox or Edge.');
}
