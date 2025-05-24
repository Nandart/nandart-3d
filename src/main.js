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

// Elementos do modal (DOM)
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

// Loader com controlo de progresso
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
// Configurar o renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.querySelector('#scene') });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Criar a cena e a câmara
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, config.cameraY + 1.6, config.cameraZ + 9);
camera.lookAt(0, 6.5, -config.wallDistance + 0.4);

// Atualizar câmara ao redimensionar
window.addEventListener('resize', () => {
  config = configMap[getViewportLevel()];
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Iluminação ambiente duplicada para mais clareza
const luzAmbiente = new THREE.AmbientLight(0xffffff, 2.0);
scene.add(luzAmbiente);
const luzDirecional = new THREE.DirectionalLight(0xffffff, 1.5);
luzDirecional.position.set(5, 10, 7);
luzDirecional.castShadow = true;
scene.add(luzDirecional);

// Chão com reflexo realista e elegante
const reflector = new Reflector(new THREE.PlaneGeometry(40, 40), {
  color: new THREE.Color(0x111111),
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  clipBias: 0.003
});
reflector.rotateX(-Math.PI / 2);
reflector.position.y = 0.01;
scene.add(reflector);

// Paredes com textura antracite realista
const texturaAntracite = textureLoader.load('assets/antracite-realista.jpg');
const paredeMaterial = new THREE.MeshStandardMaterial({ map: texturaAntracite, roughness: 0.5, metalness: 0.2 });
const paredeFundo = new THREE.Mesh(new THREE.BoxGeometry(42, 29, 0.4), paredeMaterial);
paredeFundo.position.set(0, 14.6, -config.wallDistance - 5.2);
scene.add(paredeFundo);
const paredeEsquerda = new THREE.Mesh(new THREE.BoxGeometry(30, 29, 0.4), paredeMaterial);
paredeEsquerda.position.set(-16.7, 14.5, -config.wallDistance / 2);
paredeEsquerda.rotation.y = Math.PI / 2;
scene.add(paredeEsquerda);
const paredeDireita = new THREE.Mesh(new THREE.BoxGeometry(30, 29, 0.4), paredeMaterial);
paredeDireita.position.set(16.7, 14.5, -config.wallDistance / 2);
paredeDireita.rotation.y = -Math.PI / 2;
scene.add(paredeDireita);

// Preparação para frisos, pedestais, vitrines e nome NANdART virá no Bloco 3
// Cor dourada real dos frisos e nome, baseada na imagem "dourado para friso.png"
const corDourada = 0x8a5c21;
const frisoMaterial = new THREE.MeshStandardMaterial({ color: corDourada, metalness: 0.7, roughness: 0.3 });

// Friso central da parede de fundo (duplo contorno)
const frisoCentralExterior = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 0.1), frisoMaterial);
frisoCentralExterior.position.set(0, 7.2, -config.wallDistance - 5.1);
scene.add(frisoCentralExterior);
const frisoCentralInterior = new THREE.Mesh(new THREE.BoxGeometry(19.4, 0.2, 0.12), frisoMaterial);
frisoCentralInterior.position.set(0, 7.2, -config.wallDistance - 5.05);
scene.add(frisoCentralInterior);

// Frisos laterais com estrutura dupla
for (let i = -1; i <= 1; i += 2) {
  const frisoVerticalExterior = new THREE.Mesh(new THREE.BoxGeometry(0.4, 12, 0.1), frisoMaterial);
  frisoVerticalExterior.position.set(i * 10, 10, -config.wallDistance - 5.1);
  scene.add(frisoVerticalExterior);
  const frisoVerticalInterior = new THREE.Mesh(new THREE.BoxGeometry(0.2, 11.4, 0.12), frisoMaterial);
  frisoVerticalInterior.position.set(i * 10, 10, -config.wallDistance - 5.05);
  scene.add(frisoVerticalInterior);
}

// Frisos horizontais inferiores (continuidade perfeita)
const frisoHorizontalInferior1 = new THREE.Mesh(new THREE.BoxGeometry(42, 0.2, 0.1), frisoMaterial);
frisoHorizontalInferior1.position.set(0, 1.5, -config.wallDistance - 5.1);
scene.add(frisoHorizontalInferior1);
const frisoHorizontalInferior2 = new THREE.Mesh(new THREE.BoxGeometry(30, 0.2, 0.1), frisoMaterial);
frisoHorizontalInferior2.position.set(0, 1.5, 0);
frisoHorizontalInferior2.rotation.y = Math.PI / 2;
scene.add(frisoHorizontalInferior2);

// Pedestais e vitrines suspensas com cristais reais
const pedestalGeo = new THREE.CylinderGeometry(1, 1, 3, 32);
const pedestalMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.1 });
const vitrineGeo = new THREE.CylinderGeometry(0.9, 0.9, 1, 32);
const vitrineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
const cristalGeo = new THREE.IcosahedronGeometry(0.5, 1);
const cristalMaterial = new THREE.MeshStandardMaterial({ color: 0x8a5c21, metalness: 0.9, roughness: 0.2 });

for (let i = 0; i < 4; i++) {
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMaterial);
  pedestal.position.set((i < 2 ? -3 : 3), 1.5, i % 2 === 0 ? -config.circleRadius - 2 : config.circleRadius + 2);
  scene.add(pedestal);

  const vitrine = new THREE.Mesh(vitrineGeo, vitrineMaterial);
  vitrine.position.set(pedestal.position.x, 3, pedestal.position.z);
  scene.add(vitrine);

  const cristal = new THREE.Mesh(cristalGeo, cristalMaterial);
  cristal.position.set(pedestal.position.x, 3.8, pedestal.position.z);
  scene.add(cristal);
}

// Nome NANdART na parede de fundo com relevo e textura real
const fontLoader = new FontLoader(loadingManager);
fontLoader.load('assets/fonts/helvetiker_bold.typeface.json', (font) => {
  const textGeo = new TextGeometry('NANdART', {
    font: font,
    size: 2,
    height: 0.5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.05,
    bevelSegments: 5
  });
  const textMaterial = new THREE.MeshStandardMaterial({ color: corDourada, metalness: 0.8, roughness: 0.2 });
  const textMesh = new THREE.Mesh(textGeo, textMaterial);
  textGeo.computeBoundingBox();
  const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
  textMesh.position.set(centerOffset, 25, -config.wallDistance - 4.9);
  scene.add(textMesh);
});
// Círculo de luz espesso e fiel ao layout
const raioInterior = config.circleRadius + 0.5;
const raioExterior = config.circleRadius + 1.3;
const circuloLuzGeometry = new THREE.RingGeometry(raioInterior, raioExterior, 128);
const circuloLuzMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 3.5,
  roughness: 0.15,
  metalness: 0.2,
  transparent: true,
  opacity: 0.85,
  side: THREE.DoubleSide
});
const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.y = 0.01;
scene.add(circuloLuz);

// Obras circulantes separadas
const dadosObras = [
  { id: 'obra1', imagem: 'assets/obras/obra1.jpg', titulo: 'Obra 1', artista: 'Artista A', ano: '2024', descricao: 'Descrição', preco: '0.5' },
  { id: 'obra2', imagem: 'assets/obras/obra2.jpg', titulo: 'Obra 2', artista: 'Artista B', ano: '2023', descricao: 'Descrição', preco: '0.6' },
  { id: 'obra3', imagem: 'assets/obras/obra3.jpg', titulo: 'Obra 3', artista: 'Artista C', ano: '2025', descricao: 'Descrição', preco: '0.45' },
  { id: 'obra4', imagem: 'assets/obras/obra4.jpg', titulo: 'Obra 4', artista: 'Artista D', ano: '2022', descricao: 'Descrição', preco: '0.55' },
  { id: 'obra5', imagem: 'assets/obras/obra5.jpg', titulo: 'Obra 5', artista: 'Artista E', ano: '2021', descricao: 'Descrição', preco: '0.65' },
  { id: 'obra6', imagem: 'assets/obras/obra6.jpg', titulo: 'Obra 6', artista: 'Artista F', ano: '2021', descricao: 'Descrição', preco: '0.42' },
  { id: 'obra7', imagem: 'assets/obras/obra7.jpg', titulo: 'Obra 7', artista: 'Artista G', ano: '2020', descricao: 'Descrição', preco: '0.48' },
  { id: 'obra8', imagem: 'assets/obras/obra8.jpg', titulo: 'Obra 8', artista: 'Artista H', ano: '2020', descricao: 'Descrição', preco: '0.58' }
];

dadosObras.forEach((dados, i) => {
  const textura = textureLoader.load(dados.imagem);
  const materialObra = new THREE.MeshStandardMaterial({ map: textura, roughness: 0.2, metalness: 0.1, side: THREE.DoubleSide, transparent: true });
  const geoObra = new THREE.PlaneGeometry(config.obraSize * 1.2, config.obraSize * 1.6);
  const obra = new THREE.Mesh(geoObra, materialObra);

  const angulo = (i / dadosObras.length) * Math.PI * 2;
  obra.position.set(Math.cos(angulo) * config.circleRadius, 4.2, Math.sin(angulo) * config.circleRadius);
  obra.lookAt(0, 4.2, 0);
  obra.castShadow = obra.receiveShadow = true;
  obra.userData = { dados, index: i };
  scene.add(obra);
  obrasNormais.push(obra);
});

// Animação com destaque único e fecho ao clique fora
function animate() {
  requestAnimationFrame(animate);
  const delta = relogio.getDelta();
  const velocidade = ambienteDesacelerado ? 0.05 : 0.2;
  anguloAtual += delta * velocidade;

  obrasNormais.forEach((obra, i) => {
    if (obra !== obraDestacada) {
      const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
      obra.position.set(Math.cos(angulo) * config.circleRadius, 4.2, Math.sin(angulo) * config.circleRadius);
      obra.lookAt(0, 4.2, 0);
    }
  });

  renderer.render(scene, camera);
}
animate();

renderer.domElement.addEventListener('pointerdown', (e) => {
  const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(obrasNormais, false);

  if (intersects.length > 0 && !obraDestacada) {
    const obra = intersects[0].object;
    obraDestacada = obra;
    ambienteDesacelerado = true;

    const dados = obra.userData.dados;
    gsap.to(obra.position, { x: 0, y: 6.5, z: 0, duration: 1, ease: 'power2.inOut', onUpdate: () => obra.lookAt(new THREE.Vector3(0, 6.5, 0)) });
    gsap.to(obra.scale, { x: 2, y: 2, z: 2, duration: 1, ease: 'power2.out' });

    const fundo = document.getElementById('scene');
    if (fundo) fundo.style.filter = 'blur(6px)';
    setTimeout(() => {
      if (overlay && infoPanel) {
        infoPanel.style.display = 'block';
        overlay.style.display = 'block';
        infoPanel.querySelector('#modal-titulo').textContent = dados.titulo;
        infoPanel.querySelector('#modal-artista').textContent = dados.artista;
        infoPanel.querySelector('#modal-ano').textContent = dados.ano;
        infoPanel.querySelector('#modal-descricao').textContent = dados.descricao;
        infoPanel.querySelector('#modal-preco').textContent = `${dados.preco} ETH`;
      }
    }, 1000);
  } else if (obraDestacada && !intersects.length) {
    const obra = obraDestacada;
    const index = obra.userData.index;
    const angulo = (index / obrasNormais.length) * Math.PI * 2;
    gsap.to(obra.position, { x: Math.cos(angulo) * config.circleRadius, y: 4.2, z: Math.sin(angulo) * config.circleRadius, duration: 1, ease: 'power2.inOut' });
    gsap.to(obra.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'power2.out' });
    const fundo = document.getElementById('scene');
    if (fundo) fundo.style.filter = 'none';
    if (overlay && infoPanel) {
      overlay.style.display = 'none';
      infoPanel.style.display = 'none';
    }
    obraDestacada = null;
    ambienteDesacelerado = false;
  }
});

// Botão "Connect Wallet" e ícones fixos na parede real
const textureLoader2D = new THREE.TextureLoader();
textureLoader2D.load('assets/icons/horizontes.png', (tex) => {
  const iconMaterial = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const iconSprite = new THREE.Sprite(iconMaterial);
  iconSprite.scale.set(2, 2, 1);
  iconSprite.position.set(-15, 25, -config.wallDistance - 4.9);
  scene.add(iconSprite);
});

textureLoader2D.load('assets/icons/info.png', (tex) => {
  const infoMaterial = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const infoSprite = new THREE.Sprite(infoMaterial);
  infoSprite.scale.set(2, 2, 1);
  infoSprite.position.set(-15, 28, -config.wallDistance - 4.9);
  scene.add(infoSprite);
});

// Fim do carregamento total
console.log('🌟 Galeria NANdART reconstruída com fidelidade total e estrutura sólida.');
// Elementos do DOM para o modal
overlay = document.getElementById('overlay');
infoPanel = document.getElementById('info-panel');
modalElements.titulo = document.getElementById('modal-titulo');
modalElements.artista = document.getElementById('modal-artista');
modalElements.ano = document.getElementById('modal-ano');
modalElements.descricao = document.getElementById('modal-descricao');
modalElements.preco = document.getElementById('modal-preco');
modalElements.botao = document.getElementById('modal-botao');

// Lógica de restauro da ligação da carteira (persistência)
if (localStorage.getItem('walletConnected') === 'true') {
  ligarCarteira();
}

// Garantir posicionamento final do animate() no final absoluto
animate();

// Mensagem final no console para confirmar que tudo está pronto
console.log('✨ Galeria NANdART concluída com estrutura lógica e visual fiel.');

