import { useEffect, useRef, useState } from "react";
import alphabetImg from "../assets/Alfabeto-Manual-Argentino-LSA-CAS-680x962.png";
import "./SenaPage.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const CONFIDENCE_THRESHOLD = 45;
const CAPTURE_INTERVAL_MS  = 100;    // 30 frames × 100ms = ~3s
const COOLDOWN_MS          = 2000;   // pausa entre señas
const HANDS_GRACE_MS       = 1500;   // tiempo sin manos para abortar captura

type Phase = "idle" | "capturing" | "processing" | "cooldown";

const SenaPage = () => {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const setTypedRef   = useRef<React.Dispatch<React.SetStateAction<string>> | null>(null);
  const pausedRef     = useRef(false);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const isSpeakingRef = useRef(false);

  const [hasStarted,     setHasStarted]     = useState(false);
  const [isPaused,       setIsPaused]       = useState(false);
  const [typedText,      setTypedText]       = useState("");
  const [phase,          setPhase]           = useState<Phase>("idle");
  const [frameCount,     setFrameCount]      = useState(0);
  const [handsVisible,   setHandsVisible]    = useState(false);
  const [currentLetter,  setCurrentLetter]   = useState<string | null>(null);
  const [currentConf,    setCurrentConf]     = useState(0);
  const [topPredictions, setTopPredictions]  = useState<{ class: string; prob: number }[]>([]);
  const [lastAdded,      setLastAdded]       = useState<string | null>(null);
  const [error,          setError]           = useState<string | null>(null);
  const [isSpeaking,     setIsSpeaking]      = useState(false);

  setTypedRef.current    = setTypedText;
  isSpeakingRef.current  = isSpeaking;

  // ── Helpers de edición con cursor ────────────────────────────────────────
  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) { setTypedText(p => p + text); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    setTypedText(prev => prev.slice(0, s) + text + prev.slice(e));
    requestAnimationFrame(() => ta.setSelectionRange(s + text.length, s + text.length));
  };

  const deleteAtCursor = () => {
    const ta = textareaRef.current;
    if (!ta) { setTypedText(p => p.slice(0, -1)); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    if (s !== e) {
      setTypedText(prev => prev.slice(0, s) + prev.slice(e));
      requestAnimationFrame(() => ta.setSelectionRange(s, s));
    } else if (s > 0) {
      setTypedText(prev => prev.slice(0, s - 1) + prev.slice(s));
      requestAnimationFrame(() => ta.setSelectionRange(s - 1, s - 1));
    }
  };

  // Ajustar altura del textarea al contenido (fallback para field-sizing: content)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [typedText]);

  // (el listener global de teclado se registra después de definir playText/stopSpeech)

  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  useEffect(() => {
    if (!hasStarted) return;
    let active = true;

    const captureFrame = (): string => {
      const v = videoRef.current!;
      const c = canvasRef.current!;
      c.width  = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d")!.drawImage(v, 0, 0);
      return c.toDataURL("image/jpeg", 0.75);
    };

    const runLoop = async () => {
      while (active) {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) { await sleep(200); continue; }

        // ── Pausa ─────────────────────────────────────────────────────
        while (active && pausedRef.current) { await sleep(200); }
        if (!active) break;

        // ── FASE 1: esperar manos ──────────────────────────────────────
        setPhase("idle");
        let handsFound = false;
        while (active && !handsFound) {
          try {
            const res  = await fetch(`${BACKEND_URL}/check-hands`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ frame: captureFrame() }),
            });
            handsFound = (await res.json()).has_hands ?? false;
            setError(null);
          } catch {
            setError("Sin conexión con el backend");
          }
          if (!handsFound) {
            setHandsVisible(false);
            setCurrentLetter(null);
            setTopPredictions([]);
            await sleep(300);
          }
        }
        if (!active) break;
        setHandsVisible(true);

        // ── FASE 2: capturar 30 frames (con control de pérdida de manos) ──
        setPhase("capturing");
        const frames: string[] = [];
        let noHandsSince: number | null = null;
        let handsAborted = false;

        for (let i = 0; i < 30; i++) {
          if (!active) break;

          const frame = captureFrame();
          frames.push(frame);
          setFrameCount(i + 1);

          // Chequeo en paralelo cada 3 frames (cada 300 ms) sin bloquear
          if (i % 3 === 0) {
            fetch(`${BACKEND_URL}/check-hands`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ frame }),
            })
              .then(r => r.json())
              .then(d => {
                if (!d.has_hands) {
                  if (noHandsSince === null) noHandsSince = Date.now();
                } else {
                  noHandsSince = null;
                }
              })
              .catch(() => {});
          }

          // Si llevamos más de HANDS_GRACE_MS sin manos → abortar
          if (noHandsSince !== null && Date.now() - noHandsSince >= HANDS_GRACE_MS) {
            handsAborted = true;
            break;
          }

          if (i < 29) await sleep(CAPTURE_INTERVAL_MS);
        }

        setFrameCount(0);
        if (!active) break;

        if (handsAborted || frames.length < 30) {
          setHandsVisible(false);
          setCurrentLetter(null);
          setTopPredictions([]);
          setPhase("idle");
          continue; // volver a detectar manos
        }

        // ── FASE 3: enviar al backend y esperar resultado ─────────────
        setPhase("processing");
        setFrameCount(0);
        try {
          const res  = await fetch(`${BACKEND_URL}/predict-abcdario`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frames }),
          });
          const data = await res.json();
          setError(null);

          if (data.status === "no_hands") {
            setHandsVisible(false);
            setCurrentLetter(null);
            setTopPredictions([]);
            continue;
          }

          setCurrentLetter(data.prediction);
          setCurrentConf(data.confidence);
          setTopPredictions(data.top5 ?? []);

          // ── FASE 4: si pasa el umbral → escribir + cooldown ──────────
          if (data.confidence >= CONFIDENCE_THRESHOLD) {
            const letter = data.prediction as string;
            setTypedRef.current!(prev => prev + letter);
            setLastAdded(letter);
            setPhase("cooldown");
            setCurrentLetter(null);
            setTopPredictions([]);
            await sleep(COOLDOWN_MS);
            if (!active) break;
            setLastAdded(null);
          }
          // si no pasa el umbral: vuelve directo a detectar manos
        } catch {
          setError("Error al procesar la seña");
          await sleep(1000);
        }
      }
    };

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current!;
        v.srcObject = stream;
        v.onloadeddata = () => { if (active) runLoop(); };
      })
      .catch(e => setError(`Cámara no disponible: ${e.message}`));

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setIsPaused(pausedRef.current);
    if (pausedRef.current) setPhase("idle");
  };

  const playText = () => {
    if (!typedText.trim()) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(typedText);
    utt.lang    = "es-ES";
    utt.rate    = 0.9;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };
  const stopSpeech = () => { window.speechSynthesis.cancel(); setIsSpeaking(false); };

  // ── Teclado global (cuando el textarea NO tiene el foco) ─────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === textareaRef.current) return;
      if (e.key === " ")         { e.preventDefault(); setTypedText(p => p + " "); }
      if (e.key === "Backspace") { e.preventDefault(); setTypedText(p => p.slice(0, -1)); }
      if (e.key === "Enter")     { e.preventDefault(); isSpeakingRef.current ? stopSpeech() : playText(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sena-tracking-container">

      {/* ── Fila principal: cámara + referencia de señas ── */}
      <div className="sena-main-row">

      {/* ── Cámara ── */}
      <div className="sena-camera-area">
        <div className="sena-video-wrapper">
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {!hasStarted ? (
            <div className="sena-placeholder-overlay">
              <button className="btn-activate-camera" onClick={() => setHasStarted(true)}>
                Iniciar reconociemiento de señas
              </button>
              <p className="btn-subtitle">Reconocimiento de letras A–Z</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="sena-video-element" />

              <div className="sena-tech-hud">
                <div className="corner top-left" />
                <div className="corner top-right" />
                <div className="corner bottom-left" />
                <div className="corner bottom-right" />
                <div className="scan-line" />
              </div>

              {/* Botón pausa/reanudar */}
              <button
                className={`sena-pause-btn ${isPaused ? "paused" : ""}`}
                onClick={togglePause}
              >
                <span className="btn-pause-icon">{isPaused ? "▶" : "⏸"}</span>
                {isPaused ? "Reanudar" : "Pausar"}
              </button>

              {/* Overlay pausa */}
              {isPaused && (
                <div className="sena-processing-overlay sena-paused-overlay">
                  <div className="sena-pause-icon">⏸</div>
                  <span className="sena-paused-label">Reconocimiento pausado</span>
                  <span className="sena-paused-sub">Presioná ▶ para reanudar</span>
                </div>
              )}

              {/* Overlay de carga mientras el backend procesa */}
              {!isPaused && phase === "processing" && (
                <div className="sena-processing-overlay">
                  <div className="sena-spinner" />
                  <span>Analizando seña…</span>
                </div>
              )}

              {/* Overlay inferior de estado */}
              <div className="sena-progress-overlay">
                {phase === "cooldown" ? (
                  <div className="sena-cooldown-badge">
                    <span className="cooldown-tick">✓</span>
                    <strong>{lastAdded}</strong> agregada
                  </div>
                ) : !handsVisible && phase === "idle" ? (
                  <div className="sena-no-hands-badge">
                    <span>👐</span> Mostrá las manos
                  </div>
                ) : phase === "capturing" ? (
                  <div className="sena-buffer-widget">
                    <div className="sena-buffer-label">
                      Capturando seña…
                      <span className="sena-buffer-count">{frameCount}/30</span>
                    </div>
                    <div className="sena-buffer-bar">
                      <div className="sena-buffer-fill" style={{ width: `${(frameCount / 30) * 100}%` }} />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Letra detectada */}
              {currentLetter && phase !== "cooldown" && (
                <div className={`sena-letter-overlay ${currentConf >= CONFIDENCE_THRESHOLD ? "high" : "low"}`}>
                  {currentLetter}
                  <span className="sena-letter-conf">{currentConf.toFixed(0)}%</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

        {/* ── Panel referencia alfabeto ── */}
        <div className="sena-alphabet-panel">
          <div className="sena-alphabet-scroll">
            <img src={alphabetImg} alt="Alfabeto Manual Argentino LSA" className="sena-alphabet-img" />
          </div>
        </div>

      </div>{/* fin sena-main-row */}

      {/* ── Panel inferior ── */}
      <div className="sena-bottom-panel">
        {error && <div className="sena-error-message"><b>Error:</b> {error}</div>}

        <div className="abc-text-area">
          <textarea
            ref={textareaRef}
            className="abc-textarea"
            value={typedText}
            readOnly
            rows={1}
            onChange={() => {}}
            onKeyDown={e => {
              if (e.key === "Enter")     { e.preventDefault(); isSpeaking ? stopSpeech() : playText(); }
              if (e.key === " ")         { e.preventDefault(); insertAtCursor(" "); }
              if (e.key === "Backspace") { e.preventDefault(); deleteAtCursor(); }
            }}
            placeholder="Mostrá una seña para escribir…"
            spellCheck={false}
          />
          <p className="abc-keyboard-hint">
            <kbd>Espacio</kbd> espacio &nbsp;·&nbsp; <kbd>⌫</kbd> borrar &nbsp;·&nbsp; <kbd>Enter</kbd> reproducir &nbsp;·&nbsp; click para mover el cursor
          </p>
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
          <button className="abc-btn abc-btn-space" onClick={() => insertAtCursor(" ")}>
            <span className="btn-icon">⎵</span> Espacio
          </button>
          <button
            className="abc-btn abc-btn-delete"
            onClick={deleteAtCursor}
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
                  <span className={`top5-letter ${i === 0 ? "top5-first" : ""}`}>{p.class}</span>
                  <span className="top5-prob">{p.prob.toFixed(1)}%</span>
                </div>
                <div className="top5-bar">
                  <div
                    className="top5-fill"
                    style={{
                      width: `${p.prob}%`,
                      background: i === 0 && p.prob >= CONFIDENCE_THRESHOLD
                        ? "linear-gradient(90deg,#28a745,#5cb85c)"
                        : "linear-gradient(90deg,#00c6ff,#0072ff)",
                    }}
                  />
                  {i === 0 && (
                    <div className="top5-threshold" style={{ left: `${CONFIDENCE_THRESHOLD}%` }} />
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
