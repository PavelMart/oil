import React from "react";
import { useDispatch } from "react-redux";
import { closePopup } from "../store/data/data.slice";

const Popup = ({ children, isOpen, style = {}, innerStyle = {} }) => {
  const dispatch = useDispatch();

  return (
    <div style={{ ...style }} className={["popup-container", isOpen ? "active" : ""].join(" ")} onClick={() => dispatch(closePopup())}>
      <div style={{ ...innerStyle }} className="login-validation-wrap" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Popup;
