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

// Registo de plugins do GSAP
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Variáveis globais principais
let config;
let obraDestacada = null;
let ambienteDesacelerado = false;
const obrasNormais = [];
const cubosSuspensos = [];
const relogio = new THREE.Clock();
let anguloAtual = 0;

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

// Profundidade de desfoque aplicada apenas ao fundo
let efeitoDesfoque = null;

// Nome da galeria para ser fixado na parede de fundo
const nomeGaleria = "NANdART";

// Caminho para os ícones a fixar na parede de fundo
const iconeMenu = 'assets/icons/horizontes.png';
const iconeInfo = 'assets/icons/info.png';
const iconeAjuda = 'assets/icons/ajuda-flutuante.png';
// ==================== BLOCO 2 — VIEWPORT, CONFIGURAÇÕES E RENDERER ====================

// Configurações adaptativas por viewport
const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 22, cameraY: 7.8, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 24, cameraY: 8.3, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 26, cameraY: 8.9, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 28, cameraY: 9.2, textSize: 0.55 }
};

function getViewportLevel() {
  const width = window.innerWidth;
  if (width < 480) return 'XS';
  if (width < 768) return 'SM';
  if (width < 1024) return 'MD';
  return 'LG';
}

config = configMap[getViewportLevel()];

// Carregamento silencioso com controlo de progresso
let loadedResources = 0;
const totalResources = 10 + obrasSuspensas.length;

function updateLoadingProgress() {
  loadedResources++;
  if (loadedResources >= totalResources) {
    console.log('🖼️ Recursos carregados silenciosamente.');
  }
}

// Loader de texturas com fallback
const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = updateLoadingProgress;
loadingManager.onError = url => console.warn(`⚠️ Falha ao carregar recurso: ${url}`);

const textureLoader = new THREE.TextureLoader(loadingManager);

// Renderizador com performance e realismo activado
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

// Cena 3D principal
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Câmara com ajustes refinados para profundidade total
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY + 1.6, config.cameraZ + 6.5);
  camera.lookAt(0, 6.5, -config.wallDistance + 0.4);
  camera.updateProjectionMatrix();
}
updateCamera();

// ==================== REAJUSTE COMPLETO AO REDIMENSIONAMENTO DA JANELA ====================

let resizeTimeout;

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Atualiza câmara e renderer
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Se houver uma obra destacada e o modal estiver visível, reposiciona-o
    if (obraDestacada && infoPanel?.style?.display === 'block') {
      const bounding = obraDestacada.position.clone().project(camera);
      const centerX = (bounding.x * 0.5 + 0.5) * window.innerWidth;
      const centerY = (1 - (bounding.y * 0.5 + 0.5)) * window.innerHeight;

      const larguraObra = 260; // Ajusta conforme necessário
      infoPanel.style.left = `${centerX - larguraObra / 2}px`;
      infoPanel.style.top = `${centerY + 160}px`;
      infoPanel.style.width = `${larguraObra}px`;
    }
  }, 200);
});

// ==================== BLOCO 3 — LUZES, CÂMARA E CHÃO REFLECTIVO ====================

// Luz ambiente suave e quente — revela texturas sem queimar tons
const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.4); // luz quente equilibrada
scene.add(ambientLight);

// Luz direcional principal — incide diagonalmente com sombras longas
const directionalLight = new THREE.DirectionalLight(0xfff5cc, 1.0); // tom quente
directionalLight.position.set(4, 15, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.bias = -0.0005;
scene.add(directionalLight);

// Luz lateral esquerda — reforça volume dos frisos e obras
const fillLeft = new THREE.DirectionalLight(0xfff1cc, 0.55);
fillLeft.position.set(-10, 9, 3);
fillLeft.castShadow = true;
scene.add(fillLeft);

// Luz lateral direita — complementa e equilibra reflexos
const fillRight = new THREE.DirectionalLight(0xfff1cc, 0.55);
fillRight.position.set(10, 9, -3);
fillRight.castShadow = true;
scene.add(fillRight);

// Spot cénico suave no centro do círculo de luz
const spotCentral = new THREE.SpotLight(0xfff0d5, 1.2, 25, Math.PI / 6, 0.3, 1);
spotCentral.position.set(0, 15, 0);
spotCentral.target.position.set(0, 0, 0);
spotCentral.castShadow = true;
spotCentral.shadow.mapSize.width = 1024;
spotCentral.shadow.mapSize.height = 1024;
scene.add(spotCentral);
scene.add(spotCentral.target);

// 🔁 Reforço: toda a iluminação foi ajustada com base na imagem de layout enviada,
// garantindo que o ambiente seja claro mas atmosférico, quente mas sem saturação,
// e que todos os elementos tridimensionais tenham presença e contraste.
// ==================== BLOCO 4 — PAREDES E CHÃO COM TEXTURAS REALISTAS ====================

// Geometrias das paredes (uma de fundo e duas laterais)
const paredeGeoFundo = new THREE.BoxGeometry(42, 29, 0.4);
const paredeGeoLateral = new THREE.BoxGeometry(30, 29, 0.4);

// Texturas das paredes
const texturaParede = textureLoader.load('assets/antracite-realista.jpg', updateLoadingProgress);
const normalParede = textureLoader.load('assets/antracite-normal.jpg', updateLoadingProgress);

// Função para aplicar texturas realistas a todas as paredes
function aplicarTexturaParede(textura, normalMap = null) {
  const paredeMaterial = new THREE.MeshStandardMaterial({
    map: textura || null,
    normalMap: normalMap || null,
    normalScale: new THREE.Vector2(1.4, 1.4),
    color: 0xffffff,
    emissive: 0x111111,
    emissiveIntensity: 0.28,
    roughness: 0.58,
    metalness: 0.18
  });

  // Parede de fundo
  const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial.clone());
  paredeFundo.position.set(0, 14.6, -config.wallDistance - 5.2);
  paredeFundo.receiveShadow = true;
  scene.add(paredeFundo);

  // Parede lateral esquerda
  const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial.clone());
  paredeEsquerda.position.set(-16.7, 14.5, -config.wallDistance / 2);
  paredeEsquerda.rotation.y = Math.PI / 2;
  paredeEsquerda.receiveShadow = true;
  scene.add(paredeEsquerda);

  // Parede lateral direita
  const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial.clone());
  paredeDireita.position.set(16.7, 14.5, -config.wallDistance / 2);
  paredeDireita.rotation.y = -Math.PI / 2;
  paredeDireita.receiveShadow = true;
  scene.add(paredeDireita);
}
aplicarTexturaParede(texturaParede, normalParede);
// ==================== BLOCO 5 — CHÃO EM MÁRMORE PRETO POLIDO COM FALLBACK INLINE ====================

const base64MarbleTexture = "data:image/png;base64,iVBORw0KGgoAAA..."; // Base64 completo inline

const textureMarble = new THREE.TextureLoader().load(
  'assets/marble-polished.jpg',
  () => {
    console.log('✅ Textura externa de mármore carregada com sucesso.');

    const floorGeometry = new THREE.PlaneGeometry(80, 80);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: textureMarble,
      metalness: 0.4,
      roughness: 0.08,
      emissive: new THREE.Color(0x111111),
      emissiveIntensity: 0.12
    });

    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.03;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
  },
  undefined,
  () => {
    console.warn('⚠️ Falha na textura externa. A aplicar fallback embutido.');

    const image = new Image();
    image.src = base64MarbleTexture;
    const fallbackTexture = new THREE.Texture(image);
    image.onload = () => {
      fallbackTexture.needsUpdate = true;

      const floorGeometry = new THREE.PlaneGeometry(80, 80);
      const floorMaterial = new THREE.MeshStandardMaterial({
        map: fallbackTexture,
        metalness: 0.4,
        roughness: 0.08,
        emissive: new THREE.Color(0x111111),
        emissiveIntensity: 0.12
      });

      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.y = -0.03;
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);
    };
  }
);
// ==================== BLOCO 6 — FRISOS DECORATIVOS ====================

// Material dourado para frisos decorativos
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21, // dourado vivo fiel ao layout
  metalness: 0.7,
  roughness: 0.3,
  emissive: 0x000000,
  emissiveIntensity: 0.1
});

// Friso central arredondado
function criarFrisoCentral(x, y, z, largura, altura) {
  const raio = 0.3;
  const espessura = 0.02;

  const forma = new THREE.Shape();
  forma.moveTo(-largura / 2 + raio, -altura / 2);
  forma.lineTo(largura / 2 - raio, -altura / 2);
  forma.quadraticCurveTo(largura / 2, -altura / 2, largura / 2, -altura / 2 + raio);
  forma.lineTo(largura / 2, altura / 2 - raio);
  forma.quadraticCurveTo(largura / 2, altura / 2, largura / 2 - raio, altura / 2);
  forma.lineTo(-largura / 2 + raio, altura / 2);
  forma.quadraticCurveTo(-largura / 2, altura / 2, -largura / 2, altura / 2 - raio);
  forma.lineTo(-largura / 2, -altura / 2 + raio);
  forma.quadraticCurveTo(-largura / 2, -altura / 2, -largura / 2 + raio, -altura / 2);

  const extrudeConfig = { depth: espessura, bevelEnabled: false };
  const geometria = new THREE.ExtrudeGeometry(forma, extrudeConfig);
  const friso = new THREE.Mesh(geometria, frisoMaterial);
  friso.position.set(x, y, z);
  scene.add(friso);
}
criarFrisoCentral(0, 11.2, -config.wallDistance - 5.17, 5.2, 6.3);

// Friso horizontal simples
function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, 0.02),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  scene.add(friso);
}

// Friso vertical embutido com dupla camada
function criarFrisoDuploVertical(x, y, z, altura, lado) {
  const offset = lado === 'esquerda' ? -0.4 : 0.4;

  // Exterior largo
  const externo = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, altura, 0.02),
    frisoMaterial
  );
  externo.position.set(x, y, z);
  externo.rotation.y = lado === 'esquerda' ? Math.PI / 2 : -Math.PI / 2;
  scene.add(externo);

  // Interior estreito
  const interno = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, altura - 0.4, 0.02),
    frisoMaterial
  );
  interno.position.set(x + offset, y, z + 0.01);
  interno.rotation.y = externo.rotation.y;
  scene.add(interno);
}

// 1. Frisos horizontais inferiores da parede de fundo
criarFrisoLinha(0, 1.6, -config.wallDistance - 5.18, 42);
criarFrisoLinha(0, 2.2, -config.wallDistance - 5.18, 42);

// 2. Frisos horizontais inferiores das paredes laterais
criarFrisoLinha(-16.7, 1.6, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
criarFrisoLinha(-16.7, 2.2, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
criarFrisoLinha(16.7, 1.6, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);
criarFrisoLinha(16.7, 2.2, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);

// 3. Frisos verticais embutidos (esquerda e direita)
criarFrisoDuploVertical(-16.7, 14.5, -config.wallDistance / 2, 7.5, 'esquerda');
criarFrisoDuploVertical(16.7, 14.5, -config.wallDistance / 2, 7.5, 'direita');

// ==================== BLOCO 23 — ÍCONES FIXOS NA PAREDE DE FUNDO ====================

const icones = [
  {
    imagem: 'assets/icons/horizontes.png', // Menu
    largura: 1.8,
    altura: 1.2,
    posicao: new THREE.Vector3(-6.2, 22.2, -config.wallDistance - 5.19)
  },
  {
    imagem: 'assets/icons/info.png', // Info
    largura: 1.6,
    altura: 1.1,
    posicao: new THREE.Vector3(-6.2, 23.6, -config.wallDistance - 5.19)
  },
  {
    imagem: 'assets/icons/metamask.svg', // Connect Wallet
    largura: 1.7,
    altura: 1.3,
    posicao: new THREE.Vector3(6.2, 22.6, -config.wallDistance - 5.19)
  }
];

// Função para carregar e aplicar os ícones como planos fixos à parede
icones.forEach(({ imagem, largura, altura, posicao }) => {
  textureLoader.load(
    imagem,
    (textura) => {
      const plano = new THREE.Mesh(
        new THREE.PlaneGeometry(largura, altura),
        new THREE.MeshBasicMaterial({
          map: textura,
          transparent: true,
          side: THREE.DoubleSide
        })
      );
      plano.position.copy(posicao);
      scene.add(plano);
    },
    undefined,
    () => {
      console.warn(`⚠️ Falha ao carregar o ícone: ${imagem}`);
    }
  );
});

// ==================== BLOCO 7 — PEDESTAIS E VITRINES FIEIS AO LAYOUT ====================

// Material escuro para a estrutura dos pedestais
const pedestalMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2b2b,
  roughness: 0.5,
  metalness: 0.25
});

// Material translúcido para as vitrines
const vitrineMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x1a1a1a,
  metalness: 0.1,
  roughness: 0,
  transparent: true,
  opacity: 0.18,
  transmission: 1,
  thickness: 0.25,
  reflectivity: 0.5,
  clearcoat: 1,
  clearcoatRoughness: 0.1
});

// Material da gema luminosa
const gemaMaterial = new THREE.MeshStandardMaterial({
  color: 0x33ccff,
  emissive: 0x33ccff,
  emissiveIntensity: 1.8,
  roughness: 0.1,
  metalness: 0.3,
  transparent: true,
  opacity: 0.85
});

// Função para criar um pedestal com vitrine e gema
function criarPedestalRetangular(posX, posZ) {
  const largura = 0.8;
  const profundidade = 0.8;
  const alturaPedestal = 1.5;
  const alturaVitrine = 1.3;

  // Estrutura do pedestal
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(largura, alturaPedestal, profundidade),
    pedestalMaterial
  );
  base.position.set(posX, alturaPedestal / 2, posZ);
  base.castShadow = base.receiveShadow = true;
  scene.add(base);

  // Vitrine translúcida
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(largura * 0.9, alturaVitrine, profundidade * 0.9),
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

// Posições baseadas no raio do círculo central
const deslocamento = config.circleRadius + 3.3;

criarPedestalRetangular(-deslocamento, -deslocamento); // Frente esquerda
criarPedestalRetangular(deslocamento, -deslocamento);  // Frente direita
criarPedestalRetangular(-deslocamento, deslocamento);  // Fundo esquerda
criarPedestalRetangular(deslocamento, deslocamento);   // Fundo direita
// ==================== BLOCO 8 — CÍRCULO DE LUZ CENTRAL NO CHÃO ====================

// Geometria do círculo central de luz — borda suave com abertura interior
const circuloLuzGeometry = new THREE.RingGeometry(
  config.circleRadius + 0.6,  // raio interior
  config.circleRadius + 1.4,  // raio exterior
  64
);

// Material com luz quente e natural
const circuloLuzMaterial = new THREE.MeshStandardMaterial({
  color: 0xffe8c4,               // tom quente alaranjado
  emissive: 0xffe8c4,
  emissiveIntensity: 0.9,
  roughness: 0.4,
  metalness: 0.1,
  transparent: true,
  opacity: 0.48,
  side: THREE.DoubleSide
});

// Criação do círculo de luz no centro do chão
const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.y = 0.00002; // ligeiramente acima do chão para evitar z-fighting
scene.add(circuloLuz);

// Friso horizontal logo após o círculo — define o perímetro dourado
const frisoChao = new THREE.Mesh(
  new THREE.BoxGeometry(config.circleRadius * 2 + 2.5, 0.04, 0.02),
  frisoMaterial
);
frisoChao.position.set(0, 0.0055, -config.wallDistance / 2 + 0.2);
scene.add(frisoChao);
// ==================== BLOCO 9 — CRIAÇÃO DAS OBRAS CIRCULARES SUSPENSAS ====================

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

// Criação das obras normais que orbitam no centro da galeria
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
// ==================== BLOCO 10 — ANIMAÇÃO CONTÍNUA DAS OBRAS CIRCULARES ====================

const velocidadeObras = 0.20;

// Função que anima a rotação circular das obras normais
function animarObrasCirculares(delta) {
  // Apenas roda o sistema se não houver obra destacada
  if (!obraDestacada) {
    anguloAtual += velocidadeObras * delta;
  } else if (ambienteDesacelerado) {
    // Se houver obra em destaque, as restantes rodam mais devagar
    anguloAtual += (velocidadeObras * 0.10) * delta;
  }

  const raio = config.circleRadius;

  obrasNormais.forEach((obra, i) => {
    // Se for a obra destacada, mantém-se fixa
    if (obra === obraDestacada) return;

    const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
    obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
    obra.lookAt(0, 4.2, 0);
  });
}
// ==================== BLOCO 11 — DETECÇÃO DE CLIQUE NAS OBRAS CIRCULARES ====================

// Evento de pointerdown para detectar interacção do utilizador (clique ou toque)
renderer.domElement.addEventListener('pointerdown', (e) => {
  // Ignora se já existir uma obra em destaque
  if (obraDestacada) return;

  // Converte a posição do clique para coordenadas normalizadas de ecrã
  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Detecta intersecções com as obras normais
  const intersects = raycaster.intersectObjects(obrasNormais, false);

  if (intersects.length > 0) {
    const obraClicada = intersects[0].object;
    destacarObra(obraClicada);
  }
});
// ==================== BLOCO 12 — FUNÇÃO DESTACAR OBRA CIRCULAR ====================

function destacarObra(obra) {
  if (obraDestacada) return; // Garante que apenas uma obra pode estar destacada

  obraDestacada = obra;
  ambienteDesacelerado = true;

  const dados = obra.userData.dados;

  // Oculta todas as outras obras enquanto esta está em destaque
  obrasNormais.forEach(o => {
    if (o !== obra) o.visible = false;
  });

  // Animação para mover a obra até ao centro da cena
  gsap.to(obra.position, {
    x: 0,
    y: 6.5,
    z: 0,
    duration: 1.1,
    ease: 'power2.inOut',
    onUpdate: () => {
      obra.lookAt(new THREE.Vector3(0, 6.5, 0)); // Corrige a inclinação durante a animação
    },
    onComplete: () => {
      obra.lookAt(new THREE.Vector3(0, 6.5, 0)); // Garante orientação final
    }
  });

  // Escala a obra para dar-lhe maior presença visual
  gsap.to(obra.scale, {
    x: 2,
    y: 2,
    z: 2,
    duration: 0.9,
    ease: 'power2.out'
  });

  // Exibe o painel informativo após a transição visual
  setTimeout(() => {
    if (!overlay || !infoPanel) {
      overlay = document.getElementById('overlay');
      infoPanel = document.getElementById('info-panel');
      if (!overlay || !infoPanel) {
        console.error('❌ Elementos do modal não encontrados.');
        return;
      }
    }

    overlay.style.display = 'block';
    infoPanel.style.display = 'block';

    modalElements.titulo.textContent = dados.titulo;
    modalElements.artista.textContent = dados.artista;
    modalElements.ano.textContent = dados.ano;
    modalElements.descricao.textContent = dados.descricao || 'Obra em destaque na galeria NANdART.';
    modalElements.preco.textContent = `${dados.preco} ETH`;
  }, 1100);
  // Posicionamento milimétrico do modal abaixo da obra destacada
setTimeout(() => {
  if (!overlay || !infoPanel) {
    overlay = document.getElementById('overlay');
    infoPanel = document.getElementById('info-panel');
    if (!overlay || !infoPanel) {
      console.error('❌ Elementos do modal não encontrados.');
      return;
    }
  }

  overlay.style.display = 'block';
  infoPanel.style.display = 'block';

  modalElements.titulo.textContent = dados.titulo;
  modalElements.artista.textContent = dados.artista;
  modalElements.ano.textContent = dados.ano;
  modalElements.descricao.textContent = dados.descricao || 'Obra em destaque na galeria NANdART.';
  modalElements.preco.textContent = `${dados.preco} ETH`;

  // ⚙️ Alinhamento do modal com a obra destacada
  const bounding = obraDestacada?.material?.map?.image?.getBoundingClientRect?.() ||
                   document.querySelector('canvas')?.getBoundingClientRect();

  const obraScreenPos = obraDestacada?.position?.clone()?.project(camera);
  const centerX = (obraScreenPos.x * 0.5 + 0.5) * window.innerWidth;
  const centerY = (1 - (obraScreenPos.y * 0.5 + 0.5)) * window.innerHeight;

  const larguraObra = 260; // Ajustável consoante design (em px)

  infoPanel.style.position = 'absolute';
  infoPanel.style.left = `${centerX - larguraObra / 2}px`;
  infoPanel.style.top = `${centerY + 160}px`;
  infoPanel.style.width = `${larguraObra}px`;
}, 1100);

}
// ==================== BLOCO 13 — FECHAR MODAL AO CLICAR FORA ====================

// Fecha a obra destacada se o utilizador clicar fora do painel informativo
document.addEventListener('pointerdown', (e) => {
  if (!obraDestacada || !infoPanel || infoPanel.contains(e.target)) return;
  fecharObraDestacada();
});

// Função que repõe a obra na sua posição original na órbita
function fecharObraDestacada() {
  if (!obraDestacada) return;

  const obra = obraDestacada;
  const indexOriginal = obra.userData.index;
  const angulo = (indexOriginal / obrasNormais.length) * Math.PI * 2;

  // Animação para regressar à posição circular original
  gsap.to(obra.position, {
    x: Math.cos(angulo) * config.circleRadius,
    y: 4.2,
    z: Math.sin(angulo) * config.circleRadius,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete: () => {
      // Restaura a visibilidade das outras obras
      obrasNormais.forEach(o => o.visible = true);

      // Oculta o painel e o overlay
      overlay.style.display = 'none';
      infoPanel.style.display = 'none';

      obraDestacada = null;
      ambienteDesacelerado = false;
    }
  });

  // Reverte a escala da obra para o tamanho normal
  gsap.to(obra.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.6,
    ease: 'power2.out'
  });
}
// Projectar a posição da obra destacada no ecrã
const vector = new THREE.Vector3();
vector.copy(obra.position).project(camera);

// Converter para coordenadas de pixel
const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

// Calcular largura com base na escala atual e na distância à câmara
const escala = obra.scale.x; // assume proporção igual em x e y
const larguraObraPx = (config.obraSize * escala * renderer.domElement.height) / (camera.position.z * 0.75);

// Aplicar largura e posição ao modal
infoPanel.style.position = 'fixed';
infoPanel.style.width = `${larguraObraPx}px`;
infoPanel.style.left = `${x - larguraObraPx / 2}px`;
infoPanel.style.top = `${y + 20}px`; // 20px abaixo da obra
infoPanel.style.zIndex = '200';
infoPanel.style.transition = 'all 0.3s ease';
// ==================== BLOCO 15 — BOTÃO “BUY” E INTEGRAÇÃO COM METAMASK ====================

window.addEventListener('DOMContentLoaded', () => {
  // Associar elementos informativos do modal
  modalElements.titulo = document.getElementById('modal-titulo');
  modalElements.artista = document.getElementById('modal-artista');
  modalElements.ano = document.getElementById('modal-ano');
  modalElements.descricao = document.getElementById('modal-descricao');
  modalElements.preco = document.getElementById('modal-preco');

  const botaoBuy = document.getElementById('obra-buy');
  if (botaoBuy) {
    modalElements.botao = botaoBuy;

    botaoBuy.addEventListener('click', async () => {
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
        // Estado visual: a processar
        modalElements.botao.disabled = true;
        modalElements.botao.textContent = 'A processar...';

        // Solicitar ligação à carteira
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Enviar transacção de compra
        const tx = await signer.sendTransaction({
          to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41', // endereço da galeria
          value: ethers.parseEther(dados.preco)
        });

        // Confirmação visual
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
  } else {
    console.error('❌ Botão Buy não encontrado no DOM.');
  }
});
// ==================== BLOCO 16 — CRIAÇÃO E GESTÃO DE CUBOS SUSPENSOS ====================

// Função para criar cubo suspenso com gema luminosa e obra
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
  cubo.castShadow = true;
  cubo.receiveShadow = true;

  // Posições elevadas e etéreas sobre o círculo
  const altura = 8.2;
  const posicoes = [
    { x: -5, y: altura, z: 0 },
    { x: 5, y: altura, z: 0 },
    { x: -5, y: altura, z: -5 },
    { x: 5, y: altura, z: -5 }
  ];
  const pos = posicoes[indice % posicoes.length];
  cubo.position.set(pos.x, pos.y, pos.z);

  // Gema luminosa com imagem da obra
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
      gema.castShadow = true;
      gema.receiveShadow = true;
      cubo.add(gema);
      updateLoadingProgress();
    },
    undefined,
    () => {
      // Fallback visual em caso de falha na textura
      const gemaFallback = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.6, 1),
        new THREE.MeshStandardMaterial({
          color: 0x3399cc,
          emissive: 0x3399cc,
          emissiveIntensity: 2.0,
          transparent: true,
          opacity: 0.9
        })
      );
      gemaFallback.castShadow = true;
      gemaFallback.receiveShadow = true;
      cubo.add(gemaFallback);
      updateLoadingProgress();
    }
  );

  cubo.userData = { obra };
  cubosSuspensos.push(cubo);
  scene.add(cubo);

  return cubo;
}
// ==================== BLOCO 17 — REGISTO DAS ENTRADAS DE OBRAS SUSPENSAS NO BACKEND ====================

// URL do backend onde está alojado o servidor Express
const BACKEND_URL = 'https://nandart-3d.onrender.com';

// Regista a entrada de uma nova obra suspensa
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
// ==================== BLOCO 18 — VERIFICAÇÃO DE MIGRAÇÕES NO BACKEND ====================

async function verificarMigracoesBackend() {
  try {
    const resposta = await fetch(`${BACKEND_URL}/api/verificar-migracoes`);
    if (!resposta.ok) {
      throw new Error(`Resposta não OK: ${resposta.status}`);
    }

    const migracoes = await resposta.json();
    if (Array.isArray(migracoes)) {
      migracoes.forEach(obra => {
        migrarParaCirculo(obra);
      });
      console.log(`🔄 Migrações processadas: ${migracoes.length}`);
    }
  } catch (err) {
    console.error('❌ Erro ao verificar migrações no backend:', err.message || err);
  }
}
// ==================== BLOCO 19 — BOTÃO “CONNECT WALLET” COM LIGAÇÃO E DESCONEXÃO ====================

// Elemento visual do botão na interface
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

// Variável global para guardar o endereço da carteira ligada
let walletAddress = null;

// Atualiza o botão com estado actual e saldo (se ligado)
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

// Função para ligar a carteira MetaMask
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

// Função para desligar a carteira
function desligarCarteira() {
  walletAddress = null;
  localStorage.removeItem('walletConnected');
  atualizarEstadoCarteira();
}

// Alternância entre ligar/desligar ao clicar no botão
walletBtn.addEventListener('click', () => {
  if (walletAddress) {
    desligarCarteira();
  } else {
    conectarCarteira();
  }
});
// ==================== BLOCO 20 — PERSISTÊNCIA DA LIGAÇÃO DA CARTEIRA COM LOCALSTORAGE ====================

window.addEventListener('load', async () => {
  if (window.ethereum && localStorage.getItem('walletConnected') === 'true') {
    try {
      const contas = await window.ethereum.request({ method: 'eth_accounts' });

      if (contas.length > 0) {
        walletAddress = contas[0];
        atualizarEstadoCarteira();
      } else {
        // A carteira foi desligada fora do site — limpar estado
        localStorage.removeItem('walletConnected');
        walletAddress = null;
        atualizarEstadoCarteira();
      }
    } catch (err) {
      console.error('❌ Erro ao verificar ligação persistente da carteira:', err);
      localStorage.removeItem('walletConnected');
    }
  }
});
// ==================== BLOCO 21 — INICIALIZAÇÃO DA GALERIA 3D ====================

function iniciarGaleria() {
  // 1. Criar as obras normais do círculo rotativo
  criarObrasNormais();

  // 2. Adicionar cubos suspensos com obras em pré-venda
  obrasSuspensas.forEach((obra, idx) => {
    criarCuboSuspenso(obra, idx);
    registarEntradaBackend(obra.id);
  });

  // 3. Verificar se alguma obra ultrapassou o tempo de suspensão
  verificarMigracoesBackend();
}

// Executar ao carregar a página
window.addEventListener('load', iniciarGaleria);
// ==================== BLOCO 22 — FUNÇÃO DE ANIMAÇÃO CONTÍNUA ====================

function animate() {
  requestAnimationFrame(animate);

  const delta = relogio.getDelta(); // Tempo desde o último frame
  animarObrasCirculares(delta);    // Movimento circular das obras

  renderer.render(scene, camera);  // Render da cena completa
}

animate();
