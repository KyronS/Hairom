"use client";
import { contactItems } from "@/data/contact";
import { useState } from "react";

const BARBER_WHATSAPP = process.env.NEXT_PUBLIC_BARBER_WHATSAPP_NUMBER || "18683755357";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const [errors, setErrors] = useState({});

  function handleContactSubmit(e) {
    e.preventDefault();
    const form    = e.currentTarget;
    const name    = form.elements["name"].value.trim();
    const email   = form.elements["email"].value.trim();
    const message = form.elements["message"].value.trim();

    // Validate before opening WhatsApp
    const next = {};
    if (!name || name.length < 2)          next.name    = "Please enter your name.";
    if (!email || !EMAIL_RE.test(email))   next.email   = "Please enter a valid email address.";
    if (!message || message.length < 10)   next.message = "Please enter a message (at least 10 characters).";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const text = encodeURIComponent(
      `Hi Hairom!\n\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n\n` +
      `Message:\n${message}`
    );

    window.open(`https://wa.me/${BARBER_WHATSAPP}?text=${text}`, "_blank");
    form.reset();
    setErrors({});
  }

  const errStyle = {
    color: "#ff8080",
    fontSize: 12,
    marginTop: 4,
    display: "block",
  };

  return (
    <div className="container">
      <div className="row mt-n10 mb-60 mb-xs-40">
        <div className="col-md-10 offset-md-1">
          <div className="row">
            {contactItems.map((item, index) => (
              <div key={index} className="col-md-6 col-lg-4 mb-md-30">
                <div className="contact-item wow fadeScaleIn">
                  <div className="ci-icon">
                    <i className={item.iconClass} />
                  </div>
                  <h4 className="ci-title">{item.title}</h4>
                  <div className="ci-text large">{item.text}</div>
                  <div className="ci-link">
                    <a href={item.link.url} target={item.link.target} rel={item.link.rel}>
                      {item.link.text}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="row">
        <div className="col-md-10 offset-md-1">
          <form
            onSubmit={handleContactSubmit}
            noValidate
            className="form contact-form wow fadeInUp wch-unset"
            data-wow-delay=".5s"
            id="contact_form"
          >
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="input-lg round form-control"
                    placeholder="Enter your name"
                    aria-required="true"
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && <span id="name-error" style={errStyle}>{errors.name}</span>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="input-lg round form-control"
                    placeholder="Enter your email"
                    aria-required="true"
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && <span id="email-error" style={errStyle}>{errors.email}</span>}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                name="message"
                id="message"
                className="input-lg round form-control"
                style={{ height: 130 }}
                placeholder="Enter your message"
                aria-required="true"
                aria-describedby={errors.message ? "message-error" : undefined}
              />
              {errors.message && <span id="message-error" style={errStyle}>{errors.message}</span>}
            </div>

            <div className="row">
              <div className="col-sm-6">
                <div className="form-tip pt-20 pt-sm-0">
                  <i className="icon-info size-16" />
                  All fields are required.
                </div>
              </div>
              <div className="col-sm-6">
                <div className="text-end pt-10">
                  <button
                    type="submit"
                    id="submit_btn"
                    aria-controls="result"
                    className="submit_btn link-hover-anim link-circle-1 align-middle"
                    data-link-animate="y"
                  >
                    <span className="link-strong link-strong-unhovered">
                      Send via WhatsApp
                      <i className="mi-arrow-right size-18 align-middle" aria-hidden="true" />
                    </span>
                    <span className="link-strong link-strong-hovered" aria-hidden="true">
                      Send via WhatsApp
                      <i className="mi-arrow-right size-18 align-middle" aria-hidden="true" />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div id="result" role="region" aria-live="polite" aria-atomic="true" />
          </form>
        </div>
      </div>
    </div>
  );
}
