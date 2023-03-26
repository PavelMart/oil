import React from "react";

const RegisterBtn = ({ link, children }) => {
  return (
    <a href={link} id="register" className="btn btn-red">
      {children}
    </a>
  );
};

export default RegisterBtn;
