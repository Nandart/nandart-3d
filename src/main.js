// ==================== BLOCO 1 — IMPORTAÇÕES E DEPENDÊNCIAS ====================
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

// Validação das bibliotecas carregadas
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

// Registo dos plugins do GSAP
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
// ==================== BLOCO 2 — CONFIGURAÇÃO DE VIEWPORT E VARIÁVEIS ====================
const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 18, cameraY: 7.2, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 19.5, cameraY: 7.6, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 21, cameraY: 8.1, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 22, cameraY: 8.4, textSize: 0.55 }
};

function getViewportLevel() {
  const width = window.innerWidth;
  if (width < 480) return 'XS';
  if (width < 768) return 'SM';
  if (width < 1024) return 'MD';
  return 'LG';
}

let config = configMap[getViewportLevel()];
const velocidadeObras = 0.003;
// Contador de recursos para carregamento visual
let loadedResources = 0;
const totalResources = 10 + obrasSuspensas.length;

function updateLoadingProgress() {
  loadedResources++;
  const carregados = document.getElementById('loaded-resources');
  const total = document.getElementById('total-resources');

  if (carregados && total) {
    carregados.textContent = loadedResources;
    total.textContent = totalResources;
  }

  // Quando todos os recursos estiverem carregados
  if (loadedResources >= totalResources) {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      loadingScreen.style.transition = 'opacity 0.6s ease';
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 600);
    }
  }
}
// ==================== BLOCO 3 — INICIALIZAÇÃO DA CENA E TEXTURAS ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Gestor de carregamento para monitorizar progresso de texturas
const loadingManager = new THREE.LoadingManager();

loadingManager.onLoad = () => {
  console.log('✅ Todos os recursos carregados com sucesso.');
  updateLoadingProgress();
};

loadingManager.onProgress = (item, loaded, total) => {
  console.log(`📦 Recurso ${loaded}/${total} carregado: ${item}`);
  updateLoadingProgress();
};

loadingManager.onError = (url) => {
  console.error(`❌ Erro ao carregar recurso: ${url}`);
  const erro = document.getElementById('loading-error');
  if (erro) erro.style.display = 'block';
};

// Loader de texturas com fallback incorporado
const textureLoader = new THREE.TextureLoader(loadingManager);

// Instância do renderizador
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
// ==================== BLOCO 4 — LUZES E CÂMARA ====================

// Iluminação ambiente suave mas clara (triplicada)
const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
scene.add(ambientLight);

// Luz direcional principal (ao centro)
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(0, 10, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Luz de preenchimento esquerda
const fillLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
fillLight1.position.set(-6, 6, 4);
scene.add(fillLight1);

// Luz de preenchimento direita
const fillLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
fillLight2.position.set(6, 6, -4);
scene.add(fillLight2);

// Luz superior tipo spotlight para foco cenográfico
const spotLight = new THREE.SpotLight(0xffffff, 2.2, 30, Math.PI / 6, 0.5, 1);
spotLight.position.set(0, 16, 5);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// Câmara com posicionamento recuado, revelando o espaço completo
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY + 1.6, config.cameraZ + 6.5); // mais recuada e elevada
  camera.lookAt(0, 6.5, -config.wallDistance + 0.4); // foco mais amplo na sala
  camera.updateProjectionMatrix();
}
updateCamera();

// Resize responsivo com debounce
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 200);
});
// ==================== BLOCO 5 — CHÃO REFLECTOR E GEOMETRIAS DAS PAREDES ====================

// Chão espelhado com reflexo subtil (cor antracite)
const floorGeometry = new THREE.PlaneGeometry(60, 60);
const floorMirror = new Reflector(floorGeometry, {
  clipBias: 0.003,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x1a1a1a
});
floorMirror.rotation.x = -Math.PI / 2;
floorMirror.position.y = -0.05;
scene.add(floorMirror);

// Geometrias base das paredes (ajustadas conforme layout e câmara)
const paredeGeoFundo = new THREE.PlaneGeometry(42, 32);
const paredeGeoLateral = new THREE.PlaneGeometry(34, 30);
// ==================== BLOCO 6 — TEXTURA DAS PAREDES COM FALLBACK ====================

function aplicarTexturaParede(textura) {
  const paredeMaterial = new THREE.MeshStandardMaterial({
    map: textura || null,
    color: 0xffffff,
    emissive: 0x111111,
    emissiveIntensity: 0.25,
    roughness: 0.65,
    metalness: 0.15
  });

  // Parede de fundo (posição mais recuada para profundidade visual)
  const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial);
  paredeFundo.position.set(0, 14.5, -config.wallDistance - 5.2);
  paredeFundo.receiveShadow = true;
  scene.add(paredeFundo);

  // Parede esquerda (vista lateral, rotação positiva)
  const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeEsquerda.position.set(-16.5, 14.4, -config.wallDistance / 2);
  paredeEsquerda.rotation.y = Math.PI / 2;
  paredeEsquerda.receiveShadow = true;
  scene.add(paredeEsquerda);

  // Parede direita (vista lateral, rotação negativa)
  const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeDireita.position.set(16.5, 14.4, -config.wallDistance / 2);
  paredeDireita.rotation.y = -Math.PI / 2;
  paredeDireita.receiveShadow = true;
  scene.add(paredeDireita);
}

// Aplicação com fallback automático
textureLoader.load(
  'assets/antracite-realista.jpg',
  (texture) => aplicarTexturaParede(texture),
  undefined,
  (error) => {
    console.warn('⚠️ Erro ao carregar textura local. A tentar fallback...');
    textureLoader.load(
      'https://nandart.art/assets/antracite-realista.jpg',
      (fallbackTexture) => aplicarTexturaParede(fallbackTexture),
      undefined,
      (fallbackError) => {
        console.error('❌ Falhou também o fallback da textura:', fallbackError);
        aplicarTexturaParede(null);
      }
    );
  }
);
// ==================== BLOCO 7 — OBRA CENTRAL COM MOLDURA ====================

const texturaCentral = textureLoader.load('assets/obras/obra-central.jpg', updateLoadingProgress);
const quadroCentralGrupo = new THREE.Group();

const larguraQuadro = 4.6;
const alturaQuadro = 5.8;

// Moldura externa saliente e escura (com profundidade)
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
molduraCentral.position.z = -0.1; // ligeiramente recuada
quadroCentralGrupo.add(molduraCentral);

// Pintura principal com textura carregada
const pinturaCentral = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.1
  })
);
pinturaCentral.position.z = 0.01; // ligeiramente à frente da moldura
quadroCentralGrupo.add(pinturaCentral);

// Posicionamento centrado e elevado na parede de fundo
quadroCentralGrupo.position.set(0, 11.2, -config.wallDistance - 5.19);
scene.add(quadroCentralGrupo);
// ==================== BLOCO 8 — FRISOS DECORATIVOS ====================

const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21, // dourado médio fiel ao layout
  metalness: 1,
  roughness: 0.08,
  emissive: 0x2f1b08,
  emissiveIntensity: 0.33
});

// === Friso rectangular à volta do quadro central ===
function criarFrisoRect(x, y, z, largura, altura, rotY = 0) {
  const grupo = new THREE.Group();
  const esp = 0.06;

  // Barras horizontais (cima e baixo)
  [1, -1].forEach(i => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(largura, esp, 0.02), frisoMaterial);
    h.position.set(0, altura / 2 * i, 0);
    grupo.add(h);
  });

  // Barras verticais (direita e esquerda)
  [1, -1].forEach(i => {
    const v = new THREE.Mesh(new THREE.BoxGeometry(esp, altura - esp * 2, 0.02), frisoMaterial);
    v.position.set(largura / 2 * i - esp / 2 * i, 0, 0);
    grupo.add(v);
  });

  grupo.position.set(x, y, z);
  grupo.rotation.y = rotY;
  scene.add(grupo);
}

// === Frisos horizontais inferiores contínuos nas três paredes ===
function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, 0.02),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  scene.add(friso);
}

// === Frisos verticais duplos embutidos nas paredes laterais ===
function criarFrisoDuploVertical(x, y, z, altura, lado) {
  const offset = lado === 'esquerda' ? -0.4 : 0.4;

  // Friso exterior largo
  const externo = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, altura, 0.02),
    frisoMaterial
  );
  externo.position.set(x, y, z);
  externo.rotation.y = lado === 'esquerda' ? Math.PI / 2 : -Math.PI / 2;
  scene.add(externo);

  // Friso interior estreito embutido
  const interno = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, altura - 0.4, 0.02),
    frisoMaterial
  );
  interno.position.set(x + offset, y, z + 0.01);
  interno.rotation.y = externo.rotation.y;
  scene.add(interno);
}

// === Aplicação dos frisos ===

// 1. Friso central à volta do quadro
criarFrisoRect(0, 11.2, -config.wallDistance - 5.17, 5.2, 6.3);

// 2. Frisos horizontais inferiores — dupla camada por parede

// Parede de fundo (duas faixas paralelas)
criarFrisoLinha(0, 1.6, -config.wallDistance - 5.18, 42);     // inferior
criarFrisoLinha(0, 2.2, -config.wallDistance - 5.18, 42);     // superior

// Parede lateral esquerda (com rotação positiva)
criarFrisoLinha(-16.5, 1.6, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
criarFrisoLinha(-16.5, 2.2, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);

// Parede lateral direita (com rotação negativa)
criarFrisoLinha(16.5, 1.6, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);
criarFrisoLinha(16.5, 2.2, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);

// 3. Frisos verticais embutidos nas laterais
criarFrisoDuploVertical(-16.5, 14.5, -config.wallDistance / 2, 7.5, 'esquerda');
criarFrisoDuploVertical(16.5, 14.5, -config.wallDistance / 2, 7.5, 'direita');
// ==================== BLOCO 9 — PEDESTAIS COM VITRINES ====================

const pedestalMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2b2b,
  roughness: 0.4,
  metalness: 0.25
});

const vitrineMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0,
  transparent: true,
  opacity: 0.22,
  transmission: 1,
  thickness: 0.25,
  reflectivity: 0.45,
  clearcoat: 1,
  clearcoatRoughness: 0.1
});

const gemaMaterial = new THREE.MeshStandardMaterial({
  color: 0x33ccff,
  emissive: 0x33ccff,
  emissiveIntensity: 1.7,
  roughness: 0.15,
  metalness: 0.4,
  transparent: true,
  opacity: 0.85
});

function criarPedestalComVitrine(posX, posZ) {
  const alturaPedestal = 1.8;
  const raioPedestal = 0.6;
  const alturaVitrine = 1.3;
  const raioVitrine = 0.5;

  // Base escura do pedestal
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(raioPedestal, raioPedestal, alturaPedestal, 64),
    pedestalMaterial
  );
  base.position.set(posX, alturaPedestal / 2, posZ);
  base.castShadow = base.receiveShadow = true;
  scene.add(base);

  // Vitrine transparente em vidro
  const vitrine = new THREE.Mesh(
    new THREE.CylinderGeometry(raioVitrine, raioVitrine, alturaVitrine, 64, 1, true),
    vitrineMaterial
  );
  vitrine.position.set(posX, alturaPedestal + alturaVitrine / 2, posZ);
  vitrine.castShadow = vitrine.receiveShadow = true;
  scene.add(vitrine);

  // Gema luminosa suspensa
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 1),
    gemaMaterial
  );
  gema.position.set(posX, alturaPedestal + alturaVitrine / 2, posZ);
  scene.add(gema);
}

// Posições nos extremos do círculo central, ajustadas para ficar encostadas às paredes
const raioCubo = config.circleRadius + 2.1;

criarPedestalComVitrine(-raioCubo, -raioCubo); // Frente esquerda
criarPedestalComVitrine(raioCubo, -raioCubo);  // Frente direita
criarPedestalComVitrine(-raioCubo, raioCubo);  // Fundo esquerda
criarPedestalComVitrine(raioCubo, raioCubo);   // Fundo direita
// ==================== BLOCO 10 — CÍRCULO DE LUZ CENTRAL ====================

const circuloLuzGeometry = new THREE.RingGeometry(
  config.circleRadius + 0.6, // raio interior
  config.circleRadius + 1.3, // raio exterior
  64
);

const circuloLuzMaterial = new THREE.MeshStandardMaterial({
  color: 0xffdca0,                  // dourado claro suave
  emissive: 0xffc878,               // brilho interior quente
  emissiveIntensity: 1.15,
  roughness: 0.4,
  metalness: 0.3,
  transparent: true,
  opacity: 0.36,
  side: THREE.DoubleSide
});

const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.y = 0.005; // ligeiramente acima do chão reflectivo para evitar z-fighting
scene.add(circuloLuz);
// ==================== BLOCO 11 — OBRAS CIRCULARES SUSPENSAS ====================

const obrasNormais = [];

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
    ano: '2023',
    descricao: 'Descrição da Obra 2.',
    preco: '0.6',
    imagem: 'assets/obras/obra2.jpg'
  },
  {
    id: 'obra3',
    titulo: 'Obra 3',
    artista: 'Artista C',
    ano: '2025',
    descricao: 'Descrição da Obra 3.',
    preco: '0.45',
    imagem: 'assets/obras/obra3.jpg'
  },
  {
    id: 'obra4',
    titulo: 'Obra 4',
    artista: 'Artista D',
    ano: '2022',
    descricao: 'Descrição da Obra 4.',
    preco: '0.55',
    imagem: 'assets/obras/obra4.jpg'
  },
  {
    id: 'obra5',
    titulo: 'Obra 5',
    artista: 'Artista E',
    ano: '2021',
    descricao: 'Descrição da Obra 5.',
    preco: '0.65',
    imagem: 'assets/obras/obra5.jpg'
  },
  {
    id: 'obra6',
    titulo: 'Obra 6',
    artista: 'Artista F',
    ano: '2021',
    descricao: 'Descrição da Obra 6.',
    preco: '0.42',
    imagem: 'assets/obras/obra6.jpg'
  },
  {
    id: 'obra7',
    titulo: 'Obra 7',
    artista: 'Artista G',
    ano: '2020',
    descricao: 'Descrição da Obra 7.',
    preco: '0.48',
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
        obra.userData = { dados, index: i };

        scene.add(obra);
        obrasNormais.push(obra);
        updateLoadingProgress();
      },
      undefined,
      (error) => {
        console.error(`Erro ao carregar imagem da obra ${dados.titulo}:`, error);

        const obra = new THREE.Mesh(
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
        obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
        obra.lookAt(0, 4.2, 0);
        obra.userData = { dados, index: i };

        scene.add(obra);
        obrasNormais.push(obra);
        updateLoadingProgress();
      }
    );
  });
}
// ==================== BLOCO 12 — ANIMAÇÃO CIRCULAR DAS OBRAS ====================

let anguloAtual = 0;
const relogio = new THREE.Clock();
let obraDestacada = null;
let ambienteDesacelerado = false;

function animarObrasCirculares(delta) {
  if (!obraDestacada) {
    anguloAtual += velocidadeObras * delta;
  }

  const raio = config.circleRadius;

  obrasNormais.forEach((obra, i) => {
    const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
    obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
    obra.lookAt(0, 4.2, 0);
  });
}
// ==================== BLOCO 13 — DETECÇÃO DE CLIQUE NAS OBRAS ====================

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (obraDestacada) return; // impedir clique duplo

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(obrasNormais);
  if (intersects.length > 0) {
    const obraClicada = intersects[0].object;
    destacarObra(obraClicada);
  }
});
// ==================== BLOCO 14 — ELEMENTOS DO MODAL DE OBRA DESTACADA ====================

// Overlay de fundo desfocado
const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  backdrop-filter: blur(6px); background-color: rgba(0,0,0,0.4);
  z-index: 50; display: none;
`;
document.body.appendChild(overlay);

// Painel informativo
const infoPanel = document.createElement('div');
infoPanel.style.cssText = `
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, 0);
  margin-top: calc(260px + 10px); padding: 20px;
  background: rgba(255,255,255,0.07); backdrop-filter: blur(4px);
  border-radius: 12px; color: #fffbe6; font-family: Georgia, serif;
  text-align: center; z-index: 60; display: none; max-width: 320px;
`;
infoPanel.innerHTML = `
  <div id="art-title" style="font-size: 1.6em; font-weight: bold;"></div>
  <div id="art-artist" style="margin-top: 6px;"></div>
  <div id="art-year" style="margin-top: 2px;"></div>
  <div id="art-description" style="margin-top: 10px; font-style: italic;"></div>
  <div id="art-price" style="margin-top: 10px; font-weight: bold;"></div>
  <button id="buy-art" style="
    margin-top: 16px; padding: 10px 18px;
    background-color: #d8b26c; color: #111;
    border: none; border-radius: 6px;
    font-size: 1em; cursor: pointer;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
  ">Buy</button>
`;
document.body.appendChild(infoPanel);

// Referência aos elementos do modal para uso posterior
const modalElements = {
  titulo: infoPanel.querySelector('#art-title'),
  artista: infoPanel.querySelector('#art-artist'),
  ano: infoPanel.querySelector('#art-year'),
  descricao: infoPanel.querySelector('#art-description'),
  preco: infoPanel.querySelector('#art-price'),
  botao: infoPanel.querySelector('#buy-art')
};
// ==================== BLOCO 15 — FUNÇÃO DESTACAR OBRA CIRCULAR ====================

function destacarObra(obra) {
  if (obraDestacada) return;

  obraDestacada = obra;
  ambienteDesacelerado = true;

  const dados = obra.userData.dados;

  // Mostrar modal e overlay
  overlay.style.display = 'block';
  infoPanel.style.display = 'block';

  modalElements.titulo.textContent = dados.titulo;
  modalElements.artista.textContent = dados.artista;
  modalElements.ano.textContent = dados.ano;
  modalElements.descricao.textContent = dados.descricao || 'Obra em destaque na galeria NANdART.';
  modalElements.preco.textContent = `${dados.preco} ETH`;

  // Animações com GSAP
  gsap.to(obra.scale, { x: 2, y: 2, z: 2, duration: 0.8, ease: 'power2.out' });

  gsap.to(obra.position, {
    x: 0,
    y: 6.5,
    z: 0,
    duration: 0.9,
    ease: 'power2.inOut'
  });

  // Reposicionar a câmara para foco na obra destacada
  gsap.to(camera.position, {
    x: 0,
    y: 7.2,
    z: 6.5,
    duration: 1.1,
    ease: 'power2.inOut'
  });
}
// ==================== BLOCO 16 — FECHAR MODAL AO CLICAR FORA ====================

window.addEventListener('pointerdown', e => {
  if (!obraDestacada || infoPanel.contains(e.target)) return;
  fecharObraDestacada();
});

function fecharObraDestacada() {
  if (!obraDestacada) return;

  // Animar regresso da obra à sua posição normal
  gsap.to(obraDestacada.scale, { x: 1, y: 1, z: 1, duration: 0.6 });

  gsap.to(obraDestacada.position, {
    y: 4.2,
    duration: 0.6,
    onComplete: () => {
      overlay.style.display = 'none';
      infoPanel.style.display = 'none';
      obraDestacada = null;
      ambienteDesacelerado = false;
    }
  });

  // Restaurar posição original da câmara
  gsap.to(camera.position, {
    x: 0,
    y: config.cameraY,
    z: config.cameraZ,
    duration: 0.8
  });
}
// ==================== BLOCO 17 — BOTÃO "BUY" — TRANSACÇÃO EM ETH ====================

modalElements.botao.addEventListener('click', async () => {
  if (!obraDestacada?.userData?.dados) {
    alert('Erro: dados da obra não encontrados.');
    return;
  }

  if (!window.ethereum) {
    alert('Por favor instala a MetaMask para poderes adquirir esta obra.');
    return;
  }

  try {
    const dados = obraDestacada.userData.dados;

    // Solicitar ligação à carteira
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Criar e enviar transacção
    const tx = await signer.sendTransaction({
      to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41', // Endereço da galeria
      value: ethers.parseEther(dados.preco)
    });

    alert(`Transacção enviada!\nHash: ${tx.hash}`);
    await tx.wait();

    alert('Compra confirmada! Obrigado pela tua aquisição.');
    fecharObraDestacada();

  } catch (err) {
    console.error('❌ Erro durante a compra:', err);
    alert('Ocorreu um erro ao tentar comprar esta obra. Verifica a tua carteira e tenta novamente.');
  }
});
// ==================== BLOCO 18 — CUBOS SUSPENSOS COM GEMAS ====================

const cubosSuspensos = [];

function criarCuboSuspenso(obra, indice) {
  const tamanhoCubo = 1.5;

  const materialCubo = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    transparent: true,
    opacity: 0.18,
    roughness: 0.25,
    metalness: 0.5,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    reflectivity: 0.3
  });

  const cubo = new THREE.Mesh(
    new THREE.BoxGeometry(tamanhoCubo, tamanhoCubo, tamanhoCubo),
    materialCubo
  );
  cubo.castShadow = cubo.receiveShadow = true;

  // Posições elevadas sobre o círculo de luz (variação poética)
  const altura = 8.2;
  const posicoes = [
    { x: -5, y: altura, z: 0 },
    { x: 5, y: altura, z: 0 },
    { x: -5, y: altura, z: -5 },
    { x: 5, y: altura, z: -5 }
  ];
  const pos = posicoes[indice % posicoes.length];
  cubo.position.set(pos.x, pos.y, pos.z);

  // Carregamento da gema interior com textura da obra
  textureLoader.load(
    obra.imagem,
    (texture) => {
      const gema = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.6, 1),
        new THREE.MeshStandardMaterial({
          map: texture,
          emissive: 0x3399cc,
          emissiveIntensity: 2.0,
          transparent: true,
          opacity: 0.9
        })
      );
      cubo.add(gema);
      updateLoadingProgress();
    },
    undefined,
    (error) => {
      console.error(`Erro ao carregar textura da obra no cubo (${obra.titulo}):`, error);
      const gema = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.6, 1),
        new THREE.MeshStandardMaterial({
          color: 0x3399cc,
          emissive: 0x3399cc,
          emissiveIntensity: 2.0,
          transparent: true,
          opacity: 0.9
        })
      );
      cubo.add(gema);
      updateLoadingProgress();
    }
  );

  // Registo para interacções futuras
  cubo.userData = { obra };
  cubosSuspensos.push(cubo);
  scene.add(cubo);

  // Comportamento em pré-venda — clique sugere ligação de carteira
  cubo.onClick = () => {
    if (!walletAddress) {
      alert('Esta obra encontra-se em pré-venda. Liga a tua carteira para participar.');
    } else {
      abrirModal(obra, cubo);
    }
  };

  return cubo;
}
// ==================== BLOCO 19 — MIGRAÇÃO DE OBRAS DOS CUBOS ====================

// URL do backend onde está o Express no Render
const BACKEND_URL = 'https://nandart-3d.onrender.com';

// Regista a entrada de uma obra suspensa no backend
async function registarEntradaBackend(obraId) {
  try {
    const resposta = await fetch(`${BACKEND_URL}/api/entradas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ obraId })
    });

    if (!resposta.ok) {
      throw new Error(`Resposta não OK: ${resposta.status}`);
    }

    const json = await resposta.json();
    const dataFormatada = new Date(json.data).toLocaleDateString('pt-PT');
    console.log(`📌 Entrada registada: ${obraId} → ${dataFormatada}`);
  } catch (err) {
    console.error(`❌ Erro ao registar entrada da obra ${obraId}:`, err.message || err);
  }
}

// Verifica obras suspensas e migra após 30 dias
async function verificarMigracoesBackend() {
  for (const obra of obrasSuspensas) {
    try {
      const resposta = await fetch(`${BACKEND_URL}/api/entradas/${obra.id}`);

      if (!resposta.ok) {
        console.warn(`ℹ️ Obra ${obra.id} ainda não tem entrada ou resposta inválida.`);
        continue;
      }

      const { data } = await resposta.json();
      const diasPassados = (Date.now() - Number(data)) / (1000 * 60 * 60 * 24);

      if (diasPassados >= 30) {
        console.log(`⏳ Obra ${obra.id} ultrapassou 30 dias. Migrando para o círculo central...`);
        migrarParaCirculo(obra);

        const apagar = await fetch(`${BACKEND_URL}/api/entradas/${obra.id}`, {
          method: 'DELETE'
        });

        if (apagar.ok) {
          console.log(`🗑️ Entrada da obra ${obra.id} removida do backend.`);
        } else {
          console.warn(`⚠️ Não foi possível remover a entrada da obra ${obra.id}`);
        }
      }
    } catch (err) {
      console.error(`❌ Erro ao verificar/migrar a obra ${obra.id}:`, err.message || err);
    }
  }
}

// ==================== BLOCO 20 — MIGRAR OBRA PARA O CÍRCULO ROTATIVO ====================

function migrarParaCirculo(obra) {
  const tamanho = config.obraSize;

  const textura = textureLoader.load(obra.imagem, updateLoadingProgress);

  const novaObra = new THREE.Mesh(
    new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true
    })
  );

  const index = obrasNormais.length;
  const angulo = (index / (obrasNormais.length + 1)) * Math.PI * 2;

  novaObra.position.set(
    Math.cos(angulo) * config.circleRadius,
    4.2,
    Math.sin(angulo) * config.circleRadius
  );
  novaObra.lookAt(0, 4.2, 0);

  novaObra.userData = { dados: obra, index };
  scene.add(novaObra);
  obrasNormais.push(novaObra);
}
// ==================== BLOCO 21 — INICIALIZAÇÃO FINAL DA GALERIA ====================

function iniciarGaleria() {
  // Obras normais suspensas em rotação
  criarObrasNormais();

  // Cubos suspensos com obras em pré-venda
  obrasSuspensas.forEach((obra, idx) => {
    criarCuboSuspenso(obra, idx);
    registarEntradaBackend(obra.id);
  });

  // Verificar se alguma obra ultrapassou o tempo de suspensão
  verificarMigracoesBackend();
}

// Inicia ao carregar a página
window.addEventListener('load', iniciarGaleria);
// ==================== BLOCO 22 — ANIMAÇÃO GLOBAL DA CENA ====================

function animate() {
  requestAnimationFrame(animate);

  const delta = relogio.getDelta();

  // Animação das obras rotativas
  animarObrasCirculares(delta);

  // Renderização da cena
  renderer.render(scene, camera);
}

// Inicia o loop de animação
animate();
