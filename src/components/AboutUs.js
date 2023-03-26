import React from "react";
import { useSelector } from "react-redux";

const AboutUs = () => {
  const {
    data: {
      sections: { aboutUs },
    },
  } = useSelector((state) => state.data);

  return (
    <section id="about-us" className="about-section section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-12 col-12">
            <h3 className="section-title text-center">{aboutUs.title}</h3>
            <div className="row py-3 justify-content-between">
              {/* <div className="offset-lg-1 col-lg-5 col-md-6 col-12 text-center image-col second-order">
                <div style={{ overflow: "hidden", borderRadius: 30, padding: 0 }}>
                  <img src="/assets/images/photo.png" className="img-fluid" alt="sportyhq logo" style={{ width: "100%", height: "100%" }} />
                </div>
              </div> */}
              <div className="col-12">
                <div className="abous-us__text">
                  {aboutUs.text.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
