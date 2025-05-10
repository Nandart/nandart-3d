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

scene.add(new THREE.AmbientLight(0xfff2cc, 1.2));

const textureLoader = new THREE.TextureLoader();
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

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
  const textura = textureLoader.load(src);
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide })
  );
  obra.position.set(Math.cos(ang) * config.circleRadius, 4.2, Math.sin(ang) * config.circleRadius);
  obra.rotation.y = -ang + Math.PI;
  scene.add(obra);
  obrasNormais.push(obra);
});

const piso = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.05, metalness: 1 })
);
piso.rotation.x = -Math.PI / 2;
piso.receiveShadow = true;
scene.add(piso);

const vitrine = new THREE.Group();
const vidro = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 1, 0.8),
  new THREE.MeshPhysicalMaterial({
    color: 0xeeeeff,
    transmission: 0.95,
    ior: 1.52,
    transparent: true,
    roughness: 0.05,
    thickness: 0.3,
    metalness: 0.1,
    reflectivity: 0.5
  })
);
vidro.position.y = 1.5;
vitrine.add(vidro);

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
gema.position.y = 1.5;
vitrine.add(gema);

vitrine.position.set(0, 0, 0);
scene.add(vitrine);

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  const tempo = Date.now() * 0.00012;
  obrasNormais.forEach((obra, i) => {
    const ang = tempo + (i / obrasNormais.length) * Math.PI * 2;
    obra.position.x = Math.cos(ang) * config.circleRadius;
    obra.position.z = Math.sin(ang) * config.circleRadius;
    obra.rotation.y = -ang + Math.PI;
  });
  renderer.render(scene, camera);
}

animate();

