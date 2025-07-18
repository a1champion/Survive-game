import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import GameLogic from './GameLogic';
import ModelManager from './ModelManager';
import GameControls from './GameControls';

const Game = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const gameLogicRef = useRef(null);
  const modelManagerRef = useRef(null);
  const controlsRef = useRef(null);
  const animationRef = useRef(null);
  const workersRef = useRef([]);
  
  const [gameState, setGameState] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildMode, setBuildMode] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize game logic
    gameLogicRef.current = new GameLogic();
    setGameState(gameLogicRef.current.getState());

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);
    sceneRef.current = scene;

    // Camera setup (isometric view)
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Initialize model manager
    modelManagerRef.current = new ModelManager(scene);

    // Initialize controls
    controlsRef.current = new GameControls(camera, renderer, gameLogicRef.current, modelManagerRef.current);
    controlsRef.current.setGround(ground);

    // Create initial scene
    createInitialScene();

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Update game logic
      gameLogicRef.current.update();
      
      // Update worker positions
      updateWorkers();
      
      // Update controls
      controlsRef.current.update();
      
      // Update game state
      setGameState(gameLogicRef.current.getState());
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const createInitialScene = () => {
    const scene = sceneRef.current;
    const modelManager = modelManagerRef.current;
    
    // Create initial campfire
    const campfire = modelManager.createCampfire({ x: 0, z: 0 });
    campfire.userData = { type: 'campfire' };
    
    // Create some trees
    const treePositions = [
      { x: 8, z: 3 }, { x: -6, z: 7 }, { x: 5, z: -8 },
      { x: -10, z: -2 }, { x: 3, z: 9 }, { x: -7, z: -6 },
      { x: 9, z: -4 }, { x: -3, z: 8 }
    ];
    
    treePositions.forEach(pos => {
      const tree = modelManager.createTree(pos);
      tree.userData = { type: 'tree' };
    });
    
    // Create initial workers
    const initialWorkers = gameLogicRef.current.getState().workers;
    initialWorkers.forEach(worker => {
      const workerModel = modelManager.createWorker(worker.position);
      workerModel.userData = { workerId: worker.id, type: 'worker' };
      workersRef.current.push({ id: worker.id, model: workerModel });
    });
    
    // Create initial lumberjack area
    const lumberjackArea = modelManager.createLumberjackArea({ x: 4, z: 4 });
    lumberjackArea.userData = { type: 'lumberjack' };
    
    // Create initial worker station
    const workerStation = modelManager.createWorkerStation({ x: -4, z: -4 });
    workerStation.userData = { type: 'worker' };
  };

  const updateWorkers = () => {
    const currentWorkers = gameLogicRef.current.getState().workers;
    
    currentWorkers.forEach(worker => {
      const workerModel = workersRef.current.find(w => w.id === worker.id);
      if (workerModel) {
        workerModel.model.position.x = worker.position.x;
        workerModel.model.position.z = worker.position.z;
      }
    });
  };

  const handleBuildingSelect = (buildingType) => {
    setBuildMode(buildingType);
    controlsRef.current.setBuildMode(buildingType);
  };

  const handleResourceGather = (resourceType) => {
    gameLogicRef.current.gatherResource(resourceType, 5);
  };

  const canBuild = (buildingType) => {
    return gameLogicRef.current.canBuild(buildingType);
  };

  const getBuildingCost = (buildingType) => {
    return gameLogicRef.current.buildingTypes[buildingType]?.cost || {};
  };

  if (!gameState) {
    return <div>Loading...</div>;
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
        
        {Object.entries(gameLogicRef.current.buildingTypes).map(([type, info]) => {
          const cost = getBuildingCost(type);
          const affordable = canBuild(type);
          
          return (
            <button
              key={type}
              onClick={() => handleBuildingSelect(type)}
              style={{
                padding: '8px 12px',
                backgroundColor: affordable ? '#4CAF50' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: affordable ? 'pointer' : 'not-allowed',
                fontSize: '12px',
                textAlign: 'left'
              }}
              disabled={!affordable}
            >
              <div>{info.name}</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                Cost: {Object.entries(cost).map(([res, amount]) => `${amount} ${res}`).join(', ')}
              </div>
            </button>
          );
        })}
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
          <li>🎯 Click buildings to select them</li>
          <li>🏗️ Select building type, then click to place</li>
          <li>🖱️ Right-click to cancel build mode</li>
          <li>⚙️ Mouse wheel to zoom</li>
          <li>⚒️ Use gather buttons for quick resources</li>
        </ul>
      </div>

      {/* Build Mode Indicator */}
      {buildMode && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontFamily: 'Arial, sans-serif',
          pointerEvents: 'none'
        }}>
          Building: {gameLogicRef.current.buildingTypes[buildMode].name}
          <br />
          <small>Left-click to place, Right-click to cancel</small>
        </div>
      )}
    </div>
  );
};

export default Game;