import React, { useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import FormBtn from "./UI/FormBtn";
import { useDispatch, useSelector } from "react-redux";
import { closePopup, sendData } from "../store/data/data.slice";
import CloseBtn from "./UI/CloseBtn";

const Form = () => {
  const {
    data: {
      form: {
        title,
        firstNamePlaseholder,
        lastNamePlaceholder,
        telegramPlaceholder,
        platforms,
        agreement,
        sendButton,
        confirmationButton,
        error,
        success,
      },
    },
    sendFormStep,
  } = useSelector((state) => state.data);
  const [disabled, setDisabled] = useState(false);
  const dispatch = useDispatch();

  const handleVerificationSuccess = (token, ekey) => {
    if (token && ekey) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  };

  const submitForm = (e) => {
    e.preventDefault();

    const data = new FormData(e.target);

    const bookmaker_1 = data.get("bookmaker_1");
    const bookmaker_2 = data.get("bookmaker_2");
    const bookmaker_3 = data.get("bookmaker_3");

    if (!bookmaker_1 && !bookmaker_2 && !bookmaker_3) {
      return alert("Choose at least one bookmaker");
    }

    const bookmakersArray = [];

    if (bookmaker_1) bookmakersArray.push("Laystars");
    if (bookmaker_2) bookmakersArray.push("PS3838");
    if (bookmaker_3) bookmakersArray.push("Spotrsbet.io");

    data.set("bookmakers", bookmakersArray.join(", "));

    dispatch(sendData(data));
  };

  const closeFormPopup = (e) => {
    e.preventDefault();
    dispatch(closePopup());
  };

  return (
    <>
      <CloseBtn color="black" />
      <form encType="multipart/form-data" method="post" className="form-signin" id="form" acceptCharset="utf-8" onSubmit={submitForm}>
        {sendFormStep === "form" && (
          <div id="sign_up_info">
            <a href="/" className="brand text-center">
              <img src="./assets/images/logo/logo_mobile_v1.png" alt="Desctop Logo" />
            </a>
            <h2 className="form-signin-heading">{title}</h2>
            <div className="form-group">
              <label htmlFor="inputFirstName" className="sr-only">
                {firstNamePlaseholder}
              </label>
              <input
                type="text"
                id="inputFirstName"
                className="form-control"
                placeholder={firstNamePlaseholder}
                name="first_name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="inputLastName" className="sr-only">
                {lastNamePlaceholder}
              </label>
              <input type="text" id="inputLastName" className="form-control" placeholder={lastNamePlaceholder} name="last_name" required />
            </div>
            <div className="form-group">
              <label htmlFor="inputEmail2" className="sr-only">
                Email
              </label>
              <input type="email" id="inputEmail2" className="form-control" placeholder="Email" name="email" required />
            </div>
            <div className="form-group">
              <label htmlFor="inputTelegram" className="sr-only">
                {telegramPlaceholder}
              </label>
              <input type="text" id="inputTelegram" className="form-control" placeholder={telegramPlaceholder} name="telegram" />
            </div>
            <h2 className="form-signin-heading">{platforms}</h2>
            <div className="form-group">
              <label className="custom-control custom-checkbox">
                <input type="checkbox" className="custom-control-input" name="bookmaker_1" />
                <span className="custom-control-indicator"></span>
                <span className="custom-control-description"> Laystars </span>
              </label>
              <label className="custom-control custom-checkbox">
                <input type="checkbox" className="custom-control-input" name="bookmaker_2" />
                <span className="custom-control-indicator"></span>
                <span className="custom-control-description"> PS3838 </span>
              </label>
              <label className="custom-control custom-checkbox">
                <input type="checkbox" className="custom-control-input" name="bookmaker_3" />
                <span className="custom-control-indicator"></span>
                <span className="custom-control-description"> Spotrsbet.io </span>
              </label>
            </div>
            <div className="checkbox mb-4 mt-4">
              <label className="custom-control custom-checkbox">
                <input type="checkbox" className="custom-control-input" name="terms" required />
                <span className="custom-control-indicator"></span>
                <span className="custom-control-description">
                  {agreement.one} <a href="/terms-of-service">{agreement.termsOfServiceLink}</a> {agreement.three} {` `}
                  <a href="/privacy-policy">{agreement.privacyPolicyLink}</a>.
                </span>
              </label>
            </div>
            <HCaptcha
              sitekey="297db1fa-66d4-421c-a642-2d804038ba0e"
              onVerify={(token, ekey) => handleVerificationSuccess(token, ekey)}
              className="hcaptcha"
            />

            <FormBtn disabled={disabled}>{sendButton}</FormBtn>
          </div>
        )}

        {sendFormStep === "success" && (
          <div id="x_sign_up_success" className="alert alert-success">
            <h4 className="alert-title">{success.title}</h4>
            <p>{success.text}</p>
            <FormBtn disabled={false} onClick={closeFormPopup}>
              {confirmationButton}
            </FormBtn>
          </div>
        )}

        {sendFormStep === "error" && (
          <div id="x_sign_up_error" className="alert alert-success">
            <h4 className="alert-title">{error.title}</h4>
            <p>{error.text}</p>
            <FormBtn disabled={false} onClick={closeFormPopup}>
              {confirmationButton}
            </FormBtn>
          </div>
        )}
      </form>
    </>
  );
};

export default Form;
