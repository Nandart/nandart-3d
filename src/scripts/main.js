import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import gsap from 'gsap';

// Configurações
const isMobile = window.innerWidth < 768;
const obraSize = 0.3; // Metade do tamanho original
const premiumSize = 0.35;
const circleRadius = 1.5; // 1/3 do raio original
const wallDepth = 8;

// Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Câmera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.5, 5);
camera.lookAt(0, 1.5, 0);

// Renderizador
const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById('scene'),
  antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1.5, 30, Math.PI/6, 0.2, 1);
spotLight.position.set(0, 8, 4);
spotLight.castShadow = true;
scene.add(spotLight);

// Chão
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshPhongMaterial({
    color: 0x050505,
    shininess: 100,
    reflectivity: 0.3
  })
);
floor.rotation.x = -Math.PI/2;
floor.receiveShadow = true;
scene.add(floor);

// Parede de fundo
const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 6),
  new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
);
backWall.position.set(0, 3, -4);
scene.add(backWall);

// Texto NANdART
const createText = () => {
  const loader = new FontLoader();
  loader.load(
    'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/fonts/helvetiker_regular.typeface.json',
    (font) => {
      const textGeometry = new TextGeometry('NANdART', {
        font: font,
        size: 0.4,
        height: 0.02,
      });
      
      const textMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xc4b582,
        emissive: 0x000000,
        specular: 0x111111
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(-1.2, 4.5, -3.99);
      scene.add(textMesh);
    },
    undefined,
    (error) => {
      console.error('Error loading font:', error);
    }
  );
};
createText();

// Paredes laterais
const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
const sideWallGeometry = new THREE.PlaneGeometry(6, 6);

const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
leftWall.position.set(-5, 3, 2);
leftWall.rotation.y = Math.PI/4;
scene.add(leftWall);

const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
rightWall.position.set(5, 3, 2);
rightWall.rotation.y = -Math.PI/4;
scene.add(rightWall);

// Teto
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshPhongMaterial({ 
    color: 0x121212,
    emissive: 0x050505
  })
);
ceiling.position.set(0, 6, 0);
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

// Criar obras normais
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
    1.5,
    Math.sin(angulo) * circleRadius
  );
  grupo.rotation.y = -angulo + Math.PI;
  grupo.userData = { 
    tipo: 'normal',
    obra: obra,
    index: i
  };
  
  scene.add(grupo);
  obrasNormais.push(grupo);
});

// Obra premium
const createPremiumArtwork = () => {
  // Moldura premium
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(premiumSize + 0.1, premiumSize + 0.1, 0.08),
    new THREE.MeshPhongMaterial({ 
      color: 0xc4b582,
      specular: 0xffffff,
      shininess: 100
    })
  );
  
  // Obra
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(premiumSize, premiumSize),
    new THREE.MeshBasicMaterial({ 
      map: new THREE.TextureLoader().load('./assets/premium/premium1.jpg')
    })
  );
  obra.position.z = 0.05;
  
  // Estrela
  const star = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.15),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('./assets/icons/estrela-premium.png'),
      transparent: true
    })
  );
  star.position.set(0.25, 0.25, 0.09);
  
  // Aura
  const aura = new THREE.PointLight(0xfff7d6, 0.5, 1.5);
  aura.position.set(0, 0, 0.1);
  
  const grupo = new THREE.Group();
  grupo.add(moldura);
  grupo.add(obra);
  grupo.add(star);
  grupo.add(aura);
  grupo.position.set(0, 3.2, 0);
  
  // Animação de flutuação
  const animateFloat = () => {
    let time = 0;
    const float = () => {
      time += 0.01;
      grupo.position.y = 3.2 + Math.sin(time * 2) * 0.1;
      grupo.rotation.z = Math.sin(time * 1.5) * 0.02;
      requestAnimationFrame(float);
    };
    float();
  };
  animateFloat();
  
  grupo.userData = {
    tipo: 'premium',
    obra: obra
  };
  
  scene.add(grupo);
  return grupo;
};
const premium = createPremiumArtwork();

// Modal
const modal = document.querySelector('.art-modal');
const buyBtn = document.getElementById('buy-art');

// Interação
let isAnimating = false;
let currentArtwork = null;

renderer.domElement.addEventListener('click', onClick);

function onClick(event) {
  if (isAnimating) return;

  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...obrasNormais, premium].flatMap(g => g.children));

  if (intersects.length > 0) {
    const intersected = intersects[0].object.parent;
    if (intersected.userData && intersected.userData.obra) {
      showArtworkDetails(intersected);
    }
  }
}

function showArtworkDetails(artwork) {
  isAnimating = true;
  currentArtwork = artwork;

  // Trazer para frente
  gsap.to(artwork.position, {
    z: 2,
    duration: 0.8,
    ease: 'power2.out'
  });

  // Mostrar modal
  modal.querySelector('#art-title').textContent = `Obra ${artwork.userData.tipo === 'premium' ? 'Premium' : 'Normal'}`;
  modal.querySelector('#art-description').textContent = `Edição exclusiva ${artwork.userData.index + 1 || ''}`;
  modal.style.display = 'block';

  // Configurar botão
  buyBtn.onclick = () => {
    alert(`Obra ${artwork.userData.tipo === 'premium' ? 'Premium' : ''} adquirida!`);
    closeArtworkDetails();
  };
}

function closeArtworkDetails() {
  if (!currentArtwork) return;
  
  gsap.to(currentArtwork.position, {
    z: 0,
    duration: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      isAnimating = false;
      currentArtwork = null;
    }
  });
  
  modal.style.display = 'none';
}

// Animação
function animate() {
  requestAnimationFrame(animate);

  if (!isAnimating) {
    obrasNormais.forEach((q, i) => {
      const angulo = Date.now() * 0.0002 + (i / obrasNormais.length) * Math.PI * 2;
      q.position.x = Math.cos(angulo) * circleRadius;
      q.position.z = Math.sin(angulo) * circleRadius;
      q.rotation.y = -angulo + Math.PI;
    });
  }

  renderer.render(scene, camera);
}
animate();

// Responsividade
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
