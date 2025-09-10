import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />                          {/* Sidebar fijo */}
      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet />                         {/* Aquí se cargan las páginas */}
      </div>
    </div>
  );
};

export default Layout;
