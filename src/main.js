import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// ✅ Loader de texturas
const textureLoader = new THREE.TextureLoader();

// 🔧 Configuração base
const config = {
  wallDistance: 14.5,
  circleRadius: 6.5,
  obraSize: 2.1
};

// 🎥 Câmara
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 10.5, 24);
camera.lookAt(0, 7.2, 0);

// 🎨 Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// 🖥️ Renderer
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

// 🌟 ILUMINAÇÃO PRINCIPAL
const luzPrincipal = new THREE.DirectionalLight(0xfff9e6, 1.5);
luzPrincipal.position.set(0, 15, 10);
luzPrincipal.castShadow = true;
luzPrincipal.shadow.mapSize.width = 2048;
luzPrincipal.shadow.mapSize.height = 2048;
scene.add(luzPrincipal);

const luzAmbiente = new THREE.AmbientLight(0x404040, 0.9);
scene.add(luzAmbiente);

// 🧱 Paredes com textura antracite
const texturaParede = textureLoader.load('/assets/texturas/parede-antracite.jpg');
const paredeMaterial = new THREE.MeshStandardMaterial({
  map: texturaParede,
  roughness: 0.9,
  metalness: 0.1
});

// Parede de fundo
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), paredeMaterial);
backWall.position.set(0, 13, -config.wallDistance - 4.05);
backWall.receiveShadow = true;
scene.add(backWall);

// Paredes laterais
const paredeLateralGeo = new THREE.PlaneGeometry(30, 28);

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

// 🔶 FRISOS DOURADOS AUTÊNTICOS
function criarFrisoDourado(x, y, z, largura, altura, rotY = 0) {
    const friso = new THREE.Mesh(
        new THREE.BoxGeometry(largura, altura, 0.05),
        new THREE.MeshPhysicalMaterial({
            color: 0xffd700,
            metalness: 1.0,
            roughness: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            emissive: 0x3a2a00,
            emissiveIntensity: 0.3,
            envMapIntensity: 2
        })
    );
    friso.position.set(x, y, z);
    friso.rotation.y = rotY;
    scene.add(friso);
    
    const luzFriso = new THREE.SpotLight(0xfff0a0, 0.8, 5, Math.PI/8, 0.5);
    luzFriso.position.set(x, y+0.5, z+0.5);
    luzFriso.target.position.set(x, y, z);
    scene.add(luzFriso, luzFriso.target);
    
    return friso;
}

// Aplicar frisos
criarFrisoDourado(0, 16, -14, 18, 0.1); // Superior
criarFrisoDourado(0, 0.5, -14, 18, 0.1); // Inferior
criarFrisoDourado(-9, 8.5, -14, 0.1, 16); // Esquerda
criarFrisoDourado(9, 8.5, -14, 0.1, 16); // Direita

// 🌊 CHÃO TRANSPARENTE E REFLEXIVO
const chao = new Reflector(
    new THREE.PlaneGeometry(40, 40),
    {
        color: new THREE.Color(0x333344),
        textureWidth: window.innerWidth * 2,
        textureHeight: window.innerHeight * 2,
        clipBias: 0.001,
        recursion: 1
    }
);
chao.rotation.x = -Math.PI / 2;
chao.position.y = -0.01;
chao.material.transparent = true;
chao.material.opacity = 0.9;
chao.material.roughness = 0.01;
chao.material.metalness = 0.9;
scene.add(chao);

// 💎 VITRINE PREMIUM COM CRISTAL
function criarVitrinePremium(x, z) {
    // Base
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32),
        new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.7
        })
    );
    base.position.set(x, 0.1, z);
    scene.add(base);

    // Vidro ultra-realista
    const vidro = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 2, 32),
        new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.95,
            roughness: 0.01,
            metalness: 0,
            ior: 1.5,
            thickness: 0.3,
            clearcoat: 1,
            clearcoatRoughness: 0.05,
            envMapIntensity: 2
        })
    );
    vidro.position.set(x, 1.2, z);
    scene.add(vidro);

    // Cristal suspenso
    const cristal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35, 2),
        new THREE.MeshPhysicalMaterial({
            color: 0x66aaff,
            transmission: 0.8,
            roughness: 0.1,
            metalness: 0.3,
            emissive: 0x0044ff,
            emissiveIntensity: 0.8,
            ior: 1.8,
            clearcoat: 1
        })
    );
    cristal.position.set(x, 1.5, z);
    scene.add(cristal);

    // Iluminação interna
    const luzInterna = new THREE.PointLight(0x88ccff, 1.5, 2);
    luzInterna.position.set(x, 1.5, z);
    scene.add(luzInterna);

    // Animação de brilho
    gsap.to(cristal.material, {
        emissiveIntensity: 1.5,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
}

// Criar vitrines premium
criarVitrinePremium(-9.5, -1.8);
criarVitrinePremium(-9.5, 1.8);
criarVitrinePremium(9.5, -1.8);
criarVitrinePremium(9.5, 1.8);

// 🖼️ Obras suspensas (código original mantido)
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

// ✨ Texto "NANdART" (código original mantido)
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

    const luzTexto = new THREE.SpotLight(0xfff1cc, 1.4, 12, Math.PI / 9, 0.5);
    luzTexto.position.set(0, 18, -config.wallDistance - 2);
    luzTexto.target = texto;
    scene.add(luzTexto);
    scene.add(luzTexto.target);
  }
);

// 🖼️ Quadro central (código original mantido)
const quadroDecorativoFundo = new THREE.Group();
const larguraQuadro = 3.6;
const alturaQuadro = 4.5;

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

quadroDecorativoFundo.position.set(0, 6.9, -config.wallDistance - 3.5);
scene.add(quadroDecorativoFundo);

const luzQuadroCentral = new THREE.SpotLight(0xfff3d2, 2.1, 10, Math.PI / 7, 0.5);
luzQuadroCentral.position.set(0, 11.5, -config.wallDistance - 1.5);
luzQuadroCentral.target = quadroDecorativoFundo;
scene.add(luzQuadroCentral);
scene.add(luzQuadroCentral.target);

gsap.to(luzQuadroCentral, {
  intensity: 2.3,
  duration: 4,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// 🎬 Animação
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
