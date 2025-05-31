// Versão melhorada da galeria NANdART com:
// - Melhor tratamento de erros
// - Gestão de recursos
// - Otimizações de performance
// - UX aprimorado
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';

// Configuração inicial
const CONTRACT_ADDRESS = '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41';
const ASSETS_BASE_PATH = '/assets';
const RESIZE_DEBOUNCE_TIME = 200;

// Elementos da UI
const walletButton = document.getElementById('wallet-button');
const modal = document.querySelector('.art-modal');
const modalTitle = document.getElementById('art-title');
const modalDescription = document.getElementById('art-description');
const modalArtist = document.getElementById('art-artist');
const modalYear = document.getElementById('art-year');
const modalPrice = document.getElementById('art-price');
const buyButton = document.getElementById('buy-art');
const blurOverlay = document.getElementById('blur-overlay');
const loadingOverlay = document.getElementById('loading-overlay');
const notificationElement = document.getElementById('notification');

// Registrar plugins GSAP
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Mostrar notificação
function showNotification(message, type = 'info') {
  notificationElement.textContent = message;
  notificationElement.className = `notification ${type}`;
  notificationElement.style.display = 'block';
  
  gsap.to(notificationElement, { 
    opacity: 1, 
    y: 0, 
    duration: 0.3 
  });
  
  setTimeout(() => {
    gsap.to(notificationElement, { 
      opacity: 0, 
      y: -20, 
      duration: 0.3,
      onComplete: () => {
        notificationElement.style.display = 'none';
      }
    });
  }, 3000);
}

// Mostrar spinner de carregamento
function showSpinner() {
  loadingOverlay.style.display = 'flex';
  gsap.to(loadingOverlay, { opacity: 1, duration: 0.3 });
}

// Esconder spinner
function hideSpinner() {
  gsap.to(loadingOverlay, { 
    opacity: 0, 
    duration: 0.3,
    onComplete: () => {
      loadingOverlay.style.display = 'none';
    }
  });
}

// Configurações responsivas
function getViewportLevel() {
  const width = window.innerWidth;
  if (width < 480) return 'XS';
  if (width < 768) return 'SM';
  if (width < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 12, cameraY: 5.4, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 13, cameraY: 5.7, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 14, cameraY: 6.1, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 15, cameraY: 6.4, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

// Cena Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const textureLoader = new THREE.TextureLoader();
const loadQueue = [];
let assetsLoaded = 0;
const totalAssets = 15; // Atualizar conforme necessário

// Atualizar progresso de carregamento
function updateLoadProgress() {
  assetsLoaded++;
  const progress = Math.round((assetsLoaded / totalAssets) * 100);
  document.getElementById('load-progress').textContent = `${progress}%`;
  
  if (assetsLoaded === totalAssets) {
    hideSpinner();
  }
}

// Carregar textura com tratamento de erro melhorado
function loadTextureWithFallback(path, fallbackData, onLoad) {
  const loadingPromise = new Promise((resolve) => {
    textureLoader.load(
      path,
      (texture) => {
        updateLoadProgress();
        resolve(texture);
        if (onLoad) onLoad(texture);
      },
      undefined,
      (err) => {
        console.error(`Error loading texture ${path}:`, err);
        const fallbackTexture = new THREE.DataTexture(
          fallbackData.data,
          fallbackData.width,
          fallbackData.height,
          THREE.RGBAFormat
        );
        fallbackTexture.needsUpdate = true;
        updateLoadProgress();
        resolve(fallbackTexture);
        if (onLoad) onLoad(fallbackTexture);
      }
    );
  });
  
  loadQueue.push(loadingPromise);
  return loadingPromise;
}

// Configuração da câmera
const camera = new THREE.PerspectiveCamera();
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 45;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, 9, 22);
  camera.lookAt(0, 7, -config.wallDistance);
  camera.near = 0.1;
  camera.far = 100;
  camera.updateProjectionMatrix();
}
updateCamera();

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.25;

// Debounce para resize
let resizeTimeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, RESIZE_DEBOUNCE_TIME);
}
window.addEventListener('resize', handleResize);

// Enhanced lighting setup
const ambientLight1 = new THREE.AmbientLight(0xfff2dd, 1.2);
const ambientLight2 = new THREE.AmbientLight(0xfff2dd, 1.2);
scene.add(ambientLight1, ambientLight2);

const hemisphereLight = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.8);
scene.add(hemisphereLight);

const spotLightLeft = new THREE.SpotLight(0xfff2dd, 1.5);
spotLightLeft.position.set(-10, 8, 0);
spotLightLeft.angle = Math.PI / 6;
spotLightLeft.penumbra = 0.3;
spotLightLeft.decay = 2;
spotLightLeft.distance = 25;
spotLightLeft.castShadow = true;
spotLightLeft.shadow.mapSize.width = 1024;
spotLightLeft.shadow.mapSize.height = 1024;
spotLightLeft.shadow.bias = -0.0005;
scene.add(spotLightLeft);

// Additional wall lights for better visibility
const wallFillLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
wallFillLight1.position.set(0, 15, -config.wallDistance - 5);
scene.add(wallFillLight1);

const wallFillLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
wallFillLight2.position.set(0, 15, -config.wallDistance + 5);
scene.add(wallFillLight2);

// Chão reflexivo
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x000000,
  recursion: 0
});

floor.material.opacity = 0.6;
floor.material.roughness = 0.0025;
floor.material.metalness = 0.99;
floor.material.transparent = true;
floor.material.envMapIntensity = 12.0;
floor.material.reflectivity = 0.99;
floor.material.ior = 1.45;
floor.material.thickness = 0.5;
floor.material.side = THREE.DoubleSide;

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Luzes das paredes - enhanced intensity
const wallLight1 = new THREE.SpotLight(0xffffff, 0.4, 30, Math.PI / 6, 0.5);
wallLight1.position.set(0, 15, -config.wallDistance - 3);
scene.add(wallLight1);

const wallLight2 = new THREE.SpotLight(0xffffff, 0.4, 30, Math.PI / 6, 0.5);
wallLight2.position.set(-14, 15, -config.wallDistance / 2);
scene.add(wallLight2);

const wallLight3 = new THREE.SpotLight(0xffffff, 0.4, 30, Math.PI / 6, 0.5);
wallLight3.position.set(14, 15, -config.wallDistance / 2);
scene.add(wallLight3);

// Círculo central
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

// Molduras - updated to not cast reflections
const trimMaterial = new THREE.MeshStandardMaterial({
  color: 0xf3cc80,
  metalness: 1,
  roughness: 0.08,
  emissive: 0xf3cc80,
  emissiveIntensity: 0.45
});

function createTrimLine(x, y, z, width, height = 0.06, rotY = 0) {
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.02),
    trimMaterial
  );
  trim.position.set(x, y, z);
  trim.rotation.y = rotY;
  trim.castShadow = false;
  trim.receiveShadow = false;
  // Explicitly disable reflection
  trim.userData = { disableReflection: true };
  scene.add(trim);
  return trim;
}

function createTrimRect(x, y, z, width, height, rotY = 0) {
  const group = new THREE.Group();
  const thickness = 0.06;

  const top = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, 0.02), trimMaterial);
  top.position.set(0, height / 2, 0);
  top.receiveShadow = false;
  top.userData = { disableReflection: true };
  group.add(top);

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, 0.02), trimMaterial);
  bottom.position.set(0, -height / 2, 0);
  bottom.receiveShadow = false;
  bottom.userData = { disableReflection: true };
  group.add(bottom);

  const left = new THREE.Mesh(new THREE.BoxGeometry(thickness, height - thickness * 2, 0.02), trimMaterial);
  left.position.set(-width / 2 + thickness / 2, 0, 0);
  left.receiveShadow = false;
  left.userData = { disableReflection: true };
  group.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(thickness, height - thickness * 2, 0.02), trimMaterial);
  right.position.set(width / 2 - thickness / 2, 0, 0);
  right.receiveShadow = false;
  right.userData = { disableReflection: true };
  group.add(right);

  group.position.set(x, y, z);
  group.rotation.y = rotY;
  group.userData = { disableReflection: true };
  scene.add(group);
  return group;
}

const centerTrim = createTrimRect(
  0,
  10.3,
  -config.wallDistance + 0.01,
  6.8,
  7.0
);

createTrimLine(
  0,
  13.1,
  -config.wallDistance + 0.012,
  4.5
);

const sideTrimPosX = 6.7;
const outerTrimHeight = 8.8;
const innerTrimHeight = 7.1;

createTrimRect(-sideTrimPosX, 10.3, -config.wallDistance + 0.01, 3.2, outerTrimHeight);
createTrimRect(-sideTrimPosX, 10.3, -config.wallDistance + 0.012, 1.6, innerTrimHeight);
createTrimRect(sideTrimPosX, 10.3, -config.wallDistance + 0.01, 3.2, outerTrimHeight);
createTrimRect(sideTrimPosX, 10.3, -config.wallDistance + 0.012, 1.6, innerTrimHeight);

const backWallTopTrim = createTrimLine(0, 2.0, -config.wallDistance + 0.01, 36);
const backWallBottomTrim = createTrimLine(0, 1.7, -config.wallDistance + 0.012, 36);
const leftWallTopTrim = createTrimLine(-16.2, 2.0, -config.wallDistance / 2, 2.2, 0.06, Math.PI / 2);
const leftWallBottomTrim = createTrimLine(-16.2, 1.7, -config.wallDistance / 2, 2.2, 0.06, Math.PI / 2);
const rightWallTopTrim = createTrimLine(16.2, 2.0, -config.wallDistance / 2, 2.2, 0.06, -Math.PI / 2);
const rightWallBottomTrim = createTrimLine(16.2, 1.7, -config.wallDistance / 2, 2.2, 0.06, -Math.PI / 2);

// Textura de fallback para paredes
const wallTextureData = {
  data: new Uint8Array([
    30, 30, 30, 255, 35, 35, 35, 255, 25, 25, 25, 255, 40, 40, 40, 255,
    35, 35, 35, 255, 30, 30, 30, 255, 25, 25, 25, 255, 20, 20, 20, 255,
    40, 40, 40, 255, 35, 35, 35, 255, 30, 30, 30, 255, 25, 25, 25, 255,
    20, 20, 20, 255, 15, 15, 15, 255, 10, 10, 10, 255, 5, 5, 5, 255
  ]),
  width: 4,
  height: 4
};

// Carregar texturas principais
const centerTexturePromise = loadTextureWithFallback(
  `${ASSETS_BASE_PATH}/obras/obra-central.jpg`,
  wallTextureData
);

const wallTexturePromise = loadTextureWithFallback(
  `${ASSETS_BASE_PATH}/antracite-realista.jpg`,
  wallTextureData
);

// Obra de arte central
const centerArtGroup = new THREE.Group();
const frameWidth = 4.6;
const frameHeight = 5.8;

centerTexturePromise.then(centerTexture => {
  const centerFrame = new THREE.Mesh(
    new THREE.BoxGeometry(frameWidth + 0.3, frameHeight + 0.3, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0x1e1a16,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x0d0c0a,
      emissiveIntensity: 0.15
    })
  );
  centerFrame.position.z = -0.1;
  centerArtGroup.add(centerFrame);

  const centerPainting = new THREE.Mesh(
    new THREE.PlaneGeometry(frameWidth, frameHeight),
    new THREE.MeshStandardMaterial({
      map: centerTexture,
      roughness: 0.15,
      metalness: 0.1
    })
  );
  centerPainting.position.z = 0.01;
  centerArtGroup.add(centerPainting);

  centerArtGroup.position.set(
    0,
    10.3,
    -config.wallDistance + 0.001
  );
  scene.add(centerArtGroup);
});

// Aplicar textura nas paredes com melhor iluminação
wallTexturePromise.then(wallTexture => {
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    color: 0x2a2a2a, // Slightly brighter base color
    emissive: 0x101010,
    emissiveIntensity: 0.5, // Increased emissive intensity
    roughness: 0.6, // Reduced roughness for more reflectivity
    metalness: 0.2, // Increased metalness
    side: THREE.FrontSide
  });

  const backWallGeo = new THREE.PlaneGeometry(40, 30);
  const sideWallGeo = new THREE.PlaneGeometry(30, 28);

  const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
  backWall.position.set(0, 13.6, -config.wallDistance - 4.1);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const leftWall = new THREE.Mesh(sideWallGeo, wallMaterial);
  leftWall.position.set(-14.6, 13.4, -config.wallDistance / 2);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeo, wallMaterial);
  rightWall.position.set(14.6, 13.4, -config.wallDistance / 2);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  scene.add(rightWall);
});

// Obras de arte laterais
const wallArtworks = [
  {
    src: `${ASSETS_BASE_PATH}/obras/obra-lateral-esquerda.jpg`,
    x: -12.0,
    y: 9.1,
    z: 0,
    rotY: Math.PI / 2
  },
  {
    src: `${ASSETS_BASE_PATH}/obras/obra-lateral-direita.jpg`,
    x: 12.0,
    y: 9.1,
    z: 0,
    rotY: -Math.PI / 2
  }
];

wallArtworks.forEach(({ src, x, y, z, rotY }) => {
  loadTextureWithFallback(src, wallTextureData, texture => {
    const width = 4.4;
    const height = 6.4;

    const artworkGroup = new THREE.Group();

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.3, height + 0.3, 0.18),
      new THREE.MeshStandardMaterial({
        color: 0x1e1a16,
        metalness: 0.6,
        roughness: 0.3,
        emissive: 0x0d0c0a,
        emissiveIntensity: 0.15
      })
    );
    frame.position.z = -0.1;
    artworkGroup.add(frame);

    const painting = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.2,
        metalness: 0.05,
        side: THREE.FrontSide
      })
    );
    painting.position.z = 0.01;
    artworkGroup.add(painting);

    artworkGroup.position.set(x, y, z);
    artworkGroup.rotation.y = rotY;
    scene.add(artworkGroup);
  });
});

// Materiais especiais
const goldMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xd9b96c,
  metalness: 1,
  roughness: 0.08,
  clearcoat: 0.9,
  clearcoatRoughness: 0.05,
  emissive: 0x4a320a,
  emissiveIntensity: 0.25,
  reflectivity: 0.6
});

// Vitrines
const gemTexturePromise = loadTextureWithFallback(
  `${ASSETS_BASE_PATH}/gemas/gema-azul.png`,
  wallTextureData
);

const showcaseTexturePromise = loadTextureWithFallback(
  `${ASSETS_BASE_PATH}/vitrine-escura.jpg`,
  wallTextureData
);

Promise.all([gemTexturePromise, showcaseTexturePromise]).then(([gemTexture, showcaseTexture]) => {
  function createShowcase(x, z, index) {
    const pedestalHeight = 4.6;
    const showcaseHeight = 1.6;
    const gemHeight = pedestalHeight + showcaseHeight / 2 + 0.25;
    const emissiveColor = 0x3377cc;
    const emissiveIntensity = 2.4;

    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, pedestalHeight, 1.05),
      new THREE.MeshStandardMaterial({
        map: showcaseTexture,
        roughness: 0.5,
        metalness: 0.25
      })
    );
    pedestal.position.set(x, pedestalHeight / 2, z);
    pedestal.castShadow = true;
    scene.add(pedestal);

    const goldTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.06, 32),
      goldMaterial
    );
    goldTop.position.set(x, pedestalHeight + 0.03, z);
    goldTop.castShadow = true;
    scene.add(goldTop);

    const showcase = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, showcaseHeight, 1.0),
      new THREE.MeshPhysicalMaterial({
        color: 0xf8f8f8,
        metalness: 0.1,
        roughness: 0.02,
        transmission: 1,
        thickness: 0.5,
        transparent: true,
        opacity: 0.1,
        ior: 1.52,
        reflectivity: 0.9,
        clearcoat: 0.9,
        clearcoatRoughness: 0.02
      })
    );
    showcase.position.set(x, pedestalHeight + showcaseHeight / 2 + 0.06, z);
    showcase.castShadow = true;
    scene.add(showcase);

    const gem = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.4, 1),
      new THREE.MeshStandardMaterial({
        map: gemTexture,
        emissive: emissiveColor,
        emissiveIntensity: emissiveIntensity,
        transparent: true,
        opacity: 0.95
      })
    );
    gem.position.set(x, gemHeight, z);
    gem.rotation.y = index * 0.3;
    gem.castShadow = true;
    scene.add(gem);
  }

  createShowcase(-12.0, -1.8, 0);
  createShowcase(-12.0, 1.8, 1);
  createShowcase(12.0, -1.8, 2);
  createShowcase(12.0, 1.8, 3);
});

// Texto NANdART
const fontLoader = new FontLoader();
loadQueue.push(new Promise((resolve) => {
  fontLoader.load(
    'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
    font => {
      updateLoadProgress();
      const textGeo = new TextGeometry('NANdART', {
        font,
        size: config.textSize + 0.1,
        height: 0.12,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.015,
        bevelSegments: 5
      });

      textGeo.computeBoundingBox();
      const width = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

      const text = new THREE.Mesh(
        textGeo,
        new THREE.MeshStandardMaterial({
          color: 0xc49b42,
          metalness: 1,
          roughness: 0.25,
          emissive: 0x2c1d07,
          emissiveIntensity: 0.45
        })
      );

      text.position.set(-width / 2, 15.5, -config.wallDistance - 3.98);
      text.castShadow = true;
      scene.add(text);

      const textLight = new THREE.SpotLight(0xfff1cc, 1.3, 12, Math.PI / 9, 0.4);
      textLight.position.set(0, 18, -config.wallDistance - 2);
      textLight.target = text;
      scene.add(textLight);
      scene.add(textLight.target);
      resolve();
    },
    undefined,
    err => {
      console.error('Error loading font:', err);
      updateLoadProgress();
      resolve();
    }
  );
}));

// Animações de materiais
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.material.emissiveIntensity &&
    obj.material.color?.getHex() === 0xf3cc80
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.65,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  if (
    obj.isMesh &&
    obj.material?.emissive &&
    obj.material?.color?.getHex() === 0x1e1a16
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.25,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  if (
    obj.isMesh &&
    obj.material?.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 2.8,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// Dados das obras de arte - updated to British English
const artworkPaths = [
  `${ASSETS_BASE_PATH}/obras/obra1.jpg`,
  `${ASSETS_BASE_PATH}/obras/obra2.jpg`,
  `${ASSETS_BASE_PATH}/obras/obra3.jpg`,
  `${ASSETS_BASE_PATH}/obras/obra4.jpg`,
  `${ASSETS_BASE_PATH}/obras/obra5.jpg`,
  `${ASSETS_BASE_PATH}/obras/obra6.jpg`,
  `${ASSETS_BASE_PATH}/obras/obra7.jpg`,
  `${ASSETS_BASE_PATH}/obras/obra8.jpg`
];

const artworkData = [
  {
    title: "Fragment of Eternity",
    artist: "Inês Duarte",
    year: "2023",
    price: "0.0001",
    description: "An exploration of temporal dimensions through layered textures."
  },
  {
    title: "Shadows of Light",
    artist: "Miguel Costa",
    year: "2024",
    price: "0.0001",
    description: "Contrast between light and shadow in constant motion."
  },
  {
    title: "Shared Horizon",
    artist: "Clara Mendonça",
    year: "2022",
    price: "1",
    description: "Multiple perspectives of the same urban horizon."
  },
  {
    title: "Memories of Silence",
    artist: "Rui Valente",
    year: "2023",
    price: "0.0001",
    description: "Abstraction of memories that remain in silence."
  },
  {
    title: "Contained Rhythm",
    artist: "Joana Serra",
    year: "2025",
    price: "0.0001",
    description: "Frozen movement in precise geometric patterns."
  },
  {
    title: "Inner Fluctuation",
    artist: "André Luz",
    year: "2023",
    price: "1.0",
    description: "Emotional states represented through fluid colours."
  },
  {
    title: "Hidden Verse",
    artist: "Sofia Rocha",
    year: "2024",
    price: "0.0001",
    description: "Textures revealing hidden layers of perception."
  },
  {
    title: "Silhouette of Tomorrow",
    artist: "Tiago Faria",
    year: "2025",
    price: "0.0001",
    description: "Futuristic vision of evolving organic forms."
  }
];

// Carregar obras de arte circulares
const artworks = [];
const artworkReflections = [];
let originalAnimationSpeed = -0.00012;

artworkPaths.forEach((src, i) => {
  loadQueue.push(new Promise((resolve) => {
    loadTextureWithFallback(src, wallTextureData, texture => {
      const angle = (i / artworkPaths.length) * Math.PI * 2;
      const x = Math.cos(angle) * config.circleRadius;
      const z = Math.sin(angle) * config.circleRadius;
      const rotationY = -angle + Math.PI;

      const artwork = new THREE.Mesh(
        new THREE.PlaneGeometry(config.obraSize, config.obraSize),
        new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.2,
          metalness: 0.05,
          side: THREE.DoubleSide
        })
      );
      artwork.position.set(x, 4.2, z);
      artwork.rotation.y = rotationY;
      artwork.castShadow = true;
      scene.add(artwork);

      const reflection = new THREE.Mesh(
        new THREE.PlaneGeometry(config.obraSize, config.obraSize),
        new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.2,
          metalness: 0.05,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4
        })
      );
      reflection.position.set(x, -4.2, z);
      reflection.rotation.x = Math.PI;
      reflection.rotation.y = rotationY;
      scene.add(reflection);
      artworkReflections.push(reflection);

      artwork.userData = {
        originalPosition: new THREE.Vector3(x, 4.2, z),
        originalRotation: new THREE.Euler(0, rotationY, 0),
        originalScale: new THREE.Vector3(1, 1, 1),
        reflection: reflection,
        originalY: 4.2
      };

      artworks.push(artwork);
      resolve();
    });
  }));
});

// Interação com obras de arte
let selectedArtwork = null;
let isHighlighted = false;

function highlightArtwork(artwork, data) {
  if (isHighlighted) return;
  isHighlighted = true;
  selectedArtwork = artwork;

  artwork.userData.reflection.visible = false;
  artwork.renderOrder = 999;
  artwork.material.depthTest = false;
  artwork.material.depthWrite = false;

  // Calculate target position (2x height from original)
  const targetY = artwork.userData.originalY * 2;
  const targetZ = -config.wallDistance / 2;

  // Dim other artworks
  gsap.to(artworks.filter(a => a !== artwork), {
    material: { opacity: 0.3 },
    duration: 0.5
  });

  // Animate to double size and new position
  gsap.to(artwork.scale, {
    x: 2,
    y: 2,
    z: 2,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(artwork.position, {
    x: 0,
    y: targetY,
    z: targetZ,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      gsap.to(artwork.rotation, {
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: showModal
      });
    }
  });

  blurOverlay.classList.add('active');

  function showModal() {
    modalTitle.textContent = data.title;
    modalDescription.textContent = data.description;
    modalArtist.textContent = data.artist;
    modalYear.textContent = data.year;
    modalPrice.textContent = `${data.price} ETH`;

    // Set modal width to match artwork width (including scale)
    modal.style.width = `${config.obraSize * 2 * 100}px`;

    // Position modal 4cm below artwork (converted to pixels)
    const artworkWorldPos = new THREE.Vector3();
    artwork.getWorldPosition(artworkWorldPos);
    artworkWorldPos.project(camera);

    const x = (artworkWorldPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (artworkWorldPos.y * -0.5 + 0.5) * window.innerHeight;
    
    // Convert 4cm to pixels based on viewport
    const cmInPixels = (4 / 2.54) * 96 * (window.innerHeight / 1080);
    const modalTop = y + cmInPixels;

    modal.style.left = `${x - modal.offsetWidth / 2}px`;
    modal.style.top = `${modalTop}px`;

    modal.style.display = 'flex';
    gsap.to(modal, { opacity: 1, duration: 0.3 });
  }
}

function restoreArtwork() {
  if (!isHighlighted) return;
  isHighlighted = false;

  gsap.to(modal, {
    opacity: 0,
    duration: 0.3,
    onComplete: () => {
      modal.style.display = 'none';
    }
  });

  // Restore other artworks opacity
  gsap.to(artworks.filter(a => a !== selectedArtwork), {
    material: { opacity: 1 },
    duration: 0.5
  });

  selectedArtwork.renderOrder = 0;
  selectedArtwork.material.depthTest = true;
  selectedArtwork.material.depthWrite = true;

  gsap.to(selectedArtwork.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(selectedArtwork.position, {
    x: selectedArtwork.userData.originalPosition.x,
    y: selectedArtwork.userData.originalPosition.y,
    z: selectedArtwork.userData.originalPosition.z,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(selectedArtwork.rotation, {
    y: selectedArtwork.userData.originalRotation.y,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      selectedArtwork.userData.reflection.visible = true;
    }
  });

  blurOverlay.classList.remove('active');
}

// Event handlers
function handleArtworkClick(e) {
  // Check if click is outside modal and artwork
  if (isHighlighted) {
    const artworkBounds = selectedArtwork.geometry.boundingBox.clone();
    artworkBounds.applyMatrix4(selectedArtwork.matrixWorld);
    
    const mouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersectsArtwork = raycaster.intersectObject(selectedArtwork).length > 0;
    const intersectsModal = modal.contains(e.target);
    
    if (!intersectsArtwork && !intersectsModal) {
      restoreArtwork();
    }
    return;
  }

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(artworks);
  if (intersects.length > 0) {
    const artwork = intersects[0].object;
    const index = artworks.indexOf(artwork);
    const data = artworkData[index];
    highlightArtwork(artwork, data);
  }
}

renderer.domElement.addEventListener('pointerdown', handleArtworkClick);

// Main animation
function animate() {
  requestAnimationFrame(animate);

  const speedFactor = isHighlighted ? 0.5 : 1; // Half speed when highlighted
  const time = Date.now() * originalAnimationSpeed * speedFactor;

  artworks.forEach((artwork, i) => {
    if (artwork === selectedArtwork) return;

    const angle = time + (i / artworks.length) * Math.PI * 2;
    const x = Math.cos(angle) * config.circleRadius;
    const z = Math.sin(angle) * config.circleRadius;
    const rotationY = -angle + Math.PI;

    artwork.position.x = x;
    artwork.position.z = z;
    artwork.rotation.y = rotationY;

    if (artwork.userData.reflection) {
      artwork.userData.reflection.position.x = x;
      artwork.userData.reflection.position.z = z;
      artwork.userData.reflection.rotation.y = rotationY;
    }
  });

  renderer.render(scene, camera);
}

// Conexão com carteira
async function toggleWalletConnection() {
  if (!window.ethereum) {
    showNotification('Please install MetaMask to connect your wallet.', 'error');
    return;
  }

  try {
    showSpinner();
    
    if (walletButton.classList.contains('connected')) {
      walletButton.classList.remove('connected');
      walletButton.innerHTML = 'Connect Wallet';
      walletButton.style.padding = '10px 18px 10px 42px';
      showNotification('Wallet disconnected', 'info');
    } else {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(accounts[0]);
      const formattedBalance = ethers.formatEther(balance);
      const shortBalance = parseFloat(formattedBalance).toFixed(3);

      walletButton.classList.add('connected');
      walletButton.innerHTML = `Connected <span id="wallet-balance">${shortBalance} ETH</span>`;
      walletButton.style.padding = '10px 18px 10px 16px';
      showNotification('Wallet connected successfully', 'success');
    }
  } catch (err) {
    console.error('Wallet connection error:', err);
    showNotification(`Error connecting wallet: ${err.message}`, 'error');
  } finally {
    hideSpinner();
  }
}

// Compra de obra de arte
async function buyHandler(data) {
  if (!window.ethereum) {
    showNotification('Install MetaMask to purchase this artwork.', 'error');
    return;
  }

  try {
    showSpinner();
    
    // Verificar conexão
    if (!walletButton.classList.contains('connected')) {
      await toggleWalletConnection();
      if (!walletButton.classList.contains('connected')) return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    // Verificar se está na rede mainnet (opcional)
    if (network.chainId !== 1) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }],
        });
      } catch (switchError) {
        showNotification('Please switch to Ethereum Mainnet', 'warning');
        return;
      }
    }

    const signer = await provider.getSigner();
    const ethValue = ethers.parseEther(data.price);

    // Mostrar confirmação
    const confirmed = confirm(`Confirm purchase of "${data.title}" for ${data.price} ETH?`);
    if (!confirmed) {
      showNotification('Purchase canceled', 'info');
      return;
    }

    const tx = await signer.sendTransaction({
      to: CONTRACT_ADDRESS,
      value: ethValue
    });

    showNotification(`Transaction sent! Hash: ${tx.hash}`, 'success');
    
    const receipt = await tx.wait();
    showNotification('Purchase confirmed! Thank you.', 'success');
  } catch (err) {
    console.error('Purchase error:', err);
    showNotification(`Error during purchase: ${err.message}`, 'error');
  } finally {
    hideSpinner();
  }
}

// Inicialização
if (buyButton) {
  buyButton.addEventListener('click', () => {
    if (selectedArtwork) {
      const index = artworks.indexOf(selectedArtwork);
      const data = artworkData[index];
      buyHandler(data);
    }
  });
}

if (walletButton) {
  walletButton.addEventListener('click', toggleWalletConnection);
}

// Verificar carteira conectada ao carregar
window.addEventListener('load', async () => {
  showSpinner();
  
  try {
    // Esperar carregamento de assets
    await Promise.all(loadQueue);
    
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const balance = await provider.getBalance(accounts[0].address);
        const formattedBalance = ethers.formatEther(balance);
        const shortBalance = parseFloat(formattedBalance).toFixed(3);

        walletButton.classList.add('connected');
        walletButton.innerHTML = `Connected <span id="wallet-balance">${shortBalance} ETH</span>`;
        walletButton.style.padding = '10px 18px 10px 16px';
      }
    }
  } catch (err) {
    console.error('Initialization error:', err);
  } finally {
    // Iniciar animação após tudo carregado
    animate();
  }
});

// Limpeza ao sair
window.addEventListener('beforeunload', () => {
  // Limpar animações GSAP
  gsap.globalTimeline.getChildren().forEach(tween => tween.kill());
  
  // Limpar recursos Three.js
  scene.traverse(obj => {
    if (obj.isMesh) {
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material?.dispose();
      }
    }
  });
  
  // Limpar event listeners
  window.removeEventListener('resize', handleResize);
  renderer.domElement.removeEventListener('pointerdown', handleArtworkClick);
  if (buyButton) buyButton.removeEventListener('click', buyHandler);
  if (walletButton) walletButton.removeEventListener('click', toggleWalletConnection);
});
