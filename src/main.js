import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 13, cameraY: 5.5, textSize: 0.4 },
  SM: { obraSize: 1.0, circleRadius: 2.6, wallDistance: 9, cameraZ: 13, cameraY: 5.5, textSize: 0.45 },
  MD: { obraSize: 1.1, circleRadius: 3.1, wallDistance: 10, cameraZ: 13, cameraY: 5.5, textSize: 0.5 },
  LG: { obraSize: 1.2, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 13, cameraY: 5.5, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

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

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;

// ✨ Luz ambiente dupla para iluminação geral reforçada
const luzAmbiente1 = new THREE.AmbientLight(0xfff2dd, 0.55);
const luzAmbiente2 = new THREE.AmbientLight(0xfff2dd, 0.55);
scene.add(luzAmbiente1, luzAmbiente2);

// Luz hemisférica suave para variação cromática geral
const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.4);
scene.add(luzHemisferica);

// Luz rasante lateral esquerda
const luzRasanteEsquerda = new THREE.SpotLight(0xfff2dd, 0.7);
luzRasanteEsquerda.position.set(-10, 8, 0);
luzRasanteEsquerda.angle = Math.PI / 6;
luzRasanteEsquerda.penumbra = 0.3;
luzRasanteEsquerda.decay = 2;
luzRasanteEsquerda.distance = 25;
luzRasanteEsquerda.castShadow = true;
luzRasanteEsquerda.shadow.mapSize.width = 1024;
luzRasanteEsquerda.shadow.mapSize.height = 1024;
luzRasanteEsquerda.shadow.bias = -0.0005;
scene.add(luzRasanteEsquerda);

import { Reflector } from 'three/addons/objects/Reflector.js';

const floorGeometry = new THREE.PlaneGeometry(40, 40);

const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x0a0a0a,
  recursion: 2
});

floor.material.opacity = 0.88;
floor.material.roughness = 0.02;
floor.material.metalness = 0.98;
floor.material.transparent = true;
floor.material.envMapIntensity = 1.3;
floor.material.reflectivity = 0.95;

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Círculo de luz ampliado
const circle = new THREE.Mesh(
  new THREE.RingGeometry(4.3, 4.55, 100),
  new THREE.MeshStandardMaterial({
    color: 0xfdf6dc,
    emissive: 0xffefc6,
    emissiveIntensity: 3.8,
    metalness: 0.75,
    roughness: 0.1,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.051;
circle.receiveShadow = true;
scene.add(circle);

// Friso horizontal dourado vivo após o círculo de luz
const frisoChao = new THREE.Mesh(
  new THREE.BoxGeometry(36, 0.06, 0.03),
  new THREE.MeshStandardMaterial({
    color: 0xd8b26c,
    metalness: 1,
    roughness: 0.05,
    emissive: 0x3a2a0a,
    emissiveIntensity: 0.25
  })
);
frisoChao.position.set(0, 0.032, -config.wallDistance / 2 + 0.8);
scene.add(frisoChao);

// Preparação dos frisos embutidos – funções utilitárias
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0xf3cc80,
  metalness: 1,
  roughness: 0.08,
  emissive: 0x3a240a,
  emissiveIntensity: 0.3
});

function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, 0.02),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = false;
  scene.add(friso);
  return friso;
}

function criarFrisoRect(x, y, z, largura, altura, rotY = 0) {
  const group = new THREE.Group();
  const espessura = 0.06;

  const topo = new THREE.Mesh(new THREE.BoxGeometry(largura, espessura, 0.02), frisoMaterial);
  topo.position.set(0, altura / 2, 0);
  group.add(topo);

  const base = new THREE.Mesh(new THREE.BoxGeometry(largura, espessura, 0.02), frisoMaterial);
  base.position.set(0, -altura / 2, 0);
  group.add(base);

  const esquerda = new THREE.Mesh(new THREE.BoxGeometry(espessura, altura, 0.02), frisoMaterial);
  esquerda.position.set(-largura / 2, 0, 0);
  group.add(esquerda);

  const direita = new THREE.Mesh(new THREE.BoxGeometry(espessura, altura, 0.02), frisoMaterial);
  direita.position.set(largura / 2, 0, 0);
  group.add(direita);

  group.position.set(x, y, z);
  group.rotation.y = rotY;
  scene.add(group);
  return group;
}
// Friso central da parede de fundo (quadrado com linha horizontal)
const frisoCentral = criarFrisoRect(0, 6.9, -config.wallDistance + 0.01, 4.4, 5.4);

// Linha horizontal superior do friso central
criarFrisoLinha(0, 9.65, -config.wallDistance + 0.015, 3.2);

// Frisos laterais embutidos com contorno duplo
// Esquerda - externo
criarFrisoRect(-7.6, 6.9, -config.wallDistance + 0.01, 2.2, 6.8);
// Esquerda - interno
criarFrisoRect(-7.6, 6.9, -config.wallDistance + 0.012, 1.2, 5.5);

// Direita - externo
criarFrisoRect(7.6, 6.9, -config.wallDistance + 0.01, 2.2, 6.8);
// Direita - interno
criarFrisoRect(7.6, 6.9, -config.wallDistance + 0.012, 1.2, 5.5);

// Frisos horizontais inferiores contínuos — atravessam a parede de fundo e continuam nas laterais
criarFrisoLinha(0, 0.3, -config.wallDistance + 0.01, 36); // parede de fundo

// Continuação para as paredes laterais (laterais assumem Z constante do centro)
criarFrisoLinha(-16.2, 0.3, -config.wallDistance / 2, 2.2, 0); // esquerda
criarFrisoLinha(16.2, 0.3, -config.wallDistance / 2, 2.2, 0);  // direita

// 🖼️ Quadro central ajustado e posicionado no centro do friso
const textureLoader = new THREE.TextureLoader();
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

const quadroDecorativoFundo = new THREE.Group();
const larguraQuadro = 3.6;
const alturaQuadro = 4.5;

const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.1
  })
);
pintura.position.z = 0.01;
quadroDecorativoFundo.add(pintura);

quadroDecorativoFundo.position.set(0, 6.9, -config.wallDistance + 0.001);
scene.add(quadroDecorativoFundo);
// Textura de parede
const texturaParede = textureLoader.load('/assets/parede-antracite.jpg');

const paredeGeo = new THREE.PlaneGeometry(40, 30);
const paredeMaterial = new THREE.MeshStandardMaterial({
  map: texturaParede,
  roughness: 0.9,
  metalness: 0.1,
  side: THREE.FrontSide
});

// 🧱 Parede de fundo
const backWall = new THREE.Mesh(paredeGeo, paredeMaterial);
backWall.position.set(0, 13, -config.wallDistance - 4.05);
backWall.receiveShadow = true;
scene.add(backWall);

// 🧱 Paredes laterais aproximadas dos pedestais (baseado no layout)
const paredeLateralGeo = new THREE.PlaneGeometry(30, 28);

const leftWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
leftWall.position.set(-14.6, 13, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
rightWall.position.set(14.6, 13, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
scene.add(rightWall);

// Material dourado para topo do pedestal
const materialDouradoPedestal = new THREE.MeshPhysicalMaterial({
  color: 0xd9b96c,
  metalness: 1,
  roughness: 0.08,
  clearcoat: 0.9,
  clearcoatRoughness: 0.05,
  emissive: 0x4a320a,
  emissiveIntensity: 0.25,
  reflectivity: 0.6
});

// Textura da gema
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

// Função para criar vitrines e pedestais fiéis ao layout
function criarVitrine(x, z, indice) {
  const alturaPedestal = 3.6;
  const alturaGema = alturaPedestal + 1.0;
  const emissivaBase = 0x3377cc;
  const intensidade = 1.9;

  // Pedestal alto e sólido
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, alturaPedestal, 1.05),
    new THREE.MeshStandardMaterial({
      color: 0x121212,
      roughness: 0.55,
      metalness: 0.2
    })
  );
  pedestal.position.set(x, alturaPedestal / 2, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  // Tampa dourada (não entra na vitrine)
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.06, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, alturaPedestal + 0.03, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  // Vitrine realista
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.15, 1.0),
    new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.35,
      transparent: true,
      opacity: 0.11,
      ior: 1.45,
      reflectivity: 0.65,
      clearcoat: 0.85,
      clearcoatRoughness: 0.05
    })
  );
  vitrine.position.set(x, alturaPedestal + 0.6, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  // Objeto facetado dentro da vitrine com brilho
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.4, 1),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      emissive: emissivaBase,
      emissiveIntensity: intensidade,
      transparent: true,
      opacity: 0.95
    })
  );
  gema.position.set(x, alturaGema, z);
  gema.rotation.y = indice * 0.3;
  gema.castShadow = true;
  scene.add(gema);
}

// Criar quatro vitrines
criarVitrine(-9.5, -1.8, 0);
criarVitrine(-9.5, 1.8, 1);
criarVitrine(9.5, -1.8, 2);
criarVitrine(9.5, 1.8, 3);
// Quadros laterais embutidos nas paredes
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -14.55, y: 6.1, z: -config.wallDistance / 2,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 14.55, y: 6.1, z: -config.wallDistance / 2,
    rotY: -Math.PI / 2
  }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(src);

  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 3.2),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.FrontSide
    })
  );

  quadro.position.set(x, y, z + 0.001);
  quadro.rotation.y = rotY;
  quadro.receiveShadow = true;
  scene.add(quadro);
});

// Texto NANdART com luz dedicada e presença elegante
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

    texto.position.set(-largura / 2, 16.5, -config.wallDistance - 3.985);
    texto.castShadow = true;
    scene.add(texto);

    const luzTexto = new THREE.SpotLight(0xfff1cc, 1.4, 12, Math.PI / 9, 0.5);
    luzTexto.position.set(0, 18, -config.wallDistance - 2);
    luzTexto.target = texto;
    scene.add(luzTexto);
    scene.add(luzTexto.target);
  }
);

// Obras circulantes (suspensas, sem molduras) com tamanho duplicado
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

  const reflexo = obra.clone();
  reflexo.position.y = -0.01;
  reflexo.scale.y = -1;
  reflexo.material = obra.material.clone();
  reflexo.material.opacity = 0.2;
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
// Atualização de dimensão ao redimensionar a janela
window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ✨ Reflexos animados subtis nas molduras e gemas

// Moldura do quadro central – animação suave no brilho
gsap.to(pintura.material, {
  emissiveIntensity: 0.15,
  duration: 5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
  onUpdate: () => pintura.material.needsUpdate = true
});

// Frisos – reflexo pulsante suave
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.material.emissiveIntensity &&
    obj.material.color &&
    obj.material.color.getHex() === 0xf3cc80
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.4,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// Gemas – brilho mágico oscilante
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 2.0,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// ✨ Animação contínua das obras suspensas e seus reflexos
function animate() {
  requestAnimationFrame(animate);

  const tempo = Date.now() * -0.00012;
  obrasNormais.forEach((obra, i) => {
    const ang = tempo + (i / obrasNormais.length) * Math.PI * 2;
    const x = Math.cos(ang) * config.circleRadius;
    const z = Math.sin(ang) * config.circleRadius;
    const ry = -ang + Math.PI;

    obra.position.x = x;
    obra.position.z = z;
    obra.rotation.y = ry;

    const reflexo = obra.userData.reflexo;
    if (reflexo) {
      reflexo.userData.targetPos.set(x, -0.01, z);
      reflexo.userData.targetRot.set(0, ry, 0);
      reflexo.position.lerp(reflexo.userData.targetPos, 0.1);
      reflexo.rotation.y += (ry - reflexo.rotation.y) * 0.1;
    }
  });

  renderer.render(scene, camera);
}

animate();

