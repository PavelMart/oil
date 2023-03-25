import React from "react";
import { useSelector } from "react-redux";

const Navbar = () => {
  const {
    data: {
      menu: { home, features, aboutUs, partners },
    },
  } = useSelector((state) => state.data);

  const closeMenu = (e) => {
    document.querySelector(".navbar-collapse").classList.remove("show");
  };

  return (
    <div className={["collapse", "navbar-collapse"].join(" ")} id="navbarSupportedContent">
      <ul className="navbar-nav">
        <li className="nav-item">
          <a className="nav-link" href="/" id="navbarFeaturesMenu" role="button">
            {home}
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#features" onClick={closeMenu}>
            {features}
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#about-us" onClick={closeMenu}>
            {aboutUs}
          </a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#partners" onClick={closeMenu}>
            {partners}
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
