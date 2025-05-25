// ==================== BLOCO 1 — IMPORTAÇÕES E CONFIGURAÇÃO ==================== 
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';


console.log('🎨 Initialising NANdART 3D Gallery...');

if (!THREE || !gsap || !ethers) {
  const errorMsg = document.createElement('div');
  errorMsg.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: #111; color: #ff6b6b; display: flex; justify-content: center; align-items: center;
    font-family: Arial, sans-serif; text-align: center; z-index: 10000; padding: 20px;
  `;
  errorMsg.innerHTML = `
    <div>
      <h2>Critical Error</h2>
      <p>Essential libraries failed to load.</p>
      <p>Please check your connection and reload.</p>
    </div>
  `;
  document.body.appendChild(errorMsg);
  throw new Error('❌ Essential libraries missing');
}

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

let config;
let obraDestacada = null;
let ambienteDesacelerado = false;
const obrasNormais = [];
const cubosSuspensos = [];
const relogio = new THREE.Clock();
let anguloAtual = 0;
let provider, signer, walletAddress, walletBalance;
let overlay, infoPanel;

// ==================== CONFIGURAÇÃO RESPONSIVA ====================
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

const loadingManager = new THREE.LoadingManager();
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
renderer.toneMappingExposure = 3.6;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY, config.cameraZ);
  camera.lookAt(0, 6.5, -config.wallDistance);
  camera.updateProjectionMatrix();
}
updateCamera();

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== ILUMINAÇÃO ====================
const ambientLight = new THREE.AmbientLight(0xffe4b5, 2.0);
scene.add(ambientLight);

const fillLeft = new THREE.DirectionalLight(0xffe4b5, 0.8);
fillLeft.position.set(-8, 8, 4);
scene.add(fillLeft);

const fillRight = new THREE.DirectionalLight(0xffe4b5, 0.8);
fillRight.position.set(8, 8, -4);
scene.add(fillRight);

const ceilingLight = new THREE.PointLight(0xffe4b5, 1.8, 100);
ceilingLight.position.set(0, 30, 0);
scene.add(ceilingLight);

// ==================== PAREDES COM TEXTURA ANTRACITE ====================
const paredeGeoFundo = new THREE.BoxGeometry(42, 29, 0.4);
const paredeGeoLateral = new THREE.BoxGeometry(45, 29, 0.4);

let antraciteTexture;
try {
  antraciteTexture = textureLoader.load('/assets/galeria1.bmp', (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  });
} catch (error) {
  console.warn('Texture load failed, using fallback.');
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.fillStyle = '#222222';
  context.fillRect(0, 0, size, size);
  antraciteTexture = new THREE.CanvasTexture(canvas);
}

const paredeMaterial = new THREE.MeshStandardMaterial({
  map: antraciteTexture,
  roughness: 0.8,
  metalness: 0.4
});

const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial.clone());
paredeFundo.position.set(0, 14.6, -config.wallDistance);
scene.add(paredeFundo);

const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial.clone());
paredeEsquerda.position.set(-22, 14.5, -config.wallDistance / 2);
paredeEsquerda.rotation.y = Math.PI / 2;
scene.add(paredeEsquerda);

const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial.clone());
paredeDireita.position.set(22, 14.5, -config.wallDistance / 2);
paredeDireita.rotation.y = -Math.PI / 2;
scene.add(paredeDireita);

// ==================== CHÃO ESPELHO ====================
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000,
  metalness: 1.0,
  roughness: 0.0,
  transparent: true,
  opacity: 0.3
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.03;
floor.receiveShadow = true;
scene.add(floor);

// ==================== CÍRCULO DE LUZ CENTRAL ====================
const circuloLuzGeometry = new THREE.RingGeometry(config.circleRadius + 0.4, config.circleRadius + 0.8, 64);
const circuloLuzMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 1.8,
  roughness: 0.3,
  metalness: 0.1,
  transparent: true,
  opacity: 0.6
});
const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.y = 0.005;
scene.add(circuloLuz);

// ==================== CRIAÇÃO DE OBRAS CIRCULANTES ====================

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

function criarObrasCirculares() {
  dadosObras.forEach((dados, index) => {
    textureLoader.load(dados.imagem, (texture) => {
      const obraMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.2,
        metalness: 0.1
      });
      const tamanho = config.obraSize;
      const obraGeo = new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6);
      const obraMesh = new THREE.Mesh(obraGeo, obraMaterial);
      obraMesh.castShadow = true;
      obraMesh.receiveShadow = true;

      const grupo = new THREE.Group();
      grupo.add(obraMesh);

      const angulo = (index / dadosObras.length) * Math.PI * 2;
      grupo.position.set(Math.cos(angulo) * config.circleRadius, 4.2, Math.sin(angulo) * config.circleRadius);
      grupo.lookAt(0, 4.2, 0);

      grupo.userData = { dados, index, isObra: true };
      scene.add(grupo);
      obrasNormais.push(grupo);
    }, undefined, (err) => {
      console.error('Error loading artwork texture:', err);
    });
  });
}

// ==================== CRIAÇÃO DE OBRAS NAS PAREDES ====================
function criarObraParede(texturePath, posX, posY, posZ, rotY, largura, altura) {
  textureLoader.load(texturePath, (texture) => {
    const molduraGeo = new THREE.BoxGeometry(largura, altura, 0.3);
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
    obra.position.set(posX, posY, posZ + 0.16);
    obra.rotation.y = rotY;
    obra.castShadow = true;
    scene.add(obra);
  }, undefined, (err) => {
    console.error('Error loading wall artwork texture:', err);
  });
}

// Obras nas paredes
criarObraParede('/assets/obras/obra-central.jpg', 0, 14, -config.wallDistance + 0.2, 0, 7.2, 10.2);
criarObraParede('/assets/obras/obra-lateral-esquerda.jpg', -22, 14, -config.wallDistance / 2 + 0.2, Math.PI / 2, 5.2, 7.2);
criarObraParede('/assets/obras/obra-lateral-direita.jpg', 22, 14, -config.wallDistance / 2 + 0.2, -Math.PI / 2, 5.2, 7.2);

// ==================== INTERAÇÃO COM O MENU ====================
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const menuDropdown = document.getElementById('menu-dropdown');
  
  if (menuToggle && menuDropdown) {
    menuToggle.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = menuDropdown.style.display === 'block';
      menuDropdown.style.display = isOpen ? 'none' : 'block';
      menuDropdown.style.flexDirection = 'column';
      menuDropdown.style.background = 'rgba(0, 0, 0, 0.05)';
      menuToggle.setAttribute('aria-expanded', !isOpen);
    });
    
    document.addEventListener('click', () => {
      menuDropdown.style.display = 'none';
      menuToggle.setAttribute('aria-expanded', 'false');
    });
    
    menuDropdown.addEventListener('click', e => e.stopPropagation());
  }

  const infoButton = document.getElementById('info-button');
  if (infoButton) {
    infoButton.addEventListener('click', () => {
      window.location.href = 'about.html';
    });
  }
});

// ==================== DESTACAR OBRA ====================
function destacarObra(obra) {
  if (obraDestacada) return;
  obraDestacada = obra;
  ambienteDesacelerado = true;

  const dados = obra.userData.dados;
  const originalScale = obra.scale.clone();

  gsap.to(obra.position, {
    x: 0, y: 6.5 * 1.5, z: 0,
    duration: 1.1, ease: 'power2.inOut',
    onUpdate: () => obra.lookAt(camera.position)
  });
  gsap.to(obra.scale, {
    x: originalScale.x * 2, y: originalScale.y * 2, z: originalScale.z * 2,
    duration: 0.9, ease: 'power2.out'
  });

  scene.traverse(obj => {
    if (obj.isMesh && obj !== obra.children[0] && !obj.parent?.userData?.isObra) {
      obj.material.transparent = true;
      obj.material.opacity = 0.5;
    }
  });

  criarModal(dados, originalScale.x * 2 * 200);
}

function criarModal(dados, larguraModal) {
  if (overlay && document.body.contains(overlay)) {
    document.body.removeChild(overlay);
  }

  overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 100; display: flex; justify-content: center; align-items: flex-start;
    pointer-events: none; background: rgba(0,0,0,0.1); backdrop-filter: blur(6px);
  `;

  infoPanel = document.createElement('div');
  infoPanel.style.cssText = `
    background: rgba(30,30,30,0.8); padding: 24px; border-radius: 12px;
    width: ${larguraModal}px; max-width: 90%; margin-top: 20px;
    pointer-events: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  `;
  infoPanel.innerHTML = `
    <h2>${dados.titulo}</h2>
    <p><strong>${dados.artista}</strong> (${dados.ano})</p>
    <p>${dados.descricao}</p>
    <p><strong>Price:</strong> ${dados.preco} ETH</p>
    <button id="buy-button" style="background:#d4af37;color:#111;font-weight:bold;">Buy</button>
  `;
  overlay.appendChild(infoPanel);
  document.body.appendChild(overlay);

  const obraPos = obraDestacada.getWorldPosition(new THREE.Vector3());
  const screenPos = obraPos.clone().project(camera);
  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (screenPos.y * -0.5 + 0.5) * window.innerHeight;
  infoPanel.style.left = `${x - infoPanel.offsetWidth / 2}px`;
  infoPanel.style.top = `${y + 10}px`;

  document.getElementById('buy-button').addEventListener('click', comprarObra);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) fecharObraDestacada();
  });
}

// ==================== BOTÃO CONNECT WALLET ====================
function criarBotoesInterface() {
  const existingBtn = document.getElementById('wallet-button');
  if (existingBtn) existingBtn.remove();

  const walletBtn = document.createElement('button');
  walletBtn.id = 'wallet-button';
  walletBtn.textContent = 'Connect Wallet';
  walletBtn.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 200;
    padding: 10px 20px; background: #d4af37; color: #111; font-weight: bold;
    border: none; border-radius: 4px; cursor: pointer;
  `;
  document.body.appendChild(walletBtn);

  walletBtn.addEventListener('click', async () => {
    if (!walletAddress) {
      if (window.ethereum) {
        try {
          provider = new ethers.BrowserProvider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
          signer = await provider.getSigner();
          walletAddress = await signer.getAddress();
          walletBalance = await provider.getBalance(walletAddress);
          walletBtn.textContent = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} | ${ethers.formatEther(walletBalance).slice(0, 6)} ETH`;
          walletBtn.onclick = () => {
            walletAddress = null;
            walletBtn.textContent = 'Connect Wallet';
            signer = null;
          };
        } catch (err) {
          console.error('Wallet connection error:', err);
          alert('Error connecting wallet');
        }
      } else {
        alert('Please install MetaMask!');
      }
    } else {
      walletAddress = null;
      signer = null;
      walletBtn.textContent = 'Connect Wallet';
    }
  });
}

// ==================== ANIMAÇÃO ====================
function animate() {
  requestAnimationFrame(animate);
  const delta = relogio.getDelta();
  const speedFactor = ambienteDesacelerado ? 0.5 : 1;
  anguloAtual += 0.25 * delta * speedFactor;

  const raio = config.circleRadius;
  obrasNormais.forEach((grupo, i) => {
    if (grupo === obraDestacada) return;
    const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
    grupo.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
    grupo.lookAt(0, 4.2, 0);
  });

  renderer.render(scene, camera);
}

// ==================== FECHAR OBRA DESTACADA ====================
function fecharObraDestacada() {
  if (!obraDestacada) return;
  
  scene.traverse(obj => {
    if (obj.isMesh && obj.material && obj.material.opacity < 1) {
      obj.material.transparent = false;
      obj.material.opacity = 1;
    }
  });

  gsap.to(obraDestacada.position, {
    x: Math.cos((obraDestacada.userData.index / obrasNormais.length) * Math.PI * 2 + anguloAtual) * config.circleRadius,
    y: 4.2,
    z: Math.sin((obraDestacada.userData.index / obrasNormais.length) * Math.PI * 2 + anguloAtual) * config.circleRadius,
    duration: 1,
    ease: 'power2.inOut',
    onUpdate: () => obraDestacada.lookAt(0, 4.2, 0)
  });
  
  gsap.to(obraDestacada.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'power2.out' });
  
  obraDestacada = null;
  ambienteDesacelerado = false;

  if (overlay && document.body.contains(overlay)) {
    document.body.removeChild(overlay);
  }
}

// ==================== COMPRA DE OBRA ====================
async function comprarObra() {
  if (!obraDestacada || !window.ethereum) {
    alert('Please connect MetaMask.');
    return;
  }
  
  const dados = obraDestacada.userData.dados;
  const tx = { to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41', value: ethers.parseEther(dados.preco) };
  
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const txResponse = await signer.sendTransaction(tx);
    await txResponse.wait();
    alert('Purchase successful!');
  } catch (err) {
    console.error('Transaction error:', err);
    alert('Transaction failed.');
  }
}
// ==================== INICIALIZAÇÃO ====================
function iniciarGaleria() {
  criarObrasCirculares();
  criarBotoesInterface();
  animate();
}

window.addEventListener('load', iniciarGaleria);
