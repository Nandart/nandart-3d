import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { gsap } from 'gsap';

// Sistema de Responsividade Avançado
const responsiveConfig = {
  breakpoints: [
    { maxWidth: 480, key: 'XS' },
    { maxWidth: 768, key: 'SM' }, 
    { maxWidth: 1024, key: 'MD' },
    { key: 'LG' } // Default
  ],
  settings: {
    XS: { 
      cameraZ: 16, obraSize: 0.35, premiumSize: 0.45,
      circleRadius: 2.5, wallDistance: 8, textSize: 0.4,
      cameraY: 4.0, obraY: 4.0, premiumY: 5.5
    },
    SM: {
      cameraZ: 14, obraSize: 0.4, premiumSize: 0.5,
      circleRadius: 3.0, wallDistance: 9, textSize: 0.45,
      cameraY: 3.8, obraY: 4.1, premiumY: 5.7
    },
    MD: {
      cameraZ: 13, obraSize: 0.45, premiumSize: 0.6,
      circleRadius: 3.3, wallDistance: 9.5, textSize: 0.5,
      cameraY: 3.6, obraY: 4.2, premiumY: 5.9
    },
    LG: {
      cameraZ: 12, obraSize: 0.5, premiumSize: 0.65,
      circleRadius: 3.5, wallDistance: 10, textSize: 0.55,
      cameraY: 3.5, obraY: 4.3, premiumY: 6.1
    }
  },
  getInterpolatedValue(prop, width) {
    const points = [];
    for (const bp of this.breakpoints) {
      if (this.settings[bp.key][prop] !== undefined) {
        points.push({ width: bp.maxWidth || Infinity, value: this.settings[bp.key][prop] });
      }
    }
    
    points.sort((a, b) => a.width - b.width);
    
    for (let i = 0; i < points.length - 1; i++) {
      if (width <= points[i+1].width) {
        const ratio = (width - points[i].width) / (points[i+1].width - points[i].width);
        return points[i].value + (points[i+1].value - points[i].value) * ratio;
      }
    }
    return points[points.length-1].value;
  }
};

function getConfig() {
  const width = window.innerWidth;
  const currentBP = responsiveConfig.breakpoints.find(bp => 
    !bp.maxWidth || width <= bp.maxWidth
  ).key;
  
  return {
    ...responsiveConfig.settings[currentBP],
    // Valores interpolados
    obraSize: responsiveConfig.getInterpolatedValue('obraSize', width),
    premiumSize: responsiveConfig.getInterpolatedValue('premiumSize', width),
    circleRadius: responsiveConfig.getInterpolatedValue('circleRadius', width),
    isMobile: currentBP === 'XS' || currentBP === 'SM'
  };
}

// Configurações iniciais
let config = getConfig();
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Câmera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
function updateCamera() {
  const width = window.innerWidth;
  config = getConfig();
  camera.position.set(
    0, 
    responsiveConfig.getInterpolatedValue('cameraY', width),
    responsiveConfig.getInterpolatedValue('cameraZ', width)
  );
  camera.lookAt(0, 4.5, 0);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

// Renderizador
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

function updateRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

// Iluminação (mantida como no original)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

const spotLight = new THREE.SpotLight(0xffffff, 1.8, 15, Math.PI / 6, 0.3);
spotLight.position.set(0, 10, 3);
spotLight.castShadow = true;
scene.add(spotLight);

// Criação de objetos (adaptada para usar config dinâmica)
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.15, metalness: 0.5 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const circleGeometry = new THREE.RingGeometry(1.8, 2, 64);
const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const circle = new THREE.Mesh(circleGeometry, circleMaterial);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.01;
scene.add(circle);
const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.8,
  metalness: 0.2,
  side: THREE.DoubleSide
});

const backWall = new THREE.Mesh(new THREE.PlaneGeometry(25, 16), wallMaterial);
backWall.position.set(0, 8, -config.wallDistance);
backWall.receiveShadow = true;
scene.add(backWall);

const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), wallMaterial);
leftWall.position.set(-12, 8, config.wallDistance / 3);
leftWall.rotation.y = Math.PI / 3;
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), wallMaterial);
rightWall.position.set(12, 8, config.wallDistance / 3);
rightWall.rotation.y = -Math.PI / 3;
rightWall.receiveShadow = true;
scene.add(rightWall);

const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.9, metalness: 0.1 })
);
ceiling.position.set(0, 16, 0);
ceiling.rotation.x = Math.PI / 2;
ceiling.receiveShadow = true;
scene.add(ceiling);

// Frisos dourados
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0xc4b582,
  roughness: 0.3,
  metalness: 1,
  emissive: 0x111111
});

function adicionarFriso(x, y, z, largura, altura, rotY = 0) {
  const friso = new THREE.Mesh(new THREE.BoxGeometry(largura, altura, 0.05), frisoMaterial);
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  scene.add(friso);
}

// Fundo
adicionarFriso(0, 13.5, -config.wallDistance + 0.01, 12, 0.1);
adicionarFriso(0, 2.5, -config.wallDistance + 0.01, 12, 0.1);
adicionarFriso(-6, 8, -config.wallDistance + 0.01, 0.1, 11);
adicionarFriso(6, 8, -config.wallDistance + 0.01, 0.1, 11);

// Laterais
adicionarFriso(-12, 13.5, config.wallDistance / 3 - 0.01, 9, 0.1, Math.PI / 3);
adicionarFriso(-12, 2.5, config.wallDistance / 3 - 0.01, 9, 0.1, Math.PI / 3);
adicionarFriso(12, 13.5, config.wallDistance / 3 - 0.01, 9, 0.1, -Math.PI / 3);
adicionarFriso(12, 2.5, config.wallDistance / 3 - 0.01, 9, 0.1, -Math.PI / 3);

// Obras fixas
function criarObraFixa(imagem, largura, altura, x, y, z, rotY = 0) {
  const textura = new THREE.TextureLoader().load(imagem);
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(largura + 0.1, altura + 0.1, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xc4b582, metalness: 0.8, roughness: 0.3 })
  );
  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, altura),
    new THREE.MeshStandardMaterial({ map: textura, roughness: 0.4, metalness: 0.2 })
  );
  quadro.position.z = 0.05;
  const grupo = new THREE.Group();
  grupo.add(moldura);
  grupo.add(quadro);
  grupo.position.set(x, y, z);
  grupo.rotation.y = rotY;
  scene.add(grupo);
}

criarObraFixa('/assets/obras/obra-central.jpg', 1.6, 2, 0, 7.5, -config.wallDistance + 0.06);
criarObraFixa('/assets/obras/obra-lateral-direita.jpg', 1.2, 1.6, 11.5, 7.5, config.wallDistance / 3 + 0.06, -Math.PI / 3);
criarObraFixa('/assets/obras/obra-esquerda.jpg', 1.2, 1.6, -11.5, 7.5, config.wallDistance / 3 + 0.06, Math.PI / 3);

// Texto NANdART
const createText = () => {
  const loader = new FontLoader();
  loader.load(
    'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
    (font) => {
      const textGeometry = new TextGeometry('NANdART', {
        font: font,
        size: config.textSize,
        height: 0.05,
        curveSegments: 12
      });
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
      const textMaterial = new THREE.MeshPhongMaterial({
        color: 0xc4b582,
        emissive: 0x000000,
        specular: 0x222222,
        shininess: 50
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(-textWidth / 2 - 0.1, isMobile ? 9 : 9.5, -config.wallDistance + 0.01);
      if (isFirefox) textMesh.position.z -= 0.02;
      if (isSafari) textMesh.scale.set(1.05, 1.05, 1);
      scene.add(textMesh);
    }
  );
};

createText();
const cubosComGemas = [];
const texturaGema = new THREE.TextureLoader().load('/assets/gemas/gema-azul.jpg.png');

function criarCuboComGema(x, z) {
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 })
  );
  pedestal.position.set(x, 0.5, z);
  scene.add(pedestal);

  const tampa = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.05, 0.6),
    new THREE.MeshPhysicalMaterial({
      color: 0xddddff,
      transmission: 1,
      opacity: 0.8,
      transparent: true,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 1
    })
  );
  tampa.position.set(0, 0.55, 0);

  const gema = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 32),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0x222244
    })
  );
  gema.position.set(0, 0.3, 0);

  const luz = new THREE.PointLight(0x88ccff, 1.2, 3);
  luz.position.set(0, 0.3, 0);

  const grupo = new THREE.Group();
  grupo.add(tampa);
  grupo.add(gema);
  grupo.add(luz);
  grupo.position.set(x, 1, z);

  grupo.userData = { aberto: false, tampa, gema, luz };
  scene.add(grupo);
  cubosComGemas.push(grupo);
}

// 4 cubos posicionados nos pedestais
criarCuboComGema(-8, -2);
criarCuboComGema(-8, 2);
criarCuboComGema(8, -2);
criarCuboComGema(8, 2);

function animarCubo(grupo) {
  if (grupo.userData.aberto) return;
  grupo.userData.aberto = true;

  gsap.to(grupo.userData.tampa.position, {
    y: 1.2,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(grupo.userData.gema.position, {
    y: 1.8,
    duration: 1,
    ease: 'power2.out'
  });

  gsap.to(grupo.userData.gema.scale, {
    x: 1.5,
    y: 1.5,
    z: 1.5,
    duration: 1
  });

  grupo.userData.luz.intensity = 2;
}

function fecharCubo(grupo) {
  if (!grupo.userData.aberto) return;
  grupo.userData.aberto = false;

  gsap.to(grupo.userData.tampa.position, {
    y: 0.55,
    duration: 0.8
  });

  gsap.to(grupo.userData.gema.position, {
    y: 0.3,
    duration: 1
  });

  gsap.to(grupo.userData.gema.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 1
  });

  grupo.userData.luz.intensity = 1.2;
}

renderer.domElement.addEventListener('click', (e) => {
  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersectados = raycaster.intersectObjects(cubosComGemas.flatMap(g => g.children));

  if (intersectados.length > 0) {
    const cubo = intersectados[0].object.parent;
    animarCubo(cubo);
  } else {
    cubosComGemas.forEach(cubo => fecharCubo(cubo));
  }
});

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
const textureCache = {};

const loader = new THREE.TextureLoader();
obraPaths.forEach(path => {
  textureCache[path] = loader.load(path);
});
const starTexture = loader.load('/assets/premium/estrela-premium.png');
const premiumTexture = loader.load('/assets/premium/premium1.jpg');

function criarObrasNormais() {
  obraPaths.forEach((src, i) => {
    const angulo = (i / obraPaths.length) * Math.PI * 2;

    const moldura = new THREE.Mesh(
      new THREE.BoxGeometry(config.obraSize + 0.08, config.obraSize + 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.3 })
    );
    moldura.castShadow = true;
    moldura.receiveShadow = true;

    const obra = new THREE.Mesh(
      new THREE.PlaneGeometry(config.obraSize, config.obraSize),
      new THREE.MeshStandardMaterial({ map: textureCache[src], roughness: 0.4, metalness: 0.1 })
    );
    obra.position.z = 0.05;
    obra.castShadow = true;

    const grupo = new THREE.Group();
    grupo.add(moldura);
    grupo.add(obra);
    grupo.position.set(
      Math.cos(angulo) * config.circleRadius,
      isMobile ? 4 : 4.2,
      Math.sin(angulo) * config.circleRadius
    );
    grupo.rotation.y = -angulo + Math.PI;

    grupo.userData = {
      tipo: 'normal',
      obra: obra,
      index: i,
      originalPos: grupo.position.clone(),
      originalRot: grupo.rotation.clone(),
      originalScale: 1
    };

    scene.add(grupo);
    obrasNormais.push(grupo);
  });
}

function criarObraPremium() {
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(config.premiumSize + 0.12, config.premiumSize + 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xc4b582, roughness: 0.3, metalness: 0.8, emissive: 0x222222 })
  );
  moldura.castShadow = true;
  moldura.receiveShadow = true;

  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(config.premiumSize, config.premiumSize),
    new THREE.MeshStandardMaterial({ map: premiumTexture, roughness: 0.2, metalness: 0.3 })
  );
  obra.position.z = 0.08;
  obra.castShadow = true;

  const estrela = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.15),
    new THREE.MeshStandardMaterial({ map: starTexture, transparent: true })
  );
  estrela.position.set(0.25, 0.25, 0.12);

  const grupo = new THREE.Group();
  grupo.add(moldura);
  grupo.add(obra);
  grupo.add(estrela);
  grupo.position.set(0, isMobile ? 5.5 : 5.8, 0);

  let floatTime = 0;
  const animateFloat = () => {
    floatTime += 0.016;
    grupo.position.y = (isMobile ? 5.5 : 5.8) + Math.sin(floatTime * 2.2) * 0.22;
    grupo.rotation.z = Math.sin(floatTime * 1.6) * 0.05;
    requestAnimationFrame(animateFloat);
  };
  animateFloat();

  grupo.userData = {
    tipo: 'premium',
    obra: obra,
    originalPos: grupo.position.clone(),
    originalRot: grupo.rotation.clone(),
    originalScale: 1
  };

  scene.add(grupo);
  return grupo;
}

criarObrasNormais();
const premiumObra = criarObraPremium();

function animate() {
  requestAnimationFrame(animate);

  obrasNormais.forEach((q, i) => {
    const angulo = Date.now() * -0.00012 + (i / obrasNormais.length) * Math.PI * 2;
    q.position.x = Math.cos(angulo) * config.circleRadius;
    q.position.z = Math.sin(angulo) * config.circleRadius;
    q.rotation.y = -angulo + Math.PI;
  });

  renderer.render(scene, camera);
}

// Sistema de redimensionamento otimizado
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCamera();
    updateRenderer();
    
    // Atualize elementos que dependem do tamanho
    obrasNormais.forEach((obra, i) => {
      const angulo = (i / obrasNormais.length) * Math.PI * 2;
      obra.position.y = config.obraY;
    });
    
    if (premiumObra) {
      premiumObra.position.y = config.premiumY;
    }
    
  }, 100);
});

// Animação principal
function animate() {
  requestAnimationFrame(animate);

  if (!isFocusMode) {
    obrasNormais.forEach((q, i) => {
      const angulo = Date.now() * -0.00012 + (i / obrasNormais.length) * Math.PI * 2;
      q.position.x = Math.cos(angulo) * config.circleRadius;
      q.position.z = Math.sin(angulo) * config.circleRadius;
      q.rotation.y = -angulo + Math.PI;
    });
  }

  renderer.render(scene, camera);
}

// Inicialização
init();
