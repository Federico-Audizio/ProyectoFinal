import React, { lazy, useState } from "react";
import PictogramTile from "../components/PictogramTile";
import PictogramModal from "../components/PictogramModal";
import "./PictogramPage.css";
import { useAudio } from "../hooks/useAudio";


interface SelectedPicto {
  label: string;
  emoji?: string;
  image?: string;
  color: string; 
}

const PictogramPage: React.FC = () => {
  const [selected, setSelected] = useState<SelectedPicto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<any[]>([]);
  const { playAudio } = useAudio();
  

  const pictograms = [
    { label: "Yo", image: "/pictograms/yo.png", color: "#ffff00ff" },
    { label: "Sed", image: "/pictograms/beber.png", color: "#00FF00" },
    { label: "Bebida", isFolder: true, image: "/pictograms/bebida.png", color: "#FF8000",
      content: [
        { label: "Agua", imagePath: "/public/pictograms/Bebida/agua.png", color: "#FF8000" },
        { label: "Café", imagePath: "/public/pictograms/Bebida/café.png", color: "#FF8000" },
        { label: "Leche", imagePath: "/public/pictograms/Bebida/leche.png", color: "#FF8000" },
        { label: "Jugo", imagePath: "/public/pictograms/Bebida/jugo.png", color: "#FF8000" },
        { label: "Coca-Cola", imagePath: "/public/pictograms/Bebida/coca-cola.png", color: "#FF8000" },
        { label: "Mate", imagePath: "/public/pictograms/Bebida/mate.png", color: "#FF8000" },
      ]
     },
    { label: "Hambre", image: "/pictograms/comer.png", color: "#00FF00" },
    { label: "Comida", isFolder: true, image: "/pictograms/comida.png", color: "#FF8000",
      content: [
        { label: "Milanesa", imagePath: "/public/pictograms/Comida/milanesa.png", color: "#FF8000" },
        { label: "Pollo", imagePath: "/public/pictograms/Comida/pollo.png", color: "#FF8000" },
        { label: "Hamburguesa", imagePath: "/public/pictograms/Comida/hamburguesa.png", color: "#FF8000" },
        { label: "Pastas", imagePath: "/public/pictograms/Comida/pasta.png", color: "#FF8000" },
        { label: "Ensalada", imagePath: "/public/pictograms/Comida/ensalada.png", color: "#FF8000" },
        { label: "Pescado", imagePath: "/public/pictograms/Comida/pescado.png", color: "#FF8000" },
        { label: "Galleta", imagePath: "/public/pictograms/Comida/galletas.png", color: "#FF8000" }
      ]
     },
    { label: "Escuela", image: "/pictograms/Lugares/director de escuela.png", color: "#FF8000" },
    { label: "Hospital", image: "/pictograms/Lugares/hospital.png", color: "#FF8000" },
    { label: "Lugares", isFolder: true, image: "/pictograms/lugares.png", color: "#FF8000", 
      content: [
        { label: "Parque", image: "/pictograms/Lugares/parque.png", color: "#FF8000" },
        { label: "Pileta", image: "/pictograms/Lugares/piscina.png", color: "#FF8000" },
        { label: "Cine", image: "/pictograms/Lugares/cine.png", color: "#FF8000" },
        { label: "Restaurante", image: "/pictograms/Lugares/restaurante.png", color: "#FF8000" },
        { label: "Heladería", image: "/pictograms/Lugares/heladería.png", color: "#FF8000" },
        { label: "Comisaria", image: "/pictograms/Lugares/comisaria.png", color: "#FF8000" }
      ]

    },
    { label: "Si", image: "/pictograms/sí.png", color: "#33FF33" },
    { label: "Mamá", image: "/pictograms/Familia/mamá.png", color: "#FFFF00" },
    { label: "Baño", image: "/pictograms/baño.png", color: "#00FF00" },
    { label: "Salir", image: "/pictograms/salir.png", color: "#00FF00" },
    { label: "Ayuda", image: "/pictograms/ayuda.png", color: "#00FF00" },
    { label: "Ayudas", isFolder: true, image: "/pictograms/ayudas para la movilidad.png", color: "#00FF00",
      content: [
        { label: "Defecar", imagePath: "/public/pictograms/Necesidades/cagar.png", color: "#00FF00" },
        { label: "Orinar", imagePath: "/public/pictograms/Necesidades/orinar.png", color: "#00FF00" },
        { label: "Bañarse", imagePath: "/public/pictograms/Necesidades/ducha.png", color: "#00FF00" },
        { label: "Cepillar los dientes", imagePath: "/public/pictograms/Necesidades/cepillar los dientes.png", color: "#00FF00" },
        { label: "Lavar la cara", imagePath: "/public/pictograms/Necesidades/lavar la cara.png", color: "#00FF00" },
        { label: "Cambiarse", imagePath: "/public/pictograms/Necesidades/Ropa.png", color: "#00FF00" },
        { label: "Lavar la ropa", imagePath: "/public/pictograms/Necesidades/lavar la ropa.png", color: "#00FF00" },
        { label: "Hospital", imagePath: "/public/pictograms/Lugares/hospital.png", color: "#00FF00" }
      ]
     },
    { label: "Dolor", image: "/pictograms/dolor.png", color: "#00FF00" },
    { label: "Dolores", isFolder: true, image: "/pictograms/dolor.png", color: "#00FF00",
      content: [
        { label: "Dolor de cabeza", imagePath: "/public/pictograms/Dolor/dolor de cabeza.png", color: "#00FF00" },
        { label: "Dolor de brazo", imagePath: "/public/pictograms/Dolor/dolor de brazo.png", color: "#00FF00" },
        { label: "Dolor de pierna", imagePath: "/public/pictograms/Dolor/dolor de pierna.png", color: "#00FF00" },
        { label: "Dolor de estómago", imagePath: "/public/pictograms/Dolor/dolor de estómago.png", color: "#00FF00" },
        { label: "Dolor de pecho", imagePath: "/public/pictograms/Dolor/dolor de pecho.png", color: "#00FF00" },
        { label: "Dolor de espalda", imagePath: "/public/pictograms/Dolor/dolor de espalda.png", color: "#00FF00" },
        { label: "Dolor de muela", imagePath: "/public/pictograms/Dolor/dolor de muela.png", color: "#00FF00" },
        { label: "Dolor de oído", imagePath: "/public/pictograms/Dolor/dolor de oído.png", color: "#00FF00" }
      ]
     },
    { label: "Ropa", isFolder: true, image: "/pictograms/Necesidades/ropa.png", color: "#FF8000",
      content: [
        { label: "Camiseta", imagePath: "/public/pictograms/Ropa/camiseta.png", color: "#FF8000" },
        { label: "Pantalón", imagePath: "/public/pictograms/Ropa/pantalón.png", color: "#FF8000" },
        { label: "Zapatillas", imagePath: "/public/pictograms/Ropa/zapatilla.png", color: "#FF8000" },
        { label: "Gorra", imagePath: "/public/pictograms/Ropa/gorra.png", color: "#FF8000" },
        { label: "Campera", imagePath: "/public/pictograms/Ropa/campera.png", color: "#FF8000" },
        { label: "Sudadera", imagePath: "/public/pictograms/Ropa/sudadera.png", color: "#FF8000" },
        { label: "Calcetín", imagePath: "/public/pictograms/Ropa/calcetín.png", color: "#FF8000" },
        { label: "Calzoncillo", imagePath: "/public/pictograms/Ropa/calzoncillo.png", color: "#FF8000" },
      ]
     },
    { label: "No", image: "/pictograms/no.png", color: "#CC0000" },
    { label: "Papá", image: "/pictograms/Familia/papá.png", color: "#FFFF00" },
    { label: "Dormir", image: "/pictograms/dormir.png", color: "#00FF00" },
    { label: "Jugar", image: "/pictograms/Verbos/jugar.png", color: "#00FF00" },
    { label: "Ver la televisión", image: "/pictograms/Verbos/ver la televisión.png", color: "#00FF00" },
    { label: "Escuchar música", image: "/pictograms/Verbos/escuchar música.png", color: "#00FF00" },
    { label: "¿Por que?", image: "/pictograms/Preguntas/por qué.png", color: "#9933FF" },
    { label: "¿Quién?", image: "/pictograms/Preguntas/quién.png", color: "#9933FF" },
    { label: "Enojado", image: "/pictograms/Estado/enfadado.png", color: "#007FFF" },
    { label: "Alegre", image: "/pictograms/Estado/alegre.png", color: "#007FFF" },
    { label: "Familia", isFolder: true, image: "/pictograms/Familia/familia.png", color: "#FFFF00",
      content: [
        { label: "Abuela", image: "/pictograms/Familia/abuela.png", color: "#FFFF00" },
        { label: "Abuelo", image: "/pictograms/Familia/abuelo.png", color: "#FFFF00" },
        { label: "Hermana", image: "/pictograms/Familia/niña.png", color: "#FFFF00" },
        { label: "Hermano", image: "/pictograms/Familia/niño.png", color: "#FFFF00" },
        { label: "Gato", image: "/pictograms/Familia/gato.png", color: "#FFFF00" },
        { label: "Perro", image: "/pictograms/Familia/perro.png", color: "#FFFF00" }
      ]
     },
    { label: "Lugares de la casa", isFolder: true, image: "/pictograms/casa de muñecas.png", color: "#FF8000", 
      content: [
        { label: "Cocina", image: "/pictograms/Casa/cocina.png", color: "#FF8000" },
        { label: "Dormitorio", image: "/pictograms/Casa/dormitorio.png", color: "#FF8000" },
        { label: "Baño", image: "/pictograms/Casa/baño.png", color: "#FF8000" },
        { label: "Jardín", image: "/pictograms/Casa/jardín.png", color: "#FF8000" },
        { label: "Salón", image: "/pictograms/Casa/salón.png", color: "#FF8000" },
        { label: "Comedor", image: "/pictograms/Casa/comedor.png", color: "#FF8000" },
        { label: "Garaje", image: "/pictograms/Casa/garaje.png", color: "#FF8000" },
        { label: "Terraza", image: "/pictograms/Casa/terraza.png", color: "#FF8000" }
      ]
    },
    { label: "Juegos", isFolder: true, image: "/pictograms/Verbos/jugar.png", color: "#00FF00",
      content: [
        { label: "Jugar a la pelota", imagePath: "/public/pictograms/Juegos/jugar a la pelota.png", color: "#00FF00" },
        { label: "Jugar en el suelo", imagePath: "/public/pictograms/Juegos/jugar en el suelo.png", color: "#00FF00" },
        { label: "Jugar con el tablet", imagePath: "/public/pictograms/Juegos/jugar con el tablet.png", color: "#00FF00" },
        { label: "Jugar al fútbol", imagePath: "/public/pictograms/Juegos/fútbol.png", color: "#00FF00" },
        { label: "Jugar al básquet", imagePath: "/public/pictograms/Juegos/baloncesto.png", color: "#00FF00" },
        { label: "Jugar al tenis", imagePath: "/public/pictograms/Juegos/tenista.png", color: "#00FF00" },
        { label: "Jugar al voleibol", imagePath: "/public/pictograms/Juegos/jugador de voleibol.png", color: "#00FF00" },
        { label: "Jugar al bolos", imagePath: "/public/pictograms/Juegos/jugar a los bolos.png", color: "#00FF00" },
        { label: "Jugar al hockey", imagePath: "/public/pictograms/Juegos/jugador de hockey hierba.png", color: "#00FF00" },
        { label: "Jugar a la play", imagePath: "/public/pictograms/Juegos/consola.png", color: "#00FF00" }
      ]
     },
    { label: "Juguetes", isFolder: true, image: "/pictograms/juegos didácticos.png", color: "#FF8000",
      content: [
        { label: "Muñeca", imagePath: "/public/pictograms/Juguetes/muñeca.png", color: "#FF8000" },
        { label: "Pelota", imagePath: "/public/pictograms/Juguetes/pelota.png", color: "#FF8000" },
        { label: "Camión", imagePath: "/public/pictograms/Juguetes/camión de juguete.png", color: "#FF8000" },
        { label: "Rompecabezas", imagePath: "/public/pictograms/Juguetes/ficha de puzzle.png", color: "#FF8000" },
        { label: "Bloques", imagePath: "/public/pictograms/Juguetes/bloques.png", color: "#FF8000" },
        { label: "Peluches", imagePath: "/public/pictograms/Juguetes/osito.png", color: "#FF8000" },
        { label: "Slime", imagePath: "/public/pictograms/Juguetes/slime.png", color: "#FF8000" },
        { label: "Ensartable", imagePath: "/public/pictograms/Juguetes/ensartable.png", color: "#FF8000" },
        { label: "Bolitas", imagePath: "/public/pictograms/Juguetes/canica.png", color: "#FF8000" }
      ]
     },
    { label: "Acciones", isFolder: true, image: "/pictograms/verbos.png", color: "#00FF00" ,
      content: [
        { label: "Escribir", imagePath: "/public/pictograms/Verbos/escribir.png", color: "#00FF00" },
        { label: "Pasear", imagePath: "/public/pictograms/Verbos/pasear.png", color: "#00FF00" },
        { label: "Pasear en bicicleta", imagePath: "/public/pictograms/Verbos/pasear en bicicleta.png", color: "#00FF00" },
        { label: "Jugar", imagePath: "/public/pictograms/Verbos/jugar.png", color: "#00FF00" },
        { label: "Contar un cuento", imagePath: "/public/pictograms/Verbos/contar un cuento.png", color: "#00FF00" }
      ]
    },
    { label: "¿Dónde?", image: "/pictograms/Preguntas/dónde.png", color: "#9933FF" },
    { label: "Preguntas", isFolder: true, image: "/pictograms/Preguntas/undefined.png", color: "#9933FF",
      content: [
        { label: "¿Qué?", image: "/pictograms/Preguntas/qué.png", color: "#9933FF" },
        { label: "¿Qué dices?", image: "/pictograms/Preguntas/¿qué dices.png", color: "#9933FF" },
        { label: "¿Cuándo?", image: "/pictograms/Preguntas/cuándo.png", color: "#9933FF" },
        { label: "¿Cómo?", image: "/pictograms/Preguntas/cómo.png", color: "#9933FF" },
        { label: "¿Cual?", image: "/pictograms/Preguntas/¿cuál.png", color: "#9933FF" },
        { label: "¿Qué es?", image: "/pictograms/Preguntas/qué es.png", color: "#9933FF" },
      ]
     },
    { label: "Emociones", isFolder: true, image: "/pictograms/¿estás contento.png", color: "#007FFF",
      content: [
        { label: "Aburrido", image: "/pictograms/Estado/aburrida.png", color: "#007FFF" },
        { label: "Agobiado", image: "/pictograms/Estado/agobiado.png", color: "#007FFF" },
        { label: "Ansioso", image: "/pictograms/Estado/ansioso.png", color: "#007FFF" },
        { label: "Confusión", image: "/pictograms/Estado/confusión.png", color: "#007FFF" },
        { label: "Distraído", image: "/pictograms/Estado/distraído.png", color: "#007FFF" },
        { label: "Emocionado", image: "/pictograms/Estado/emocionado.png", color: "#007FFF" },
      ]
     },
    { label: "Triste", image: "/pictograms/Estado/triste.png", color: "#007FFF" },
  ];

  return (
    <div className="pictogram-page">
      {/* 🔹 Barra superior */}
      <div className="sentence-bar">
        {selected ? (
          <div className="sentence-content">
            <div className="sentence-emoji">
              {selected.image ? (
                <img
                  src={selected.image}
                  alt={selected.label}
                  className="sentence-img"
                />
              ) : (
                selected.emoji || "❓"
              )}
            </div>
            <span className="sentence-text">{selected.label}</span>

            {/* ✅ Botón borrar dentro del bloque */}
            <button className="close-btn" onClick={() => setSelected(null)}>
              <img src="/icons/borrar.png" alt="Borrar" className="btn-icon" /> Borrar
            </button>
          </div>
        ) : (
          <span className="placeholder">Selecciona un pictograma...</span>
        )}
      </div>

      {/* 🔹 Grilla principal */}
      <div className="pictogram-grid">
        {pictograms.map((pic, idx) => (
          <PictogramTile
            key={idx}
            label={pic.label}
            //emoji={(pic as any).emoji}
            image={pic.image}
            color={pic.color}
            isFolder={pic.isFolder}
            isSelected={selected?.label === pic.label}
            onClick={() => {
              if (!pic.isFolder) {
                playAudio(pic.label);
    
              }else{
                if(pic.content) {
                  setCurrentFolder(pic.content); // cargamos el contenido de esa carpeta
                  setIsModalOpen(true);
                } 
              }

                setSelected({
                  label: pic.label,
                  emoji: (pic as any).emoji,
                  image: (pic as any).image,
                  color: pic.color,
                });
            }}
          />
        ))}
      </div>

      {/* 🔹 MODAL: Aquí es donde ocurre la magia de la ventana emergente */}
      {/* No necesitas cambiar nada aquí si tu componente Modal ya tiene la lógica nueva */}
      <PictogramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pictograms={currentFolder}
        onSelect={(pic) => {
          setSelected(pic);
          // Opcional: Si quieres que al seleccionar se cierre el modal automáticamente
          // (aunque el Modal que te pasé ya lo hace por dentro, no está de más asegurarlo)
          setIsModalOpen(false); 
        }}
      />
    </div> // 👈 Cierre del div className="pictogram-page"
  );
};

export default PictogramPage;
