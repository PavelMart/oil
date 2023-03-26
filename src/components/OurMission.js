import React from "react";
import { useSelector } from "react-redux";
import RegisterBtn from "./UI/RegisterBtn";

const OurMission = () => {
  const {
    data: {
      sections: { ourMission },
    },
  } = useSelector((state) => state.data);

  return (
    <>
      <section id="our-mission" className="section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-12 col-12">
              <h3 className="section-title text-center">{ourMission.title}</h3>
              <div className="row py-3 justify-content-between">
                <div className="col-lg-9 col-12 text-center">
                  <div className="abous-us__text">
                    {ourMission.text.map((row) => (
                      <p key={row}>{row}</p>
                    ))}
                  </div>
                </div>
                <div className="col-lg-3 mt-3 col-12 text-center">
                  <RegisterBtn link="#about-us">Who are we?</RegisterBtn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default OurMission;
