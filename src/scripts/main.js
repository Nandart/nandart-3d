import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import gsap from 'gsap';

// Configurações responsivas
const isMobile = window.innerWidth < 768;
const obraSize = isMobile ? 0.3 : 0.6;
const premiumSize = isMobile ? 0.4 : 0.7;
const circleRadius = isMobile ? 2.5 : 3.5;

const obraPaths = [
  "./assets/obras/obra1.jpg",
  "./assets/obras/obra2.jpg",
  "./assets/obras/obra3.jpg",
  "./assets/obras/obra4.jpg",
  "./assets/obras/obra5.jpg",
  "./assets/obras/obra6.jpg"
];

// Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Câmera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 8);

// Renderizador
const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById('scene'), 
  antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Iluminação
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const spotlight = new THREE.SpotLight(0xffffff, 1.2, 30, Math.PI / 8, 0.2, 1);
spotlight.position.set(0, 8, 6);
spotlight.castShadow = true;
scene.add(spotlight);

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

// Teto com iluminação embutida
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshPhongMaterial({ 
    color: 0x0a0a0a,
    emissive: 0x050505,
    shininess: 50
  })
);
ceiling.position.set(0, 10, 0);
ceiling.rotation.x = Math.PI / 2;
scene.add(ceiling);

// Texto NANdART na parede de fundo
const createGalleryTitle = () => {
  const loader = new FontLoader();
  loader.load(
    'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/fonts/helvetiker_regular.typeface.json',
    (font) => {
      const textGeometry = new TextGeometry('NANdART', {
        font: font,
        size: 0.5,
        height: 0.05,
      });
      
      const textMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xd4af37,
        emissive: 0x222222,
        specular: 0x111111
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
      textMesh.position.set(-textWidth/2, 6.5, -6.98);
      scene.add(textMesh);
    },
    undefined,
    (error) => {
      console.error('Erro ao carregar fonte:', error);
      const textPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xd4af37 })
      );
      textPlane.position.set(0, 6.5, -6.97);
      scene.add(textPlane);
    }
  );
};
createGalleryTitle();

// Sistema de obras
const obrasNormais = [];

// Criar obras normais em círculo reduzido
obraPaths.forEach((src, i) => {
  const angulo = (i / obraPaths.length) * Math.PI * 2;
  
  // Moldura elegante
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(obraSize + 0.05, obraSize + 0.05, 0.05),
    new THREE.MeshPhongMaterial({ 
      color: 0x333333,
      specular: 0x111111
    })
  );
  
  // Obra de arte
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
    isMobile ? 1.2 : 1.5,
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

// Obra premium com flutuação e aura
const createPremiumArtwork = () => {
  // Moldura dourada premium
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(premiumSize + 0.1, premiumSize + 0.1, 0.08),
    new THREE.MeshPhongMaterial({ 
      color: 0xd4af37,
      specular: 0xffffff,
      shininess: 100
    })
  );
  
  // Obra premium
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(premiumSize, premiumSize),
    new THREE.MeshBasicMaterial({ 
      map: new THREE.TextureLoader().load('./assets/premium/premium1.jpg')
    })
  );
  obra.position.z = 0.05;
  
  // Estrela premium na moldura
  const star = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.15),
    new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('./assets/icons/estrela-premium.png'),
      transparent: true
    })
  );
  star.position.set(0.3, 0.3, 0.09);
  
  // Aura luminosa
  const aura = new THREE.PointLight(0xfff7d6, 0.5, 1.5);
  aura.position.set(0, 0, 0.1);
  
  const grupo = new THREE.Group();
  grupo.add(moldura);
  grupo.add(obra);
  grupo.add(star);
  grupo.add(aura);
  grupo.position.set(0, 3.2, 0);
  
  // Animação de flutuação
  let floatTime = 0;
  const animateFloat = () => {
    floatTime += 0.01;
    grupo.position.y = 3.2 + Math.sin(floatTime * 0.5) * 0.05;
    requestAnimationFrame(animateFloat);
  };
  animateFloat();
  
  scene.add(grupo);
  return grupo;
};
const premium = createPremiumArtwork();

// Modal
const modal = document.createElement('div');
modal.className = 'obra-modal';
modal.innerHTML = `
  <h3>Detalhes da Obra</h3>
  <p id="obra-descricao"></p>
  <button id="comprar-obra">Adquirir Obra</button>
`;
document.body.appendChild(modal);

// Interação
let isAnimating = false;
let animationSpeed = 1;

renderer.domElement.addEventListener('click', onClick);
renderer.domElement.addEventListener('touchstart', onClick);

function onClick(event) {
  if (isAnimating) return;

  const mouse = new THREE.Vector2(
    (event.clientX || event.touches[0].clientX) / window.innerWidth * 2 - 1,
    -((event.clientY || event.touches[0].clientY) / window.innerHeight) * 2 + 1
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

  // Animação para o centro
  gsap.to(artwork.position, { x: 0, y: 2.2, z: 1, duration: 0.8, ease: 'power2.out' });
  gsap.to(artwork.rotation, { x: 0, y: 0, z: 0, duration: 0.8, ease: 'power2.out' });
  gsap.to(artwork.scale, { x: 2, y: 2, duration: 0.8, ease: 'power2.out' });

  // Configurar modal
  modal.querySelector('#obra-descricao').textContent = 
    `Obra ${artworkGroup.userData.tipo === 'premium' ? 'Premium' : 'Normal'} ${artworkGroup.userData.index + 1 || ''}`;
  modal.style.display = 'flex';

  document.getElementById('comprar-obra').onclick = () => {
    alert(`Obra ${artworkGroup.userData.tipo === 'premium' ? 'Premium' : ''} adquirida com sucesso!`);
    closeArtworkDetails(artwork);
  };

  setTimeout(() => {
    if (isAnimating) closeArtworkDetails(artwork);
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
  const isNowMobile = window.innerWidth < 768;
  if (isMobile !== isNowMobile) {
    window.location.reload();
  }
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Ocultar ícone de ajuda
setTimeout(() => {
  const ajuda = document.getElementById('ajudaIcone');
  if (ajuda) ajuda.classList.add('ocultar');
}, 20000);
