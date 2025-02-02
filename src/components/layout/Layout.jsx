import { Outlet } from "react-router-dom";
import Notification from "../notification/Notification";

const Layout = () => {
  return (
    <div className="container">
      <Notification />
      <Outlet /> {/* This will render the nested components */}
    </div>
  );
};

export default Layout;
