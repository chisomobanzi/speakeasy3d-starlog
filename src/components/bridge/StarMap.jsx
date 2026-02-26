import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useBridgeStore } from '../../stores/bridgeStore';
import { starMapNodes, starMapEdges } from '../../data/demoCampaign';

// ============================================================================
// Star Map Node (3D sphere with glow)
// ============================================================================

function MapNode({ node, isCurrent, isVisited, onClick }) {
  const meshRef = useRef();
  const glowRef = useRef();

  const color = useMemo(() => {
    if (isCurrent) return '#F59E0B';
    if (isVisited) return '#06B6D4';
    return '#334155';
  }, [isCurrent, isVisited]);

  const typeIcon = useMemo(() => {
    switch (node.type) {
      case 'boss': return '!';
      case 'side_quest': return '?';
      case 'rest': return '~';
      default: return '';
    }
  }, [node.type]);

  useFrame((_, delta) => {
    if (meshRef.current && isCurrent) {
      meshRef.current.rotation.y += delta * 0.5;
    }
    if (glowRef.current && isCurrent) {
      const scale = 1 + Math.sin(Date.now() * 0.003) * 0.15;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={node.position}>
      {/* Glow sphere */}
      {(isCurrent || isVisited) && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isCurrent ? 0.15 : 0.06}
          />
        </mesh>
      )}

      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(node); }}
        onPointerOver={(e) => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { document.body.style.cursor = 'default'; }}
      >
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCurrent ? 0.8 : isVisited ? 0.3 : 0.05}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, -0.45, 0]}
        fontSize={0.22}
        color={isVisited || isCurrent ? '#F1F5F9' : '#64748B'}
        anchorX="center"
        anchorY="top"
        font="/fonts/chakra-petch.woff"
        outlineWidth={0.01}
        outlineColor="#0A0E1A"
      >
        {node.label}
      </Text>

      {/* Subtitle */}
      <Text
        position={[0, -0.7, 0]}
        fontSize={0.13}
        color="#64748B"
        anchorX="center"
        anchorY="top"
        outlineWidth={0.008}
        outlineColor="#0A0E1A"
      >
        {node.subtitle}
      </Text>
    </group>
  );
}

// ============================================================================
// Edges between nodes
// ============================================================================

function MapEdge({ from, to, visited }) {
  const fromNode = starMapNodes.find((n) => n.id === from);
  const toNode = starMapNodes.find((n) => n.id === to);
  if (!fromNode || !toNode) return null;

  return (
    <Line
      points={[fromNode.position, toNode.position]}
      color={visited ? '#06B6D4' : '#334155'}
      lineWidth={visited ? 2 : 1}
      transparent
      opacity={visited ? 0.5 : 0.2}
      dashed={!visited}
      dashSize={0.3}
      gapSize={0.15}
    />
  );
}

// ============================================================================
// Background stars (inside the Three.js scene)
// ============================================================================

function BackgroundStars() {
  const positions = useMemo(() => {
    const arr = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={600}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#94A3B8" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// ============================================================================
// Scene wrapper
// ============================================================================

function StarMapScene({ onSelectNode }) {
  const currentNodeId = useBridgeStore((s) => s.currentNodeId);
  const visitedNodes = useBridgeStore((s) => s.visitedNodes);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 5]} intensity={0.8} color="#F59E0B" />
      <pointLight position={[-3, -2, 3]} intensity={0.4} color="#06B6D4" />

      <BackgroundStars />

      {/* Edges */}
      {starMapEdges.map((edge) => (
        <MapEdge
          key={`${edge.from}-${edge.to}`}
          from={edge.from}
          to={edge.to}
          visited={visitedNodes.includes(edge.from) && visitedNodes.includes(edge.to)}
        />
      ))}

      {/* Nodes */}
      {starMapNodes.map((node) => (
        <MapNode
          key={node.id}
          node={node}
          isCurrent={node.id === currentNodeId}
          isVisited={visitedNodes.includes(node.id)}
          onClick={onSelectNode}
        />
      ))}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={15}
        autoRotate
        autoRotateSpeed={0.3}
        target={[0.5, 0, 0]}
      />
    </>
  );
}

// ============================================================================
// Exported component
// ============================================================================

export default function StarMap() {
  const enterDestination = useBridgeStore((s) => s.enterDestination);
  const selectNode = useBridgeStore((s) => s.selectNode);
  const setScreen = useBridgeStore((s) => s.setScreen);

  const handleSelectNode = (node) => {
    selectNode(node.id);
    if (node.destinationId) {
      // Brief delay for visual feedback, then enter
      setTimeout(() => {
        enterDestination(node.destinationId);
      }, 600);
    }
  };

  return (
    <div className="absolute inset-0" style={{ background: 'var(--bg-deep)' }}>
      {/* Title overlay */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 text-center"
        style={{ zIndex: 10, fontFamily: 'var(--font-display)' }}
      >
        <div
          className="text-2xl font-bold tracking-wider bridge-text-glow-cyan"
          style={{ color: 'var(--cyan)' }}
        >
          Star Map
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
          Select a destination
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <StarMapScene onSelectNode={handleSelectNode} />
      </Canvas>
    </div>
  );
}
