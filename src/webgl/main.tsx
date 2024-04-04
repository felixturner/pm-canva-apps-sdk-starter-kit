import * as THREE from 'three';
import * as Composer from './fx/Composer.js';
import { RGBShiftShader } from './fx/shaders/RGBShiftShader.js';
import { SolarizeShader } from './fx/shaders/SolarizeShader.js';
import { JitterShader } from './fx/shaders/JitterShader.js';

let camera, scene, renderer;
let quadMaterial;
let rgbPass, solarPass, jitterPass;
let mimeType;

export async function initGL(canvas) {
  //hide canvas until image loaded
  canvas.style.opacity = 0;
  renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.preserveDrawingBuffer = true;
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene = new THREE.Scene();

  quadMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  let screenGeom = new THREE.PlaneGeometry(2, 2);
  let screenQuad = new THREE.Mesh(screenGeom, quadMaterial);
  scene.add(screenQuad);

  Composer.init(renderer);
  Composer.addRenderPass(scene, camera);
  solarPass = Composer.addShaderPass(SolarizeShader);
  rgbPass = Composer.addShaderPass(RGBShiftShader);
  jitterPass = Composer.addShaderPass(JitterShader);

  update();
}

//load an image into webgl
export async function loadImage(url, _mimeType) {
  //save mimeType for export
  mimeType = _mimeType;
  const texture = await new THREE.TextureLoader().loadAsync(url);
  resizeCanvas(texture.image.width, texture.image.height);
  quadMaterial.map = texture;
  quadMaterial.needsUpdate = true;
  update();
  //show canvas after image loaded
  renderer.domElement.style.opacity = 1;
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
  rgbPass.uniforms.amount.value = params.rgbAmount;
  rgbPass.uniforms.angle.value = params.rgbAngle;
  jitterPass.uniforms.amount.value = params.jitterAmount;
  solarPass.uniforms.amount.value = params.solarAmount;
  update();
}