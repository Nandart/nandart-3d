import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import gsap from 'gsap';

// Configurações responsivas
const isMobile = window.innerWidth < 768;
const obraSize = isMobile ? 0.2 : 0.3;
const premiumSize = isMobile ? 0.25 : 0.35;
const circleRadius = isMobile ? 1.8 : 2.2;
const wallDistance = isMobile ? 6 : 8;

// Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Câmera ajustada para mobile e desktop
const camera = new THREE.PerspectiveCamera(
  45, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  100
);
camera.position.set(0, isMobile ? 3 : 2.5, isMobile ? 12 : 10);
camera.lookAt(0, isMobile ? 2 : 1.5, 0);

// Renderizador
const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById('scene'),
  antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(0, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Chão
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshPhongMaterial({
    color: 0x050505,
    shininess: 100,
    reflectivity: 0.3
  })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Parede de fundo
const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 12),
  new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
);
backWall.position.set(0, 6, -wallDistance);
scene.add(backWall);

// Texto NANdART
const createText = () => {
  const loader = new FontLoader();
  loader.load(
    'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/fonts/helvetiker_regular.typeface.json',
    (font) => {
      const textGeometry = new TextGeometry('NANdART', {
        font: font,
        size: isMobile ? 0.4 : 0.5,
        height: 0.02,
      });
      
      const textMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xc4b582,
        emissive: 0x000000,
        specular: 0x111111
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
      textMesh.position.set(
        -textWidth/2, 
        isMobile ? 7 : 7.5, 
        -wallDistance + 0.01
      );
      scene.add(textMesh);
    }
  );
};
createText();

// Paredes laterais melhor posicionadas
const wallMaterial = new THREE.MeshPhongMaterial({ 
  color: 0x1a1a1a,
  side: THREE.DoubleSide
});

const leftWall = new THREE.Mesh(
  new THREE.PlaneGeometry(15, 12),
  wallMaterial
);
leftWall.position.set(-10, 6, wallDistance/2);
leftWall.rotation.y = Math.PI/2.5; // Ângulo mais natural
scene.add(leftWall);

const rightWall = new THREE.Mesh(
  new THREE.PlaneGeometry(15, 12),
  wallMaterial
);
rightWall.position.set(10, 6, wallDistance/2);
rightWall.rotation.y = -Math.PI/2.5;
scene.add(rightWall);

// Teto
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshPhongMaterial({ 
    color: 0x121212,
    emissive: 0x050505,
    shininess: 30
  })
);
ceiling.position.set(0, 12, 0);
ceiling.rotation.x = Math.PI/2;
scene.add(ceiling);

// Obras de arte
const obraPaths = [
  "./assets/obras/obra1.jpg",
  "./assets/obras/obra2.jpg",
  "./assets/obras/obra3.jpg",
  "./assets/obras/obra4.jpg",
  "./assets/obras/obra5.jpg",
  "./assets/obras/obra6.jpg"
];

const obrasNormais = [];

// Criar obras normais (sentido anti-horário)
obraPaths.forEach((src, i) => {
  const angulo = (i / obraPaths.length) * Math.PI * 2;
  
  // Moldura
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(obraSize + 0.05, obraSize + 0.05, 0.05),
    new THREE.MeshPhongMaterial({ color: 0x333333 })
  );
  
  // Obra
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(obraSize, obraSize),
    new THREE.MeshBasicMaterial({ 
      map: new THREE.TextureLoader().load(src),
      transparent: true
    })
  );
  obra.position.z = 0.03;
  
  const grupo = new THREE.Group();
  grupo.add(moldura);
  grupo.add(obra);
  grupo.position.set(
    Math.cos(angulo) * circleRadius,
    isMobile ? 2.5 : 2.8,
    Math.sin(angulo) * circleRadius
  );
  grupo.rotation.y = -angulo + Math.PI;
  grupo.userData = { 
    tipo: 'normal',
    obra: obra,
    index: i,
    originalPos: grupo.position.clone(),
    originalRot: grupo.rotation.clone()
  };
  
  scene.add(grupo);
  obrasNormais.push(grupo);
});

// Obra premium
const createPremiumArtwork = () => {
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(premiumSize + 0.1, premiumSize + 0.1, 0.08),
    new THREE.MeshPhongMaterial({ 
      color: 0xc4b582,
      specular: 0xffffff,
      shininess: 100
    })
  );
  
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(premiumSize, premiumSize),
    new THREE.MeshBasicMaterial({ 
      map: new THREE.TextureLoader().load('./assets/premium/premium1.jpg')
    })
  );
  obra.position.z = 0.05;
  
  const star = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.15),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('./assets/icons/estrela-premium.png'),
      transparent: true
    })
  );
  star.position.set(0.25, 0.25, 0.09);
  
  const aura = new THREE.PointLight(0xfff7d6, 0.7, 2);
  aura.position.set(0, 0, 0.1);
  
  const grupo = new THREE.Group();
  grupo.add(moldura);
  grupo.add(obra);
  grupo.add(star);
  grupo.add(aura);
  grupo.position.set(0, isMobile ? 4 : 4.2, 0);
  grupo.userData = {
    tipo: 'premium',
    obra: obra,
    originalPos: grupo.position.clone(),
    originalRot: grupo.rotation.clone()
  };
  
  // Animação de flutuação
  let floatTime = 0;
  const animateFloat = () => {
    floatTime += 0.015;
    grupo.position.y = (isMobile ? 4 : 4.2) + Math.sin(floatTime * 2.5) * 0.15;
    grupo.rotation.z = Math.sin(floatTime * 1.8) * 0.03;
    requestAnimationFrame(animateFloat);
  };
  animateFloat();
  
  scene.add(grupo);
  return grupo;
};
const premium = createPremiumArtwork();

// Sistema de interação
const modal = document.querySelector('.art-modal');
let isFocusMode = false;
let focusedArtwork = null;
let artworkClone = null;

// Função para sair do modo foco ao clicar fora
function handleBackgroundClick(event) {
  if (isFocusMode && event.target.id === 'scene') {
    closeArtworkDetails();
  }
}

// Sistema de foco melhorado
function showArtworkDetails(artwork) {
  isFocusMode = true;
  focusedArtwork = artwork;

  // Criar clone para trazer à frente
  artworkClone = artwork.userData.obra.clone();
  artworkClone.material = artwork.userData.obra.material.clone();
  artworkClone.position.copy(artwork.position);
  artworkClone.rotation.copy(artwork.rotation);
  artworkClone.scale.copy(artwork.scale);
  scene.add(artworkClone);

  // Animação para o centro
  gsap.to(artworkClone.position, {
    x: 0,
    y: isMobile ? 3 : 2.5,
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
    x: isMobile ? 1.5 : 1.8,
    y: isMobile ? 1.5 : 1.8,
    duration: 0.8
  });

  // Desfoque do fundo
  document.getElementById('scene').style.filter = 'blur(5px)';
  
  // Posicionar modal preso à obra
  modal.style.display = 'block';
  modal.style.bottom = '15%';
  modal.style.left = '50%';
  modal.style.transform = 'translateX(-50%)';
  modal.style.width = isMobile ? '80%' : '60%';
  modal.style.maxWidth = '300px';
  modal.style.padding = isMobile ? '10px' : '12px';

  // Adicionar evento para sair do modo foco
  renderer.domElement.addEventListener('click', handleBackgroundClick);
}

function closeArtworkDetails() {
  if (!artworkClone) return;

  gsap.to(artworkClone.scale, {
    x: 1,
    y: 1,
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
      document.getElementById('scene').style.filter = 'none';
      modal.style.display = 'none';
      isFocusMode = false;
      focusedArtwork = null;
      artworkClone = null;
      renderer.domElement.removeEventListener('click', handleBackgroundClick);
    }
  });
}

// Animação principal (anti-horário)
function animate() {
  requestAnimationFrame(animate);

  if (!isFocusMode) {
    obrasNormais.forEach((q, i) => {
      const angulo = Date.now() * -0.00015 + (i / obrasNormais.length) * Math.PI * 2; // Negativo para anti-horário
      q.position.x = Math.cos(angulo) * circleRadius;
      q.position.z = Math.sin(angulo) * circleRadius;
      q.rotation.y = -angulo + Math.PI;
    });
  } else {
    // Desacelerar mas não parar
    obrasNormais.forEach((q, i) => {
      const angulo = Date.now() * -0.00005 + (i / obrasNormais.length) * Math.PI * 2;
      q.position.x = Math.cos(angulo) * circleRadius;
      q.position.z = Math.sin(angulo) * circleRadius;
      q.rotation.y = -angulo + Math.PI;
    });
  }

  renderer.render(scene, camera);
}

// Event listeners
function onClick(event) {
  if (isFocusMode) return;

  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...obrasNormais, premium].flatMap(g => g.children));

  if (intersects.length > 0) {
    const selected = intersects[0].object.parent;
    showArtworkDetails(selected);
  }
}

renderer.domElement.addEventListener('click', onClick);

// Responsividade
function handleResize() {
  const isNowMobile = window.innerWidth < 768;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  if (isMobile !== isNowMobile) {
    window.location.reload();
  }
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);

animate();
