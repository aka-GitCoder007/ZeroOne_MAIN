"use client";

import { useState, useEffect } from "react";
import ClientReviews from "./ClientReviews";
import Quotation from "./Quotation";
import { Project, Review } from "../types";
import api from "../lib/api";
import "./CustomerMode.css";

export default function CustomerMode() {
  const [activeTab, setActiveTab] = useState<"work" | "reviews" | "quotation">("work");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Loading & Error States
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Modal and Form States in CustomerMode WORK view
  const [selectedProject, setSelectedProject] = useState<number | string | null>(null);
  const [inspectProject, setInspectProject] = useState<Project | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewStars, setReviewStars] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);

  // Get It / Interest Modal States
  const [getItProject, setGetItProject] = useState<Project | null>(null);
  const [interestName, setInterestName] = useState("");
  const [interestEmail, setInterestEmail] = useState("");
  const [interestMessage, setInterestMessage] = useState("");
  const [interestSuccess, setInterestSuccess] = useState(false);

  // Payment Modal States
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Fetch projects from MongoDB API
  const fetchWorkProjects = async () => {
    setLoadingProjects(true);
    setProjectsError(null);
    const res = await api.projects.getAll("work");
    if (res.success && Array.isArray(res.data)) {
      setProjects(res.data);
    } else {
      setProjectsError(res.message || "Failed to load projects from server.");
    }
    setLoadingProjects(false);
  };

  // Fetch reviews from MongoDB API
  const fetchReviews = async () => {
    setLoadingReviews(true);
    setReviewsError(null);
    const res = await api.reviews.getAll();
    if (res.success && Array.isArray(res.data)) {
      setReviews(res.data);
    } else {
      setReviewsError(res.message || "Failed to load client reviews.");
    }
    setLoadingReviews(false);
  };

  useEffect(() => {
    fetchWorkProjects();
    fetchReviews();
  }, []);

  const handleAddReviewLocally = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || isSubmittingReview) return;

    const trimmedAuthor = reviewAuthor.trim();
    const trimmedText = reviewText.trim();

    if (!trimmedAuthor) {
      setReviewSubmitError("Please enter your name.");
      return;
    }
    if (!trimmedText) {
      setReviewSubmitError("Please share your feedback before submitting.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewSubmitError(null);

    const targetProj = projects.find((p) => String(p._id || p.id) === String(selectedProject));
    const projIdToSubmit = targetProj?._id ? String(targetProj._id) : String(selectedProject);

    const res = await api.reviews.create({
      projectId: projIdToSubmit,
      text: trimmedText,
      author: trimmedAuthor,
      stars: reviewStars,
    });

    setIsSubmittingReview(false);

    if (res.success && res.data) {
      handleAddReviewLocally(res.data);
      setReviewText("");
      setReviewAuthor("");
      setReviewStars(5);
      setReviewSubmitError(null);
      setReviewSubmitSuccess(true);
      fetchReviews();
      // Auto-close after 2s
      setTimeout(() => {
        setSelectedProject(null);
        setReviewSubmitSuccess(false);
      }, 2000);
    } else {
      setReviewSubmitError(res.message || "Failed to submit review. Please try again.");
    }
  };

  const handlePayment = async () => {
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setPaymentMessage({ text: "Please enter a valid payment amount.", isError: true });
      return;
    }

    setIsProcessingPayment(true);
    setPaymentMessage(null);

    const res = await api.payments.createOrder(amountNum);
    setIsProcessingPayment(false);

    if (res.success && res.data) {
      setPaymentMessage({
        text: `Order created successfully! (Order ID: ${res.data.order?.id || res.data.paymentRecord?.orderId}). Proceeding with checkout...`,
        isError: false
      });
      setTimeout(() => {
        setPaymentMessage({ text: "Payment Order Created on Server!", isError: false });
        setTimeout(() => {
          setShowPayment(false);
          setPaymentAmount("");
          setPaymentMessage(null);
        }, 1500);
      }, 1000);
    } else {
      setPaymentMessage({
        text: res.message || "Payment order creation failed.",
        isError: true
      });
    }
  };

  const getProjectInitials = (name: string) => {
    if (!name) return "ZO";
    const words = name.trim().split(" ");
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getProjectGradient = (id: string | number) => {
    const gradients = [
      "linear-gradient(135deg, #09121d 0%, #152c42 50%, #004e92 100%)",
      "linear-gradient(135deg, #10002b 0%, #240046 50%, #3c096c 100%)",
      "linear-gradient(135deg, #081c15 0%, #1b4332 50%, #2d6a4f 100%)",
      "linear-gradient(135deg, #1c0a00 0%, #361500 50%, #5c2400 100%)",
      "linear-gradient(135deg, #141414 0%, #22223b 50%, #4a4e69 100%)",
    ];
    const charCodeSum = String(id).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[charCodeSum % gradients.length];
  };



  return (
    <div className="customer-mode animate-fade-in">
      {/* Header */}
      <header className="header glass-panel">
        <div
          className="logo-small text-replica"
          onClick={() => setActiveTab("work")}
          style={{ cursor: "pointer" }}
        >
          Z E R <span className="slashed-o">O</span> O N E
        </div>

        <nav className="header-nav">
          <button
            className={`nav-tab ${activeTab === "work" ? "active" : ""}`}
            onClick={() => setActiveTab("work")}
          >
            WORK
          </button>
          <button
            className={`nav-tab ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            CLIENT REVIEWS
          </button>
          <button
            className={`nav-tab ${activeTab === "quotation" ? "active" : ""}`}
            onClick={() => setActiveTab("quotation")}
          >
            QUOTATION
          </button>
          <button
            className="btn-primary btn-pay"
            onClick={() => setShowPayment(true)}
          >
            Pay Us
          </button>
        </nav>
      </header>

      {/* Main Content Area based on activeTab */}
      {activeTab === "quotation" ? (
        <Quotation onComplete={() => setActiveTab("work")} />
      ) : activeTab === "reviews" ? (
        <ClientReviews
          projects={projects}
          reviews={reviews}
          onAddReview={handleAddReviewLocally}
          onRefreshData={fetchReviews}
        />
      ) : (
        <>
          <section className="hero">
            <div className="hero-badge animate-fade-in">
              <span>🧠 INNOVATION HUB</span>
            </div>
            <h1 className="hero-title">
              BUILD WHAT DOESN'T <span className="text-gradient">EXISTS.</span>
            </h1>
            <p className="hero-subtitle">
              Explore our original concepts, rate what excites you, and grab what you love.
            </p>
          </section>

          <section className="showcase">
            {loadingProjects ? (
              <div className="empty-state glass-panel" style={{ padding: "48px 40px", textAlign: "center" }}>
                {/* JARVIS AI Brain SVG */}
                <div style={{ display: "inline-block", marginBottom: "20px", position: "relative" }}>
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
                    {/* Rotating outer ring */}
                    <circle cx="50" cy="50" r="46" stroke="#00eaff" strokeWidth="1" strokeDasharray="8 4" opacity="0.4" style={{ animation: "spinRing 4s linear infinite", transformOrigin: "50px 50px" }} />
                    {/* Counter-rotating dashed ring */}
                    <circle cx="50" cy="50" r="40" stroke="#7b2fff" strokeWidth="0.8" strokeDasharray="4 8" opacity="0.35" style={{ animation: "spinRing 6s linear infinite reverse", transformOrigin: "50px 50px" }} />

                    {/* Brain outline — left hemisphere */}
                    <path d="M50 22 C36 22 24 30 22 42 C20 52 24 60 30 65 C28 70 30 76 35 78 C38 80 42 79 44 77 L44 72 C40 70 38 66 40 62" stroke="#00eaff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9" style={{ animation: "glowPulse 2s ease-in-out infinite" }} />
                    {/* Brain outline — right hemisphere */}
                    <path d="M50 22 C64 22 76 30 78 42 C80 52 76 60 70 65 C72 70 70 76 65 78 C62 80 58 79 56 77 L56 72 C60 70 62 66 60 62" stroke="#00eaff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9" style={{ animation: "glowPulse 2s ease-in-out infinite 0.3s" }} />
                    {/* Center divide */}
                    <line x1="50" y1="22" x2="50" y2="77" stroke="#7b2fff" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

                    {/* Neural circuit lines — left */}
                    <path d="M40 62 C36 58 30 55 28 50" stroke="#00eaff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
                    <path d="M36 45 C32 42 30 38 33 34" stroke="#00eaff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
                    <path d="M44 40 C40 36 38 32 40 28" stroke="#7b2fff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
                    <path d="M44 52 C38 50 34 52 30 50" stroke="#00eaff" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />

                    {/* Neural circuit lines — right */}
                    <path d="M60 62 C64 58 70 55 72 50" stroke="#00eaff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
                    <path d="M64 45 C68 42 70 38 67 34" stroke="#00eaff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5" />
                    <path d="M56 40 C60 36 62 32 60 28" stroke="#7b2fff" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
                    <path d="M56 52 C62 50 66 52 70 50" stroke="#00eaff" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4" />

                    {/* Glowing neural nodes */}
                    <circle cx="50" cy="50" r="3.5" fill="#00eaff" style={{ animation: "nodePulse 1.4s ease-in-out infinite" }} />
                    <circle cx="36" cy="45" r="2" fill="#7b2fff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.2s" }} />
                    <circle cx="64" cy="45" r="2" fill="#7b2fff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.4s" }} />
                    <circle cx="30" cy="50" r="1.5" fill="#00eaff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.6s" }} />
                    <circle cx="70" cy="50" r="1.5" fill="#00eaff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.8s" }} />
                    <circle cx="44" cy="40" r="1.5" fill="#00eaff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.1s" }} />
                    <circle cx="56" cy="40" r="1.5" fill="#00eaff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.5s" }} />
                    <circle cx="33" cy="34" r="1.5" fill="#7b2fff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.7s" }} />
                    <circle cx="67" cy="34" r="1.5" fill="#7b2fff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.9s" }} />
                    <circle cx="40" cy="28" r="1.5" fill="#00eaff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.3s" }} />
                    <circle cx="60" cy="28" r="1.5" fill="#00eaff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 1.1s" }} />
                    <circle cx="35" cy="78" r="1.5" fill="#00eaff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.15s" }} />
                    <circle cx="65" cy="78" r="1.5" fill="#00eaff" style={{ animation: "nodePulse 1.4s ease-in-out infinite 0.45s" }} />

                    {/* Center core glow */}
                    <circle cx="50" cy="50" r="7" fill="#00eaff" opacity="0.08" style={{ animation: "coreGlow 2s ease-in-out infinite" }} />
                  </svg>
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#00eaff", letterSpacing: "1px", marginBottom: "10px", textTransform: "none" }}>
                  Training neurons on awesomeness...
                </h3>
                <p style={{ color: "#aaa", fontSize: "0.95rem", fontStyle: "italic" }}>
                  404 boredom not found — cool projects incoming! ⚡
                </p>
              </div>
            ) : projectsError ? (
              <div className="empty-state glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                <div className="empty-icon" style={{ color: "#ff5252" }}>⚠</div>
                <h3>UNABLE TO LOAD PROJECTS</h3>
                <p>{projectsError}</p>
                <button className="btn-primary" style={{ marginTop: "15px" }} onClick={fetchWorkProjects}>
                  RETRY
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="empty-state glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                <div className="empty-icon">❖</div>
                <h3>NO PROJECTS MATCH THIS FILTER</h3>
                <p>No showcase projects found in the selected category.</p>
              </div>
            ) : (
              <div className="grid-v2">
                {projects.map((project) => {
                  const projIdStr = String(project._id || project.id);

                  return (
                    <div key={projIdStr} className="project-card-v2 glass-panel animate-slide-up">
                      {/* Card Cover Header with Image or Generative Artwork */}
                      <div className="card-cover-wrapper" onClick={() => setInspectProject(project)}>
                        {project.image ? (
                          <div
                            className="card-cover-img"
                            style={{ backgroundImage: `url(${project.image})` }}
                          />
                        ) : (
                          <div
                            className="card-cover-art"
                            style={{ background: getProjectGradient(projIdStr) }}
                          >
                            <div className="art-cyber-grid"></div>
                            <div className="art-monogram-circle">
                              <span>{getProjectInitials(project.name)}</span>
                            </div>
                            <div className="art-brand-stamp">ZER0ONE DIGITAL ARCHITECTURE</div>
                          </div>
                        )}

                        {/* Top Badges — Live demo only */}
                        <div className="card-top-badges">
                          {project.websiteUrl && (
                            <a
                              href={project.websiteUrl.startsWith("http") ? project.websiteUrl : `https://${project.websiteUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="live-link-pill"
                              onClick={(e) => e.stopPropagation()}
                              title="Visit Live Demo"
                            >
                              🌐 Live Demo ↗
                            </a>
                          )}
                        </div>

                        {/* Hover Action Overlay */}
                        <div className="card-hover-overlay">
                          <span className="btn-inspect-hover">🔍 Inspect Specifications</span>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="card-body">
                        {/* Star Rating Display */}
                        <div className="card-star-rating">
                          {[1,2,3,4,5].map((s) => (
                            <span key={s} className="display-star">★</span>
                          ))}
                          <span className="star-label">Rate it!</span>
                        </div>

                        <h3 className="project-title" onClick={() => setInspectProject(project)}>
                          {project.name}
                        </h3>

                        {/* Price & Valuation */}
                        <div className="card-price-row">
                          <div className="price-group">
                            <span className="price-subtext">VALUATION</span>
                            <span className="price-amount">
                              {typeof project.price === "number"
                                ? `₹${project.price.toLocaleString("en-IN")}`
                                : project.price || "Contact Us"}
                            </span>
                          </div>
                          
                          <div className="tech-badge-group">
                            <span className="tech-tag">CUSTOM SYSTEM</span>
                          </div>
                           {/* Card Action Controls */}
                        <div className="card-footer-actions">
                          <button
                            className="btn-card-inspect"
                            onClick={() => setInspectProject(project)}
                          >
                            ❆ Inspect Details
                          </button>

                          <button
                            className="btn-get-it"
                            onClick={() => {
                              setInterestName("");
                              setInterestEmail("");
                              setInterestMessage(`Hi ZER0ONE! I'm interested in "${project.name}". Please reach out to me.`);
                              setInterestSuccess(false);
                              setGetItProject(project);
                            }}
                          >
                            🚀 Get It
                          </button>
                        </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Review Modal in CustomerMode Work Tab */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => { setSelectedProject(null); setReviewSubmitSuccess(false); }}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => { setSelectedProject(null); setReviewSubmitSuccess(false); }}>✕</button>
            <h2>Write a Review</h2>
            <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "16px" }}>
              For <strong style={{ color: "#fff" }}>{projects.find((p) => String(p._id || p.id) === String(selectedProject))?.name}</strong>
            </p>

            {reviewSubmitSuccess ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✓</div>
                <h3 style={{ color: "#00e5ff", marginBottom: "8px" }}>Review Submitted!</h3>
                <p style={{ color: "#aaa", fontSize: "0.9rem" }}>Thank you for sharing your experience with ZER0ONE.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit}>
                {/* Star Rating */}
                <div className="star-rating-input" style={{ marginBottom: "14px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= reviewStars ? "active" : ""}`}
                      onClick={() => setReviewStars(star)}
                      style={{ cursor: "pointer", fontSize: "1.5rem" }}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Author Name */}
                <input
                  type="text"
                  placeholder="Your name (e.g. Rahul Sharma)"
                  value={reviewAuthor}
                  onChange={(e) => { setReviewAuthor(e.target.value); if (reviewSubmitError) setReviewSubmitError(null); }}
                  required
                  style={{ width: "100%", marginBottom: "10px", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.95rem" }}
                />

                {/* Review Text */}
                <textarea
                  value={reviewText}
                  onChange={(e) => { setReviewText(e.target.value); if (reviewSubmitError) setReviewSubmitError(null); }}
                  placeholder="Share your experience working with ZER0ONE..."
                  required
                  style={{ width: "100%", minHeight: "100px", marginBottom: "10px", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.95rem", resize: "vertical" }}
                />

                {reviewSubmitError && (
                  <div style={{ color: "#ff5252", fontSize: "0.85rem", marginBottom: "10px" }}>
                    ⚠ {reviewSubmitError}
                  </div>
                )}
                <div className="modal-actions">
                  <button type="button" onClick={() => { setSelectedProject(null); setReviewSubmitSuccess(false); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmittingReview}>
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Project Detail Inspection Modal */}
      {inspectProject && (
        <div className="modal-overlay" onClick={() => setInspectProject(null)}>
          <div className="modal-content glass-panel project-inspect-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setInspectProject(null)}>✕</button>
            
            <div className="inspect-header-banner">
              {inspectProject.image ? (
                <div
                  className="inspect-banner-img"
                  style={{ backgroundImage: `url(${inspectProject.image})` }}
                />
              ) : (
                <div
                  className="inspect-banner-art"
                  style={{ background: getProjectGradient(inspectProject._id || inspectProject.id) }}
                >
                  <div className="art-cyber-grid"></div>
                  <div className="art-monogram-circle large">
                    <span>{getProjectInitials(inspectProject.name)}</span>
                  </div>
                </div>
              )}
              <span className={`status-pill ${inspectProject.status === "Delivered" ? "status-delivered" : "status-pending"}`} style={{ display: "none" }}>
                <span className="status-pulse-dot"></span>
                {inspectProject.status || "Delivered"}
              </span>
            </div>

            <div className="inspect-details-body">
              <h2 className="inspect-project-name">{inspectProject.name}</h2>

              <div className="inspect-valuation-card">
                <div className="valuation-info">
                  <span className="val-title">PROJECT VALUATION</span>
                  <span className="val-price">
                    {typeof inspectProject.price === "number"
                      ? `₹${inspectProject.price.toLocaleString("en-IN")}`
                      : inspectProject.price || "Contact Us"}
                  </span>
                </div>
                {inspectProject.websiteUrl && (
                  <a
                    href={inspectProject.websiteUrl.startsWith("http") ? inspectProject.websiteUrl : `https://${inspectProject.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary btn-visit-live"
                  >
                    🌐 Visit Live Website ↗
                  </a>
                )}
              </div>

              {/* Related Reviews inside modal */}
              {reviews.filter((r) => {
                const rProjId = typeof r.projectId === "object" && r.projectId !== null
                  ? String(r.projectId._id || r.projectId.id)
                  : String(r.projectId);
                return rProjId === String(inspectProject._id || inspectProject.id);
              }).length > 0 && (
                <div className="inspect-reviews-block">
                  <h4>VERIFIED CLIENT FEEDBACK</h4>
                  <div className="reviews-list">
                    {reviews.filter((r) => {
                      const rProjId = typeof r.projectId === "object" && r.projectId !== null
                        ? String(r.projectId._id || r.projectId.id)
                        : String(r.projectId);
                      return rProjId === String(inspectProject._id || inspectProject.id);
                    }).map((rev) => (
                      <div key={rev._id || rev.id} className="review-quote-item">
                        <div className="quote-stars">{"★".repeat(rev.stars || 5)}</div>
                        <p className="quote-text">"{rev.text}"</p>
                        <span className="quote-author">— {rev.author || "Verified Client"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="inspect-modal-actions">
                <button
                  className="btn-get-it"
                  onClick={() => {
                    setInterestName("");
                    setInterestEmail("");
                    setInterestMessage(`Hi ZER0ONE! I'm interested in "${inspectProject.name}". Please reach out to me.`);
                    setInterestSuccess(false);
                    setInspectProject(null);
                    setGetItProject(inspectProject);
                  }}
                >
                  🚀 Get It
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    const projIdStr = String(inspectProject._id || inspectProject.id);
                    setInspectProject(null);
                    setReviewSubmitError(null);
                    setSelectedProject(projIdStr);
                  }}
                >
                  ★ Write a Review
                </button>
                <button className="btn-back" onClick={() => setInspectProject(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Get It / Interest Modal */}
      {getItProject && (
        <div className="modal-overlay" onClick={() => { setGetItProject(null); setInterestSuccess(false); }}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => { setGetItProject(null); setInterestSuccess(false); }}>✕</button>
            {interestSuccess ? (
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎉</div>
                <h3 style={{ color: "#00e5ff", marginBottom: "8px" }}>We Got Your Vibe!</h3>
                <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
                  Thanks for your interest in{" "}
                  <strong style={{ color: "#fff" }}>{getItProject.name}</strong>.<br />
                  Our team will reach out to you shortly!
                </p>
              </div>
            ) : (
              <>
                <h2 style={{ marginBottom: "4px" }}>🚀 I Want This!</h2>
                <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "20px" }}>
                  Interested in{" "}
                  <strong style={{ color: "#00eaff" }}>{getItProject.name}</strong>?{" "}
                  Drop your details and we’ll reach out!
                </p>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={interestName}
                  onChange={(e) => setInterestName(e.target.value)}
                  style={{ width: "100%", marginBottom: "10px", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" }}
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={interestEmail}
                  onChange={(e) => setInterestEmail(e.target.value)}
                  style={{ width: "100%", marginBottom: "10px", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" }}
                />
                <textarea
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder="Tell us more about what you need..."
                  style={{ width: "100%", minHeight: "90px", marginBottom: "16px", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.95rem", resize: "vertical", boxSizing: "border-box" }}
                />
                <div className="modal-actions">
                  <button type="button" onClick={() => { setGetItProject(null); setInterestSuccess(false); }}>Cancel</button>
                  <button
                    className="btn-get-it"
                    onClick={() => {
                      if (!interestName.trim() || !interestEmail.trim()) return;
                      window.open(
                        `mailto:contact@zerone.in?subject=${encodeURIComponent("Interest in " + getItProject.name)}&body=${encodeURIComponent(interestMessage + "\n\nFrom: " + interestName + "\nEmail: " + interestEmail)}`,
                        "_blank"
                      );
                      setInterestSuccess(true);
                    }}
                  >
                    🚀 Send Interest
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal-content glass-panel payment-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Secure Payment</h2>
            <p>Complete your payment via Razorpay</p>
            <div className="razorpay-mock">
              <input
                type="number"
                className="mock-input real-input"
                placeholder="Enter Amount (₹)"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min="1"
                required
              />
              {paymentMessage && (
                <div style={{
                  color: paymentMessage.isError ? "#ff5252" : "#00e5ff",
                  fontSize: "0.85rem",
                  marginBottom: "12px",
                  textAlign: "center"
                }}>
                  {paymentMessage.text}
                </div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn-back full-width" onClick={() => setShowPayment(false)}>
                  Cancel
                </button>
                <button
                  className="btn-primary full-width"
                  onClick={handlePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? "Processing..." : "Pay with Razorpay"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
