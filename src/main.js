// main.js completo com responsividade, vitrines, obras suspensas, obra premium, texto NANdART, frisos e iluminação cenográfica

import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { gsap } from 'gsap';

function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 0.35, premiumSize: 0.45, circleRadius: 2.4, wallDistance: 8, cameraZ: 17, textSize: 0.4 },
  SM: { obraSize: 0.4, premiumSize: 0.5, circleRadius: 2.6, wallDistance: 9, cameraZ: 16, textSize: 0.45 },
  MD: { obraSize: 0.45, premiumSize: 0.6, circleRadius: 3.1, wallDistance: 10, cameraZ: 15, textSize: 0.5 },
  LG: { obraSize: 0.5, premiumSize: 0.65, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 14, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
updateCamera();

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, 4.5, config.cameraZ);
  camera.lookAt(0, 4.5, 0);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

// Iluminação cenográfica
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const downlights = [
  [-6, 15, -config.wallDistance + 1], [0, 15, -config.wallDistance + 1], [6, 15, -config.wallDistance + 1],
  [-10, 15, config.wallDistance / 3], [10, 15, config.wallDistance / 3],
  [-8, 15, -2], [8, 15, -2]
];
downlights.forEach(pos => {
  const spot = new THREE.SpotLight(0xffffff, 1.5, 30, Math.PI / 7, 0.2);
  spot.position.set(...pos);
  spot.castShadow = true;
  scene.add(spot);
});

// Piso
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.05, metalness: 1 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Círculo central
const circle = new THREE.Mesh(
  new THREE.RingGeometry(1.8, 2, 64),
  new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.01;
scene.add(circle);

// Frisos dourados
const frisoMaterial = new THREE.MeshStandardMaterial({ color: 0xc4b582, roughness: 0.3, metalness: 1, emissive: 0x111111 });
function adicionarFriso(x, y, z, largura, altura, rotY = 0) {
  const friso = new THREE.Mesh(new THREE.BoxGeometry(largura, altura, 0.05), frisoMaterial);
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  scene.add(friso);
}

adicionarFriso(0, 13.5, -config.wallDistance + 0.01, 12, 0.1);
adicionarFriso(0, 2.5, -config.wallDistance + 0.01, 12, 0.1);
adicionarFriso(-6, 8, -config.wallDistance + 0.01, 0.1, 11);
adicionarFriso(6, 8, -config.wallDistance + 0.01, 0.1, 11);
adicionarFriso(-12, 13.5, config.wallDistance / 3 - 0.01, 9, 0.1, Math.PI / 3);
adicionarFriso(-12, 2.5, config.wallDistance / 3 - 0.01, 9, 0.1, Math.PI / 3);
adicionarFriso(12, 13.5, config.wallDistance / 3 - 0.01, 9, 0.1, -Math.PI / 3);
adicionarFriso(12, 2.5, config.wallDistance / 3 - 0.01, 9, 0.1, -Math.PI / 3);

// Textura
const loader = new THREE.TextureLoader();
const texturaGema = loader.load('/assets/gemas/gema-azul.jpg.png');
const premiumTexture = loader.load('/assets/premium/premium1.jpg');
const starTexture = loader.load('/assets/premium/estrela-premium.png');

// Vitrines
function criarVitrine(x, z) {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })
  );
  base.position.set(x, 0.5, z);
  scene.add(base);

  const vidro = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1, 0.8),
    new THREE.MeshPhysicalMaterial({
      color: 0xddddff, transmission: 1, ior: 1.5, transparent: true,
      roughness: 0, thickness: 0.2, metalness: 0.1, reflectivity: 1
    })
  );
  vidro.position.set(x, 1.5, z);
  scene.add(vidro);

  const gema = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 32),
    new THREE.MeshStandardMaterial({ map: texturaGema, roughness: 0.3, metalness: 0.6, emissive: 0x222244 })
  );
  gema.position.set(x, 1.5, z);
  scene.add(gema);

  const luz = new THREE.PointLight(0x88ccff, 1.2, 3);
  luz.position.set(x, 1.5, z);
  scene.add(luz);

  gsap.to(luz, { intensity: 2, duration: 2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

criarVitrine(-8, -2);
criarVitrine(-8, 2);
criarVitrine(8, -2);
criarVitrine(8, 2);

// Obras normais suspensas
const obraPaths = ["/assets/obras/obra1.jpg","/assets/obras/obra2.jpg","/assets/obras/obra3.jpg","/assets/obras/obra4.jpg"];
const obrasNormais = [];
obraPaths.forEach((src, i) => {
  const ang = (i / obraPaths.length) * Math.PI * 2;
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(config.obraSize + 0.08, config.obraSize + 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.3 })
  );
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshStandardMaterial({ map: loader.load(src), roughness: 0.4, metalness: 0.1 })
  );
  obra.position.z = 0.05;
  const grupo = new THREE.Group();
  grupo.add(moldura);
  grupo.add(obra);
  grupo.position.set(Math.cos(ang) * config.circleRadius, 4.2, Math.sin(ang) * config.circleRadius);
  grupo.rotation.y = -ang + Math.PI;
  scene.add(grupo);
  obrasNormais.push(grupo);
});

// Obra premium central
const moldura = new THREE.Mesh(
  new THREE.BoxGeometry(config.premiumSize + 0.12, config.premiumSize + 0.12, 0.12),
  new THREE.MeshStandardMaterial({ color: 0xc4b582, roughness: 0.3, metalness: 0.8, emissive: 0x222222 })
);
const quadro = new THREE.Mesh(
  new THREE.PlaneGeometry(config.premiumSize, config.premiumSize),
  new THREE.MeshStandardMaterial({ map: premiumTexture, roughness: 0.2, metalness: 0.3 })
);
quadro.position.z = 0.08;
const estrela = new THREE.Mesh(
  new THREE.PlaneGeometry(0.15, 0.15),
  new THREE.MeshStandardMaterial({ map: starTexture, transparent: true })
);
estrela.position.set(0.25, 0.25, 0.12);
const grupoPremium = new THREE.Group();
grupoPremium.add(moldura);
grupoPremium.add(quadro);
grupoPremium.add(estrela);
grupoPremium.position.set(0, 5.8, 0);
let t = 0;
function flutuar() {
  t += 0.016;
  grupoPremium.position.y = 5.8 + Math.sin(t * 2.2) * 0.22;
  grupoPremium.rotation.z = Math.sin(t * 1.6) * 0.05;
  requestAnimationFrame(flutuar);
}
flutuar();
scene.add(grupoPremium);

// Texto NANdART
const fontLoader = new FontLoader();
fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json', font => {
  const textGeo = new TextGeometry('NANdART', { font, size: config.textSize, height: 0.05, curveSegments: 12 });
  textGeo.computeBoundingBox();
  const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;
  const textMat = new THREE.MeshPhongMaterial({ color: 0xc4b582, emissive: 0x000000, specular: 0x222222, shininess: 50 });
  const texto = new THREE.Mesh(textGeo, textMat);
  texto.position.set(-largura / 2 - 0.1, 9.5, -config.wallDistance + 0.01);
  if (isFirefox) texto.position.z -= 0.02;
  if (isSafari) texto.scale.set(1.05, 1.05, 1);
  scene.add(texto);
});

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  obrasNormais.forEach((grupo, i) => {
    const ang = Date.now() * -0.00012 + (i / obrasNormais.length) * Math.PI * 2;
    grupo.position.x = Math.cos(ang) * config.circleRadius;
    grupo.position.z = Math.sin(ang) * config.circleRadius;
    grupo.rotation.y = -ang + Math.PI;
  });
  renderer.render(scene, camera);
}

animate();
