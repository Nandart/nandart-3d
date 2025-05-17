import './styles/index.css';
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// 🧭 Viewport dinâmico por níveis
function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 14.5, cameraY: 5.2, textSize: 0.4 },
  SM: { obraSize: 1.0, circleRadius: 2.6, wallDistance: 9, cameraZ: 15, cameraY: 5.3, textSize: 0.45 },
  MD: { obraSize: 1.1, circleRadius: 3.1, wallDistance: 10, cameraZ: 15.2, cameraY: 5.4, textSize: 0.5 },
  LG: { obraSize: 1.2, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 15.4, cameraY: 5.5, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

// 🎥 Cena e Câmara
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera();
updateCamera();

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 34;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY + 5.8, config.cameraZ + 13);
  camera.lookAt(0, 7, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}

// 🧱 Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;
// 💡 Luz ambiente geral (triplicada)
const luzAmbiente = new THREE.PointLight(0xfff2dd, 1.8, 50, 2);
luzAmbiente.position.set(0, 9.5, 0);
scene.add(luzAmbiente);

// 💡 Luz hemisférica suave
const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 1.5);
scene.add(luzHemisferica);

// 💡 Luzes rasantes laterais
const spotEsquerda = new THREE.SpotLight(0xfff0db, 0.35, 18, Math.PI / 5, 0.5);
spotEsquerda.position.set(-12, 5.5, 0);
spotEsquerda.target.position.set(-12, 5.5, -10);
scene.add(spotEsquerda, spotEsquerda.target);

const spotDireita = new THREE.SpotLight(0xfff0db, 0.35, 18, Math.PI / 5, 0.5);
spotDireita.position.set(12, 5.5, 0);
spotDireita.target.position.set(12, 5.5, -10);
scene.add(spotDireita, spotDireita.target);

// 🧱 Chão reflexivo tipo obsidiana líquida
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

// 💡 Luz rasante para reflexos
const luzChao = new THREE.SpotLight(0xfff8e0, 1.3, 20, Math.PI / 7, 0.5);
luzChao.position.set(0, 4.5, 4);
luzChao.target.position.set(0, 0, 0);
scene.add(luzChao, luzChao.target);
gsap.to(luzChao, {
  intensity: 1.6,
  duration: 3,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// 🎨 Texturas base
const textureLoader = new THREE.TextureLoader();
const texturaParede = textureLoader.load('/assets/parede-antracite.jpg');
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

// 🧱 Parede de fundo texturizada com antracite
const paredeGeo = new THREE.PlaneGeometry(40, 30);
const paredeMaterial = new THREE.MeshStandardMaterial({
  map: texturaParede,
  roughness: 0.9,
  metalness: 0.1,
  side: THREE.FrontSide
});
const backWall = new THREE.Mesh(paredeGeo, paredeMaterial);
backWall.position.set(0, 13, -config.wallDistance - 4.05);
backWall.receiveShadow = true;
scene.add(backWall);
// 🧱 Painel central com contornos arredondados e linha superior
const painelCentralForma = new THREE.Shape();
const w = 6, h = 6, r = 0.6;
painelCentralForma.moveTo(-w / 2 + r, -h / 2);
painelCentralForma.lineTo(w / 2 - r, -h / 2);
painelCentralForma.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
painelCentralForma.lineTo(w / 2, h / 2 - r);
painelCentralForma.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
painelCentralForma.lineTo(-w / 2 + r, h / 2);
painelCentralForma.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
painelCentralForma.lineTo(-w / 2, -h / 2 + r);
painelCentralForma.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

const painelCentral = new THREE.Mesh(
  new THREE.ShapeGeometry(painelCentralForma),
  new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.65,
    metalness: 0.1
  })
);
painelCentral.position.set(0, 13, -config.wallDistance - 4.04);
scene.add(painelCentral);

// ➖ Linha horizontal subtil próxima do topo do painel central
const linhaSuperior = new THREE.Mesh(
  new THREE.BoxGeometry(3.2, 0.05, 0.01),
  new THREE.MeshStandardMaterial({
    color: 0x3b3b3b,
    roughness: 0.45
  })
);
linhaSuperior.position.set(0, 15.9, -config.wallDistance - 4.03);
scene.add(linhaSuperior);

// 🧭 Função para painéis laterais com friso embutido duplo (estrutura interior e exterior)
function criarPainelLateralComFriso(x) {
  const grupo = new THREE.Group();

  // Painel base arredondado
  const forma = new THREE.Shape();
  const wp = 3, hp = 12, rp = 0.5;
  forma.moveTo(-wp / 2 + rp, -hp / 2);
  forma.lineTo(wp / 2 - rp, -hp / 2);
  forma.quadraticCurveTo(wp / 2, -hp / 2, w / 2, -hp / 2 + rp);
  forma.lineTo(wp / 2, hp / 2 - rp);
  forma.quadraticCurveTo(wp / 2, hp / 2, wp / 2 - rp, hp / 2);
  forma.lineTo(-wp / 2 + rp, hp / 2);
  forma.quadraticCurveTo(-wp / 2, hp / 2, -wp / 2, hp / 2 - rp);
  forma.lineTo(-wp / 2, -hp / 2 + rp);
  forma.quadraticCurveTo(-wp / 2, -hp / 2, -wp / 2 + rp, -hp / 2);

  const painel = new THREE.Mesh(
    new THREE.ShapeGeometry(forma),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.6,
      metalness: 0.1
    })
  );
  grupo.add(painel);

  // Friso exterior dourado
  const frisoExterior = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 11.5, 0.01),
    new THREE.MeshStandardMaterial({
      color: 0xd2b272,
      roughness: 0.25,
      metalness: 0.85,
      emissive: 0x3a2a0a,
      emissiveIntensity: 0.15
    })
  );
  frisoExterior.position.z = 0.01;
  grupo.add(frisoExterior);

  // Friso interior menor
  const frisoInterior = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 10.2, 0.01),
    new THREE.MeshStandardMaterial({
      color: 0x9c8351,
      roughness: 0.3,
      metalness: 0.75,
      emissive: 0x2a1b0a,
      emissiveIntensity: 0.1
    })
  );
  frisoInterior.position.z = 0.02;
  grupo.add(frisoInterior);

  grupo.position.set(x, 13, -config.wallDistance - 4.03);
  scene.add(grupo);
}

criarPainelLateralComFriso(-8);
criarPainelLateralComFriso(8);
// 🔻 Frisos horizontais contínuos no rodapé que se estendem nas paredes laterais
function criarFrisoInferiorContínuo(offsetY) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(60, 0.05, 0.01),
    new THREE.MeshStandardMaterial({
      color: 0xd2b272,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x3a2a0a,
      emissiveIntensity: 0.12
    })
  );
  friso.position.set(0, offsetY, -config.wallDistance - 4.02);
  scene.add(friso);
}
criarFrisoInferiorContínuo(0.3);
criarFrisoInferiorContínuo(0.6);

// 🎨 Material dourado refinado para topo dos pedestais
const materialDouradoPedestal = new THREE.MeshPhysicalMaterial({
  color: 0xd9b96c,
  metalness: 1,
  roughness: 0.08,
  clearcoat: 0.95,
  clearcoatRoughness: 0.06,
  emissive: 0x4a320a,
  emissiveIntensity: 0.25,
  reflectivity: 0.6
});

// 🧱 Função para criar pedestal completo com vitrine e gema central
function criarVitrineCompleta(x, z, indice) {
  const grupo = new THREE.Group();
  const alturaTotal = 4.8;
  const alturaVidro = 1.4;
  const raioGema = 0.36;

  // Pedestal sólido elevado
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.6, alturaTotal - alturaVidro, 32),
    new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.6,
      metalness: 0.2
    })
  );
  pedestal.position.set(x, (alturaTotal - alturaVidro) / 2, z);
  pedestal.castShadow = true;
  grupo.add(pedestal);

  // Topo dourado — tampa do pedestal
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.05, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, alturaTotal - alturaVidro - 0.03, z);
  topoDourado.castShadow = true;
  grupo.add(topoDourado);

  // Vitrine em vidro realista
  const vitrine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.38, alturaVidro, 64, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      metalness: 0.1,
      roughness: 0.04,
      transmission: 1,
      thickness: 0.45,
      transparent: true,
      opacity: 0.08,
      ior: 1.52,
      reflectivity: 0.7,
      clearcoat: 0.85,
      clearcoatRoughness: 0.04,
      side: THREE.DoubleSide
    })
  );
  vitrine.position.set(x, alturaTotal - alturaVidro / 2, z);
  vitrine.castShadow = true;
  grupo.add(vitrine);

  // Gema facetada com brilho suave
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(raioGema, 1),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      emissive: indice % 2 === 0 ? 0x3366aa : 0x4466bb,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.95,
      metalness: 0.3,
      roughness: 0.1
    })
  );
  gema.position.set(x, alturaTotal - alturaVidro + raioGema * 0.6, z);
  gema.rotation.y = indice * 0.5;
  gema.castShadow = true;
  grupo.add(gema);

  scene.add(grupo);
}

// 💎 Criar as 4 vitrines simétricas
criarVitrineCompleta(-9.5, -1.8, 0);
criarVitrineCompleta(-9.5, 1.8, 1);
criarVitrineCompleta(9.5, -1.8, 2);
criarVitrineCompleta(9.5, 1.8, 3);
// 🎨 Textura da obra central
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro ao carregar obra-central.jpg:', err)
);

// 🖼️ Obra central ajustada, sem frisos nem auréola
const quadroCentral = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 4.2),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.08,
    transparent: true
  })
);

// 📍 Posicionada com precisão dentro do painel central (não à frente dele)
quadroCentral.position.set(0, 13, -config.wallDistance - 4.029);
quadroCentral.castShadow = true;
scene.add(quadroCentral);
// ✨ Animação subtil de brilho pulsante na obra central
gsap.to(quadroCentral.material, {
  emissiveIntensity: 0.15,
  duration: 5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
  onUpdate: () => (quadroCentral.material.needsUpdate = true)
});

// ✨ Molduras douradas com brilho oscilante
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.material.color?.getHex?.() === 0xd9b96c
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.35,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// ✨ Gemas com brilho pulsante
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 1.2,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// 🎨 Caminhos para as obras circulantes
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

obraPaths.forEach((src, i) => {
  const texture = textureLoader.load(src);
  const ang = (i / obraPaths.length) * Math.PI * 2;
  const x = Math.cos(ang) * config.circleRadius;
  const z = Math.sin(ang) * config.circleRadius;
  const ry = -ang + Math.PI;

  // Obra suspensa principal
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

  // Reflexo subtil no chão
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
// ✨ Animação subtil de brilho na obra central
gsap.to(quadroCentral.material, {
  emissiveIntensity: 0.15,
  duration: 5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
  onUpdate: () => (quadroCentral.material.needsUpdate = true)
});

// ✨ Molduras douradas com brilho oscilante
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.material.color?.getHex?.() === 0xd9b96c
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.35,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// ✨ Gemas com brilho pulsante
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 1.2,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});
// 🔄 Responsividade da câmara e renderer
window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
