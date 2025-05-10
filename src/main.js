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
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

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

// Optimized lighting
scene.add(new THREE.AmbientLight(0xfff2cc, 1.2));

const mainSpots = [
  { pos: [-6, 12, -config.wallDistance + 1], target: [-6, 4, -config.wallDistance + 1], intensity: 2.5 },
  { pos: [0, 12, -config.wallDistance + 1], target: [0, 5.8, -config.wallDistance + 1], intensity: 3 },
  { pos: [6, 12, -config.wallDistance + 1], target: [6, 4, -config.wallDistance + 1], intensity: 2.5 },
  { pos: [-10, 12, config.wallDistance / 3], target: [-8, 4, 2], intensity: 2 },
  { pos: [10, 12, config.wallDistance / 3], target: [8, 4, 2], intensity: 2 }
];

mainSpots.forEach(light => {
  const spot = new THREE.SpotLight(0xfff7e6, light.intensity, 20, Math.PI/6, 0.3);
  spot.position.set(...light.pos);
  spot.target.position.set(...light.target);
  spot.castShadow = true;
  spot.shadow.mapSize.width = 1024; // Reduced for performance
  spot.shadow.mapSize.height = 1024;
  scene.add(spot);
  scene.add(spot.target);
});

// Piso com reflexos aprimorados
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

// Material de ouro procedural
const goldMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1c40f,
  roughness: 0.25,
  metalness: 0.9,
  emissive: 0x222200,
  emissiveIntensity: 0.2
});

// Material para molduras
const molduraMaterial = goldMaterial.clone();
molduraMaterial.roughness = 0.3;
molduraMaterial.metalness = 0.9;

// Material para frisos
const frisoMaterial = goldMaterial.clone();
frisoMaterial.roughness = 0.2;
frisoMaterial.metalness = 0.95;
frisoMaterial.emissive = 0x333311;

function adicionarFriso(x, y, z, largura, altura, rotY = 0, depth = 0.05) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, depth), 
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = true;
  scene.add(friso);
}

// Frisos principais (simplificados)
adicionarFriso(0, 13.5, -config.wallDistance + 0.02, 12, 0.15);
adicionarFriso(0, 2.5, -config.wallDistance + 0.02, 12, 0.15);

// Texture loader with error handling
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = "anonymous";

// Function to load textures with fallback
async function loadTextureWithFallback(path, fallbackColor = 0x888888) {
  try {
    return await new Promise((resolve, reject) => {
      textureLoader.load(
        path,
        resolve,
        undefined,
        reject
      );
    });
  } catch (error) {
    console.error(`Failed to load texture: ${path}`, error);
    return null;
  }
}

// Vitrines aprimoradas
async function criarVitrine(x, z) {
  const texturaGema = await loadTextureWithFallback('/assets/gemas/gema-azul.jpg');
  
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })
  );
  base.position.set(x, 0.5, z);
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
  scene.add(vidro);

  const gema = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 32, 32),
    new THREE.MeshStandardMaterial({ 
      map: texturaGema,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x444488,
      emissiveIntensity: 0.8,
      side: THREE.DoubleSide // Make gem visible from all angles
    })
  );
  gema.position.set(x, 1.5, z);
  scene.add(gema);

  const luz = new THREE.PointLight(0x88ccff, 3, 3);
  luz.position.set(x, 1.5, z);
  scene.add(luz);
}

// Load showcase models
Promise.all([
  criarVitrine(-8, -2),
  criarVitrine(-8, 2),
  criarVitrine(8, -2),
  criarVitrine(8, 2)
]);

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
const obraTextures = await Promise.all(obraPaths.map(path => loadTextureWithFallback(path)));

obraTextures.forEach((texture, i) => {
  if (!texture) return;
  
  const ang = (i / obraTextures.length) * Math.PI * 2;
  
  // Moldura
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(config.obraSize + 0.12, config.obraSize + 0.12, 0.08),
    molduraMaterial.clone()
  );
  
  // Obra de arte (double-sided)
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshStandardMaterial({ 
      map: texture,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide // Make artwork visible from both sides
    })
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
const premiumTexture = await loadTextureWithFallback('/assets/premium/premium1.jpg');
const starTexture = await loadTextureWithFallback('/assets/premium/estrela-premium.png');

if (premiumTexture && starTexture) {
  const molduraPremium = new THREE.Mesh(
    new THREE.BoxGeometry(config.premiumSize + 0.2, config.premiumSize + 0.2, 0.15),
    molduraMaterial.clone()
  );

  const quadroPremium = new THREE.Mesh(
    new THREE.PlaneGeometry(config.premiumSize, config.premiumSize),
    new THREE.MeshStandardMaterial({ 
      map: premiumTexture,
      roughness: 0.1,
      metalness: 0.2,
      side: THREE.DoubleSide // Make premium artwork visible from both sides
    })
  );
  quadroPremium.position.z = 0.08;

  const estrelaPremium = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.2),
    new THREE.MeshStandardMaterial({ 
      map: starTexture,
      transparent: true,
      side: THREE.DoubleSide
    })
  );
  estrelaPremium.position.set(0.3, 0.3, 0.13);

  const grupoPremium = new THREE.Group();
  grupoPremium.add(molduraPremium);
  grupoPremium.add(quadroPremium);
  grupoPremium.add(estrelaPremium);
  grupoPremium.position.set(0, 5.8, 0);
  scene.add(grupoPremium);

  // Animação de flutuação premium
  gsap.to(grupoPremium.position, {
    y: 5.8 + 0.22,
    duration: 2.2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
  
  gsap.to(grupoPremium.rotation, {
    z: 0.05,
    duration: 1.6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });
}

// Texto NANdART
const fontLoader = new FontLoader();
fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json', font => {
  const textGeo = new TextGeometry('NANdART', { 
    font, 
    size: config.textSize, 
    height: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.01
  });
  
  const textMat = new THREE.MeshPhongMaterial({ 
    color: 0xc4b582,
    specular: 0x888888,
    shininess: 100
  });
  
  const texto = new THREE.Mesh(textGeo, textMat);
  texto.position.set(0, 9.5, -config.wallDistance + 0.01);
  texto.castShadow = true;
  scene.add(texto);
});

// Paredes laterais simplificadas
const wallGeometry = new THREE.PlaneGeometry(20, 20);
const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x222222,
  roughness: 0.8
});

const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
backWall.position.set(0, 10, -config.wallDistance);
scene.add(backWall);

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  
  // Rotação suave das obras normais
  obrasNormais.forEach((grupo, i) => {
    const ang = Date.now() * -0.00012 + (i / obrasNormais.length) * Math.PI * 2;
    grupo.position.x = Math.cos(ang) * config.circleRadius;
    grupo.position.z = Math.sin(ang) * config.circleRadius;
    grupo.rotation.y = -ang + Math.PI;
  });
  
  renderer.render(scene, camera);
}

animate();
