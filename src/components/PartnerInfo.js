import React from "react";
import { useSelector } from "react-redux";
import CloseBtn from "./UI/CloseBtn";

const partnersInfo = {
  laystars: {
    img: "/assets/images/partners/laystars.png",
    text: [
      "Laystars is a prominent partner that operates using the betting exchange platform of Betfair, a well-established bet broker with over 20 years of experience. Betfair is renowned as the largest betting exchange in the world, and it provides the full range of traditional sports betting services, including horse racing and sports betting, as well as the ability to place lay bets on horses.",
      "In a lay bet, the bettor is wagering against an outcome, rather than betting on a specific outcome to happen. Typically, bookmakers offer the lay side of a bet, setting the odds that they are willing to lay. However, on the Betfair Exchange, customers can both back and lay bets themselves, matching their wagers with fellow bettors instead of the bookmaker. This creates a unique peer-to-peer betting experience where customers can choose to be the backer or layer of a bet.",
      "Laystars is a top partner because of its ability to offer customers access to the Betfair Exchange, and its lay betting calculator, which helps bettors calculate the liability and potential profit from a lay bet. By partnering with Laystars, customers can benefit from the advanced features and functionality of the Betfair Exchange, while also enjoying the support and expertise of Laystars' team of professionals.",
    ],
  },
  ps3838: {
    img: "/assets/images/partners/ps3838.png",
    text: [
      "PS3838 is a premier Asian bet bookmaker that has been in operation since 1998. The platform is dedicated to providing players with the best possible betting experience, and is powered by Pinnacle, one of the top sports betting providers worldwide. PS3838 is well-known for operating on the lowest possible bookmarking margin, which translates to offering punters the best possible odds.",
      "As one of the top betting brokers in our portfolio, PS3838 provides access to a wide range of sports and betting markets, including traditional sports such as football, basketball, tennis, hockey, golf, cricket, and baseball, as well as e-sports. The platform offers some of the highest betting limits in the industry, making it a top choice for professional bettors.",
      "In addition to its diverse selection of sports and betting markets, PS3838 prides itself on its commitment to giving back to players. The platform offers a range of bonuses and promotions to help players maximize their winnings, and provides exceptional customer service to ensure that all players have a positive experience.",
      "Overall, PS3838 is a top choice for anyone looking for a premium betting experience with excellent odds, high betting limits, and a diverse range of sports and markets. Whether you're a seasoned professional or a casual bettor, PS3838 has something to offer for everyone.",
    ],
  },
  sportsbet: {
    img: "/assets/images/partners/sportsbetio.png",
    text: [
      "Sportsbet.io is an online gambling platform that offers a unique combination of sports betting, casino games, and Bitcoin betting opportunities. The platform was established in 2016 and is based in Curacao, with a license from the Government of Curacao. Sportsbet.io has partnered with BitCasino.io and uses the Coingaming.io Bitcoin Gaming Platform, ensuring a top-notch betting and gaming experience for its customers.",
      "Sportsbet.io has established a reputation as a leader in Bitcoin sports betting, with a focus on delivering fast, fun, and fair betting experiences for its users. The platform offers a range of sports betting options, including live betting, virtual sports, and e-sports, and accepts Bitcoin as a payment method. This allows users to place bets anonymously and easily, with account creation taking only a matter of seconds.",
      "One of the unique aspects of Sportsbet.io is its commitment to fair betting practices. The platform ensures that all bets are settled promptly and accurately, and offers a range of tools and resources to help users make informed betting decisions. In addition, Sportsbet.io offers excellent customer service, with a team of dedicated professionals available 24/7 to assist with any questions or concerns.",
      "Overall, Sportsbet.io is a top choice for anyone looking for a fun and exciting betting experience that combines sports betting, casino games, and Bitcoin betting opportunities. With its commitment to fair betting practices, excellent customer service, and a wide range of betting options, Sportsbet.io offers something for everyone.",
    ],
  },
};

const PartnerInfo = () => {
  const { currentPartner } = useSelector((state) => state.data);

  return (
    <>
      <CloseBtn />
      <div className="partners__container">
        <div className="partners__content">
          <div className="partners__list">
            <div className="partner">
              <img src={partnersInfo[currentPartner].img} alt="partnersInfo.laystars.img" />
              {partnersInfo[currentPartner].text.map((p) => (
                <p key={p} className={["partner-text-block"].join(" ")}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PartnerInfo;
