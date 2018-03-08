const THREE = require("three");
// const OrbitControls = require("three-orbitcontrols");
const SimplexNoise = require("simplex-noise");
const { Gui } = require("uil");

global.THREE = THREE;

require("three/examples/js/shaders/SSAOShader");
require("three/examples/js/shaders/CopyShader");
require("three/examples/js/shaders/BokehShader");
// require("three/examples/js/shaders/FilmShader");

require("three/examples/js/postprocessing/EffectComposer");
require("three/examples/js/postprocessing/RenderPass");
require("three/examples/js/postprocessing/ShaderPass");
require("three/examples/js/postprocessing/MaskPass");
require("three/examples/js/postprocessing/SSAOPass");
require("three/examples/js/postprocessing/BokehPass");
// require("three/examples/js/postprocessing/FilmPass");

const IS_DEBUG = window.location.search.indexOf("debug") >= 0;

let loaderDiv = document.querySelector(".loader");

const opts = {
  postProcessingEnabled: true,

  onlyAO: false,
  radius: 32,
  aoClamp: 0.25,
  lumInfluence: 0.7,

  lightX: 100,
  lightY: 100,
  lightZ: -50,

  focus: 440,
  aperture: 0.64,
  maxblur: 10,

  noiseIntensity: 0.36,
  scanlinesIntensity: 0.76,
  scanlinesCount: 2048,
  grayscale: true
};

if (IS_DEBUG) {
  const ui = new Gui({ size: 300 });

  ui.setBG("#222222");

  [
    { key: "postProcessingEnabled" },
    { key: "onlyAO" },
    { min: 0, max: 64, key: "radius" },
    { min: 0, max: 1, key: "aoClamp" },
    { min: 0, max: 1, key: "lumInfluence" },
    { min: -100, max: 100, key: "lightX" },
    { min: -100, max: 100, key: "lightY" },
    { min: -100, max: 100, key: "lightZ" },
    { min: 0, max: 1000, key: "focus" },
    { min: 0, max: 10, key: "aperture" },
    { min: 0, max: 30, key: "maxblur" },
    { key: "noiseIntensity", min: 0, max: 1 },
    { key: "scanlinesIntensity", min: 0, max: 3 },
    { key: "scanlinesCount", min: 0, max: 2048 },
    { key: "grayscale" }
  ].forEach(({ min, max, key }) => {
    if (min !== undefined && max !== undefined) {
      ui.add("slide", {
        name: key,
        min,
        max,
        value: opts[key],
        callback: v => (opts[key] = v)
      });
    } else {
      ui.add("bool", {
        name: key,
        value: opts[key],
        callback: v => (opts[key] = v)
      });
    }
  });
}

const simplex = new SimplexNoise();

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);

camera.position.z = 10;

const offset = new THREE.Vector3();

const rotateEnd = new THREE.Vector2();
const rotateStart = new THREE.Vector2();
const rotateDelta = new THREE.Vector2();

const spherical = new THREE.Spherical();
const sphericalDelta = new THREE.Spherical();

const rotateSpeed = 0.2;

const onMouseMove = () => {
  rotateEnd.set(
    event.clientX - window.innerWidth / 2,
    event.clientY - window.innerHeight / 2
  );

  rotateDelta.subVectors(rotateEnd, rotateStart);

  sphericalDelta.theta -=
    2 * Math.PI * rotateDelta.x / window.innerWidth * rotateSpeed;

  sphericalDelta.phi -=
    2 * Math.PI * rotateDelta.y / window.innerHeight * rotateSpeed;

  rotateStart.copy(rotateEnd);
};

window.addEventListener("mousemove", onMouseMove, false);

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setClearColor(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.style.margin = 0;
document.body.appendChild(renderer.domElement);

// scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x222222, 0.12);

// lights
const ambientLight = new THREE.AmbientLight(0x777777);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.castShadow = true;
scene.add(pointLight);

// background
const bgSphereGeometry = new THREE.SphereGeometry(20);
const bgSphereMaterial = new THREE.MeshLambertMaterial({
  color: 0x1b1b1b,
  emissive: 0x010101
});
const bgSphereMesh = new THREE.Mesh(bgSphereGeometry, bgSphereMaterial);
bgSphereMaterial.side = THREE.DoubleSide;
scene.add(bgSphereMesh);

// mesh
const planeWidth = 20;
const planeHeight = 20;
const planeStepsWidth = 100;
const planeStepsHeight = 100;
const geometry = new THREE.PlaneGeometry(
  planeWidth,
  planeHeight,
  planeStepsWidth,
  planeStepsHeight
);

const nMod = 10;
const heightMod = 0.5;
const neighbourMod = 0.5;

const minSize = 0.18;
const mountains = [
  [new THREE.Vector2(-6, 2), 4.3],
  [new THREE.Vector2(-2, 0), 3],
  [new THREE.Vector2(0, 4), 5],
  [new THREE.Vector2(2, 3), 2],
  [new THREE.Vector2(5, -2), 2.4]
];

geometry.vertices.forEach(v => {
  const n = Math.abs(
    simplex.noise2D(v.x / planeWidth * nMod, v.y / planeHeight * nMod)
  );

  const posxy = new THREE.Vector2(v.x, v.y);

  const sizeMod = mountains.reduce((memo, [mountainCenter, mountainR]) => {
    return (
      memo + (1 - Math.min(mountainCenter.distanceTo(posxy) / mountainR, 1))
    );
  }, 0);

  v.noise = n * (sizeMod + minSize) * heightMod;
});

geometry.vertices.forEach(v => {
  const neighbours = geometry.vertices.filter(v2 => {
    const v1xy = new THREE.Vector2(v.x, v.y);
    const v2xy = new THREE.Vector2(v2.x, v2.y);

    const dist = v1xy.distanceTo(v2xy);

    return dist < neighbourMod && dist > 0.0001;
  });

  v.z +=
    v.noise + neighbours.reduce((memo, { noise }) => memo + Math.abs(noise), 0);
});

geometry.computeBoundingSphere();
geometry.computeVertexNormals();
geometry.computeFaceNormals();

const material = new THREE.MeshStandardMaterial({
  color: 0x121212,
  emissive: 0x010101,
  roughness: 0.7,
  metalness: 0.2,
  flatShading: true
});
const mesh = new THREE.Mesh(geometry, material);

mesh.rotation.x = -Math.PI / 2 * 0.8;
mesh.castShadow = true;
mesh.receiveShadow = true;

mesh.position.z = 1;
mesh.position.y = -2;

scene.add(mesh);

// postprocessing
const effectComposer = new THREE.EffectComposer(renderer);

const renderPass = new THREE.RenderPass(scene, camera);
effectComposer.addPass(renderPass);

const ssaoPass = new THREE.SSAOPass(scene, camera);
effectComposer.addPass(ssaoPass);

const bokehPass = new THREE.BokehPass(scene, camera, {});
bokehPass.renderToScreen = true;
effectComposer.addPass(bokehPass);

// const filmPass = new THREE.FilmPass(
//   opts.noiseIntensity,
//   opts.scanlinesIntensity,
//   opts.scanlinesCount,
//   opts.grayscale
// );
// filmPass.renderToScreen = true;
// effectComposer.addPass(filmPass);

// // orbit controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = false;
// controls.enableZoom = true;

// loop
const quat = new THREE.Quaternion().setFromUnitVectors(
  camera.up,
  new THREE.Vector3(0, 1, 0)
);
const quatInverse = quat.clone().inverse();
const target = new THREE.Vector3();

const SPHERICAL_PHI_MAX = 1.75;
const SPHERICAL_PHI_MIN = 1.54;
const SPHERICAL_THETA_MAX = 0.4;
const SPHERICAL_THETA_MIN = -0.4;
const CAMERA_DAMPING = 0.2;
const CAMERA_UPDATE_K = 0.05;
const OPACITY_K = 0.9;

const loop = () => {
  if (loaderDiv && loaderDiv.style.opacity > 0) {
    loaderDiv.style.opacity *= OPACITY_K;

    if (loaderDiv.style.opacity < 0.01) {
      document.body.removeChild(loaderDiv);
      loaderDiv = undefined;
    }
  }

  requestAnimationFrame(loop);

  offset.copy(camera.position).sub(target);
  offset.applyQuaternion(quat);

  spherical.setFromVector3(offset);
  spherical.theta += sphericalDelta.theta * CAMERA_UPDATE_K;
  spherical.phi += sphericalDelta.phi * CAMERA_UPDATE_K;
  spherical.radius = 10;

  spherical.phi = Math.max(
    SPHERICAL_PHI_MIN,
    Math.min(SPHERICAL_PHI_MAX, spherical.phi)
  );

  spherical.theta = Math.max(
    SPHERICAL_THETA_MIN,
    Math.min(SPHERICAL_THETA_MAX, spherical.theta)
  );

  spherical.makeSafe();

  offset.setFromSpherical(spherical);
  offset.applyQuaternion(quatInverse);

  camera.position.copy(target).add(offset);
  camera.lookAt(target);

  sphericalDelta.theta *= 1 - CAMERA_DAMPING;
  sphericalDelta.phi *= 1 - CAMERA_DAMPING;

  pointLight.position.set(opts.lightX, opts.lightY, opts.lightZ);

  if (opts.postProcessingEnabled) {
    if (ssaoPass) {
      ssaoPass.onlyAO = opts.onlyAO;
      ssaoPass.radius = opts.radius;
      ssaoPass.aoClamp = opts.aoClamp;
      ssaoPass.lumInfluence = opts.lumInfluence;
    }

    if (bokehPass) {
      bokehPass.uniforms.focus.value = opts.focus;
      bokehPass.uniforms.aperture.value = opts.aperture * 0.00001;
      bokehPass.uniforms.maxblur.value = opts.maxblur;
    }

    // if (filmPass) {
    //   filmPass.uniforms.nIntensity.value = opts.noiseIntensity;
    //   filmPass.uniforms.sIntensity.value = opts.scanlinesIntensity;
    //   filmPass.uniforms.sCount.value = Math.round(opts.scanlinesCount);
    //   filmPass.uniforms.grayscale.value = opts.grayscale;
    // }

    effectComposer.render();
  } else {
    renderer.render(scene, camera);
  }
};

loop();

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener("resize", onWindowResize, false);
