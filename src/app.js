// import * as THREE from "../build/three.module.js";

// import { PointerLockControls } from "../jsm/controls/PointerLockControls.js";
// import { GLTFLoader } from "../jsm/loaders/GLTFLoader.js";
// import { DRACOLoader } from "../jsm/loaders/DRACOLoader.js";

let camera, scene, renderer, controls, cameraMap;

const objects = [];

let raycaster;
var crosshairClone;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let rcState = false;

let particleSystem, uniforms, geometry;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

const mouse = new THREE.Vector2();

const listener = new THREE.AudioListener();

const davidPA = new THREE.PositionalAudio(listener);
const audioDavid = new THREE.AudioLoader();
const asakoPA = new THREE.PositionalAudio(listener);
const audioAsako = new THREE.AudioLoader();
const eunheePA = new THREE.PositionalAudio(listener);
const audioEunhee = new THREE.AudioLoader();
const invasionPA = new THREE.PositionalAudio(listener);
const audioInvasion = new THREE.AudioLoader();
const termsPA = new THREE.PositionalAudio(listener);
const audioTerms = new THREE.AudioLoader();

const festivalSound = new THREE.PositionalAudio(listener);
const audioFestival = new THREE.AudioLoader();

const shortPromoPA = new THREE.PositionalAudio(listener);
const audioShortPromo = new THREE.AudioLoader();

const promoPA = new THREE.PositionalAudio(listener);
const audioPromo = new THREE.AudioLoader();

const loadingElem = document.querySelector("#loading");
const progressBarElem = loadingElem.querySelector(".progressbar");
const instructionsElem = document.querySelector("#instructions");

const indicatorElem = document.querySelector("#indicator");

//Get your video element:
const david = document.getElementById("david");
const asako = document.getElementById("asako");
const eunhee = document.getElementById("eunhee");
const invasion = document.getElementById("invasion");
const terms = document.getElementById("terms");
const shortpromo = document.getElementById("shortPromo");
const promo = document.getElementById("promoVideo");

function init() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.y = 10;

  addCrosshair(camera);

  //
  //   const fragmentShader = `#include <common>

  // uniform vec3 iResolution;
  // uniform float iTime;

  // // By iq: https://www.shadertoy.com/user/iq
  // // license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
  // void mainImage( out vec4 fragColor, in vec2 fragCoord )
  // {
  //     // Normalized pixel coordinates (from 0 to 1)
  //     vec2 uv = fragCoord/iResolution.xy;

  //     // Time varying pixel color
  //     vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));

  //     // Output to screen
  //     fragColor = vec4(col,1.0);
  // }

  // void main() {
  //   mainImage(gl_FragColor, gl_FragCoord.xy);
  // }
  // `;

  //   const uniforms = {
  //     iTime: { value: 0 },
  //     iResolution: { value: new THREE.Vector3() },
  //   };
  //   const spec_material = new THREE.ShaderMaterial({
  //     fragmentShader,
  //     uniforms,
  //   });
  ///
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  //const loader = new THREE.TextureLoader();
  //scene.background = loader.load( './textures/background.jpg' );
  //scene.background.encoding = THREE.sRGBEncoding;
  scene.fog = new THREE.Fog(0x585858, 0, 750);

  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 10, 0.75);
  scene.add(light);

  const ambientlight = new THREE.AmbientLight(0x6688cc);
  scene.add(ambientlight);

  const fillLight1 = new THREE.DirectionalLight(0xff9999, 0.5);
  fillLight1.position.set(-1, 10, 2);
  scene.add(fillLight1);

  const fillLight2 = new THREE.DirectionalLight(0x8888ff, 0.2);
  fillLight2.position.set(0, -1, 0);
  scene.add(fillLight2);

  const directionalLight = new THREE.DirectionalLight(0xffffaa, 1.2);
  directionalLight.position.set(-5, 25, -1);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.01;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.radius = 4;
  directionalLight.shadow.bias = -0.00006;
  scene.add(directionalLight);

  controls = new THREE.PointerLockControls(camera, document.body);

  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  instructions.addEventListener("click", function () {
    controls.lock();
  });

  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
  });

  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;

      case "Space":
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    100
  );

  //floor

  let floorGeometry = new THREE.PlaneGeometry(3000, 3000, 100, 100);
  floorGeometry.rotateX(-Math.PI / 2);

  // vertex displacement

  let position = floorGeometry.attributes.position;

  for (let i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i);

    vertex.x += Math.random() * 20 - 10;
    vertex.y += Math.random() * 2;
    vertex.z += Math.random() * 20 - 10;

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

  position = floorGeometry.attributes.position;
  const colorsFloor = [];

  for (let i = 0, l = position.count; i < l; i++) {
    color.setHSL(Math.random() * 0.8 + 0.9, 0.95, Math.random() * 0.95 + 0.75);
    colorsFloor.push(color.r, color.g, color.b);
  }

  floorGeometry.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(colorsFloor, 3)
  );

  const floorMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  scene.add(floor);

  // objects
  createGeometry();
  loadingManager();

  //positional audio
  camera.add(listener);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  //renderer.toneMapping = THREE.ACESFilmicToneMapping;
  //renderer.toneMappingExposure = 1;
  //renderer.shadowMap.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  //renderer.physicallyCorrectLights = true;

  document.body.appendChild(renderer.domElement);

  //prevent safari context menu right click
  document.addEventListener("contextmenu", (event) => event.preventDefault());
  //
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousemove", onMouseMove, false);
  window.addEventListener("click", onClick);
  window.addEventListener("mousedown", onMouseDown);
  //window.addEventListener("dblclick", onDbClick);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();

  if (controls.isLocked === true) {
    raycaster.ray.origin.copy(controls.getObject().position);
    // raycaster.ray.origin.x -= 10;
    raycaster.ray.origin.y -= 10;
    // raycaster.ray.origin.z -= 10;

    //raycaster.setFromCamera(mouse, camera);

    const intersections = raycaster.intersectObjects(objects);

    const onObject = intersections.length > 0;

    // console.log(intersections.length);

    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    festivalSound.play();

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
      //do something
    } else {
      //do something
      //indicatorElem.style.visibility = "hidden";
      //rcState = false;
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += velocity.y * delta; // new behavior

    if (controls.getObject().position.y < 10) {
      velocity.y = 0;
      controls.getObject().position.y = 10;
      canJump = true;
    }
  }

  prevTime = time;

  // time *= 0.001; // convert to seconds
  // const canvas = renderer.domElement;
  // uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  // uniforms.iTime.value = time;

  renderer.render(scene, camera);
}

function onClick(event) {
  //console.log(event.which);
  doRaycasterCross(event.which);
}

function onMouseDown(event) {
  //console.log(event.which);
  doRaycasterCross(event.which);
}

function onMouseMove(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// function onDbClick(event) {
//   console.log(event);
// }

function doRaycasterCross(which) {
  // console.log('doCaster');
  // update the picking ray with the camera and mouse position
  //console.log(crosshairClone);
  let crossVector = new THREE.Vector2(crosshairClone.x, crosshairClone.y);
  let raycasterCross = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    100
  );
  raycasterCross.setFromCamera(crossVector, camera);
  // calculate objects intersecting the picking ray
  //const intersects = raycaster.intersectObjects(scene.children);
  const intersects = raycasterCross.intersectObjects(objects);
  indicatorElem.style.visibility = "hidden";
  const intersectCondition = intersects.length > 0;
  if (controls.isLocked === true) {
    if (which === 1) {
      if (intersectCondition) {
        openLink(intersects[0].object);
        console.log(intersects[0].object);
      }
    } else if (which === 3) {
      if (intersectCondition) {
        //console.log("right click");
        showDetail(intersects[0].object);
      }
    }
  }
}

function addCrosshair(camera) {
  // crosshair
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  // size
  const crosshairSizeX = 0.05,
    crosshairSizeY = 0.05;
  const geometry = new THREE.BufferGeometry();
  const pointsArray = new Array();
  pointsArray.push(new THREE.Vector3(0, crosshairSizeY, 0));
  pointsArray.push(new THREE.Vector3(0, -crosshairSizeY, 0));
  pointsArray.push(new THREE.Vector3(0, 0, 0));
  pointsArray.push(new THREE.Vector3(crosshairSizeX, 0, 0));
  pointsArray.push(new THREE.Vector3(-crosshairSizeX, 0, 0));
  geometry.setFromPoints(pointsArray);
  const crosshair = new THREE.Line(geometry, material);
  const crosshairPercentX = 50;
  const crosshairPercentY = 50;
  const crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
  const crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;
  crosshair.position.x = crosshairPositionX * camera.aspect;
  crosshair.position.y = crosshairPositionY;
  crosshair.position.z = -3;
  crosshairClone = crosshair.position.clone();
  camera.add(crosshair);
}

async function showDetail(obj) {
  //console.log(obj, onObject);
  if (controls.isLocked === true) {
    if (rcState) {
      indicatorElem.style.visibility = "hidden";
      rcState = false;
    } else {
      indicatorElem.style.visibility = "visible";
      //indicatorElem.innerHTML = obj.page;
      let url = obj.page.URL;
      indicatorElem.innerHTML = await (await fetch(url)).text();
      rcState = true;
    }
  }
}

function openLink(obj) {
  let url = obj.userData.URL;
  if (typeof url !== "undefined") {
    window.open(url, "_blank");
  } else {
    //console.log(obj.Tag);
    if (obj.Tag === "video") {
      if (obj.name == "david_08") {
        david.play();
        davidPA.play();
      } else if (obj.name == "asako_11") {
        asako.play();
        asakoPA.play();
      } else if (obj.name == "eunhee_04") {
        eunhee.play();
        eunheePA.play();
      } else if (obj.name == "invasion_19") {
        invasion.play();
        invasionPA.play();
      } else if (obj.name == "terms") {
        terms.play();
        termsPA.play();
      } else if (obj.name == "shortPromo") {
        shortpromo.play();
        shortPromoPA.play();
      } else if (obj.name == "promo") {
        promo.play();
        promoPA.play();
      }
    }
  }
}

function createGeometry() {
  //莊培鑫
  //Create your video texture:
  audioDavid.load("./videos/david.m4a", function (buffer) {
    davidPA.setBuffer(buffer);
    davidPA.setRefDistance(15);
  });
  const david_videoTexture = new THREE.VideoTexture(david);
  const david_videoMaterial = new THREE.MeshBasicMaterial({
    map: david_videoTexture,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  //Create screen
  const screenDavid = new THREE.PlaneGeometry(1, 1);
  const videoDavid = new THREE.Mesh(screenDavid, david_videoMaterial);
  videoDavid.name = "david_08";
  videoDavid.Tag = "video";
  videoDavid.page = { URL: "pages/David.html" };
  videoDavid.position.set(-350, 60, -230);
  videoDavid.rotation.set(0, 180, 0);
  videoDavid.scale.set(60, 100, 10);
  videoDavid.add(davidPA);
  objects.push(videoDavid);
  scene.add(videoDavid);
  //藤倉
  //Create your video texture:
  audioAsako.load("./videos/asako.m4a", function (buffer) {
    asakoPA.setBuffer(buffer);
    asakoPA.setRefDistance(15);
  });
  const asako_videoTexture = new THREE.VideoTexture(asako);
  const asako_videoMaterial = new THREE.MeshBasicMaterial({
    map: asako_videoTexture,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  //Create screen
  const screenAsako = new THREE.PlaneGeometry(1, 1);
  const videoAsako = new THREE.Mesh(screenAsako, asako_videoMaterial);
  videoAsako.name = "asako_11";
  videoAsako.Tag = "video";
  videoAsako.page = { URL: "pages/Asako.html" };
  videoAsako.position.set(-250, 30, -500);
  videoAsako.scale.set(100, 56.25, 10);
  videoAsako.add(asakoPA);
  objects.push(videoAsako);
  scene.add(videoAsako);
  //李恩喜
  //Create your video texture:
  audioEunhee.load("./videos/eunhee.m4a", function (buffer) {
    eunheePA.setBuffer(buffer);
    eunheePA.setRefDistance(15);
  });
  const eunhee_videoTexture = new THREE.VideoTexture(eunhee);
  const eunhee_videoMaterial = new THREE.MeshBasicMaterial({
    map: eunhee_videoTexture,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  //Create screen
  const screenEunhee = new THREE.PlaneGeometry(1, 1);
  const videoEunhee = new THREE.Mesh(screenEunhee, eunhee_videoMaterial);
  videoEunhee.name = "eunhee_04";
  videoEunhee.Tag = "video";
  videoEunhee.page = { URL: "pages/Eunhee.html" };
  videoEunhee.position.set(-550, 40, -350);
  videoEunhee.rotation.set(0, 120, 0);
  videoEunhee.scale.set(200, 56.25, 10);
  videoEunhee.add(eunheePA);
  objects.push(videoEunhee);
  scene.add(videoEunhee);
  //阮柏遠
  //Create your video texture:
  const invasion_videoTexture = new THREE.VideoTexture(invasion);
  audioInvasion.load("./videos/invasion.m4a", function (buffer) {
    invasionPA.setBuffer(buffer);
    invasionPA.setRefDistance(15);
  });

  const invasion_videoMaterial = new THREE.MeshBasicMaterial({
    map: invasion_videoTexture,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  //Create screen
  const screenInvasion = new THREE.PlaneGeometry(1, 1);
  const videoInvasion = new THREE.Mesh(screenInvasion, invasion_videoMaterial);
  videoInvasion.name = "invasion_19";
  videoInvasion.Tag = "video";
  videoInvasion.page = { URL: "pages/Invasion.html" };
  videoInvasion.position.set(-300, 40, -850);
  videoInvasion.rotation.set(0, 180, 0);
  videoInvasion.scale.set(150, 84, 10);
  videoInvasion.add(invasionPA);
  objects.push(videoInvasion);
  scene.add(videoInvasion);

  //吳柏瑤
  //Create your video texture:
  const terms_videoTexture = new THREE.VideoTexture(terms);
  audioTerms.load("./videos/term.m4a", function (buffer) {
    termsPA.setBuffer(buffer);
    termsPA.setRefDistance(15);
  });

  const terms_videoMaterial = new THREE.MeshBasicMaterial({
    map: terms_videoTexture,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  //Create screen
  const screenTerms = new THREE.PlaneGeometry(16, 9, 20, 20);
  planeCurve(screenTerms, 15);
  const videoTerms = new THREE.Mesh(screenTerms, terms_videoMaterial);
  videoTerms.name = "terms";
  videoTerms.Tag = "video";
  videoTerms.page = { URL: "pages/Terms.html" };
  videoTerms.position.set(-500, 60, 0);
  videoTerms.rotation.set(0, 40, 0);
  videoTerms.scale.set(10, 10, 10);
  videoTerms.add(termsPA);
  objects.push(videoTerms);
  scene.add(videoTerms);

  //主視覺牆面
  audioFestival.load("./sounds/background.m4a", function (buffer) {
    festivalSound.setBuffer(buffer);
    festivalSound.setRefDistance(30);
    festivalSound.setVolume(1);
    festivalSound.setLoop(true);
  });
  const entraceWall = new THREE.BoxGeometry(25, 10, 1);
  const entraceWalltexture = new THREE.TextureLoader().load(
    "./textures/statement.png"
  );
  const entraceWallMaterial = new THREE.MeshBasicMaterial({
    map: entraceWalltexture,
    side: THREE.FrontSide,
    toneMapped: false,
  });
  const entraceWallMesh = new THREE.Mesh(entraceWall, entraceWallMaterial);
  entraceWallMesh.position.set(0, 60, 200);
  entraceWallMesh.rotation.set(0, 0, 0);
  entraceWallMesh.scale.set(10, 10, 5);
  entraceWallMesh.userData = {
    URL: "http://festival.dac.taipei/2021/zh/guan-yu-ben-zhan/",
  };
  entraceWallMesh.add(festivalSound);
  objects.push(entraceWallMesh);
  scene.add(entraceWallMesh);

  //活動告示牆面
  const eventWall = new THREE.BoxGeometry(25, 10, 1);
  const eventWalltexture = new THREE.TextureLoader().load(
    "./textures/eventinfo.png"
  );
  const eventWallMaterial = new THREE.MeshBasicMaterial({
    map: eventWalltexture,
    side: THREE.FrontSide,
    toneMapped: false,
  });
  const eventWallMesh = new THREE.Mesh(eventWall, eventWallMaterial);
  eventWallMesh.position.set(300, 60, -100);
  eventWallMesh.rotation.set(0, 240, 0);
  eventWallMesh.scale.set(10, 10, 5);
  eventWallMesh.userData = {
    URL: "http://festival.dac.taipei/2021/zh/tags/xiang-guan-huo-dong/",
  };
  eventWallMesh.add(festivalSound);
  objects.push(eventWallMesh);
  scene.add(eventWallMesh);

  //30 min video
  //Create your video texture:
  audioShortPromo.load("./videos/shortPromo.ogg", function (buffer) {
    shortPromoPA.setBuffer(buffer);
    shortPromoPA.setRefDistance(15);
  });
  const shortPromo_videoTexture = new THREE.VideoTexture(shortpromo);
  const shortPromo_videoMaterial = new THREE.MeshBasicMaterial({
    map: shortPromo_videoTexture,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  //Create screen
  const screenShortPromo = new THREE.PlaneGeometry(7.2, 4.8);
  const videoShortPromo = new THREE.Mesh(
    screenShortPromo,
    shortPromo_videoMaterial
  );
  videoShortPromo.name = "shortPromo";
  videoShortPromo.Tag = "video";
  videoShortPromo.position.set(200, 60, 100);
  videoShortPromo.rotation.set(0, 180, 0);
  videoShortPromo.scale.set(20, 20, 10);
  videoShortPromo.add(shortPromoPA);
  objects.push(videoShortPromo);
  scene.add(videoShortPromo);

  //2 min video
  //Create your video texture:
  audioPromo.load("./videos/promo_video.ogg", function (buffer) {
    promoPA.setBuffer(buffer);
    promoPA.setRefDistance(15);
  });
  const promo_videoTexture = new THREE.VideoTexture(promo);
  const promo_videoMaterial = new THREE.MeshBasicMaterial({
    map: promo_videoTexture,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  //Create screen
  const screenPromo = new THREE.PlaneGeometry(7.2, 4.8);
  const videoPromo = new THREE.Mesh(screenPromo, promo_videoMaterial);
  videoPromo.name = "promo";
  videoPromo.Tag = "video";
  videoPromo.position.set(400, 60, -400);
  videoPromo.rotation.set(0, 320, 0);
  videoPromo.scale.set(20, 20, 10);
  videoPromo.add(promoPA);
  objects.push(videoPromo);
  scene.add(videoPromo);
}

function planeCurve(g, z) {
  let p = g.parameters;
  let hw = p.width * 0.5;

  let a = new THREE.Vector2(-hw, 0);
  let b = new THREE.Vector2(0, z);
  let c = new THREE.Vector2(hw, 0);

  let ab = new THREE.Vector2().subVectors(a, b);
  let bc = new THREE.Vector2().subVectors(b, c);
  let ac = new THREE.Vector2().subVectors(a, c);

  let r =
    (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));

  let center = new THREE.Vector2(0, z - r);
  let baseV = new THREE.Vector2().subVectors(a, center);
  let baseAngle = baseV.angle() - Math.PI * 0.5;
  let arc = baseAngle * 2;

  let uv = g.attributes.uv;
  let pos = g.attributes.position;
  let mainV = new THREE.Vector2();
  for (let i = 0; i < uv.count; i++) {
    let uvRatio = 1 - uv.getX(i);
    let y = pos.getY(i);
    mainV.copy(c).rotateAround(center, arc * uvRatio);
    pos.setXYZ(i, mainV.x, y, -mainV.y);
  }

  pos.needsUpdate = true;
}

function loadingManager() {
  var manager = new THREE.LoadingManager();

  manager.onStart = function (item, loaded, total) {
    console.log("Loading started");
    instructionsElem.style.display = "none";
  };

  manager.onLoad = function () {
    console.log("Loading complete");
    loadingElem.style.display = "none";
    instructionsElem.style.display = "flex";
    stopVideo();
    animate();
  };

  var intro_video = document.getElementById("intro");
  function stopVideo() {
    intro_video.pause();
    intro_video.currentTime = 0;
  }

  manager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
    console.log("Loaded:", Math.round((loaded / total) * 100, 2) + "%");
    const progress = loaded / total;
    progressBarElem.style.transform = `scaleX(${progress})`;
    document.getElementById("percent").innerHTML = Math.round((loaded / total) * 100, 2) + "%";
  };

  manager.onError = function (url) {
    console.log("Error loading");
  };

  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath("./js/libs/draco/");

  const loader = new THREE.GLTFLoader(manager);
  loader.setDRACOLoader(dracoLoader);
  loader.setPath("./models/gltf/");

  //林安琪
  loader.load("Necklace_AnchiLin.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.geometry.center(); // center here
        child.material.metalness = 0;
        child.name = "Necklace_AnchiLin";
        child.userData = { URL: "https://raxal-mu.glitch.me/" };
        child.page = { URL: "pages/AnchiLin.html" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(1, 1, 1); // scale here
    model.position.set(80, 10, -100); // position here
    scene.add(model);
  });

  //武子揚
  loader.load("Macy_Playboy_scene.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.material.metalness = 0.5;
        child.material.roughness = 0.0;
        child.material.envMap = scene.background;
        child.name = "Macy_Playboy_scene";
        child.page = { URL: "pages/playboy.html" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(30, 30, 30); // scale here
    model.position.set(-100, 0, -140); // position here
    scene.add(model);
  });

  //市原悅子
  loader.load("GhostPayer.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.material.metalness = 0.5;
        child.material.roughness = 0.0;
        child.material.envMap = scene.background;
        child.name = "GhostPayer";
        child.userData = { URL: "https://festdt.36q.space/" };
        child.page = { URL: "pages/Etsuko.html" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(0.5, 0.5, 0.5); // scale here
    model.position.set(0, 0, -250); // position here
    model.rotation.set(0, 0, 0); // position here
    scene.add(model);
  });
  //花形槙
  loader.load("aseptickiss.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.material.metalness = 0;
        child.name = "aseptickiss";
        child.userData = {
          URL: "https://object-storage.tyo1.conoha.io/v1/nc_df3bdbc45bc04950b558834f5728517a/unityroom_production/game/23352/webgl/play.html",
        };
        child.page = { URL: "pages/Aseptickiss.html" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(0.5, 0.5, 0.5); // scale here
    model.position.set(-100, -180, -200); // position here
    model.rotation.set(0, 0, 0); // position here
    scene.add(model);
  });
  //藤倉麻子
  loader.load("all_11.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.material.metalness = 0.5;
        child.material.roughness = 0.0;
        child.material.envMap = scene.background;
        child.name = "all_11";
        //child.userData = { URL: "" };
        child.page = { URL: "pages/Asako.html" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(1, 1, 1); // scale here
    model.position.set(-230, 20, -500); // position here
    model.rotation.set(0, 80, 0); // position here
    scene.add(model);
  });
  //sid&gery
  loader.load("linda.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.material.metalness = 0;
        child.name = "linda";
        child.userData = {
          URL: "https://sidngerigmailcom.itch.io/amysgame",
        };
        child.page = { URL: "pages/Amy.html" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(1, 1, 1); // scale here
    model.position.set(-600, 0, -650); // position here
    model.rotation.set(0, 0, 0); // position here
    scene.add(model);
  });
  //翁陳禹彤
  loader.load("blackdoorInside.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.material.metalness = 0.5;
        child.material.roughness = 0.0;
        child.material.envMap = scene.background;
        child.name = "blackdoorInside";
        child.userData = { URL: "http://www.realm-of-ember.space/" };
        child.page = { URL: "pages/Realm.html" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(10, 10, 10); // scale here
    model.position.set(500, 0, -600); // position here
    model.rotation.set(0, 230, 0); // position here
    scene.add(model);
  });
  //NAXS
  loader.load("naxs.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.name = "naxs";
        child.material.metalness = 0.3;
        child.material.roughness = 0.0;
        child.material.envMap = scene.background;
        child.material.side = THREE.DoubleSide;
        //child.userData = { URL: "" };
        child.userData = { URL: "http://id0.world" };
        child.page = { URL: "pages/Naxs.html" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(0.8, 0.8, 0.8); // scale here
    model.position.set(600, 0, 150); // position here
    model.rotation.set(0, 340, 0); // position here
    scene.add(model);
  });

  //吳
  loader.load("cubefloor.glb", (gltf) => {
    let model = gltf.scene;
    model.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.geometry.center(); // center here
        child.name = "terms";
        child.material.metalness = 0.1;
        child.material.roughness = 0.0;
        child.material.envMap = scene.background;
        child.material.side = THREE.DoubleSide;
        //child.userData = { URL: "" };
        child.page = { URL: "pages/terms.html" };
        objects.push(child);
      }
      if (child.isLight) {
        child.castShadow = true;
        child.shadow.bias = -0.003;
        child.shadow.mapSize.width = 2048;
        child.shadow.mapSize.height = 2048;
      }
    });
    model.scale.set(0.1, 0.1, 0.1); // scale here
    model.position.set(-550, 5, 50); // position here
    model.rotation.set(0, 0, 0); // position here
    scene.add(model);
  });
}

var checkDevice = function () {
  var check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);

  if (check === true) {
    var mobileMessage = document.getElementById("info");
    mobileMessage.visibility = "hidden";
    var mobileMessage = document.getElementById("mobile-message");
    mobileMessage.className += " mobile";
  }
  return check;
};

window.onload = function () {
  checkDevice();
};
if (checkDevice() === false) {
  init();
}
