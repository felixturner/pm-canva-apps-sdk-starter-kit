import { appProcess } from '@canva/preview/platform';

import * as THREE from 'three';
import * as Composer from './fx/Composer.js';
import { SmearShader } from './fx/shaders/SmearShader.js';
import { MeltShader } from './fx/shaders/MeltShader.js';
import { WobbleShader } from './fx/shaders/WobbleShader.js';

let camera, scene, renderer;
let quadMaterial;
let smearPass, meltPass, wobblePass;
let mimeType;

export async function initGL(canvas) {
  //hide canvas until image loaded
  canvas.style.opacity = 0;
  renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
  renderer.preserveDrawingBuffer = true;
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene = new THREE.Scene();

  quadMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
  });
  let screenGeom = new THREE.PlaneGeometry(2, 2);
  let screenQuad = new THREE.Mesh(screenGeom, quadMaterial);
  scene.add(screenQuad);

  Composer.init(renderer);
  Composer.addRenderPass(scene, camera);
  smearPass = Composer.addShaderPass(SmearShader);
  meltPass = Composer.addShaderPass(MeltShader);
  wobblePass = Composer.addShaderPass(WobbleShader);

  update();
}

//load an image into webgl
export async function loadImage(blob, _mimeType) {
  //save mimeType for export
  mimeType = _mimeType;
  const imgURL = URL.createObjectURL(blob);
  const texture = await new THREE.TextureLoader().loadAsync(imgURL);
  resizeCanvas(texture.image.width, texture.image.height);
  quadMaterial.map = texture;
  quadMaterial.needsUpdate = true;
  update();
  //show canvas after image loaded
  renderer.domElement.style.opacity = 1;
  //tell object_panel to enable save button
  appProcess.broadcastMessage('image-loaded');
}

export async function getOutput() {
  update();
  let dataUrl = await renderer.domElement.toDataURL(mimeType);
  return { dataUrl, mimeType };
}

function resizeCanvas(w: number, h: number) {
  let dpr = 1;
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(dpr);
  Composer.resize(w, h, dpr);
  update();
}

function update() {
  Composer.update();
}

export function setParams(params) {
  smearPass.uniforms.amount.value = params.smear;
  meltPass.uniforms.amount.value = params.meltAmount;
  meltPass.uniforms.scale.value = params.meltScale;
  wobblePass.uniforms.strength.value = params.wobbleAmount;
  wobblePass.uniforms.size.value = params.wobbleScale;

  update();
}
