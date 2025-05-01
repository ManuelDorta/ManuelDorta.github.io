const tablero = document.getElementById("tablero");
const startBtn = document.getElementById("start");
const color1Input = document.getElementById("color1");
const color2Input = document.getElementById("color2");
const nombre1Input = document.getElementById("nombre1");
const nombre2Input = document.getElementById("nombre2");
const turnoTexto = document.getElementById("turno");
const ganadorTexto = document.getElementById("ganador");
const modoJuegoSelect = document.getElementById("modo-juego");
const tamanoTableroSelect = document.getElementById("tamano-tablero");
const tiempoTurnoInput = document.getElementById("tiempo-turno");
const instruccionesBtn = document.getElementById("instrucciones-btn");
const instruccionesDiv = document.getElementById("instrucciones");
const cerrarInstruccionesBtn = document.getElementById("cerrar-instrucciones");
const temporizadorTexto = document.getElementById("temporizador");
const verHistorialBtn = document.getElementById("ver-historial");
const historialDiv = document.getElementById("historial");

let nombreJugador1 = "Jugador 1";
let nombreJugador2 = "Jugador 2";
let colorJugador1 = "#ff0000";
let colorJugador2 = "#0000ff";
let turno = 1;
let celdas = [];
let esBot = false;
let tamanioTablero = 15;

let tiempoPorTurno = 10;
let tiempoRestante = tiempoPorTurno;
let intervaloTemporizador;

startBtn.addEventListener("click", () => {
    nombreJugador1 = nombre1Input.value || "Jugador 1";
    nombreJugador2 = nombre2Input.value || "Jugador 2";
    colorJugador1 = color1Input.value;
    colorJugador2 = color2Input.value;
    esBot = modoJuegoSelect.value === "bot";
    tamanioTablero = parseInt(tamanoTableroSelect.value);
    tiempoPorTurno = parseInt(tiempoTurnoInput.value) || 10;
    turno = 1;
    turnoTexto.textContent = "Turno de: " + nombreJugador1;
    ganadorTexto.textContent = "";
    crearTablero();
    iniciarTemporizador();
});

function crearTablero() {
    tablero.innerHTML = "";
    tablero.style.gridTemplateColumns = `repeat(${tamanioTablero}, 30px)`;
    celdas = [];

    for (let fila = 0; fila < tamanioTablero; fila++) {
        celdas[fila] = [];
        for (let col = 0; col < tamanioTablero; col++) {
            const celda = document.createElement("div");
            celda.classList.add("celda");
            celda.dataset.fila = fila;
            celda.dataset.col = col;

            celda.addEventListener("click", () => {
                if (!esBot || turno === 1) {
                    jugarTurno(fila, col);
                }
            });

            tablero.appendChild(celda);
            celdas[fila][col] = { elemento: celda, jugador: 0 };
        }
    }
}

function jugarTurno(fila, col) {
    const celda = celdas[fila][col];
    if (celda.jugador !== 0 || juegoTerminado()) return;

    celda.jugador = turno;
    celda.elemento.style.backgroundColor = turno === 1 ? colorJugador1 : colorJugador2;

    capturar(fila, col);
    turno = turno === 1 ? 2 : 1;
    turnoTexto.textContent = "Turno de: " + (turno === 1 ? nombreJugador1 : nombreJugador2);

    if (tableroLleno()) {
        verificarGanador();
        detenerTemporizador();
    } else {
        iniciarTemporizador();
        if (esBot && turno === 2) {
            setTimeout(jugarTurnoBot, 500);
        }
    }
}

function capturar(fila, col) {
    ["horizontal", "vertical"].forEach(direccion => {
        if (direccion === "horizontal") {
            capturarLinea(fila, col, 0, -1);
            capturarLinea(fila, col, 0, 1);
        } else {
            capturarLinea(fila, col, -1, 0);
            capturarLinea(fila, col, 1, 0);
        }
    });
}

function capturarLinea(fila, col, deltaFila, deltaCol) {
    let enemigo = turno === 1 ? 2 : 1;
    let filaAct = fila + deltaFila;
    let colAct = col + deltaCol;
    let atrapadas = [];

    while (
        filaAct >= 0 && filaAct < tamanioTablero &&
        colAct >= 0 && colAct < tamanioTablero &&
        celdas[filaAct][colAct].jugador === enemigo
    ) {
        atrapadas.push(celdas[filaAct][colAct]);
        filaAct += deltaFila;
        colAct += deltaCol;
    }

    if (
        atrapadas.length === 1 &&
        filaAct >= 0 && filaAct < tamanioTablero &&
        colAct >= 0 && colAct < tamanioTablero &&
        celdas[filaAct][colAct].jugador === turno
    ) {
        atrapadas.forEach(c => {
            c.jugador = turno;
            c.elemento.style.backgroundColor = turno === 1 ? colorJugador1 : colorJugador2;
        });
    }
}

function tableroLleno() {
    return celdas.flat().every(c => c.jugador !== 0);
}

function verificarGanador() {
    let contador1 = 0, contador2 = 0;
    celdas.flat().forEach(c => {
        if (c.jugador === 1) contador1++;
        if (c.jugador === 2) contador2++;
    });

    ganadorTexto.textContent =
        contador1 > contador2
            ? `¡${nombreJugador1} ganó con ${contador1} casillas!`
            : contador2 > contador1
            ? `¡${nombreJugador2} ganó con ${contador2} casillas!`
            : `¡Empate! Ambos tienen ${contador1} casillas.`;

    guardarPartidaEnHistorial({
        fecha: new Date().toLocaleString(),
        jugador1: nombreJugador1,
        jugador2: nombreJugador2,
        puntos1: contador1,
        puntos2: contador2,
        resultado: contador1 > contador2 ? `${nombreJugador1} ganó` :
                   contador2 > contador1 ? `${nombreJugador2} ganó` : "Empate"
    });

    crearArchivoDescargable({ jugador1: nombreJugador1, jugador2: nombreJugador2, puntos1: contador1, puntos2: contador2, resultado: ganadorTexto.textContent });
}

function jugarTurnoBot() {
    const vacias = [];
    for (let fila = 0; fila < tamanioTablero; fila++) {
        for (let col = 0; col < tamanioTablero; col++) {
            if (celdas[fila][col].jugador === 0) vacias.push({ fila, col });
        }
    }
    if (vacias.length > 0) {
        const { fila, col } = vacias[Math.floor(Math.random() * vacias.length)];
        jugarTurno(fila, col);
    }
}

function juegoTerminado() {
    return ganadorTexto.textContent !== "";
}

// TEMPORIZADOR

function iniciarTemporizador() {
    detenerTemporizador();
    tiempoRestante = tiempoPorTurno;
    actualizarTemporizador();
    intervaloTemporizador = setInterval(() => {
        tiempoRestante--;
        actualizarTemporizador();
        if (tiempoRestante <= 0) {
            turno = turno === 1 ? 2 : 1;
            turnoTexto.textContent = "Turno de: " + (turno === 1 ? nombreJugador1 : nombreJugador2);
            if (esBot && turno === 2) {
                jugarTurnoBot();
            }
            iniciarTemporizador();
        }
    }, 1000);
}

function detenerTemporizador() {
    clearInterval(intervaloTemporizador);
}

function actualizarTemporizador() {
    temporizadorTexto.textContent = `Tiempo restante: ${tiempoRestante}s`;
}

// INSTRUCCIONES

instruccionesBtn.addEventListener("click", () => {
    instruccionesDiv.style.display = "block";
});

cerrarInstruccionesBtn.addEventListener("click", () => {
    instruccionesDiv.style.display = "none";
});

// HISTORIAL

function guardarPartidaEnHistorial(partida) {
    const historial = JSON.parse(localStorage.getItem("historialPartidas")) || [];
    historial.push(partida);
    localStorage.setItem("historialPartidas", JSON.stringify(historial));
}

verHistorialBtn.addEventListener("click", () => {
    const historial = JSON.parse(localStorage.getItem("historialPartidas")) || [];
    if (historial.length === 0) {
        historialDiv.innerHTML = "<h3>Historial</h3><p>No hay partidas guardadas.</p>";
    } else {
        historialDiv.innerHTML = "<h3>Historial de Partidas</h3><ul>" + 
            historial.map(p => 
                `<li>📅 ${p.fecha} — 🏆 ${p.resultado} (${p.jugador1}: ${p.puntos1} vs ${p.jugador2}: ${p.puntos2})</li>`
            ).join("") + "</ul>";
    }
    historialDiv.style.display = historialDiv.style.display === "none" ? "block" : "none";
});

function crearArchivoDescargable(partida) {
    const contenido = JSON.stringify(partida, null, 2);
    const blob = new Blob([contenido], { type: "application/json" });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `partida-${partida.jugador1}-vs-${partida.jugador2}.json`;
    enlace.click();
}