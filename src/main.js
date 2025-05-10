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
  XS: { obraSize: 0.35, premiumSize: 0.45, circleRadius: 2.4, wallDistance: 8, cameraZ: 13, cameraY: 5.5, textSize: 0.4 },
  SM: { obraSize: 0.4, premiumSize: 0.5, circleRadius: 2.6, wallDistance: 9, cameraZ: 13, cameraY: 5.5, textSize: 0.45 },
  MD: { obraSize: 0.45, premiumSize: 0.6, circleRadius: 3.1, wallDistance: 10, cameraZ: 13, cameraY: 5.5, textSize: 0.5 },
  LG: { obraSize: 0.5, premiumSize: 0.65, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 13, cameraY: 5.5, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
updateCamera();

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY, config.cameraZ);
  camera.lookAt(0, 5.8, 0);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

// Iluminação ambiente e cenográfica
scene.add(new THREE.AmbientLight(0xfff2cc, 1.2));

const luzes = [
  { pos: [-6, 12, -config.wallDistance + 1], target: [-6, 4, -config.wallDistance + 1], intensity: 2.5 },
  { pos: [0, 12, -config.wallDistance + 1], target: [0, 5.8, -config.wallDistance + 1], intensity: 3 },
  { pos: [6, 12, -config.wallDistance + 1], target: [6, 4, -config.wallDistance + 1], intensity: 2.5 },
  { pos: [-10, 12, config.wallDistance / 3], target: [-8, 4, 2], intensity: 2 },
  { pos: [10, 12, config.wallDistance / 3], target: [8, 4, 2], intensity: 2 },
  { pos: [-8, 12, -2], target: [-8, 1.5, -2], intensity: 2.2 },
  { pos: [8, 12, -2], target: [8, 1.5, -2], intensity: 2.2 },
  { pos: [0, 12, 0], target: [0, 5.8, 0], intensity: 2 }
];

luzes.forEach(({ pos, target, intensity }) => {
  const light = new THREE.SpotLight(0xfff7e6, intensity, 20, Math.PI / 6, 0.3);
  light.position.set(...pos);
  light.target.position.set(...target);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  scene.add(light);
  scene.add(light.target);
});

// Luzes adicionais de preenchimento
[
  [0, 5, 10], [5, 5, 8], [-5, 5, 8], [0, 5, -5]
].forEach(pos => {
  const light = new THREE.PointLight(0xfff2cc, 0.8, 15);
  light.position.set(...pos);
  scene.add(light);
});

// Piso com reflexo suave
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.05,
    metalness: 1
  })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Círculo central de luz no chão
const circle = new THREE.Mesh(
  new THREE.RingGeometry(1.8, 2.4, 64),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.02;
scene.add(circle);

// Texturas e materiais
const textureLoader = new THREE.TextureLoader();
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');
const premiumTexture = textureLoader.load('/assets/premium/premium1.jpg');
const starTexture = textureLoader.load('/assets/premium/estrela-premium.png');

const molduraMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1c40f,
  roughness: 0.3,
  metalness: 0.9,
  emissive: 0x222200,
  emissiveIntensity: 0.2
});

// Frisos dourados nas paredes
function adicionarFriso(x, y, z, largura, altura, rotY = 0, depth = 0.05) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xc4b582,
    metalness: 1,
    roughness: 0.2,
    emissive: 0x222211,
    emissiveIntensity: 0.3
  });
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, depth),
    material
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = true;
  scene.add(friso);
}

// Frisos principais
adicionarFriso(0, 13.5, -config.wallDistance + 0.01, 12, 0.15);
adicionarFriso(0, 2.5, -config.wallDistance + 0.01, 12, 0.15);
adicionarFriso(-6, 8, -config.wallDistance + 0.01, 0.15, 11);
adicionarFriso(6, 8, -config.wallDistance + 0.01, 0.15, 11);

// Painel central dourado (camada de fundo)
adicionarFriso(0, 8, -config.wallDistance + 0.005, 10, 10, 0, 0.02);


// Criar vitrines com gemas nos pedestais
function criarVitrine(x, z) {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })
  );
  base.position.set(x, 0.5, z);
  base.castShadow = true;
  scene.add(base);

  const vidro = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1, 0.8),
    new THREE.MeshPhysicalMaterial({
      color: 0xeeeeff,
      transmission: 0.95,
      ior: 1.52,
      transparent: true,
      roughness: 0.05,
      thickness: 0.3
    })
  );
  vidro.position.set(x, 1.5, z);
  vidro.castShadow = true;
  scene.add(vidro);

  const gema = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 32, 32),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x444488,
      emissiveIntensity: 0.8
    })
  );
  gema.position.set(x, 1.5, z);
  gema.castShadow = true;
  scene.add(gema);

  const luz = new THREE.PointLight(0x88ccff, 3, 3);
  luz.position.set(x, 1.5, z);
  scene.add(luz);

  gsap.to(luz, {
    intensity: 5,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
  gsap.to(gema.material, {
    emissiveIntensity: 1.2,
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}

criarVitrine(-8, -2);
criarVitrine(-8, 2);
criarVitrine(8, -2);
criarVitrine(8, 2);

// Obras normais suspensas
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
  const ang = (i / obraPaths.length) * Math.PI * 2;
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(config.obraSize + 0.12, config.obraSize + 0.12, 0.08),
    molduraMaterial.clone()
  );
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshStandardMaterial({
      map: textureLoader.load(src),
      roughness: 0.2,
      metalness: 0.05
    })
  );
  obra.position.z = 0.05;

  const grupo = new THREE.Group();
  grupo.add(moldura);
  grupo.add(obra);
  grupo.position.set(Math.cos(ang) * config.circleRadius, 4.2, Math.sin(ang) * config.circleRadius);
  grupo.rotation.y = -ang + Math.PI;
  grupo.castShadow = true;
  scene.add(grupo);
  obrasNormais.push(grupo);
});

// Obra premium flutuante
const molduraPremium = new THREE.Mesh(
  new THREE.BoxGeometry(config.premiumSize + 0.2, config.premiumSize + 0.2, 0.15),
  molduraMaterial
);

const quadroPremium = new THREE.Mesh(
  new THREE.PlaneGeometry(config.premiumSize, config.premiumSize),
  new THREE.MeshStandardMaterial({
    map: premiumTexture,
    roughness: 0.1,
    metalness: 0.2
  })
);
quadroPremium.position.z = 0.08;

const estrela = new THREE.Mesh(
  new THREE.PlaneGeometry(0.2, 0.2),
  new THREE.MeshStandardMaterial({
    map: starTexture,
    transparent: true,
    emissive: 0xffffaa,
    emissiveIntensity: 0.5
  })
);
estrela.position.set(0.3, 0.3, 0.13);

const grupoPremium = new THREE.Group();
grupoPremium.add(molduraPremium);
grupoPremium.add(quadroPremium);
grupoPremium.add(estrela);
grupoPremium.position.set(0, 5.8, 0);
grupoPremium.castShadow = true;
scene.add(grupoPremium);

// Animação de flutuação da obra premium
let t = 0;
function flutuar() {
  t += 0.016;
  grupoPremium.position.y = 5.8 + Math.sin(t * 2.2) * 0.22;
  grupoPremium.rotation.z = Math.sin(t * 1.6) * 0.05;
  estrela.material.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.3;
  requestAnimationFrame(flutuar);
}
flutuar();

// Texto NANdART sobre friso
const fontLoader = new FontLoader();
fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json', font => {
  const textGeo = new TextGeometry('NANdART', {
    font,
    size: config.textSize,
    height: 0.08,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.01,
    bevelSegments: 5
  });
  textGeo.computeBoundingBox();
  const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

  const texto = new THREE.Mesh(
    textGeo,
    new THREE.MeshPhongMaterial({
      color: 0xc4b582,
      emissive: 0x222211,
      shininess: 100
    })
  );
  texto.position.set(-largura / 2, 13.65, -config.wallDistance + 0.015); // Alinhado com friso superior
  texto.castShadow = true;
  scene.add(texto);

  const luzTexto = new THREE.SpotLight(0xfff2cc, 1.5, 10, Math.PI / 8, 0.5);
  luzTexto.position.set(0, 12, -config.wallDistance + 2);
  luzTexto.target = texto;
  scene.add(luzTexto);
  scene.add(luzTexto.target);
});

// Paredes com textura e realce
const paredeMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.9,
  metalness: 0.1
});
const paredeGeo = new THREE.PlaneGeometry(20, 20);

const backWall = new THREE.Mesh(paredeGeo, paredeMaterial);
backWall.position.set(0, 10, -config.wallDistance);
scene.add(backWall);

const leftWall = new THREE.Mesh(paredeGeo, paredeMaterial);
leftWall.position.set(-10, 10, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

const rightWall = new THREE.Mesh(paredeGeo, paredeMaterial);
rightWall.position.set(10, 10, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

// Frisos dourados subtis nas paredes
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0xc4b582,
  roughness: 0.3,
  metalness: 1,
  emissive: 0x333311,
  emissiveIntensity: 0.25
});

function adicionarFriso(x, y, z, largura, altura, rotY = 0, depth = 0.02) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, depth),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = true;
  scene.add(friso);
}

// Friso superior horizontal (onde o texto está alinhado)
adicionarFriso(0, 13.5, -config.wallDistance + 0.01, 12, 0.15);

// Friso inferior horizontal
adicionarFriso(0, 2.5, -config.wallDistance + 0.01, 12, 0.15);

// Frisos verticais nas extremidades da parede do fundo
adicionarFriso(-6, 8, -config.wallDistance + 0.01, 0.1, 10);
adicionarFriso(6, 8, -config.wallDistance + 0.01, 0.1, 10);

// Círculo de luz no chão
const halo = new THREE.Mesh(
  new THREE.RingGeometry(3.6, 3.8, 64),
  new THREE.MeshBasicMaterial({
    color: 0xc4b582,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  })
);
halo.rotation.x = -Math.PI / 2;
halo.position.y = 0.011;
scene.add(halo);

// Atualização de dimensão ao redimensionar a janela
window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animação contínua com rotação de obras
function animate() {
  requestAnimationFrame(animate);

  const tempo = Date.now() * -0.00012;
  obrasNormais.forEach((grupo, i) => {
    const ang = tempo + (i / obrasNormais.length) * Math.PI * 2;
    grupo.position.x = Math.cos(ang) * config.circleRadius;
    grupo.position.z = Math.sin(ang) * config.circleRadius;
    grupo.rotation.y = -ang + Math.PI;
  });

  renderer.render(scene, camera);
}

animate();
