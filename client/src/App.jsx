"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import {
  Bomb,
  Play,
  Plus,
  HelpCircle,
  Settings,
  ArrowLeft,
  Volume2,
  Volume1,
  VolumeX,
  TextCursorInput,
  Users,
  Copy,
  Check,
  Crown,
  X,
  Loader2,
  Wifi,
  WifiOff,
  Heart,
  View,
  RectangleEllipsis,
} from "lucide-react";
import { io } from "socket.io-client";
import { GameBoard } from "./GameUI.jsx";
import { GameBoardMobile } from "./GameUIMobile.jsx";
import WinnerScreen from "./winnerScreen.jsx";
import { MobileKeyboard } from "./mobile-keyboard.jsx";
import { UserButton, useUser } from "@clerk/clerk-react";

export default function HomePage() {
  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 16;
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [currentView, setCurrentView] = useState("menu"); // menu, room, create, howTo, settings
  const [toRoomCode, setToRoomCode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [volume, setVolume] = useState(50);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const [inputWord, setInputWord] = useState(""); // Para almacenar el texto
  const [mainAnimationEnd, setMainAnimationEnd] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState({ from: "", after: "" });
  const [showDialog, setShowDialog] = useState({
    show: false,
    title: "",
    message: "",
  });

  // HANDLE GAME FUNCTIONS
  const [room, setRoom] = useState({});
  const [time, setTime] = useState(10);
  const [socket, setSocket] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [player, setPlayer] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState({
    show: false,
    action: null,
    player: null,
  });
  const inputRef = useRef(null); // Referencia para el input del juego
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    roundTime: 10,
    lives: 3,
    keyboard: "default",
  });
  const { user, isSignedIn, SignIn } = useUser();

  const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }, [breakpoint]);

    return isMobile;
  };

  useEffect(() => {
    const savedVolume = Cookies.get("volume");
    if (savedVolume) {
      setVolume(Number(savedVolume));
    }
  }, []);

  useEffect(() => {
    Cookies.set("volume", volume, { expires: 30 }); // La cookie expira en 30 días
  }, [volume]);

  useEffect(() => {
    if (player?.isActive && inputRef.current) {
      setInputWord("");
      inputRef.current.focus(); // Enfocar el input cuando el jugador esté activo
    }
  }, [player?.isActive]); // Dependencia: player.isActive

  useEffect(() => {
    if (socket) {
      socket.emit("changeRoomSettings", gameSettings);
    }
  }, [gameSettings]);

  const isMobile = useIsMobile();
  const volumeRef = useRef(volume);
  // Referencias para playerId, room y player
  const playerIdRef = useRef(playerId);
  const roomRef = useRef(room);
  const playerRef = useRef(player);
  const roomCodeRef = useRef(roomCode);

  // Sincroniza las referencias con los estados actuales
  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    // Crear el socket
    const newSocket = io(import.meta.env.VITE_backendUrl, {
      auth: { room: roomCodeRef },
    });

    // Manejar el estado "connecting" cuando se inicia la conexión
    setConnectionStatus("connecting");

    // Evento cuando el socket se conecta correctamente
    newSocket.on("connect", () => {
      setConnectionStatus("connected");
      setTimeout(() => {
        setConnectionStatus("connectedhide"); // Ocultar el estado después de un tiempo
      }, 2000);
    });

    // Evento cuando el socket se desconecta
    newSocket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    // Evento cuando se reconecta después de un error
    newSocket.on("reconnect", () => {
      setConnectionStatus("connected");
      setTimeout(() => {
        setConnectionStatus("connectedhide"); // Ocultar el estado después de un tiempo
      }, 2000);
    });

    // Evento cuando se está intentando reconectar
    newSocket.on("reconnect_attempt", () => {
      setConnectionStatus("connecting");
    });

    newSocket.on("effect", (data) => {
      if (data.audio.enable) {
        var audio = new Audio(data.audio.file);
        audio.volume = volumeRef.current / 100;
        audio.play();
      }
    });

    // Manejo de otros eventos del socket (roomJoined, gameState, etc.)
    newSocket.on("roomJoined", (data) => {
      setRoomCode(data.code);
      setPlayerId(data.id);
      setRoom(data.room);
      setPlayer(data.room.players.find((p) => p.id === data.id));
      setCurrentView("game");
      setGameSettings({
        roundTime: data.room.roundTime,
        lives: data.room.lives,
        keyboard: data.room.keyboard,
      });
    });

    newSocket.on("gameState", (data) => {
      console.log(data);
      const currentPlayerId = playerIdRef.current;
      setPlayer(data.players.find((p) => p.id === currentPlayerId));
      setRoom(data);
      setGameSettings({
        roundTime: data.roundTime,
        lives: data.lives,
        keyboard: data.keyboard,
      });
    });

    newSocket.on("kicked", (data) => {
      setShowDialog({ show: true, title: data.title, message: data.message });
      handleBackToMenu(true, true);
    });

    newSocket.on("wordUpdate", (data) => {
      setRoom((prevRoom) => ({
        ...prevRoom,
        players: prevRoom.players.map((player) =>
          player.id === data.userId
            ? { ...player, currentWord: data.text }
            : player
        ),
      }));
    });

    newSocket.on("timerUpdate", (newTime) => {
      setTime(newTime);
    });

    newSocket.on("error", (message) => {
      setError(message);
    });

    // Guardar el socket en el estado (si es necesario)
    setSocket(newSocket);

    // Limpieza al desmontar
    return () => {
      newSocket.disconnect();
      setConnectionStatus("disconnected");
    };
  }, []); // Sin dependencias, el socket no se reinicia

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isClickInsideMenu = e.target.closest(".player-options-menu");
      const isClickInsidePlayer = e.target.closest("[data-player-id]");

      if (selectedPlayer && !isClickInsideMenu && !isClickInsidePlayer) {
        setSelectedPlayer(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [selectedPlayer]);

  const handleBackToMenu = (inGame, kick) => {
    setCurrentView("menu");
    setToRoomCode(["", "", "", ""]);
    setRoomCode("");
    if (inGame && !kick) {
      socket.emit("leaveRoom");
    } else {
      setError("");
    }
  };

  const handleDigitChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...toRoomCode];
    newCode[index] = value;
    setToRoomCode(newCode);
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !toRoomCode[index] && index > 0) {
      inputRefs[index - 1].current.focus({ preventScroll: true });
    }
    if (e.key === "Enter") {
      handleJoinRoom();
    }
  };

  const handleJoinRoom = () => {
    const code = toRoomCode.join("");
    if (code.length !== 4) {
      setError("Por favor ingresa el código completo");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    socket.emit("joinRoom", { roomCode: code, nick: user.username });
    console.log("Uniendo a sala:", code);
  };

  useEffect(() => {
    if (currentView === "create") {
      if (
        connectionStatus !== "connected" &&
        connectionStatus !== "connectedhide"
      ) {
        return;
      }
      handleCreateRoom();
    }
  }, [currentView, connectionStatus]);

  const handleCreateRoom = () => {
    socket.emit("createRoom", user.username);
    console.log("Creando sala con nombre:", user.username);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInput = (e) => {
    const newInput = e.target.value;
    setInputWord(newInput); // Actualizamos el valor de la palabra a medida que el usuario escribe
    // Emitimos con submitted: false para mantener el estado actualizado
    socket.emit("playerInput", { text: newInput, submitted: false });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    //setSubmitWord(true); // Cuando se envíe, lo marcamos como "enviado"
    // Emitimos con submitted: true para indicar que la palabra ha sido enviada
    socket.emit("playerInput", { text: inputWord, submitted: true });
    setInputWord("");
  };

  const triggerHaptic = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleKeyPress = (key) => {
    if (!player.isActive) return;
    triggerHaptic();
    setInputWord(inputWord + key);
    socket.emit("playerInput", { text: inputWord + key, submitted: false });
  };

  const handleBackspace = () => {
    if (!player.isActive) return;
    triggerHaptic();
    setInputWord(inputWord.slice(0, -1));
    socket.emit("playerInput", { text: inputWord, submitted: false });
  };

  const handleSubmitWord = () => {
    if (!player.isActive) return;
    triggerHaptic();
    socket.emit("playerInput", { text: inputWord, submitted: true });
    setInputWord("");
  };

  const menuItems = [
    {
      icon: Play,
      text: "Unirse a una sala",
      action: () => setCurrentView("room"),
    },
    {
      icon: Plus,
      text: "Crear una Sala",
      action: () => setCurrentView("create"),
    },
    {
      icon: HelpCircle,
      text: "Cómo Jugar",
      action: () => setCurrentView("howTo"),
    },
    {
      icon: Settings,
      text: "Ajustes",
      action: () => setCurrentView("settings"),
    },
  ];

  const PlayerOptionsModal = ({ player: playerE, onClose }) => {
    if (!isSignedIn) {
      return <SignIn />;
    }
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900 rounded-lg w-full max-w-sm border border-gray-800 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              {playerE.role === "leader" && (
                <Crown className="w-6 h-6 text-yellow-500" />
              )}
              <div>
                <h3 className="text-lg font-bold">{playerE.name}</h3>
                <p className="text-sm text-gray-400">
                  {playerE.role === "leader"
                    ? "Líder de la sala"
                    : playerE.isReady
                    ? "Listo para jugar"
                    : "Esperando..."}
                </p>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                setShowConfirmation({
                  show: true,
                  action: "promote",
                  player: playerE,
                  title: "¿Promover a líder?",
                  message: `¿Estás seguro de que quieres hacer líder a ${playerE.name}?`,
                });
                onClose();
              }}
              disabled={playerE.id === player.id}
              className="w-full p-3 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors
                     flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed
                     disabled:hover:bg-gray-800"
            >
              <Crown className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Hacer líder</div>
                <div className="text-sm text-gray-400">
                  Transferir el control de la sala
                </div>
              </div>
            </button>

            <button
              disabled={playerE.id === player.id}
              onClick={() => {
                setShowConfirmation({
                  show: true,
                  action: "kick",
                  player: playerE,
                  title: "¿Expulsar jugador?",
                  message: `¿Estás seguro de que quieres expulsar a ${playerE.name}?`,
                });
                onClose();
              }}
              className="w-full p-3 rounded-md bg-red-500/10 hover:bg-red-500/20 transition-colors
                     flex items-center gap-3 text-red-500 disabled:cursor-not-allowed
                     disabled:hover:bg-red-500/20 disabled:text-red-700"
            >
              <X className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Expulsar jugador</div>
                <div className="text-sm">Retirar de la sala</div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={onClose}
              className="w-full p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const ConfirmationDialog = ({ title, message, onConfirm, onCancel }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-lg p-6 max-w-sm w-full border border-gray-800"
      >
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700
                   transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-md bg-red-500 hover:bg-red-600
                   transition-colors text-sm"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
  const Dialog = ({ title, message }) => {
    if (!showDialog.show) {
      return null;
    } else {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-lg p-6 max-w-sm w-full border border-gray-800"
          >
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-gray-400 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setShowDialog({ show: false, title: "", message: "" })
                }
                className="flex-1 px-4 py-2 rounded-md bg-red-500 hover:bg-red-600
                   transition-colors text-sm"
              >
                Vale
              </button>
            </div>
          </motion.div>
        </motion.div>
      );
    }
  };

  const handlePlayerAction = (action, player) => {
    if (action === "kick") {
      socket.emit("kickPlayer", player.id);
    } else if (action === "promote") {
      socket.emit("doLeader", player.id);
    }
    setShowConfirmation({ show: false, action: null, player: null });
  };

  const renderConnecting = () => (
    <motion.div
      key="connecting"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12 text-center"
    >
      <motion.button
        onClick={() => handleBackToMenu()}
        className="flex items-center text-gray-400 hover:text-white transition-colors"
        whileHover={{ x: -4 }}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver al Menú
      </motion.button>

      {/* Connection status */}
      <div className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              className={`absolute -inset-4 rounded-full ${
                connectionStatus === "connecting" && "bg-yellow-500/20"
              }
              ${
                connectionStatus === "disconnected" && "bg-red-500/20"
              } blur-md`}
            />
            <div className="relative bg-gray-800 rounded-full p-4">
              <Loader2
                className={`w-12 h-12 ${
                  connectionStatus === "connecting" && "text-yellow-500"
                } animate-spin ${
                  connectionStatus === "disconnected" && "text-red-500"
                }`}
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {connectionStatus === "connecting" && "Conectando a los servidores"}
            {connectionStatus === "disconnected" &&
              "Reconectando con los servidores"}
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            {connectionStatus === "connecting" &&
              "Esto no tomará mucho tiempo. Estamos estableciendo una conexión segura."}
            {connectionStatus === "disconnected" &&
              "¡Vaya! Esto si que nos ha pillado por sorpresa."}
          </p>
        </div>

        <p className="text-sm text-gray-500">
          {connectionStatus === "connecting"
            ? "Estableciendo conexión..."
            : "Intentando reconectar..."}
        </p>
      </div>
    </motion.div>
  );

  const renderMenu = () => (
    <motion.div
      key="menu"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Logo */}
      <motion.div
        className="flex items-center justify-center"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, -5, 5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      >
        {/*"w-20 h-20 text-red-500" className="text-4xl font-bold ml-4" */}
        <img src="/images/image.png" className="h-40 m-0" />
      </motion.div>

      {/* Menu Items */}
      <div className="space-y-4">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.text}
            className="w-full bg-gray-800 hover:bg-gray-700 p-4 rounded-lg flex items-center
                     transition-colors duration-200 group"
            onClick={item.action}
            initial={{ opacity: 0, x: -50 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: {
                delay: index * 0.1,
              },
            }}
            whileHover={{ scale: 1.02, delay: 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <item.icon className="w-6 h-6 text-red-500 group-hover:text-red-400" />
            <span className="ml-4 text-lg font-medium">{item.text}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  const renderRoomInput = () => {
    if (
      connectionStatus !== "connectedhide" &&
      connectionStatus !== "connected"
    ) {
      return renderConnecting();
    } else {
      return (
        <motion.div
          key="room-input"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-8"
        >
          <motion.button
            onClick={() => handleBackToMenu()}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Menú
          </motion.button>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Ingresa el Código</h2>
            <p className="text-gray-400">
              Pide el código de 4 dígitos a tus amigos
            </p>
          </div>

          <motion.div
            className="flex justify-center gap-3"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {toRoomCode.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputmode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-16 h-16 text-center text-2xl font-bold bg-gray-800 border-2 
                     border-gray-700 rounded-lg focus:border-red-500 focus:outline-none
                     transition-colors"
              />
            ))}
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            onClick={handleJoinRoom}
            className="w-full bg-red-500 hover:bg-red-600 p-4 rounded-lg font-medium
                 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Unirse a la Sala
          </motion.button>
        </motion.div>
      );
    }
  };

  const renderCreateRoom = () => {
    if (
      connectionStatus !== "connected" &&
      connectionStatus !== "connectedhide"
    ) {
      return renderConnecting();
    }
  };

  const renderHowToPlay = () => (
    <motion.div
      key="how-to-play"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <motion.button
        onClick={() => handleBackToMenu()}
        className="flex items-center text-gray-400 hover:text-white transition-colors"
        whileHover={{ x: -4 }}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver al Menú
      </motion.button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Cómo Jugar</h2>
      </div>

      <div className="space-y-6 text-gray-300">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Objetivo</h3>
          <p>
            Escribe palabras que contengan la sílaba mostrada antes de que la
            bomba explote.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Reglas</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Cada jugador tiene 3 vidas</li>
            <li>No se pueden repetir palabras</li>
            <li>Tienes entre 5 y 30 segundos para responder</li>
            <li>La palabra debe existir en el diccionario</li>
            <li>
              Perderás una vida si no respondes a tiempo con una palabra válida
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Consejos</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Piensa en palabras comunes primero</li>
            <li>Estate atento a tu turno</li>
            <li>Mantén un ritmo constante</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <motion.button
        onClick={() => handleBackToMenu()}
        className="flex items-center text-gray-400 hover:text-white transition-colors"
        whileHover={{ x: -4 }}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Volver al Menú
      </motion.button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Ajustes</h2>
      </div>

      <div className="space-y-6">
        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium">Volumen</label>
            {volume === 0 ? (
              <VolumeX className="w-6 h-6 text-gray-400" />
            ) : volume < 50 ? (
              <Volume1 className="w-6 h-6 text-gray-400" />
            ) : (
              <Volume2 className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:bg-red-500
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Language Selection - For future implementation */}
        <div className="flex items-center justify-between opacity-50">
          <span className="text-lg font-medium">Idioma</span>
          <select disabled className="bg-gray-800 rounded-lg p-2 text-gray-400">
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </motion.div>
  );

  const renderWaitingRoom = () => {
    const playersNeeded = MIN_PLAYERS - room.players.length;
    const readyPlayersNeeded =
      MIN_PLAYERS - room.players.filter((player) => player.isReady).length - 1;
    return (
      <motion.div
        key="waiting"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-[1200px] mx-auto flex flex-col md:flex-row md:gap-8"
      >
        {/* Left Column - Room Info */}
        <div className="md:w-[400px] flex-none flex flex-col">
          <motion.button
            onClick={() => handleBackToMenu(true)}
            className="flex items-center text-gray-400 hover:text-white transition-colors mb-8"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Salir y volver al Menú
          </motion.button>

          <div className="space-y-6 bg-gray-800/50 p-6 rounded-lg sticky top-8">
            <div>
              <h2 className="text-xl font-medium text-gray-400 mb-4">
                Código de sala
              </h2>
              <motion.button
                onClick={handleCopyCode}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-800 
             rounded-lg hover:bg-gray-700 transition-colors group"
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-3xl font-bold tracking-wider">
                  {roomCode}
                </span>
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
                )}
              </motion.button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-medium text-gray-400">Jugadores</h2>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">
                    {room.players.length}/{MAX_PLAYERS}
                  </span>
                </div>
              </div>
              <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${(room.players.length / 16) * 100}%` }}
                />
              </div>
            </div>

            {
              /* Start Button (Only for host) */
              player.role === "leader" && (
                <motion.button
                  disabled={readyPlayersNeeded > 0}
                  onClick={() => socket.emit("startGame")}
                  className={`w-full py-4 rounded-lg flex items-center justify-center gap-2 font-medium
              ${
                readyPlayersNeeded <= 0
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-700 cursor-not-allowed"
              } transition-colors`}
                  whileHover={readyPlayersNeeded <= 0 && { scale: 1.02 }}
                  whileTap={readyPlayersNeeded <= 0 && { scale: 0.98 }}
                >
                  <Play className="w-5 h-5" />
                  Comenzar Partida
                </motion.button>
              )
            }

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-gray-400">
                  Ajustes de partida
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-6 py-2">
                      {/* Round Time */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Tiempo mínimo por turno
                          </label>
                          <span className="text-sm text-gray-400">
                            {gameSettings.roundTime}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="15"
                          value={gameSettings.roundTime}
                          onChange={(e) =>
                            setGameSettings((prev) => ({
                              ...prev,
                              roundTime: Number(e.target.value),
                            }))
                          }
                          disabled={player.role !== "leader"}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-4
                             [&::-webkit-slider-thumb]:h-4
                             [&::-webkit-slider-thumb]:bg-red-500
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:cursor-pointer
                             disabled:opacity-50"
                        />
                      </div>

                      {/* Lives */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Vidas</label>
                          <div className="flex gap-1">
                            {Array.from({ length: gameSettings.lives }).map(
                              (_, i) => (
                                <Heart
                                  key={i}
                                  className="w-4 h-4 text-red-500"
                                  fill="currentColor"
                                />
                              )
                            )}
                          </div>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={gameSettings.lives}
                          onChange={(e) =>
                            setGameSettings((prev) => ({
                              ...prev,
                              lives: Number(e.target.value),
                            }))
                          }
                          disabled={player.role !== "leader"}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-4
                             [&::-webkit-slider-thumb]:h-4
                             [&::-webkit-slider-thumb]:bg-red-500
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:cursor-pointer
                             disabled:opacity-50"
                        />
                      </div>

                      {/* Word Validation */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Teclado para móvil
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() =>
                              setGameSettings((prev) => ({
                                ...prev,
                                keyboard: "default",
                              }))
                            }
                            disabled={player.role !== "leader"}
                            className={`p-2 rounded-lg text-sm font-medium transition-colors
                               ${
                                 gameSettings.keyboard === "default"
                                   ? "bg-red-500 text-white"
                                   : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                               }
                               disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Predeterminado
                          </button>
                          <button
                            onClick={() =>
                              setGameSettings((prev) => ({
                                ...prev,
                                keyboard: "device",
                              }))
                            }
                            disabled={player.role !== "leader"}
                            className={`p-2 rounded-lg text-sm font-medium transition-colors
                               ${
                                 gameSettings.keyboard === "device"
                                   ? "bg-red-500 text-white"
                                   : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                               }
                               disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Dispositivo
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">
                          {gameSettings.keyboard === "default"
                            ? "Teclado dentro del juego solo para dispositivos moviles"
                            : "Teclado predeterminado de cada dispositivo en móviles"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {
              /* Ready Button (Only for players) */
              player.role !== "leader" && (
                <motion.button
                  onClick={() => socket.emit("getReady")}
                  className={`w-full py-4 rounded-lg flex items-center justify-center gap-2 font-medium
              ${
                !player.isReady
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-700"
              } transition-colors`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play className="w-5 h-5" />
                  {!player.isReady ? "Listo" : "No listo"}
                </motion.button>
              )
            }

            <p className="text-center text-sm text-gray-400">
              {(() => {
                if (playersNeeded > 0) {
                  return `Esperando a que se una${
                    playersNeeded > 1 ? "n" : ""
                  } al menos ${playersNeeded} jugador${
                    playersNeeded > 1 ? "es" : ""
                  } más...`;
                }

                if (readyPlayersNeeded > 0) {
                  return `Esperando a que al menos ${readyPlayersNeeded} jugador${
                    readyPlayersNeeded > 1 ? "es" : ""
                  } más esté${readyPlayersNeeded > 1 ? "s" : ""} listo${
                    readyPlayersNeeded > 1 ? "s" : ""
                  }`;
                }

                if (player.role !== "leader" && player.isReady) {
                  return "Esperando a que el líder inicie la partida...";
                }

                if (player.role !== "leader" && !player.isReady) {
                  return "¡Dale a listo para jugar! Si la partida inicia sin ti, quedarás como espectador";
                }

                if (
                  room.players.every(
                    (player) => player.role === "leader" || player.isReady
                  )
                ) {
                  return 'Todos los jugadores están listos. Pulsa "Comenzar Partida" para iniciar...';
                }

                return 'Pulsa "Comenzar Partida" para iniciar... (Los jugadores que no están listos quedarán como espectadores)';
              })()}
            </p>
          </div>
        </div>

        {/* Right Column - Players List */}
        <div className="flex-1 mt-6 md:mt-0">
          <div className="bg-gray-800/50 rounded-lg p-6 md:h-[calc(100vh-8rem)] flex flex-col">
            <h3 className="text-lg font-medium text-gray-400 mb-4">
              Jugadores en sala
            </h3>
            <div
              className={`flex-1 overflow-y-auto 
                  scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent ${
                    !isMobile && "min-h-[400px]"
                  }`}
            >
              <div className="space-y-3 p-0.5">
                {/* Added padding to prevent border cut-off */}
                <AnimatePresence mode="popLayout">
                  {room.players.map((playerelement) => (
                    <motion.div
                      key={playerelement.id}
                      layout
                      data-player-id={playerelement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      onClick={() => {
                        if (player.role === "leader") {
                          setSelectedPlayer(
                            selectedPlayer?.id === playerelement.id
                              ? null
                              : playerelement
                          );
                        }
                      }}
                      className={`relative p-4 rounded-lg flex items-center justify-between 
                      ${player.role === "leader" && "cursor-pointer"}
                    ${true ? "bg-gray-800/80" : "bg-gray-800/40"}
                    hover:bg-gray-800/60 transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        {playerelement.role === "leader" && (
                          <Crown className="w-5 h-5 text-yellow-500" />
                        )}
                        <span className="font-medium">
                          {playerelement.name}
                        </span>
                      </div>

                      {playerelement.role !== "leader" && (
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={
                              playerelement.isReady
                                ? {
                                    backgroundColor: "rgb(34 197 94)", // green-500
                                  }
                                : {
                                    backgroundColor: "rgb(75 85 99)", // gray-600
                                  }
                            }
                            className="h-2 w-2 rounded-full"
                          />
                          <span className="text-sm text-gray-400">
                            {playerelement.isReady ? "Listo" : "Esperando"}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderGame = () => {
    if (room.status === "waiting") {
      return renderWaitingRoom();
    }
    if (room.status === "finished") {
      return (
        <WinnerScreen
          winner={room.players.find((p) => p.isAlive === true)}
          actualId={player.id}
        />
      );
    }
    if (room.status === "inGame") {
      const playersReady = room.players.filter(
        (player) => player.isReady || player.role === "leader"
      );
      return (
        <div>
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{
              y: mainAnimationEnd ? 0 : -10,
              opacity: mainAnimationEnd ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 left-1/2 transform -translate-x-1/2 z-40 mt-2"
          >
            <div className="bg-gray-800/90 backdrop-blur-sm text-white px-5 py-3 rounded-lg shadow-lg border border-gray-700/50 flex items-center gap-4">
              {room.players.length - playersReady.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-700/50 rounded-full">
                  <View className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    {room.players.length - playersReady.length}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 px-3 py-1 bg-gray-700/50 rounded-full">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium">
                  {room.players.length -
                    (room.players.length - playersReady.length)}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 bg-gray-700/50 rounded-full">
                <RectangleEllipsis className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium tracking-wider">
                  {roomCode}
                </span>
              </div>
            </div>
          </motion.div>
          {isMobile ? (
            <GameBoardMobile
              room={room}
              inputWord={inputWord}
              player={player}
            />
          ) : (
            <GameBoard
              players={room.players}
              currentPlayerIndex={room.currentPlayerIndex}
              time={time}
              syllable={room.syllable}
              isPlaying={player.isPlaying}
              isActive={player.isActive}
            />
          )}
          {isMobile && room.keyboard === "default" ? (
            <MobileKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onSubmit={handleSubmitWord}
              disabled={!player.isActive}
            />
          ) : (
            <form
              onSubmit={handleSubmit}
              className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 transition-all duration-300 w-10/11 sm:w-auto mb-4 ${
                !player.isActive || (isMobile && room.keyboard === "default")
                  ? "max-h-0 opacity-0 overflow-hidden" // Oculta el input
                  : "max-h-40 opacity-100" // Muestra el input
              }`}
            >
              <div className="relative flex items-center bg-gray-800 rounded-full shadow-lg px-1 py-1">
                <input
                  ref={inputRef}
                  type="text"
                  onChange={handleInput}
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.preventDefault(); // Previene la acción por defecto (escribir un espacio)
                    }
                    if (e.key === "Enter") {
                      handleSubmit(e);
                    }
                  }}
                  value={inputWord}
                  placeholder="Escribe una palabra con la sílaba..."
                  className={`sm:w-[400px] w-full p-3 text-lg bg-gray-900 rounded-full
                  focus:outline-none transition-colors
                  text-white placeholder-gray-500`}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck="false"
                />
              </div>
            </form>
          )}
        </div>
      );
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {currentView === "menu" && (
          <div className="max-w-md mx-auto">{renderMenu()}</div>
        )}
        {currentView === "room" && (
          <div className="max-w-md mx-auto">{renderRoomInput()}</div>
        )}
        {currentView === "create" && (
          <div className="max-w-md mx-auto">{renderCreateRoom()}</div>
        )}
        {currentView === "howTo" && (
          <div className="max-w-md mx-auto">{renderHowToPlay()}</div>
        )}
        {currentView === "settings" && (
          <div className="max-w-md mx-auto">{renderSettings()}</div>
        )}
        {currentView === "name" && (
          <div className="max-w-md mx-auto">{renderNameInput()}</div>
        )}
        {currentView === "game" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onAnimationStart={() => {
              setMainAnimationEnd(false);
            }}
            onAnimationComplete={() => setMainAnimationEnd(true)}
          >
            {renderGame()}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerOptionsModal
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
        {showConfirmation.show && (
          <ConfirmationDialog
            title={showConfirmation.title}
            message={showConfirmation.message}
            onConfirm={() => {
              handlePlayerAction(
                showConfirmation.action,
                showConfirmation.player
              );
            }}
            onCancel={() =>
              setShowConfirmation({
                show: false,
                action: null,
                player: null,
              })
            }
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDialog.show ? (
          <Dialog title={showDialog.title} message={showDialog.message} />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {connectionStatus !== "connectedhide" && (
          <motion.div
            className="fixed bottom-4 left-4 z-50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-full 
                ${
                  connectionStatus === "connected"
                    ? "bg-green-500/20"
                    : connectionStatus === "disconnected"
                    ? "bg-red-500/20"
                    : "bg-yellow-500/20"
                }`}
            >
              {connectionStatus === "connecting" && (
                <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
              )}
              {connectionStatus === "connected" && (
                <Wifi className="w-4 h-4 text-green-500" />
              )}
              {connectionStatus === "disconnected" && (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs font-medium">
                {connectionStatus === "connecting"
                  ? "Conectando..."
                  : connectionStatus === "connected"
                  ? "Conectado"
                  : "Desconectado"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="fixed bottom-4 right-4 z-50">
        <UserButton
          showName={true}
          appearance={{
            elements: {
              userButtonBox:
                "px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center transition-colors transition-scale duration-200 group hover:scale-[1.02]",
            },
          }}
        />
      </div>
    </>
  );
}
