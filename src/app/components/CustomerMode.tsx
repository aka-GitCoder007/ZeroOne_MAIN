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
  const [projectFilter, setProjectFilter] = useState<"ALL" | "DELIVERED" | "PENDING">("ALL");
  const [reviewText, setReviewText] = useState("");
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewStars, setReviewStars] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);

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

  const filteredProjects = projects.filter((p) => {
    if (projectFilter === "DELIVERED") return p.status === "Delivered";
    if (projectFilter === "PENDING") return p.status === "Pending";
    return true;
  });

  return (
    <div className="customer-mode animate-fade-in">
      {/* Header */}
      <header className="header glass-panel">
        <div className="logo-small text-replica" onClick={() => setActiveTab("work")} style={{ cursor: "pointer" }}>
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
          <button className="btn-primary btn-pay" onClick={() => setShowPayment(true)}>
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
              <span>❖ EXCLUSIVE PORTFOLIO SHOWCASE</span>
            </div>
            <h1 className="hero-title">
              Build What <span className="text-gradient">Doesn't Exist</span>
            </h1>
            <p className="hero-subtitle">
              Explore our past works, custom software systems & luxury web applications.
            </p>

            {/* Category / Status Filter Pills */}
            <div className="project-filter-bar">
              <button
                className={`filter-pill ${projectFilter === "ALL" ? "active" : ""}`}
                onClick={() => setProjectFilter("ALL")}
              >
                ALL PROJECTS ({projects.length})
              </button>
              <button
                className={`filter-pill ${projectFilter === "DELIVERED" ? "active" : ""}`}
                onClick={() => setProjectFilter("DELIVERED")}
              >
                DELIVERED ({projects.filter((p) => p.status === "Delivered").length})
              </button>
              <button
                className={`filter-pill ${projectFilter === "PENDING" ? "active" : ""}`}
                onClick={() => setProjectFilter("PENDING")}
              >
                IN DEVELOPMENT ({projects.filter((p) => p.status === "Pending").length})
              </button>
            </div>
          </section>

          <section className="showcase">
            {loadingProjects ? (
              <div className="empty-state glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                <div className="empty-icon">❖</div>
                <h3>LOADING SHOWCASE ARCHITECTURE...</h3>
                <p>Fetching real-time project portfolio entries from MongoDB Atlas...</p>
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
            ) : filteredProjects.length === 0 ? (
              <div className="empty-state glass-panel" style={{ padding: "40px", textAlign: "center" }}>
                <div className="empty-icon">❖</div>
                <h3>NO PROJECTS MATCH THIS FILTER</h3>
                <p>No showcase projects found in the selected category.</p>
              </div>
            ) : (
              <div className="grid-v2">
                {filteredProjects.map((project) => {
                  const projIdStr = String(project._id || project.id);
                  const projectReviews = reviews.filter((r) => {
                    const rProjId = typeof r.projectId === "object" && r.projectId !== null
                      ? String(r.projectId._id || r.projectId.id)
                      : String(r.projectId);
                    return rProjId === projIdStr;
                  });

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

                        {/* Top Badges */}
                        <div className="card-top-badges">
                          <span className={`status-pill ${project.status === "Delivered" ? "status-delivered" : "status-pending"}`}>
                            <span className="status-pulse-dot"></span>
                            {project.status || "Delivered"}
                          </span>

                          {project.websiteUrl && (
                            <a
                              href={project.websiteUrl.startsWith("http") ? project.websiteUrl : `https://${project.websiteUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="live-link-pill"
                              onClick={(e) => e.stopPropagation()}
                              title="Visit Live Website"
                            >
                              🌐 Live Site ↗
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
                        <div className="card-header-meta">
                          <span className="customer-name-badge">
                            Client: {project.customerName || "Enterprise Partner"}
                          </span>
                          {project.date && (
                            <span className="project-date-badge">
                              {new Date(project.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </span>
                          )}
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
                        </div>

                        {/* Client Reviews Section */}
                        {projectReviews.length > 0 && (
                          <div className="card-reviews-section">
                            <span className="reviews-label">CLIENT REVIEWS ({projectReviews.length})</span>
                            <div className="tags-container">
                              {projectReviews.slice(0, 2).map((review) => (
                                <div key={review._id || review.id} className="cloth-tag" title={review.text}>
                                  <span className="tag-hole"></span>
                                  <span className="tag-stars">
                                    {review.stars ? "★".repeat(review.stars) : "★★★★★"}
                                  </span>
                                  <span className="tag-text">
                                    {review.text.length > 25
                                      ? review.text.substring(0, 25) + "..."
                                      : review.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Card Action Controls */}
                        <div className="card-footer-actions">
                          <button
                            className="btn-card-inspect"
                            onClick={() => setInspectProject(project)}
                          >
                            ✦ Inspect Details
                          </button>

                          {/* All visitors can write a review on any WORK project */}
                          <button
                            className="btn-card-review"
                            onClick={() => {
                              setReviewSubmitError(null);
                              setReviewSubmitSuccess(false);
                              setReviewAuthor("");
                              setReviewText("");
                              setReviewStars(5);
                              setSelectedProject(projIdStr);
                            }}
                          >
                            ★ Write Review
                          </button>
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
              <span className={`status-pill ${inspectProject.status === "Delivered" ? "status-delivered" : "status-pending"}`}>
                <span className="status-pulse-dot"></span>
                {inspectProject.status || "Delivered"}
              </span>
            </div>

            <div className="inspect-details-body">
              <div className="inspect-meta-row">
                <span className="inspect-client-badge">CLIENT: {inspectProject.customerName || "Enterprise Partner"}</span>
                {inspectProject.date && (
                  <span className="inspect-date-badge">
                    DELIVERED: {new Date(inspectProject.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                )}
              </div>

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
                  className="btn-secondary"
                  onClick={() => {
                    const projIdStr = String(inspectProject._id || inspectProject.id);
                    setInspectProject(null);
                    setReviewSubmitError(null);
                    setSelectedProject(projIdStr);
                  }}
                >
                  ★ Write a Review for this Project
                </button>
                <button className="btn-back" onClick={() => setInspectProject(null)}>
                  Close
                </button>
              </div>
            </div>
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
