import React, { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import "./CustomGridEditor.css";
import { useGrids } from "../contexts/GridsContext";
import type { CustomGrid, CustomCell } from "../contexts/GridsContext";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

interface SelectedPicto {
  label: string;
  color: string;
  image?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SIZE_OPTIONS = [
  { label: "Grande",  cols: 9, rows: 4, desc: "9 × 4 — 36 pictogramas" },
  { label: "Mediana", cols: 6, rows: 3, desc: "6 × 3 — 18 pictogramas" },
  { label: "Pequeña", cols: 4, rows: 2, desc: "4 × 2 — 8 pictogramas" },
] as const;

type CommLevel = "simple" | "composed";
type SizeOption = "small" | "normal" | "large";

const makeEmptyCells = (rows: number, cols: number): (CustomCell | null)[][] =>
  Array.from({ length: rows }, () => Array(cols).fill(null));

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

type Step = "chooser" | "setup" | "use" | "editor";

const CustomGridEditor: React.FC<Props> = ({ onClose }) => {
  // ── Saved grids (compartido vía context)
  const { savedGrids, setSavedGrids } = useGrids();
  const { user } = useAuth();

  // ── If URL has ?id=X, open that grid directly (skip chooser)
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id");
  const initialGrid = initialId ? (savedGrids.find(g => g.id === initialId) ?? null) : null;

  // ── Navigation
  const [step, setStep] = useState<Step>(() => {
    if (initialGrid) {
      return initialGrid.cells.flat().some(c => c !== null) ? "use" : "editor";
    }
    return "chooser";
  });

  // ── Grid actual
  const [grid, setGrid] = useState<CustomGrid | null>(initialGrid);

  // ── Formulario de setup
  const [newTitle, setNewTitle]       = useState("");
  const [selectedSize, setSelectedSize] = useState<typeof SIZE_OPTIONS[number] | null>(null);

  // ── Uso (like PictogramPage)
  const [phrase, setPhrase] = useState<SelectedPicto[]>([]);
  const [commLevel, setCommLevel] = useState<CommLevel>("simple");
  const [textSize, setTextSize] = useState<SizeOption>("normal");
  const [imageSize, setImageSize] = useState<SizeOption>("normal");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ── Editor de celda
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellLabel, setCellLabel]     = useState("");
  const [cellColor, setCellColor]     = useState("#007bff");
  const [cellImage, setCellImage]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const openGrid = (g: CustomGrid) => {
    setGrid(g);
    setPhrase([]);
    setCommLevel("simple");
    const hasContent = g.cells.flat().some(cell => cell !== null);
    setStep(hasContent ? "use" : "editor");
  };

  const startNew = () => {
    setNewTitle("");
    setSelectedSize(null);
    setStep("setup");
  };

  const createGrid = () => {
    if (!newTitle.trim() || !selectedSize) return;
    const newGrid: CustomGrid = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      rows: selectedSize.rows,
      cols: selectedSize.cols,
      cells: makeEmptyCells(selectedSize.rows, selectedSize.cols),
    };
    setSavedGrids(prev => [...prev, newGrid]);
    setGrid(newGrid);
    setPhrase([]);
    setCommLevel("simple");
    setStep("editor");
  };

  const handleSelectPictogram = (cell: CustomCell) => {
    const newSelected: SelectedPicto = {
      label: cell.label,
      color: cell.color,
      image: cell.image || undefined,
    };

    if (commLevel === "simple") {
      setPhrase([newSelected]);
    } else {
      if (phrase.length < 7) {
        setPhrase(prev => [...prev, newSelected]);
      }
    }
  };

  const removeLast = () => {
    setPhrase(prev => prev.slice(0, -1));
  };

  const clearPhrase = () => {
    setPhrase([]);
  };

  const getDynamicStyles = (): React.CSSProperties => {
    const rows = grid?.rows ?? 4;
    const imgMaxH = imageSize === "small"
      ? `calc((100vh - 140px) / ${rows} * 0.42)`
      : imageSize === "normal"
      ? `calc((100vh - 140px) / ${rows} * 0.65)`
      : "none";
    const txtSize = textSize === "small" ? "12px" : textSize === "large" ? "clamp(16px, 2vw, 26px)" : "clamp(11px, 1.4vw, 18px)";
    return {
      "--cge-img-max-h": imgMaxH,
      "--cge-txt-size": txtSize,
    } as React.CSSProperties;
  };

  const openCellEditor = (row: number, col: number) => {
    const cell = grid?.cells[row][col];
    setCellLabel(cell?.label ?? "");
    setCellColor(cell?.color ?? "#007bff");
    setCellImage(cell?.image ?? null);
    setEditingCell({ row, col });
  };

  const saveCell = () => {
    if (!grid || !editingCell) return;
    const newCells = grid.cells.map(r => [...r]);
    newCells[editingCell.row][editingCell.col] = {
      label: cellLabel,
      color: cellColor,
      image: cellImage,
    };
    setGrid({ ...grid, cells: newCells });
    setEditingCell(null);
  };

  const clearCell = () => {
    if (!grid || !editingCell) return;
    const newCells = grid.cells.map(r => [...r]);
    newCells[editingCell.row][editingCell.col] = null;
    setGrid({ ...grid, cells: newCells });
    setEditingCell(null);
  };

  const saveGrid = () => {
    if (!grid) return;
    setSavedGrids(prev => {
      const idx = prev.findIndex(g => g.id === grid.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = grid;
        return updated;
      }
      return [...prev, grid];
    });
    setStep("use");
    setEditingCell(null);
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || user.id === "guest") return;
 
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setIsUploadingImage(true);
      try {
        // Ruta única por usuario y celda: grillas/{userId}/{timestamp}.jpg
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const storageRef = ref(storage, `grillas/${user.id}/${fileName}`);
        await uploadString(storageRef, base64, "data_url");
        const url = await getDownloadURL(storageRef);
        setCellImage(url); // guardamos la URL, no el base64
      } catch (err) {
        console.error("Error subiendo imagen a Storage:", err);
        // Fallback: si falla Storage, usamos el base64 localmente
        setCellImage(base64);
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ─── Render: Chooser ─────────────────────────────────────────────────────────
  if (step === "chooser") {
    return (
      <div className="cge-overlay">
        <div className="cge-modal cge-chooser">
          <button className="cge-x" onClick={onClose}>×</button>
          <h2 className="cge-modal-title">Grillas Personalizadas</h2>

          <button className="cge-btn cge-btn-primary cge-new-btn" onClick={startNew}>
            + Nueva Grilla
          </button>

          {savedGrids.length === 0 ? (
            <p className="cge-empty">No hay grillas guardadas todavía.</p>
          ) : (
            <div className="cge-grid-list">
              {savedGrids.map(g => (
                <div key={g.id} className="cge-grid-card" onClick={() => openGrid(g)}>
                  <div
                    className="cge-mini-grid"
                    style={{ gridTemplateColumns: `repeat(${Math.min(g.cols, 6)}, 1fr)` }}
                  >
                    {g.cells.slice(0, 2).flatMap((row, ri) =>
                      row.slice(0, 6).map((cell, ci) => (
                        <div
                          key={`${ri}-${ci}`}
                          className="cge-mini-cell"
                          style={{ borderColor: cell?.color ?? "#ddd" }}
                        >
                          {cell?.image && <img src={cell.image} alt="" />}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="cge-card-info">
                    <span className="cge-card-title">{g.title}</span>
                    <span className="cge-card-meta">{g.cols} × {g.rows}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Setup ───────────────────────────────────────────────────────────
  if (step === "setup") {
    return (
      <div className="cge-overlay">
        <div className="cge-modal cge-setup">
          <button className="cge-x" onClick={() => setStep("chooser")}>×</button>
          <h2 className="cge-modal-title">Nueva Grilla</h2>

          <div className="cge-field">
            <label className="cge-label">Título</label>
            <input
              className="cge-input"
              type="text"
              placeholder="Ej: Mi rutina de la mañana"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              maxLength={40}
              autoFocus
            />
          </div>

          <div className="cge-field">
            <label className="cge-label">Tamaño de la grilla</label>
            <div className="cge-size-grid">
              {SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  className={`cge-size-card ${selectedSize?.label === opt.label ? "cge-size-active" : ""}`}
                  onClick={() => setSelectedSize(opt)}
                >
                  <div
                    className="cge-size-dots"
                    style={{ gridTemplateColumns: `repeat(${Math.min(opt.cols, 5)}, 1fr)` }}
                  >
                    {Array.from({ length: Math.min(opt.rows, 2) * Math.min(opt.cols, 5) }).map((_, i) => (
                      <div key={i} className="cge-dot" />
                    ))}
                  </div>
                  <span className="cge-size-name">{opt.label}</span>
                  <span className="cge-size-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            className="cge-btn cge-btn-primary"
            disabled={!newTitle.trim() || !selectedSize}
            onClick={createGrid}
          >
            Crear Grilla
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: USE (like PictogramPage) ─────────────────────────────────────────
  if (step === "use" && grid) {
    return (
      <div className="cge-use-fullscreen" style={getDynamicStyles()}>
        {/* Sentence bar */}
        <div className="sentence-bar">
          <div className="sentence-content">
            {phrase.length === 0 ? (
              <span className="placeholder">Selecciona un pictograma...</span>
            ) : (
              <div className="phrase-items-container">
                {phrase.map((p, idx) => (
                  <div key={idx} className="phrase-item">
                    {p.image ? (
                      <img src={p.image} alt={p.label} className="sentence-img" />
                    ) : (
                      <span className="sentence-emoji">❓</span>
                    )}
                    <span className="sentence-text">{p.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sentence-controls">
            {commLevel === "simple" && phrase.length > 0 && (
              <button className="control-btn btn-danger" onClick={clearPhrase} title="Borrar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            )}

            {commLevel === "composed" && phrase.length > 0 && (
              <div className="composed-controls">
                <button className="control-btn btn-danger" onClick={removeLast} title="Borrar último">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
                </button>
                <button className="control-btn btn-success" onClick={clearPhrase} title="Reproducir">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                </button>
                <button className="control-btn btn-danger" onClick={clearPhrase} title="Borrar todo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            )}

            <div className="settings-wrapper">
              <button className="control-btn settings-btn" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>

              {isSettingsOpen && (
                <div className="settings-dropdown">
                  <p className="dropdown-title">Nivel de Comunicación</p>
                  <label className="dropdown-option">
                    <input type="radio" name="level" checked={commLevel === "simple"} onChange={() => { setCommLevel("simple"); setPhrase([]); }} />
                    Palabra Simple
                  </label>
                  <label className="dropdown-option">
                    <input type="radio" name="level" checked={commLevel === "composed"} onChange={() => { setCommLevel("composed"); setPhrase([]); }} />
                    Frases Compuestas
                  </label>
                  <hr className="dropdown-divider" />
                  <p className="dropdown-title">Tamaño de imagen</p>
                  <div className="cge-size-row">
                    {(["small", "normal", "large"] as SizeOption[]).map(s => (
                      <button
                        key={s}
                        className={`cge-size-opt-btn${imageSize === s ? " cge-size-opt-active" : ""}`}
                        onClick={() => setImageSize(s)}
                      >
                        {s === "small" ? "Chico" : s === "normal" ? "Normal" : "Grande"}
                      </button>
                    ))}
                  </div>
                  <p className="dropdown-title">Tamaño de texto</p>
                  <div className="cge-size-row">
                    {(["small", "normal", "large"] as SizeOption[]).map(s => (
                      <button
                        key={s}
                        className={`cge-size-opt-btn${textSize === s ? " cge-size-opt-active" : ""}`}
                        onClick={() => setTextSize(s)}
                      >
                        {s === "small" ? "Chico" : s === "normal" ? "Normal" : "Grande"}
                      </button>
                    ))}
                  </div>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-action-btn" onClick={() => { setIsSettingsOpen(false); setStep("editor"); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    Editar Grilla
                  </button>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-action-btn" style={{ color: "#ff4d4d" }} onClick={() => { setIsSettingsOpen(false); setStep("chooser"); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                    Cerrar Grilla
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div
          className="pictogram-grid"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
            gridTemplateRows: `repeat(${grid.rows}, minmax(min-content, 1fr))`,
          }}
        >
          {grid.cells.map((row, ri) =>
            row.map((cell, ci) =>
              cell ? (
                <div
                  key={`${ri}-${ci}`}
                  className="cge-use-tile"
                  style={{ borderColor: cell.color }}
                  onClick={() => handleSelectPictogram(cell)}
                >
                  {cell.image ? (
                    <img src={cell.image} alt={cell.label} className="cge-use-tile-img" />
                  ) : (
                    <span className="cge-use-tile-emoji">❓</span>
                  )}
                  <span className="cge-use-tile-label">{cell.label}</span>
                </div>
              ) : (
                <div key={`${ri}-${ci}`} />
              )
            )
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Editor ──────────────────────────────────────────────────────────
  if (step === "editor" && grid) {
    return (
      <div className="cge-editor-fullscreen">
        {/* Header */}
        <div className="cge-editor-header">
          <button className="cge-back-btn" onClick={() => setStep("use")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </button>
          <h2 className="cge-editor-title">{grid.title}</h2>
          <button className="cge-btn-save" onClick={saveGrid}>
            Guardar
          </button>
        </div>

        {/* Grid editable */}
        <div
          className="cge-edit-grid"
          style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)` }}
        >
          {grid.cells.map((row, ri) =>
            row.map((cell, ci) => (
              <div
                key={`${ri}-${ci}`}
                className={`cge-cell ${cell ? "cge-cell-filled" : "cge-cell-empty"}`}
                style={{ borderColor: cell ? cell.color : undefined }}
                onClick={() => openCellEditor(ri, ci)}
              >
                {cell ? (
                  <>
                    {cell.image ? (
                      <img src={cell.image} alt={cell.label} className="cge-cell-img" />
                    ) : (
                      <span className="cge-cell-no-img">?</span>
                    )}
                    <span className="cge-cell-label">{cell.label}</span>
                  </>
                ) : (
                  <span className="cge-add-plus">+</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal editor de celda */}
        {editingCell && (
          <div className="cge-cell-overlay">
            <div className="cge-cell-modal">
              <button className="cge-x" onClick={() => setEditingCell(null)}>×</button>
              <h3 className="cge-cell-title">
                {grid.cells[editingCell.row][editingCell.col] ? "Editar Pictograma" : "Nuevo Pictograma"}
              </h3>

              <div className="cge-field">
                <label className="cge-label">Texto</label>
                <input
                  className="cge-input"
                  type="text"
                  placeholder="Ej: Agua"
                  value={cellLabel}
                  onChange={e => setCellLabel(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
              </div>

              <div className="cge-field">
                <label className="cge-label">Color del borde</label>
                <div className="cge-color-row">
                  <input
                    type="color"
                    className="cge-color-input"
                    value={cellColor}
                    onChange={e => setCellColor(e.target.value)}
                  />
                  <div className="cge-color-swatch" style={{ background: cellColor }} />
                  <span className="cge-color-hex">{cellColor}</span>
                </div>
              </div>

              <div className="cge-field">
                <label className="cge-label">Imagen</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <button className="cge-upload-btn" onClick={() => fileRef.current?.click()}>
                  {cellImage ? "Cambiar imagen" : "Cargar imagen"}
                </button>
                {cellImage && (
                  <div className="cge-img-wrap">
                    <img src={cellImage} alt="preview" className="cge-img-preview" />
                    <button className="cge-remove-img" onClick={() => setCellImage(null)}>
                      × Quitar
                    </button>
                  </div>
                )}
              </div>

              {/* Vista previa del pictograma */}
              <div className="cge-cell-preview-area">
                <p className="cge-preview-label">Vista previa</p>
                <div className="cge-preview-tile" style={{ borderColor: cellColor }}>
                  {cellImage ? (
                    <img src={cellImage} alt="preview" />
                  ) : (
                    <span className="cge-preview-placeholder">?</span>
                  )}
                  <span className="cge-preview-text">{cellLabel || "Etiqueta"}</span>
                </div>
              </div>

              <div className="cge-cell-actions">
                {grid.cells[editingCell.row][editingCell.col] && (
                  <button className="cge-btn cge-btn-danger" onClick={clearCell}>
                    Eliminar
                  </button>
                )}
                <button
                  className="cge-btn cge-btn-primary"
                  disabled={!cellLabel.trim()}
                  onClick={saveCell}
                >
                  Guardar Pictograma
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default CustomGridEditor;