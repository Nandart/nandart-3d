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
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 16, cameraZ: 44, cameraY: 18, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 19, cameraZ: 48, cameraY: 19, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 21, cameraZ: 52, cameraY: 20, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 22, cameraZ: 56, cameraY: 21, textSize: 0.55 }
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

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 200);

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY, config.cameraZ);
  camera.lookAt(0, 13, -config.wallDistance);
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

// ==================== BLOCO 3 — ILUMINAÇÃO DUPLICADA ====================

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

// Luz adicional para as paredes
const wallLight1 = new THREE.PointLight(0xffeedd, 1.5, 20);
wallLight1.position.set(0, 15, -config.wallDistance + 1);
scene.add(wallLight1);

const wallLight2 = new THREE.PointLight(0xffeedd, 1.5, 20);
wallLight2.position.set(-16, 15, -config.wallDistance / 2 + 1);
scene.add(wallLight2);

const wallLight3 = new THREE.PointLight(0xffeedd, 1.5, 20);
wallLight3.position.set(16, 15, -config.wallDistance / 2 + 1);
scene.add(wallLight3);

// ==================== BLOCO 4 — PAREDES COM TEXTURA E ILUMINAÇÃO MELHORADA ====================

const paredeGeoFundo = new THREE.BoxGeometry(42, 29, 0.4);
const paredeGeoLateral = new THREE.BoxGeometry(30, 29, 0.4);

// Textura antracite melhorada
const antraciteTexture = new THREE.DataTexture(
  new Uint8Array([
    70, 70, 70, 255, 65, 65, 65, 255, 
    65, 65, 65, 255, 70, 70, 70, 255,
    68, 68, 68, 255, 63, 63, 63, 255,
    63, 63, 63, 255, 68, 68, 68, 255
  ]),
  4, 4, THREE.RGBAFormat
);
antraciteTexture.needsUpdate = true;

const paredeMaterial = new THREE.MeshStandardMaterial({
  map: antraciteTexture,
  color: 0x222222,
  roughness: 0.4,
  metalness: 0.3,
  emissive: 0x111111,
  emissiveIntensity: 0.2
});

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

// Adicionar logo NANdART na parede de fundo
const logoGeometry = new THREE.PlaneGeometry(8, 2);
const logoMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const logo = new THREE.Mesh(logoGeometry, logoMaterial);
logo.position.set(0, 25, -config.wallDistance + 0.1);
scene.add(logo);

// Obras nas paredes
function criarObraParede(x, y, z, rotY, imagePath, width, height, frameDepth) {
  textureLoader.load(imagePath, (texture) => {
    // Moldura
    const molduraGeometry = new THREE.BoxGeometry(width * 1.1, height * 1.1, frameDepth);
    const molduraMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.4
    });
    const moldura = new THREE.Mesh(molduraGeometry, molduraMaterial);
    
    // Obra
    const obraMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.1,
      metalness: 0.05
    });
    const obra = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      obraMaterial
    );
    obra.position.z = frameDepth / 2 + 0.01;
    
    const grupo = new THREE.Group();
    grupo.add(moldura);
    grupo.add(obra);
    
    grupo.position.set(x, y, z);
    grupo.rotation.y = rotY;
    grupo.castShadow = grupo.receiveShadow = true;
    
    scene.add(grupo);
    updateLoadingProgress();
  });
}

// Obras nas paredes (dimensões duplicadas)
criarObraParede(0, 10, -config.wallDistance + 0.2, 0, 'assets/obras/obra-central.jpg', 6, 8, 0.15);
criarObraParede(-16.7, 10, -config.wallDistance/2 + 0.2, Math.PI/2, 'assets/obras/obra-lateral-esquerda.jpg', 5, 7, 0.15);
criarObraParede(16.7, 10, -config.wallDistance/2 + 0.2, -Math.PI/2, 'assets/obras/obra-lateral-direita.jpg', 5, 7, 0.15);

// ==================== BLOCO 5 — CHÃO REFLETOR MAIS TRANSPARENTE ====================

const floorGeometry = new THREE.PlaneGeometry(160, 160);
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

// ==================== BLOCO 7 — CÍRCULO DE LUZ REDUZIDO ====================

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

// ==================== BLOCO 8 — OBRAS CIRCULARES SEM MOLDURA ====================

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
        // Obra sem moldura, com material dupla face
        const obraMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.2,
          metalness: 0.1,
          side: THREE.DoubleSide
        });
        
        const obra = new THREE.Mesh(
          new THREE.PlaneGeometry(tamanho * 1.6, tamanho * 1.9),
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

// ==================== BLOCO 10 — DESTAQUE DE OBRA E MODAL MELHORADO ====================

// ==================== BLOCO 10 — DESTAQUE DE OBRA E MODAL MELHORADO ====================

function fecharObraDestacada() {
  if (!obraDestacada) return;

  const obra = obraDestacada;
  const indexOriginal = obra.userData.index;
  const angulo = (indexOriginal / obrasNormais.length) * Math.PI * 2;

  // Verifica se o overlay existe antes de tentar remover
  if (overlay && overlay.parentNode === document.body) {
    document.body.removeChild(overlay);
  }

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

function criarModal(dados) {
  // Remove existing modal safely
  if (overlay && overlay.parentNode === document.body) {
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
    pointer-events: none;
  `;

  // Blur background (doesn't affect modal)
  const blurBackground = document.createElement('div');
  blurBackground.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(5px);
    pointer-events: auto;
  `;
  blurBackground.addEventListener('click', fecharObraDestacada);
  overlay.appendChild(blurBackground);

  infoPanel = document.createElement('div');
  infoPanel.style.cssText = `
    background: rgba(30,30,30,0.95);
    padding: 20px;
    border-radius: 8px;
    width: ${config.obraSize * 1.3 * 100}px;
    max-width: 90%;
    position: absolute;
    border: 1px solid #d4af37;
    pointer-events: auto;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    z-index: 101;
  `;
  // Conteúdo do modal
  modalElements.titulo = document.createElement('h2');
  modalElements.titulo.textContent = dados.titulo;
  modalElements.titulo.style.cssText = 'margin: 0 0 10px 0; color: #d4af37;';
  
  modalElements.artista = document.createElement('p');
  modalElements.artista.textContent = `Artista: ${dados.artista}`;
  modalElements.artista.style.cssText = 'margin: 5px 0; color: #fff;';
  
  modalElements.ano = document.createElement('p');
  modalElements.ano.textContent = `Ano: ${dados.ano}`;
  modalElements.ano.style.cssText = 'margin: 5px 0; color: #fff;';
  
  modalElements.descricao = document.createElement('p');
  modalElements.descricao.textContent = dados.descricao;
  modalElements.descricao.style.cssText = 'margin: 10px 0; color: #ccc;';
  
  modalElements.preco = document.createElement('p');
  modalElements.preco.textContent = `Preço: ${dados.preco} ETH`;
  modalElements.preco.style.cssText = 'margin: 10px 0; font-weight: bold; color: #d4af37;';

  modalElements.botao = document.createElement('button');
  modalElements.botao.textContent = 'Comprar Obra';
  modalElements.botao.style.cssText = `
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
  modalElements.botao.addEventListener('mouseenter', () => {
    modalElements.botao.style.background = '#e8c252';
  });
  modalElements.botao.addEventListener('mouseleave', () => {
    modalElements.botao.style.background = '#d4af37';
  });
  modalElements.botao.addEventListener('click', () => {
    comprarObra(dados);
  });

  infoPanel.appendChild(modalElements.titulo);
  infoPanel.appendChild(modalElements.artista);
  infoPanel.appendChild(modalElements.ano);
  infoPanel.appendChild(modalElements.descricao);
  infoPanel.appendChild(modalElements.preco);
  infoPanel.appendChild(modalElements.botao);

  overlay.appendChild(infoPanel);
  document.body.appendChild(overlay);

// Adiciona o overlay ao DOM antes de posicionar para garantir dimensões
  document.body.appendChild(overlay);

  // Posicionamento preciso do modal
  const obraWorldPos = new THREE.Vector3();
  obraDestacada.getWorldPosition(obraWorldPos);
  obraWorldPos.project(camera);
  
  const x = (obraWorldPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (obraWorldPos.y * 0.5 + 0.5) * window.innerHeight;
  
  infoPanel.style.left = `${Math.max(10, x - infoPanel.offsetWidth / 2)}px`;
  infoPanel.style.top = `${Math.min(window.innerHeight - infoPanel.offsetHeight - 10, y + 150)}px`;
}

async function comprarObra(dados) {
  if (!walletAddress) {
    alert('Por favor, conecte sua carteira primeiro.');
    return;
  }

  try {
    const price = ethers.parseEther(dados.preco);
    // Aqui você implementaria a lógica de compra real
    // Por exemplo, chamar um contrato inteligente:
    // const tx = await contract.comprarObra(dados.id, { value: price });
    // await tx.wait();
    
    alert(`Obra "${dados.titulo}" comprada com sucesso por ${dados.preco} ETH!`);
    fecharObraDestacada();
  } catch (error) {
    console.error('Erro na compra:', error);
    alert('Erro ao comprar a obra. Verifique o console para detalhes.');
  }
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
      if (overlay) document.body.removeChild(overlay);
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

// ==================== BLOCO 12 — BOTÕES DE INTERFACE MELHORADOS ====================

function criarBotoesInterface() {
  // Remove existing wallet button safely
  const existingBtn = document.getElementById('wallet-button');
  if (existingBtn && existingBtn.parentNode === document.body) {
    document.body.removeChild(existingBtn);
  }

  // Botão Connect Wallet funcional
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
  walletBtn.addEventListener('click', conectarCarteira);
  document.body.appendChild(walletBtn);
}

async function conectarCarteira() {
  try {
    if (window.ethereum) {
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      walletAddress = await signer.getAddress();
      
      // Obter saldo
      const balance = await provider.getBalance(walletAddress);
      walletBalance = ethers.formatEther(balance);
      
      // Atualizar botão
      const walletBtn = document.getElementById('wallet-button');
      walletBtn.textContent = `${walletBalance.substring(0, 6)} ETH`;
      walletBtn.title = walletAddress;
      
      console.log('Carteira conectada:', walletAddress);
    } else {
      alert('Por favor, instale o MetaMask ou outra carteira Ethereum.');
    }
  } catch (error) {
    console.error('Erro ao conectar carteira:', error);
    alert('Erro ao conectar carteira. Verifique o console para detalhes.');
  }
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
