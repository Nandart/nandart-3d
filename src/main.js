import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/loaders/Font
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/jsm/geometries/TextGeometry.js';
import gsap from 'gsap';

// Configurações cross-browser
const isMobile = window.innerWidth < 768;
const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Dimensões responsivas
const getConfig = () => ({
  obraSize: isMobile ? 0.35 : 0.5,
  premiumSize: isMobile ? 0.45 : 0.65,
  circleRadius: isMobile ? 2.5 : 3.5,
  wallDistance: isMobile ? 8 : 10,
  cameraZ: isMobile ? 16 : 14,
  textSize: isMobile ? 0.4 : 0.5
});

let config = getConfig();

// Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Câmera universal
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
updateCamera();

function updateCamera() {
  config = getConfig();
  camera.position.set(0, isMobile ? 4 : 3.5, config.cameraZ);
  camera.lookAt(0, 2.5, 0);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

// Renderizador cross-browser
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
updateRenderer();

function updateRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

// Iluminação melhorada
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Chão com reflexo
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40, 32, 32),
  new THREE.MeshPhongMaterial({
    color: 0x050505,
    shininess: 100,
    reflectivity: 0.4
  })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Parede de fundo
const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(25, 16, 32, 32),
  new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a,
    roughness: 0.8,
    metalness: 0.2,
    side: THREE.DoubleSide
  })
);
backWall.position.set(0, 8, -config.wallDistance);
backWall.receiveShadow = true;
scene.add(backWall);

// Texto NANdART universal
const createText = () => {
  const loader = new FontLoader();
  loader.load(
    'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/fonts/helvetiker_regular.typeface.json',
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
      textMesh.position.set(
        -textWidth/2 - 0.1, 
        isMobile ? 9 : 9.5, 
        -config.wallDistance + 0.01
      );
      
      if (isFirefox) textMesh.position.z -= 0.02;
      if (isSafari) textMesh.scale.set(1.05, 1.05, 1);
      
      scene.add(textMesh);
    },
    undefined,
    (err) => {
      console.error('Error loading font:', err);
    }
  );
};

createText();

// Paredes laterais otimizadas
const wallMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x1a1a1a,
  roughness: 0.8,
  metalness: 0.2,
  side: THREE.DoubleSide
});

const leftWall = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 16, 32, 32),
  wallMaterial
);
leftWall.position.set(-12, 8, config.wallDistance/3);
leftWall.rotation.y = Math.PI/3;
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 16, 32, 32),
  wallMaterial
);
rightWall.position.set(12, 8, config.wallDistance/3);
rightWall.rotation.y = -Math.PI/3;
rightWall.receiveShadow = true;
scene.add(rightWall);

// Teto visível
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30, 32, 32),
  new THREE.MeshStandardMaterial({ 
    color: 0x121212,
    roughness: 0.9,
    metalness: 0.1
  })
);
ceiling.position.set(0, 16, 0);
ceiling.rotation.x = Math.PI/2;
ceiling.receiveShadow = true;
scene.add(ceiling);

// Sistema de obras
const obraPaths = [
  "/assets/obras/obra1.jpg",
  "/assets/obras/obra2.jpg",
  "/assets/obras/obra3.jpg",
  "/assets/obras/obra4.jpg", 
  "/assets/obras/obra5.jpg",
  "/assets/obras/obra6.jpg"
];

const obrasNormais = [];
const textureCache = {};

// Pré-carregar texturas
const preloadTextures = async () => {
  const loader = new THREE.TextureLoader();
  for (const path of obraPaths) {
    textureCache[path] = await new Promise(resolve => {
      loader.load(path, resolve, undefined, (err) => {
        console.error('Failed to load texture:', path, err);
        resolve(new THREE.Texture());
      });
    });
  }
  textureCache['premium'] = await new Promise(resolve => {
    loader.load('/assets/premium/premium1.jpg', resolve, undefined, (err) => {
      console.error('Failed to load premium texture:', err);
      resolve(new THREE.Texture());
    });
  });
};

// Criar obras normais
const createArtworks = () => {
  obraPaths.forEach((src, i) => {
    const angulo = (i / obraPaths.length) * Math.PI * 2;
    
    const moldura = new THREE.Mesh(
      new THREE.BoxGeometry(config.obraSize + 0.08, config.obraSize + 0.08, 0.08),
      new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.3
      })
    );
    moldura.castShadow = true;
    moldura.receiveShadow = true;
    
    const obra = new THREE.Mesh(
      new THREE.PlaneGeometry(config.obraSize, config.obraSize),
      new THREE.MeshStandardMaterial({ 
        map: textureCache[src],
        roughness: 0.4,
        metalness: 0.1
      })
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
};

// Obra premium
const createPremiumArtwork = () => {
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(config.premiumSize + 0.12, config.premiumSize + 0.12, 0.12),
    new THREE.MeshStandardMaterial({ 
      color: 0xc4b582,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x222222
    })
  );
  moldura.castShadow = true;
  moldura.receiveShadow = true;
  
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(config.premiumSize, config.premiumSize),
    new THREE.MeshStandardMaterial({ 
      map: textureCache['premium'],
      roughness: 0.2,
      metalness: 0.3
    })
  );
  obra.position.z = 0.08;
  obra.castShadow = true;
  
  const star = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.15),
    new THREE.MeshStandardMaterial({
      map: new THREE.TextureLoader().load('/assets/icons/estrela-premium.png'),
      transparent: true,
      roughness: 0.1,
      metalness: 0.9
    })
  );
  star.position.set(0.25, 0.25, 0.12);
  
  const aura = new THREE.PointLight(0xfff7d6, 1.2, 3.5);
  aura.position.set(0, 0, 0.2);
  
  const grupo = new THREE.Group();
  grupo.add(moldura);
  grupo.add(obra);
  grupo.add(star);
  grupo.add(aura);
  grupo.position.set(0, isMobile ? 5.5 : 5.8, 0);
  
  // Animação de flutuação
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
};

// Sistema de interação
const modal = document.querySelector('.art-modal');
let isFocusMode = false;
let focusedArtwork = null;
let artworkClone = null;

const showArtworkDetails = (artwork) => {
  isFocusMode = true;
  focusedArtwork = artwork;

  // Criar clone em alta qualidade
  artworkClone = new THREE.Group();
  const obraClone = artwork.userData.obra.clone();
  obraClone.material = artwork.userData.obra.material.clone();
  
  if (artwork.userData.tipo === 'premium') {
    obraClone.material.map = textureCache['premium'].clone();
  } else {
    obraClone.material.map = textureCache[obraPaths[artwork.userData.index]].clone();
  }
  obraClone.material.needsUpdate = true;

  const molduraClone = artwork.children[0].clone();
  molduraClone.material = artwork.children[0].material.clone();
  
  artworkClone.add(molduraClone);
  artworkClone.add(obraClone);
  artworkClone.position.copy(artwork.position);
  artworkClone.rotation.copy(artwork.rotation);
  artworkClone.scale.copy(artwork.scale);
  scene.add(artworkClone);

  artworkClone.renderOrder = 999;

  gsap.to(artworkClone.position, {
    x: 0,
    y: isMobile ? 4.5 : 4.2,
    z: 1.5,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(artworkClone.rotation, {
    x: 0,
    y: 0,
    z: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(artworkClone.scale, {
    x: 2.2,
    y: 2.2,
    z: 2.2,
    duration: 0.8
  });

  scene.traverse(obj => {
    if (obj !== artworkClone && obj !== ceiling && obj.material) {
      obj.userData.originalMaterial = obj.material;
      obj.material = new THREE.MeshBasicMaterial({ 
        color: 0x111111,
        transparent: true,
        opacity: 0.6
      });
    }
  });

  modal.style.display = 'flex';
  modal.querySelector('#art-title').textContent = 
    artwork.userData.tipo === 'premium' ? 'Obra Premium' : `Obra #${artwork.userData.index + 1}`;
  
  document.addEventListener('click', handleClickOutside, true);
  modal.querySelector('#buy-art').onclick = handleBuyClick;
};

const closeArtworkDetails = () => {
  if (!artworkClone) return;
  
  gsap.to(artworkClone.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.6
  });

  gsap.to(artworkClone.position, {
    x: focusedArtwork.userData.originalPos.x,
    y: focusedArtwork.userData.originalPos.y,
    z: focusedArtwork.userData.originalPos.z,
    duration: 0.6
  });

  gsap.to(artworkClone.rotation, {
    x: 0,
    y: focusedArtwork.userData.originalRot.y,
    z: 0,
    duration: 0.6,
    onComplete: () => {
      scene.remove(artworkClone);
      
      scene.traverse(obj => {
        if (obj.userData?.originalMaterial) {
          obj.material = obj.userData.originalMaterial;
          delete obj.userData.originalMaterial;
        }
      });
      
      modal.style.display = 'none';
      isFocusMode = false;
      focusedArtwork = null;
      artworkClone = null;
      
      document.removeEventListener('click', handleClickOutside, true);
    }
  });
};

const handleClickOutside = (e) => {
  if (!modal.contains(e.target)) {
    closeArtworkDetails();
  }
};

const handleBuyClick = (e) => {
  e.stopPropagation();
  alert(`${focusedArtwork.userData.tipo === 'premium' ? 'Obra Premium' : 'Obra'} adquirida com sucesso!`);
};

// Animação principal
const animate = () => {
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
};

// Inicialização
const init = async () => {
  await preloadTextures();
  createArtworks();
  const premium = createPremiumArtwork();
  
  renderer.domElement.addEventListener('click', (e) => {
    if (isFocusMode) return;
    
    const mouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([...obrasNormais, premium].flatMap(g => g.children));

    if (intersects.length > 0) {
      const selected = intersects[0].object.parent;
      showArtworkDetails(selected);
    }
  });

  window.addEventListener('resize', () => {
    updateCamera();
    updateRenderer();
  });

  animate();
};

init();
