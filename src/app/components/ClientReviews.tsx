"use client";

import { useState, useMemo, useEffect } from "react";
import { Project, Review } from "../types";
import api from "../lib/api";
import "./ClientReviews.css";

interface ClientReviewsProps {
  projects: Project[];
  reviews: Review[];
  onAddReview: (newReview: Review) => void;
  onRefreshData?: () => void;
}

export default function ClientReviews({
  projects,
  reviews,
  onAddReview,
  onRefreshData,
}: ClientReviewsProps) {
  // Local state for review projects from API if needed
  const [reviewProjects, setReviewProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Fetch projects specifically configured for reviews section (showInClientReviews === true)
  const fetchReviewProjects = async () => {
    setLoadingProjects(true);
    setProjectsError(null);
    const res = await api.projects.getAll("reviews");
    if (res.success && Array.isArray(res.data)) {
      // Only show projects explicitly marked showInClientReviews=true
      setReviewProjects(res.data);
    } else {
      // On API error, show nothing — never fall back to all delivered projects
      setReviewProjects([]);
    }
    setLoadingProjects(false);
  };

  useEffect(() => {
    fetchReviewProjects();
  }, [projects]);

  const deliveredProjects = useMemo(() => {
    // Only return projects explicitly flagged for client reviews — no fallback to all delivered
    return reviewProjects;
  }, [reviewProjects]);

  // Modal States
  const [activeProjectForView, setActiveProjectForView] = useState<Project | null>(null);
  const [activeProjectForWrite, setActiveProjectForWrite] = useState<Project | null>(null);

  // Form State for Write Review
  const [authorName, setAuthorName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  
  // Validation and Success State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Listen for Escape key to close open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSuccessModal) {
          setShowSuccessModal(false);
        } else if (activeProjectForWrite) {
          closeWriteModal();
        } else if (activeProjectForView) {
          setActiveProjectForView(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeProjectForWrite, activeProjectForView, showSuccessModal]);

  // Helper to calculate project stats
  const getProjectStats = (project: Project) => {
    const projIdStr = String(project._id || project.id);
    const projReviews = reviews.filter((r) => {
      const rProjId = typeof r.projectId === "object" && r.projectId !== null
        ? String((r.projectId as any)._id || (r.projectId as any).id)
        : String(r.projectId);
      return rProjId === projIdStr;
    });

    const count = projReviews.length;
    if (count === 0) {
      return { avgRating: "0.0", count: 0, projReviews: [] };
    }
    const sum = projReviews.reduce((acc, r) => acc + (r.stars || 5), 0);
    const avg = (sum / count).toFixed(1);
    return { avgRating: avg, count, projReviews };
  };

  const openWriteModal = (project: Project) => {
    setActiveProjectForWrite(project);
    setAuthorName("");
    setReviewText("");
    setRating(5);
    setHoverRating(0);
    setValidationError(null);
  };

  const closeWriteModal = () => {
    setActiveProjectForWrite(null);
    setValidationError(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedAuthor = authorName.trim();
    const trimmedText = reviewText.trim();

    if (!trimmedAuthor) {
      setValidationError("Please enter your name.");
      return;
    }

    if (!trimmedText) {
      setValidationError("Please share your feedback before submitting.");
      return;
    }

    if (trimmedText.length > 500) {
      setValidationError("Review text must be 500 characters or fewer.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setValidationError("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!activeProjectForWrite || isSubmitting) return;

    setIsSubmitting(true);
    const projIdToSubmit = String(activeProjectForWrite._id || activeProjectForWrite.id);

    const res = await api.reviews.create({
      projectId: projIdToSubmit,
      text: trimmedText,
      author: trimmedAuthor,
      stars: rating,
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      onAddReview(res.data);
      if (onRefreshData) onRefreshData();

      closeWriteModal();
      setShowSuccessModal(true);
    } else {
      setValidationError(res.message || "Failed to submit review. Please try again.");
    }
  };

  const renderStars = (starCount: number) => {
    const fullStar = "★";
    const emptyStar = "☆";
    const filled = Math.min(5, Math.max(0, Math.round(starCount)));
    return (
      <span className="star-display" aria-label={`${starCount} out of 5 stars`}>
        <span className="stars-filled">{fullStar.repeat(filled)}</span>
        <span className="stars-empty">{emptyStar.repeat(5 - filled)}</span>
      </span>
    );
  };

  return (
    <div className="client-reviews-container animate-fade-in">
      {/* Header Section */}
      <section className="reviews-hero">
        <div className="hero-badge text-replica">
          <span>CLIENT SATISFACTION</span>
        </div>
        <h1 className="reviews-title">
          CLIENT <span className="text-gradient">REVIEWS</span>
        </h1>
        <p className="reviews-subtitle">
          See what our clients have to say about the digital experiences we create.
        </p>
      </section>

      {/* Project Grid */}
      <section className="reviews-grid-section">
        {loadingProjects ? (
          <div className="empty-state glass-panel">
            <div className="empty-icon">❖</div>
            <h3>CLIENT WORK IS LOADING</h3>
            <p>Our delivered projects and verified client reviews are loading from database...</p>
          </div>
        ) : deliveredProjects.length === 0 ? (
          <div className="empty-state glass-panel">
            <div className="empty-icon">❖</div>
            <h3>NO CLIENT REVIEWS AVAILABLE</h3>
            <p>Our delivered projects and verified client reviews will appear here soon.</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {deliveredProjects.map((project) => {
              const { avgRating, count } = getProjectStats(project);
              const hasWebsite = Boolean(project.websiteUrl && project.websiteUrl.trim().length > 0);
              const projIdStr = String(project._id || project.id);

              return (
                <div key={projIdStr} className="project-review-card glass-panel animate-slide-up">
                  {/* Image Container */}
                  <div
                    className="card-media"
                    style={
                      project.image
                        ? { backgroundImage: `url(${project.image})` }
                        : undefined
                    }
                  >
                    {!project.image && <div className="card-media-placeholder">ZER0ONE DIGITAL</div>}
                    <span className="status-tag">Delivered</span>
                  </div>

                  {/* Card Main Info */}
                  <div className="card-content">
                    <div className="card-header">
                      <span className="client-name">{project.customerName}</span>
                      <h3 className="project-name">{project.name}</h3>
                    </div>

                    {/* Rating Stats Summary */}
                    <div className="card-rating-summary">
                      <div className="rating-score">
                        {renderStars(Number(avgRating))}
                        <span className="avg-text">{avgRating} / 5</span>
                      </div>
                      <span className="review-count">
                        {count} {count === 1 ? "Client Review" : "Client Reviews"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="card-actions">
                      {hasWebsite ? (
                        <a
                          href={project.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-website"
                          aria-label={`Visit website for ${project.name}`}
                        >
                          VISIT WEBSITE ↗
                        </a>
                      ) : (
                        <button className="btn-website disabled" disabled title="Website link unavailable">
                          WEBSITE OFFLINE
                        </button>
                      )}

                      <button
                        className="btn-view-reviews"
                        onClick={() => setActiveProjectForView(project)}
                      >
                        VIEW REVIEWS
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* VIEW REVIEWS MODAL */}
      {activeProjectForView && (
        <div
          className="reviews-modal-overlay"
          onClick={() => setActiveProjectForView(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-reviews-modal-title"
        >
          <div
            className="reviews-modal-content glass-panel animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setActiveProjectForView(null)}
              aria-label="Close Modal"
            >
              ✕
            </button>

            {(() => {
              const { avgRating, count, projReviews } = getProjectStats(activeProjectForView);
              return (
                <>
                  <div className="modal-header">
                    <span className="client-badge">{activeProjectForView.customerName}</span>
                    <h2 id="view-reviews-modal-title" className="modal-project-title">
                      {activeProjectForView.name}
                    </h2>

                    <div className="modal-rating-banner">
                      <div className="rating-star-group">{renderStars(Number(avgRating))}</div>
                      <span className="rating-score-num">{avgRating} / 5</span>
                      <span className="rating-total-count">({count} {count === 1 ? "Review" : "Reviews"})</span>
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div className="modal-reviews-list">
                    {projReviews.length === 0 ? (
                      <div className="no-reviews-box">
                        <p>No client reviews recorded for this project yet.</p>
                        <p className="sub-text">Be the first client to submit your feedback.</p>
                      </div>
                    ) : (
                      projReviews.map((r) => (
                        <div key={r._id || r.id} className="review-item-card">
                          <div className="review-item-header">
                            <span className="reviewer-name">{r.author}</span>
                            <div className="reviewer-stars">{renderStars(r.stars)}</div>
                          </div>
                          <p className="review-item-text">"{r.text}"</p>
                          {r.createdAt && <span className="review-item-date">{typeof r.createdAt === "string" ? r.createdAt.split("T")[0] : ""}</span>}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Modal Action */}
                  <div className="modal-footer">
                    <button
                      className="btn-primary full-width-btn"
                      onClick={() => {
                        const targetProj = activeProjectForView;
                        setActiveProjectForView(null);
                        openWriteModal(targetProj);
                      }}
                    >
                      WRITE A REVIEW
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* WRITE REVIEW MODAL */}
      {activeProjectForWrite && (
        <div
          className="reviews-modal-overlay"
          onClick={closeWriteModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="write-review-modal-title"
        >
          <div
            className="reviews-modal-content glass-panel animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={closeWriteModal}
              aria-label="Close Modal"
            >
              ✕
            </button>

            <div className="modal-header">
              <span className="client-badge">PROJECT REVIEW</span>
              <h2 id="write-review-modal-title" className="modal-project-title">
                {activeProjectForWrite.name}
              </h2>
              <p className="modal-subtitle">
                Client: {activeProjectForWrite.customerName}
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="write-review-form">
              {/* Star Rating Interactive Selector */}
              <div className="form-group center-content">
                <label className="form-label">RATING</label>
                <div className="interactive-star-rating">
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const activeState = (hoverRating || rating) >= starIndex;
                    return (
                      <button
                        key={starIndex}
                        type="button"
                        className={`star-btn ${activeState ? "active" : ""}`}
                        onClick={() => setRating(starIndex)}
                        onMouseEnter={() => setHoverRating(starIndex)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${starIndex} out of 5 stars`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Author Name */}
              <div className="form-group">
                <label htmlFor="author-name-input" className="form-label">YOUR NAME</label>
                <input
                  id="author-name-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sarah Jenkins (Acme Corp)"
                  value={authorName}
                  onChange={(e) => {
                    setAuthorName(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  required
                />
              </div>

              {/* Review Text Area */}
              <div className="form-group">
                <div className="label-with-counter">
                  <label htmlFor="review-text-input" className="form-label">YOUR REVIEW / FEEDBACK</label>
                  <span className={`char-counter ${reviewText.length > 500 ? "exceeded" : ""}`}>
                    {reviewText.length} / 500
                  </span>
                </div>
                <textarea
                  id="review-text-input"
                  className="form-textarea"
                  placeholder="Tell us about your experience working with ZER0ONE..."
                  value={reviewText}
                  maxLength={500}
                  onChange={(e) => {
                    setReviewText(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  required
                ></textarea>
              </div>

              {/* Validation Inline Error Banner */}
              {validationError && (
                <div className="inline-validation-error">
                  <span className="error-icon">⚠</span>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeWriteModal}
                >
                  CANCEL
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "SUBMITTING..." : "SUBMIT REVIEW"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {showSuccessModal && (
        <div
          className="reviews-modal-overlay"
          onClick={() => setShowSuccessModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="reviews-modal-content glass-panel success-modal animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="success-icon-wrap">
              <span className="checkmark-icon">✓</span>
            </div>
            <h2 className="success-title">REVIEW SUBMITTED</h2>
            <p className="success-message">
              Thank you for sharing your experience with ZER0ONE.
            </p>
            <button
              className="btn-primary full-width-btn"
              onClick={() => setShowSuccessModal(false)}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
