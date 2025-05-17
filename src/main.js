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
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 34;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY + 5.8, config.cameraZ + 13);
  camera.lookAt(0, 7, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}
updateCamera();

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

// 🎨 Textura antracite nas paredes
const textureLoader = new THREE.TextureLoader();
const texturaParede = textureLoader.load('/assets/parede-antracite.jpg');

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
