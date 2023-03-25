import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLanguage } from "../../store/data/data.slice";

const ChangeLanguage = () => {
  const { language, languages } = useSelector((state) => state.data);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  return (
    <div className={["change-language-btn", open ? "show" : ""].join(" ")} onClick={() => setOpen(!open)}>
      <div className="language-wrapper">
        {[...languages]
          .sort((l) => {
            if (l.language === language) return -1;
            else return 1;
          })
          .map((l) => (
            <div key={l.language} className="language">
              <img src={l.src} alt={l.language} onClick={() => dispatch(setLanguage(l.language))} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default ChangeLanguage;
