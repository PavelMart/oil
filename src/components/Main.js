import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { openPartnersPopup } from "../store/data/data.slice";
import RegisterBtn from "./UI/RegisterBtn";

const Main = () => {
  const [active, setActive] = useState(null);

  const partner_1 = useRef(null);
  const partner_2 = useRef(null);
  const partner_3 = useRef(null);

  const {
    data: {
      sections: { features, aboutUs, partners, getStarted },
    },
  } = useSelector((state) => state.data);
  const dispatch = useDispatch();

  useEffect(() => {
    document.addEventListener("scroll", () => {
      if (window.pageYOffset < partner_1.current.offsetTop - window.screen.height / 2.5) setActive(null);
      if (window.pageYOffset >= partner_1.current.offsetTop - window.screen.height / 2.5) setActive(partner_1.current);
      if (window.pageYOffset >= partner_2.current.offsetTop - window.screen.height / 2.5) setActive(partner_2.current);
      if (window.pageYOffset >= partner_3.current.offsetTop - window.screen.height / 2.5) setActive(partner_3.current);
    });
  }, [partner_1, partner_2, partner_3]);

  return (
    <>
      <section id="features" className="features-list-section wide-section">
        <div className="container">
          <h3 className="section-title text-center ">{features.title}</h3>
          <div className="features-list">
            <div className="features-list-col">
              <div href="/features/tournament-management" className="features-list-item">
                <div className="icon-wrap">
                  <img src="./assets/images/advantages/operation-1.png" alt="Fast – Easy – Secure Payments" />
                </div>
                <h5 className="feature-title">{features.featuresList.first.title}</h5>
                <p>{features.featuresList.first.text}</p>
              </div>
            </div>
            <div className="features-list-col">
              <div href="/features/rankings-and-sanctioning" className="features-list-item">
                <div className="icon-wrap">
                  <img src="./assets/images/advantages/best-price.png" alt="Best Odds and Highest Liquidity" />
                </div>
                <h5 className="feature-title">{features.featuresList.second.title}</h5>
                <p>{features.featuresList.second.text}</p>
              </div>
            </div>
            <div className="features-list-col">
              <div className="features-list-item">
                <div className="icon-wrap">
                  <img src="./assets/images/advantages/setup-account.png" alt="Easy Account Setup" />
                </div>
                <h5 className="feature-title">{features.featuresList.third.title}</h5>
                <p>{features.featuresList.third.text}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="divider"></div>
      <section id="about-us" className="about-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-12 col-12">
              <h3 className="section-title text-center">{aboutUs.title}</h3>
              <h3 className="subtitle">{aboutUs.titleText}</h3>
              <div className="row py-3 justify-content-between">
                <div className="offset-lg-1 col-lg-5 col-md-6 col-12 text-center image-col second-order">
                  <div style={{ overflow: "hidden", borderRadius: 30, padding: 0 }}>
                    <img
                      src="/assets/images/photo.png"
                      className="img-fluid"
                      alt="sportyhq logo"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-md-6 col-12">
                  <div className="abous-us__text">
                    <p>{aboutUs.firstParagraph}</p>
                    <p>{aboutUs.secondParagraph}</p>
                    <p>{aboutUs.thirdParagraph}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="partners" className="perfect-solution-section partners-section">
        <div className="perfect-solution-wrap">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-6 col-lg-7 col-md-9 col-12 text-center">
                <h3 className="section-title">{partners.title}</h3>
              </div>
            </div>
          </div>
          <div className="container">
            <div className="partners-list">
              <div
                ref={partner_1}
                className={["partners-list-col", active === partner_1.current && "active"].join(" ")}
                onClick={() => {
                  dispatch(openPartnersPopup("laystars"));
                }}
              >
                <img src="/assets/images/partners/laystars.png" alt="laystars" className="img-fluid" />
                <span>more</span>
              </div>
              <div
                ref={partner_2}
                className={["partners-list-col", active === partner_2.current && "active"].join(" ")}
                onClick={() => {
                  dispatch(openPartnersPopup("ps3838"));
                }}
              >
                <img src="/assets/images/partners/ps3838.png" alt="ps3838" className="img-fluid" />
                <span>more</span>
              </div>
              <div
                ref={partner_3}
                className={["partners-list-col", active === partner_3.current && "active"].join(" ")}
                onClick={() => {
                  dispatch(openPartnersPopup("sportsbet"));
                }}
              >
                <img src="/assets/images/partners/sportsbetio.png" alt="sportsbet" className="img-fluid" />
                <span>more</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="get-started" className="get-started-section wide-section">
        <div className="container">
          <div className="content-wrap">
            <div className="content-col">
              <div className="title-wrap">
                <h4 className="title">{getStarted.title}</h4>
                <h5 className="subtitle">{getStarted.text}</h5>
              </div>
              <div className="buttons-wrap">
                <RegisterBtn />
              </div>
            </div>
            <div className="image-col">
              <div className="image-wrap">
                <img src="/assets/images/illustration/get-started-image.png" alt="sporty tournament icon" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Main;
