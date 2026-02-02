const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const natural = require("natural");
require("dotenv").config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedDomain = process.env.CORS_HOST;
      const vercelPattern = /-secrecynetwork\.vercel\.app$/; // <- Cambiado: ahora busca "-secrecynetwork.vercel.app" al final

      if (
        !origin || // permitir desde herramientas locales sin origin
        origin === allowedDomain ||
        (origin && vercelPattern.test(new URL(origin).hostname)) // Verifica si el hostname contiene el patrón
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
});

console.log(process.env.CORS_HOST);

// Almacenar palabras y sílabas en memoria
let palabrasSet = new Set();
let syllablesSet = new Set();

// Gestión de salas y jugadores
const rooms = {};
const words = {};
const MAX_PLAYERS = 16;

app.get("/", (req, res) => {
  res.send(rooms);
});

class RoomManager {
  constructor(rooms) {
    this.rooms = rooms; // Referencia externa a las salas
    this.intervals = {}; // Almacena los intervalos activos
  }

  getRandomTime(min = 6, max = 30) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  startTimer(roomId, onTimeEnd) {
    if (!this.rooms[roomId]) {
      console.log(`La sala ${roomId} no existe.`);
      return;
    }

    if (this.intervals[roomId]) {
      clearInterval(this.intervals[roomId]);
      delete this.intervals[roomId];
    }

    // Asignar un tiempo aleatorio
    this.rooms[roomId].time = this.getRandomTime();
    console.log(
      `Sala ${roomId}: Temporizador iniciado con ${this.rooms[roomId].time}s`,
    );

    this.intervals[roomId] = setInterval(() => {
      if (!this.rooms[roomId]) {
        return;
      }
      if (this.rooms[roomId].time > 0) {
        this.rooms[roomId].time -= 1;
        console.log(`Sala ${roomId}: ${this.rooms[roomId].time}s restantes`);
      }

      if (this.rooms[roomId].time === 0) {
        this.stopTimer(roomId);
        console.log(`Sala ${roomId}: ¡Tiempo agotado!`);
        if (onTimeEnd) onTimeEnd(roomId);
      }
    }, 1000);
  }

  stopTimer(roomId) {
    if (this.intervals[roomId]) {
      clearInterval(this.intervals[roomId]);
      delete this.intervals[roomId];
      sendAudio("/audio/fail.wav", roomId);
      const currentPlayer = rooms[roomId].players.find(
        (player) => player.id === rooms[roomId].currentPlayerIndex,
      );
      if (!currentPlayer) {
        return;
      }
      currentPlayer.lives--;
      if (currentPlayer.lives <= 0) {
        currentPlayer.isAlive = false; // Si se quedó sin vidas, marcarlo como muerto
      }
      handleNextPlayer(roomId);
      console.log(`Temporizador de la sala ${roomId} detenido .`);
    } else {
      console.log(`No hay temporizador en la sala ${roomId}.`);
    }
  }

  getTime(roomId) {
    return this.rooms[roomId] ? this.rooms[roomId].time : null;
  }
}

// 🔹 Ejemplo de uso:
const roomManager = new RoomManager(rooms);

// Función para generar código de sala único
const generateRoomCode = () => {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms[code]);
  return code;
};

// Cargar palabras desde archivo
fs.readFile("spanish.txt", "utf-8", (err, data) => {
  if (err) throw err;
  data
    .split("\n")
    .map((palabra) => palabrasSet.add(palabra.trim().toLowerCase()));
  console.log("Palabras cargadas en memoria.");
});

// Cargar sílabas desde archivo
fs.readFile("syllablesES.txt", "utf-8", (err, data) => {
  if (err) {
    console.error("Error al leer el archivo de sílabas:", err);
    return;
  }
  data
    .split("\n")
    .map((syllable) => syllablesSet.add(syllable.trim().toLowerCase()));
  console.log("Sílabas cargadas en memoria. Total:", syllablesSet.size);
});

// Obtener sílaba aleatoria
const getRandomSyllable = () => {
  if (syllablesSet.size === 0 || palabrasSet.size === 0) return "";

  const syllablesArray = Array.from(syllablesSet);

  while (syllablesArray.length > 0) {
    // Seleccionar una sílaba aleatoria
    const randomIndex = Math.floor(Math.random() * syllablesArray.length);
    const syllable = syllablesArray[randomIndex];

    // Contar cuántas palabras contienen la sílaba
    let count = 0;
    for (const palabra of palabrasSet) {
      if (palabra.includes(syllable)) {
        count++;
        if (count >= 500) {
          return syllable; // Retornar la sílaba si cumple la condición
        }
      }
    }

    // Si no cumple la condición, eliminar la sílaba del array para no volver a probarla
    syllablesArray.splice(randomIndex, 1);
  }

  // Si no se encuentra ninguna sílaba que cumpla la condición, retornar una cadena vacía
  return "";
};

function finishGame(roomCode) {
  if (!rooms[roomCode]) return;
  let room = rooms[roomCode];
  room.status = "finished";
  const player = room.players.find((player) => player.isAlive === true);
  player.score++;
  // Emitir estado final del juego
  sendAudio("audio/victory.mp3", roomCode);
  io.to(roomCode).emit("gameState", room);
  roomManager.stopTimer(roomCode);
  // Esperar 7 segundos y reiniciar la sala a estado "waiting"
  setTimeout(() => {
    if (rooms[roomCode]) {
      rooms[roomCode].status = "waiting";
      io.to(roomCode).emit("gameState", rooms[roomCode]);
    }
  }, 7000);
}

var lastSyllable = "";
// Función para manejar turnos de jugadores
const handleNextPlayer = (roomCode) => {
  if (!rooms[roomCode]) return;
  let room = rooms[roomCode];
  const playersAlive = room.players.filter((player) => player.isAlive);
  if (playersAlive.length === 1) {
    finishGame(roomCode);
    return;
  }

  if (room.syllable === lastSyllable) {
    room.syllable = getRandomSyllable();
  } else {
    lastSyllable = room.syllable;
  }

  // Obtener el índice del jugador actual
  const currentPlayerIndex = room.players.findIndex(
    (player) => player.id === room.currentPlayerIndex,
  );

  // Buscar el siguiente jugador que cumpla las condiciones
  let nextPlayerIndex = currentPlayerIndex;
  let attempts = 0; // Contador para evitar bucles infinitos
  do {
    nextPlayerIndex = (nextPlayerIndex + 1) % room.players.length; // Avanzar al siguiente jugador
    attempts++;

    const nextPlayer = room.players[nextPlayerIndex];

    // Condiciones para seleccionar al siguiente jugador
    const isLeaderAndAlive = nextPlayer.role === "leader" && nextPlayer.isAlive;
    const isRegularPlayerReadyAndAlive =
      nextPlayer.role !== "leader" && nextPlayer.isReady && nextPlayer.isAlive;

    // Si el jugador cumple las condiciones, salir del bucle
    if (isLeaderAndAlive || isRegularPlayerReadyAndAlive) {
      break;
    }
  } while (attempts < room.players.length); // Evitar bucles infinitos

  // Si no se encuentra un jugador válido, terminar el juego
  if (attempts >= room.players.length) {
    console.log("No hay jugadores válidos. Terminando el juego.");
    finishGame(roomCode);
    return;
  }

  // Actualizar el jugador actual
  const nextPlayerId = room.players[nextPlayerIndex].id;
  room.currentPlayerIndex = nextPlayerId; // Almacenar el ID del siguiente jugador
  room.players = room.players.map((player) => ({
    ...player,
    isActive: player.id === nextPlayerId,
    currentWord: "",
  }));
  sendAudio("audio/touch.wav", room.players[nextPlayerIndex].socketId);
  io.to(roomCode).emit("gameState", room);
  roomManager.startTimer(roomCode); // Reiniciar el temporizador para el siguiente jugador
};

function sendAudio(audioFile, to) {
  io.to(to).emit("effect", {
    audio: { enable: true, file: audioFile },
  });
}

// Conexión de clientes
io.on("connection", (socket) => {
  const userId = uuidv4();
  console.log("Cliente conectado:", userId);
  socket.userId = userId;

  // Verificar si hay una sala en la autenticación y si existe
  const roomCode = socket.handshake.auth?.room?.current;
  if (roomCode && !rooms[roomCode]) {
    socket.emit("kicked", {
      title: "La sala no existe",
      message: "Parece que la sala en la que estabas ya no existe",
    });
  }
  socket.currentRoom = null;

  // Unir jugador a una sala
  const joinPlayer = (roomCode, isLeader, nick) => {
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        status: "waiting",
        players: [],
        currentPlayerIndex: null, // Inicialmente no hay jugador actual
        isPlaying: false,
        syllable: "",
        lives: 3,
        maxlives: 3,
        roundTime: 10,
        keyboard: "default",
      };
      words[roomCode] = [];
    }

    let room = rooms[roomCode];

    let newPlayer = {
      id: socket.userId,
      name: nick,
      role: isLeader ? "leader" : "player",
      isActive: false,
      isAlive: false,
      currentWord: "",
      score: 0,
      isReady: false,
      inGame: false,
      socketId: socket.id,
    };

    room.players.push(newPlayer);
    socket.currentRoom = roomCode;
    socket.join(roomCode);

    socket.emit("roomJoined", {
      code: roomCode,
      id: socket.userId,
      room: rooms[roomCode],
    });
    io.to(roomCode).except(socket.id).emit("gameState", room);
    return;
  };

  function checkLeave() {
    let room = rooms[socket.currentRoom];
    socket.leave(socket.currentRoom);

    if (!room) return;
    const player = room.players.find((player) => player.id === socket.userId);
    if (!player) return;
    room.players = room.players.filter((player) => player.id !== socket.userId);
    const playersAlive = room.players.filter((player) => player.isAlive);
    if (
      playersAlive.length === 1 &&
      room.players.length !== 0 &&
      room.status === "inGame"
    ) {
      finishGame(socket.currentRoom);
    }
    if (room.players.length === 0) {
      delete rooms[socket.currentRoom];
      delete words[socket.currentRoom];
    } else if (player.role === "leader") {
      room.players[0].role = "leader";
      room.players[0].isReady = false;
      io.to(socket.currentRoom).emit("gameState", room);
    } else {
      io.to(socket.currentRoom).emit("gameState", room);
    }
    socket.currentRoom = null;
  }

  socket.on("doLeader", (userTo) => {
    let room = rooms[socket.currentRoom];
    if (!room) return;
    const player = room.players.find((player) => player.id === socket.userId);
    if (player.role !== "leader") return;
    const playerTo = room.players.find((player) => player.id === userTo);
    player.role = "player";
    playerTo.role = "leader";
    playerTo.isReady = false;
    io.to(socket.currentRoom).emit("gameState", room);
  });

  // Crear sala
  socket.on("createRoom", (nick) => {
    const roomCode = generateRoomCode();
    joinPlayer(roomCode, true, nick);
  });

  // Unirse a sala
  socket.on("joinRoom", ({ roomCode, nick }) => {
    if (!rooms[roomCode]) {
      socket.emit("error", "No hay ninguna sala con ese código");
      return;
    }

    if (rooms[roomCode].players.length >= MAX_PLAYERS) {
      socket.emit("error", "La sala está llena");
      return;
    }
    joinPlayer(roomCode, false, nick);
  });

  socket.on("getReady", () => {
    let room = rooms[socket.currentRoom];
    if (!room) return;

    let player = room.players.find((player) => player.id === socket.userId);
    if (player) {
      player.isReady = !player.isReady;
      if (player.isReady) {
        sendAudio("audio/ready.wav", socket.id);
      } else {
        sendAudio("audio/cancel.wav", socket.id);
      }
      io.to(socket.currentRoom).emit("gameState", room);
    }
  });

  function kickPlayer(roomCode, playerId, title, message) {
    let room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find((player) => player.id === playerId);
    if (player) {
      room.players = room.players.filter((player) => player.id !== playerId);
      io.to(player.socketId).emit("kicked", { title, message });
      io.sockets.sockets.get(player.socketId)?.leave(roomCode);
      io.to(roomCode).emit("gameState", room);
    }
  }

  socket.on("kickPlayer", (playerId) => {
    if (!rooms[socket.currentRoom]) return;
    const player = rooms[socket.currentRoom].players.find(
      (player) => player.id === socket.userId,
    );
    if (player?.role !== "leader") return;
    kickPlayer(
      socket.currentRoom,
      playerId,
      "Has sido expulsado",
      "El líder te ha expulsado de la sala",
    );
  });

  socket.on("leaveRoom", () => {
    checkLeave();

    console.log("Cliente salió de la sala:", socket.userId);
  });

  socket.on("changeRoomSettings", (gameSettings) => {
    let room = rooms[socket.currentRoom];
    if (!room) return;

    const player = room.players.find((player) => player.id === socket.userId);

    if (player.role === "leader") {
      room.roundTime = gameSettings.roundTime;
      room.lives = gameSettings.lives;
      room.maxLives = gameSettings.lives;
      room.keyboard = gameSettings.keyboard;
      io.to(socket.currentRoom).except(socket.id).emit("gameState", room);
    }
  });

  socket.on("startGame", () => {
    let room = rooms[socket.currentRoom];
    if (!room) return;

    room.isPlaying = true;
    room.status = "inGame";

    // Vaciar el array de palabras para la sala actual
    words[socket.currentRoom] = [];

    room.syllable = getRandomSyllable();
    startingPlayerId = room.players[0].id;
    room.currentPlayerIndex = startingPlayerId; // Asignar el ID del primer jugador
    room.players = room.players.map((player) => {
      if (player.isReady || player.role === "leader") {
        return {
          ...player,
          isActive: player.id === startingPlayerId,
          isAlive: true,
          lives: room.lives,
          maxLives: room.maxLives,
          currentWord: "",
        };
      }
      return player;
    });
    sendAudio("audio/start.wav", socket.currentRoom);
    io.to(socket.currentRoom).emit("gameState", room);
    roomManager.startTimer(socket.currentRoom); // Iniciar el temporizador
  });

  // Entrada de jugador
  socket.on("playerInput", (data) => {
    let room = rooms[socket.currentRoom];
    if (!room) return;

    const currentPlayer = room.players.find(
      (player) => player.id === room.currentPlayerIndex,
    );

    currentPlayer.currentWord = data.text;
    io.to(socket.currentRoom).except(socket.socketId).emit("wordUpdate", {
      userId: socket.userId, // ID del jugador que está escribiendo
      text: data.text, // Texto actual
    });

    if (data.submitted) {
      // Lógica para enviar la palabra (ya existente)
      const palabraIngresada = data.text
        .toLowerCase()
        .normalize("NFD") // Descompone caracteres con tilde en su base + diacrítico
        .replace(/[\u0300-\u036f]/g, "") // Elimina los diacríticos (tildes)
        .replace(/ñ/g, "n"); // Reemplaza la ñ manualmente si lo deseas
      if (palabraIngresada.includes(room.syllable)) {
        if (
          palabrasSet.has(palabraIngresada) ||
          palabrasSet.has(natural.PorterStemmerEs.stem(palabraIngresada))
        ) {
          if (words[socket.currentRoom].includes(palabraIngresada)) {
            sendAudio("audio/lock.wav", socket.id);
          } else {
            sendAudio("audio/success.wav", socket.id);
            // Reiniciar el contador de fallos del jugador actual
            currentPlayer.failedAttempts = 0;

            room.syllable = getRandomSyllable();
            words[socket.currentRoom].push(palabraIngresada);
            console.log(words[socket.currentRoom]);
            handleNextPlayer(socket.currentRoom); // Pasar al siguiente jugador
          }
        }
      }
    }
  });

  // Improved disconnect event handler
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.userId);
    checkLeave();
  });
});

// Iniciar servidor
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
