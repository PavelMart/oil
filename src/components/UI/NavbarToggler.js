import React from "react";
import { useDispatch } from "react-redux";
import { toggleMenu } from "../../store/data/data.slice";

const NavbarToggler = () => {
  const dispatch = useDispatch();
  return (
    <button
      className="navbar-toggler"
      data-toggle="collapse"
      data-target="#navbarSupportedContent"
      aria-controls="navbarSupportedContent"
      aria-expanded="false"
      aria-label="Toggle navigation"
      onClick={() => dispatch(toggleMenu())}
    >
      <span className="navbar-toggler-icon"> </span>
    </button>
  );
};

export default NavbarToggler;
