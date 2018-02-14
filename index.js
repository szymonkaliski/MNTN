const THREE = require("three");
const OrbitControls = require("three-orbitcontrols");
const SimplexNoise = require("simplex-noise");

const simplex = new SimplexNoise();

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);

camera.position.z = 14;

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

// lights
const ambientLight = new THREE.AmbientLight(0x777777);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 0);
pointLight.position.set(0, 100, 10);
pointLight.castShadow = true;
scene.add(pointLight);

// mesh
const planeWidth = 10;
const planeHeight = 10;
const planeSteps = 100;
const geometry = new THREE.PlaneGeometry(
  planeWidth,
  planeHeight,
  planeSteps,
  planeSteps
);

const nMod = 10;
const heightMod = 0.2;
const neighbourMod = 0.5;
const mountainCenter = new THREE.Vector2(0, 4);
const mountainR = 5;

geometry.vertices.forEach(v => {
  const n = Math.abs(
    simplex.noise2D(v.x / planeWidth * nMod, v.y / planeHeight * nMod)
  );

  const posxy = new THREE.Vector2(v.x, v.y);
  const sizeMod =
    1 - Math.min(mountainCenter.distanceTo(posxy) / mountainR, 1) + 0.1;

  v.noise = n * sizeMod * heightMod;
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
  color: 0x222222,
  emissive: 0x010101,
  roughness: 0.7,
  metalness: 0.2,
  flatShading: true
});
const mesh = new THREE.Mesh(geometry, material);

mesh.rotation.x = -Math.PI / 2 * 0.8;
mesh.castShadow = true;
mesh.receiveShadow = true;

scene.add(mesh);

// orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.enableZoom = true;

// loop
const loop = () => {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
};

loop();
