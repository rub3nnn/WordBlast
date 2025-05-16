"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import Bomb from "./Bomb.jsx";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Layout } from "lucide-react";

export default function Start({
  explosionComplete,
  setExplosionComplete,
  explode,
  isSignedIn,
  hideLogo,
  setHideLogo,
  onload,
}) {
  return (
    <>
      {!explosionComplete && (
        <>
          {/* Fondo con efecto de gradiente radial */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3a0000,transparent_70%)] opacity-40"></div>

          <AnimatePresence>
            {hideLogo && (
              <>
                <motion.div
                  className="fixed inset-0 flex items-center justify-center z-30"
                  initial={{ opacity: 0, scale: 0.2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                    scale: {
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    },
                  }}
                >
                  <div className="relative w-64 h-64 md:w-96 md:h-96">
                    <img
                      src="/images/logofull.png"
                      alt="Word Blast"
                      fill
                      style={{ objectFit: "contain" }}
                      priority
                    />
                  </div>
                </motion.div>

                {/* Esto evita el scroll en el body */}
                <style jsx global>{`
                  body {
                    overflow: hidden !important;
                  }
                `}</style>
              </>
            )}
          </AnimatePresence>

          {/* Canvas que ocupa toda la pantalla */}
          <div className="absolute inset-0">
            <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
              {/* Iluminación mejorada */}
              <ambientLight intensity={0.4} />
              <spotLight
                position={[5, 5, 5]}
                angle={0.3}
                penumbra={1}
                intensity={1.5}
                castShadow
                color="#ff4500"
              />
              <spotLight
                position={[-5, 5, 5]}
                angle={0.3}
                penumbra={1}
                intensity={1.2}
                castShadow
                color="#4169e1"
              />
              <pointLight
                position={[0, 3, 0]}
                intensity={0.8}
                color="#ff8c00"
              />
              <pointLight
                position={[0, -3, 0]}
                intensity={0.5}
                color="#ff4500"
              />

              {/* Bomba centrada */}
              <Bomb
                isExploding={explode}
                position={[0, 0, 0]}
                scale={20}
                onload={onload}
              />

              <Environment preset="night" />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate={true}
                autoRotateSpeed={1}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 1.5}
              />
            </Canvas>
          </div>
        </>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none">
        {/* Logo flotante */}
        {!isSignedIn && (
          <motion.div
            className="mb-16 w-full max-w-md md:max-w-lg"
            initial={{ y: 0 }}
            animate={{
              y: [0, -15, 0],
              filter: [
                "drop-shadow(0 0 0px rgba(255,69,0,0.5))",
                "drop-shadow(0 0 20px rgba(255,69,0,0.8))",
                "drop-shadow(0 0 0px rgba(255,69,0,0.5))",
              ],
            }}
            transition={{
              y: {
                repeat: Number.POSITIVE_INFINITY,
                duration: 3,
                ease: "easeInOut",
              },
              filter: {
                repeat: Number.POSITIVE_INFINITY,
                duration: 3,
                ease: "easeInOut",
              },
            }}
          >
            <img
              src="/images/text.png"
              alt="Word Blast"
              className=" h-50 mx-auto"
            />
          </motion.div>
        )}

        {/* Botón neobrutalista */}
        {!isSignedIn && (
          <SignInButton
            oauthFlow="popup"
            mode="modal"
            fallbackRedirectUrl={"/?recent=true"}
          >
            <motion.button
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{
                scale: 0.95,
                duration: 0.2,
              }}
              className="w-70 pointer-events-auto cursor-pointer mt-8 group text-[#ef3b2f] border border-[#ef3b2f] border-b-4 font-medium overflow-hidden relative px-4 py-2 rounded-md hover:brightness-150 hover:border-t-4 hover:border-b active:opacity-75 outline-none duration-300 group"
            >
              <span className="bg-[#ef3b2f]-400 font-black absolute -top-[150%] left-0 inline-flex w-100 h-[5px] rounded-md opacity-50 group-hover:top-[150%] duration-500 shadow-[0_0_10px_10px_rgba(0,0,0,0.3)]"></span>
              JUGAR
            </motion.button>
          </SignInButton>
        )}
      </div>
    </>
  );
}
