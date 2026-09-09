// src/hooks/useAudio.js
import { useEffect, useRef } from "react";

const audioBuffers = {};
let audioContext = null;
//const passiveCache = new Set();

export const useAudio = () => {
  const unlockedRef = useRef(false);

// Referencia para almacenar el audio que está sonando actualmente
  const currentSourceRef = useRef(null);
  // Referencia para la velocidad (1.0 es normal, 0.5 lento, 1.5 rápido)
  const playbackSpeedRef = useRef(0.85);

  useEffect(() => {
    const unlock = async () => {
      // Crear AudioContext UNA VEZ
      try {
        if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      unlockedRef.current = true;
      } catch (error) {
        console.error("Error unlocking audio context:", error);
      }
    };

    window.addEventListener("click", unlock);
    window.addEventListener("pointerdown", unlock);
    //window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("click", unlock);
      //window.removeEventListener("keydown", unlock);
    }
      
  }, []);

  /*const passivePreload = (src) => {
    if (!src || passiveCache.has(src)) return;

    try {
      const audio = new Audio();
      audio.src = src;
      audio.preload = "auto";
      passiveCache.add(src);

    } catch (error) {
      console.error(`Error in passive preload for audio file: ${src}`, error);
      return;
    }
  };*/

  // Función interna para asegurar que "Baño" siempre sea "banio.mp3"
  const getCleanPath = (textOrPath) => {
    if (textOrPath.endsWith(".mp3")) {
      return textOrPath.startsWith("/") ? textOrPath : `/AudioGenerator/audio/es/${textOrPath}`;
    }
    const fileName = textOrPath
      .toLowerCase()
      //.replace(/ñ/g, "ni")
      //.normalize("NFD")
      //.replace(/[\u0300-\u036f]/g, "")
      //.replace(/\s+/g, "_")
      .replace(/[¿?]/g, "");
    return `/AudioGenerator/audio/es/${fileName}.mp3`;
  };

  const preloadAudio = async (textOrPath) => {
    //if (!unlockedRef.current || !audioContext) return;
    //if (audioBuffers[src]) return;
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();}

    let targetSrc = getCleanPath(textOrPath);

    if (audioBuffers[targetSrc]) return targetSrc;

    try {

      const response = await fetch(targetSrc);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();

      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      //audioBuffers[targetSrc] = await audioContext.decodeAudioData(arrayBuffer);
      
      audioBuffers[targetSrc] = buffer;
      console.log(`Preparado en RAM: ${targetSrc}`);

      return targetSrc;
    }
    catch (error) {return null;   }
  };
    

  // Reproduce texto con TTS (Web Speech API). Devuelve una Promise que resuelve al terminar.
  const speakTTS = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = "es-ES";
      utt.rate = playbackSpeedRef.current < 1 ? 0.85 : 1.0;
      utt.onend = resolve;
      utt.onerror = resolve;
      window.speechSynthesis.speak(utt);
    });
  };

  const playAudio = (textOrPath) => {
    if (!audioContext || !unlockedRef.current) {
      return;
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch (e) {}
    }

    const finalSrc = getCleanPath(textOrPath);

    const startPlayback = (buffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackSpeedRef.current;
      source.connect(audioContext.destination);
      currentSourceRef.current = source;
      source.start(0);
      source.onended = () => {
        if (currentSourceRef.current === source) currentSourceRef.current = null;
      };
    };

    if (audioBuffers[finalSrc]) {
      startPlayback(audioBuffers[finalSrc]);
    } else {
      preloadAudio(finalSrc).then((path) => {
        if (path && audioBuffers[path]) {
          startPlayback(audioBuffers[path]);
        } else {
          // Sin archivo de audio → TTS con el texto del label
          const label = textOrPath.endsWith(".mp3")
            ? textOrPath.replace(/^.*\//, "").replace(".mp3", "")
            : textOrPath;
          speakTTS(label);
        }
      });
    }
  };

  const playPhrase = async (items) => {
    if (!audioContext || !unlockedRef.current) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    for (const item of items) {
      await new Promise((resolve) => {
        const finalSrc = getCleanPath(item);

        const startPlayback = (buffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = playbackSpeedRef.current;
          source.connect(audioContext.destination);
          currentSourceRef.current = source;
          source.start(0);
          source.onended = resolve;
        };

        if (audioBuffers[finalSrc]) {
          startPlayback(audioBuffers[finalSrc]);
        } else {
          preloadAudio(finalSrc).then((path) => {
            if (path && audioBuffers[path]) {
              startPlayback(audioBuffers[path]);
            } else {
              // Sin archivo de audio → TTS con el texto del label
              speakTTS(item).then(resolve);
            }
          });
        }
      });
    }
  };



  // Función para cambiar la velocidad desde los componentes
  const setPlaybackSpeed = (speed) => {
    playbackSpeedRef.current = speed;
  };

  return { playAudio, preloadAudio, setPlaybackSpeed, playPhrase };
};
