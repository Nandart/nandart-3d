// Versão final com iluminação específica para paredes
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';

const walletButton = document.getElementById('wallet-button');
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const textureLoader = new THREE.TextureLoader();

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

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Iluminação ambiente principal (intensidade aumentada para 1.8 de forma gradual)
const hemisphereLight = new THREE.HemisphereLight(
  0xfff2e0, // Cor do céu (mais quente)
  0x202020,  // Cor do solo (mais clara que o original 0x080808)
  1.8        // Intensidade aumentada em 80% (não 100% para manter naturalidade)
);
hemisphereLight.groundColor.setHSL(0.1, 0.2, 0.15); // Ajuste sutil de tonalidade
scene.add(hemisphereLight);

// Luz de preenchimento adicional sutil
const fillLight = new THREE.AmbientLight(
  0xfff2dd, 
  0.3 // Intensidade baixa para complemento
);
scene.add(fillLight);

const spotLightLeft = new THREE.SpotLight(0xfff2dd, 2.0);
spotLightLeft.position.set(-10, 8, 0);
spotLightLeft.angle = Math.PI / 6;
spotLightLeft.penumbra = 0.3;
spotLightLeft.decay = 2;
spotLightLeft.distance = 25;
spotLightLeft.castShadow = true;
spotLightLeft.shadow.mapSize.width = 2048;
spotLightLeft.shadow.mapSize.height = 2048;
spotLightLeft.shadow.bias = -0.0005;
scene.add(spotLightLeft);

const spotLightRight = new THREE.SpotLight(0xfff2dd, 2.0);
spotLightRight.position.set(10, 8, 0);
spotLightRight.angle = Math.PI / 6;
spotLightRight.penumbra = 0.3;
spotLightRight.decay = 2;
spotLightRight.distance = 25;
spotLightRight.castShadow = true;
spotLightRight.shadow.mapSize.width = 2048;
spotLightRight.shadow.mapSize.height = 2048;
spotLightRight.shadow.bias = -0.0005;
scene.add(spotLightRight);

const createWallLight = (x, z, intensity) => {
    const light = new THREE.SpotLight(0xffffff, intensity, 25, Math.PI/4, 0.5);
    light.position.set(x, 15, z);
    light.target.position.set(x, 0, z > -10 ? -config.wallDistance/2 : -config.wallDistance);
    light.castShadow = false;
    return light;
};

const backWallLight1 = createWallLight(0, -config.wallDistance - 2, 0.8);
const backWallLight2 = createWallLight(0, -config.wallDistance - 2, 0.8);
const leftWallLight1 = createWallLight(-14, -config.wallDistance/2, 0.7);
const leftWallLight2 = createWallLight(-14, -config.wallDistance/2, 0.7);
const rightWallLight1 = createWallLight(14, -config.wallDistance/2, 0.7);
const rightWallLight2 = createWallLight(14, -config.wallDistance/2, 0.7);

[backWallLight1, backWallLight2, leftWallLight1, leftWallLight2, rightWallLight1, rightWallLight2].forEach(light => {
    scene.add(light);
    scene.add(light.target);
    light.layers.set(2);
});

hemisphereLight.layers.disable(2);
spotLightLeft.layers.disable(2);
spotLightRight.layers.disable(2);

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
  trim.layers.enable(1);
  scene.add(trim);
  return trim;
}

function createTrimRect(x, y, z, width, height, rotY = 0) {
  const group = new THREE.Group();
  const thickness = 0.06;

  const top = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, 0.02), trimMaterial);
  top.position.set(0, height / 2, 0);
  top.receiveShadow = false;
  top.layers.enable(1);
  group.add(top);

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, 0.02), trimMaterial);
  bottom.position.set(0, -height / 2, 0);
  bottom.receiveShadow = false;
  bottom.layers.enable(1);
  group.add(bottom);

  const left = new THREE.Mesh(new THREE.BoxGeometry(thickness, height - thickness * 2, 0.02), trimMaterial);
  left.position.set(-width / 2 + thickness / 2, 0, 0);
  left.receiveShadow = false;
  left.layers.enable(1);
  group.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(thickness, height - thickness * 2, 0.02), trimMaterial);
  right.position.set(width / 2 - thickness / 2, 0, 0);
  right.receiveShadow = false;
  right.layers.enable(1);
  group.add(right);

  group.position.set(x, y, z);
  group.rotation.y = rotY;
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

const centerTexture = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Error loading center artwork:', err)
);

const centerArtGroup = new THREE.Group();

const frameWidth = 4.6;
const frameHeight = 5.8;

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

const wallTexture = new THREE.DataTexture(
  wallTextureData.data,
  wallTextureData.width,
  wallTextureData.height,
  THREE.RGBAFormat
);
wallTexture.needsUpdate = true;

const backWallGeo = new THREE.PlaneGeometry(40, 30);
const sideWallGeo = new THREE.PlaneGeometry(30, 28);

const applyWallTexture = texture => {
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0x1a1a1a,
    emissive: 0x050505,
    emissiveIntensity: 0.5,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.FrontSide
  });

  const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
  backWall.position.set(0, 13.6, -config.wallDistance - 4.1);
  backWall.receiveShadow = true;
  backWall.layers.set(2);
  scene.add(backWall);

  const leftWall = new THREE.Mesh(sideWallGeo, wallMaterial);
  leftWall.position.set(-14.6, 13.4, -config.wallDistance / 2);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  leftWall.layers.set(2);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeo, wallMaterial);
  rightWall.position.set(14.6, 13.4, -config.wallDistance / 2);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  rightWall.layers.set(2);
  scene.add(rightWall);
};

textureLoader.load(
  '/assets/antracite-realista.jpg',
  texture => {
    console.log('✅ Wall texture loaded');
    applyWallTexture(texture);
  },
  undefined,
  () => {
    console.warn('⚠️ Using fallback wall texture');
    applyWallTexture(wallTexture);
  }
);

const wallArtworks = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -12.0,
    y: 9.1,
    z: 0,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 12.0,
    y: 9.1,
    z: 0,
    rotY: -Math.PI / 2
  }
];

wallArtworks.forEach(({ src, x, y, z, rotY }) => {
  const texture = textureLoader.load(
    src,
    texture => {
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
    },
    undefined,
    err => console.error(`Error loading ${src}:`, err)
  );
});

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

const gemTexture = textureLoader.load('/assets/gemas/gema1.png');
const showcaseTexture = textureLoader.load('/assets/vitrine-escura.jpg');

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

const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
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
  }
);

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

const artworkPaths = [
  "/assets/obras/obra1.jpg",
  "/assets/obras/obra2.jpg",
  "/assets/obras/obra3.jpg",
  "/assets/obras/obra4.jpg",
  "/assets/obras/obra5.jpg",
  "/assets/obras/obra6.jpg",
  "/assets/obras/obra7.jpg",
  "/assets/obras/obra8.jpg"
];

const artworkData = [
 {
  title: "Fragment of Eternity",
  artist: "Inês Duarte",
  year: "2023",
  price: "0.0001",
  tokenURI: "ipfs://bafybeicnafmqkac6fxctcnuibyr5bv35srkk24iled3p72n4oqul333vaa/fragment_of_eternity.json",
  artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
}
,
  {
    title: "Shadows of Light",
    artist: "Miguel Costa",
    year: "2024",
    price: "0.0001",
    tokenURI: "ipfs://bafybeic2cmwwsvm6fjfbxojc2pcr3rzvtfveludgpd44jxgetyrlncxmyu/shadows_of_light.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Shared Horizon",
    artist: "Clara Mendonça",
    year: "2022",
    price: "1",
    tokenURI: "ipfs://bafybeiakxmorl2p2z7cjm7vl5laqc5iozulevcskrya7hrmm6biewzwzu4/shared_horizon.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Memories of Silence",
    artist: "Rui Valente",
    year: "2023",
    price: "0.0001",
    tokenURI: "ipfs://bafybeibdrkwcyu6qajyynrl2sjgwyiowpgwwu5limjq6rab4wdoggnflpy/memories_of_silence.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Contained Rhythm",
    artist: "Joana Serra",
    year: "2025",
    price: "0.0001",
    tokenURI: "ipfs://bafybeidi67ljb4oa7ywti4dxcnlmvnjfme6gyongbl3ygsgmpg5ne5tqz4/contained_rhythm.json",
     artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Inner Fluctuation",
    artist: "André Luz",
    year: "2023",
    price: "1.0",
    tokenURI: "ipfs://bafybeihnvhjtbkygyw7tcghpxbbzcte2a74mqkswaliu3gec4r6tm7phvm/inner_fluctuation.json",
    artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Concealed Verse",
    artist: "Sofia Rocha",
    year: "2024",
    price: "0.0001",
   tokenURI: "ipfs://bafybeify2nqjijzo3ocy7um5pot75bzmhqgtkmnxa5izf5mgfxy6jvhmjm/concealed_verse.json",
     artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  },
  {
    title: "Silhouette of Tomorrow",
    artist: "Tiago Faria",
    year: "2025",
    price: "0.0001",
    tokenURI: "ipfs://bafybeicslxf77trep4rwsszl57jhwmlmevuc4bnfouvqdrjpc4jgggfv44/silhouette_of_tomorrow.json",
     artista: "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"
  }
];

const artworks = [];
const artworkReflections = [];
let originalAnimationSpeed = -0.00012;

artworkPaths.forEach((src, i) => {
  const texture = textureLoader.load(src);
  const angle = (i / artworkPaths.length) * Math.PI * 2;
  const x = Math.cos(angle) * config.circleRadius;
  const z = Math.sin(angle) * config.circleRadius;
  const rotationY = -angle + Math.PI;

  // Obra principal
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
  artwork.receiveShadow = false;
  scene.add(artwork);

  // Reflexão no chão (ajustada para perfeito alinhamento)
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
  reflection.position.set(
    x, 
    -4.2, // Posição espelhada exata
    z
  );
  reflection.rotation.x = Math.PI; // Rotação para espelhar
  reflection.rotation.y = rotationY; // Manter mesma rotação Y
  reflection.receiveShadow = false;
  reflection.castShadow = false;
  
  // Ajuste fino de posicionamento para alinhamento perfeito
  reflection.position.y += 0.05; // Compensação para o plano do chão
  reflection.scale.set(1, -1, 1); // Inversão vertical para efeito de espelho
  
  scene.add(reflection);
  artworkReflections.push(reflection);

  artwork.userData = {
    originalPosition: new THREE.Vector3(x, 4.2, z),
    originalRotation: new THREE.Euler(0, rotationY, 0),
    originalScale: new THREE.Vector3(1, 1, 1),
    reflection: reflection
  };

  artworks.push(artwork);
});

let selectedArtwork = null;
let isHighlighted = false;
const modal = document.querySelector('.art-modal');
const modalTitle = document.getElementById('art-title');
const modalDescription = document.getElementById('art-description');
const modalArtist = document.getElementById('art-artist');
const modalYear = document.getElementById('art-year');
const modalPrice = document.getElementById('art-price');
const buyButton = document.getElementById('buy-art');
const blurOverlay = document.getElementById('blur-overlay');

function highlightArtwork(artwork, data) {
  if (isHighlighted) return;
  isHighlighted = true;
  selectedArtwork = artwork;

  artwork.userData.originalParent = artwork.parent;
  artwork.userData.originalPosition = artwork.position.clone();
  artwork.userData.originalRotation = artwork.rotation.clone();
  artwork.userData.originalScale = artwork.scale.clone();

  const highlightGroup = new THREE.Group();
  scene.add(highlightGroup);
  artwork.userData.highlightGroup = highlightGroup;
  
  artwork.parent.remove(artwork);
  highlightGroup.add(artwork);

  artwork.userData.reflection.visible = false;

  const targetY = 8.4;
  const targetZ = -config.wallDistance / 2;

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
  blurOverlay.style.backdropFilter = 'blur(8px)';
  blurOverlay.style.webkitBackdropFilter = 'blur(8px)';

  function showModal() {
    modalTitle.textContent = data.title;
    modalDescription.textContent = data.description;
    modalArtist.textContent = data.artist;
    modalYear.textContent = data.year;
    modalPrice.textContent = `${data.price} ETH`;

    modal.style.width = `${config.obraSize * 2 * 100}px`;

    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(artwork.matrixWorld);
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    modal.style.left = `${x - modal.offsetWidth / 2}px`;
    modal.style.top = `${y + 120}px`;

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

  const artwork = selectedArtwork;
  const highlightGroup = artwork.userData.highlightGroup;

  gsap.to(artwork.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(artwork.position, {
    x: artwork.userData.originalPosition.x,
    y: artwork.userData.originalPosition.y,
    z: artwork.userData.originalPosition.z,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(artwork.rotation, {
    y: artwork.userData.originalRotation.y,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      highlightGroup.remove(artwork);
      artwork.userData.originalParent.add(artwork);
      scene.remove(highlightGroup);
      artwork.userData.reflection.visible = true;
    }
  });

  blurOverlay.classList.remove('active');
  blurOverlay.style.backdropFilter = 'none';
  blurOverlay.style.webkitBackdropFilter = 'none';
}

function handleClickOutside(event) {
  if (isHighlighted && !modal.contains(event.target)) {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(selectedArtwork);
    if (intersects.length === 0) {
      restoreArtwork();
    }
  }
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (isHighlighted) {
    if (!modal.contains(e.target)) {
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
});

window.addEventListener('click', handleClickOutside);

function animate() {
  requestAnimationFrame(animate);

  const speedFactor = isHighlighted ? 0.5 : 1;
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

async function toggleWalletConnection() {
  if (!window.ethereum) {
    alert('Please install MetaMask to connect your wallet.');
    return;
  }

  try {
    if (walletButton.classList.contains('connected')) {
      walletButton.classList.remove('connected');
      walletButton.innerHTML = 'Connect Wallet';
      walletButton.style.padding = '10px 18px 10px 42px';
    } else {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(accounts[0]);
      const formattedBalance = ethers.formatEther(balance);
      const shortBalance = parseFloat(formattedBalance).toFixed(3);

      walletButton.classList.add('connected');
      walletButton.innerHTML = `Connected <span id="wallet-balance">${shortBalance} ETH</span>`;
      walletButton.style.padding = '10px 18px 10px 16px';
    }
  } catch (err) {
    console.error('Wallet connection error:', err);
    alert('Error connecting wallet. Please try again.');
  }
}

async function buyHandler(data) {
  if (!window.ethereum) {
    alert('Install MetaMask to purchase this artwork.');
    return;
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const ethValue = ethers.parseEther(data.price);

    const tx = await signer.sendTransaction({
      to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41',
      value: ethValue
    });

    alert(`Transaction sent!\nHash: ${tx.hash}`);

    await tx.wait();
    alert('Purchase confirmed! Thank you for acquiring this artwork.');
  } catch (err) {
    console.error('Purchase error:', err);
    alert('Error during purchase. Please try again.');
  }
}

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

window.addEventListener('load', async () => {
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
});

animate();

async function mintArtwork(artwork, contrato, userAddress) {
  try {
    const valor = ethers.parseEther(artwork.price.toString());

    const tx = await contrato.mintComCuradoria(
      artwork.artista,
      artwork.tokenURI,
      { value: valor }
    );

    console.log(`NFT cunhado com sucesso: ${artwork.title}`);
    return tx;
  } catch (error) {
    console.error(`Erro ao cunhar "${artwork.title}":`, error);
  }
}

async function mintTodos(contrato, userAddress) {
  for (const obra of artworkData) {
    await mintArtwork(obra, contrato, userAddress);
  }
}