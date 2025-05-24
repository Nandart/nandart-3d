import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';
import { obrasSuspensas } from './data/obras-suspensas.js';

console.log('🎨 A iniciar a galeria 3D NANdART...');

// Validação das bibliotecas essenciais
if (!THREE || !gsap || !ethers) {
  const errorMsg = document.createElement('div');
  errorMsg.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: #111; color: #ff6b6b;
    display: flex; justify-content: center; align-items: center;
    font-family: Arial, sans-serif; text-align: center;
    z-index: 10000; padding: 20px;
  `;
  errorMsg.innerHTML = `
    <div>
      <h2>Erro crítico</h2>
      <p>Bibliotecas essenciais não foram carregadas.</p>
      <p>Verifica a ligação à internet e recarrega a página.</p>
    </div>
  `;
  document.body.appendChild(errorMsg);
  throw new Error('❌ Bibliotecas essenciais em falta');
}

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Variáveis globais principais
let config;
let obraDestacada = null;
let ambienteDesacelerado = false;
const obrasNormais = [];
const cubosSuspensos = [];
const relogio = new THREE.Clock();
let anguloAtual = 0;

let overlay, infoPanel;
const modalElements = {
  titulo: null,
  artista: null,
  ano: null,
  descricao: null,
  preco: null,
  botao: null
};

// Configurações responsivas detalhadas e ajustadas
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

config = configMap[getViewportLevel()];

let loadedResources = 0;
const totalResources = 10 + obrasSuspensas.length;

function updateLoadingProgress() {
  loadedResources++;
  if (loadedResources >= totalResources) {
    console.log('🖼️ Recursos carregados silenciosamente.');
  }
}

const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = updateLoadingProgress;
loadingManager.onError = url => console.warn(`⚠️ Falha ao carregar recurso: ${url}`);

const textureLoader = new THREE.TextureLoader(loadingManager);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true,
  powerPreference: 'high-performance',
  failIfMajorPerformanceCaveat: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 3.2;  // Iluminação duplicada para maior realismo
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Câmara com recuo 2x para visualização total do espaço
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY, config.cameraZ);
  camera.lookAt(0, 6.5, -config.wallDistance);
  camera.updateProjectionMatrix();
}
updateCamera();

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 200);
});

// Iluminação duplicada e ajustada
const ambientLight = new THREE.AmbientLight(0xffeedd, 1.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.4);
directionalLight.position.set(0, 16, 12);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);
const fillLeft = new THREE.DirectionalLight(0xffffff, 0.8);
fillLeft.position.set(-8, 8, 4);
scene.add(fillLeft);
const fillRight = new THREE.DirectionalLight(0xffffff, 0.8);
fillRight.position.set(8, 8, -4);
scene.add(fillRight);
const spotLight = new THREE.SpotLight(0xffeedd, 3, 30, Math.PI / 5, 0.4, 1);
spotLight.position.set(0, 20, 5);
scene.add(spotLight);
// ==================== CHÃO COM TRANSPARÊNCIA DUPLICADA ====================
const floorGeometry = new THREE.PlaneGeometry(80, 80);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000,
  metalness: 0.9,
  roughness: 0.05,
  transparent: true,
  opacity: 0.45  // Duplicar transparência
});
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -0.03;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// ==================== PAREDES COM TEXTURA ANTRAÇITE DO LAYOUT ====================
const paredeGeoFundo = new THREE.BoxGeometry(42, 29, 0.4);
const paredeGeoLateral = new THREE.BoxGeometry(30, 29, 0.4);
const paredeTexture = textureLoader.load('assets/IMG_2945.jpg');
const paredeMaterial = new THREE.MeshStandardMaterial({
  map: paredeTexture,
  roughness: 0.6,
  metalness: 0.2
});
const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial.clone());
paredeFundo.position.set(0, 14.6, -config.wallDistance);
scene.add(paredeFundo);
const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial.clone());
paredeEsquerda.position.set(-16.7, 14.5, -config.wallDistance / 2);
paredeEsquerda.rotation.y = Math.PI / 2;
scene.add(paredeEsquerda);
const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial.clone());
paredeDireita.position.set(16.7, 14.5, -config.wallDistance / 2);
paredeDireita.rotation.y = -Math.PI / 2;
scene.add(paredeDireita);

// ==================== FRISOS COM COR DOURADA DO LAYOUT ====================
const frisoTexture = textureLoader.load('assets/dourado para friso.png');
const frisoMaterial = new THREE.MeshStandardMaterial({
  map: frisoTexture,
  metalness: 0.9,
  roughness: 0.3
});
function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
  const friso = new THREE.Mesh(new THREE.BoxGeometry(largura, altura, 0.02), frisoMaterial);
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  scene.add(friso);
}
criarFrisoLinha(0, 1.6, -config.wallDistance + 0.1, 42);
criarFrisoLinha(0, 2.2, -config.wallDistance + 0.1, 42);
criarFrisoLinha(-16.7, 1.6, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
criarFrisoLinha(-16.7, 2.2, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
criarFrisoLinha(16.7, 1.6, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);
criarFrisoLinha(16.7, 2.2, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);

// ==================== CÍRCULO DE LUZ REDUZIDO EM 1/4 ====================
const circuloLuzGeometry = new THREE.RingGeometry(
  config.circleRadius + 0.6,
  config.circleRadius + 1.05, 64
);
const circuloLuzMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 1.5,
  roughness: 0.3,
  metalness: 0.1
});
const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.y = 0.005;
scene.add(circuloLuz);

// ==================== OBRAS CIRCULANTES COMPLETAS (8 OBRAS) ====================
const dadosObras = [
  { id: 'obra1', titulo: 'Obra 1', artista: 'Artista A', ano: '2024', descricao: 'Descrição da Obra 1.', preco: '0.5', imagem: 'assets/obras/obra1.jpg' },
  { id: 'obra2', titulo: 'Obra 2', artista: 'Artista B', ano: '2024', descricao: 'Descrição da Obra 2.', preco: '0.85', imagem: 'assets/obras/obra2.jpg' },
  { id: 'obra3', titulo: 'Obra 3', artista: 'Artista C', ano: '2024', descricao: 'Descrição da Obra 3.', preco: '0.6', imagem: 'assets/obras/obra3.jpg' },
  { id: 'obra4', titulo: 'Obra 4', artista: 'Artista D', ano: '2024', descricao: 'Descrição da Obra 4.', preco: '0.35', imagem: '/assets/obras/obra4.jpg' },
  { id: 'obra5', titulo: 'Obra 5', artista: 'Artista E', ano: '2024', descricao: 'Descrição da Obra 5.', preco: '0.45', imagem: 'assets/obras/obra5.jpg' },
  { id: 'obra6', titulo: 'Obra 6', artista: 'Artista F', ano: '2024', descricao: 'Descrição da Obra 6.', preco: '0.75', imagem: 'assets/obras/obra6.jpg' },
  { id: 'obra7', titulo: 'Obra 7', artista: 'Artista G', ano: '2024', descricao: 'Descrição da Obra 7.', preco: '0.6', imagem: 'assets/obras/obra7.jpg' },
  { id: 'obra8', titulo: 'Obra 8', artista: 'Artista H', ano: '2020', descricao: 'Descrição da Obra 8.', preco: '0.58', imagem: 'assets/obras/obra8.jpg' }
];
// ==================== PEDESTAIS, VITRINES E GEMAS FIEIS AO LAYOUT ====================
function criarPedestalVitrineGema(x, z) {
  const pedestalMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    metalness: 0.8,
    roughness: 0.2
  });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1, 32), pedestalMaterial);
  pedestal.position.set(x, 0.5, z);
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  scene.add(pedestal);

  const vitrineMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.1,
    transparent: true,
    opacity: 0.7
  });
  const vitrine = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 32), vitrineMaterial);
  vitrine.position.set(x, 1.6, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  const gemaMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc107,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0xffe066,
    emissiveIntensity: 1
  });
  const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), gemaMaterial);
  gema.position.set(x, 2.2, z);
  gema.castShadow = true;
  scene.add(gema);
}
// Posicionar os pedestais e vitrines como no layout
criarPedestalVitrineGema(-10, -3);
criarPedestalVitrineGema(10, -3);
criarPedestalVitrineGema(-10, 3);
criarPedestalVitrineGema(10, 3);

// ==================== OBRAS LATERAIS E CENTRAL – FUNÇÃO COMPLETA E CHAMADAS EXPLÍCITAS ====================
function criarObraParede(texturePath, posX, posY, posZ, rotY, largura, altura) {
  textureLoader.load(texturePath, (texture) => {
    const molduraGeo = new THREE.BoxGeometry(largura, altura, 0.3);  // Volume realista
    const molduraMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.6,
      roughness: 0.4
    });
    const moldura = new THREE.Mesh(molduraGeo, molduraMat);
    moldura.position.set(posX, posY, posZ);
    moldura.rotation.y = rotY;
    moldura.castShadow = true;
    scene.add(moldura);

    const obraGeo = new THREE.PlaneGeometry(largura * 0.9, altura * 0.9);
    const obraMat = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.3,
      roughness: 0.2
    });
    const obra = new THREE.Mesh(obraGeo, obraMat);
    obra.position.set(posX, posY, posZ + 0.16);  // Avanço à frente da moldura
    obra.rotation.y = rotY;
    obra.castShadow = true;
    scene.add(obra);
  });
}

// Chamada explícita das obras laterais e central (com caminhos reais e proporções duplicadas)
criarObraParede('assets/obra-central.jpg', 0, 14, -config.wallDistance + 0.2, 0, 7.2, 10.2);
criarObraParede('assets/obra-lateral-esquerda.jpg', -14, 14, -config.wallDistance / 2 + 0.2, Math.PI / 2, 5.2, 7.2);
criarObraParede('assets/obra-lateral-direita.jpg', 14, 14, -config.wallDistance / 2 + 0.2, -Math.PI / 2, 5.2, 7.2);
// ==================== DESFOQUE APENAS NO FUNDO ====================
function criarModal(dados) {
  overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(17,17,17,0.85);
    z-index: 950;
    backdrop-filter: blur(8px);
  `;

  infoPanel = document.createElement('div');
  infoPanel.style.cssText = `
    background: rgba(30,30,30,0.95);
    padding: 24px;
    border-radius: 12px;
    width: 400px;
    max-width: 90%;
    position: absolute;
    border: 1px solid #d4af37;
    z-index: 1000;
  `;
  infoPanel.innerHTML = `
    <h2>${dados.titulo}</h2>
    <p><strong>${dados.artista}</strong> (${dados.ano})</p>
    <p>${dados.descricao}</p>
    <p><strong>Price:</strong> ${dados.preco} ETH</p>
    <button id="buy-button">Buy</button>
  `;
  overlay.appendChild(infoPanel);
  document.body.appendChild(overlay);

  // Posicionamento preciso do modal abaixo da obra destacada
  const obraPos = obraDestacada.getWorldPosition(new THREE.Vector3());
  const screenPos = obraPos.clone().project(camera);
  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (screenPos.y * -0.5 + 0.5) * window.innerHeight;
  infoPanel.style.left = `${x - infoPanel.offsetWidth / 2}px`;
  infoPanel.style.top = `${y + 20}px`;

  overlay.addEventListener('click', e => {
    if (e.target === overlay) fecharObraDestacada();
  });
  document.getElementById('buy-button').addEventListener('click', comprarObra);
}

// ==================== BOTÃO CONNECT WALLET FUNCIONAL ====================
function criarBotoesInterface() {
  const walletBtn = document.createElement('button');
  walletBtn.id = 'wallet-button';
  walletBtn.textContent = 'Connect Wallet';
  walletBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 200;
    padding: 10px 20px;
    background: #d4af37;
    color: #111;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;
  document.body.appendChild(walletBtn);

  let provider, signer, connected = false;
  walletBtn.addEventListener('click', async () => {
    if (!connected) {
      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        walletBtn.textContent = 'Disconnect';
        connected = true;
      } else {
        alert('Please install MetaMask.');
      }
    } else {
      provider = null;
      signer = null;
      walletBtn.textContent = 'Connect Wallet';
      connected = false;
    }
  });
}

// ==================== BOTÃO BUY FUNCIONAL E REATIVO ====================
async function comprarObra() {
  if (!obraDestacada) return;
  const dados = obraDestacada.userData.dados;
  if (!window.ethereum) {
    alert('MetaMask is not installed!');
    return;
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const tx = {
    to: 'ENDERECO_DA_GALERIA',  // Substituir com o endereço real
    value: ethers.parseEther(dados.preco)
  };
  try {
    const txResponse = await signer.sendTransaction(tx);
    await txResponse.wait();
    alert('Purchase successful!');
  } catch (err) {
    alert('Transaction failed.');
  }
}

// ==================== MENU HORIZONTE ABRIR VERTICALMENTE ====================
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const menuDropdown = document.getElementById('menu-dropdown');
  menuToggle.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = menuDropdown.style.display === 'block';
    menuDropdown.style.display = isOpen ? 'none' : 'block';
    menuToggle.setAttribute('aria-expanded', !isOpen);
    // Orientação vertical ao abrir
    menuDropdown.style.flexDirection = 'column';
  });
  document.addEventListener('click', () => {
    menuDropdown.style.display = 'none';
    menuToggle.setAttribute('aria-expanded', 'false');
  });
  menuDropdown.addEventListener('click', e => e.stopPropagation());
});
// ==================== CICLO DE ANIMAÇÃO COMPLETO ====================
function animate() {
  requestAnimationFrame(animate);

  const delta = relogio.getDelta();
  anguloAtual += delta * 0.5;

  // Rodar obras circulantes (mantendo lógica original e completa)
  obrasNormais.forEach((mesh, index) => {
    const angle = anguloAtual + (index * (2 * Math.PI / dadosObras.length));
    mesh.position.x = Math.cos(angle) * config.circleRadius;
    mesh.position.z = Math.sin(angle) * config.circleRadius;
    mesh.rotation.y = -angle;
  });

  // Suspensão e animação dos cubos (caso existam)
  cubosSuspensos.forEach(cubo => {
    cubo.rotation.y += delta * 0.4;
  });

  // Suavização do ambiente caso haja obra destacada
  if (ambienteDesacelerado) {
    obrasNormais.forEach(mesh => {
      mesh.rotation.y += delta * 0.05;
    });
  }

  renderer.render(scene, camera);
}

// ==================== INICIALIZAÇÃO FINAL ====================
function inicializarGaleria() {
  // Criar obras circulantes com visibilidade total (com base nos dados)
  dadosObras.forEach((dados, index) => {
    textureLoader.load(dados.imagem, (texture) => {
      const obraGeo = new THREE.PlaneGeometry(config.obraSize, config.obraSize);
      const obraMat = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,  // Visibilidade total mesmo de costas
        roughness: 0.3,
        metalness: 0.2
      });
      const obraMesh = new THREE.Mesh(obraGeo, obraMat);
      obraMesh.userData.dados = dados;
      obraMesh.castShadow = true;
      obraMesh.receiveShadow = true;
      scene.add(obraMesh);
      obrasNormais.push(obraMesh);

      // Interação por clique (mantendo lógica original sem alterações)
      obraMesh.callback = () => destacarObra(obraMesh);
    });
  });

  // Criar botões da interface e associar eventos
  criarBotoesInterface();

  // Começar a animação
  animate();
}

inicializarGaleria();
