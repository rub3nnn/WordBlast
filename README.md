

<p align="center">
<img src="https://github.com/user-attachments/assets/b484eb7f-65a0-4ed2-8416-656a63a961f5" alt="Logo Word Blast" width="400" />
</p>

**WordBlast** es un juego multijugador en tiempo real, inspirado en *BombParty*, en el que los jugadores deben escribir palabras que contengan una sílaba específica antes de que la bomba explote. ¡Pon a prueba tu vocabulario bajo presión!

## 🚀 El proyecto desplegado

👉 [Prueba ahora WordBlast](https://wordblast.vercel.app/)
``wordblast.vercel.app``

## 🖼️ Capturas de pantalla

### Inicio  
<img src="https://github.com/user-attachments/assets/92b5a15e-321a-4cc5-8283-0680b5efde93"/>

### Unión a salas con código  
<img src="https://github.com/user-attachments/assets/90fc5be1-b75e-4f96-b502-00add546850c"/>

### Creación y gestión de sala como líder  
<img src="https://github.com/user-attachments/assets/6de0c84f-82c1-4c76-b876-b8f99af62570"/>

### Durante el juego  
<img src="https://github.com/user-attachments/assets/4bc26953-4df3-4369-ad84-5f561abe6a7d"/>


## 🎮 ¿Cómo se juega?

* Cada ronda muestra una **sílaba aleatoria**.
* Tienes entre **5 y 30 segundos** para escribir una palabra que la contenga.
* La palabra debe **existir en el diccionario**.
* No puedes **repetir palabras** ya usadas en la partida.
* Si no respondes a tiempo o escribes una palabra inválida, **pierdes una vida**.
* Cada jugador comienza con **3 vidas**.
* ¡Gana el último en pie!

## 🧑‍🤝‍🧑 Salas multijugador

* Puedes **crear una sala** y compartir el código de 4 dígitos con tus amigos.
* O bien, **unirte** a una sala existente con ese código.
* Solo los jugadores que le hayan dado a listos entrarán en el juego. (Los que no se encuentren en listo al iniciar el juego o se unan tras comenzar la partida estarán en modo espectador)
* Se necesita un mínimo de dos jugadores en listo para comenzar la partida.
* Cuenta con un límite de 16 jugadores por sala.
* Las partidas se juegan en **tiempo real** gracias a WebSockets.

## 🛠️ Tecnologías principales utilizadas

* **Frontend:** React + Vite
* **Backend:** Node.js + Express
* **WebSockets:** socket.io
* **Autenticación y gestión de usuarios:** Clerk

## 🔐 Uso de Clerk

Clerk se ha utilizado para:

* Implementar un sistema completo de **inicio de sesión** y **registro de usuarios**.
* Mostrar el **nombre de usuario** dentro del juego.
* Guardar y consultar **estadísticas personalizadas** de cada jugador usando la **metadata del usuario**.

