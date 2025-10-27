import { Link } from "react-router-dom";      
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* link a la página de cámara */}
      <Link to="/camera" className="icon">
        <img src="/icons/emocion.png" alt="Cámara" className="sidebar-icon" />
      </Link>

      {/* link a la página de pictogramas */}
      <Link to="/pictograms" className="icon">
        <img src="/icons/pictograma.png" alt="Pictogramas" className="sidebar-icon" />
      </Link>
      <Link to="/eyetracking" className="icon"> {/* link a la página de pictogramas */}
        <Image size={28} />
      </Link>
    </div>
  );
};

export default Sidebar;
