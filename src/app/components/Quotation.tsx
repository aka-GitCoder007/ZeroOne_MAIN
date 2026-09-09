"use client";

import { useState, useEffect } from "react";
import { Quotation as QuotationType } from "../types";
import api from "../lib/api";
import "./Quotation.css";


interface QuotationProps {
  onComplete?: () => void;
}

export default function Quotation({ onComplete }: QuotationProps) {
  // Step State: 0 = Landing, 1 = Details, 2 = Services, 3 = Project, 4 = Budget/Timeline, 5 = Review, 6 = Success
  const [step, setStep] = useState<number>(0);

  // Form State
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [otherService, setOtherService] = useState("");

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [hasExistingWebsite, setHasExistingWebsite] = useState<boolean>(false);
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [contactPreference, setContactPreference] = useState<string[]>(["Email"]);
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Validation & Submission States
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string>("");

  // Listen for Escape key to reset or go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (step > 0 && step < 6) {
          setStep((prev) => prev - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step]);

  // Service Options
  const serviceOptions = [
    "Business Website",
    "E-Commerce Website",
    "Portfolio Website",
    "Landing Page",
    "Web Application",
    "Website Redesign",
    "Custom Development",
    "Other",
  ];

  // Budget Options
  const budgetOptions = [
    "₹10,000 – ₹25,000",
    "₹25,000 – ₹50,000",
    "₹50,000 – ₹1,00,000",
    "₹1,00,000+",
    "Not sure yet",
  ];

  // Timeline Options
  const timelineOptions = [
    "Immediately",
    "Within 1–2 weeks",
    "Within 1 month",
    "1–3 months",
    "Just exploring",
  ];

  // Contact Preference Options
  const contactOptions = ["WhatsApp", "Phone Call", "Email"];

  // Toggle multi-select item in array
  const toggleArrayItem = (array: string[], item: string): string[] => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    } else {
      return [...array, item];
    }
  };

  // Step Validation Helpers
  const validateStep1 = (): boolean => {
    setStepError(null);
    if (!fullName.trim()) {
      setStepError("Please enter your full name.");
      return false;
    }
    if (!email.trim()) {
      setStepError("Please enter your email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setStepError("Please enter a valid email address.");
      return false;
    }
    if (!phone.trim()) {
      setStepError("Please enter your phone or WhatsApp number.");
      return false;
    }
    if (phone.trim().length < 7) {
      setStepError("Please enter a valid phone number.");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setStepError(null);
    if (selectedServices.length === 0) {
      setStepError("Please select at least one service.");
      return false;
    }
    if (selectedServices.includes("Other") && !otherService.trim()) {
      setStepError("Please specify your custom service requirement.");
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    setStepError(null);
    if (!projectName.trim()) {
      setStepError("Please enter your project or business name.");
      return false;
    }
    if (!description.trim()) {
      setStepError("Please tell us about your project requirements.");
      return false;
    }
    if (description.trim().length > 1000) {
      setStepError("Project description cannot exceed 1000 characters.");
      return false;
    }
    if (hasExistingWebsite && websiteUrl.trim()) {
      const urlPattern = /^(https?:\/\/)?([\w.-]+)+[\w\-_~:/?#[\]@!$&'()*+,;=.]+$/i;
      if (!urlPattern.test(websiteUrl.trim())) {
        setStepError("Please enter a valid website URL (e.g., https://example.com).");
        return false;
      }
    }
    return true;
  };

  const validateStep4 = (): boolean => {
    setStepError(null);
    if (!budget) {
      setStepError("Please select an estimated budget range.");
      return false;
    }
    if (!timeline) {
      setStepError("Please select when you plan to start your project.");
      return false;
    }
    if (contactPreference.length === 0) {
      setStepError("Please select at least one preferred contact method.");
      return false;
    }
    if (additionalInfo.length > 500) {
      setStepError("Additional information cannot exceed 500 characters.");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;

    setStepError(null);
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStepError(null);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSubmitQuotation = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStepError(null);

    const payload: Partial<QuotationType> = {
      fullName: fullName.trim(),
      companyName: companyName.trim() || undefined,
      email: email.trim(),
      phone: phone.trim(),
      services: selectedServices,
      otherService: selectedServices.includes("Other") ? otherService.trim() : undefined,
      projectName: projectName.trim(),
      description: description.trim(),
      hasExistingWebsite,
      websiteUrl: hasExistingWebsite && websiteUrl.trim() ? websiteUrl.trim() : undefined,
      budget,
      timeline,
      contactPreference,
      additionalInformation: additionalInfo.trim() || undefined,
    };

    const res = await api.quotations.create(payload);
    setIsSubmitting(false);

    if (res.success && res.data) {
      const generatedReqId = res.data.requestId || "ZR-2026-SUBMITTED";
      setSubmittedRequestId(generatedReqId);
      setStep(6); // Success Step
    } else {
      setStepError(res.message || "Failed to submit quotation. Please check your network and try again.");
    }
  };

  const resetForm = () => {
    setStep(0);
    setFullName("");
    setCompanyName("");
    setEmail("");
    setPhone("");
    setSelectedServices([]);
    setOtherService("");
    setProjectName("");
    setDescription("");
    setHasExistingWebsite(false);
    setWebsiteUrl("");
    setBudget("");
    setTimeline("");
    setContactPreference(["Email"]);
    setAdditionalInfo("");
    setStepError(null);
    setSubmittedRequestId("");
    if (onComplete) onComplete();
  };

  // Render Step Indicator for Steps 1-5
  const renderProgressIndicator = () => {
    const stepsList = [
      { num: "01", label: "DETAILS" },
      { num: "02", label: "REQUIREMENTS" },
      { num: "03", label: "PROJECT" },
      { num: "04", label: "BUDGET" },
      { num: "05", label: "REVIEW" },
    ];

    return (
      <div className="quotation-progress-container">
        <div className="progress-bar">
          {stepsList.map((st, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            return (
              <div key={st.num} className="progress-step-wrapper">
                <button
                  type="button"
                  className={`progress-step-node ${isActive ? "active" : ""} ${
                    isCompleted ? "completed" : ""
                  }`}
                  onClick={() => {
                    if (isCompleted) setStep(stepNum);
                  }}
                  disabled={!isCompleted && !isActive}
                  aria-label={`Step ${st.num}: ${st.label}`}
                >
                  {isCompleted ? "✓" : st.num}
                </button>
                <span className={`progress-step-label ${isActive ? "active" : ""}`}>
                  {st.label}
                </span>
                {idx < stepsList.length - 1 && (
                  <div
                    className={`progress-line ${
                      step > stepNum ? "filled" : ""
                    }`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="quotation-container animate-fade-in">
      {/* STEP 0: LANDING EXPERIENCE */}
      {step === 0 && (
        <section className="quotation-landing">
          <div className="landing-badge text-replica">
            <span>PROJECT ONBOARDING</span>
          </div>
          <h1 className="landing-title">
            START YOUR <span className="text-gradient">PROJECT</span>
          </h1>
          <p className="landing-subtitle">
            Let's build something exceptional. Tell us about your business, your goals, and what you need.
            We'll review your requirements and get back to you with a tailored quotation.
          </p>

          <div className="landing-features-grid">
            <div className="feature-card glass-panel">
              <div className="feature-icon">❖</div>
              <h3>Tailored Architecture</h3>
              <p>Custom software and luxury web systems crafted for maximum scale.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">⚡</div>
              <h3>Rapid Response</h3>
              <p>Detailed technical scope & transparent pricing breakdown within 24 hours.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">✦</div>
              <h3>World-Class Design</h3>
              <p>Award-winning digital aesthetics built for industry visionaries.</p>
            </div>
          </div>

          <div className="landing-cta-wrap">
            <button className="btn-primary btn-start-quotation" onClick={() => setStep(1)}>
              START QUOTATION →
            </button>
          </div>
        </section>
      )}

      {/* STEPS 1 to 5: MULTI-STEP FORM WRAPPER */}
      {step >= 1 && step <= 5 && (
        <div className="quotation-form-wrapper glass-panel animate-slide-up">
          {/* Header & Progress Bar */}
          {renderProgressIndicator()}

          {/* STEP 01: YOUR DETAILS */}
          {step === 1 && (
            <div className="form-step-content">
              <div className="step-header">
                <span className="step-badge">STEP 01</span>
                <h2>YOUR DETAILS</h2>
                <p>Tell us who we'll be working with.</p>
              </div>

              <div className="step-fields-grid">
                <div className="form-group">
                  <label htmlFor="full-name-field" className="form-label">
                    FULL NAME *
                  </label>
                  <input
                    id="full-name-field"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (stepError) setStepError(null);
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company-name-field" className="form-label">
                    COMPANY / BUSINESS NAME
                  </label>
                  <input
                    id="company-name-field"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Acme Innovations"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email-field" className="form-label">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    id="email-field"
                    type="email"
                    className="form-input"
                    placeholder="rahul@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (stepError) setStepError(null);
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone-field" className="form-label">
                    PHONE / WHATSAPP *
                  </label>
                  <input
                    id="phone-field"
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (stepError) setStepError(null);
                    }}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 02: SERVICES */}
          {step === 2 && (
            <div className="form-step-content">
              <div className="step-header">
                <span className="step-badge">STEP 02</span>
                <h2>WHAT CAN WE BUILD FOR YOU?</h2>
                <p>Select all services that apply to your project vision.</p>
              </div>

              <div className="options-cards-grid">
                {serviceOptions.map((service) => {
                  const isSelected = selectedServices.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      className={`option-card ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedServices(toggleArrayItem(selectedServices, service));
                        if (stepError) setStepError(null);
                      }}
                    >
                      <div className="option-check-icon">{isSelected ? "✓" : "+"}</div>
                      <span className="option-title">{service}</span>
                    </button>
                  );
                })}
              </div>

              {/* Conditional input if 'Other' service is selected */}
              {selectedServices.includes("Other") && (
                <div className="form-group conditional-input animate-fade-in">
                  <label htmlFor="other-service-field" className="form-label">
                    PLEASE SPECIFY YOUR REQUIREMENT *
                  </label>
                  <input
                    id="other-service-field"
                    type="text"
                    className="form-input"
                    placeholder="Describe your custom requirement..."
                    value={otherService}
                    onChange={(e) => {
                      setOtherService(e.target.value);
                      if (stepError) setStepError(null);
                    }}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 03: PROJECT DETAILS */}
          {step === 3 && (
            <div className="form-step-content">
              <div className="step-header">
                <span className="step-badge">STEP 03</span>
                <h2>PROJECT DETAILS</h2>
                <p>Describe your project goals and requirements.</p>
              </div>

              <div className="step-fields-column">
                <div className="form-group">
                  <label htmlFor="project-name-field" className="form-label">
                    PROJECT / BUSINESS NAME *
                  </label>
                  <input
                    id="project-name-field"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Apex Luxury Portal"
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e.target.value);
                      if (stepError) setStepError(null);
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <div className="label-with-counter">
                    <label htmlFor="project-desc-field" className="form-label">
                      TELL US ABOUT YOUR PROJECT *
                    </label>
                    <span
                      className={`char-counter ${
                        description.length > 1000 ? "exceeded" : ""
                      }`}
                    >
                      {description.length} / 1000
                    </span>
                  </div>
                  <textarea
                    id="project-desc-field"
                    className="form-textarea"
                    placeholder="Tell us about your business, what you want to build, and what you want the website or application to achieve."
                    value={description}
                    maxLength={1000}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (stepError) setStepError(null);
                    }}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">DO YOU ALREADY HAVE A WEBSITE?</label>
                  <div className="toggle-buttons-group">
                    <button
                      type="button"
                      className={`toggle-btn ${hasExistingWebsite ? "active" : ""}`}
                      onClick={() => setHasExistingWebsite(true)}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${!hasExistingWebsite ? "active" : ""}`}
                      onClick={() => {
                        setHasExistingWebsite(false);
                        setWebsiteUrl("");
                      }}
                    >
                      NO
                    </button>
                  </div>
                </div>

                {hasExistingWebsite && (
                  <div className="form-group conditional-input animate-fade-in">
                    <label htmlFor="current-website-field" className="form-label">
                      CURRENT WEBSITE URL
                    </label>
                    <input
                      id="current-website-field"
                      type="url"
                      className="form-input"
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => {
                        setWebsiteUrl(e.target.value);
                        if (stepError) setStepError(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 04: BUDGET, TIMELINE & CONTACT PREFERENCE */}
          {step === 4 && (
            <div className="form-step-content">
              <div className="step-header">
                <span className="step-badge">STEP 04</span>
                <h2>BUDGET & TIMELINE</h2>
                <p>Help us understand your investment and delivery expectations.</p>
              </div>

              <div className="step-fields-column">
                {/* Budget Section */}
                <div className="section-block">
                  <label className="form-label">WHAT'S YOUR ESTIMATED BUDGET? *</label>
                  <div className="options-chips-grid">
                    {budgetOptions.map((bOpt) => {
                      const isSelected = budget === bOpt;
                      return (
                        <button
                          key={bOpt}
                          type="button"
                          className={`chip-card ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setBudget(bOpt);
                            if (stepError) setStepError(null);
                          }}
                        >
                          {bOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="section-block">
                  <label className="form-label">WHEN DO YOU WANT TO START? *</label>
                  <div className="options-chips-grid">
                    {timelineOptions.map((tOpt) => {
                      const isSelected = timeline === tOpt;
                      return (
                        <button
                          key={tOpt}
                          type="button"
                          className={`chip-card ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setTimeline(tOpt);
                            if (stepError) setStepError(null);
                          }}
                        >
                          {tOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contact Preference Section */}
                <div className="section-block">
                  <label className="form-label">HOW SHOULD WE CONTACT YOU? *</label>
                  <div className="options-chips-grid">
                    {contactOptions.map((cOpt) => {
                      const isSelected = contactPreference.includes(cOpt);
                      return (
                        <button
                          key={cOpt}
                          type="button"
                          className={`chip-card ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setContactPreference(toggleArrayItem(contactPreference, cOpt));
                            if (stepError) setStepError(null);
                          }}
                        >
                          {cOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="form-group">
                  <div className="label-with-counter">
                    <label htmlFor="additional-info-field" className="form-label">
                      ANYTHING ELSE WE SHOULD KNOW? (OPTIONAL)
                    </label>
                    <span
                      className={`char-counter ${
                        additionalInfo.length > 500 ? "exceeded" : ""
                      }`}
                    >
                      {additionalInfo.length} / 500
                    </span>
                  </div>
                  <textarea
                    id="additional-info-field"
                    className="form-textarea"
                    placeholder="Special requirements, reference websites, specific integrations..."
                    value={additionalInfo}
                    maxLength={500}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* STEP 05: REVIEW & SUBMIT */}
          {step === 5 && (
            <div className="form-step-content">
              <div className="step-header">
                <span className="step-badge">STEP 05</span>
                <h2>REVIEW YOUR QUOTATION</h2>
                <p>Verify your details before submitting your enquiry.</p>
              </div>

              <div className="review-summary-card">
                <div className="summary-section">
                  <div className="summary-section-header">
                    <h4>CLIENT DETAILS</h4>
                    <button
                      type="button"
                      className="btn-link-edit"
                      onClick={() => setStep(1)}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="summary-grid">
                    <div>
                      <span className="summary-label">Name:</span> {fullName}
                    </div>
                    {companyName && (
                      <div>
                        <span className="summary-label">Company:</span> {companyName}
                      </div>
                    )}
                    <div>
                      <span className="summary-label">Email:</span> {email}
                    </div>
                    <div>
                      <span className="summary-label">Phone:</span> {phone}
                    </div>
                  </div>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-section">
                  <div className="summary-section-header">
                    <h4>SERVICES REQUIRED</h4>
                    <button
                      type="button"
                      className="btn-link-edit"
                      onClick={() => setStep(2)}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="services-tags-list">
                    {selectedServices.map((s) => (
                      <span key={s} className="summary-service-tag">
                        {s === "Other" && otherService ? `Other (${otherService})` : s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-section">
                  <div className="summary-section-header">
                    <h4>PROJECT SPECIFICATIONS</h4>
                    <button
                      type="button"
                      className="btn-link-edit"
                      onClick={() => setStep(3)}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="summary-grid">
                    <div>
                      <span className="summary-label">Project Name:</span> {projectName}
                    </div>
                    {hasExistingWebsite && websiteUrl && (
                      <div>
                        <span className="summary-label">Current Website:</span> {websiteUrl}
                      </div>
                    )}
                  </div>
                  <div className="summary-text-block">
                    <span className="summary-label">Description:</span>
                    <p className="desc-preview">"{description}"</p>
                  </div>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-section">
                  <div className="summary-section-header">
                    <h4>BUDGET, TIMELINE & CONTACT</h4>
                    <button
                      type="button"
                      className="btn-link-edit"
                      onClick={() => setStep(4)}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="summary-grid">
                    <div>
                      <span className="summary-label">Estimated Budget:</span> {budget}
                    </div>
                    <div>
                      <span className="summary-label">Start Timeline:</span> {timeline}
                    </div>
                    <div>
                      <span className="summary-label">Contact Via:</span>{" "}
                      {contactPreference.join(", ")}
                    </div>
                  </div>
                  {additionalInfo && (
                    <div className="summary-text-block">
                      <span className="summary-label">Additional Info:</span>
                      <p className="desc-preview">"{additionalInfo}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step Error Inline Display */}
          {stepError && (
            <div className="inline-validation-error">
              <span className="error-icon">⚠</span>
              <span>{stepError}</span>
            </div>
          )}

          {/* Form Navigation Controls */}
          <div className="step-actions">
            <button type="button" className="btn-cancel" onClick={handlePrevStep}>
              ← BACK
            </button>

            {step < 5 ? (
              <button type="button" className="btn-primary" onClick={handleNextStep}>
                CONTINUE →
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary btn-submit-quotation"
                onClick={handleSubmitQuotation}
                disabled={isSubmitting}
              >
                {isSubmitting ? "SUBMITTING..." : "REQUEST MY QUOTATION →"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 6: SUCCESS CONFIRMATION SCREEN */}
      {step === 6 && (
        <section className="quotation-success-screen glass-panel animate-slide-up">
          <div className="success-icon-wrap">
            <span className="checkmark-icon">✓</span>
          </div>
          <h2 className="success-title">REQUEST RECEIVED</h2>
          <p className="success-message">
            Thank you for reaching out to ZER0ONE. We've received your project requirements.
            Our team will review your enquiry and contact you shortly.
          </p>

          <div className="request-id-badge">
            <span className="badge-label">REQUEST ID</span>
            <span className="badge-code">#{submittedRequestId}</span>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={resetForm}>
              BACK TO ZER0ONE
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
