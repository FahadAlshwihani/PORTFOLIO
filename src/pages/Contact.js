import React, { useState } from "react";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    // Placeholder: replace with your email service or API call
    setStatus("sending");
    setTimeout(() => {
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
      setTimeout(() => setStatus(null), 2500);
    }, 800);
  };

  return (
    <section id="contact" className="page-section">
      <div className="section-inner">
        <h2 className="section-title">Contact</h2>
        <p className="section-desc">Let's build something great together. Send a message below.</p>

        <div className="contact-grid">
          <form className="contact-form" onSubmit={onSubmit}>
            <label>
              <span>Name</span>
              <input name="name" value={form.name} onChange={onChange} required />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={onChange} required />
            </label>
            <label>
              <span>Message</span>
              <textarea name="message" rows="6" value={form.message} onChange={onChange} required />
            </label>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit">
                {status === "sending" ? "Sending..." : "Send Message"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setForm({ name: "", email: "", message: "" })}>
                Reset
              </button>
            </div>

            {status === "sent" && <div className="form-success">Message sent. Thank you!</div>}
          </form>

          <div className="contact-info">
            <div className="contact-card">
              <h4>Email</h4>
              <p>hello@codeduo.sa</p>
            </div>
            <div className="contact-card">
              <h4>Phone</h4>
              <p>+966 54 263 0112</p>
            </div>
            <div className="contact-card">
              <h4>Location</h4>
              <p>Riyadh, Saudi Arabia</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
