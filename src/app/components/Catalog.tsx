"use client";

import { useState, useEffect } from "react";
import { CatalogItem } from "../types";
import api from "../lib/api";
import "./Catalog.css";

interface CatalogProps {
  onSelectCatalogForQuotation?: (item: CatalogItem) => void;
}

const DEFAULT_CATEGORIES = [
  "ALL",
  "Gym",
  "Restaurant",
  "Salon",
  "Clinic",
  "Clothing",
  "E-commerce",
  "Real Estate",
  "Hotel",
  "Education",
  "Portfolio",
  "Corporate",
  "Other",
];

export default function Catalog({ onSelectCatalogForQuotation }: CatalogProps) {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  // Get It Interest Popup State
  const [getItItem, setGetItItem] = useState<CatalogItem | null>(null);
  const [interestName, setInterestName] = useState("");
  const [interestEmail, setInterestEmail] = useState("");
  const [interestMessage, setInterestMessage] = useState("");
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    const res = await api.catalog.getPublic(
      selectedCategory !== "ALL" ? selectedCategory : undefined
    );
    if (res.success && Array.isArray(res.data)) {
      setCatalogItems(res.data);
    } else {
      setError(res.message || "Failed to load catalog items from server.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return "Quote on Request";
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const getInitials = (title: string) => {
    if (!title) return "ZO";
    const words = title.trim().split(" ");
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return title.substring(0, 2).toUpperCase();
  };

  const getItemGradient = (id?: string) => {
    const gradients = [
      "linear-gradient(135deg, #09121d 0%, #152c42 50%, #004e92 100%)",
      "linear-gradient(135deg, #10002b 0%, #240046 50%, #3c096c 100%)",
      "linear-gradient(135deg, #081c15 0%, #1b4332 50%, #2d6a4f 100%)",
      "linear-gradient(135deg, #1c0a00 0%, #361500 50%, #5c2400 100%)",
      "linear-gradient(135deg, #141414 0%, #22223b 50%, #4a4e69 100%)",
    ];
    if (!id) return gradients[0];
    const charCodeSum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[charCodeSum % gradients.length];
  };

  const openGetItPopup = (item: CatalogItem) => {
    setGetItItem(item);
    setInterestName("");
    setInterestEmail("");
    setInterestMessage(`Hi ZER0ONE! I'm interested in "${item.title}". Please reach out to me.`);
    setInterestSubmitting(false);
    setInterestSuccess(false);
    setInterestError(null);
  };

  const closeGetItPopup = () => {
    setGetItItem(null);
    setInterestSuccess(false);
    setInterestError(null);
  };

  const handleGetItSubmit = async () => {
    if (!getItItem) return;
    if (!interestName.trim()) { setInterestError("Please enter your name."); return; }
    if (!interestEmail.trim()) { setInterestError("Please enter your email."); return; }
    setInterestError(null);
    setInterestSubmitting(true);
    try {
      await api.quotations.create({
        fullName: interestName.trim(),
        email: interestEmail.trim(),
        projectName: `Catalog Interest: ${getItItem.title}`,
        description: interestMessage || `Interested in catalog item: ${getItItem.title}`,
        services: ["Catalog", getItItem.category],
        budget: getItItem.startingPrice ? `₹${getItItem.startingPrice}` : "Custom",
        timeline: "Flexible",
        phone: "N/A",
        contactPreference: ["Email"],
      });
      setInterestSuccess(true);
      setTimeout(() => { closeGetItPopup(); }, 3000);
    } catch (err) {
      console.error("Failed to submit catalog interest:", err);
      setInterestError("Something went wrong. Please try again.");
    }
    setInterestSubmitting(false);
  };

  // Keep the prop callback for backwards compat but don't use it as primary
  const handleGetIt = (item: CatalogItem) => {
    openGetItPopup(item);
    // Optionally also notify parent (won't cause navigation since CustomerMode no longer needs to)
    // onSelectCatalogForQuotation?.(item);
  };

  // Derive unique categories from items if available
  const availableCategories = Array.from(
    new Set([
      "ALL",
      ...catalogItems.map((item) => item.category),
      ...DEFAULT_CATEGORIES.filter((c) => c !== "ALL"),
    ])
  );

  const featuredItems = catalogItems.filter((item) => item.featured);
  const regularItems = catalogItems;

  return (
    <div className="catalog-container animate-fade-in">
      {/* Intro Hero Header */}
      <section className="catalog-hero">
        <div className="catalog-hero-badge animate-fade-in">
          <span>💎 READY-TO-BUILD CONCEPTS</span>
        </div>
        <h1 className="catalog-hero-title">
          Explore Our <span className="text-gradient">Catalog</span>
        </h1>
        <p className="catalog-hero-subtitle">
          Premium website & software concepts tailored for growing businesses. Select a concept to request a customized build.
        </p>

        {/* Category Filters */}
        <div className="catalog-filter-bar">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Loading State */}
      {loading ? (
        <div className="catalog-loading">
          <div className="spinner"></div>
          <p>Fetching Catalog Concepts...</p>
        </div>
      ) : error ? (
        <div className="catalog-error glass-panel">
          <h3>CATALOG UNAVAILABLE</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchCatalog}>
            RETRY
          </button>
        </div>
      ) : catalogItems.length === 0 ? (
        <div className="catalog-empty glass-panel">
          <h3>NO CATALOG ITEMS YET</h3>
          <p>New concepts are being prepared for {selectedCategory === "ALL" ? "you" : selectedCategory}. Check back soon!</p>
          {selectedCategory !== "ALL" && (
            <button className="btn-secondary" onClick={() => setSelectedCategory("ALL")} style={{ marginTop: 15 }}>
              VIEW ALL CATEGORIES
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Featured Section if items exist and category is ALL */}
          {selectedCategory === "ALL" && featuredItems.length > 0 && (
            <section className="featured-section">
              <div className="section-title">
                <span className="dot text-gradient">•</span> FEATURED CONCEPTS
              </div>
              <div className="catalog-grid">
                {featuredItems.map((item) => (
                  <CatalogCard
                    key={item._id || item.slug}
                    item={item}
                    getItemGradient={getItemGradient}
                    getInitials={getInitials}
                    formatCurrency={formatCurrency}
                    onInspect={() => setSelectedItem(item)}
                    onGetIt={() => handleGetIt(item)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Main Catalog Grid */}
          <section className="catalog-main-section">
            <div className="section-title">
              <span className="dot text-gradient">•</span>{" "}
              {selectedCategory === "ALL" ? "ALL CONCEPTS" : `${selectedCategory.toUpperCase()} CONCEPTS`} ({catalogItems.length})
            </div>
            <div className="catalog-grid">
              {regularItems.map((item) => (
                <CatalogCard
                  key={item._id || item.slug}
                  item={item}
                  getItemGradient={getItemGradient}
                  getInitials={getInitials}
                  formatCurrency={formatCurrency}
                  onInspect={() => setSelectedItem(item)}
                  onGetIt={() => handleGetIt(item)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Catalog Item Detail Modal */}
      {selectedItem && (
        <div className="catalog-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="catalog-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)} aria-label="Close modal">
              ✕
            </button>

            <div className="modal-content-grid">
              <div className="modal-image-col">
                {selectedItem.thumbnail ? (
                  <img
                    src={selectedItem.thumbnail}
                    alt={selectedItem.title}
                    className="modal-thumbnail"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                      const fallback = (e.target as HTMLElement).nextElementSibling;
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`modal-image-fallback ${selectedItem.thumbnail ? "hidden" : ""}`}
                  style={{ background: getItemGradient(selectedItem._id || selectedItem.slug) }}
                >
                  {getInitials(selectedItem.title)}
                </div>
              </div>

              <div className="modal-info-col">
                <div className="modal-header-flex">
                  <span className="modal-category">{selectedItem.category}</span>
                  {selectedItem.badge && <span className="modal-badge">{selectedItem.badge}</span>}
                  {selectedItem.featured && <span className="modal-badge featured">FEATURED</span>}
                </div>

                <h2 className="modal-title">{selectedItem.title}</h2>
                <p className="modal-short">{selectedItem.shortDescription}</p>

                {selectedItem.description && (
                  <div className="modal-description-box">
                    <h4>Overview</h4>
                    <p>{selectedItem.description}</p>
                  </div>
                )}

                {selectedItem.technologies && selectedItem.technologies.length > 0 && (
                  <div className="modal-tech-stack">
                    <h4>Technologies</h4>
                    <div className="tech-tags">
                      {selectedItem.technologies.map((tech) => (
                        <span key={tech} className="tech-tag">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="modal-footer-action">
                  <div className="modal-price">
                    <span className="price-label">Starting From</span>
                    <span className="price-val">{formatCurrency(selectedItem.startingPrice)}</span>
                  </div>

                  <div className="modal-buttons">
                    {selectedItem.demoUrl && (
                      <a
                        href={selectedItem.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                      >
                        LIVE DEMO ↗
                      </a>
                    )}
                    <button
                      className="btn-primary"
                      onClick={() => {
                        const itemToGet = selectedItem;
                        setSelectedItem(null);
                        openGetItPopup(itemToGet);
                      }}
                    >
                      GET THIS CONCEPT →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Get It Interest Popup */}
      {getItItem && (
        <div className="catalog-modal-overlay" onClick={closeGetItPopup}>
          <div className="catalog-modal glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <button className="modal-close" onClick={closeGetItPopup} aria-label="Close">✕</button>

            {interestSuccess ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🎉</div>
                <h3 style={{ color: "#00e5ff", marginBottom: "10px", fontSize: "1.4rem" }}>We Got Your Vibe!</h3>
                <p style={{ color: "#aaa", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  Thanks for your interest in{" "}
                  <strong style={{ color: "#fff" }}>{getItItem.title}</strong>.<br />
                  Our team will reach out to you shortly!
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ marginBottom: "20px" }}>
                  <h2 style={{ margin: "0 0 6px 0", fontSize: "1.4rem" }}>🚀 I Want This!</h2>
                  <p style={{ color: "#aaa", fontSize: "0.9rem", margin: 0 }}>
                    Interested in{" "}
                    <strong style={{ color: "#00eaff" }}>{getItItem.title}</strong>?{" "}
                    Drop your details and we&apos;ll reach out!
                  </p>
                </div>

                {/* Item Summary Strip */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.15)",
                  borderRadius: "10px", padding: "10px 14px", marginBottom: "20px"
                }}>
                  {getItItem.thumbnail ? (
                    <img src={getItItem.thumbnail} alt={getItItem.title}
                      style={{ width: "48px", height: "36px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: "48px", height: "36px", borderRadius: "6px", flexShrink: 0,
                      background: getItemGradient(getItItem._id || getItItem.slug),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.7rem", fontWeight: 700, color: "#fff"
                    }}>{getInitials(getItItem.title)}</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{getItItem.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "#00e5ff", marginTop: "2px" }}>
                      {getItItem.category} · {formatCurrency(getItItem.startingPrice)}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={interestName}
                  onChange={(e) => { setInterestName(e.target.value); setInterestError(null); }}
                  style={{ width: "100%", marginBottom: "10px", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" }}
                />
                <input
                  type="email"
                  placeholder="Your Email *"
                  value={interestEmail}
                  onChange={(e) => { setInterestEmail(e.target.value); setInterestError(null); }}
                  style={{ width: "100%", marginBottom: "10px", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" }}
                />
                <textarea
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder="Tell us more about what you need..."
                  rows={3}
                  style={{ width: "100%", marginBottom: "16px", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.95rem", resize: "vertical", boxSizing: "border-box" }}
                />

                {interestError && (
                  <div style={{ color: "#ff5252", fontSize: "0.85rem", marginBottom: "12px" }}>⚠ {interestError}</div>
                )}

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button type="button" className="btn-secondary" onClick={closeGetItPopup}>Cancel</button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleGetItSubmit}
                    disabled={interestSubmitting}
                    style={{ opacity: interestSubmitting ? 0.7 : 1 }}
                  >
                    {interestSubmitting ? "Sending..." : "🚀 Send Interest"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for individual Catalog Card
function CatalogCard({
  item,
  getItemGradient,
  getInitials,
  formatCurrency,
  onInspect,
  onGetIt,
}: {
  item: CatalogItem;
  getItemGradient: (id?: string) => string;
  getInitials: (title: string) => string;
  formatCurrency: (val?: number) => string;
  onInspect: () => void;
  onGetIt: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="catalog-card glass-panel">
      <div className="card-image-wrapper" onClick={onInspect}>
        {!imageError && item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="card-thumbnail"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="card-image-fallback" style={{ background: getItemGradient(item._id || item.slug) }}>
            <span>{getInitials(item.title)}</span>
          </div>
        )}
        <div className="card-overlay-hover">
          <span>INSPECT DETAILS</span>
        </div>
      </div>

      <div className="card-content">
        <div className="card-meta flex-between">
          <span className="card-category">{item.category}</span>
          {item.badge && <span className="card-badge">{item.badge}</span>}
          {item.featured && <span className="card-badge featured-badge">FEATURED</span>}
        </div>

        <h3 className="card-title" onClick={onInspect}>
          {item.title}
        </h3>
        <p className="card-description">{item.shortDescription}</p>

        <div className="card-footer flex-between">
          <div className="card-price-box">
            <span className="price-title">From</span>
            <span className="price-amount">{formatCurrency(item.startingPrice)}</span>
          </div>

          <button className="btn-primary btn-get-it" onClick={onGetIt}>
            GET IT →
          </button>
        </div>
      </div>
    </div>
  );
}
