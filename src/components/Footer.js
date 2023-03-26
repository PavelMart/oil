import React from "react";
import { useSelector } from "react-redux";
import Logo from "./Logo";

const Footer = () => {
  const { copyrightYear, copyrightText } = useSelector((state) => state.data.data);
  return (
    <footer className="footer">
      <div className="summary">
        <div className="container">
          <div className="logo-col">
            <Logo type="desktop" className="logo-wrap" />
          </div>
          <div className="logo-col">
            <div className="copyright">
              <span id="copyright-year">{copyrightYear}</span> {copyrightText}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
