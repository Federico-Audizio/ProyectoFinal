import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, isolation: "isolate" }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
