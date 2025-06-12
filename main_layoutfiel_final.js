// Ficheiro main.js corrigido com import único de Reflector e textura + normalMap aplicados corretamente

import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
// outros imports...

// === CENA ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0c12);
scene.fog = new THREE.FogExp2(0x111111, 0.015);

// === TEXTURAS DAS PAREDES DO LAYOUT COM NORMAL MAP ===
const textureLoader = new THREE.TextureLoader();
const wallNormal = textureLoader.load('/assets/textures/texture_wall_from_layout_normal.jpg');
const wallTexture = textureLoader.load('/assets/textures/texture_wall_from_layout.jpg');
const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallTexture,
  normalMap: wallNormal,
  roughness: 0.6,
  metalness: 0.3,
  emissive: new THREE.Color(0x0a0a0a),
  emissiveIntensity: 0.04,
  side: THREE.FrontSide
});

// aplicar aos planos de parede
backWall.material = wallMaterial;
leftWall.material = wallMaterial;
rightWall.material = wallMaterial;

// === CHÃO REFLEXIVO ===
const groundMirror = new Reflector(
  new THREE.PlaneGeometry(100, 100),
  {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0x111111
  }
);
groundMirror.rotateX(-Math.PI / 2);
groundMirror.position.y = 0.001;
scene.add(groundMirror);

// resto do código do main.js permanece intacto (NFTs, interações, modal, etc.)

// === LUZES, COLUNAS, OBRAS, etc... ===
// [Este espaço deve ser preenchido com o conteúdo restante do main.js original]
