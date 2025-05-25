// ==================== BLOCO 1 — IMPORTAÇÕES E VARIÁVEIS GLOBAIS ====================
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

// Variáveis globais
let config;
let obraDestacada = null;
let ambienteDesacelerado = false;
const obrasNormais = [];
const cubosSuspensos = [];
const relogio = new THREE.Clock();
let anguloAtual = 0;

// Elementos do DOM
const overlay = document.getElementById('overlay');
const infoPanel = document.getElementById('info-panel');
const modalElements = {
  titulo: document.getElementById('obra-titulo'),
  artista: document.getElementById('obra-artista'),
  ano: document.getElementById('obra-ano'),
  descricao: document.getElementById('obra-descricao'),
  preco: document.getElementById('obra-preco'),
  botao: document.getElementById('obra-buy')
};

// ==================== BLOCO 2 — CONFIGURAÇÕES E RENDERER ====================
const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 22, cameraY: 7.2, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 24, cameraY: 7.6, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 26, cameraY: 8.1, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 28, cameraY: 8.4, textSize: 0.55 }
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
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.8;
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

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 200);
});

// ==================== BLOCO 3 — ILUMINAÇÃO ====================
const ambientLight = new THREE.AmbientLight(0xfff4e6, 2.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
directionalLight.position.set(0, 16, 12);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const fillLeft = new THREE.DirectionalLight(0xffffff, 1.0);
fillLeft.position.set(-8, 8, 4);
fillLeft.castShadow = true;
scene.add(fillLeft);

const fillRight = new THREE.DirectionalLight(0xffffff, 1.0);
fillRight.position.set(8, 8, -4);
fillRight.castShadow = true;
scene.add(fillRight);

const spotLight = new THREE.SpotLight(0xffffff, 1.4, 30, Math.PI / 5, 0.4, 1);
spotLight.position.set(0, 20, 5);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// ==================== BLOCO 4 — CHÃO E PAREDES ====================
const floorGeometry = new THREE.PlaneGeometry(80, 80);
const floorMirror = new Reflector(floorGeometry, {
  clipBias: 0.003,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x111111
});
floorMirror.rotation.x = -Math.PI / 2;
floorMirror.position.y = -0.03;
floorMirror.receiveShadow = true;
scene.add(floorMirror);

// Textura das paredes
const wallGeometryBack = new THREE.PlaneGeometry(42, 32);
const wallGeometrySide = new THREE.PlaneGeometry(34, 30);

// Criar textura fallback programática
const createFallbackTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#1a1a1a');
  gradient.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Adicionar algum ruído para textura
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.02})`;
    ctx.fillRect(
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 3,
      Math.random() * 3
    );
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

const wallMaterial = new THREE.MeshStandardMaterial({
  map: createFallbackTexture(),
  color: 0x1a1a1a,
  emissive: 0x333333,
  emissiveIntensity: 0.15,
  roughness: 0.58,
  metalness: 0.18
});

// Carregar textura real
textureLoader.load('assets/antracite-realista.jpg', (texture) => {
  wallMaterial.map = texture;
  wallMaterial.needsUpdate = true;
});

// Parede de fundo
const backWall = new THREE.Mesh(wallGeometryBack, wallMaterial);
backWall.position.set(0, 14.6, -config.wallDistance - 5.2);
backWall.receiveShadow = true;
scene.add(backWall);

// Parede lateral esquerda
const leftWall = new THREE.Mesh(wallGeometrySide, wallMaterial);
leftWall.position.set(-16.7, 14.5, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
scene.add(leftWall);

// Parede lateral direita
const rightWall = new THREE.Mesh(wallGeometrySide, wallMaterial);
rightWall.position.set(16.7, 14.5, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
scene.add(rightWall);

// ==================== BLOCO 5 — QUADRO CENTRAL ====================
const quadroCentralGrupo = new THREE.Group();

const larguraQuadro = 4.6;
const alturaQuadro = 5.8;

const molduraCentral = new THREE.Mesh(
  new THREE.BoxGeometry(larguraQuadro + 0.3, alturaQuadro + 0.3, 0.18),
  new THREE.MeshStandardMaterial({
    color: 0x1e1a16,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0x0d0c0a,
    emissiveIntensity: 0.15
  })
);
molduraCentral.position.z = -0.1;
quadroCentralGrupo.add(molduraCentral);

const texturaCentral = textureLoader.load('assets/obras/obra-central.jpg', updateLoadingProgress);
const pinturaCentral = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.1
  })
);
pinturaCentral.position.z = 0.01;
quadroCentralGrupo.add(pinturaCentral);

quadroCentralGrupo.position.set(0, 11.2, -config.wallDistance - 5.19);
scene.add(quadroCentralGrupo);

// ==================== BLOCO 6 — FRISOS ====================
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21,
  metalness: 1,
  roughness: 0.08,
  emissive: 0x2f1b08,
  emissiveIntensity: 0.33
});

function criarFrisoCentral(x, y, z, largura, altura) {
  const grupo = new THREE.Group();
  const espessura = 0.06;

  [1, -1].forEach(dy => {
    const barra = new THREE.Mesh(
      new THREE.BoxGeometry(largura, espessura, 0.02),
      frisoMaterial
    );
    barra.position.set(0, altura / 2 * dy, 0);
    grupo.add(barra);
  });

  [1, -1].forEach(dx => {
    const barra = new THREE.Mesh(
      new THREE.BoxGeometry(espessura, altura - espessura * 2, 0.02),
      frisoMaterial
    );
    barra.position.set(largura / 2 * dx - espessura / 2 * dx, 0, 0);
    grupo.add(barra);
  });

  grupo.position.set(x, y, z);
  scene.add(grupo);
}

criarFrisoCentral(0, 11.2, -config.wallDistance - 5.17, 5.2, 6.3);

// ==================== BLOCO 7 — OBRAS CIRCULARES ====================


function criarObrasNormais() {
  const raio = config.circleRadius;
  const tamanho = config.obraSize;

  dadosObras.forEach((dados, i) => {
    textureLoader.load(
      dados.imagem,
      (texture) => {
        const obra = new THREE.Mesh(
          new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
          new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.2,
            metalness: 0.1,
            side: THREE.DoubleSide,
            transparent: true
          })
        );

        const angulo = (i / dadosObras.length) * Math.PI * 2;
        obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
        obra.lookAt(0, 4.2, 0);
        obra.castShadow = true;
        obra.receiveShadow = true;

        obra.userData = { dados, index: i };

        scene.add(obra);
        obrasNormais.push(obra);
        updateLoadingProgress();
      },
      undefined,
      (error) => {
        console.error(`Erro ao carregar imagem da obra ${dados.titulo}:`, error);
        const obraFallback = new THREE.Mesh(
          new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
          new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.2,
            metalness: 0.1,
            side: THREE.DoubleSide,
            transparent: true
          })
        );

        const angulo = (i / dadosObras.length) * Math.PI * 2;
        obraFallback.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
        obraFallback.lookAt(0, 4.2, 0);
        obraFallback.castShadow = true;
        obraFallback.receiveShadow = true;

        obraFallback.userData = { dados, index: i };

        scene.add(obraFallback);
        obrasNormais.push(obraFallback);
        updateLoadingProgress();
      }
    );
  });
}

// ==================== BLOCO 8 — ANIMAÇÃO E DESTAQUE ====================
const velocidadeObras = 0.25;

function animarObrasCirculares(delta) {
  const velocidadeAtual = obraDestacada ? velocidadeObras * 0.5 : velocidadeObras;
  if (!obraDestacada) {
    anguloAtual += velocidadeAtual * delta;
  }

  const raio = config.circleRadius;

  obrasNormais.forEach((obra, i) => {
    if (obra === obraDestacada) return;

    const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
    obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
    obra.lookAt(0, 4.2, 0);
  });
}

function destacarObra(obra) {
  if (obraDestacada) return;

  obraDestacada = obra;
  ambienteDesacelerado = true;

  const dados = obra.userData.dados;

  // Aplicar blur à cena (exceto obra destacada)
  renderer.domElement.style.filter = 'blur(4px)';
  obra.renderOrder = 999; // Garante que fica por cima do blur

  // Esconder outras obras
  obrasNormais.forEach(o => {
    if (o !== obra) o.visible = false;
  });

  // Calcular nova posição (1.5x mais alta)
  const novaAltura = 4.2 * 1.5;

  // Animação para centro
  gsap.to(obra.position, {
    x: 0,
    y: novaAltura,
    z: 0,
    duration: 1.1,
    ease: 'power2.inOut'
  });

  gsap.to(obra.scale, {
    x: 1.8,
    y: 1.8,
    z: 1.8,
    duration: 0.9,
    ease: 'power2.out'
  });

  // Ajustar modal para largura da obra
  const obraLargura = obra.geometry.parameters.width * 1.8;
  infoPanel.style.width = `${Math.min(obraLargura * 80, 500)}px`;

  // Mostrar informações
  modalElements.titulo.textContent = dados.titulo;
  modalElements.artista.textContent = dados.artista;
  modalElements.ano.textContent = dados.ano;
  modalElements.descricao.textContent = dados.descricao;
  modalElements.preco.textContent = `${dados.preco} ETH`;

  overlay.style.display = 'block';
  infoPanel.style.display = 'block';
}

function fecharObraDestacada() {
  if (!obraDestacada) return;

  const obra = obraDestacada;
  const indexOriginal = obra.userData.index;
  const angulo = (indexOriginal / obrasNormais.length) * Math.PI * 2;

  // Remover blur
  renderer.domElement.style.filter = 'none';
  obra.renderOrder = 0;

  gsap.to(obra.position, {
    x: Math.cos(angulo) * config.circleRadius,
    y: 4.2,
    z: Math.sin(angulo) * config.circleRadius,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete: () => {
      obrasNormais.forEach(o => o.visible = true);
      overlay.style.display = 'none';
      infoPanel.style.display = 'none';
      obraDestacada = null;
      ambienteDesacelerado = false;
    }
  });

  gsap.to(obra.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.6,
    ease: 'power2.out'
  });
}

// ==================== BLOCO 9 — INTERAÇÃO ====================
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (obraDestacada) {
    if (!infoPanel.contains(e.target)) {
      fecharObraDestacada();
    }
    return;
  }

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(obrasNormais, false);

  if (intersects.length > 0) {
    destacarObra(intersects[0].object);
  }
});

// ==================== BLOCO 10 — CARTEIRA E COMPRA ====================
const walletBtn = document.createElement('button');
walletBtn.id = 'wallet-button';
walletBtn.textContent = 'Connect Wallet';
walletBtn.style.cssText = `
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 250;
  padding: 10px 18px 10px 42px;
  font-size: 1em;
  background-color: #d8b26c;
  color: #111;
  border: none;
  border-radius: 6px;
  font-family: 'Playfair Display', serif;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
  background-image: url('/assets/icons/metamask.svg');
  background-repeat: no-repeat;
  background-position: 12px center;
  background-size: 20px 20px;
  transition: background-color 0.3s ease, transform 0.2s ease;
`;
document.body.appendChild(walletBtn);

let walletAddress = null;

async function atualizarEstadoCarteira() {
  if (walletAddress) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const saldo = await provider.getBalance(walletAddress);
    const eth = ethers.formatEther(saldo);
    walletBtn.textContent = `Disconnect (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} | ${parseFloat(eth).toFixed(4)} ETH)`;
  } else {
    walletBtn.textContent = 'Connect Wallet';
  }
}

async function conectarCarteira() {
  try {
    if (!window.ethereum) {
      alert('MetaMask não está instalada. Por favor, instala-a para continuar.');
      return;
    }

    const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = contas[0];
    localStorage.setItem('walletConnected', 'true');
    atualizarEstadoCarteira();
  } catch (erro) {
    console.error('❌ Erro ao ligar carteira:', erro);
    alert('Não foi possível ligar a carteira. Tenta novamente.');
  }
}

function desligarCarteira() {
  walletAddress = null;
  localStorage.removeItem('walletConnected');
  atualizarEstadoCarteira();
}

walletBtn.addEventListener('click', () => {
  if (walletAddress) {
    desligarCarteira();
  } else {
    conectarCarteira();
  }
});

modalElements.botao.addEventListener('click', async () => {
  const dados = obraDestacada?.userData?.dados;

  if (!dados || !dados.preco || !dados.titulo) {
    alert('Erro: dados da obra não encontrados.');
    return;
  }

  if (!window.ethereum) {
    alert('MetaMask não está instalada. Por favor, instala-a para continuares.');
    return;
  }

  try {
    modalElements.botao.disabled = true;
    modalElements.botao.textContent = 'A processar...';

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41',
      value: ethers.parseEther(dados.preco)
    });

    alert(`🧾 Transacção enviada!\n\nHash:\n${tx.hash}`);
    await tx.wait();

    alert('🎉 Compra confirmada! Obrigado por apoiar a arte digital.');
    fecharObraDestacada();

  } catch (err) {
    console.error('❌ Erro na compra:', err);
    alert('⚠️ Ocorreu um erro durante a compra. Verifica a carteira e tenta novamente.');
  } finally {
    modalElements.botao.disabled = false;
    modalElements.botao.textContent = 'Buy';
  }
});

// ==================== BLOCO 11 — INICIALIZAÇÃO ====================
function iniciarGaleria() {
  criarObrasNormais();
  obrasSuspensas.forEach((obra, idx) => {
    criarCuboSuspenso(obra, idx);
  });
}

function animar() {
  const delta = relogio.getDelta();
  animarObrasCirculares(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animar);
}

window.addEventListener('load', () => {
  iniciarGaleria();
  animar();

  if (window.ethereum && localStorage.getItem('walletConnected') === 'true') {
    conectarCarteira();
  }
});
