import { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// --- 3D Components ---

const Stumps = ({ position, color = '#d4a373' }: { position: [number, number, number], color?: string }) => {
  return (
    <group position={position}>
      {[ -0.15, 0, 0.15 ].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 1, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      {/* Bails */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.35, 0.05, 0.05]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
    </group>
  );
};

const Pitch = () => {
  return (
    <group>
      {/* Main Pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[3, 24, 0.1]} />
        <meshStandardMaterial color="#e6ccb2" />
      </mesh>
      {/* Crease Lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 9]}>
        <boxGeometry args={[3, 0.1, 0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -9]}>
        <boxGeometry args={[3, 0.1, 0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
};

const Field = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <circleGeometry args={[60, 64]} />
      <meshStandardMaterial color="#4ade80" />
    </mesh>
  );
};

const Ball = ({ position }: { position: [number, number, number] }) => {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.12, 32, 32]} />
      <meshStandardMaterial color="#ef4444" roughness={0.4} />
    </mesh>
  );
};

const Batsman = ({ swing }: { swing: number }) => {
  const batGroup = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (batGroup.current) {
      // Simple swing animation logic
      // Resting position: -0.5 rad
      // Swing position: 1.5 rad
      const targetRotation = swing > 0 ? 1.5 : -0.5;
      batGroup.current.rotation.x = THREE.MathUtils.lerp(batGroup.current.rotation.x, targetRotation, 0.2);
    }
  });

  return (
    <group position={[0.5, 0, 9]}>
      {/* Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#fca5a5" />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.27, 16, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      
      {/* Bat Arm & Bat */}
      <group position={[0, 1.2, 0.2]}>
        <mesh position={[0, -0.4, 0]} rotation={[0, 0, 0.2]}>
          <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
          <meshStandardMaterial color="#fca5a5" />
        </mesh>
        <group ref={batGroup} position={[0, -0.7, 0.2]} rotation={[-0.5, 0, 0]}>
           {/* Bat Handle */}
           <mesh position={[0, 0.2, 0]}>
             <cylinderGeometry args={[0.04, 0.04, 0.4]} />
             <meshStandardMaterial color="#333" />
           </mesh>
           {/* Bat Blade */}
           <mesh position={[0, -0.4, 0.05]}>
             <boxGeometry args={[0.15, 0.8, 0.05]} />
             <meshStandardMaterial color="#d97706" />
           </mesh>
        </group>
      </group>
    </group>
  );
};

const Bowler = ({ isBowling: _isBowling }: { isBowling: boolean }) => {
  return (
    <group position={[0, 0, -9]}>
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#fca5a5" />
      </mesh>
    </group>
  );
};

// --- Main Game Scene ---
const CricketScene = ({ onScore, onWicket, gameState, setGameState }: any) => {
  const [ballPos, setBallPos] = useState<[number, number, number]>([0, 1, -9]);
  const [ballVel, setBallVel] = useState<[number, number, number]>([0, 0, 0]);
  const [swing, setSwing] = useState(0);
  
  // Game Loop
  useFrame((_state, delta) => {
    if (gameState === 'bowling') {
      setBallPos(prev => {
        let [x, y, z] = prev;
        let [vx, vy, vz] = ballVel;

        // Gravity
        vy -= 9.8 * delta;

        x += vx * delta;
        y += vy * delta;
        z += vz * delta;

        // Bounce
        if (y <= 0.12 && z < 9) {
          y = 0.12;
          vy = -vy * 0.6; // Dampen bounce
          vx = vx * 0.8;  // Friction
        }

        // Collision with Stumps (Wicket)
        if (z > 8.8 && z < 9.2 && Math.abs(x) < 0.2 && y < 1.1) {
           setGameState('wicket');
           onWicket();
           return prev;
        }

        // Passed batsman
        if (z > 12) {
           setGameState('dot');
           setTimeout(() => setGameState('waiting'), 1000);
           return prev;
        }

        return [x, y, z];
      });
    } else if (gameState === 'hit') {
       setBallPos(prev => {
        let [x, y, z] = prev;
        let [vx, vy, vz] = ballVel;
        vy -= 9.8 * delta;
        x += vx * delta;
        y += vy * delta;
        z += vz * delta;
        
        if (y < 0.12) { y = 0.12; vy = -vy * 0.5; vx *= 0.8; vz *= 0.8; }
        
        // Stop if slow
        if (Math.abs(vx) < 0.1 && Math.abs(vz) < 0.1 && y <= 0.2) {
           // Calculate runs based on distance
           const dist = Math.sqrt(x*x + (z-9)*(z-9));
           let runs = 0;
           if (dist > 40) runs = 6;
           else if (dist > 25) runs = 4;
           else if (dist > 10) runs = 2;
           else runs = 1;
           
           onScore(runs);
           setGameState('result');
           setTimeout(() => setGameState('waiting'), 2000);
        }
        
        setBallVel([vx, vy, vz]); // Update ref logic implicitly via state closure issue? 
        // Actually useFrame closure captures initial state. Need refs for mutable game state in R3F usually.
        // For simplicity in this single file, I'll use a ref for velocity.
        return [x, y, z];
       });
    }
  });

  // Refs for mutable physics state to avoid re-renders in useFrame
  const posRef = useRef(new THREE.Vector3(0, 1, -9));
  const velRef = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_state, delta) => {
    if (gameState === 'bowling') {
      velRef.current.y -= 20 * delta; // Gravity
      posRef.current.addScaledVector(velRef.current, delta);

      // Bounce
      if (posRef.current.y <= 0.12 && posRef.current.z < 9) {
        posRef.current.y = 0.12;
        velRef.current.y = -velRef.current.y * 0.7;
        velRef.current.x *= 0.8;
      }

      // Wicket
      if (posRef.current.z > 8.8 && posRef.current.z < 9.2 && Math.abs(posRef.current.x) < 0.2 && posRef.current.y < 1.1) {
        setGameState('wicket');
        onWicket();
      }
      // Dot ball
      else if (posRef.current.z > 11) {
        setGameState('dot');
        setTimeout(() => setGameState('waiting'), 1500);
      }
      
      setBallPos([posRef.current.x, posRef.current.y, posRef.current.z]);
    } 
    else if (gameState === 'hit') {
      velRef.current.y -= 25 * delta;
      posRef.current.addScaledVector(velRef.current, delta);

      if (posRef.current.y < 0.12) {
        posRef.current.y = 0.12;
        velRef.current.y = -velRef.current.y * 0.6;
        velRef.current.x *= 0.8;
        velRef.current.z *= 0.8;
      }

      // Stop condition
      if (velRef.current.length() < 1 && posRef.current.y <= 0.2) {
         const dist = Math.sqrt(posRef.current.x**2 + (posRef.current.z - 9)**2);
         let runs = 0;
         if (dist > 50) runs = 6;
         else if (dist > 30) runs = 4;
         else if (dist > 15) runs = 2;
         else runs = 1;
         onScore(runs);
         setGameState('result');
         setTimeout(() => setGameState('waiting'), 2000);
      }
      setBallPos([posRef.current.x, posRef.current.y, posRef.current.z]);
    }
  });

  const bowlBall = () => {
    // AI Logic: Randomize line and length slightly
    const targetX = (Math.random() - 0.5) * 1.5; // Line
    const speed = 15 + Math.random() * 5; // Speed
    
    posRef.current.set(0, 2.5, -9);
    // Calculate velocity to reach target near batsman
    const timeToReach = 20 / speed; // approx
    velRef.current.set(targetX / timeToReach, -2, speed); // Simple arc
    
    setGameState('bowling');
  };

  const hitBall = () => {
    if (gameState !== 'bowling') return;
    
    setSwing(1);
    setTimeout(() => setSwing(0), 300);

    // Check timing (distance to batsman)
    const distToBat = 9 - posRef.current.z;
    
    // Hit window: 0 to 2.5 units away
    if (distToBat > -1 && distToBat < 3) {
      setGameState('hit');
      
      // Shot direction based on timing
      let shotZ = 20 + Math.random() * 10;
      let shotX = (Math.random() - 0.5) * 20;
      let shotY = 10 + Math.random() * 10;

      // Perfect timing = straight drive (high Z)
      // Early/Late = miscue (X variance)
      if (distToBat < 1) { // Perfect
         shotZ = 40; shotX = (Math.random()-0.5)*5; shotY = 15;
      } else if (distToBat > 2) { // Late
         shotX = -10 - Math.random()*10; // Leg side
      }

      velRef.current.set(shotX/2, shotY/2, shotZ/2);
    }
  };

  // Expose hit function to parent via window or ref? 
  // Better: use a prop callback or context. 
  // For this simple component, let's attach it to window for the UI button to call, 
  // or just handle keypress here.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (gameState === 'waiting') bowlBall();
        else if (gameState === 'bowling') hitBall();
        else if (gameState === 'result' || gameState === 'wicket' || gameState === 'dot') setGameState('waiting');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  // Expose bowl/hit to parent for UI buttons
  useEffect(() => {
    (window as any).cricketAction = (action: string) => {
      if (action === 'bowl' && gameState === 'waiting') bowlBall();
      if (action === 'hit' && gameState === 'bowling') hitBall();
      if (action === 'reset') setGameState('waiting');
    };
  }, [gameState]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <PerspectiveCamera makeDefault position={[0, 3, 14]} fov={50} rotation={[-0.2, 0, 0]} />
      
      <Field />
      <Pitch />
      <Stumps position={[0, 0, 9]} />
      <Stumps position={[0, 0, -9]} color="#8b5cf6" /> {/* Bowler end stumps */}
      
      <Bowler isBowling={gameState === 'bowling'} />
      <Batsman swing={swing} />
      <Ball position={ballPos} />
      
      {/* Instructions Overlay in 3D space */}
      {gameState === 'waiting' && (
        <Text position={[0, 4, 5]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
          Press SPACE to Bowl
        </Text>
      )}
    </>
  );
};

// --- Wrapper Component ---
export default function Cricket3DGame({ onExit }: { onExit: () => void }) {
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [gameState, setGameState] = useState('waiting'); // waiting, bowling, hit, wicket, result, dot
  const [message, setMessage] = useState("Press Space or Click Bowl");

  useEffect(() => {
    if (gameState === 'wicket') setMessage("OUT! Clean Bowled!");
    else if (gameState === 'dot') setMessage("Dot Ball.");
    else if (gameState === 'result') setMessage("Runs Scored!");
    else if (gameState === 'bowling') setMessage("Press Space to Hit!");
    else setMessage("Press Space or Click Bowl");
  }, [gameState]);

  const handleScore = (runs: number) => {
    setScore(s => s + runs);
    setMessage(`${runs} Runs!`);
  };

  const handleWicket = () => {
    setWickets(w => w + 1);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 relative">
      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-start pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white">
          <div className="text-3xl font-black text-yellow-400">{score} <span className="text-sm text-gray-400 font-normal">RUNS</span></div>
          <div className="text-xl font-bold text-red-400">{wickets} <span className="text-sm text-gray-400 font-normal">WICKETS</span></div>
        </div>
        <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 text-white text-center">
          <div className="text-lg font-bold text-purple-400">{message}</div>
        </div>
        <button onClick={onExit} className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
          Exit
        </button>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 w-full flex justify-center gap-4 z-10 pointer-events-auto">
        {gameState === 'waiting' && (
          <button 
            onClick={() => (window as any).cricketAction('bowl')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg shadow-blue-900/50 transform transition hover:scale-105"
          >
            BOWL (Space)
          </button>
        )}
        {gameState === 'bowling' && (
          <button 
            onClick={() => (window as any).cricketAction('hit')}
            className="bg-green-600 hover:bg-green-500 text-white px-12 py-6 rounded-full text-2xl font-black shadow-lg shadow-green-900/50 transform transition hover:scale-105 animate-pulse"
          >
            HIT NOW! (Space)
          </button>
        )}
        {(gameState === 'result' || gameState === 'wicket' || gameState === 'dot') && (
          <button 
            onClick={() => (window as any).cricketAction('reset')}
            className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg"
          >
            Next Ball
          </button>
        )}
      </div>

      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]}>
        <CricketScene 
          onScore={handleScore} 
          onWicket={handleWicket} 
          gameState={gameState} 
          setGameState={setGameState} 
        />
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI/3} maxPolarAngle={Math.PI/2} />
      </Canvas>
    </div>
  );
}
