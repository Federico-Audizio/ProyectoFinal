import { useEffect, useRef, useState, useCallback } from "react";
import "./SenaPage.css";

const CONFIDENCE_THRESHOLD = 45;   // % mínimo para contar una predicción
const CONSECUTIVE_NEEDED   = 3;    // predicciones seguidas iguales para escribir
const CAPTURE_INTERVAL_MS  = 150;  // ms entre frames
const COOLDOWN_MS           = 1500; // ms de pausa (sin frames) después de escribir
const HANDS_LOST_TIMEOUT   = 3000; // ms sin manos antes de considerar que no hay manos

const SenaPage = () => {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef    = useRef<NodeJS.Timeout | null>(null);
  const isSendingRef      = useRef(false);
  const cooldownRef       = useRef(false);
  const isPausedRef       = useRef(false);
  const consecutiveRef    = useRef(0);
  const lastLetterRef     = useRef<string | null>(null);
  const streamRef         = useRef<MediaStream | null>(null);
  const handsLostTimer    = useRef<NodeJS.Timeout | null>(null);

  const [hasStarted,     setHasStarted]     = useState(false);
  const [isPaused,       setIsPaused]       = useState(false);
  const [typedText,      setTypedText]      = useState("");
  const [frameCount,     setFrameCount]     = useState(0);
  const [currentLetter,  setCurrentLetter]  = useState<string | null>(null);
  const [currentConf,    setCurrentConf]    = useState(0);
  const [topPredictions, setTopPredictions] = useState<{ class: string; prob: number }[]>([]);
  const [consecutiveCount, setConsecutiveCount] = useState(0);
  const [isInCooldown,   setIsInCooldown]   = useState(false);
  const [lastAdded,      setLastAdded]      = useState<string | null>(null);
  const [handsVisible,   setHandsVisible]   = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [isSpeaking,     setIsSpeaking]     = useState(false);

  const captureAndSend = useCallback(async () => {
    // Durante cooldown no enviamos frames: el buffer del backend se reconstruye
    // desde cero cuando se reanuda, evitando re-escribir la misma letra
    if (isSendingRef.current || cooldownRef.current || isPausedRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    isSendingRef.current = true;
    try {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/jpeg", 0.8)
      );
      if (!blob) return;

      const fd = new FormData();
      fd.append("image", blob, "frame.jpg");

      const response = await fetch("http://localhost:5000/predict-abcdario", {
        method: "POST",
        body: fd,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err.error ?? `Error HTTP ${response.status}`);
        return;
      }

      const data = await response.json();
      setError(null);

      if (data.status === "no_hands") {
        // Falla de detección puntual → esperar HANDS_LOST_TIMEOUT antes de resetear
        if (!handsLostTimer.current) {
          handsLostTimer.current = setTimeout(() => {
            handsLostTimer.current = null;
            setHandsVisible(false);
            setFrameCount(0);
            setCurrentLetter(null);
            setTopPredictions([]);
            consecutiveRef.current = 0;
            lastLetterRef.current  = null;
            setConsecutiveCount(0);
            fetch("http://localhost:5000/abcdario-reset", { method: "POST" }).catch(() => {});
          }, HANDS_LOST_TIMEOUT);
        }
        return;
      }

      // Manos detectadas → cancelar el temporizador de pérdida
      if (handsLostTimer.current) {
        clearTimeout(handsLostTimer.current);
        handsLostTimer.current = null;
      }
      setHandsVisible(true);

      if (data.status === "buffering") {
        setFrameCount(data.count ?? 0);
        setCurrentLetter(null);
        consecutiveRef.current = 0;
        lastLetterRef.current  = null;
        setConsecutiveCount(0);
        return;
      }

      // status === "ready" → predicción continua
      setFrameCount(30);
      setCurrentLetter(data.prediction);
      setCurrentConf(data.confidence);
      setTopPredictions(data.top5 ?? []);

      // Lógica de predicciones consecutivas (durante cooldown, seguimos recibiendo
      // datos para actualizar la vista pero no escribimos)
      if (!cooldownRef.current) {
        if (
          data.confidence >= CONFIDENCE_THRESHOLD &&
          data.prediction === lastLetterRef.current
        ) {
          consecutiveRef.current += 1;
        } else {
          consecutiveRef.current = 1;
          lastLetterRef.current  = data.prediction;
        }

        const streak = consecutiveRef.current;
        setConsecutiveCount(streak);

        if (streak >= CONSECUTIVE_NEEDED && data.confidence >= CONFIDENCE_THRESHOLD) {
          // ¡Letra confirmada!
          const letter = data.prediction as string;
          setTypedText((prev) => prev + letter);
          setLastAdded(letter);
          consecutiveRef.current = 0;
          lastLetterRef.current  = null;
          setConsecutiveCount(0);
          setCurrentLetter(null);
          setTopPredictions([]);
          setFrameCount(0);

          // Reinicia el buffer del backend → los porcentajes quedan en cero
          // y no puede re-escribir la misma letra hasta reconstruir 30 frames nuevos
          fetch("http://localhost:5000/abcdario-reset", { method: "POST" }).catch(() => {});

          cooldownRef.current = true;
          setIsInCooldown(true);

          setTimeout(() => {
            cooldownRef.current = false;
            setIsInCooldown(false);
            setLastAdded(null);
          }, COOLDOWN_MS);
        }
      }
    } catch {
      setError("No se pudo conectar con el backend (¿está corriendo app.py?)");
    } finally {
      isSendingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        intervalRef.current = setInterval(captureAndSend, CAPTURE_INTERVAL_MS);
      })
      .catch((e) => setError(`Cámara no disponible: ${e.message}`));

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (handsLostTimer.current) clearTimeout(handsLostTimer.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      fetch("http://localhost:5000/abcdario-reset", { method: "POST" }).catch(() => {});
    };
  }, [hasStarted, captureAndSend]);

  const playText = () => {
    if (!typedText.trim()) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(typedText);
    utt.lang = "es-ES";
    utt.rate = 0.9;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const togglePause = () => {
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
    if (next) {
      // Al pausar: cancela timer de manos, limpia estado visual y resetea buffer
      if (handsLostTimer.current) {
        clearTimeout(handsLostTimer.current);
        handsLostTimer.current = null;
      }
      consecutiveRef.current = 0;
      lastLetterRef.current  = null;
      setConsecutiveCount(0);
      setCurrentLetter(null);
      setTopPredictions([]);
      setFrameCount(0);
      setHandsVisible(false);
      fetch("http://localhost:5000/abcdario-reset", { method: "POST" }).catch(() => {});
    }
  };

  // Puntos de la barra de carga (● ● ○ ○)
  const streakDots = Array.from({ length: CONSECUTIVE_NEEDED }, (_, i) => i < consecutiveCount);

  return (
    <div className="sena-tracking-container">

      {/* ── Área de cámara ── */}
      <div className="sena-camera-area">
        <div className="sena-video-wrapper">
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {!hasStarted ? (
            <div className="sena-placeholder-overlay">
              <button className="btn-activate-camera" onClick={() => setHasStarted(true)}>
                <span className="icon">🤟</span>
                Iniciar ABCDario
              </button>
              <p className="btn-subtitle">Reconocimiento de letras A–G</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="sena-video-element" />

              {/* Botón Pausar / Reanudar — esquina superior izquierda del video */}
              <button
                className={`sena-pause-btn ${isPaused ? "paused" : ""}`}
                onClick={togglePause}
                title={isPaused ? "Reanudar detección" : "Pausar detección"}
              >
                {isPaused ? "▶ Reanudar" : "⏸ Pausar"}
              </button>

              {/* Overlay de "Pausado" sobre el video */}
              {isPaused && (
                <div className="sena-paused-overlay">
                  <span className="sena-paused-icon">⏸</span>
                  <span className="sena-paused-text">Detección pausada</span>
                </div>
              )}

              <div className="sena-tech-hud">
                <div className="corner top-left" />
                <div className="corner top-right" />
                <div className="corner bottom-left" />
                <div className="corner bottom-right" />
                <div className="scan-line" />
              </div>

              {/* Overlay inferior: estado de detección */}
              <div className="sena-progress-overlay">
                {isInCooldown ? (
                  <div className="sena-cooldown-badge">
                    <span className="cooldown-tick">✓</span>
                    <strong>{lastAdded}</strong> agregada
                  </div>
                ) : !handsVisible ? (
                  <div className="sena-no-hands-badge">
                    <span>👐</span> Mostrá las manos
                  </div>
                ) : frameCount < 30 ? (
                  <div className="sena-buffer-widget">
                    <div className="sena-buffer-label">
                      Capturando seña...
                      <span className="sena-buffer-count">{frameCount}/30</span>
                    </div>
                    <div className="sena-buffer-bar">
                      <div
                        className="sena-buffer-fill"
                        style={{ width: `${(frameCount / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : currentLetter && consecutiveCount > 0 ? (
                  <div className="sena-streak-widget">
                    <span className="streak-label">Manteniendo...</span>
                    <div className="streak-dots">
                      {streakDots.map((filled, i) => (
                        <div key={i} className={`streak-dot ${filled ? "filled" : ""}`} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Letra actual — overlay esquina superior derecha */}
              {currentLetter && !isInCooldown && (
                <div className={`sena-letter-overlay ${currentConf >= CONFIDENCE_THRESHOLD ? "high" : "low"}`}>
                  {currentLetter}
                  <span className="sena-letter-conf">{currentConf.toFixed(0)}%</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Panel inferior ── */}
      <div className="sena-bottom-panel">
        {error && <div className="sena-error-message"><b>Error:</b> {error}</div>}

        <div className="abc-text-area">
          <div className="abc-text-display">
            {typedText
              ? <>{typedText}<span className="abc-cursor">|</span></>
              : <span className="abc-placeholder">Mostrá una seña para empezar a escribir...</span>
            }
          </div>
        </div>

        <div className="abc-controls">
          <button
            className={`abc-btn abc-btn-play ${isSpeaking ? "speaking" : ""}`}
            onClick={isSpeaking ? stopSpeech : playText}
            disabled={!typedText.trim()}
          >
            {isSpeaking
              ? <><span className="btn-icon">⏹</span> Detener</>
              : <><span className="btn-icon">▶</span> Reproducir</>
            }
          </button>

          <button
            className="abc-btn abc-btn-space"
            onClick={() => setTypedText((p) => p + " ")}
          >
            <span className="btn-icon">⎵</span> Espacio
          </button>

          <button
            className="abc-btn abc-btn-delete"
            onClick={() => setTypedText((p) => p.slice(0, -1))}
            disabled={!typedText}
          >
            <span className="btn-icon">⌫</span> Borrar
          </button>

          <button
            className="abc-btn abc-btn-clear"
            onClick={() => setTypedText("")}
            disabled={!typedText}
          >
            <span className="btn-icon">✕</span> Limpiar
          </button>
        </div>

        {topPredictions.length > 0 && (
          <div className="abc-top5">
            <p className="abc-top5-title">Predicciones actuales</p>
            {topPredictions.map((p, i) => (
              <div key={i} className="top5-item">
                <div className="top5-label">
                  <span className={`top5-letter ${i === 0 ? "top5-first" : ""}`}>
                    {p.class}
                  </span>
                  <span className="top5-prob">{p.prob.toFixed(1)}%</span>
                </div>
                <div className="top5-bar">
                  <div
                    className="top5-fill"
                    style={{
                      width: `${p.prob}%`,
                      background: i === 0 && p.prob >= CONFIDENCE_THRESHOLD
                        ? "linear-gradient(90deg, #28a745, #5cb85c)"
                        : "linear-gradient(90deg, #00c6ff, #0072ff)",
                    }}
                  />
                  {i === 0 && (
                    <div
                      className="top5-threshold"
                      style={{ left: `${CONFIDENCE_THRESHOLD}%` }}
                      title={`Umbral: ${CONFIDENCE_THRESHOLD}%`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SenaPage;
