import React from "react";

const Logo = ({ type, className }) => {
  let src = null;
  switch (type) {
    case "mobile":
      src = "/assets/images/logo/logo_mobile_v1.png";
      break;
    case "desktop":
      src = "/assets/images/logo/logo_desctop_v1.png";
      break;
    default:
      break;
  }
  return (
    <a className={["navbar-brand", type, className].join(" ")} href="#">
      <img src={src} alt={`${type} logo`} />
    </a>
  );
};

export default Logo;
