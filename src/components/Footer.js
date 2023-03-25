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
            <ul className="social-list">
              {/* <li>
                <a href="https://www.facebook.com/SportyHQ/">
                  <svg>
                    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-facebook"></use>
                  </svg>
                </a>
              </li>
              <li>
                <a href="https://twitter.com/mysportyhq">
                  <svg>
                    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-twitter"></use>
                  </svg>
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/sportyhqcom/">
                  <svg>
                    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-instagram"></use>
                  </svg>
                </a>
              </li> */}
            </ul>
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
