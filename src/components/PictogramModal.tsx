import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import "../pages/PictogramPage.css";
import "../components/CustomGridEditor.css";

interface Pictogram {
  label: string;
  emoji?: string;
  image?: string;
  imagePath?: string;
  color: string;
}

interface CustomPicto {
  label: string;
  image: string | null;
  color: string;
}

interface FolderData {
  hiddenLabels: string[];
  customPictograms: CustomPicto[];
}

interface PictogramModalProps {
  isOpen: boolean;
  onClose: () => void;
  pictograms: Pictogram[];
  onSelect: (pic: Pictogram) => void;
  folderLabel: string;
  userId: string | null;
}

const PictogramModal: React.FC<PictogramModalProps> = ({
  isOpen,
  onClose,
  pictograms,
  onSelect,
  folderLabel,
  userId,
}) => {
  const [hiddenLabels, setHiddenLabels] = useState<string[]>([]);
  const [customPictograms, setCustomPictograms] = useState<CustomPicto[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#FF8000");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) { setIsEditMode(false); return; }
    if (!userId) {
      setHiddenLabels([]);
      setCustomPictograms([]);
      return;
    }

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "usuarios", userId));
        if (snap.exists()) {
          const folderData = snap.data()?.folderCustomizations?.[folderLabel] as FolderData | undefined;
          setHiddenLabels(folderData?.hiddenLabels || []);
          setCustomPictograms(folderData?.customPictograms || []);
        }
      } catch (e) {
        console.error("Error loading folder customizations:", e);
      }
    };
    load();
  }, [isOpen, userId, folderLabel]);

  const save = async (hidden: string[], custom: CustomPicto[]) => {
    if (!userId) return;
    try {
      await setDoc(
        doc(db, "usuarios", userId),
        { folderCustomizations: { [folderLabel]: { hiddenLabels: hidden, customPictograms: custom } } },
        { merge: true }
      );
    } catch (e) {
      console.error("Error saving folder customizations:", e);
    }
  };

  const toggleHidden = (label: string) => {
    const updated = hiddenLabels.includes(label)
      ? hiddenLabels.filter(l => l !== label)
      : [...hiddenLabels, label];
    setHiddenLabels(updated);
    save(updated, customPictograms);
  };

  const deleteCustom = (idx: number) => {
    const updated = customPictograms.filter((_, i) => i !== idx);
    setCustomPictograms(updated);
    save(hiddenLabels, updated);
  };

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const updated = [...customPictograms, { label: newLabel.trim(), image: newImage, color: newColor }];
    setCustomPictograms(updated);
    save(hiddenLabels, updated);
    setNewLabel(""); setNewImage(null); setIsAddOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setIsUploadingImage(true);
      try {
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const storageRef = ref(storage, `carpetas/${userId}/${fileName}`);
        await uploadString(storageRef, base64, "data_url");
        const url = await getDownloadURL(storageRef);
        setNewImage(url);
      } catch {
        setNewImage(base64); // fallback a base64 si falla Storage
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (!isOpen) return null;

  const visibleDefaults = isEditMode
    ? pictograms
    : pictograms.filter(p => !hiddenLabels.includes(p.label));

  const folderColor = pictograms[0]?.color || "#FF8000";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pm-modal-content" onClick={e => e.stopPropagation()}>
        {/* Botón editar — mismo nivel que el X */}
        <button
          className={`pm-edit-toggle ${isEditMode ? "active" : ""}`}
          onClick={() => setIsEditMode(!isEditMode)}
          title={isEditMode ? "Confirmar edición" : "Editar carpeta"}
        >
          {isEditMode ? (
            /* Tilde de confirmación */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            /* Lápiz de edición */
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          )}
        </button>

        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {/* Título con nombre de la carpeta */}
        <h3 className="pm-folder-title">{folderLabel}</h3>

        {/* Grid */}
        <div className="pm-grid">
          {/* Pictogramas por defecto */}
          {visibleDefaults.map((pic, idx) => {
            const hidden = hiddenLabels.includes(pic.label);
            return (
              <div key={`d-${idx}`} className="pm-tile-wrapper">
                <div
                  className="pm-tile"
                  style={{ borderColor: pic.color, opacity: hidden ? 0.35 : 1 }}
                  onClick={() => { if (!isEditMode) { onSelect(pic); onClose(); } }}
                >
                  {(pic.image || pic.imagePath) ? (
                    <img src={pic.image || pic.imagePath} alt={pic.label} className="pm-tile-img" />
                  ) : (
                    <span className="pm-tile-emoji">{pic.emoji || "❓"}</span>
                  )}
                  <span className="pm-tile-label">{pic.label}</span>
                </div>
                {isEditMode && (
                  <button
                    className={`pm-badge-btn ${hidden ? "pm-badge-show" : "pm-badge-hide"}`}
                    onClick={() => toggleHidden(pic.label)}
                    title={hidden ? "Mostrar" : "Ocultar"}
                  >
                    {hidden ? (
                      /* Tilde verde: click para restaurar */
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      /* Ojo tachado: click para ocultar */
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
                        <line x1="1" y1="1" x2="23" y2="23"/>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            );
          })}

          {/* Pictogramas personalizados */}
          {customPictograms.map((cp, idx) => (
            <div key={`c-${idx}`} className="pm-tile-wrapper">
              <div
                className={`pm-tile${isEditMode ? " pm-tile-custom-editing" : ""}`}
                style={{ borderColor: cp.color }}
                onClick={() => {
                  if (!isEditMode) {
                    onSelect({ label: cp.label, image: cp.image || undefined, color: cp.color });
                    onClose();
                  }
                }}
              >
                {cp.image ? (
                  <img src={cp.image} alt={cp.label} className="pm-tile-img" />
                ) : (
                  <span className="pm-tile-emoji">🖼️</span>
                )}
                <span className="pm-tile-label">{cp.label}</span>
              </div>
              {isEditMode && (
                <button className="pm-badge-btn pm-badge-delete" onClick={() => deleteCustom(idx)} title="Eliminar">
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Botón agregar */}
          <div className="pm-tile-wrapper">
            <div
              className="pm-tile pm-add-tile"
              onClick={() => { setIsAddOpen(true); setNewColor(folderColor); }}
            >
              <span className="pm-add-plus">+</span>
              <span className="pm-tile-label" style={{ color: "#aaa" }}>Agregar</span>
            </div>
          </div>
        </div>

        {/* Mini editor de nuevo pictograma */}
        {isAddOpen && (
          <div className="pm-add-overlay" onClick={() => setIsAddOpen(false)}>
            <div className="pm-add-modal" onClick={e => e.stopPropagation()}>
              <h4 className="pm-add-title">Nuevo Pictograma</h4>

              <div className="cge-field">
                <label className="cge-label">Nombre</label>
                <input
                  className="cge-input"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="Ej: Manzana"
                  autoFocus
                />
              </div>

              <div className="cge-field">
                <label className="cge-label">Color</label>
                <div className="cge-color-row">
                  <input type="color" className="cge-color-input" value={newColor} onChange={e => setNewColor(e.target.value)} />
                  <div className="cge-color-swatch" style={{ background: newColor }} />
                  <span className="cge-color-hex">{newColor}</span>
                </div>
              </div>

              <div className="cge-field">
                <label className="cge-label">Imagen</label>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                <button className="cge-upload-btn" disabled={isUploadingImage} onClick={() => fileRef.current?.click()}>
                  {isUploadingImage ? "Subiendo..." : newImage ? "Cambiar imagen" : "📁 Subir imagen"}
                </button>
                {newImage && (
                  <div className="cge-img-wrap">
                    <img src={newImage} alt="preview" className="cge-img-preview" />
                    <button className="cge-remove-img" onClick={() => setNewImage(null)}>Quitar</button>
                  </div>
                )}
              </div>

              <div className="cge-cell-actions" style={{ marginTop: "16px" }}>
                <button className="cge-btn" style={{ background: "#eee", color: "#555" }} onClick={() => setIsAddOpen(false)}>Cancelar</button>
                <button className="cge-btn cge-btn-primary" disabled={!newLabel.trim() || isUploadingImage} onClick={handleAdd}>Guardar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PictogramModal;
