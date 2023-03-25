import React from "react";
import { useDispatch } from "react-redux";
import { closePopup } from "../../store/data/data.slice";

const CloseBtn = ({ color = "white" }) => {
  const dispatch = useDispatch();
  return (
    <button className="close-btn" onClick={() => dispatch(closePopup())}>
      <span style={{ backgroundColor: color }}></span>
      <span style={{ backgroundColor: color }}></span>
    </button>
  );
};

export default CloseBtn;
