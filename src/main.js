import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
//import { gsap } from 'gsap';
// In your main.js, add this at the beginning:
import gsap from 'gsap';
//import { CSSPlugin } from 'gsap/CSSPlugin';

// Force CSSPlugin to not get tree-shaken away
//gsap.registerPlugin(CSSPlugin);

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

// Iluminação cenográfica aprimorada
scene.add(new THREE.AmbientLight(0xfff2cc, 1.2));

// Luzes principais direcionadas
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

mainSpots.forEach(light => {
  const spot = new THREE.SpotLight(0xfff7e6, light.intensity, 20, Math.PI/6, 0.3);
  spot.position.set(...light.pos);
  spot.target.position.set(...light.target);
  spot.castShadow = true;
  spot.shadow.mapSize.width = 2048;
  spot.shadow.mapSize.height = 2048;
  scene.add(spot);
  scene.add(spot.target);
});

// Luzes de preenchimento
const fillLights = [
  [0, 5, 10], [5, 5, 8], [-5, 5, 8], [0, 5, -5]
];
fillLights.forEach(pos => {
  const light = new THREE.PointLight(0xfff2cc, 0.8, 15);
  light.position.set(...pos);
  scene.add(light);
});

// Piso com reflexos aprimorados
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ 
    color: 0x050505, 
    roughness: 0.05, 
    metalness: 1,
    envMap: null
  })
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

// Textura para molduras
const textureLoader = new THREE.TextureLoader();
const goldTexture = textureLoader.load('https://threejs.org/assets/icons/textures/gold_diffuse.jpg');
const goldRoughness = textureLoader.load('https://threejs.org/assets/icons/textures/gold_roughness.jpg');
const goldNormal = textureLoader.load('https://threejs.org/assets/icons/textures/gold_normal.jpg');

const molduraMaterial = new THREE.MeshStandardMaterial({
  map: goldTexture,
  roughnessMap: goldRoughness,
  normalMap: goldNormal,
  roughness: 0.3,
  metalness: 0.9,
  emissive: 0x222222,
  emissiveIntensity: 0.2
});

// Frisos dourados aprimorados
const frisoMaterial = new THREE.MeshStandardMaterial({
  map: goldTexture,
  roughnessMap: goldRoughness,
  normalMap: goldNormal,
  roughness: 0.2,
  metalness: 0.95,
  emissive: 0x333311,
  emissiveIntensity: 0.3
});

function adicionarFriso(x, y, z, largura, altura, rotY = 0, depth = 0.05) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, depth), 
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = true;
  scene.add(friso);
  
  // Adicionar luz indireta para frisos
  if (y > 5) {
    const light = new THREE.PointLight(0xc4b582, 0.5, 2);
    light.position.set(x, y - 0.3, z);
    scene.add(light);
  }
}

// Frisos principais
adicionarFriso(0, 13.5, -config.wallDistance + 0.02, 12, 0.15);
adicionarFriso(0, 2.5, -config.wallDistance + 0.02, 12, 0.15);
adicionarFriso(-6, 8, -config.wallDistance + 0.02, 0.15, 11);
adicionarFriso(6, 8, -config.wallDistance + 0.02, 0.15, 11);

// Frisos laterais diagonais
adicionarFriso(-12, 13.5, config.wallDistance / 3 - 0.02, 9, 0.15, Math.PI / 3);
adicionarFriso(-12, 2.5, config.wallDistance / 3 - 0.02, 9, 0.15, Math.PI / 3);
adicionarFriso(12, 13.5, config.wallDistance / 3 - 0.02, 9, 0.15, -Math.PI / 3);
adicionarFriso(12, 2.5, config.wallDistance / 3 - 0.02, 9, 0.15, -Math.PI / 3);

// Painéis dourados nas paredes
adicionarFriso(0, 8, -config.wallDistance + 0.01, 10, 10, 0, 0.02); // Painel central
adicionarFriso(-10, 8, 0, 0.1, 12, 0); // Painel lateral esquerdo
adicionarFriso(10, 8, 0, 0.1, 12, 0); // Painel lateral direito

// Texturas
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');
const premiumTexture = textureLoader.load('/assets/premium/premium1.jpg');
const starTexture = textureLoader.load('/assets/premium/estrela-premium.png');

// Vitrines aprimoradas
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
      thickness: 0.3, 
      metalness: 0.1, 
      reflectivity: 0.5,
      envMapIntensity: 0.5
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

  // Reflexo no chão
  const reflexo = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.9
    })
  );
  reflexo.rotation.x = -Math.PI / 2;
  reflexo.position.set(x, 0.01, z);
  scene.add(reflexo);

  // Animação de brilho pulsante
  gsap.to(luz, { 
    intensity: 5, 
    duration: 3, 
    repeat: -1, 
    yoyo: true, 
    ease: 'sine.inOut' 
  });
  gsap.to(gema.material.emissiveIntensity, {
    value: 1.2,
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

// Obras normais suspensas com molduras aprimoradas
const obraPaths = ["/assets/obras/obra1.jpg","/assets/obras/obra2.jpg","/assets/obras/obra3.jpg","/assets/obras/obra4.jpg","/assets/obras/obra5.jpg","/assets/obras/obra6.jpg","/assets/obras/obra7.jpg","/assets/obras/obra8.jpg"];
const obrasNormais = [];
obraPaths.forEach((src, i) => {
  const ang = (i / obraPaths.length) * Math.PI * 2;
  
  // Moldura com detalhe ornamental
  const moldura = new THREE.Group();
  
  // Parte principal da moldura
  const molduraBase = new THREE.Mesh(
    new THREE.BoxGeometry(config.obraSize + 0.12, config.obraSize + 0.12, 0.08),
    molduraMaterial.clone()
  );
  
  // Detalhe ornamental
  const detalheOrnamental = new THREE.Mesh(
    new THREE.TorusGeometry(config.obraSize/2 + 0.06, 0.02, 16, 32),
    molduraMaterial.clone()
  );
  detalheOrnamental.rotation.x = Math.PI/2;
  detalheOrnamental.position.z = 0.04;
  
  moldura.add(molduraBase);
  moldura.add(detalheOrnamental);
  
  // Obra de arte
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

// Obra premium central aprimorada
const molduraPremium = new THREE.Group();

// Base da moldura premium
const molduraBasePremium = new THREE.Mesh(
  new THREE.BoxGeometry(config.premiumSize + 0.2, config.premiumSize + 0.2, 0.15),
  molduraMaterial.clone()
);

// Detalhes ornamentais premium
for (let i = 0; i < 4; i++) {
  const detalhe = new THREE.Mesh(
    new THREE.BoxGeometry(config.premiumSize/4, 0.1, 0.1),
    molduraMaterial.clone()
  );
  detalhe.position.set(
    (i % 2 === 0 ? 1 : -1) * (config.premiumSize/2 + 0.05),
    (i < 2 ? 1 : -1) * (config.premiumSize/2 + 0.05),
    0.08
  );
  molduraPremium.add(detalhe);
}

molduraPremium.add(molduraBasePremium);

const quadroPremium = new THREE.Mesh(
  new THREE.PlaneGeometry(config.premiumSize, config.premiumSize),
  new THREE.MeshStandardMaterial({ 
    map: premiumTexture, 
    roughness: 0.1, 
    metalness: 0.2,
    emissive: 0x111111,
    emissiveIntensity: 0.1
  })
);
quadroPremium.position.z = 0.08;

const estrelaPremium = new THREE.Mesh(
  new THREE.PlaneGeometry(0.2, 0.2),
  new THREE.MeshStandardMaterial({ 
    map: starTexture, 
    transparent: true,
    emissive: 0xffffaa,
    emissiveIntensity: 0.5
  })
);
estrelaPremium.position.set(0.3, 0.3, 0.13);

const grupoPremium = new THREE.Group();
grupoPremium.add(molduraPremium);
grupoPremium.add(quadroPremium);
grupoPremium.add(estrelaPremium);
grupoPremium.position.set(0, 5.8, 0);
grupoPremium.castShadow = true;

// Animação de flutuação premium
let t = 0;
function flutuar() {
  t += 0.016;
  grupoPremium.position.y = 5.8 + Math.sin(t * 2.2) * 0.22;
  grupoPremium.rotation.z = Math.sin(t * 1.6) * 0.05;
  
  // Piscar da estrela
  estrelaPremium.material.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.3;
  
  requestAnimationFrame(flutuar);
}
flutuar();
scene.add(grupoPremium);

// Texto NANdART aprimorado
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
  
  const textMat = new THREE.MeshPhongMaterial({ 
    color: 0xc4b582, 
    emissive: 0x222211,
    specular: 0x888888, 
    shininess: 100,
    flatShading: false
  });
  
  const texto = new THREE.Mesh(textGeo, textMat);
  texto.position.set(-largura / 2, 9.5, -config.wallDistance + 0.01);
  texto.castShadow = true;
  scene.add(texto);
  
  // Luz direcional para o texto
  const textLight = new THREE.SpotLight(0xfff2cc, 1.5, 10, Math.PI/8, 0.5);
  textLight.position.set(0, 12, -config.wallDistance + 2);
  textLight.target = texto;
  scene.add(textLight);
  scene.add(textLight.target);
});

// Paredes laterais
const wallGeometry = new THREE.PlaneGeometry(20, 20);
const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x222222,
  roughness: 0.8,
  metalness: 0.1
});

const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.position.set(-10, 10, -config.wallDistance/2);
leftWall.rotation.y = Math.PI/2;
scene.add(leftWall);

const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
rightWall.position.set(10, 10, -config.wallDistance/2);
rightWall.rotation.y = -Math.PI/2;
scene.add(rightWall);

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

