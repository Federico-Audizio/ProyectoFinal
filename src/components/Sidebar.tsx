import { Camera, Image } from "lucide-react"; // importamos íconos
import { Link } from "react-router-dom";      // Link = navegación entre páginas
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <Link to="/camera" className="icon">   {/* link a la página de cámara */}
        <Camera size={28} />
      </Link>
      <Link to="/pictograms" className="icon"> {/* link a la página de pictogramas */}
        <Image size={28} />
      </Link>
      <Link to="/eyetracking" className="icon"> {/* link a la página de pictogramas */}
        <Image size={28} />
      </Link>
    </div>
  );
};

export default Sidebar;
