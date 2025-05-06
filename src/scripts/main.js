import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.2/index.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/geometries/TextGeometry.js';

// Configurações iniciais
const obraPaths = [
  "./assets/obras/obra1.jpg",
  "./assets/obras/obra2.jpg",
  "./assets/obras/obra3.jpg",
  "./assets/obras/obra4.jpg",
  "./assets/obras/obra5.jpg",
  "./assets/obras/obra6.jpg"
];

// Cena e câmera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 8);

// Renderizador
const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById('scene'), 
  antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// Sistema de iluminação
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const spotlight = new THREE.SpotLight(0xffffff, 1.2, 30, Math.PI / 8, 0.2, 1);
spotlight.position.set(0, 8, 6);
spotlight.castShadow = true;
scene.add(spotlight);

// Luzes cenográficas (LEDs)
const ledLight1 = new THREE.PointLight(0xffffff, 0.8, 10);
ledLight1.position.set(-5, 4, 0);
scene.add(ledLight1);

const ledLight2 = new THREE.PointLight(0xffffff, 0.8, 10);
ledLight2.position.set(5, 4, 0);
scene.add(ledLight2);

// Estrutura da galeria
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshPhongMaterial({
    color: 0x050505,
    shininess: 100,
    reflectivity: 0.8
  })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Parede de fundo
const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 10),
  new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
);
backWall.position.set(0, 5, -7);
scene.add(backWall);

// Paredes laterais
const sideWallMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), sideWallMaterial);
leftWall.position.set(-10, 5, 0);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), sideWallMaterial);
rightWall.position.set(10, 5, 0);
rightWall.rotation.y = Math.PI / 2;
scene.add(rightWall);

// Teto
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshPhongMaterial({ color: 0x0a0a0a })
);
ceiling.position.set(0, 10, 0);
ceiling.rotation.x = Math.PI / 2;
scene.add(ceiling);

// Texto NANdART 3D
const createGalleryTitle = () => {
  const loader = new FontLoader();
  loader.load(
    'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/fonts/helvetiker_regular.typeface.json',
    (font) => {
      const textGeometry = new TextGeometry('NANdART', {
        font: font,
        size: 0.5,
        height: 0.1,
        curveSegments: 12
      });
      
      const textMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xd4af37,
        specular: 0x111111,
        shininess: 30
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
      textMesh.position.set(-textWidth/2, 5.5, -6.95);
      scene.add(textMesh);
    },
    undefined,
    (error) => {
      console.error('Erro ao carregar fonte:', error);
      // Fallback: texto simples
      const textGeometry = new THREE.PlaneGeometry(3, 0.5);
      const textMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xd4af37,
        side: THREE.DoubleSide
      });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, 5.5, -6.95);
      scene.add(textMesh);
    }
  );
};
createGalleryTitle();

// Sistema de obras de arte
const obrasNormais = [];
const raio = 3.5;

// Criar obras normais
obraPaths.forEach((src, i) => {
  // Moldura
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.65, 0.05),
    new THREE.MeshPhongMaterial({ color: 0x333333 })
  );
  
  // Obra de arte
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.6),
    new THREE.MeshBasicMaterial({ 
      map: new THREE.TextureLoader().load(src),
      transparent: true
    })
  );
  obra.position.z = 0.03;
  
  // Grupo completo
  const grupoQuadro = new THREE.Group();
  grupoQuadro.add(moldura);
  grupoQuadro.add(obra);
  
  const angulo = (i / obraPaths.length) * Math.PI * 2;
  grupoQuadro.position.set(Math.cos(angulo) * raio, 1.8, Math.sin(angulo) * raio);
  grupoQuadro.rotation.y = -angulo + Math.PI;
  grupoQuadro.userData = { 
    tipo: 'normal', 
    obra: obra,
    index: i
  };
  
  scene.add(grupoQuadro);
  obrasNormais.push(grupoQuadro);
});

// Obra premium
const createPremiumArtwork = () => {
  // Moldura dourada
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.75, 0.05),
    new THREE.MeshPhongMaterial({ color: 0xd4af37 })
  );
  
  // Obra premium
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.7),
    new THREE.MeshBasicMaterial({ 
      map: new THREE.TextureLoader().load('./assets/premium/premium1.jpg')
    })
  );
  obra.position.z = 0.03;
  
  // Ícone de estrela
  const star = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.15),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('./assets/icons/estrela-premium.png'),
      transparent: true
    })
  );
  star.position.set(0.25, 0.25, 0.04);
  
  // Grupo premium
  const grupoPremium = new THREE.Group();
  grupoPremium.add(moldura);
  grupoPremium.add(obra);
  grupoPremium.add(star);
  grupoPremium.position.set(0, 3.2, 0);
  grupoPremium.userData = {
    tipo: 'premium',
    obra: obra
  };
  
  scene.add(grupoPremium);
  return grupoPremium;
};
const premium = createPremiumArtwork();

// Sistema de interação
const modal = document.createElement('div');
modal.className = 'obra-modal';
modal.innerHTML = `
  <h3>Detalhes da Obra</h3>
  <p id="obra-descricao"></p>
  <button id="comprar-obra">Adquirir Obra</button>
`;
document.body.appendChild(modal);

let isAnimating = false;
let animationSpeed = 1;

// Event listeners
renderer.domElement.addEventListener('click', onClick);
renderer.domElement.addEventListener('touchstart', onClick);
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick(event) {
  if (isAnimating) return;

  const mouse = new THREE.Vector2(
    (event.clientX || event.touches[0]?.clientX) / window.innerWidth * 2 - 1,
    -((event.clientY || event.touches[0]?.clientY) / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...obrasNormais, premium].flatMap(g => g.children));

  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    let parent = intersected.parent;
    while (parent && !parent.userData.tipo) {
      parent = parent.parent;
    }
    
    if (parent && parent.userData.obra) {
      showArtworkDetails(parent);
    }
  }
}

function showArtworkDetails(artworkGroup) {
  isAnimating = true;
  document.getElementById('scene').classList.add('blurred');
  animationSpeed = 0.2;

  const artwork = artworkGroup.userData.obra.clone();
  artwork.material = artworkGroup.userData.obra.material.clone();
  artwork.userData.isClone = true;
  scene.add(artwork);

  // Posiciona o clone na posição original
  artwork.position.copy(artworkGroup.position);
  artwork.rotation.copy(artworkGroup.rotation);
  artwork.scale.copy(artworkGroup.userData.obra.scale);

  // Animação para o centro
  gsap.to(artwork.position, {
    x: 0,
    y: 2.2,
    z: 1,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(artwork.rotation, {
    x: 0,
    y: 0,
    z: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.to(artwork.scale, {
    x: 2,
    y: 2,
    duration: 0.8,
    ease: 'power2.out'
  });

  // Configura o modal
  modal.querySelector('#obra-descricao').textContent = 
    `Obra ${artworkGroup.userData.tipo === 'premium' ? 'Premium' : 'Normal'} ${artworkGroup.userData.index !== undefined ? artworkGroup.userData.index + 1 : ''}`;
  
  modal.style.display = 'flex';
  document.getElementById('comprar-obra').onclick = () => {
    alert(`Obra ${artworkGroup.userData.tipo === 'premium' ? 'Premium' : ''} adquirida com sucesso!`);
    closeArtworkDetails(artwork);
  };

  // Fecha automaticamente após 8 segundos
  setTimeout(() => {
    if (isAnimating) {
      closeArtworkDetails(artwork);
    }
  }, 8000);
}

function closeArtworkDetails(artwork) {
  modal.style.display = 'none';
  document.getElementById('scene').classList.remove('blurred');

  gsap.to(artwork.scale, {
    x: 0.6,
    y: 0.6,
    duration: 0.6,
    onComplete: () => {
      scene.remove(artwork);
      isAnimating = false;
      animationSpeed = 1;
    }
  });
}

// Animação principal
function animate() {
  requestAnimationFrame(animate);

  if (!isAnimating) {
    obrasNormais.forEach((q, i) => {
      const angulo = Date.now() * 0.0002 * animationSpeed + (i / obrasNormais.length) * Math.PI * 2;
      q.position.x = Math.cos(angulo) * raio;
      q.position.z = Math.sin(angulo) * raio;
      q.rotation.y = -angulo + Math.PI;
    });
  }

  renderer.render(scene, camera);
}
animate();

// Ocultar ícone de ajuda após 20 segundos
setTimeout(() => {
  const ajuda = document.getElementById('ajudaIcone');
  if (ajuda) ajuda.classList.add('ocultar');
}, 20000);
