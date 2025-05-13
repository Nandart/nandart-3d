o ficheiro que forneceste não está completo conforme o main.js que te mandei, removeste as obras nas paredes laterais, não quero que mexas nas vitrines, sobrecarregaste o site, e este está a travar aplique uma iluminação digna de uma galeria, e torne o chão um pouco mais transparente de resto não mecha em mais nada: import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js'; // 
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// ✅ Declarar o loader de texturas UMA vez no início
const textureLoader = new THREE.TextureLoader();

// 🔧 Configuração base
const config = {
  wallDistance: 14.5,
  circleRadius: 6.5,
  obraSize: 2.1
};

// 🎥 Câmara com profundidade total da galeria
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 10.5, 24); // mais distante e ligeiramente elevada
camera.lookAt(0, 7.2, 0); // focada no centro vertical das obras suspensas e espaço

// 🎨 Cena e fundo
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// 🖥️ Renderer com qualidade cinematográfica
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.3;

// 🔄 Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
// 🎨 Cena já definida acima
scene.background = new THREE.Color(0x111111);

// 🧱 Paredes realistas com textura antracite
const texturaParede = textureLoader.load('/assets/texturas/parede-antracite.jpg');

const paredeMaterial = new THREE.MeshStandardMaterial({
  map: texturaParede,
  roughness: 0.9,
  metalness: 0.1,
  side: THREE.FrontSide
});

// Parede de fundo
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), paredeMaterial);
backWall.position.set(0, 13, -config.wallDistance - 4.05);
backWall.receiveShadow = true;
scene.add(backWall);

// 🧱 Paredes laterais com textura antracite e realismo espacial
const paredeLateralGeo = new THREE.PlaneGeometry(30, 28); // ligeiramente mais altas que o fundo

const leftWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
leftWall.position.set(-16.2, 13, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
rightWall.position.set(16.2, 13, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
scene.add(rightWall);

// 🔶 Frisos dourados realistas
function criarFrisoEmbutido(x, y, z, largura, altura, rotY = 0, depth = 0.03) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, depth),
    new THREE.MeshPhysicalMaterial({
      color: 0xd1b072,
      metalness: 1,
      roughness: 0.08,
      clearcoat: 0.95,
      clearcoatRoughness: 0.05,
      emissive: 0x3a2a0a,
      emissiveIntensity: 0.25,
      reflectivity: 0.6
    })
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = true;
  scene.add(friso);
  return friso;
}

// Moldura central (parede de fundo)
criarFrisoEmbutido(0, 14.2, -config.wallDistance + 0.03, 10, 0.1); // topo
criarFrisoEmbutido(0, 2.2, -config.wallDistance + 0.03, 10, 0.1); // base
criarFrisoEmbutido(-5.1, 8.2, -config.wallDistance + 0.03, 0.1, 12); // lateral esquerda
criarFrisoEmbutido(5.1, 8.2, -config.wallDistance + 0.03, 0.1, 12); // lateral direita

// Moldura exterior (mais larga)
criarFrisoEmbutido(0, 16.6, -config.wallDistance + 0.025, 18, 0.08);
criarFrisoEmbutido(0, 0.5, -config.wallDistance + 0.025, 18, 0.08);
criarFrisoEmbutido(-9.1, 8.5, -config.wallDistance + 0.025, 0.08, 16);
criarFrisoEmbutido(9.1, 8.5, -config.wallDistance + 0.025, 0.08, 16);

// Rodapés e teto laterais
const offsetZ = config.wallDistance / 2;
criarFrisoEmbutido(0, 0.3, -offsetZ, 36, 0.06); // rodapé
criarFrisoEmbutido(0, 19.8, -offsetZ, 36, 0.06); // teto

// ✨ Luz ambiente radial suave e refinada
const luzAmbienteCentral = new THREE.PointLight(0xfff2dd, 0.6, 50, 2);
luzAmbienteCentral.position.set(0, 9.5, 0);
scene.add(luzAmbienteCentral);

// ✨ Luz hemisférica quente para reforço geral do ambiente
const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.5);
scene.add(luzHemisferica);

// ✨ Luzes rasantes laterais muito suaves para dar volume às paredes
const luzRasanteEsquerda = new THREE.SpotLight(0xfff0db, 0.35, 18, Math.PI / 5, 0.5);
luzRasanteEsquerda.position.set(-12, 5.5, 0);
luzRasanteEsquerda.target.position.set(-12, 5.5, -10);
scene.add(luzRasanteEsquerda, luzRasanteEsquerda.target);

const luzRasanteDireita = new THREE.SpotLight(0xfff0db, 0.35, 18, Math.PI / 5, 0.5);
luzRasanteDireita.position.set(12, 5.5, 0);
luzRasanteDireita.target.position.set(12, 5.5, -10);
scene.add(luzRasanteDireita, luzRasanteDireita.target);

// ✨ Chão com reflexo profundo e textura realista tipo obsidiana líquida

const floorGeometry = new THREE.PlaneGeometry(40, 40);

const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x0a0a0a,
  recursion: 2
});

floor.material.opacity = 0.82;
floor.material.roughness = 0.03;
floor.material.metalness = 0.95;
floor.material.transparent = true;
floor.material.envMapIntensity = 1.2;
floor.material.reflectivity = 0.92;

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Luz rasante para valorizar o reflexo no chão
const luzRasante = new THREE.SpotLight(0xfff8e0, 1.3, 20, Math.PI / 7, 0.5);
luzRasante.position.set(0, 4.5, 4);
luzRasante.target.position.set(0, 0, 0);
scene.add(luzRasante);
scene.add(luzRasante.target);
// Luz de fundo para iluminar a parede traseira
const luzFundoSuave = new THREE.PointLight(0xffeedd, 1.2, 30);
luzFundoSuave.position.set(0, 5, -config.wallDistance - 4);
scene.add(luzFundoSuave);
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
  new THREE.RingGeometry(2.6, 2.75, 100),
  new THREE.MeshStandardMaterial({
    color: 0xfdf6dc,
    emissive: 0xffefc6,
    emissiveIntensity: 3.5,
    metalness: 0.7,
    roughness: 0.15,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.052;
circle.receiveShadow = true;
scene.add(circle);

const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

const materialDouradoPedestal = new THREE.MeshPhysicalMaterial({
  color: 0xd9b96c,
  metalness: 1,
  roughness: 0.1,
  clearcoat: 0.9,
  clearcoatRoughness: 0.1,
  emissive: 0x4a320a,
  emissiveIntensity: 0.2,
  reflectivity: 0.5
});

// Criar vitrines inspiradas no layout com gemas facetadas
function criarVitrine(x, z, indice) {
  // Altura variável para dar vida visual
  const alturaGema = 3.3 + (indice % 2 === 0 ? 0.08 : -0.06);
  const emissivaBase = indice % 2 === 0 ? 0x3366aa : 0x3377cc;

  // Pedestal
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 2.8, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.6,
      metalness: 0.15
    })
  );
  pedestal.position.set(x, 1.4, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  // Tampa dourada
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.06, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, 2.85, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  // Vitrine de vidro
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 1.1, 0.88),
    new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.3,
      transparent: true,
      opacity: 0.12,
      ior: 1.45,
      reflectivity: 0.6,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05
    })
  );
  vitrine.position.set(x, 3.4, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  // Gema ligeiramente diferente em rotação, altura e cor emissiva
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.33, 1),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      emissive: emissivaBase,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.95
    })
  );
  gema.position.set(x, alturaGema, z);
  gema.rotation.y = indice * 0.4;
  gema.castShadow = true;
  scene.add(gema);
}

// Criar as quatro vitrines conforme layout
criarVitrine(-9.5, -1.8, 0);
criarVitrine(-9.5, 1.8, 1);
criarVitrine(9.5, -1.8, 2);
criarVitrine(9.5, 1.8, 3);

// ✨ Iluminação cenográfica dedicada às gemas
const luzGemas = new THREE.SpotLight(0xcedfff, 1.7, 8, Math.PI / 7, 0.4);
luzGemas.position.set(0, 5.8, 0);
luzGemas.target.position.set(0, 3.4, 0);
scene.add(luzGemas, luzGemas.target);

// Brilho animado subtil para dar vida às gemas
gsap.to(luzGemas, {
  intensity: 2,
  duration: 4,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// 🟨 Luzes refinadas para destacar os frisos com contorno

// Luz superior frontal – friso central da parede de fundo
const luzFrisosTopo = new THREE.SpotLight(0xffeac2, 1.15, 9, Math.PI / 10, 0.5);
luzFrisosTopo.position.set(0, 13.2, -config.wallDistance + 2);
luzFrisosTopo.target.position.set(0, 10, -config.wallDistance + 0.01);
scene.add(luzFrisosTopo, luzFrisosTopo.target);

// Luz inferior frontal – base da parede de fundo
const luzFrisosBase = new THREE.SpotLight(0xffeac2, 0.9, 7, Math.PI / 12, 0.4);
luzFrisosBase.position.set(0, 3.2, -config.wallDistance + 2);
luzFrisosBase.target.position.set(0, 6, -config.wallDistance + 0.01);
scene.add(luzFrisosBase, luzFrisosBase.target);

// Luz lateral esquerda – frisos verticais e horizontais
const luzFrisoEsquerdo = new THREE.SpotLight(0xffeac2, 1.2, 9, Math.PI / 10, 0.45);
luzFrisoEsquerdo.position.set(-13, 10, -config.wallDistance / 2 + 1);
luzFrisoEsquerdo.target.position.set(-13, 8, -config.wallDistance / 2);
scene.add(luzFrisoEsquerdo, luzFrisoEsquerdo.target);

// Luz lateral direita – frisos verticais e horizontais
const luzFrisoDireito = new THREE.SpotLight(0xffeac2, 1.2, 9, Math.PI / 10, 0.45);
luzFrisoDireito.position.set(13, 10, -config.wallDistance / 2 + 1);
luzFrisoDireito.target.position.set(13, 8, -config.wallDistance / 2);
scene.add(luzFrisoDireito, luzFrisoDireito.target);

// Brilho animado muito subtil para sensação de vida
gsap.to(luzFrisosTopo, {
  intensity: 1.3,
  duration: 5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});


const frisosParaIluminar = [
  [-6, 8, -config.wallDistance + 1],  // lateral esquerda
  [6, 8, -config.wallDistance + 1],   // lateral direita
  [0, 13.6, -config.wallDistance + 1], // friso superior
  [0, 2.5, -config.wallDistance + 1],  // friso inferior
];

frisosParaIluminar.forEach(([x, y, z]) => {
  const luzFriso = new THREE.SpotLight(0xfff0c0, 1.5, 6, Math.PI / 9, 0.6);
  luzFriso.position.set(x, y + 1.5, z + 1.2);
  luzFriso.target.position.set(x, y, z);
  scene.add(luzFriso);
  scene.add(luzFriso.target);
});

// 🖼️ Quadros laterais perfeitamente embutidos nas paredes
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -15.48, y: 6.1, z: -config.wallDistance / 2,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 15.48, y: 6.1, z: -config.wallDistance / 2,
    rotY: -Math.PI / 2
  }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(src);

  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 3.2),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.FrontSide
    })
  );

  quadro.position.set(x, y, z + 0.001); // ligeiro destaque da parede
  quadro.rotation.y = rotY;
  quadro.receiveShadow = true;
  scene.add(quadro);
});

// Criar vitrines com gemas visíveis e iluminação interna
function criarVitrineComGema(x, z, indice) {
  const alturaPedestal = 2.9;
  const alturaVitrine = 1.25;
  const alturaTotal = alturaPedestal + alturaVitrine;

  // Pedestal escuro
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1, alturaPedestal, 1),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.7,
      metalness: 0.1
    })
  );
  pedestal.position.set(x, alturaPedestal / 2, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  // Tampa dourada elegante
  const tampa = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.06, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0xd9b96c,
      metalness: 1,
      roughness: 0.1,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
      emissive: 0x3a2a0a,
      emissiveIntensity: 0.2
    })
  );
  tampa.position.set(x, alturaTotal, z);
  tampa.castShadow = true;
  scene.add(tampa);

  // Vitrine de vidro com transparência realista
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, alturaVitrine, 0.95),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.05,
      transmission: 1,
      opacity: 0.15,
      transparent: true,
      ior: 1.45,
      reflectivity: 0.6,
      clearcoat: 0.8
    })
  );
  vitrine.position.set(x, alturaPedestal + alturaVitrine / 2, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  // Gema facetada animada
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.33, 1),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      emissive: 0x224477,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.95
    })
  );
  gema.position.set(x, alturaPedestal + 0.6, z);
  gema.rotation.y = indice * 0.6;
  gema.castShadow = true;
  scene.add(gema);

  // Iluminação interna subtil
  const luzGema = new THREE.PointLight(0x88ccff, 1.2, 4);
  luzGema.position.set(x, alturaPedestal + 0.8, z);
  scene.add(luzGema);
}

// Quatro vitrines nas posições originais
criarVitrineComGema(-9.5, -1.8, 0);
criarVitrineComGema(-9.5, 1.8, 1);
criarVitrineComGema(9.5, -1.8, 2);
criarVitrineComGema(9.5, 1.8, 3);

// 🖼️ Obras suspensas (sem moldura), em rotação circular contínua

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

  // Reflexo invertido no chão
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

// ✨ Texto "NANdART" com presença refinada no topo da parede de fundo

const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    const textGeo = new TextGeometry('NANdART', {
      font,
      size: 0.65,
      height: 0.12,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 5
    });

    textGeo.computeBoundingBox();
    const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

    const texto = new THREE.Mesh(
      textGeo,
      new THREE.MeshStandardMaterial({
        color: 0xc4b582,
        metalness: 0.9,
        roughness: 0.3,
        emissive: 0x302a19,
        emissiveIntensity: 0.4
      })
    );

    texto.position.set(-largura / 2, 16.5, -config.wallDistance - 3.985);
    texto.castShadow = true;
    scene.add(texto);

    // Luz discreta para realçar o texto
    const luzTexto = new THREE.SpotLight(0xfff1cc, 1.4, 12, Math.PI / 9, 0.5);
    luzTexto.position.set(0, 18, -config.wallDistance - 2);
    luzTexto.target = texto;
    scene.add(luzTexto);
    scene.add(luzTexto.target);
  }
);

// 🖼️ Quadro central com friso circular dourado embutido
const quadroDecorativoFundo = new THREE.Group();

const larguraQuadro = 3.6;
const alturaQuadro = 4.5;

// Imagem da obra central
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro ao carregar obra-central.jpg:', err)
);

const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.1
  })
);
pintura.position.z = 0.01;
quadroDecorativoFundo.add(pintura);

// Moldura anelar exterior dourada
const frisoExterior = new THREE.Mesh(
  new THREE.RingGeometry(
    larguraQuadro / 2 + 0.12,
    larguraQuadro / 2 + 0.18,
    64
  ),
  new THREE.MeshStandardMaterial({
    color: 0xc4b582,
    metalness: 1,
    roughness: 0.05,
    emissive: 0x2a1f0f,
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide
  })
);
frisoExterior.rotation.x = Math.PI / 2;
frisoExterior.position.z = 0.015;
quadroDecorativoFundo.add(frisoExterior);

// Posicionamento do grupo do quadro central
quadroDecorativoFundo.position.set(0, 6.9, -config.wallDistance - 3.5);
scene.add(quadroDecorativoFundo);

// 💡 Luz artística dedicada ao quadro
const luzQuadroCentral = new THREE.SpotLight(0xfff3d2, 2.1, 10, Math.PI / 7, 0.5);
luzQuadroCentral.position.set(0, 11.5, -config.wallDistance - 1.5);
luzQuadroCentral.target = quadroDecorativoFundo;
scene.add(luzQuadroCentral);
scene.add(luzQuadroCentral.target);

// Animação suave de intensidade da luz
gsap.to(luzQuadroCentral, {
  intensity: 2.3,
  duration: 4,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// Gemas – brilho mágico oscilante
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 1.2,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
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
