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

const mainSpots = [
  { pos: [-6, 12, -config.wallDistance + 1], target: [-6, 4, -config.wallDistance + 1], intensity: 2.5 },
  { pos: [0, 12, -config.wallDistance + 1], target: [0, 5.8, -config.wallDistance + 1], intensity: 3 },
  { pos: [6, 12, -config.wallDistance + 1], target: [6, 4, -config.wallDistance + 1], intensity: 2.5 },
  { pos: [-10, 12, config.wallDistance / 3], target: [-8, 4, 2], intensity: 2 },
  { pos: [10, 12, config.wallDistance / 3], target: [8, 4, 2], intensity: 2 },
  { pos: [-8, 12, -2], target: [-8, 1.5, -2], intensity: 2.2 },
  { pos: [8, 12, -2], target: [8, 1.5, -2], intensity: 2.2 },
  { pos: [0, 12, 0], target: [0, 5.8, 0], intensity: 2 }
];

mainSpots.forEach(({ pos, target, intensity }) => {
  const spot = new THREE.SpotLight(0xfff7e6, intensity, 20, Math.PI / 6, 0.3);
  spot.position.set(...pos);
  spot.target.position.set(...target);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  scene.add(spot);
  scene.add(spot.target);
});

const fillLights = [[0, 5, 10], [5, 5, 8], [-5, 5, 8], [0, 5, -5]];
fillLights.forEach(pos => {
  const light = new THREE.PointLight(0xfff2cc, 0.8, 15);
  light.position.set(...pos);
  scene.add(light);
});

// Texto NANdART
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
    new THREE.MeshPhongMaterial({ color: 0xc4b582, emissive: 0x222211, shininess: 100 })
  );
  texto.position.set(-largura / 2, 9.5, -config.wallDistance + 0.01);
  texto.castShadow = true;
  scene.add(texto);

  const luzTexto = new THREE.SpotLight(0xfff2cc, 1.5, 10, Math.PI / 8, 0.5);
  luzTexto.position.set(0, 12, -config.wallDistance + 2);
  luzTexto.target = texto;
  scene.add(luzTexto);
  scene.add(luzTexto.target);
});

// Paredes laterais e de fundo
const paredeMaterial = new THREE.MeshStandardMaterial({
  color: 0x222222,
  roughness: 0.8,
  metalness: 0.1
});
const paredeGeo = new THREE.PlaneGeometry(20, 20);

// Parede esquerda
const leftWall = new THREE.Mesh(paredeGeo, paredeMaterial);
leftWall.position.set(-10, 10, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

// Parede direita
const rightWall = new THREE.Mesh(paredeGeo, paredeMaterial);
rightWall.position.set(10, 10, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

// Parede de fundo
const backWall = new THREE.Mesh(paredeGeo, paredeMaterial);
backWall.position.set(0, 10, -config.wallDistance);
scene.add(backWall);

// Responsividade: atualizar ao redimensionar
window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Função de animação principal
function animate() {
  requestAnimationFrame(animate);

  // Rotação contínua das obras normais
  obrasNormais.forEach((grupo, i) => {
    const ang = Date.now() * -0.00012 + (i / obrasNormais.length) * Math.PI * 2;
    grupo.position.x = Math.cos(ang) * config.circleRadius;
    grupo.position.z = Math.sin(ang) * config.circleRadius;
    grupo.rotation.y = -ang + Math.PI;
  });

  renderer.render(scene, camera);
}
animate();
