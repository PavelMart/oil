import React from "react";

const FormBtn = ({ disabled, onClick, children }) => {
  return (
    <button className="btn btn-lg btn-primary btn-block" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
};

export default FormBtn;
