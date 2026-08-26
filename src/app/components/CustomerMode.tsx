import { useState, useEffect } from "react";
import "./CustomerMode.css";

// Mock Data
const initialProjects = [
  { id: 1, name: "Nexus AI Platform", price: "₹2,50,000", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800" },
  { id: 2, name: "FinTech Dashboard", price: "₹1,80,000", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" },
  { id: 3, name: "E-Commerce App", price: "₹1,20,000", image: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=800" },
];

const initialReviews = [
  { id: 1, projectId: 1, text: "Outstanding architecture!", author: "Sarah J." },
  { id: 2, projectId: 1, text: "Delivered ahead of time.", author: "Mike T." },
  { id: 3, projectId: 2, text: "Sleek and responsive.", author: "David L." },
];

export default function CustomerMode() {
  const [reviews, setReviews] = useState(initialReviews);
  const [projects, setProjects] = useState(initialProjects);
  useEffect(() => {
    const savedReviews = localStorage.getItem('zeroone_reviews');
    if (savedReviews) setReviews(JSON.parse(savedReviews));
    
    const savedProjects = localStorage.getItem('zeroone_projects');
    if (savedProjects) setProjects(JSON.parse(savedProjects));
  }, []);

  useEffect(() => {
    localStorage.setItem('zeroone_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewStars, setReviewStars] = useState(5);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !reviewText.trim()) return;
    
    const newReview = {
      id: Date.now(),
      projectId: selectedProject,
      text: reviewText,
      author: "Guest User",
      stars: reviewStars
    };
    setReviews([...reviews, newReview]);
    setReviewText("");
    setReviewStars(5);
    setSelectedProject(null);
  };

  const handlePayment = () => {
    if (!paymentAmount) return alert("Please enter an amount.");
    // Mock Razorpay integration
    alert(`Redirecting to Razorpay checkout for ₹${paymentAmount}...`);
    setTimeout(() => {
      alert("Payment Successful!");
      setShowPayment(false);
      setPaymentAmount("");
    }, 1500);
  };

  return (
    <div className="customer-mode animate-fade-in">
      <header className="header glass-panel">
        <div className="logo-small text-replica">
          Z E R <span className="slashed-o">O</span> O N E
        </div>
        <nav>
          <button className="btn-primary" onClick={() => setShowPayment(true)}>Pay Us</button>
        </nav>
      </header>

      <section className="hero">
        <h1 className="hero-title">Build What <span className="text-gradient">Doesn't Exist</span></h1>
        <p className="hero-subtitle">Explore our past works, tailored for visionaries.</p>
      </section>

      <section className="showcase">
        <div className="grid">
          {projects.map(project => {
            const projectReviews = reviews.filter(r => r.projectId === project.id);
            return (
              <div key={project.id} className="project-card glass-panel animate-slide-up">
                <div 
                  className="project-image-placeholder" 
                  style={(project as any).image ? { backgroundImage: `url(${(project as any).image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                  {!(project as any).image && "[Image Mockup]"}
                </div>
                <div className="project-info">
                  <h3>{project.name}</h3>
                  <span className="price-tag">{project.price}</span>
                </div>
                
                {/* Cloth Tags Section */}
                <div className="tags-container">
                  {projectReviews.map(review => (
                    <div key={review.id} className="cloth-tag" title={review.text}>
                      <span className="tag-hole"></span>
                      <span className="tag-stars">{review.stars ? '★'.repeat(review.stars) : '★★★★★'}</span>
                      <span className="tag-text">{review.text.length > 20 ? review.text.substring(0, 20) + "..." : review.text}</span>
                    </div>
                  ))}
                </div>

                <button 
                  className="btn-review"
                  onClick={() => setSelectedProject(project.id)}
                >
                  Write Review
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2>Write a Review</h2>
            <p>For {projects.find(p => p.id === selectedProject)?.name}</p>
            <form onSubmit={handleReviewSubmit}>
              <div className="star-rating-input">
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star}
                    className={`star ${star <= reviewStars ? 'active' : ''}`}
                    onClick={() => setReviewStars(star)}
                  >★</span>
                ))}
              </div>
              <textarea 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience..."
                required
              ></textarea>
              <div className="modal-actions">
                <button type="button" onClick={() => setSelectedProject(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit as Tag</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel payment-modal">
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
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-back full-width" onClick={() => setShowPayment(false)}>
                  Cancel
                </button>
                <button className="btn-primary full-width" onClick={handlePayment}>
                  Pay with Razorpay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
