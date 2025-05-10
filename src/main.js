// main.js atualizado com melhorias aplicadas
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

const textureLoader = new THREE.TextureLoader();
const gemaTexture = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

// Piso
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.6 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Luz ambiente
const ambient = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambient);

// Obras circulares
const obras = [];
const obraPaths = [
  '/assets/obras/obra1.jpg',
  '/assets/obras/obra2.jpg',
  '/assets/obras/obra3.jpg',
  '/assets/obras/obra4.jpg',
  '/assets/obras/obra5.jpg',
  '/assets/obras/obra6.jpg',
  '/assets/obras/obra7.jpg',
  '/assets/obras/obra8.jpg'
];
obraPaths.forEach((src, i) => {
  const ang = (i / obraPaths.length) * Math.PI * 2;
  const obraTex = textureLoader.load(src);
  const geometry = new THREE.PlaneGeometry(config.obraSize, config.obraSize);
  const material = new THREE.MeshStandardMaterial({ map: obraTex, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(Math.cos(ang) * config.circleRadius, 4.2, Math.sin(ang) * config.circleRadius);
  mesh.rotation.y = -ang + Math.PI;
  obras.push({ mesh, angOffset: ang });
  scene.add(mesh);
});

// Vitrines com gema real
function criarVitrine(x, z) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  base.position.set(x, 0.5, z);
  scene.add(base);

  const vidro = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1, 0.8),
    new THREE.MeshPhysicalMaterial({
      color: 0xeeeeff,
      transmission: 1,
      roughness: 0,
      metalness: 0.1,
      ior: 1.52,
      transparent: true
    })
  );
  vidro.position.set(x, 1.5, z);
  scene.add(vidro);

  const gema = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.5),
    new THREE.MeshBasicMaterial({ map: gemaTexture, transparent: true, side: THREE.DoubleSide })
  );
  gema.position.set(x, 1.5, z);
  gema.rotation.y = Math.PI / 4;
  scene.add(gema);
}
criarVitrine(-8, -2);
criarVitrine(-8, 2);
criarVitrine(8, -2);
criarVitrine(8, 2);

// Nome NANdART
const fontLoader = new FontLoader();
fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json', font => {
  const textGeo = new TextGeometry('NANdART', {
    font,
    size: config.textSize,
    height: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.01,
    bevelSegments: 5
  });
  const mat = new THREE.MeshStandardMaterial({ color: 0xc4b582, metalness: 0.6 });
  const textMesh = new THREE.Mesh(textGeo, mat);
  textGeo.computeBoundingBox();
  const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;
  textMesh.position.set(-largura / 2, 9.5, -config.wallDistance + 0.1);
  scene.add(textMesh);
});

function animate() {
  requestAnimationFrame(animate);
  obras.forEach((obj, i) => {
    const ang = Date.now() * -0.0001 + obj.angOffset;
    obj.mesh.position.x = Math.cos(ang) * config.circleRadius;
    obj.mesh.position.z = Math.sin(ang) * config.circleRadius;
    obj.mesh.rotation.y = -ang + Math.PI;
  });
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
