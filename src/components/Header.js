import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Logo from "./Logo";
import Navbar from "./Navbar";
import NavbarToggler from "./UI/NavbarToggler";
import RegisterBtn from "./UI/RegisterBtn";
import slide_1 from "./../assets/images/background/background_slide_1.jpg";
import slide_2 from "./../assets/images/background/background_slide_2.jpg";
import slide_3 from "./../assets/images/background/background_slide_3.jpg";

const slides = [slide_1, slide_2, slide_3];

const Header = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const {
    data: { promoTitle, promoText },
  } = useSelector((state) => state.data);

  const [slideNumber, setSlideNumber] = useState(0);

  useEffect(() => {
    slides.forEach((picture) => {
      const img = new Image();
      img.src = picture;
    });
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    let interval;
    if (isLoaded) interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  const nextSlide = () => {
    setSlideNumber((prev) => {
      if (prev === 2) return 0;
      return prev + 1;
    });
  };

  return (
    <>
      <section className="hero-section home full" style={{ backgroundImage: `url('${slides[slideNumber]}')` }}>
        <div className="header-wrap">
          <header className="header">
            <nav className="navbar navbar-expand-lg">
              <Logo type={"mobile"} />
              <Logo type={"desktop"} />
              <NavbarToggler />
              <Navbar />
            </nav>
          </header>
          <div className="wrap">
            <div className="container">
              <div className="inner-wrap">
                <div className="content-column">
                  <h1 className="title">{promoTitle}</h1>
                  <h4 className="subtitle">{promoText}</h4>
                  <div className="buttons-wrap">
                    <RegisterBtn link="#contacts">Contact us</RegisterBtn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Header;
