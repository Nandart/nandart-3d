import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js'; // 
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';


gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// ✅ Declarar o loader de texturas UMA vez no início
const textureLoader = new THREE.TextureLoader();

// 🔧 Configuração base
const config = {
  wallDistance: 14.5,
  circleRadius: 6.5,
  obraSize: 2.1
};

// 🎥 Câmara com profundidade total da galeria
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 7.2, 18);
camera.lookAt(0, 6.2, 0);

// 🎨 Cena e fundo
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

// 🖥️ Renderer com qualidade cinematográfica
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.3;
renderer.outputEncoding = THREE.sRGBEncoding;

// 🔄 Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
// 🎨 Cena já definida acima
scene.background = new THREE.Color(0x0a0a0a);

// 🧱 Paredes realistas com textura antracite
const texturaParede = textureLoader.load('/assets/parede-antracite.jpg');

const paredeMaterial = new THREE.MeshStandardMaterial({
  map: texturaParede,
  color: 0x141414, // ainda usado como base
  roughness: 0.7,
  metalness: 0.15
});

// Parede de fundo
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), paredeMaterial);
backWall.position.set(0, 13, -config.wallDistance - 5.5);
backWall.receiveShadow = true;
scene.add(backWall);

// 🧱 Paredes laterais com textura antracite e realismo espacial
const paredeLateralGeo = new THREE.PlaneGeometry(30, 28); // ligeiramente mais altas que o fundo

const leftWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
leftWall.position.set(-13.2, 13, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
rightWall.position.set(13.2, 13, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
scene.add(rightWall);

// 🔶 Frisos dourados realistas
function criarFrisoRealista(pathPoints, material) {
  const curve = new THREE.CatmullRomCurve3(pathPoints);
  const geometry = new THREE.TubeGeometry(curve, 100, 0.02, 8, false);
  const friso = new THREE.Mesh(geometry, material);
  friso.castShadow = true;
  scene.add(friso);
  return friso;
}
// 🔶 Função para criar frisos arredondados com estilo realista
function criarFrisoArredondado(width, height, radius, cor = 0xf3c97a) {
  return new THREE.Mesh(
    new THREE.RoundedBoxGeometry(width, height, 0.04, 6, radius),
    new THREE.MeshPhysicalMaterial({
      color: cor,
      metalness: 1,
      roughness: 0.05,
      emissive: 0x4e3a1d,
      emissiveIntensity: 0.4,
      reflectivity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.02
    })
  );
}

// 🟨 Friso arredondado em torno do quadro central (substitui os frisos rectos antigos)
const frisoCentral = criarFrisoArredondado(4.4, 5.4, 0.5);
frisoCentral.position.set(0, 8.5, -config.wallDistance - 3.55);
scene.add(frisoCentral);

// 🟨 Frisos laterais embutidos (um dentro do outro), esquerda e direita
const frisoEsquerdo1 = criarFrisoArredondado(2.5, 6.5, 0.4);
frisoEsquerdo1.position.set(-15.48, 6.1, -config.wallDistance / 2 + 0.03);
frisoEsquerdo1.rotation.y = Math.PI / 2;
scene.add(frisoEsquerdo1);

const frisoEsquerdo2 = criarFrisoArredondado(1.6, 4.8, 0.3);
frisoEsquerdo2.position.set(-15.48, 6.1, -config.wallDistance / 2 + 0.05);
frisoEsquerdo2.rotation.y = Math.PI / 2;
scene.add(frisoEsquerdo2);

const frisoDireito1 = criarFrisoArredondado(2.5, 6.5, 0.4);
frisoDireito1.position.set(15.48, 6.1, -config.wallDistance / 2 + 0.03);
frisoDireito1.rotation.y = -Math.PI / 2;
scene.add(frisoDireito1);

const frisoDireito2 = criarFrisoArredondado(1.6, 4.8, 0.3);
frisoDireito2.position.set(15.48, 6.1, -config.wallDistance / 2 + 0.05);
frisoDireito2.rotation.y = -Math.PI / 2;
scene.add(frisoDireito2);

 const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0xf3c97a,
  metalness: 1,
  roughness: 0.05,
  emissive: 0x4e3a1d,
  emissiveIntensity: 0.6
});

// ✨ Luz ambiente radial suave e refinada
//const luzAmbienteCentral = new THREE.PointLight(0xfff2dd, 1.8, 50, 2);
//luzAmbienteCentral.position.set(0, 9.5, 0);
//scene.add(luzAmbienteCentral);

// ✨ Luz hemisférica quente para reforço geral do ambiente
const luzHemisferica = new THREE.HemisphereLight(0xfff8e6, 0x101010, 2.8);
scene.add(luzHemisferica);
// ✨ Luz direcional superior para preenchimento global
const luzDirecional = new THREE.DirectionalLight(0xfff4e0, 3.2);
luzDirecional.position.set(0, 20, 12);
luzDirecional.castShadow = true;
scene.add(luzDirecional);

const luzFrontalParedeFundo = new THREE.SpotLight(0xffead4, 2.5, 35, Math.PI / 4, 0.4);
luzFrontalParedeFundo.position.set(0, 12, 10);
luzFrontalParedeFundo.target.position.set(0, 9, -config.wallDistance);
scene.add(luzFrontalParedeFundo, luzFrontalParedeFundo.target);


// ✨ Luzes rasantes laterais melhoradas para destacar frisos e paredes
const luzParedeEsquerda = new THREE.SpotLight(0xffead4, 2.2, 30, Math.PI / 5, 0.3);
luzParedeEsquerda.position.set(-14, 12, 0);
luzParedeEsquerda.target.position.set(-13.2, 10, -config.wallDistance / 2);
scene.add(luzParedeEsquerda, luzParedeEsquerda.target);

const luzParedeDireita = new THREE.SpotLight(0xffead4, 2.2, 30, Math.PI / 5, 0.3);
luzParedeDireita.position.set(14, 12, 0);
luzParedeDireita.target.position.set(13.2, 10, -config.wallDistance / 2);
scene.add(luzParedeDireita, luzParedeDireita.target);

// ✨ Chão com reflexo profundo e textura realista tipo obsidiana líquida

const floorGeometry = new THREE.PlaneGeometry(40, 40);

const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x0a0a0a,
  recursion: 2
});

floor.material.opacity = 0.82;
floor.material.roughness = 0.03;
floor.material.metalness = 0.95;
floor.material.transparent = true;
floor.material.envMapIntensity = 1.2;
floor.material.reflectivity = 0.92;

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Luz rasante (reduzida) apenas para ambiente subtil no chão
const luzRasante = new THREE.SpotLight(0xfff8e0, 0.4, 10, Math.PI / 7, 0.5);
luzRasante.position.set(0, 1.5, 3);
luzRasante.target.position.set(0, 0, 0);
scene.add(luzRasante);
scene.add(luzRasante.target);

// Reflexo subtil animado na intensidade
gsap.to(luzRasante, {
   intensity: 3.2,
  duration: 3,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// Novo círculo de luz no chão: mais fino, elegante e radiante
// Novo círculo de luz no chão: mais fino, elegante e radiante
const circle = new THREE.Mesh(
  new THREE.RingGeometry(4.5, 4.7, 100),
  new THREE.MeshStandardMaterial({
    color: 0xfdf6dc,
    emissive: 0xffefc6,
    emissiveIntensity: 3.5,
    metalness: 0.7,
    roughness: 0.15,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  })
);

circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.052;
circle.receiveShadow = true;
scene.add(circle);

// 🟨 Friso horizontal dourado embutido no chão (frente ao círculo de luz)
const frisoChao = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 0.12),
  new THREE.MeshStandardMaterial({
    color: 0xf3c97a,
    metalness: 1,
    roughness: 0.05,
    emissive: 0x4e3a1d,
    emissiveIntensity: 0.35,
    side: THREE.DoubleSide
  })
);
frisoChao.rotation.x = -Math.PI / 2;
frisoChao.position.set(0, 0.052, -2.55); // ligeiramente à frente do círculo
frisoChao.receiveShadow = true;
scene.add(frisoChao);

// Luz rasante discreta para iluminar o friso de chão
const luzFrisoChao = new THREE.SpotLight(0xffeac2, 1.2, 4.2, Math.PI / 10, 0.4);
luzFrisoChao.position.set(0, 1.6, 3.05); // ligeiramente acima do friso
luzFrisoChao.target.position.set(0, 0.05, 3.05); // aponta exatamente para o friso
scene.add(luzFrisoChao, luzFrisoChao.target);

const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

const materialDouradoPedestal = new THREE.MeshPhysicalMaterial({
  color: 0xd9b96c,
  metalness: 1,
  roughness: 0.1,
  clearcoat: 0.9,
  clearcoatRoughness: 0.1,
  emissive: 0x4a320a,
  emissiveIntensity: 0.2,
  reflectivity: 0.5
});


// Gema facetada inspirada no layout, com brilho interno e volume cristalino
function criarVitrine(x, z, indice) {
  const alturaPedestal = 2.8;
  const alturaVitrine = 1.15;
  const alturaTotal = alturaPedestal + alturaVitrine;
  const alturaGema = alturaPedestal + 0.65;

  // 🟫 Pedestal escuro
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, alturaPedestal, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.65,
      metalness: 0.15
    })
  );
  pedestal.position.set(x, alturaPedestal / 2, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  // 🔶 Tampa dourada refinada
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.06, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0xd9b96c,
      metalness: 1,
      roughness: 0.08,
      clearcoat: 0.95,
      clearcoatRoughness: 0.05,
      emissive: 0x3a2a0a,
      emissiveIntensity: 0.25,
      reflectivity: 0.65
    })
  );
  topoDourado.position.set(x, alturaPedestal, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  // 🟦 Vitrine de vidro realista
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, alturaVitrine, 0.88),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 1,
      transparent: true,
      opacity: 0.14,
      ior: 1.45,
      reflectivity: 0.7,
      clearcoat: 0.85
    })
  );
  vitrine.position.set(x, alturaPedestal + alturaVitrine / 2, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  // 💎 Gema facetada inspirada no layout
  const geometriaGema = new THREE.OctahedronGeometry(0.36, 2);
  const materialGema = new THREE.MeshPhysicalMaterial({
    color: 0x7ebfff,
    metalness: 0.4,
    roughness: 0.1,
    transmission: 1,
    thickness: 0.5,
    transparent: true,
    opacity: 0.95,
    reflectivity: 0.9,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    ior: 1.5,
    emissive: 0x224477,
    emissiveIntensity: 0.35
  });

  const gema = new THREE.Mesh(geometriaGema, materialGema);
  gema.position.set(x, alturaGema, z);
  gema.rotation.y = indice * 0.4;
  gema.castShadow = true;
  scene.add(gema);

    // 💡 Luz interior focal na gema
  const luzInterior = new THREE.PointLight(0x88bbff, 1.5, 1.6);
  luzInterior.position.set(x, alturaGema + 0.07, z);
  scene.add(luzInterior);

  // 🛡️ Bloqueador opaco atrás da gema para impedir reflexo na parede
  const bloqueador = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0,
      roughness: 1
    })
  );
  bloqueador.rotation.y = Math.PI; // virado para a parede de fundo
  bloqueador.position.set(x, alturaGema + 0.07, z - 0.18); // ligeiramente atrás
  bloqueador.castShadow = false;
  bloqueador.receiveShadow = true;
  scene.add(bloqueador);

  // ✨ Animação de pulsação para a gema
  gsap.to(gema.material, {
    emissiveIntensity: 0.9,
    duration: 3.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}

// Criar as quatro vitrines conforme layout
criarVitrine(-9.5, -1.8, 0);
criarVitrine(-9.5, 1.8, 1);
criarVitrine(9.5, -1.8, 2);
criarVitrine(9.5, 1.8, 3);

// ✨ Iluminação cenográfica dedicada às gemas
const luzGemas = new THREE.SpotLight(0xcedfff, 1.7, 8, Math.PI / 7, 0.4);
luzGemas.position.set(0, 5.8, 0);
luzGemas.target.position.set(0, 3.4, 0);
scene.add(luzGemas, luzGemas.target);

// Brilho animado subtil para dar vida às gemas
gsap.to(luzGemas, {
  intensity: 2,
  duration: 4,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// 🟨 Luzes refinadas para destacar os frisos com contorno

// Luz inferior frontal – base da parede de fundo
const luzFrisosBase = new THREE.SpotLight(0xffeac2, 0.5, 7, Math.PI / 12, 0.4);
luzFrisosBase.position.set(0, 3.2, -config.wallDistance + 2);
luzFrisosBase.target.position.set(0, 6, -config.wallDistance + 0.01);
scene.add(luzFrisosBase, luzFrisosBase.target);

// Luz lateral esquerda – frisos verticais e horizontais
const luzFrisoEsquerdo = new THREE.SpotLight(0xffeac2, 1.2, 9, Math.PI / 10, 0.45);
luzFrisoEsquerdo.position.set(-13, 10, -config.wallDistance / 2 + 1);
luzFrisoEsquerdo.target.position.set(-13, 8, -config.wallDistance / 2);
scene.add(luzFrisoEsquerdo, luzFrisoEsquerdo.target);

// Luz lateral direita – frisos verticais e horizontais
const luzFrisoDireito = new THREE.SpotLight(0xffeac2, 1.2, 9, Math.PI / 10, 0.45);
luzFrisoDireito.position.set(13, 10, -config.wallDistance / 2 + 1);
luzFrisoDireito.target.position.set(13, 8, -config.wallDistance / 2);
scene.add(luzFrisoDireito, luzFrisoDireito.target);

const frisosParaIluminar = [
  [-6, 8, -config.wallDistance + 1],  // lateral esquerda
  [6, 8, -config.wallDistance + 1],   // lateral direita
  [0, 13.6, -config.wallDistance + 1], // friso superior
  [0, 2.5, -config.wallDistance + 1],  // friso inferior
];

frisosParaIluminar.forEach(([x, y, z]) => {
const luzFriso = new THREE.SpotLight(0xfff0c0, 3.0, 6, Math.PI / 9, 0.6);
  luzFriso.position.set(x, y + 1.5, z + 1.2);
  luzFriso.target.position.set(x, y, z);
  scene.add(luzFriso);
  scene.add(luzFriso.target);
});

// 🖼️ Quadros laterais centrados dentro das molduras duplas

const obrasLaterais = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -11.8,
    y: 8.2,
    z: -config.wallDistance / 2 + 0.071,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 11.8,
    y: 8.2,
    z: -config.wallDistance / 2 + 0.071,
    rotY: -Math.PI / 2
  }
];

obrasLaterais.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(src, tex => {
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.encoding = THREE.sRGBEncoding;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
  });

  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 3.2),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.06,
      side: THREE.FrontSide
    })
  );

  quadro.position.set(x, y, z);
  quadro.rotation.y = rotY;
  quadro.castShadow = true;
  scene.add(quadro);
});


// 🟨 Frisos laterais duplos à esquerda e à direita
const frisoEsquerdo1_v2 = criarFrisoArredondado(2.5, 6.5, 0.4);
frisoEsquerdo1.position.set(-15.48, 6.1, -config.wallDistance / 2 + 0.03);
frisoEsquerdo1.rotation.y = Math.PI / 2;
scene.add(frisoEsquerdo1);

const frisoEsquerdo2_v2 = criarFrisoArredondado(1.6, 4.8, 0.3);
frisoEsquerdo2.position.set(-15.48, 6.1, -config.wallDistance / 2 + 0.05);
frisoEsquerdo2.rotation.y = Math.PI / 2;
scene.add(frisoEsquerdo2);

const frisoDireito1_v2 = criarFrisoArredondado(2.5, 6.5, 0.4);
frisoDireito1.position.set(15.48, 6.1, -config.wallDistance / 2 + 0.03);
frisoDireito1.rotation.y = -Math.PI / 2;
scene.add(frisoDireito1);

const frisoDireito2_v2 = criarFrisoArredondado(1.6, 4.8, 0.3);
frisoDireito2.position.set(15.48, 6.1, -config.wallDistance / 2 + 0.05);
frisoDireito2.rotation.y = -Math.PI / 2;
scene.add(frisoDireito2);

// 🖼️ Obras suspensas (sem moldura), em rotação circular contínua

const obraPaths = [
  "/assets/obras/obra1.jpg",
  "/assets/obras/obra2.jpg",
  "/assets/obras/obra3.jpg",
  "/assets/obras/obra4.jpg",
  "/assets/obras/obra5.jpg",
  "/assets/obras/obra6.jpg",
  "/assets/obras/obra7.jpg",
  "/assets/obras/obra8.jpg"
];

const obrasNormais = [];

// Metadados de cada obra — título, artista, ano, preço em ETH
const dadosObras = [
  { titulo: "Fragmento de Silêncio", artista: "Nandart", ano: 2024, preco: "1.2" },
  { titulo: "Luz Interior", artista: "Nandart", ano: 2023, preco: "0.9" },
  { titulo: "Tempo Suspenso", artista: "Nandart", ano: 2022, preco: "1.0" },
  { titulo: "Caminho Velado", artista: "Nandart", ano: 2023, preco: "0.7" },
  { titulo: "Fronteira do Invisível", artista: "Nandart", ano: 2024, preco: "1.8" },
  { titulo: "Eco de Lume", artista: "Nandart", ano: 2022, preco: "1.1" },
  { titulo: "Alma Circular", artista: "Nandart", ano: 2023, preco: "1.5" },
  { titulo: "Aurora Oculta", artista: "Nandart", ano: 2024, preco: "2.0" }
];
obraPaths.forEach((src, i) => {
  const texture = textureLoader.load(src);
  const ang = (i / obraPaths.length) * Math.PI * 2;
  const x = Math.cos(ang) * config.circleRadius;
  const z = Math.sin(ang) * config.circleRadius;
  const ry = -ang + Math.PI;

  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide
    })
  );

  obra.position.set(x, 4.2, z);
  obra.rotation.y = ry;
  obra.castShadow = true;
  scene.add(obra);

  // Reflexo invertido no chão
  const reflexo = obra.clone();
  reflexo.position.y = -0.01;
  reflexo.scale.y = -1;
  reflexo.material = obra.material.clone();
  reflexo.material.opacity = 0.18;
  reflexo.material.transparent = true;
  reflexo.material.depthWrite = false;
  reflexo.material.roughness = 0.5;
  reflexo.material.metalness = 0.6;
  reflexo.renderOrder = 1;
  scene.add(reflexo);

  obra.userData.reflexo = reflexo;
  reflexo.userData.targetPos = new THREE.Vector3();
  reflexo.userData.targetRot = new THREE.Euler();

  obrasNormais.push(obra);
});

let obraEmDestaque = null;
let estadoOriginal = {};

function mostrarInformacoes(index) {
  const dados = dadosObras[index];
  const texto = `
    <strong>${dados.titulo}</strong><br/>
    ${dados.artista} — ${dados.ano}<br/>
    <span style="font-size: 0.95rem">${dados.preco} ETH</span>
  `;
  document.getElementById('obra-texto').innerHTML = texto;
  document.getElementById('obra-info').style.display = 'block';
}

function esconderInformacoes() {
  document.getElementById('obra-info').style.display = 'none';
}

function destacarObra(obra, index) {
  if (obraEmDestaque) return;

  obraEmDestaque = obra;
document.getElementById('fundo-desfocado').style.opacity = '1';
  // Guardar estado original
  estadoOriginal = {
    position: obra.position.clone(),
    rotation: obra.rotation.y,
    scale: obra.scale.clone()
  };

  // Pausar rotação
  rotacaoPausada = true;

  // Suavizar as restantes obras e reflexos
  obrasNormais.forEach(o => {
    if (o !== obra && o.userData.reflexo) {
      o.material.opacity = 0.1;
      o.userData.reflexo.material.opacity = 0.05;
    }
  });

  // Trazer a obra para o centro
  gsap.to(obra.position, {
    x: 0,
    y: 6,
    z: 0.5,
    duration: 1,
    ease: 'power2.out'
  });

  gsap.to(obra.scale, {
    x: 1.5,
    y: 1.5,
    duration: 1,
    ease: 'power2.out'
  });

  // Mostrar painel de informações
  mostrarInformacoes(index);
}

function restaurarObra() {
  estadoOriginal = {};
  if (!obraEmDestaque) return;

  // Restaurar posição original
  gsap.to(obraEmDestaque.position, {
    x: estadoOriginal.position.x,
    y: estadoOriginal.position.y,
    z: estadoOriginal.position.z,
    duration: 1,
    ease: 'power2.inOut'
  });

  gsap.to(obraEmDestaque.scale, {
    x: estadoOriginal.scale.x,
    y: estadoOriginal.scale.y,
    duration: 1,
    ease: 'power2.inOut'
  });

  // Restaurar opacidade das outras obras
  obrasNormais.forEach(o => {
    if (o.userData.reflexo) {
      o.material.opacity = 1;
      o.userData.reflexo.material.opacity = 0.18;
    }
  });

  esconderInformacoes();
  obraEmDestaque = null;
  rotacaoPausada = false;
}

// Detectar clique/touch na obra
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onPointerDown(event) {
  if (obraEmDestaque) {
    restaurarObra();
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(obrasNormais);

  if (intersects.length > 0) {
    const obra = intersects[0].object;
    const index = obrasNormais.indexOf(obra);
    destacarObra(obra, index);
  }
}

window.addEventListener('pointerdown', onPointerDown);
// ✨ Texto "NANdART" com presença refinada no topo da parede de fundo

const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    const textGeo = new TextGeometry('NANdART', {
      font,
      size: 0.65,
      height: 0.12,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 5
    });

    textGeo.computeBoundingBox();
    const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

    const texto = new THREE.Mesh(
      textGeo,
      new THREE.MeshStandardMaterial({
        color: 0xc4b582,
        metalness: 0.9,
        roughness: 0.3,
        emissive: 0x302a19,
        emissiveIntensity: 0.4
      })
    );

    texto.position.set(-largura / 2, 15.8, -config.wallDistance - 3.985);
    texto.castShadow = true;
    scene.add(texto);
  }
);


// 🖼️ Quadro central com friso circular dourado embutido
const quadroDecorativoFundo = new THREE.Group();

const larguraQuadro = 3.6;
const alturaQuadro = 4.5;

// Imagem da obra central
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  texture => {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
  },
  undefined,
  err => console.error('Erro ao carregar obra-central.jpg:', err)
);

const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0x000000,
    side: THREE.FrontSide
  })
);

pintura.position.z = 0.01;
quadroDecorativoFundo.add(pintura);

// Moldura anelar exterior dourada
const frisoExterior = new THREE.Mesh(
  new THREE.RingGeometry(
    larguraQuadro / 2 + 0.12,
    larguraQuadro / 2 + 0.18,
    64
  ),
  new THREE.MeshStandardMaterial({
    color: 0xc4b582,
    metalness: 1,
    roughness: 0.05,
    emissive: 0x2a1f0f,
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide
  })
);
frisoExterior.rotation.x = Math.PI / 2;
frisoExterior.position.z = 0.015;
quadroDecorativoFundo.add(frisoExterior);

// Posicionamento do grupo do quadro central
quadroDecorativoFundo.position.set(0, 8.5, -config.wallDistance - 3.5);
scene.add(quadroDecorativoFundo);

// 🟨 Molduras decorativas com dupla camada nas paredes laterais e moldura simples na parede de fundo
function criarMolduraDecorativa(points, material) {
  const curve = new THREE.CatmullRomCurve3(points, true);
  const geometry = new THREE.TubeGeometry(curve, 100, 0.025, 8, true);
  return new THREE.Mesh(geometry, material);
}

const molduraMaterialExterior = new THREE.MeshStandardMaterial({
  color: 0xf3c97a,
  metalness: 1,
  roughness: 0.05,
  emissive: 0x4e3a1d,
  emissiveIntensity: 0.35
});

const molduraMaterialInterior = new THREE.MeshStandardMaterial({
  color: 0xf5e5bb,
  metalness: 0.9,
  roughness: 0.1,
  emissive: 0x2a1d0a,
  emissiveIntensity: 0.2
});

// 📐 Moldura dupla lateral esquerda
const molduraExtEsq = criarMolduraDecorativa([
  new THREE.Vector3(-15.2, 1.8, -config.wallDistance / 2 + 0.02),
  new THREE.Vector3(-15.2, 13.5, -config.wallDistance / 2 + 0.02),
  new THREE.Vector3(-11.3, 13.5, -config.wallDistance / 2 + 0.02),
  new THREE.Vector3(-11.3, 1.8, -config.wallDistance / 2 + 0.02)
], molduraMaterialExterior);
scene.add(molduraExtEsq);

const molduraIntEsq = criarMolduraDecorativa([
  new THREE.Vector3(-14.7, 2.4, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(-14.7, 12.8, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(-11.8, 12.8, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(-11.8, 2.4, -config.wallDistance / 2 + 0.021)
], molduraMaterialInterior);
scene.add(molduraIntEsq);

// 📐 Moldura dupla lateral direita
const molduraExtDir = criarMolduraDecorativa([
  new THREE.Vector3(15.2, 1.8, -config.wallDistance / 2 + 0.02),
  new THREE.Vector3(15.2, 13.5, -config.wallDistance / 2 + 0.02),
  new THREE.Vector3(11.3, 13.5, -config.wallDistance / 2 + 0.02),
  new THREE.Vector3(11.3, 1.8, -config.wallDistance / 2 + 0.02)
], molduraMaterialExterior);
scene.add(molduraExtDir);

const molduraIntDir = criarMolduraDecorativa([
  new THREE.Vector3(14.7, 2.4, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(14.7, 12.8, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(11.8, 12.8, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(11.8, 2.4, -config.wallDistance / 2 + 0.021)
], molduraMaterialInterior);
scene.add(molduraIntDir);

// 📐 Moldura central simples da parede de fundo
const molduraCentral = criarMolduraDecorativa([
  new THREE.Vector3(-6.5, 2.8, -config.wallDistance + 0.01),
  new THREE.Vector3(-6.5, 14.2, -config.wallDistance + 0.01),
  new THREE.Vector3(6.5, 14.2, -config.wallDistance + 0.01),
  new THREE.Vector3(6.5, 2.8, -config.wallDistance + 0.01)
], molduraMaterialExterior);
scene.add(molduraCentral);

// 📏 Traço subtil no topo da parede de fundo (acima da moldura central)
const frisoSuperiorSubtil = new THREE.Mesh(
  new THREE.PlaneGeometry(13.2, 0.04),
  new THREE.MeshStandardMaterial({
    color: 0xf3c97a,
    metalness: 1,
    roughness: 0.1,
    emissive: 0x4a2a0a,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide
  })
);
frisoSuperiorSubtil.position.set(0, 15.3, -config.wallDistance + 0.015);
scene.add(frisoSuperiorSubtil);

// 🟨 Frisos decorativos laterais com estrutura dupla (inspirados no layout original)

// Material dourado realista
const materialFriso = new THREE.MeshStandardMaterial({
  color: 0xf3c97a,
  metalness: 1,
  roughness: 0.05,
  emissive: 0x4e3a1d,
  emissiveIntensity: 0.35
});

// Função para criar frisos duplos verticais (um dentro do outro)
function criarFrisoDuplo(x, y, z, alturaExterna, alturaInterna, offset = 0.2, rotY = 0) {
  const larguraExterna = 0.35;
  const larguraInterna = 0.18;

  // Friso exterior
  const frisoExterno = new THREE.Mesh(
    new THREE.CylinderGeometry(larguraExterna, larguraExterna, alturaExterna, 32),
    materialFriso
  );
  frisoExterno.position.set(x, y, z);
  frisoExterno.rotation.y = rotY;
  frisoExterno.castShadow = true;
  scene.add(frisoExterno);

  // Friso interior
  const frisoInterno = new THREE.Mesh(
    new THREE.CylinderGeometry(larguraInterna, larguraInterna, alturaInterna, 32),
    materialFriso
  );
  frisoInterno.position.set(x, y, z + 0.01);
  frisoInterno.rotation.y = rotY;
  frisoInterno.castShadow = true;
  scene.add(frisoInterno);
}

// ➕ Frisos duplos nas paredes laterais (esquerda e direita)
criarFrisoDuplo(-11.8, 8.2, -config.wallDistance / 2 + 0.01, 12, 11.4); // lateral esquerda – interior e exterior
criarFrisoDuplo(11.8, 8.2, -config.wallDistance / 2 + 0.01, 12, 11.4);  // lateral direita – interior e exterior

// ➕ Friso simples central na parede de fundo (sem camada dupla)
const frisoVerticalCentral = new THREE.Mesh(
  new THREE.CylinderGeometry(0.3, 0.3, 11.8, 32),
  materialFriso
);
frisoCentral.position.set(0, 8.2, -config.wallDistance + 0.03);
scene.add(frisoCentral);

// ➕ Traço subtil horizontal acima do friso central da parede de fundo
const frisoHorizontalFino = new THREE.Mesh(
  new THREE.PlaneGeometry(4.6, 0.05),
  materialFriso
);
frisoHorizontalFino.position.set(0, 14.65, -config.wallDistance + 0.01);
scene.add(frisoHorizontalFino);


let rotacaoPausada = false;
function animate() {
  requestAnimationFrame(animate);

  const tempoAtual = Date.now();
  const tempo = tempoAtual * -0.00012;

  obrasNormais.forEach((obra, i) => {
    const ang = tempo + (i / obrasNormais.length) * Math.PI * 2;
    const x = Math.cos(ang) * config.circleRadius;
    const z = Math.sin(ang) * config.circleRadius;
    const ry = -ang + Math.PI;

    // Se estiver em destaque, reduzir drasticamente a rotação
    const intensidade = (obra === obraEmDestaque) ? 0.005 : 1;

    obra.position.x += (x - obra.position.x) * 0.05 * intensidade;
    obra.position.z += (z - obra.position.z) * 0.05 * intensidade;
    obra.rotation.y += (ry - obra.rotation.y) * 0.05 * intensidade;

    const reflexo = obra.userData.reflexo;
    if (reflexo) {
      const tx = x;
      const tz = z;
      const tryy = ry;

      reflexo.userData.targetPos.set(tx, -0.01, tz);
      reflexo.userData.targetRot.set(0, tryy, 0);

      reflexo.position.lerp(reflexo.userData.targetPos, 0.05 * intensidade);
      reflexo.rotation.y += (tryy - reflexo.rotation.y) * 0.05 * intensidade;
    }
  });

  renderer.render(scene, camera);
}

// Criação do painel de informações por baixo da obra em destaque
const infoContainer = document.createElement('div');
infoContainer.id = 'obra-info';
infoContainer.className = 'obra-info';
infoContainer.style.display = 'none';
infoContainer.innerHTML = `
  <div id="obra-texto"></div>
  <button id="botao-comprar">Buy</button>
`;

document.body.appendChild(infoContainer);
// Fundo desfocado subtilmente
const fundoDesfocado = document.createElement('div');
fundoDesfocado.id = 'fundo-desfocado';
fundoDesfocado.style.position = 'fixed';
fundoDesfocado.style.top = '0';
fundoDesfocado.style.left = '0';
fundoDesfocado.style.width = '100vw';
fundoDesfocado.style.height = '100vh';
fundoDesfocado.style.backdropFilter = 'blur(3px)';
fundoDesfocado.style.zIndex = '1000';
fundoDesfocado.style.pointerEvents = 'none';
fundoDesfocado.style.opacity = '0';
fundoDesfocado.style.transition = 'opacity 0.5s ease';
document.body.appendChild(fundoDesfocado);
const botaoComprar = infoContainer.querySelector('#botao-comprar');

async function buyHandler() {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask não está instalada. Por favor instala para continuar.');
    return;
  }

  try {
    botaoComprar.disabled = true;
    botaoComprar.textContent = 'A ligar carteira...';

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    console.log("Carteira ligada:", address);
    botaoComprar.textContent = 'A processar compra...';

    // Transação real (simulada com endereço de teste)
    const tx = await signer.sendTransaction({
      to: "0x000000000000000000000000000000000000dead",
      value: ethers.utils.parseEther("0.01")
    });

    console.log("Transação enviada:", tx.hash);
    botaoComprar.textContent = 'Adquirido!';
    botaoComprar.style.backgroundColor = '#b0dcb8';
    botaoComprar.style.color = '#111';

    setTimeout(() => {
      botaoComprar.disabled = false;
      botaoComprar.textContent = 'Buy';
      botaoComprar.style.backgroundColor = '#fff2c6';
      botaoComprar.style.color = '#111';
    }, 3000);

  } catch (err) {
    console.error("Erro ao processar compra:", err);
    alert("A compra foi cancelada ou ocorreu um erro.");
    botaoComprar.disabled = false;
    botaoComprar.textContent = 'Buy';
  }
}

botaoComprar.addEventListener('click', buyHandler);
function animate() {
  requestAnimationFrame(animate);
}
animate();
