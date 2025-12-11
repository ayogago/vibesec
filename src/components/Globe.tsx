'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Generate random points on a sphere
function generateSpherePoints(count: number, radius: number) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

// Generate connection lines between nearby points
function generateConnections(points: THREE.Vector3[], maxDistance: number) {
  const connections: [THREE.Vector3, THREE.Vector3][] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const distance = points[i].distanceTo(points[j]);
      if (distance < maxDistance && connections.length < 40) {
        connections.push([points[i], points[j]]);
      }
    }
  }
  return connections;
}

// Animated wireframe globe
function WireframeGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.02) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial
        color="#3b82f6"
        wireframe
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

// Inner glowing sphere
function InnerGlow() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.02;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.8, 32, 32]} />
      <meshBasicMaterial
        color="#6366f1"
        transparent
        opacity={0.05}
      />
    </mesh>
  );
}

// Floating particles around the globe
function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const radius = 2.5 + Math.random() * 1.5;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <Points ref={pointsRef} positions={particlePositions} stride={3}>
      <PointMaterial
        transparent
        color="#818cf8"
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

// Network nodes on the globe
function NetworkNodes() {
  const groupRef = useRef<THREE.Group>(null);

  const { points, connections } = useMemo(() => {
    const pts = generateSpherePoints(25, 2.05);
    const conns = generateConnections(pts, 1.2);
    return { points: pts, connections: conns };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.02) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      {points.map((point, i) => (
        <mesh key={`node-${i}`} position={point}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Connection lines */}
      {connections.map((conn, i) => (
        <Line
          key={`line-${i}`}
          points={[conn[0], conn[1]]}
          color="#22d3ee"
          lineWidth={0.5}
          transparent
          opacity={0.3}
        />
      ))}
    </group>
  );
}

// Outer ring
function OuterRing() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.PI / 2;
      meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[2.8, 0.01, 16, 100]} />
      <meshBasicMaterial color="#a855f7" transparent opacity={0.4} />
    </mesh>
  );
}

// Second outer ring at different angle
function OuterRing2() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.PI / 3;
      meshRef.current.rotation.y = Math.PI / 6;
      meshRef.current.rotation.z = -state.clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[3.0, 0.008, 16, 100]} />
      <meshBasicMaterial color="#6366f1" transparent opacity={0.3} />
    </mesh>
  );
}

// Data flow particles
function DataFlowParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const radius = 2.8;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x = Math.PI / 2;
      pointsRef.current.rotation.z = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Points ref={pointsRef} positions={particlePositions} stride={3}>
      <PointMaterial
        transparent
        color="#22d3ee"
        size={0.04}
        sizeAttenuation
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  );
}

// Main scene component
function GlobeScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      <WireframeGlobe />
      <InnerGlow />
      <NetworkNodes />
      <FloatingParticles />
      <OuterRing />
      <OuterRing2 />
      <DataFlowParticles />
    </>
  );
}

// Globe component with Canvas
export function Globe({ className = '' }: { className?: string }) {
  return (
    <div className={`${className}`}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <GlobeScene />
      </Canvas>
    </div>
  );
}

export default Globe;
