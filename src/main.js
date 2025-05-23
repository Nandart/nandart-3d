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

// Elementos do modal (vão ser criados dinamicamente no DOM mais à frente)
let overlay, infoPanel;
const modalElements = {
  titulo: null,
  artista: null,
  ano: null,
  descricao: null,
  preco: null,
  botao: null
};
// ==================== BLOCO 2 — VIEWPORT, CONFIGURAÇÕES E RENDERER ====================

// Configurações adaptativas por viewport
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

// Renderizador configurado para performance e realismo
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

// Cena tridimensional
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Câmara — com posição adaptável
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY + 1.6, config.cameraZ + 6.5);
  camera.lookAt(0, 6.5, -config.wallDistance + 0.4);
  camera.updateProjectionMatrix();
}
updateCamera();

// Adaptação dinâmica ao redimensionamento da janela
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 200);
});
// ==================== BLOCO 3 — LUZES, CÂMARA E CHÃO REFLECTIVO ====================

// Luz ambiente — suavizada para manter definição
const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
scene.add(ambientLight);

// Luz direcional frontal — suavizada para preservar detalhes das texturas
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
directionalLight.position.set(0, 16, 12);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Luzes de preenchimento laterais — reduzidas para evitar realces exagerados
const fillLeft = new THREE.DirectionalLight(0xffffff, 0.6);
fillLeft.position.set(-8, 8, 4);
fillLeft.castShadow = true;
scene.add(fillLeft);

const fillRight = new THREE.DirectionalLight(0xffffff, 0.6);
fillRight.position.set(8, 8, -4);
fillRight.castShadow = true;
scene.add(fillRight);

// Luz cénica superior — mantida mas com intensidade menor para atmosfera sem sobreposição
const spotLight = new THREE.SpotLight(0xffffff, 1.0, 30, Math.PI / 5, 0.4, 1);
spotLight.position.set(0, 20, 5);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// ==================== BLOCO 4 — PAREDES E CHÃO COM TEXTURAS REALISTAS ====================

// Geometrias das paredes (definidas antes da função que as usa)
const paredeGeoFundo = new THREE.BoxGeometry(42, 29, 0.4);
const paredeGeoLateral = new THREE.BoxGeometry(30, 29, 0.4);

// Texturas das paredes
const texturaParede = textureLoader.load('assets/antracite-realista.jpg', updateLoadingProgress);
const normalParede = textureLoader.load('assets/antracite-normal.jpg', updateLoadingProgress);

// Função para aplicar texturas às paredes
function aplicarTexturaParede(textura, normalMap = null) {
  const paredeMaterial = new THREE.MeshStandardMaterial({
    map: textura || null,
    normalMap: normalMap || null,
    normalScale: new THREE.Vector2(1.4, 1.4),
    color: textura ? 0xffffff : 0x1a1a1a,
    emissive: 0x111111,
    emissiveIntensity: 0.28,
    roughness: 0.58,
    metalness: 0.18
  });

  const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial.clone());
  paredeFundo.position.set(0, 14.6, -config.wallDistance - 5.2);
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
}
aplicarTexturaParede(texturaParede, normalParede);

// ==================== CHÃO EM MÁRMORE PRETO POLIDO COM FALLBACK INLINE ====================

const base64MarbleTexture = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."; // sem quebras de linha

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

// Friso arredondado ao centro da parede de fundo
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

  const extrudeConfig = {
    depth: espessura,
    bevelEnabled: false
  };

  const geometria = new THREE.ExtrudeGeometry(forma, extrudeConfig);
  const friso = new THREE.Mesh(geometria, frisoMaterial);
  friso.position.set(x, y, z);
  scene.add(friso);
}

criarFrisoCentral(0, 11.2, -config.wallDistance - 5.17, 5.2, 6.3);
// ==================== BLOCO 6 — FRISOS DECORATIVOS ====================

// Friso horizontal — barra simples
function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, 0.02),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  scene.add(friso);
}

// Friso vertical duplo embutido — camada exterior e interior
function criarFrisoDuploVertical(x, y, z, altura, lado) {
  const offset = lado === 'esquerda' ? -0.4 : 0.4;

  // Camada exterior — mais larga
  const externo = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, altura, 0.02),
    frisoMaterial
  );
  externo.position.set(x, y, z);
  externo.rotation.y = lado === 'esquerda' ? Math.PI / 2 : -Math.PI / 2;
  scene.add(externo);

  // Camada interior — mais estreita
  const interno = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, altura - 0.4, 0.02),
    frisoMaterial
  );
  interno.position.set(x + offset, y, z + 0.01);
  interno.rotation.y = externo.rotation.y;
  scene.add(interno);
}

// 1. Frisos horizontais inferiores — parede de fundo (duplo traço contínuo)
criarFrisoLinha(0, 1.6, -config.wallDistance - 5.18, 42);     // linha inferior
criarFrisoLinha(0, 2.2, -config.wallDistance - 5.18, 42);     // linha superior

// 2. Frisos horizontais inferiores — parede lateral esquerda
criarFrisoLinha(-16.7, 1.6, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
criarFrisoLinha(-16.7, 2.2, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);

// 3. Frisos horizontais inferiores — parede lateral direita
criarFrisoLinha(16.7, 1.6, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);
criarFrisoLinha(16.7, 2.2, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);

// 4. Frisos verticais embutidos — dupla camada em ambas as laterais
criarFrisoDuploVertical(-16.7, 14.5, -config.wallDistance / 2, 7.5, 'esquerda');
criarFrisoDuploVertical(16.7, 14.5, -config.wallDistance / 2, 7.5, 'direita');
// ==================== BLOCO 7 — PEDESTAIS E VITRINES FIEIS AO LAYOUT ====================

// Materiais
const pedestalMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2b2b,
  roughness: 0.5,
  metalness: 0.25
});

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

const gemaMaterial = new THREE.MeshStandardMaterial({
  color: 0x33ccff,
  emissive: 0x33ccff,
  emissiveIntensity: 1.8,
  roughness: 0.1,
  metalness: 0.3,
  transparent: true,
  opacity: 0.85
});

// Função para criar pedestais com vitrine e gema luminosa
function criarPedestalRetangular(posX, posZ) {
  const largura = 0.8;
  const profundidade = 0.8;
  const alturaPedestal = 1.5;
  const alturaVitrine = 1.3;

  // Estrutura base
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

  // Gema suspensa dentro da vitrine
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 1),
    gemaMaterial
  );
  gema.position.set(posX, alturaPedestal + alturaVitrine / 2, posZ);
  scene.add(gema);
}

// Posicionamento nas quatro extremidades do círculo de luz
const deslocamento = config.circleRadius + 3.3;

criarPedestalRetangular(-deslocamento, -deslocamento); // Frente esquerda
criarPedestalRetangular(deslocamento, -deslocamento);  // Frente direita
criarPedestalRetangular(-deslocamento, deslocamento);  // Fundo esquerda
criarPedestalRetangular(deslocamento, deslocamento);   // Fundo direita
// ==================== BLOCO 8 — CÍRCULO DE LUZ CENTRAL NO CHÃO ====================

// Geometria do círculo de luz — halo dourado suave e elegante
const circuloLuzGeometry = new THREE.RingGeometry(
  config.circleRadius + 0.6,  // raio interior
  config.circleRadius + 1.4,  // raio exterior
  64
);

// Material dourado com brilho etéreo
const circuloLuzMaterial = new THREE.MeshStandardMaterial({
  color: 0xf6e9c2,              // tom quente e elegante (dourado claro)
  emissive: 0xf6e9c2,
  emissiveIntensity: 1.2,
  roughness: 0.4,
  metalness: 0.15,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide
});

// Criação do círculo de luz sobre o chão reflectivo
const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.y = 0.005; // ligeiramente acima do chão para evitar z-fighting
scene.add(circuloLuz);

// Friso dourado horizontal imediatamente a seguir ao círculo
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

// Criação das obras normais que circulam no centro da galeria
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

const velocidadeObras = 0.25;

// Função que anima a rotação circular das obras normais
function animarObrasCirculares(delta) {
  // Apenas roda o sistema se não houver obra destacada
  if (!obraDestacada) {
    anguloAtual += velocidadeObras * delta;
  }

  const raio = config.circleRadius;

  obrasNormais.forEach((obra, i) => {
    // Se for a obra destacada, mantém posição central
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

  // Animação para regressar à posição circular
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
// ==================== BLOCO 14 — BOTÃO “BUY” E INTEGRAÇÃO COM METAMASK ====================

window.addEventListener('DOMContentLoaded', () => {
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

// ==================== BLOCO 15 — CRIAÇÃO E GESTÃO DE CUBOS SUSPENSOS ====================

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
// ==================== BLOCO 16 — REGISTO DAS ENTRADAS DE OBRAS SUSPENSAS NO BACKEND ====================

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
// ==================== BLOCO 18 — FUNÇÃO MIGRAR PARA CÍRCULO CENTRAL ====================

function migrarParaCirculo(obra) {
  const tamanho = config.obraSize;

  textureLoader.load(
    obra.imagem,
    textura => {
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
      updateLoadingProgress();
    },
    undefined,
    erro => {
      console.error(`❌ Falha ao carregar textura da obra migrada ${obra.id}:`, erro);
    }
  );
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

// Verificação automática ao carregar a página
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
// ==================== BLOCO 22 — VERIFICAÇÃO DE MIGRAÇÕES NO BACKEND ====================

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
// ==================== BLOCO 23 — FUNÇÃO DE ANIMAÇÃO CONTÍNUA ====================

function animate() {
  requestAnimationFrame(animate);

  const delta = relogio.getDelta();
  animarObrasCirculares(delta);

  renderer.render(scene, camera);
}

animate();
