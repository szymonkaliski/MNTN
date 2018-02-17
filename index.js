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

camera.position.z = 10;

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
pointLight.position.set(100, 100, -50);
pointLight.castShadow = true;
scene.add(pointLight);

// background
const bgSphereGeometry = new THREE.SphereGeometry(60);
const bgSphereMaterial = new THREE.MeshLambertMaterial({
  color: 0x1b1b1b,
  emissive: 0x010101
});
const bgSphereMesh = new THREE.Mesh(bgSphereGeometry, bgSphereMaterial);
bgSphereMaterial.side = THREE.DoubleSide;
scene.add(bgSphereMesh);

// mesh
const planeWidth = 20;
const planeHeight = 10;
const planeStepsWidth = 100;
const planeStepsHeight = 50;
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
