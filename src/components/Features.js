import React from "react";
import { useSelector } from "react-redux";
import { Navigation, Pagination } from "swiper";

import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
// import "swiper/css/scrollbar";

const Features = () => {
  const {
    sections: { features },
  } = useSelector((state) => state.data.data);

  return (
    <section id="features" className="features-list-section section">
      <div className="container">
        <h3 className="section-title text-center ">{features.title}</h3>
        <div className="features-list">
          <Swiper
            modules={[Pagination, Navigation]}
            spaceBetween={100}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            scrollbar={{ draggable: true }}
          >
            {features.featuresList.map((feature, i) => (
              <SwiperSlide key={feature.title}>
                <div className="features-list-col" key={feature.title}>
                  <div href="/features/tournament-management" className="features-list-item">
                    <div className="icon-wrap">
                      <img src={feature.imageSrc} alt="Fast – Easy – Secure Payments" />
                    </div>
                    <h5 className="feature-title">{feature.title}</h5>
                    <p>{feature.text}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default Features;
