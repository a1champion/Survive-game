import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Game = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [gameState, setGameState] = useState({
    resources: { wood: 15, food: 10, workers: 1 },
    buildings: []
  });
  const [buildMode, setBuildMode] = useState(null);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    try {
      if (!mountRef.current) return;

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB);
      scene.fog = new THREE.Fog(0x87CEEB, 10, 50);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(12, 12, 12);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setPixelRatio(window.devicePixelRatio);
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(20, 20, 10);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Ground
      const groundGeometry = new THREE.PlaneGeometry(30, 30);
      const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Create initial 3D objects
      createInitialObjects(scene);

      // Start animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      // Set up mouse controls
      setupMouseControls(camera, renderer);

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing game:', error);
      setIsInitialized(true); // Show UI anyway
    }
  };

  const createInitialObjects = (scene) => {
    // Create campfire
    const campfireGroup = new THREE.Group();
    
    // Fire pit base
    const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 8);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.1;
    campfireGroup.add(base);

    // Fire
    const fireGeometry = new THREE.ConeGeometry(0.4, 1, 8);
    const fireMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.y = 0.7;
    fire.castShadow = true;
    campfireGroup.add(fire);

    campfireGroup.position.set(0, 0, 0);
    scene.add(campfireGroup);

    // Create trees
    const treePositions = [
      { x: 8, z: 3 }, { x: -6, z: 7 }, { x: 5, z: -8 },
      { x: -10, z: -2 }, { x: 3, z: 9 }, { x: -7, z: -6 }
    ];

    treePositions.forEach(pos => {
      const treeGroup = new THREE.Group();
      
      // Trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.35, 2.5, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1.25;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Leaves
      const leavesGeometry = new THREE.ConeGeometry(1.2, 2.5, 8);
      const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.y = 3.5;
      leaves.castShadow = true;
      treeGroup.add(leaves);

      treeGroup.position.set(pos.x, 0, pos.z);
      scene.add(treeGroup);
    });

    // Create worker character
    const workerGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    workerGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.25;
    head.castShadow = true;
    workerGroup.add(head);

    workerGroup.position.set(-2, 0, -2);
    scene.add(workerGroup);

    // Create initial buildings
    createWorkerStation(scene, { x: -4, z: -4 });
    createLumberjackArea(scene, { x: 4, z: 4 });
  };

  const createWorkerStation = (scene, position) => {
    const stationGroup = new THREE.Group();
    
    // Main building
    const buildingGeometry = new THREE.BoxGeometry(2.5, 2, 2.5);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 1;
    building.castShadow = true;
    stationGroup.add(building);

    // Roof
    const roofGeometry = new THREE.ConeGeometry(2, 1, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 2.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    stationGroup.add(roof);

    stationGroup.position.set(position.x, 0, position.z);
    scene.add(stationGroup);
  };

  const createLumberjackArea = (scene, position) => {
    const lumberGroup = new THREE.Group();
    
    // Tree stump
    const stumpGeometry = new THREE.CylinderGeometry(0.6, 0.7, 0.5, 8);
    const stumpMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stump = new THREE.Mesh(stumpGeometry, stumpMaterial);
    stump.position.y = 0.25;
    stump.castShadow = true;
    lumberGroup.add(stump);

    // Axe
    const axeHandleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
    const axeHandleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const axeHandle = new THREE.Mesh(axeHandleGeometry, axeHandleMaterial);
    axeHandle.position.set(0, 0.6, 0);
    axeHandle.rotation.z = Math.PI / 6;
    lumberGroup.add(axeHandle);

    const axeBladeGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.05);
    const axeBladeMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
    const axeBlade = new THREE.Mesh(axeBladeGeometry, axeBladeMaterial);
    axeBlade.position.set(0.2, 1, 0);
    axeBlade.rotation.z = Math.PI / 6;
    lumberGroup.add(axeBlade);

    // Wood pile
    for (let i = 0; i < 4; i++) {
      const logGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
      const logMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const log = new THREE.Mesh(logGeometry, logMaterial);
      log.position.set(0.8, 0.15 + i * 0.2, i * 0.4 - 0.6);
      log.rotation.z = Math.PI / 2;
      log.castShadow = true;
      lumberGroup.add(log);
    }

    lumberGroup.position.set(position.x, 0, position.z);
    scene.add(lumberGroup);
  };

  const setupMouseControls = (camera, renderer) => {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (event) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      
      spherical.theta -= deltaMove.x * 0.01;
      spherical.phi += deltaMove.y * 0.01;
      
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (event) => {
      const scale = event.deltaY > 0 ? 1.1 : 0.9;
      camera.position.multiplyScalar(scale);
      camera.position.y = Math.max(3, Math.min(25, camera.position.y));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
  };

  const handleResourceGather = (resourceType, amount = 5) => {
    setGameState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [resourceType]: prev.resources[resourceType] + amount
      }
    }));
  };

  const handleBuildingPlace = (buildingType) => {
    const costs = {
      worker: { wood: 5 },
      lumberjack: { wood: 3 },
      storage: { wood: 8 },
      campfire: { wood: 2 }
    };

    const cost = costs[buildingType];
    if (gameState.resources.wood >= cost.wood) {
      setGameState(prev => ({
        ...prev,
        resources: {
          ...prev.resources,
          wood: prev.resources.wood - cost.wood
        },
        buildings: [...prev.buildings, { type: buildingType, id: Date.now() }]
      }));
    }
  };

  if (!isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        width: '100vw', 
        height: '100vh',
        backgroundColor: '#87CEEB',
        color: 'white',
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif'
      }}>
        Loading 3D Survival Game...
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Game UI */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        minWidth: '200px'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#4A90E2' }}>❄️ Whiteout Survival</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div>🪵 Wood: {gameState.resources.wood}</div>
          <div>🍖 Food: {gameState.resources.food}</div>
          <div>👥 Workers: {gameState.resources.workers}</div>
          <div>🏠 Buildings: {gameState.buildings.length}</div>
        </div>
      </div>

      {/* Building Panel */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🏗️ Build</h3>
        
        <button
          onClick={() => handleBuildingPlace('worker')}
          style={{
            padding: '8px 12px',
            backgroundColor: gameState.resources.wood >= 5 ? '#4CAF50' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: gameState.resources.wood >= 5 ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
          disabled={gameState.resources.wood < 5}
        >
          Worker Station (5 Wood)
        </button>
        
        <button
          onClick={() => handleBuildingPlace('lumberjack')}
          style={{
            padding: '8px 12px',
            backgroundColor: gameState.resources.wood >= 3 ? '#4CAF50' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: gameState.resources.wood >= 3 ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
          disabled={gameState.resources.wood < 3}
        >
          Lumberjack Area (3 Wood)
        </button>
      </div>

      {/* Resource Gathering */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>⚒️ Gather</h3>
        <button 
          onClick={() => handleResourceGather('wood')}
          style={{
            padding: '10px 15px',
            backgroundColor: '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🪵 Gather Wood (+5)
        </button>
        <button 
          onClick={() => handleResourceGather('food')}
          style={{
            padding: '10px 15px',
            backgroundColor: '#228B22',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🍖 Gather Food (+5)
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '250px',
        fontSize: '12px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🎮 Controls</h3>
        <ul style={{ margin: 0, paddingLeft: '15px' }}>
          <li>🖱️ Drag to rotate camera</li>
          <li>⚙️ Mouse wheel to zoom</li>
          <li>🏗️ Click build buttons to place buildings</li>
          <li>⚒️ Use gather buttons to collect resources</li>
          <li>🎯 Manage your resources to survive</li>
        </ul>
      </div>
    </div>
  );
};

export default Game;