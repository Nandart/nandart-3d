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

// Variáveis globais principais
let config;
let obraDestacada = null;
let ambienteDesacelerado = false;
const obrasNormais = [];
const cubosSuspensos = [];
const relogio = new THREE.Clock();
let anguloAtual = 0;
let provider, signer, walletAddress, walletBalance;

// Elementos do modal
let overlay, infoPanel;
const modalElements = {
  titulo: null,
  artista: null,
  ano: null,
  descricao: null,
  preco: null,
  botao: null
};

// ==================== BLOCO 2 — CONFIGURAÇÕES E RENDERER ====================

const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 33, cameraY: 13.5, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 36, cameraY: 14.25, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 39, cameraY: 15, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 42, cameraY: 15.75, textSize: 0.55 }
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

// Adicionar segunda camada de iluminação
const ambientLight2 = new THREE.AmbientLight(0xffeedd, 1.6);
scene.add(ambientLight2);

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2.4);
directionalLight2.position.set(0, 16, -12);
directionalLight2.castShadow = true;
scene.add(directionalLight2);

const spotLight2 = new THREE.SpotLight(0xffeedd, 3, 30, Math.PI / 5, 0.4, 1);
spotLight2.position.set(0, 20, -5);
scene.add(spotLight2);

// ==================== BLOCO 4 — PAREDES COM TEXTURA ANTRAÇITE ====================

const paredeGeoFundo = new THREE.BoxGeometry(42, 29, 0.4);
const paredeGeoLateral = new THREE.BoxGeometry(30, 29, 0.4);

// Textura antracite programática (fallback)
const antraciteTexture = new THREE.DataTexture(
  new Uint8Array([70, 70, 70, 255, 65, 65, 65, 255, 65, 65, 65, 255, 70, 70, 70, 255]),
  2, 2, THREE.RGBAFormat
);
antraciteTexture.needsUpdate = true;

const paredeMaterial = new THREE.MeshStandardMaterial({
  map: antraciteTexture,
  color: 0x222222,
  roughness: 0.6,
  metalness: 0.2,
  emissive: 0x333333,
  emissiveIntensity: 0.3
});

// Carregar texturas para as paredes
const loadWallArt = (path, wallMesh, isVertical = false) => {
  textureLoader.load(path, (texture) => {
    const frameThickness = 0.15;
    const frameWidth = isVertical ? 4.5 * 1.5 : 6 * 1.5;
    const frameHeight = isVertical ? 6 * 1.5 : 4.5 * 1.5;
    
    const frameGeometry = new THREE.BoxGeometry(
      frameWidth + frameThickness * 2,
      frameHeight + frameThickness * 2,
      0.2
    );
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.5
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    
    const artMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.1
    });
    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(frameWidth, frameHeight),
      artMaterial
    );
    art.position.z = 0.11;
    
    const grupo = new THREE.Group();
    grupo.add(frame);
    grupo.add(art);
    
    // Posicionar na parede
    grupo.position.copy(wallMesh.position);
    grupo.position.z += 0.1;
    
    if (isVertical) {
      grupo.position.y = 14.5;
      grupo.position.x = wallMesh.position.x > 0 ? 16.7 : -16.7;
    } else {
      grupo.position.y = 14.5;
    }
    
    scene.add(grupo);
  });
};

const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial.clone());
paredeFundo.position.set(0, 14.6, -config.wallDistance);
paredeFundo.receiveShadow = true;
scene.add(paredeFundo);

const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial.clone());
paredeEsquerda.position.set(-16.7, 14.5, -config.wallDistance / 2);
paredeEsquerda.rotation.y = Math.PI / 2;
paredeEsquerda.receiveShadow = true;
scene.add(paredeEsquerda);

const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial.clone());
paredeDireita.position.set(16.7, 14.5, -config.wallDistance / 2);
paredeDireita.rotation.y = -Math.PI / 2;
paredeDireita.receiveShadow = true;
scene.add(paredeDireita);

// Carregar obras nas paredes
loadWallArt('assets/obras/obra-central.jpg', paredeFundo);
loadWallArt('assets/obras/obra-lateral-esquerda.jpg', paredeEsquerda, true);
loadWallArt('assets/obras/obra-lateral-direita.jpg', paredeDireita, true);

// Adicionar logo NANdART na parede de fundo
const logoGeometry = new THREE.PlaneGeometry(8, 2);
const logoMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const logo = new THREE.Mesh(logoGeometry, logoMaterial);
logo.position.set(0, 25, -config.wallDistance + 0.1);
scene.add(logo);

// ==================== BLOCO 5 — CHÃO REFLETOR ====================

const floorGeometry = new THREE.PlaneGeometry(80, 80);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000,
  metalness: 0.9,
  roughness: 0.05,
  transparent: true,
  opacity: 0.8
});

const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -0.03;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

// ==================== BLOCO 6 — FRISOS DOURADOS ====================

const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  metalness: 0.9,
  roughness: 0.3
});

function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, 0.02),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  scene.add(friso);
}

// Frisos horizontais
criarFrisoLinha(0, 1.6, -config.wallDistance + 0.1, 42);
criarFrisoLinha(0, 2.2, -config.wallDistance + 0.1, 42);
criarFrisoLinha(-16.7, 1.6, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
criarFrisoLinha(-16.7, 2.2, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
criarFrisoLinha(16.7, 1.6, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);
criarFrisoLinha(16.7, 2.2, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);

// ==================== BLOCO 7 — CÍRCULO DE LUZ ====================

const circuloLuzGeometry = new THREE.RingGeometry(
  config.circleRadius + 0.3, // Reduzido em 1/4
  config.circleRadius + 0.7, // Reduzido em 1/4
  64
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

// ==================== BLOCO 8 — OBRAS CIRCULARES ====================

const dadosObras = [
  {
    id: 'obra1',
    titulo: 'Obra 1',
    artista: 'Artista A',
    ano: '2024',
    descricao: 'Descrição da Obra 1.',
    preco: '0.5',
    imagem: 'assets/obras/obra1.jpg'
  },
  {
    id: 'obra2',
    titulo: 'Obra 2',
    artista: 'Artista B',
    ano: '2024',
    descricao: 'Descrição da Obra 2.',
    preco: '0.85',
    imagem: 'assets/obras/obra2.jpg'
  },
  {
    id: 'obra3',
    titulo: 'Obra C',
    artista: 'Artista A',
    ano: '2024',
    descricao: 'Descrição da Obra 3.',
    preco: '0.6',
    imagem: 'assets/obras/obra3.jpg'
  },
  {
    id: 'obra4',
    titulo: 'Obra 4',
    artista: 'Artista D',
    ano: '2024',
    descricao: 'Descrição da Obra 4.',
    preco: '0.35',
    imagem: 'assets/obras/obra4.jpg'
  },
  {
    id: 'obra5',
    titulo: 'Obra 5',
    artista: 'Artista E',
    ano: '2024',
    descricao: 'Descrição da Obra 5.',
    preco: '0.45',
    imagem: 'assets/obras/obra5.jpg'
  },
  {
    id: 'obra6',
    titulo: 'Obra 6',
    artista: 'Artista F',
    ano: '2024',
    descricao: 'Descrição da Obra 6.',
    preco: '0.75',
    imagem: 'assets/obras/obra6.jpg'
  },
  {
    id: 'obra7',
    titulo: 'Obra 7',
    artista: 'Artista G',
    ano: '2024',
    descricao: 'Descrição da Obra 7.',
    preco: '0.6',
    imagem: 'assets/obras/obra7.jpg'
  },
  {
    id: 'obra8',
    titulo: 'Obra 8',
    artista: 'Artista H',
    ano: '2020',
    descricao: 'Descrição da Obra 8.',
    preco: '0.58',
    imagem: 'assets/obras/obra8.jpg'
  }
];

function criarObrasNormais() {
  const raio = config.circleRadius;
  const tamanho = config.obraSize;

  dadosObras.forEach((dados, i) => {
    textureLoader.load(
      dados.imagem,
      (texture) => {
        // Criar apenas a obra sem moldura
        const obraMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.2,
          metalness: 0.1,
          side: THREE.DoubleSide // Visível de ambos os lados
        });
        
        const obra = new THREE.Mesh(
          new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
          obraMaterial
        );
        
        const grupo = new THREE.Group();
        grupo.add(obra);

        const angulo = (i / dadosObras.length) * Math.PI * 2;
        grupo.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
        grupo.lookAt(0, 4.2, 0);
        grupo.castShadow = grupo.receiveShadow = true;

        grupo.userData = { dados, index: i, isObra: true };

        scene.add(grupo);
        obrasNormais.push(grupo);
        updateLoadingProgress();
      },
      undefined,
      () => {
        console.error(`Erro ao carregar imagem da obra ${dados.titulo}`);
        // Fallback...
      }
    );
  });
}

// ==================== BLOCO 9 — ANIMAÇÃO DAS OBRAS ====================

const velocidadeObras = 0.25;

function animarObrasCirculares(delta) {
  if (!obraDestacada) {
    anguloAtual += velocidadeObras * delta * (ambienteDesacelerado ? 0.3 : 1);
  }

  const raio = config.circleRadius;

  obrasNormais.forEach((obra, i) => {
    if (obra === obraDestacada) return;

    const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
    obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
    obra.lookAt(0, 4.2, 0);
  });
}

// ==================== BLOCO 10 — DESTAQUE DE OBRA ====================

function destacarObra(obra) {
  if (obraDestacada) return;

  obraDestacada = obra;
  ambienteDesacelerado = true;

  const dados = obra.userData.dados;

  // Aplicar blur apenas às outras obras
  obrasNormais.forEach(o => {
    if (o !== obra) {
      o.children[0].material.transparent = true;
      o.children[0].material.opacity = 0.5;
    }
  });

  // Animação para o centro
  gsap.to(obra.position, {
    x: 0,
    y: 6.5 * 1.5,
    z: 0,
    duration: 1.1,
    ease: 'power2.inOut',
    onUpdate: () => obra.lookAt(camera.position)
  });

  gsap.to(obra.scale, {
    x: 2,
    y: 2,
    z: 2,
    duration: 0.9,
    ease: 'power2.out'
  });

  // Criar modal
  criarModal(dados);
}

function criarModal(dados) {
  // Remove existing overlay if any
  if (overlay && document.body.contains(overlay)) {
    document.body.removeChild(overlay);
  }

  overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    pointer-events: none;
  `;

  // Fundo desfocado (não intercepta eventos de clique)
  const blurBackground = document.createElement('div');
  blurBackground.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(5px);
    pointer-events: auto;
  `;
  blurBackground.addEventListener('click', () => fecharObraDestacada());
  overlay.appendChild(blurBackground);

  infoPanel = document.createElement('div');
  infoPanel.style.cssText = `
    background: rgba(30,30,30,0.95);
    padding: 20px;
    border-radius: 8px;
    width: ${config.obraSize * 1.3 * 100}px;
    max-width: 90%;
    position: relative;
    border: 1px solid #d4af37;
    margin-top: 20px;
    pointer-events: auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  `;

  // Conteúdo do modal
  modalElements.titulo = document.createElement('h2');
  modalElements.titulo.textContent = dados.titulo;
  modalElements.titulo.style.cssText = 'margin: 0 0 10px 0; color: #d4af37;';
  
  modalElements.artista = document.createElement('p');
  modalElements.artista.textContent = `Artista: ${dados.artista}`;
  modalElements.artista.style.cssText = 'margin: 0 0 5px 0;';
  
  modalElements.ano = document.createElement('p');
  modalElements.ano.textContent = `Ano: ${dados.ano}`;
  modalElements.ano.style.cssText = 'margin: 0 0 5px 0;';
  
  modalElements.descricao = document.createElement('p');
  modalElements.descricao.textContent = dados.descricao;
  modalElements.descricao.style.cssText = 'margin: 10px 0;';
  
  modalElements.preco = document.createElement('p');
  modalElements.preco.textContent = `Preço: ${dados.preco} ETH`;
  modalElements.preco.style.cssText = 'margin: 10px 0; font-weight: bold;';
  
  const buyBtn = document.createElement('button');
  buyBtn.textContent = 'Comprar';
  buyBtn.style.cssText = `
    background: #d4af37;
    color: #111;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    margin-top: 15px;
    font-weight: bold;
    transition: all 0.3s;
  `;
  buyBtn.addEventListener('mouseenter', () => {
    buyBtn.style.background = '#e8c252';
  });
  buyBtn.addEventListener('mouseleave', () => {
    buyBtn.style.background = '#d4af37';
  });
  
  // Adicionar elementos ao painel
  infoPanel.appendChild(modalElements.titulo);
  infoPanel.appendChild(modalElements.artista);
  infoPanel.appendChild(modalElements.ano);
  infoPanel.appendChild(modalElements.descricao);
  infoPanel.appendChild(modalElements.preco);
  infoPanel.appendChild(buyBtn);
  
  overlay.appendChild(infoPanel);
  document.body.appendChild(overlay);

  // Posicionar o modal abaixo da obra
  const obraWorldPos = new THREE.Vector3();
  obraDestacada.getWorldPosition(obraWorldPos);
  
  const screenPos = obraWorldPos.clone().project(camera);
  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (screenPos.y * 0.5 + 0.5) * window.innerHeight;
  
  infoPanel.style.left = `${x - infoPanel.offsetWidth / 2}px`;
  infoPanel.style.top = `${y + 100}px`;

  // Configurar botão de compra
  buyBtn.addEventListener('click', async () => {
    if (!walletAddress) {
      alert('Por favor, conecte sua carteira primeiro.');
      return;
    }
    
    try {
      const tx = await signer.sendTransaction({
        to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41',
        value: ethers.parseEther(dados.preco)
      });
      
      alert(`Transação enviada! Hash: ${tx.hash}`);
      console.log('Transação:', tx);
    } catch (error) {
      console.error('Erro na compra:', error);
      alert(`Erro na compra: ${error.message}`);
    }
  });
}

function fecharObraDestacada() {
  if (!obraDestacada) return;

  const obra = obraDestacada;
  const indexOriginal = obra.userData.index;
  const angulo = (indexOriginal / obrasNormais.length) * Math.PI * 2;

  gsap.to(obra.position, {
    x: Math.cos(angulo) * config.circleRadius,
    y: 4.2,
    z: Math.sin(angulo) * config.circleRadius,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete: () => {
      obrasNormais.forEach(o => {
        o.children[0].material.opacity = 1;
      });
      if (overlay && document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
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

// ==================== BLOCO 11 — INTERAÇÃO ====================

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (obraDestacada) return;

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(obrasNormais, true);

  if (intersects.length > 0 && intersects[0].object.parent.userData.isObra) {
    destacarObra(intersects[0].object.parent);
  }
});

// ==================== BLOCO 12 — BOTÕES DE INTERFACE ====================

async function connectWallet() {
  try {
    if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      walletAddress = await signer.getAddress();
      walletBalance = await provider.getBalance(walletAddress);
      
      // Atualizar botão
      const walletBtn = document.getElementById('wallet-button');
      if (walletBtn) {
        walletBtn.textContent = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} | ${ethers.formatEther(walletBalance).slice(0, 6)} ETH`;
        walletBtn.onclick = disconnectWallet;
      }
      
      console.log('Carteira conectada:', walletAddress);
    } else {
      alert('Por favor, instale a MetaMask!');
    }
  } catch (error) {
    console.error('Erro ao conectar carteira:', error);
    alert(`Erro ao conectar: ${error.message}`);
  }
}

async function disconnectWallet() {
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

function criarBotoesInterface() {
  // Remover botão existente se houver
  const existingBtn = document.getElementById('wallet-button');
  if (existingBtn && existingBtn.parentNode) {
    existingBtn.parentNode.removeChild(existingBtn);
  }

  // Botão Connect Wallet
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
    transition: all 0.3s;
  `;
  
  walletBtn.addEventListener('mouseenter', () => {
    walletBtn.style.background = '#e8c252';
  });
  walletBtn.addEventListener('mouseleave', () => {
    walletBtn.style.background = '#d4af37';
  });
  
  walletBtn.addEventListener('click', connectWallet);
  document.body.appendChild(walletBtn);
}

// ==================== BLOCO 13 — INICIALIZAÇÃO ====================

function iniciarGaleria() {
  criarObrasNormais();
  criarBotoesInterface();
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = relogio.getDelta();
  animarObrasCirculares(delta);
  renderer.render(scene, camera);
}

window.addEventListener('load', iniciarGaleria);
