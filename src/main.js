import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 0.45, circleRadius: 2.4, wallDistance: 8, cameraZ: 13, cameraY: 5.5, textSize: 0.4 },
  SM: { obraSize: 0.5, circleRadius: 2.6, wallDistance: 9, cameraZ: 13, cameraY: 5.5, textSize: 0.45 },
  MD: { obraSize: 0.55, circleRadius: 3.1, wallDistance: 10, cameraZ: 13, cameraY: 5.5, textSize: 0.5 },
  LG: { obraSize: 0.6, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 13, cameraY: 5.5, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
updateCamera();

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY + 0.3, config.cameraZ - 0.2); // ligeiro recuo e elevação
  camera.lookAt(0, 6.4, 0); // olhar ligeiramente acima
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.85;

scene.add(new THREE.AmbientLight(0xfff7e6, 1.7));

// Luz ambiente mais ampla para iluminar a sala de forma elegante
const luzAmbienteSuave = new THREE.HemisphereLight(0xfff4e5, 0x080808, 0.7);
scene.add(luzAmbienteSuave);

// Luzes de teto adicionais para reforçar o ambiente
const spotsTeto = [ -6, 0, 6 ];
spotsTeto.forEach(x => {
  const foco = new THREE.SpotLight(0xfff7e0, 1.4, 18, Math.PI / 6, 0.4);
  foco.position.set(x, 13, -config.wallDistance + 1);
  foco.target.position.set(x, 6, -config.wallDistance + 1);
  foco.castShadow = true;
  foco.shadow.mapSize.set(1024, 1024);
  scene.add(foco);
  scene.add(foco.target);
});

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshPhysicalMaterial({
    color: 0x060606, // ligeiramente mais escuro
    roughness: 0.015,
    metalness: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.005,
    reflectivity: 1,
    transmission: 0.05,
    ior: 1.52,
    thickness: 0.3,
    envMapIntensity: 1.2,
    sheen: 1,
    sheenColor: new THREE.Color(0x222222),
    sheenRoughness: 0.1
  })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Luz rasante para valorizar o reflexo no chão
const luzRasante = new THREE.SpotLight(0xfff8e0, 1.3, 20, Math.PI / 7, 0.5);
luzRasante.position.set(0, 4.5, 4);
luzRasante.target.position.set(0, 0, 0);
scene.add(luzRasante);
scene.add(luzRasante.target);

// Reflexo subtil animado na intensidade
gsap.to(luzRasante, {
  intensity: 1.6,
  duration: 3,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// Novo círculo de luz no chão: mais fino, elegante e radiante
const circle = new THREE.Mesh(
  new THREE.RingGeometry(2.2, 2.4, 64),
  new THREE.MeshStandardMaterial({
    color: 0xfbf2da,
    emissive: 0xffeec8,
    emissiveIntensity: 2.4,
    metalness: 0.85,
    roughness: 0.15,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.035;
scene.add(circle);

const textureLoader = new THREE.TextureLoader();
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0xc4b582,
  metalness: 1,
  roughness: 0.2,
  emissive: 0x222211,
  emissiveIntensity: 0.4
});

function criarFriso(x, y, z, largura, altura, rotY = 0, depth = 0.05) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, depth),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = true;
  scene.add(friso);
  return friso;
}

// Frisos frontais e laterais
criarFriso(0, 13.5, -config.wallDistance + 0.01, 12, 0.15);
criarFriso(0, 2.5, -config.wallDistance + 0.01, 12, 0.15);
criarFriso(-6, 8, -config.wallDistance + 0.01, 0.15, 11);
criarFriso(6, 8, -config.wallDistance + 0.01, 0.15, 11);
criarFriso(0, 8, -config.wallDistance + 0.005, 10, 10, 0, 0.02);

criarFriso(-10, 13.5, -config.wallDistance / 2, 0.15, 11, Math.PI / 2); // vertical esquerda cima
criarFriso(10, 13.5, -config.wallDistance / 2, 0.15, 11, Math.PI / 2);  // vertical direita cima
criarFriso(-10, 2.5, -config.wallDistance / 2, 0.15, 11, Math.PI / 2);  // vertical esquerda baixo
criarFriso(10, 2.5, -config.wallDistance / 2, 0.15, 11, Math.PI / 2);   // vertical direita baixo
criarFriso(-10, 8, -config.wallDistance / 2, 12, 0.12, Math.PI / 2);    // horizontal lateral esquerda
criarFriso(10, 8, -config.wallDistance / 2, 12, 0.12, Math.PI / 2);     // horizontal lateral direita

// Adição de obras nas paredes laterais
const obrasParede = [
  { src: '/assets/obras/obra-lateral-esquerda.jpg', x: -9.9, y: 5.5, z: -2, rotY: Math.PI / 2 },
  { src: '/assets/obras/obra-lateral-direita.jpg', x: 9.9, y: 5.5, z: 2, rotY: -Math.PI / 2 }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const texture = textureLoader.load(src);
  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 3),
    new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide })
  );
  quadro.position.set(x, y, z);
  quadro.rotation.y = rotY;
  quadro.castShadow = true;
  scene.add(quadro);
});

// Restante código (vitrines, obras suspensas, texto, paredes, etc.) permanece abaixo desta linha...

// [continua com o restante já implementado como animate, resize, obras suspensas, etc.]


// Criar vitrines com gemas nos pedestais
function criarVitrine(x, z) {
  // Base elevada do pedestal
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1.2, 1),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 })
  );
  base.position.set(x, 0.6, z);
  base.castShadow = true;
  scene.add(base);

  // Vitrine em vidro mais alta e mais elegante
  const vidro = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 1.25, 0.85),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 1,
      roughness: 0.03,
      thickness: 0.5,
      transparent: true,
      ior: 1.52,
      metalness: 0.1
    })
  );
  vidro.position.set(x, 1.9, z);
  vidro.castShadow = true;
  scene.add(vidro);

  // Gema suspensa realista (formato ovalado, como no layout)
  const gema = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x3366ff,
      emissiveIntensity: 0.9,
      reflectivity: 1
    })
  );
  gema.position.set(x, 1.9, z);
  gema.castShadow = true;
  scene.add(gema);

  // Luz interna azul difusa
  const luz = new THREE.PointLight(0x88bbff, 3, 4);
  luz.position.set(x, 1.9, z);
  scene.add(luz);

  gsap.to(luz, {
    intensity: 4,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
  gsap.to(gema.material, {
    emissiveIntensity: 1.2,
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

// Quadro decorativo central (sem luz, com nova altura e moldura refinada)
const quadroDecorativoFundo = new THREE.Group();

const larguraQuadro = 2;
const alturaQuadro = 2.5;

const molduraCentral = new THREE.Mesh(
  new THREE.BoxGeometry(larguraQuadro + 0.25, alturaQuadro + 0.25, 0.2),
  new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.6,
    roughness: 0.4
  })
);
quadroDecorativoFundo.add(molduraCentral);

const pinturaCentral = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: textureLoader.load('/assets/obras/obra-central.jpg'),
    roughness: 0.2,
    metalness: 0.05
  })
);
pinturaCentral.position.z = 0.11;
quadroDecorativoFundo.add(pinturaCentral);

const frisoCentral = new THREE.Mesh(
  new THREE.BoxGeometry(larguraQuadro + 0.3, alturaQuadro + 0.3, 0.01),
  new THREE.MeshStandardMaterial({
    color: 0xc4b582,
    metalness: 1,
    roughness: 0.15,
    emissive: 0x221f1f,
    emissiveIntensity: 0.25
  })
);
frisoCentral.position.z = 0.105;
quadroDecorativoFundo.add(frisoCentral);

// Nova altura centralizada do quadro
quadroDecorativoFundo.position.set(0, 6.5, -config.wallDistance + 0.01);
scene.add(quadroDecorativoFundo);

// Obras suspensas (sem molduras)
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

obraPaths.forEach((src, i) => {
  const texture = textureLoader.load(src);
  const ang = (i / obraPaths.length) * Math.PI * 2;
  const x = Math.cos(ang) * config.circleRadius;
  const z = Math.sin(ang) * config.circleRadius;
  const ry = -ang + Math.PI;

  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide
    })
  );
  obra.position.set(x, 4.2, z);
  obra.rotation.y = ry;
  obra.castShadow = true;
  scene.add(obra);

  // Reflexo da obra
  const reflexo = obra.clone();
  reflexo.position.y = -0.01;
  reflexo.scale.y = -1;
  reflexo.material = obra.material.clone();
 reflexo.material.opacity = 0.18;
  reflexo.material.transparent = true;
  reflexo.material.depthWrite = false;
  reflexo.material.roughness = 0.5;
  reflexo.material.metalness = 0.6;
  reflexo.renderOrder = 1;
  scene.add(reflexo);

  obra.userData.reflexo = reflexo;
  reflexo.userData.targetPos = new THREE.Vector3();
  reflexo.userData.targetRot = new THREE.Euler();

  obrasNormais.push(obra);
});

// Texto NANdART sobre friso
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

  const texto = new THREE.Mesh(
    textGeo,
    new THREE.MeshPhongMaterial({
      color: 0xc4b582,
      emissive: 0x222211,
      shininess: 100
    })
  );
  texto.position.set(-largura / 2, 13.65, -config.wallDistance + 0.015);
  texto.castShadow = true;
  scene.add(texto);

  const luzTexto = new THREE.SpotLight(0xfff2cc, 1.5, 10, Math.PI / 8, 0.5);
  luzTexto.position.set(0, 12, -config.wallDistance + 2);
  luzTexto.target = texto;
  scene.add(luzTexto);
  scene.add(luzTexto.target);
});

// Paredes com textura e realce
const paredeMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.9,
  metalness: 0.1
});
const paredeGeo = new THREE.PlaneGeometry(20, 20);

const backWall = new THREE.Mesh(paredeGeo, paredeMaterial);
backWall.position.set(0, 10, -config.wallDistance);
scene.add(backWall);

const leftWall = new THREE.Mesh(paredeGeo, paredeMaterial);
leftWall.position.set(-10, 10, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

const rightWall = new THREE.Mesh(paredeGeo, paredeMaterial);
rightWall.position.set(10, 10, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

// Atualização de dimensão ao redimensionar a janela
window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animação contínua com rotação de obras
function animate() {
  requestAnimationFrame(animate);

  const tempo = Date.now() * -0.00012;
  obrasNormais.forEach((obra, i) => {
    const ang = tempo + (i / obrasNormais.length) * Math.PI * 2;
    const x = Math.cos(ang) * config.circleRadius;
    const z = Math.sin(ang) * config.circleRadius;
    const ry = -ang + Math.PI;

    obra.position.x = x;
    obra.position.z = z;
    obra.rotation.y = ry;

    const reflexo = obra.userData.reflexo;
    if (reflexo) {
      reflexo.userData.targetPos.set(x, -0.01, z);
      reflexo.userData.targetRot.set(0, ry, 0);
      reflexo.position.lerp(reflexo.userData.targetPos, 0.1);
      reflexo.rotation.y += (ry - reflexo.rotation.y) * 0.1;
    }
  });
  
  renderer.render(scene, camera);
}

animate();
