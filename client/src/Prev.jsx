import { AnimatePresence } from "framer-motion";
import App from "./App.jsx";
import Start from "./Start.jsx";
import { use, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import Loader from "./Loader.jsx";

export default function Prev() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [startsSignedOut, setStartsSignedOut] = useState(false);
  const [explode, setExplode] = useState(false);
  const [alreadyChecked, setAlreadyChecked] = useState(false);
  const [hideLogo, setHideLogo] = useState(false);
  const queryParams = new URLSearchParams(window.location.search);
  const [isLoading, setIsLoading] = useState(true);

  const [explosionComplete, setExplosionComplete] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (queryParams.get("recent") != "true" && isSignedIn) {
        setExplosionComplete(true);
        setIsLoading(false);
      } else if (queryParams.get("recent") === "true" && isSignedIn) {
        setTimeout(() => {
          setHideLogo(true);
          setTimeout(() => {
            setExplode(true);
            setTimeout(() => {
              setHideLogo(false);
              setTimeout(() => {
                setExplosionComplete(true);
                queryParams.delete("recent");
                window.history.pushState(
                  {},
                  "",
                  window.location.pathname +
                    (queryParams.toString() ? `?${queryParams.toString()}` : "")
                );
              }, 1000);
            }, 2600);
          }, 600);
        }, 1000);
      }
    }
  }, [isSignedIn, alreadyChecked, isLoaded]);

  if (!isLoaded) {
    // Handle loading state
    return null;
  }

  return (
    <div className="min-h-dvh bg-gray-900 text-white flex items-center justify-center p-4 md:p-8">
      <div className="w-full">
        <AnimatePresence mode="wait">
          {(!isLoaded || isLoading) && <Loader />}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {!explosionComplete && (
            <Start
              explosionComplete={explosionComplete}
              setExplosionComplete={setExplosionComplete}
              isSignedIn={isSignedIn}
              explode={explode}
              hideLogo={hideLogo}
              setHideLogo={setHideLogo}
              onload={() => setIsLoading(false)}
            />
          )}
          {explosionComplete && <App />}
        </AnimatePresence>
      </div>
    </div>
  );
}
