import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
//import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/FontLoader.js';
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

// Luz ambiente + spotlight
const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

const spotlight = new THREE.SpotLight(0xffffff, 1.2, 30, Math.PI / 8, 0.2, 1);
spotlight.position.set(0, 8, 6);
spotlight.castShadow = true;
scene.add(spotlight);

// Chão reflexivo
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshPhongMaterial({
  color: 0x050505,
  shininess: 100,
  reflectivity: 0.8
});
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Texto NANdART (versão simplificada sem FontLoader)
const createText = () => {
  // Fallback visual (será usado se a fonte não carregar)
  const createTextFallback = () => {
    const textGeometry = new THREE.PlaneGeometry(3, 0.5);
    const textMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xd4af37,
      side: THREE.DoubleSide
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 5.5, -6.95);
    scene.add(textMesh);
  };

  // Carrega a fonte customizada
  const loader = new FontLoader();
  loader.load(
    '/assets/fonts/helvetiker_regular.typeface.json',
    (font) => {
      const textGeometry = new TextGeometry('NANdART', {
        font: font,
        size: 0.5,
        height: 0.1,
        curveSegments: 12,
        bevelEnabled: false
      });
      
      // Centraliza o texto
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
      
      const textMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xd4af37,
        specular: 0x111111,
        shininess: 30
      });
      
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(-textWidth/2, 5.5, -6.95); // Posição centralizada
      scene.add(textMesh);
    },
    undefined, // Progress callback (opcional)
    (error) => {
      console.error('Erro ao carregar fonte:', error);
      createTextFallback(); // Usa fallback se houver erro
    }
  );
};

// Parede de fundo
const wallGeometry = new THREE.PlaneGeometry(20, 10);
const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
backWall.position.set(0, 5, -7);
scene.add(backWall);

// Paredes laterais
const sideWallGeometry = new THREE.PlaneGeometry(14, 10);
const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
leftWall.position.set(-10, 5, 0);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
rightWall.position.set(10, 5, 0);
rightWall.rotation.y = Math.PI / 2;
scene.add(rightWall);

// Teto
const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshPhongMaterial({ color: 0x0a0a0a }));
ceiling.position.set(0, 10, 0);
ceiling.rotation.x = Math.PI / 2;
scene.add(ceiling);

// Texto NANdART
const createText = () => {
  const loader = new THREE.FontLoader();
  loader.load('https://cdn.jsdelivr.net/npm/three@0.152.2/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    const textGeometry = new THREE.TextGeometry('NANdART', {
      font: font,
      size: 0.5,
      height: 0.1,
    });
    const textMaterial = new THREE.MeshPhongMaterial({ color: 0xd4af37 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(-1.5, 5.5, -6.95);
    scene.add(textMesh);
  });
};
createText();

// Lista de obras normais
const obrasNormais = [];
const raio = 3.5;

// Criar quadros suspensos em círculo
obraPaths.forEach((src, i) => {
  // Moldura
  const molduraGeo = new THREE.BoxGeometry(0.65, 0.65, 0.05);
  const molduraMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
  const moldura = new THREE.Mesh(molduraGeo, molduraMat);
  
  // Obra
  const tex = new THREE.TextureLoader().load(src);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const geo = new THREE.PlaneGeometry(0.6, 0.6);
  const quadro = new THREE.Mesh(geo, mat);
  quadro.position.z = 0.03; // Coloca a frente da moldura
  
  // Grupo para moldura + obra
  const grupoQuadro = new THREE.Group();
  grupoQuadro.add(moldura);
  grupoQuadro.add(quadro);
  
  const angulo = (i / obraPaths.length) * Math.PI * 2;
  grupoQuadro.position.set(Math.cos(angulo) * raio, 1.8, Math.sin(angulo) * raio);
  grupoQuadro.rotation.y = -angulo + Math.PI;
  grupoQuadro.userData = { tipo: 'normal', obra: quadro };
  
  scene.add(grupoQuadro);
  obrasNormais.push(grupoQuadro);
});

// Obra premium
const createPremiumObra = () => {
  // Moldura premium
  const molduraGeo = new THREE.BoxGeometry(0.75, 0.75, 0.05);
  const molduraMat = new THREE.MeshPhongMaterial({ color: 0xd4af37 });
  const moldura = new THREE.Mesh(molduraGeo, molduraMat);
  
  // Obra premium
  const texPremium = new THREE.TextureLoader().load('./assets/premium/premium1.jpg');
  const matPremium = new THREE.MeshBasicMaterial({ map: texPremium });
  const geoPremium = new THREE.PlaneGeometry(0.7, 0.7);
  const premium = new THREE.Mesh(geoPremium, matPremium);
  premium.position.z = 0.03;
  
  // Estrela premium
  const starTex = new THREE.TextureLoader().load('./assets/icons/estrela-premium.png');
  const starMat = new THREE.MeshBasicMaterial({ 
    map: starTex, 
    transparent: true,
    opacity: 0.9
  });
  const starGeo = new THREE.PlaneGeometry(0.15, 0.15);
  const star = new THREE.Mesh(starGeo, starMat);
  star.position.set(0.25, 0.25, 0.04);
  
  // Grupo premium
  const grupoPremium = new THREE.Group();
  grupoPremium.add(moldura);
  grupoPremium.add(premium);
  grupoPremium.add(star);
  grupoPremium.position.set(0, 3.2, 0);
  grupoPremium.userData = { tipo: 'premium', obra: premium };
  
  scene.add(grupoPremium);
  return grupoPremium;
};

const premium = createPremiumObra();

// Modal HTML
const modal = document.createElement('div');
modal.className = 'obra-modal';
modal.innerHTML = `
  <h3 style="color: #d4af37; margin-bottom: 10px;">Detalhes da Obra</h3>
  <p style="color: white; text-align: center;">Obra selecionada</p>
  <button id="comprar-obra">Adquirir Obra</button>
`;
document.body.appendChild(modal);

// Variável para controlar a animação
let isAnimating = false;
let animationSpeed = 1;

// Responsividade
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animação contínua
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

// Interatividade
renderer.domElement.addEventListener('click', onClick);
renderer.domElement.addEventListener('touchstart', onClick);

function onClick(event) {
  const mouse = new THREE.Vector2(
    (event.clientX || event.touches[0]?.clientX) / window.innerWidth * 2 - 1,
    -((event.clientY || event.touches[0]?.clientY) / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const allObjects = [...obrasNormais, premium];
  const intersects = raycaster.intersectObjects(allObjects.flatMap(obj => obj.children));

  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    // Encontrar o grupo pai (moldura + obra)
    let parent = intersected.parent;
    while (parent && !parent.userData.tipo) {
      parent = parent.parent;
    }
    
    if (parent && parent.userData.obra) {
      destacarObra(parent);
    }
  }
}

// Função para destacar obra
function destacarObra(obraGroup) {
  if (isAnimating) return;
  isAnimating = true;
  
  // Aplicar desfoque
  document.getElementById('scene').classList.add('blurred');
  
  // Desacelerar ambiente
  animationSpeed = 0.2;
  
  // Clonar apenas a obra (não a moldura)
  const obra = obraGroup.userData.obra;
  const clone = obra.clone();
  clone.material = obra.material.clone();
  scene.add(clone);
  
  // Posicionar clone na posição original
  clone.position.copy(obraGroup.position);
  clone.rotation.copy(obraGroup.rotation);
  clone.scale.copy(obra.scale);
  
  // Calcular rotação para ficar de frente para a câmera
  const targetRotation = new THREE.Quaternion();
  targetRotation.setFromRotationMatrix(
    new THREE.Matrix4().lookAt(clone.position, camera.position, new THREE.Vector3(0, 1, 0))
  );
  
  // Animação para o centro
  gsap.to(clone.position, { 
    x: 0, 
    y: 2.2, 
    z: 1, 
    duration: 0.8, 
    ease: 'power2.out' 
  });
  
  gsap.to(clone.rotation, { 
    x: 0,
    y: 0,
    z: 0,
    duration: 0.8,
    ease: 'power2.out'
  });
  
  gsap.to(clone.scale, { 
    x: 2, 
    y: 2, 
    duration: 0.8, 
    ease: 'power2.out' 
  });
  
  // Escurecer fundo
  gsap.to(scene.background, { r: 0.05, g: 0.05, b: 0.05, duration: 0.5 });
  
  // Mostrar modal
  setTimeout(() => {
    modal.style.display = 'flex';
    
    // Configurar botão de compra
    document.getElementById('comprar-obra').onclick = () => {
      alert(`Obra ${obraGroup.userData.tipo === 'premium' ? 'Premium' : 'Normal'} adquirida com sucesso!`);
      fecharModal();
    };
  }, 800);
  
  // Recolher após 8 segundos se não interagir
  setTimeout(() => {
    if (isAnimating) {
      fecharModal();
    }
  }, 8000);
}

function fecharModal() {
  if (!isAnimating) return;
  
  modal.style.display = 'none';
  document.getElementById('scene').classList.remove('blurred');
  
  // Encontrar o clone da obra
  const clones = scene.children.filter(obj => obj !== premium && obj.userData && obj.userData.isClone);
  
  clones.forEach(clone => {
    gsap.to(clone.scale, { 
      x: 0.6, 
      y: 0.6, 
      duration: 0.6,
      onComplete: () => scene.remove(clone)
    });
    
    gsap.to(scene.background, { 
      r: 0.07, 
      g: 0.07, 
      b: 0.07, 
      duration: 0.6 
    });
  });
  
  // Restaurar velocidade normal
  setTimeout(() => {
    animationSpeed = 1;
    isAnimating = false;
  }, 1000);
}

// Ocultar ícone de ajuda após 20 segundos
setTimeout(() => {
  const ajuda = document.getElementById('ajudaIcone');
  if (ajuda) ajuda.classList.add('ocultar');
}, 20000);
