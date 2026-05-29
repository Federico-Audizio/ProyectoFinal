import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./EmergencyModal.css";

interface Props {
  onClose: () => void;
}

const EmergencyModal: React.FC<Props> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const startSiren = () => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    gain.gain.value = 0.15;

    const now = ctx.currentTime;
    const cycle = 0.7;
    for (let i = 0; i < 120; i++) {
      const t = now + i * cycle;
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.linearRampToValueAtTime(1100, t + cycle / 2);
      osc.frequency.linearRampToValueAtTime(600, t + cycle);
    }
    osc.start(now);
    oscRef.current = osc;
  };

  const stopSiren = () => {
    oscRef.current?.stop();
    oscRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  };

  const toggle = () => {
    if (isActive) {
      stopSiren();
    } else {
      startSiren();
    }
    setIsActive(prev => !prev);
  };

  const handleClose = () => {
    stopSiren();
    onClose();
  };

  useEffect(() => () => stopSiren(), []);

  return ReactDOM.createPortal(
    <>
      {isActive && <div className="emergency-flash" />}
      <div className="emergency-overlay">
        <div className="emergency-modal">
          <h2 className="emergency-title">⚠ Emergencia</h2>
          <p className="emergency-subtitle">
            Activá la alarma para pedir ayuda
          </p>

          <button
            className={`emergency-toggle-btn ${isActive ? "active-alarm" : "inactive"}`}
            onClick={toggle}
          >
            {isActive ? "Desactivar alarma" : "Activar alarma"}
          </button>

          <button className="emergency-close-btn" onClick={handleClose}>
            Cerrar
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default EmergencyModal;
