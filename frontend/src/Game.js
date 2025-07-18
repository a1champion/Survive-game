import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

const Game = () => {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState({
    resources: { wood: 0, meat: 0, money: 50 },
    buildings: [],
    health: 100,
    inventory: { axe: true, sword: true }
  });
  
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animationIdRef = useRef(null);
  const playerRef = useRef(null);
  const keysRef = useRef({});
  const bearsRef = useRef([]);
  const treesRef = useRef([]);
  const butcherRef = useRef(null);
  const uiUpdateRef = useRef(null);

  // Player movement and game state
  const playerStateRef = useRef({
    position: { x: 0, z: 0 },
    rotation: 0,
    isMoving: false,
    isAttacking: false,
    targetBear: null,
    targetTree: null
  });

  useEffect(() => {
    initializeGame();
    setupKeyboardControls();
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  const initializeGame = () => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 15, 100);
    sceneRef.current = scene;

    // Camera setup (third person view)
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup - full screen
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
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
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3A5F3A });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create player
    createPlayer();
    
    // Create world objects
    createTrees();
    createBears();
    createButcher();
    createBuildings();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Start game loop
    gameLoop();
  };

  const createPlayer = () => {
    const playerGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x0066CC });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    playerGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    playerGroup.add(head);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 1.1, 0);
    leftArm.castShadow = true;
    playerGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 1.1, 0);
    rightArm.castShadow = true;
    playerGroup.add(rightArm);

    // Weapon (axe)
    const axeHandleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const axeHandleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const axeHandle = new THREE.Mesh(axeHandleGeometry, axeHandleMaterial);
    axeHandle.position.set(0.6, 1.1, 0);
    axeHandle.rotation.z = Math.PI / 4;
    playerGroup.add(axeHandle);

    const axeBladeGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.02);
    const axeBladeMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
    const axeBlade = new THREE.Mesh(axeBladeGeometry, axeBladeMaterial);
    axeBlade.position.set(0.75, 1.35, 0);
    axeBlade.rotation.z = Math.PI / 4;
    playerGroup.add(axeBlade);

    playerGroup.position.set(0, 0, 0);
    sceneRef.current.add(playerGroup);
    playerRef.current = playerGroup;
  };

  const createTrees = () => {
    const treePositions = [
      { x: 10, z: 5 }, { x: -8, z: 12 }, { x: 15, z: -10 }, { x: -12, z: -8 },
      { x: 5, z: 15 }, { x: -15, z: 3 }, { x: 8, z: -15 }, { x: -5, z: -12 },
      { x: 12, z: 8 }, { x: -10, z: 15 }, { x: 18, z: -5 }, { x: -18, z: -2 }
    ];

    treePositions.forEach((pos, index) => {
      const treeGroup = new THREE.Group();
      
      // Trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1.5;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Leaves
      const leavesGeometry = new THREE.ConeGeometry(1.8, 4, 8);
      const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.y = 4.5;
      leaves.castShadow = true;
      treeGroup.add(leaves);

      treeGroup.position.set(pos.x, 0, pos.z);
      treeGroup.userData = { type: 'tree', health: 100, id: index };
      sceneRef.current.add(treeGroup);
      treesRef.current.push(treeGroup);
    });
  };

  const createBears = () => {
    const bearPositions = [
      { x: 20, z: 10 }, { x: -15, z: 20 }, { x: 25, z: -15 }, { x: -25, z: -10 }
    ];

    bearPositions.forEach((pos, index) => {
      const bearGroup = new THREE.Group();
      
      // Body
      const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.6;
      body.castShadow = true;
      bearGroup.add(body);

      // Head
      const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.4;
      head.castShadow = true;
      bearGroup.add(head);

      // Legs
      const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8);
      const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
      
      const positions = [[-0.4, 0.3, 0.3], [0.4, 0.3, 0.3], [-0.4, 0.3, -0.3], [0.4, 0.3, -0.3]];
      positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        bearGroup.add(leg);
      });

      bearGroup.position.set(pos.x, 0, pos.z);
      bearGroup.userData = { 
        type: 'bear', 
        health: 150, 
        id: index,
        aiState: 'wander',
        lastAI: Date.now(),
        targetPosition: { x: pos.x, z: pos.z }
      };
      sceneRef.current.add(bearGroup);
      bearsRef.current.push(bearGroup);
    });
  };

  const createButcher = () => {
    const butcherGroup = new THREE.Group();
    
    // Building
    const buildingGeometry = new THREE.BoxGeometry(3, 2.5, 3);
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 1.25;
    building.castShadow = true;
    butcherGroup.add(building);

    // Roof
    const roofGeometry = new THREE.ConeGeometry(2.5, 1.2, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3.1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    butcherGroup.add(roof);

    // Sign
    const signGeometry = new THREE.PlaneGeometry(1.5, 0.8);
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 2, 1.6);
    butcherGroup.add(sign);

    butcherGroup.position.set(-10, 0, -10);
    butcherGroup.userData = { type: 'butcher' };
    sceneRef.current.add(butcherGroup);
    butcherRef.current = butcherGroup;
  };

  const createBuildings = () => {
    // Create a small village area
    const buildingPositions = [
      { x: 0, z: -20, type: 'shop' },
      { x: 10, z: -20, type: 'house' },
      { x: -10, z: -20, type: 'house' }
    ];

    buildingPositions.forEach(pos => {
      const buildingGroup = new THREE.Group();
      
      const buildingGeometry = new THREE.BoxGeometry(2.5, 2, 2.5);
      const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.y = 1;
      building.castShadow = true;
      buildingGroup.add(building);

      const roofGeometry = new THREE.ConeGeometry(2, 1, 4);
      const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 2.5;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      buildingGroup.add(roof);

      buildingGroup.position.set(pos.x, 0, pos.z);
      buildingGroup.userData = { type: pos.type };
      sceneRef.current.add(buildingGroup);
    });
  };

  const setupKeyboardControls = () => {
    const handleKeyDown = (event) => {
      keysRef.current[event.key.toLowerCase()] = true;
      
      // Attack key
      if (event.key.toLowerCase() === ' ') {
        event.preventDefault();
        playerStateRef.current.isAttacking = true;
      }
    };

    const handleKeyUp = (event) => {
      keysRef.current[event.key.toLowerCase()] = false;
      
      if (event.key.toLowerCase() === ' ') {
        playerStateRef.current.isAttacking = false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  };

  const updatePlayer = () => {
    if (!playerRef.current) return;

    const moveSpeed = 0.15;
    const keys = keysRef.current;
    let moved = false;

    // Movement
    if (keys['w'] || keys['arrowup']) {
      playerStateRef.current.position.z -= moveSpeed;
      moved = true;
    }
    if (keys['s'] || keys['arrowdown']) {
      playerStateRef.current.position.z += moveSpeed;
      moved = true;
    }
    if (keys['a'] || keys['arrowleft']) {
      playerStateRef.current.position.x -= moveSpeed;
      moved = true;
    }
    if (keys['d'] || keys['arrowright']) {
      playerStateRef.current.position.x += moveSpeed;
      moved = true;
    }

    // Update player position
    playerRef.current.position.x = playerStateRef.current.position.x;
    playerRef.current.position.z = playerStateRef.current.position.z;

    // Update camera to follow player
    if (cameraRef.current) {
      cameraRef.current.position.x = playerStateRef.current.position.x;
      cameraRef.current.position.z = playerStateRef.current.position.z + 8;
      cameraRef.current.lookAt(playerStateRef.current.position.x, 0, playerStateRef.current.position.z);
    }

    playerStateRef.current.isMoving = moved;
  };

  const updateBears = () => {
    const currentTime = Date.now();
    
    bearsRef.current.forEach(bear => {
      if (!bear.userData) return;

      const bearData = bear.userData;
      const playerPos = playerStateRef.current.position;
      const bearPos = bear.position;
      
      // Distance to player
      const distanceToPlayer = Math.sqrt(
        Math.pow(playerPos.x - bearPos.x, 2) + 
        Math.pow(playerPos.z - bearPos.z, 2)
      );

      // AI behavior
      if (currentTime - bearData.lastAI > 100) {
        if (distanceToPlayer < 8) {
          // Chase player
          bearData.aiState = 'chase';
          const direction = {
            x: (playerPos.x - bearPos.x) / distanceToPlayer,
            z: (playerPos.z - bearPos.z) / distanceToPlayer
          };
          
          bear.position.x += direction.x * 0.08;
          bear.position.z += direction.z * 0.08;
          
          // Look at player
          bear.lookAt(playerPos.x, bear.position.y, playerPos.z);
          
        } else if (bearData.aiState === 'wander') {
          // Random movement
          const moveChance = Math.random();
          if (moveChance < 0.02) {
            bearData.targetPosition = {
              x: bearPos.x + (Math.random() - 0.5) * 10,
              z: bearPos.z + (Math.random() - 0.5) * 10
            };
          }
          
          // Move towards target
          const targetDistance = Math.sqrt(
            Math.pow(bearData.targetPosition.x - bearPos.x, 2) + 
            Math.pow(bearData.targetPosition.z - bearPos.z, 2)
          );
          
          if (targetDistance > 0.5) {
            const direction = {
              x: (bearData.targetPosition.x - bearPos.x) / targetDistance,
              z: (bearData.targetPosition.z - bearPos.z) / targetDistance
            };
            
            bear.position.x += direction.x * 0.03;
            bear.position.z += direction.z * 0.03;
          }
        }
        
        bearData.lastAI = currentTime;
      }
    });
  };

  const handleAttack = () => {
    if (!playerStateRef.current.isAttacking) return;

    const playerPos = playerStateRef.current.position;
    const attackRange = 2;

    // Check for bears in range
    bearsRef.current.forEach(bear => {
      if (!bear.userData) return;

      const bearPos = bear.position;
      const distance = Math.sqrt(
        Math.pow(playerPos.x - bearPos.x, 2) + 
        Math.pow(playerPos.z - bearPos.z, 2)
      );

      if (distance < attackRange) {
        bear.userData.health -= 25;
        
        if (bear.userData.health <= 0) {
          // Bear killed - give meat
          sceneRef.current.remove(bear);
          bearsRef.current = bearsRef.current.filter(b => b !== bear);
          
          setGameState(prev => ({
            ...prev,
            resources: {
              ...prev.resources,
              meat: prev.resources.meat + 1
            }
          }));
        }
      }
    });

    // Check for trees in range
    treesRef.current.forEach(tree => {
      if (!tree.userData) return;

      const treePos = tree.position;
      const distance = Math.sqrt(
        Math.pow(playerPos.x - treePos.x, 2) + 
        Math.pow(playerPos.z - treePos.z, 2)
      );

      if (distance < attackRange) {
        tree.userData.health -= 30;
        
        if (tree.userData.health <= 0) {
          // Tree cut down - give wood
          sceneRef.current.remove(tree);
          treesRef.current = treesRef.current.filter(t => t !== tree);
          
          setGameState(prev => ({
            ...prev,
            resources: {
              ...prev.resources,
              wood: prev.resources.wood + 1
            }
          }));
        }
      }
    });
  };

  const checkButcherInteraction = () => {
    if (!butcherRef.current) return;

    const playerPos = playerStateRef.current.position;
    const butcherPos = butcherRef.current.position;
    const distance = Math.sqrt(
      Math.pow(playerPos.x - butcherPos.x, 2) + 
      Math.pow(playerPos.z - butcherPos.z, 2)
    );

    if (distance < 4 && keysRef.current['e']) {
      // Sell meat for money
      setGameState(prev => {
        if (prev.resources.meat > 0) {
          return {
            ...prev,
            resources: {
              ...prev.resources,
              meat: prev.resources.meat - 1,
              money: prev.resources.money + 10
            }
          };
        }
        return prev;
      });
    }
  };

  const gameLoop = () => {
    updatePlayer();
    updateBears();
    handleAttack();
    checkButcherInteraction();
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    animationIdRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
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
        fontSize: '14px',
        zIndex: 1000
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#4A90E2' }}>❄️ Survival Action Game</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div>🪵 Wood: {gameState.resources.wood}</div>
          <div>🥩 Meat: {gameState.resources.meat}</div>
          <div>💰 Money: ${gameState.resources.money}</div>
          <div>❤️ Health: {gameState.health}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🎮 Controls</h3>
        <div>🔄 WASD/Arrow Keys: Move</div>
        <div>⚔️ SPACE: Attack (cut trees/kill bears)</div>
        <div>🏪 E: Interact with Butcher</div>
        <div>🎯 Get close to objects to interact</div>
      </div>

      {/* Action Instructions */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>📋 Objectives</h3>
        <div>🌲 Cut down trees for wood</div>
        <div>🐻 Kill bears for meat</div>
        <div>🏪 Sell meat to butcher for money</div>
        <div>🏗️ Use money to build and buy</div>
      </div>

      {/* Building Shop */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🏪 Shop</h3>
        <button
          style={{
            padding: '8px 12px',
            backgroundColor: gameState.resources.money >= 50 ? '#4CAF50' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: gameState.resources.money >= 50 ? 'pointer' : 'not-allowed',
            fontSize: '11px',
            marginBottom: '5px',
            width: '100%'
          }}
          disabled={gameState.resources.money < 50}
          onClick={() => {
            if (gameState.resources.money >= 50) {
              setGameState(prev => ({
                ...prev,
                resources: {
                  ...prev.resources,
                  money: prev.resources.money - 50
                },
                buildings: [...prev.buildings, { type: 'house', id: Date.now() }]
              }));
            }
          }}
        >
          🏠 House ($50)
        </button>
        <button
          style={{
            padding: '8px 12px',
            backgroundColor: gameState.resources.money >= 30 ? '#4CAF50' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: gameState.resources.money >= 30 ? 'pointer' : 'not-allowed',
            fontSize: '11px',
            width: '100%'
          }}
          disabled={gameState.resources.money < 30}
          onClick={() => {
            if (gameState.resources.money >= 30) {
              setGameState(prev => ({
                ...prev,
                resources: {
                  ...prev.resources,
                  money: prev.resources.money - 30
                },
                buildings: [...prev.buildings, { type: 'storage', id: Date.now() }]
              }));
            }
          }}
        >
          📦 Storage ($30)
        </button>
      </div>
    </div>
  );
};

export default Game;