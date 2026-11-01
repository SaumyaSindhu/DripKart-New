import React, { useEffect } from "react";
import Nav from "../features/Shared/Components/Nav";
import { Outlet, useLocation } from "react-router";

const AppLayout = () => {
  const { pathname } = useLocation();

  // every new page starts at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Nav />
      {/* key restarts the fade-in on every page change */}
      <div key={pathname} className="page-fade">
        <Outlet />
      </div>
    </>
  );
};

export default AppLayout;
