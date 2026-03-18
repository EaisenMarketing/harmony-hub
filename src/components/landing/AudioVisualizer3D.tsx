import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function EqualizerBars() {
  const groupRef = useRef<THREE.Group>(null);
  const barsCount = 64;
  
  const bars = useMemo(() => {
    return Array.from({ length: barsCount }, (_, i) => {
      const angle = (i / barsCount) * Math.PI * 2;
      const radius = 3;
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        phase: i * 0.15,
        speed: 0.8 + Math.random() * 1.2,
        maxHeight: 0.5 + Math.random() * 2.5,
      };
    });
  }, []);

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.05;
    }
    bars.forEach((bar, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      const height = (Math.sin(t * bar.speed + bar.phase) * 0.5 + 0.5) * bar.maxHeight + 0.1;
      mesh.scale.y = height;
      mesh.position.y = height / 2;
      
      // Color shift
      const hue = (i / barsCount + t * 0.05) % 1;
      (mesh.material as THREE.MeshStandardMaterial).color.setHSL(hue, 0.8, 0.5);
      (mesh.material as THREE.MeshStandardMaterial).emissive.setHSL(hue, 0.9, 0.15);
    });
  });

  return (
    <group ref={groupRef}>
      {bars.map((bar, i) => (
        <mesh
          key={i}
          ref={el => { meshRefs.current[i] = el; }}
          position={[bar.x, 0, bar.z]}
          rotation={[0, Math.atan2(bar.z, bar.x), 0]}
        >
          <boxGeometry args={[0.08, 1, 0.08]} />
          <meshStandardMaterial
            color="#4F46E5"
            emissive="#4F46E5"
            emissiveIntensity={0.3}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function SoundWaveRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const ringRef3 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    [ringRef, ringRef2, ringRef3].forEach((ref, i) => {
      if (!ref.current) return;
      const scale = 1 + Math.sin(t * 0.5 + i * 2) * 0.3;
      ref.current.scale.set(scale, scale, 1);
      ref.current.rotation.x = Math.PI / 2;
      ref.current.rotation.z = t * 0.1 * (i % 2 === 0 ? 1 : -1);
      (ref.current.material as THREE.MeshStandardMaterial).opacity = 0.15 + Math.sin(t + i) * 0.1;
    });
  });

  return (
    <>
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <torusGeometry args={[4.5, 0.02, 16, 100]} />
        <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.5} transparent opacity={0.2} />
      </mesh>
      <mesh ref={ringRef2} position={[0, 0, 0]}>
        <torusGeometry args={[5, 0.015, 16, 100]} />
        <meshStandardMaterial color="#4F46E5" emissive="#4F46E5" emissiveIntensity={0.5} transparent opacity={0.15} />
      </mesh>
      <mesh ref={ringRef3} position={[0, 0, 0]}>
        <torusGeometry args={[5.5, 0.01, 16, 100]} />
        <meshStandardMaterial color="#A855F7" emissive="#A855F7" emissiveIntensity={0.5} transparent opacity={0.1} />
      </mesh>
    </>
  );
}

function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 200;

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
      speeds[i] = 0.2 + Math.random() * 0.8;
    }
    return { positions, speeds };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(t * speeds[i] + i) * 0.003;
      pos[i * 3] += Math.cos(t * speeds[i] * 0.5 + i) * 0.002;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#A855F7"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export function AudioVisualizer3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 4, 8], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#4F46E5" />
        <pointLight position={[-5, 3, -5]} intensity={0.6} color="#10B981" />
        <pointLight position={[0, -3, 0]} intensity={0.4} color="#A855F7" />
        
        <EqualizerBars />
        <SoundWaveRing />
        <FloatingParticles />
      </Canvas>
    </div>
  );
}
