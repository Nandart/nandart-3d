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
renderer.toneMappingExposure = 2.4; // 🔆 Atenuação da intensidade geral para metade
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Cena tridimensional
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Câmara — com posição adaptável e mais distante para maior profundidade
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY + 1.6, config.cameraZ + 9); // 📏 Distância maior para sensação de profundidade
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
// Luz ambiente — ajustada para criar uma atmosfera realista e subtil
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 🔆 Metade da intensidade original
scene.add(ambientLight);
// Geometrias das paredes
const paredeGeoFundo = new THREE.BoxGeometry(42, 29, 0.4);
const paredeGeoLateral = new THREE.BoxGeometry(30, 29, 0.4);

// Textura antracite-realista (com fallback embutido)
const base64Antracite = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAQABAADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi";

const imagem = new Image();
imagem.src = base64Antracite;
const texturaFallback = new THREE.Texture(imagem);
imagem.onload = () => {
  texturaFallback.needsUpdate = true;
};

// Carregador de textura com fallback
let texturaParede = textureLoader.load(
  'assets/parede-antracite.jpg',
  updateLoadingProgress,
  undefined,
  () => {
    console.warn('⚠️ Falha ao carregar textura externa, a aplicar fallback incorporado.');
    texturaParede = texturaFallback;
  }
);

// Função para aplicar textura às paredes
function aplicarTexturaParede(textura) {
  const paredeMaterial = new THREE.MeshStandardMaterial({
    map: textura,
    color: 0xffffff,
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

aplicarTexturaParede(texturaParede);

// Chão reflexivo (preparado para os reflexos reais)
const planoChao = new THREE.PlaneGeometry(80, 80);
const materialChao = new THREE.MeshStandardMaterial({
  color: 0x222222,
  metalness: 0.8,
  roughness: 0.05,
  emissive: new THREE.Color(0x111111),
  emissiveIntensity: 0.15
});
const chao = new THREE.Mesh(planoChao, materialChao);
chao.rotation.x = -Math.PI / 2;
chao.position.y = -0.03;
chao.receiveShadow = true;
scene.add(chao);
// Material dourado para os frisos
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21, // Dourado vibrante e elegante
  metalness: 0.7,
  roughness: 0.3,
  emissive: 0x000000,
  emissiveIntensity: 0.1
});

// Friso central com contornos arredondados (precisão arquitetónica)
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

// Criar o friso central exato
criarFrisoCentral(0, 11.2, -config.wallDistance - 5.17, 5.2, 6.3);

// Frisos horizontais — precisão milimétrica
function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, 0.02),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  scene.add(friso);
}

// Frisos horizontais contínuos e alinhados
criarFrisoLinha(0, 1.6, -config.wallDistance - 5.18, 42); // linha inferior fundo
criarFrisoLinha(0, 2.2, -config.wallDistance - 5.18, 42); // linha superior fundo
criarFrisoLinha(-16.7, 1.6, -config.wallDistance / 2, 30, 0.06, Math.PI / 2); // linha lateral esquerda
criarFrisoLinha(-16.7, 2.2, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
criarFrisoLinha(16.7, 1.6, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2); // linha lateral direita
criarFrisoLinha(16.7, 2.2, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);

// Frisos verticais embutidos com camada dupla — laterais esquerda e direita
function criarFrisoDuploVertical(x, y, z, altura, lado) {
  const offset = lado === 'esquerda' ? -0.4 : 0.4;

  const externo = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, altura, 0.02),
    frisoMaterial
  );
  externo.position.set(x, y, z);
  externo.rotation.y = lado === 'esquerda' ? Math.PI / 2 : -Math.PI / 2;
  scene.add(externo);

  const interno = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, altura - 0.4, 0.02),
    frisoMaterial
  );
  interno.position.set(x + offset, y, z + 0.01);
  interno.rotation.y = externo.rotation.y;
  scene.add(interno);
}

// Frisos duplos verticais nas laterais
criarFrisoDuploVertical(-16.7, 14.5, -config.wallDistance / 2, 7.5, 'esquerda');
criarFrisoDuploVertical(16.7, 14.5, -config.wallDistance / 2, 7.5, 'direita');
// Materiais para pedestal, vitrine e gema
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

  // Base do pedestal
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

  // Gema luminosa suspensa dentro da vitrine
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 1),
    gemaMaterial
  );
  gema.position.set(posX, alturaPedestal + alturaVitrine / 2, posZ);
  scene.add(gema);
}

// Posicionamento preciso nos quatro cantos do círculo de luz
const deslocamento = config.circleRadius + 3.3;

criarPedestalRetangular(-deslocamento, -deslocamento); // Frente esquerda
criarPedestalRetangular(deslocamento, -deslocamento);  // Frente direita
criarPedestalRetangular(-deslocamento, deslocamento);  // Fundo esquerda
criarPedestalRetangular(deslocamento, deslocamento);   // Fundo direita
// Geometria do círculo de luz — design fino e fiel ao layout
const circuloLuzGeometry = new THREE.RingGeometry(
  config.circleRadius + 0.6,  // Raio interior fino
  config.circleRadius + 0.7,  // Raio exterior ligeiramente maior
  64
);

// Material branco vivo e luminoso
const circuloLuzMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,            // Branco puro
  emissive: 0xffffff,
  emissiveIntensity: 2.5,     // Brilho mais intenso para realce
  roughness: 0.2,
  metalness: 0.1,
  transparent: true,
  opacity: 0.7,
  side: THREE.DoubleSide
});

// Criação do círculo de luz no chão reflectivo
const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.y = 0.005; // Ligeiramente acima do chão para evitar z-fighting
scene.add(circuloLuz);

// ⚠️ Friso dourado imediatamente a seguir ao círculo foi removido conforme solicitado
// Dados das obras a serem usadas na criação do círculo suspenso
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

criarObrasNormais();
// Definição da velocidade de rotação das obras circulantes
const velocidadeObras = 0.20;
const velocidadeDesacelerada = 0.08; // Velocidade mais lenta durante o destaque

// Função que anima a rotação circular das obras normais
function animarObrasCirculares(delta) {
  // Define a velocidade consoante o estado de destaque
  const velocidadeAtual = obraDestacada ? velocidadeDesacelerada : velocidadeObras;
  anguloAtual += velocidadeAtual * delta;

  const raio = config.circleRadius;

  obrasNormais.forEach((obra, i) => {
    // Se for a obra destacada, fixa no centro e não roda
    if (obra === obraDestacada) return;

    const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
    obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
    obra.lookAt(0, 4.2, 0);
  });
}
// Evento de pointerdown para detetar interação do utilizador (clique ou toque)
renderer.domElement.addEventListener('pointerdown', (e) => {
  // Converte a posição do clique para coordenadas normalizadas de ecrã
  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Detetar interseções com as obras normais
  const intersects = raycaster.intersectObjects(obrasNormais, false);

  if (intersects.length > 0) {
    const obraClicada = intersects[0].object;

    // Se a obra clicada já estiver destacada, ignorar
    if (obraDestacada === obraClicada) return;

    // Se existir outra obra destacada, fechar primeiro
    if (obraDestacada) {
      fecharObraDestacada(() => destacarObra(obraClicada));
    } else {
      destacarObra(obraClicada);
    }
  }
});
function destacarObra(obra) {
  if (obraDestacada) return; // Garante que apenas uma obra pode estar destacada

  obraDestacada = obra;
  ambienteDesacelerado = true;

  const dados = obra.userData.dados;

  // Animação para mover a obra até ao centro da cena, fixando em altura superior à posição circular
  gsap.to(obra.position, {
    x: 0,
    y: 6.5, // Altura ligeiramente superior ao círculo de obras
    z: 0,
    duration: 1.1,
    ease: 'power2.inOut',
    onUpdate: () => {
      obra.lookAt(new THREE.Vector3(0, 6.5, 0)); // Mantém orientação para o centro
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

  // Aplicar desfoque apenas ao fundo (não à obra nem ao modal)
  const fundo = document.getElementById('scene');
  if (fundo) {
    fundo.style.filter = 'blur(6px)';
  }

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

    // Garantir que o modal está posicionado corretamente e com largura igual à obra destacada
    infoPanel.style.display = 'block';
    infoPanel.style.width = `${obra.scale.x * obra.geometry.parameters.width}px`;
    infoPanel.style.left = `${window.innerWidth / 2 - (obra.scale.x * obra.geometry.parameters.width) / 2}px`;
    infoPanel.style.top = `${window.innerHeight / 2 + obra.scale.y * obra.geometry.parameters.height / 2 + 10}px`;

    overlay.style.display = 'block';

    modalElements.titulo.textContent = dados.titulo;
    modalElements.artista.textContent = dados.artista;
    modalElements.ano.textContent = dados.ano;
    modalElements.descricao.textContent = dados.descricao || 'Obra em destaque na galeria NANdART.';
    modalElements.preco.textContent = `${dados.preco} ETH`;
  }, 1100);
}
// Fecha a obra destacada se o utilizador clicar fora do painel informativo
document.addEventListener('pointerdown', (e) => {
  if (!obraDestacada || !infoPanel || infoPanel.contains(e.target)) return;
  fecharObraDestacada();
});

// Função que repõe a obra na sua posição original na órbita
function fecharObraDestacada(callback) {
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
      // Restaura a visibilidade e a rotação normal
      ambienteDesacelerado = false;
      obraDestacada = null;

      // Remove o desfoque do fundo
      const fundo = document.getElementById('scene');
      if (fundo) {
        fundo.style.filter = 'none';
      }

      // Oculta o painel informativo e o overlay
      overlay.style.display = 'none';
      infoPanel.style.display = 'none';

      // Se foi passado um callback (por exemplo, para destacar outra obra), chama-o agora
      if (callback) callback();
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

        // Enviar transacção de compra para o endereço da galeria
        const tx = await signer.sendTransaction({
          to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41', // Endereço da galeria
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
function iniciarGaleria() {
  // 1. Criar as obras normais do círculo rotativo
  criarObrasNormais();

  // ⚠️ REMOVIDO: Não há cubos suspensos nem verificação de migrações
}

// Executar ao carregar a página
window.addEventListener('load', iniciarGaleria);
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

// Atualiza o botão com estado atual e saldo (se ligado)
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
      walletAddress = null;
      atualizarEstadoCarteira();
    }
  }
});
// Controlo para assegurar atualização dinâmica das dimensões do renderer e da câmara
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 200);
});

// Controlo para garantir sempre o carregamento inicial com todas as dimensões e texturas corretas
window.addEventListener('load', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mensagem final de confirmação da galeria carregada
console.log('✨ A galeria 3D NANdART está totalmente pronta e funcional.');
function animate() {
  requestAnimationFrame(animate);

  const delta = relogio.getDelta();

  // Animação das obras circulantes, mesmo quando há obra destacada (mas mais lento)
  if (ambienteDesacelerado && !obraDestacada) {
    anguloAtual += (velocidadeObras * 0.2) * delta; // 20% da velocidade normal
  } else if (!ambienteDesacelerado) {
    anguloAtual += velocidadeObras * delta;
  }

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

animate();

