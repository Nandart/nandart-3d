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

// Variáveis globais essenciais (sem duplicações)
let config;
let obraDestacada = null;
let ambienteDesacelerado = false;
const obrasNormais = [];
const cubosSuspensos = [];
const relogio = new THREE.Clock();
let anguloAtual = 0;
// ==================== BLOCO 2 — VIEWPORT, CONFIGURAÇÕES E RENDERER ====================

// Configuração adaptativa por viewport
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

// Contador de recursos para carregamento silencioso
let loadedResources = 0;
const totalResources = 10 + obrasSuspensas.length;

function updateLoadingProgress() {
  loadedResources++;
  if (loadedResources >= totalResources) {
    console.log('🖼️ Recursos carregados silenciosamente.');
  }
}

// Loader de texturas com fallback integrado
const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = updateLoadingProgress;
loadingManager.onError = url => console.warn(`⚠️ Falha ao carregar recurso: ${url}`);

const textureLoader = new THREE.TextureLoader(loadingManager);

// Renderizador com alta qualidade e realismo
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

// Cena e fundo
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Câmara
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY + 1.6, config.cameraZ + 6.5);
  camera.lookAt(0, 6.5, -config.wallDistance + 0.4);
  camera.updateProjectionMatrix();
}
updateCamera();

// Resize adaptativo com debounce
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 200);
});
// ==================== BLOCO 3 — LUZES, CÂMARA E CHÃO REFLECTIVO ====================

// Iluminação ambiente triplicada para visibilidade total
const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
scene.add(ambientLight);

// Luz direcional principal (alta e central)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.6);
directionalLight.position.set(0, 16, 12);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Luzes de preenchimento suaves laterais
const fillLeft = new THREE.DirectionalLight(0xffffff, 1.0);
fillLeft.position.set(-8, 8, 4);
scene.add(fillLeft);

const fillRight = new THREE.DirectionalLight(0xffffff, 1.0);
fillRight.position.set(8, 8, -4);
scene.add(fillRight);

// Spot cenográfico superior para atmosfera dramática
const spotLight = new THREE.SpotLight(0xffffff, 1.4, 30, Math.PI / 5, 0.4, 1);
spotLight.position.set(0, 20, 5);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// Geometria e material do chão reflectivo (obsidiana líquida)
const floorGeometry = new THREE.PlaneGeometry(80, 80);
const floorMirror = new Reflector(floorGeometry, {
  clipBias: 0.003,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x121212
});
floorMirror.rotation.x = -Math.PI / 2;
floorMirror.position.y = -0.03; // Ligeiramente abaixo da base das obras
scene.add(floorMirror);
// ==================== BLOCO 4 — PAREDES COM TEXTURA REALISTA ====================

// Geometrias das paredes: dimensões fiéis ao layout
const paredeGeoFundo = new THREE.PlaneGeometry(42, 32);
const paredeGeoLateral = new THREE.PlaneGeometry(34, 30);

// Aplicação da textura antracite com fallback automático
function aplicarTexturaParede(textura) {
  const paredeMaterial = new THREE.MeshStandardMaterial({
    map: textura || null,
    color: 0xffffff,
    emissive: 0x111111,
    emissiveIntensity: 0.25,
    roughness: 0.55,
    metalness: 0.15
  });

  // Parede de fundo (recuada para profundidade)
  const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial);
  paredeFundo.position.set(0, 14.6, -config.wallDistance - 5.2);
  paredeFundo.receiveShadow = true;
  scene.add(paredeFundo);

  // Parede lateral esquerda (vista lateral direita)
  const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeEsquerda.position.set(-16.7, 14.5, -config.wallDistance / 2);
  paredeEsquerda.rotation.y = Math.PI / 2;
  paredeEsquerda.receiveShadow = true;
  scene.add(paredeEsquerda);

  // Parede lateral direita (vista lateral esquerda)
  const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeDireita.position.set(16.7, 14.5, -config.wallDistance / 2);
  paredeDireita.rotation.y = -Math.PI / 2;
  paredeDireita.receiveShadow = true;
  scene.add(paredeDireita);
}

// Aplica a textura local e, em caso de falha, tenta fallback remoto
textureLoader.load(
  'assets/antracite-realista.jpg',
  textura => aplicarTexturaParede(textura),
  undefined,
  () => {
    console.warn('⚠️ Textura local falhou. A aplicar fallback externo...');
    textureLoader.load(
      'https://nandart.art/assets/antracite-realista.jpg',
      fallback => aplicarTexturaParede(fallback),
      undefined,
      erro => {
        console.error('❌ Falhou também o fallback externo. Aplicar cor base.');
        aplicarTexturaParede(null);
      }
    );
  }
);
// ==================== BLOCO 5 — QUADRO CENTRAL E FRISO COM RESPIRO ====================

// Grupo para o quadro com moldura saliente
const quadroCentralGrupo = new THREE.Group();

const larguraQuadro = 4.6;
const alturaQuadro = 5.8;

// Moldura externa escura com profundidade
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
molduraCentral.position.z = -0.1; // ligeiramente recuada em relação à pintura
quadroCentralGrupo.add(molduraCentral);

// Pintura central carregada da galeria
const texturaCentral = textureLoader.load('assets/obras/obra-central.jpg', updateLoadingProgress);
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

// Posicionar o quadro no centro da parede de fundo, ligeiramente elevado
quadroCentralGrupo.position.set(0, 11.2, -config.wallDistance - 5.19);
scene.add(quadroCentralGrupo);

// Material dos frisos dourados
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21, // dourado vivo fiel à imagem “dourado para friso.png”
  metalness: 1,
  roughness: 0.08,
  emissive: 0x2f1b08,
  emissiveIntensity: 0.33
});

// Friso retangular à volta do quadro com espaço de respiro
function criarFrisoCentral(x, y, z, largura, altura) {
  const grupo = new THREE.Group();
  const espessura = 0.06;

  // Horizontais
  [1, -1].forEach(dy => {
    const barra = new THREE.Mesh(
      new THREE.BoxGeometry(largura, espessura, 0.02),
      frisoMaterial
    );
    barra.position.set(0, altura / 2 * dy, 0);
    grupo.add(barra);
  });

  // Verticais
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

// Aplicar o friso com dimensões maiores do que o quadro, para dar espaço
criarFrisoCentral(0, 11.2, -config.wallDistance - 5.17, 5.2, 6.3);
// ==================== BLOCO 6 — FRISOS DECORATIVOS ====================

// Reutiliza o frisoMaterial já definido no bloco anterior

// Friso horizontal — barra única
function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, 0.02),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  scene.add(friso);
}

// Friso vertical duplo embutido (camada exterior e interior)
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

// 1. Frisos horizontais inferiores — parede de fundo
criarFrisoLinha(0, 1.6, -config.wallDistance - 5.18, 42);     // inferior
criarFrisoLinha(0, 2.2, -config.wallDistance - 5.18, 42);     // superior

// 2. Frisos horizontais inferiores — parede lateral esquerda
criarFrisoLinha(-16.7, 1.6, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
criarFrisoLinha(-16.7, 2.2, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);

// 3. Frisos horizontais inferiores — parede lateral direita
criarFrisoLinha(16.7, 1.6, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);
criarFrisoLinha(16.7, 2.2, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);

// 4. Frisos verticais embutidos — esquerda e direita
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

// Função para criar pedestais com vitrine e gema suspensa
function criarPedestalRetangular(posX, posZ) {
  const largura = 0.8;
  const profundidade = 0.8;
  const alturaPedestal = 1.5;
  const alturaVitrine = 1.3;

  // Base rectangular escura
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(largura, alturaPedestal, profundidade),
    pedestalMaterial
  );
  base.position.set(posX, alturaPedestal / 2, posZ);
  base.castShadow = base.receiveShadow = true;
  scene.add(base);

  // Vitrine quadrada
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(largura * 0.9, alturaVitrine, profundidade * 0.9),
    vitrineMaterial
  );
  vitrine.position.set(posX, alturaPedestal + alturaVitrine / 2, posZ);
  vitrine.castShadow = vitrine.receiveShadow = true;
  scene.add(vitrine);

  // Gema luminosa dentro da vitrine
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 1),
    gemaMaterial
  );
  gema.position.set(posX, alturaPedestal + alturaVitrine / 2, posZ);
  scene.add(gema);
}

// Posições encostadas às paredes laterais, nas pontas do círculo de luz
const deslocamento = config.circleRadius + 3.3;

criarPedestalRetangular(-deslocamento, -deslocamento); // Frente esquerda
criarPedestalRetangular(deslocamento, -deslocamento);  // Frente direita
criarPedestalRetangular(-deslocamento, deslocamento);  // Fundo esquerda
criarPedestalRetangular(deslocamento, deslocamento);   // Fundo direita
// ==================== BLOCO 8 — CÍRCULO DE LUZ CENTRAL NO CHÃO ====================

// Geometria do círculo de luz — contorno suave e elegante
const circuloLuzGeometry = new THREE.RingGeometry(
  config.circleRadius + 0.6,  // raio interior
  config.circleRadius + 1.4,  // raio exterior
  64
);

// Material com brilho dourado subtil
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

// Criação do círculo e posicionamento sobre o chão reflectivo
const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.y = 0.005; // Assente no chão
scene.add(circuloLuz);

// Friso dourado horizontal imediatamente a seguir ao círculo (no chão)
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
// ==================== BLOCO 11 — DETECÇÃO DE CLIQUE NAS OBRAS CIRCULARES ====================

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (obraDestacada) return; // Impede múltiplos destaques ao mesmo tempo

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(obrasNormais, false);
  if (intersects.length > 0) {
    const obraClicada = intersects[0].object;
    destacarObra(obraClicada);
  }
});

  // ==================== BLOCO 12 — FUNÇÃO DESTACAR OBRA CIRCULAR ====================

function destacarObra(obra) {
  if (obraDestacada) return;

  obraDestacada = obra;
  ambienteDesacelerado = true;

  const dados = obra.userData.dados;

  // Ocultar todas as outras obras para evitar sobreposição visual
  obrasNormais.forEach(o => {
    if (o !== obra) o.visible = false;
  });

  // Elevar a obra acima das restantes com destaque cénico
  gsap.to(obra.scale, {
    x: 2,
    y: 2,
    z: 2,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(obra.position, {
    x: 0,
    y: 6.5,
    z: 0,
    duration: 1.1,
    ease: 'power2.inOut'
  });

  // Reposicionar a câmara para foco suave e poético na obra
  gsap.to(camera.position, {
    x: 0,
    y: 7.4,
    z: 6.4,
    duration: 1.2,
    ease: 'power2.inOut',
    onComplete: () => {
      // Mostrar modal informativo após a animação
      overlay.style.display = 'block';
      infoPanel.style.display = 'block';

      modalElements.titulo.textContent = dados.titulo;
      modalElements.artista.textContent = dados.artista;
      modalElements.ano.textContent = dados.ano;
      modalElements.descricao.textContent = dados.descricao || 'Obra em destaque na galeria NANdART.';
      modalElements.preco.textContent = `${dados.preco} ETH`;
    }
  });
}

// ==================== BLOCO 13 — FECHAR MODAL AO CLICAR FORA ====================

window.addEventListener('pointerdown', (e) => {
  if (!obraDestacada || infoPanel.contains(e.target)) return;
  fecharObraDestacada();
});

function fecharObraDestacada() {
  if (!obraDestacada) return;

  const obra = obraDestacada;

  // Animação de regresso da obra à sua escala original
  gsap.to(obra.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.6,
    ease: 'power2.out'
  });

  // Reposicionamento vertical suave para voltar à órbita
  gsap.to(obra.position, {
    y: 4.2,
    duration: 0.6,
    ease: 'power2.inOut',
    onComplete: () => {
      overlay.style.display = 'none';
      infoPanel.style.display = 'none';
      obraDestacada = null;
      ambienteDesacelerado = false;

      // Tornar visíveis todas as outras obras novamente
      obrasNormais.forEach(o => {
        o.visible = true;
      });
    }
  });

  // Reposicionar a câmara para a vista geral da galeria
  gsap.to(camera.position, {
    x: 0,
    y: config.cameraY,
    z: config.cameraZ,
    duration: 0.8,
    ease: 'power2.inOut'
  });
}
// ==================== BLOCO 15 — BOTÃO "BUY" — TRANSACÇÃO EM ETH ====================

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
      to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41', // Endereço da galeria NANdART
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
// ==================== BLOCO 16 — CUBOS SUSPENSOS COM GEMAS ====================

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

  // Posições elevadas e simbólicas sobre o círculo
  const altura = 8.2;
  const posicoes = [
    { x: -5, y: altura, z: 0 },
    { x: 5, y: altura, z: 0 },
    { x: -5, y: altura, z: -5 },
    { x: 5, y: altura, z: -5 }
  ];
  const pos = posicoes[indice % posicoes.length];
  cubo.position.set(pos.x, pos.y, pos.z);

  // Gema com textura da obra ou fallback
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
    () => {
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
      cubo.add(gemaFallback);
      updateLoadingProgress();
    }
  );

  cubo.userData = { obra };
  cubosSuspensos.push(cubo);
  scene.add(cubo);

  return cubo;
}
// ==================== BLOCO 17 — MIGRAÇÃO DE OBRAS DOS CUBOS ====================

// URL do backend onde está alojado o servidor Express (ex: Render)
const BACKEND_URL = 'https://nandart-3d.onrender.com';

// Regista a entrada de uma nova obra suspensa no backend
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

// Verifica obras suspensas com mais de 30 dias e migra para o círculo rotativo
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
// ==================== BLOCO 18 — MIGRAR OBRA PARA O CÍRCULO ROTATIVO ====================

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
// ==================== BLOCO 19 — BOTÃO "CONNECT WALLET" ====================

// Elemento do botão na interface
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

// Variável para armazenar a carteira ligada
let walletAddress = null;

// Atualiza o botão com estado e saldo
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

// Função para ligar a carteira
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

// Alternância ao clicar no botão
walletBtn.addEventListener('click', () => {
  if (walletAddress) {
    desligarCarteira();
  } else {
    conectarCarteira();
  }
});

// Verificação automática ao carregar a página
window.addEventListener('load', async () => {
  if (window.ethereum && localStorage.getItem('walletConnected') === 'true') {
    const contas = await window.ethereum.request({ method: 'eth_accounts' });
    if (contas.length > 0) {
      walletAddress = contas[0];
      atualizarEstadoCarteira();
    }
  }
});
// ==================== BLOCO 20 — INICIALIZAÇÃO FINAL DA GALERIA ====================

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

// ==================== BLOCO FINAL — ANIMAÇÃO GLOBAL E RENDER ====================

function animate() {
  requestAnimationFrame(animate);

  const delta = relogio.getDelta();
  animarObrasCirculares(delta);

  renderer.render(scene, camera);
}

animate(); // ← CHAMADA INICIAL DEFINITIVA

    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(obrasNormais, false);
  if (intersects.length > 0) {
    const obraClicada = intersects[0].object;
    destacarObra(obraClicada);
  }
});


