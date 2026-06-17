"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Ball() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.5;
    meshRef.current.rotation.y += delta * 0.8;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2, 2]} />
      <meshStandardMaterial 
        color="#FF004D" 
        wireframe={true} 
        emissive="#FF004D"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export default function SoccerBall() {
  return (
    <div style={{ width: "100%", height: "300px" }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Ball />
      </Canvas>
    </div>
  );
}
