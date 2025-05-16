"use client";

import { useState, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Clone, Sphere } from "@react-three/drei";
import * as THREE from "three";

export default function Bomb({
  isExploding,
  onExplosionComplete,
  position = [0, 0, 0],
  scale = 15.5,
  onload,
}) {
  const { scene } = useGLTF("/models/bomb.glb");
  const originalModel = useRef();
  const explodedParts = useRef([]);
  const [hasExploded, setHasExploded] = useState(false);
  const { camera } = useThree();
  const explosionLight = useRef(null);
  const explosionParticles = useRef([]);
  const bombGlow = useRef();

  // Añadir efecto de brillo a la bomba
  useEffect(() => {
    if (originalModel.current) {
      // Crear un material emisivo para el brillo
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ff4500"),
        transparent: true,
        opacity: 0.2,
      });

      // Crear una esfera ligeramente más grande que la bomba para el efecto de brillo
      const glowGeometry = new THREE.SphereGeometry(0.6, 32, 32);
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);

      bombGlow.current = glowMesh;
      originalModel.current.add(glowMesh);
    }

    return () => {
      if (originalModel.current && bombGlow.current) {
        originalModel.current.remove(bombGlow.current);
      }
    };
  }, []);
  // Ejecutar onload cuando el modelo esté cargado
  useEffect(() => {
    if (originalModel.current && onload) {
      console.log("Modelo cargado");
      onload();
    }
  }, [originalModel.current, onload]);

  // Clonar el modelo original para la explosión
  useEffect(() => {
    if (isExploding && !hasExploded) {
      // Crear fragmentos para la explosión que parezcan partes de una bomba
      const fragmentCount = 35;

      // Geometrías variadas para los fragmentos
      const geometries = [
        new THREE.SphereGeometry(0.3, 8, 8), // Fragmentos esféricos
        new THREE.IcosahedronGeometry(0.25, 1), // Fragmentos poligonales
        new THREE.TetrahedronGeometry(0.2, 1), // Fragmentos triangulares
      ];

      // Crear fragmentos de la carcasa de la bomba
      for (let i = 0; i < fragmentCount; i++) {
        // Seleccionar una geometría aleatoria
        const geometryIndex = Math.floor(Math.random() * geometries.length);
        const geometry = geometries[geometryIndex];

        // Material metálico para simular la carcasa de la bomba
        const material = new THREE.MeshStandardMaterial({
          color: "#111111",
          metalness: 0.8,
          roughness: 0.2,
          flatShading: true,
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Posición inicial cerca del centro
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 0.1;

        mesh.position.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );

        // Velocidad y dirección para la explosión - más realista
        const explosionForce = 0.1 + Math.random() * 0.1;
        mesh.userData.velocity = new THREE.Vector3(
          mesh.position.x * explosionForce,
          mesh.position.y * explosionForce + 0.02, // Ligero impulso hacia arriba
          mesh.position.z * explosionForce
        );

        // Rotación aleatoria
        mesh.userData.rotationSpeed = new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        );

        // Gravedad y fricción para simulación física
        mesh.userData.gravity = 0.002;
        mesh.userData.friction = 0.98;

        explodedParts.current.push(mesh);
      }

      // Crear partículas para el humo y fuego
      const particleCount = 40;
      for (let i = 0; i < particleCount; i++) {
        const size = 0.05 + Math.random() * 0.2;
        const isFireParticle = Math.random() > 0.6;

        const material = new THREE.MeshBasicMaterial({
          color: isFireParticle
            ? new THREE.Color(Math.random() > 0.5 ? "#ff4500" : "#ff8c00")
            : new THREE.Color(Math.random() > 0.5 ? "#555555" : "#333333"),
          transparent: true,
          opacity: 0.8,
        });

        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(size, 8, 8),
          material
        );

        // Posición inicial aleatoria cerca del centro
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 0.1;

        mesh.position.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );

        // Velocidad para las partículas - más lenta para el humo
        const particleSpeed = isFireParticle ? 0.08 : 0.04;
        mesh.userData.velocity = new THREE.Vector3(
          (Math.random() - 0.5) * particleSpeed,
          Math.random() * particleSpeed + 0.02, // Más impulso hacia arriba
          (Math.random() - 0.5) * particleSpeed
        );

        // Propiedades específicas de partículas
        mesh.userData.isFireParticle = isFireParticle;
        mesh.userData.lifespan = 1 + Math.random() * 2; // Duración de la partícula
        mesh.userData.fadeSpeed = 0.01 + Math.random() * 0.02;
        mesh.userData.expansionRate = 1.01 + Math.random() * 0.02; // Crecimiento de la partícula

        explosionParticles.current.push(mesh);
      }

      setHasExploded(true);

      // Efecto de cámara para la explosión
      const initialPosition = camera.position.clone();
      const shakeIntensity = 0.3; // Aumentado para más impacto

      const shakeCamera = () => {
        camera.position.x =
          initialPosition.x + (Math.random() - 0.5) * shakeIntensity;
        camera.position.y =
          initialPosition.y + (Math.random() - 0.5) * shakeIntensity;
        camera.position.z =
          initialPosition.z + (Math.random() - 0.5) * shakeIntensity;
      };

      // Aplicar shake por 1 segundo
      const interval = setInterval(shakeCamera, 50);
      setTimeout(() => {
        clearInterval(interval);
        camera.position.copy(initialPosition);
      }, 1000);
    }
  }, [isExploding, hasExploded, camera]);

  // Animar la explosión
  useFrame(({ clock }) => {
    if (hasExploded) {
      let allPartsOutOfView = true;
      const elapsedTime = clock.getElapsedTime();

      // Actualizar fragmentos de la bomba
      explodedParts.current.forEach((part) => {
        // Aplicar gravedad
        part.userData.velocity.y -= part.userData.gravity;

        // Aplicar fricción
        part.userData.velocity.multiplyScalar(part.userData.friction);

        // Mover el fragmento según su velocidad
        part.position.add(part.userData.velocity);

        // Rotar el fragmento
        part.rotation.x += part.userData.rotationSpeed.x;
        part.rotation.y += part.userData.rotationSpeed.y;
        part.rotation.z += part.userData.rotationSpeed.z;

        // Verificar si algún fragmento sigue en vista
        if (part.position.length() < 10) {
          allPartsOutOfView = false;
        }
      });

      // Actualizar partículas de humo y fuego
      explosionParticles.current.forEach((particle) => {
        if (particle.userData.lifespan > 0) {
          // Reducir la vida de la partícula
          particle.userData.lifespan -= particle.userData.fadeSpeed;

          // Actualizar opacidad basada en la vida restante
          particle.material.opacity = Math.max(
            0,
            particle.userData.lifespan * 0.5
          );

          // Expandir la partícula
          particle.scale.multiplyScalar(particle.userData.expansionRate);

          // Mover la partícula
          particle.position.add(particle.userData.velocity);

          // Reducir velocidad con el tiempo
          particle.userData.velocity.multiplyScalar(0.98);

          // Aplicar gravedad a las partículas de humo (no a las de fuego)
          if (!particle.userData.isFireParticle) {
            particle.userData.velocity.y -= 0.0005;
          }

          allPartsOutOfView = false;
        }
      });

      // Actualizar luz de explosión
      if (explosionLight.current) {
        // Reducir la intensidad de la luz con el tiempo
        explosionLight.current.intensity = Math.max(
          0,
          5 * (1 - elapsedTime * 0.5)
        );
      }

      // Si todos los fragmentos están fuera de vista, notificar que la explosión terminó
      if (allPartsOutOfView && onExplosionComplete) {
        //onExplosionComplete();
      }
    } else if (originalModel.current) {
      // Rotar el modelo original si no ha explotado
      originalModel.current.rotation.y += 0.005;

      // Añadir palpitación suave
      const pulseFactor = Math.sin(Date.now() * 0.001) * 0.05 + 1; // Oscila entre 0.95 y 1.05
      originalModel.current.scale.set(
        scale * pulseFactor,
        scale * pulseFactor,
        scale * pulseFactor
      );

      // Animar el brillo
      if (bombGlow.current) {
        const glowPulse = Math.sin(Date.now() * 0.002) * 0.1 + 0.3; // Oscila entre 0.2 y 0.4
        bombGlow.current.material.opacity = glowPulse;

        // Escalar el brillo con la palpitación
        const glowScale = 1.1 + Math.sin(Date.now() * 0.001) * 0.1;
        bombGlow.current.scale.set(glowScale, glowScale, glowScale);
      }
    }
  });

  return (
    <group position={[position[0], position[1], position[2]]}>
      {!hasExploded && (
        <>
          <Clone
            ref={originalModel}
            object={scene}
            scale={scale}
            position={[0, 0, 0]}
          />

          {/* Luces adicionales para iluminar la bomba */}
          <pointLight
            position={[0, 0, 2]}
            intensity={0.8}
            color="#ff6000"
            distance={5}
          />
          <pointLight
            position={[2, 0, 0]}
            intensity={0.6}
            color="#ff4500"
            distance={4}
          />
          <pointLight
            position={[-2, 0, 0]}
            intensity={0.6}
            color="#ff8c00"
            distance={4}
          />
        </>
      )}

      {hasExploded && (
        <>
          {/* Luz de explosión */}
          <pointLight
            ref={explosionLight}
            position={[0, 0, 0]}
            intensity={5}
            color="#ff4500"
            distance={10}
            decay={2}
          />

          {/* Fragmentos de la bomba */}
          {explodedParts.current.map((part, index) => (
            <primitive key={`fragment-${index}`} object={part} />
          ))}

          {/* Partículas de humo y fuego */}
          {explosionParticles.current.map((particle, index) => (
            <primitive key={`particle-${index}`} object={particle} />
          ))}

          {/* Destello inicial de la explosión */}
          <Sphere args={[0.5, 16, 16]} position={[0, 0, 0]}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </Sphere>
        </>
      )}
    </group>
  );
}

// Precargar el modelo para mejorar el rendimiento
useGLTF.preload("/models/bomb.glb");
