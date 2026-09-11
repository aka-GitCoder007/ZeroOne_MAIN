import { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { Project, Quotation, Review, DashboardMetrics } from "../types";
import api, { getAuthToken } from "../lib/api";
import "./AdminMode.css";

export default function AdminMode({ onLogout }: { onLogout: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  // Sub-navigation tab: "projects" | "quotations" | "reviews"
  const [activeAdminTab, setActiveAdminTab] = useState<"projects" | "quotations" | "reviews">("projects");

  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const [loadingData, setLoadingData] = useState(false);

  // File Input Ref for Excel Import & Project Image Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  // Project Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const [newStatus, setNewStatus] = useState("Pending");
  const [newDate, setNewDate] = useState("");
  const [newShowInWork, setNewShowInWork] = useState(true);
  const [newShowInClientReviews, setNewShowInClientReviews] = useState(false);
  const [projectFormError, setProjectFormError] = useState<string | null>(null);

  // Edit Modal State
  const [editModalProject, setEditModalProject] = useState<Project | null>(null);
  const [editModalCustomer, setEditModalCustomer] = useState("");
  const [editModalName, setEditModalName] = useState("");
  const [editModalPrice, setEditModalPrice] = useState("");
  const [editModalImageUrl, setEditModalImageUrl] = useState("");
  const [editModalWebsiteUrl, setEditModalWebsiteUrl] = useState("");
  const [editModalStatus, setEditModalStatus] = useState("Pending");
  const [editModalDate, setEditModalDate] = useState("");
  const [editModalShowInWork, setEditModalShowInWork] = useState(true);
  const [editModalShowInClientReviews, setEditModalShowInClientReviews] = useState(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [editModalSaving, setEditModalSaving] = useState(false);
  const editModalFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProjectFormError("Please select a valid image file (PNG, JPG, WebP, SVG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProjectFormError("Image file size should be less than 5MB.");
      return;
    }

    setProjectFormError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Quotation Detail Inspection Modal
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Check authentication session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsAuthChecking(false);
        return;
      }
      const res = await api.auth.getMe();
      if (res.success && res.data?.user) {
        setIsAuthenticated(true);
        loadAllAdminData();
      } else {
        api.auth.logout();
        setIsAuthenticated(false);
      }
      setIsAuthChecking(false);
    };
    checkSession();
  }, []);

  const loadAllAdminData = async () => {
    setLoadingData(true);
    await Promise.all([
      fetchProjects(),
      fetchQuotations(),
      fetchReviews(),
      fetchMetrics(),
    ]);
    setLoadingData(false);
  };

  const fetchProjects = async () => {
    const res = await api.projects.getAll();
    if (res.success && Array.isArray(res.data)) {
      setProjects(res.data);
    }
  };

  const fetchQuotations = async () => {
    const res = await api.quotations.getAll();
    if (res.success && Array.isArray(res.data)) {
      setQuotations(res.data);
    }
  };

  const fetchReviews = async () => {
    const res = await api.reviews.getAll(undefined, true);
    // Also fetch non-approved reviews if available
    const resAll = await api.reviews.getAll(undefined, false);
    const combined: Review[] = [];
    const ids = new Set();
    if (res.success && Array.isArray(res.data)) {
      res.data.forEach(r => {
        const rId = String(r._id || r.id);
        if (!ids.has(rId)) { ids.add(rId); combined.push(r); }
      });
    }
    if (resAll.success && Array.isArray(resAll.data)) {
      resAll.data.forEach(r => {
        const rId = String(r._id || r.id);
        if (!ids.has(rId)) { ids.add(rId); combined.push(r); }
      });
    }
    setReviewsList(combined);
  };

  const fetchMetrics = async () => {
    const res = await api.admin.getMetrics();
    if (res.success && res.data) {
      setMetrics(res.data);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);

    const res = await api.auth.login(username, password);
    setLoginLoading(false);

    if (res.success && res.data?.token) {
      setIsAuthenticated(true);
      setError("");
      loadAllAdminData();
    } else {
      setError(res.message || "Invalid credentials");
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setIsAuthenticated(false);
    onLogout();
  };

  // Save or Update Project
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectFormError(null);

    if (!newName || !newPrice || !newDate) {
      setProjectFormError("Project Name, Price, and Date are required.");
      return;
    }

    if (newShowInClientReviews && !newCustomer.trim()) {
      setProjectFormError("Customer Name is required when uploading to Client Reviews section.");
      return;
    }

    // At least one section must be selected
    if (!newShowInWork && !newShowInClientReviews) {
      setProjectFormError("Please select at least one section: 'Show in WORK Section' or 'Show in CLIENT REVIEWS Section'.");
      return;
    }

    const payload: Partial<Project> = {
      customerName: newCustomer.trim() || "ZER0ONE",
      name: newName,
      image: newImageUrl || undefined,
      websiteUrl: newWebsiteUrl || undefined,
      price: parseInt(newPrice),
      status: newShowInClientReviews ? newStatus : "Delivered",
      date: newDate,
      // Upload to only the selected sections
      showInWork: newShowInWork,
      showInClientReviews: newShowInClientReviews,
    };

    if (editingId) {
      const res = await api.projects.update(editingId, payload);
      if (res.success) {
        setEditingId(null);
        resetProjectForm();
        fetchProjects();
        fetchMetrics();
      } else {
        setProjectFormError(res.message || "Failed to update project.");
      }
    } else {
      const res = await api.projects.create(payload);
      if (res.success) {
        resetProjectForm();
        fetchProjects();
        fetchMetrics();
      } else {
        setProjectFormError(res.message || "Failed to create project.");
      }
    }
  };

  const resetProjectForm = () => {
    setEditingId(null);
    setNewCustomer("");
    setNewName("");
    setNewImageUrl("");
    setNewWebsiteUrl("");
    setNewPrice("");
    setNewStatus("Pending");
    setNewDate("");
    setNewShowInWork(true);
    setNewShowInClientReviews(false);
    setProjectFormError(null);
  };

  const handleEditProject = (project: Project) => {
    setEditModalProject(project);
    setEditModalCustomer(project.customerName);
    setEditModalName(project.name);
    setEditModalImageUrl(project.image || "");
    setEditModalWebsiteUrl(project.websiteUrl || "");
    setEditModalPrice(project.price.toString());
    setEditModalStatus(project.status);
    setEditModalDate(project.date ? project.date.split("T")[0] : "");
    setEditModalShowInWork(project.showInWork !== false);
    setEditModalShowInClientReviews(Boolean(project.showInClientReviews));
    setEditModalError(null);
  };

  const handleEditModalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setEditModalError("Please select a valid image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setEditModalError("Image must be under 5MB."); return; }
    setEditModalError(null);
    const reader = new FileReader();
    reader.onloadend = () => setEditModalImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalProject) return;
    setEditModalError(null);

    if (!editModalName.trim() || !editModalPrice || !editModalDate) {
      setEditModalError("Project Name, Price, and Date are required.");
      return;
    }
    if (editModalShowInClientReviews && !editModalCustomer.trim()) {
      setEditModalError("Customer Name is required when displaying in Client Reviews Section.");
      return;
    }
    if (!editModalShowInWork && !editModalShowInClientReviews) {
      setEditModalError("Please select at least one section: WORK or CLIENT REVIEWS.");
      return;
    }

    setEditModalSaving(true);
    const projId = String(editModalProject._id || editModalProject.id);
    const res = await api.projects.update(projId, {
      customerName: editModalCustomer.trim() || "ZER0ONE",
      name: editModalName.trim(),
      image: editModalImageUrl || undefined,
      websiteUrl: editModalWebsiteUrl || undefined,
      price: parseInt(editModalPrice),
      status: editModalShowInClientReviews ? editModalStatus : "Delivered",
      date: editModalDate,
      showInWork: editModalShowInWork,
      showInClientReviews: editModalShowInClientReviews,
    });
    setEditModalSaving(false);

    if (res.success) {
      setEditModalProject(null);
      fetchProjects();
      fetchMetrics();
    } else {
      setEditModalError(res.message || "Failed to update project.");
    }
  };

  const handleDeleteProject = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this project from the database?")) return;
    const projId = String(id);
    const res = await api.projects.delete(projId);
    if (res.success) {
      fetchProjects();
      fetchMetrics();
    } else {
      alert(`Delete failed: ${res.message}`);
    }
  };

  const handleUpdateQuotationStatus = async (id: string | number, status: string) => {
    const qId = String(id);
    const res = await api.quotations.updateStatus(qId, status);
    if (res.success) {
      fetchQuotations();
      fetchMetrics();
    } else {
      alert(`Failed to update status: ${res.message}`);
    }
  };

  const handleToggleReviewApproval = async (review: Review) => {
    const rId = String(review._id || review.id);
    const res = await api.reviews.update(rId, { isApproved: !review.isApproved });
    if (res.success) {
      fetchReviews();
      fetchMetrics();
    } else {
      alert(`Failed to update review status: ${res.message}`);
    }
  };

  const handleDeleteReview = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    const rId = String(id);
    const res = await api.reviews.delete(rId);
    if (res.success) {
      fetchReviews();
      fetchMetrics();
    } else {
      alert(`Failed to delete review: ${res.message}`);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    const formatted = projects.map(p => ({
      ID: p._id || p.id,
      Customer: p.customerName,
      ProjectName: p.name,
      Price: p.price,
      Status: p.status,
      Date: p.date,
      ShowInWork: p.showInWork !== false ? "Yes" : "No",
      ShowInClientReviews: p.showInClientReviews ? "Yes" : "No"
    }));
    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, "ZeroOne_Projects.xlsx");
  };

  // Excel Import
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        
        for (const row of rows) {
          await api.projects.create({
            customerName: row.Customer || row.customerName || "Imported Client",
            name: row.ProjectName || row.name || "Imported Project",
            price: parseInt(row.Price || row.price) || 0,
            status: row.Status || row.status || "Pending",
            date: row.Date || row.date || new Date().toISOString().split("T")[0],
            showInWork: true,
            showInClientReviews: false
          });
        }
        
        fetchProjects();
        fetchMetrics();
        alert("Excel import completed successfully!");
      } catch (err: any) {
        alert("Error parsing Excel file: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // PDF Receipt Generation
  const handleDownloadReceipt = (project: Project) => {
    const doc = new jsPDF();
    
    // Branding
    doc.setFillColor(5, 5, 5);
    doc.rect(0, 0, 210, 297, "F"); // Dark background
    
    doc.setTextColor(0, 229, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("ZEROONE", 20, 30);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("Build What Doesn't Exist.", 20, 40);
    
    doc.setDrawColor(41, 121, 255);
    doc.setLineWidth(1);
    doc.line(20, 45, 190, 45); // Divider
    
    // Receipt Details
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("PAYMENT RECEIPT", 20, 65);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    const idStr = String(project._id || project.id);
    doc.text(`Receipt ID: #ZO-${idStr.slice(-6)}`, 20, 80);
    doc.text(`Date: ${project.date ? project.date.split("T")[0] : ""}`, 20, 90);
    
    doc.text("Billed To:", 20, 110);
    doc.setFont("helvetica", "bold");
    doc.text(project.customerName, 20, 120);
    
    doc.setFont("helvetica", "normal");
    doc.text("Project Description:", 20, 140);
    doc.setFont("helvetica", "bold");
    doc.text(project.name, 20, 150);
    
    // Total Amount Box
    doc.setFillColor(20, 20, 20);
    doc.rect(20, 170, 170, 30, "F");
    doc.setTextColor(0, 229, 255);
    doc.text("Total Paid:", 30, 190);
    doc.setFontSize(20);
    doc.text(`Rs. ${(project.price || 0).toLocaleString("en-IN")}`, 100, 190);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for doing business with ZeroOne.", 20, 280);

    doc.save(`Receipt_${project.customerName.replace(/\s+/g, "_")}.pdf`);
  };

  const formatCurrency = (val: number) => `₹${(val || 0).toLocaleString("en-IN")}`;

  if (isAuthChecking) {
    return (
      <div className="admin-login-container animate-fade-in">
        <div className="glass-panel login-box" style={{ textAlign: "center", padding: "40px" }}>
          <h2 className="text-gradient">Verifying Session</h2>
          <p>Connecting to backend authentication server...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container animate-fade-in">
        <div className="glass-panel login-box">
          <h2 className="text-gradient">Admin Access</h2>
          <p>Restricted Area</p>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="error-text">⚠ {error}</div>}
            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: 15 }}
              disabled={loginLoading}
            >
              {loginLoading ? "Authenticating..." : "Login"}
            </button>
            <button type="button" onClick={onLogout} className="btn-back">
              Back to Site
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard animate-fade-in">
      <header className="admin-header glass-panel">
        <h2>
          ZeroOne <span className="text-gradient">Dashboard</span>
        </h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <nav style={{ display: "flex", gap: "8px" }}>
            <button
              className={`btn-secondary ${activeAdminTab === "projects" ? "active" : ""}`}
              onClick={() => setActiveAdminTab("projects")}
            >
              Projects
            </button>
            <button
              className={`btn-secondary ${activeAdminTab === "quotations" ? "active" : ""}`}
              onClick={() => setActiveAdminTab("quotations")}
            >
              Quotations ({quotations.filter(q => q.status === "New").length})
            </button>
            <button
              className={`btn-secondary ${activeAdminTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveAdminTab("reviews")}
            >
              Reviews ({reviewsList.length})
            </button>
          </nav>
          <button onClick={handleLogout} className="btn-primary">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Real MongoDB Dashboard Metrics */}
        <div className="stats-grid">
          <div className="stat-card glass-panel">
            <h3>Total Projects</h3>
            <div className="stat-value">{metrics ? metrics.projects.total : projects.length}</div>
          </div>
          <div className="stat-card glass-panel">
            <h3>Delivered Sales</h3>
            <div className="stat-value text-gradient">
              {metrics ? metrics.projects.delivered : projects.filter((p) => p.status === "Delivered").length}
            </div>
          </div>
          <div className="stat-card glass-panel">
            <h3>Review Projects</h3>
            <div className="stat-value" style={{ color: "#ffab00" }}>
              {metrics ? metrics.projects.reviewProjects : projects.filter((p) => p.showInClientReviews).length}
            </div>
          </div>
          <div className="stat-card glass-panel">
            <h3>New Quotations</h3>
            <div className="stat-value" style={{ color: "#00e5ff" }}>
              {metrics ? metrics.quotations.new : quotations.filter((q) => q.status === "New").length}
            </div>
          </div>
          <div className="stat-card glass-panel">
            <h3>Avg Client Rating</h3>
            <div className="stat-value text-gradient">
              {metrics ? `${metrics.reviews.averageRating} ★` : "5.0 ★"}
            </div>
          </div>
        </div>

        {/* PROJECTS TAB */}
        {activeAdminTab === "projects" && (
          <div className="employee-section glass-panel">
            <div className="section-header-flex">
              <h3>Database Project Management</h3>
              <div className="export-actions">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={handleImportExcel}
                />
                <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  Import Excel
                </button>
                <button className="btn-primary" onClick={handleExportExcel}>
                  Export Excel
                </button>
              </div>
            </div>

            <form className="add-project-form" onSubmit={handleSaveProject}>
              <input
                type="text"
                placeholder={newShowInClientReviews ? "Customer Name *" : "Customer Name (Client Reviews only)"}
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
                required={newShowInClientReviews}
              />
              <input
                type="text"
                placeholder="Project Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <div className="image-upload-wrapper">
                <input
                  type="file"
                  accept="image/*"
                  ref={projectFileInputRef}
                  style={{ display: "none" }}
                  onChange={handleImageFileChange}
                />
                {newImageUrl ? (
                  <div className="image-preview-badge">
                    <img src={newImageUrl} alt="Preview" className="image-preview-thumb" />
                    <span style={{ fontSize: "0.82rem", color: "#e0e0e0" }}>Image Chosen</span>
                    <button
                      type="button"
                      className="btn-file-select"
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                      onClick={() => projectFileInputRef.current?.click()}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className="btn-remove-image"
                      title="Remove Image"
                      onClick={() => {
                        setNewImageUrl("");
                        if (projectFileInputRef.current) projectFileInputRef.current.value = "";
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-file-select"
                    onClick={() => projectFileInputRef.current?.click()}
                  >
                    📷 Choose Image File
                  </button>
                )}
              </div>
              <input
                type="url"
                placeholder="Website URL (optional)"
                value={newWebsiteUrl}
                onChange={(e) => setNewWebsiteUrl(e.target.value)}
              />
              <input
                type="number"
                placeholder="Price (₹)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ opacity: newShowInClientReviews ? 1 : 0.6 }}
                title={newShowInClientReviews ? "Delivery Status" : "Status (Client Reviews only)"}
              >
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
              </select>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />

              <div style={{ display: "flex", gap: "15px", alignItems: "center", gridColumn: "span 2" }}>
                <label style={{ color: "#aaa", fontSize: "0.85rem", display: "flex", gap: "5px", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={newShowInWork}
                    onChange={(e) => setNewShowInWork(e.target.checked)}
                  />
                  Show in WORK Section
                </label>
                <label style={{ color: "#aaa", fontSize: "0.85rem", display: "flex", gap: "5px", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={newShowInClientReviews}
                    onChange={(e) => setNewShowInClientReviews(e.target.checked)}
                  />
                  Show in CLIENT REVIEWS Section
                </label>
              </div>

              {projectFormError && (
                <div style={{ color: "#ff5252", fontSize: "0.85rem", gridColumn: "span 2" }}>
                  ⚠ {projectFormError}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn-primary">
                  {editingId ? "Update Project" : "Add Project"}
                </button>
                {editingId && (
                  <button type="button" className="btn-back" onClick={resetProjectForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Project Name</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Visibility</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const pIdStr = String(p._id || p.id);
                    return (
                      <tr key={pIdStr} className={editingId === pIdStr ? "editing-row" : ""}>
                        <td>{p.customerName}</td>
                        <td>{p.name}</td>
                        <td>{formatCurrency(p.price)}</td>
                        <td>
                          <span className={`status-badge ${p.status.toLowerCase()}`}>{p.status}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: "0.75rem", color: "#aaa" }}>
                            <div>Work: {p.showInWork !== false ? "✓ Yes" : "✕ No"}</div>
                            <div>Reviews: {p.showInClientReviews ? "✓ Yes" : "✕ No"}</div>
                          </div>
                        </td>
                        <td>{p.date ? p.date.split("T")[0] : ""}</td>
                        <td className="action-cell">
                          <button className="btn-action" onClick={() => handleDownloadReceipt(p)}>
                            Receipt
                          </button>
                          <button className="btn-action text-gradient" onClick={() => handleEditProject(p)}>
                            ✎ Edit
                          </button>
                          <button className="btn-action delete" onClick={() => handleDeleteProject(pIdStr)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QUOTATIONS TAB */}
        {activeAdminTab === "quotations" && (
          <div className="employee-section glass-panel">
            <h3>Quotation Enquiries Management</h3>
            <div className="table-responsive" style={{ marginTop: "15px" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Client</th>
                    <th>Company</th>
                    <th>Services</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "#888" }}>
                        No quotation enquiries submitted yet.
                      </td>
                    </tr>
                  ) : (
                    quotations.map((q) => {
                      const qIdStr = String(q._id || q.id);
                      return (
                        <tr key={qIdStr}>
                          <td>
                            <strong style={{ color: "#00e5ff" }}>#{q.requestId}</strong>
                          </td>
                          <td>
                            <div>{q.fullName}</div>
                            <div style={{ fontSize: "0.75rem", color: "#888" }}>{q.email} | {q.phone}</div>
                          </td>
                          <td>{q.companyName || "—"}</td>
                          <td>
                            <div style={{ fontSize: "0.8rem" }}>
                              {q.services.join(", ")}
                            </div>
                          </td>
                          <td>{q.budget}</td>
                          <td>
                            <select
                              value={q.status}
                              onChange={(e) => handleUpdateQuotationStatus(qIdStr, e.target.value)}
                              style={{
                                background: "#111",
                                color: "#00e5ff",
                                border: "1px solid #333",
                                borderRadius: "4px",
                                padding: "4px 8px"
                              }}
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Quoted">Quoted</option>
                              <option value="Converted">Converted</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                          <td>{q.createdAt ? q.createdAt.split("T")[0] : ""}</td>
                          <td className="action-cell">
                            <button className="btn-action text-gradient" onClick={() => setSelectedQuotation(q)}>
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeAdminTab === "reviews" && (
          <div className="employee-section glass-panel">
            <h3>Client Reviews Management</h3>
            <div className="table-responsive" style={{ marginTop: "15px" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Author</th>
                    <th>Stars</th>
                    <th>Review Text</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "#888" }}>
                        No reviews submitted yet.
                      </td>
                    </tr>
                  ) : (
                    reviewsList.map((r) => {
                      const rIdStr = String(r._id || r.id);
                      const projName = typeof r.projectId === "object" && r.projectId !== null
                        ? (r.projectId as any).name
                        : "Project #" + r.projectId;

                      return (
                        <tr key={rIdStr}>
                          <td><strong>{projName}</strong></td>
                          <td>{r.author}</td>
                          <td>{"★".repeat(r.stars)} ({r.stars}/5)</td>
                          <td style={{ maxWidth: "300px", fontSize: "0.85rem" }}>"{r.text}"</td>
                          <td>
                            <span className={`status-badge ${r.isApproved ? "delivered" : "pending"}`}>
                              {r.isApproved ? "Approved" : "Hidden"}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button
                              className="btn-action"
                              onClick={() => handleToggleReviewApproval(r)}
                            >
                              {r.isApproved ? "Hide" : "Approve"}
                            </button>
                            <button
                              className="btn-action delete"
                              onClick={() => handleDeleteReview(rIdStr)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* EDIT PROJECT MODAL */}
      {editModalProject && (
        <div className="modal-overlay" onClick={() => setEditModalProject(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "620px", width: "95%" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 className="text-gradient">✎ Edit Project</h2>
              <button className="modal-close-btn" onClick={() => setEditModalProject(null)}>✕</button>
            </div>

            <form onSubmit={handleEditModalSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Customer Name */}
              <input
                type="text"
                placeholder={editModalShowInClientReviews ? "Customer Name *" : "Customer Name (Client Reviews only)"}
                value={editModalCustomer}
                onChange={(e) => setEditModalCustomer(e.target.value)}
                required={editModalShowInClientReviews}
                style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.9rem" }}
              />
              {/* Project Name */}
              <input
                type="text"
                placeholder="Project Name"
                value={editModalName}
                onChange={(e) => setEditModalName(e.target.value)}
                required
                style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.9rem" }}
              />
              {/* Image Upload */}
              <div style={{ gridColumn: "span 2" }}>
                <input type="file" accept="image/*" ref={editModalFileInputRef} style={{ display: "none" }} onChange={handleEditModalImageChange} />
                {editModalImageUrl ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img src={editModalImageUrl} alt="preview" style={{ width: "60px", height: "40px", objectFit: "cover", borderRadius: "6px", border: "1px solid #333" }} />
                    <button type="button" className="btn-secondary" onClick={() => editModalFileInputRef.current?.click()}>Change Image</button>
                    <button type="button" style={{ background: "none", border: "none", color: "#ff5252", cursor: "pointer", fontSize: "1.1rem" }} onClick={() => setEditModalImageUrl("")}>✕ Remove</button>
                  </div>
                ) : (
                  <button type="button" className="btn-file-select" onClick={() => editModalFileInputRef.current?.click()}>📷 Choose Image</button>
                )}
              </div>
              {/* Website URL */}
              <input
                type="url"
                placeholder="Website URL (optional)"
                value={editModalWebsiteUrl}
                onChange={(e) => setEditModalWebsiteUrl(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.9rem" }}
              />
              {/* Price */}
              <input
                type="number"
                placeholder="Price (₹)"
                value={editModalPrice}
                onChange={(e) => setEditModalPrice(e.target.value)}
                required
                style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.9rem" }}
              />
              {/* Status */}
              <select
                value={editModalStatus}
                onChange={(e) => setEditModalStatus(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: "8px", background: "#111", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.9rem", opacity: editModalShowInClientReviews ? 1 : 0.6 }}
                title={editModalShowInClientReviews ? "Delivery Status" : "Status (Client Reviews only)"}
              >
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
              </select>
              {/* Date */}
              <input
                type="date"
                value={editModalDate}
                onChange={(e) => setEditModalDate(e.target.value)}
                required
                style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.9rem" }}
              />
              {/* Section Checkboxes */}
              <div style={{ gridColumn: "span 2", display: "flex", gap: "24px", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <label style={{ color: "#ccc", fontSize: "0.88rem", display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={editModalShowInWork} onChange={(e) => setEditModalShowInWork(e.target.checked)} />
                  Show in WORK Section
                </label>
                <label style={{ color: "#ccc", fontSize: "0.88rem", display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={editModalShowInClientReviews} onChange={(e) => setEditModalShowInClientReviews(e.target.checked)} />
                  Show in CLIENT REVIEWS Section
                </label>
              </div>
              {/* Error */}
              {editModalError && (
                <div style={{ gridColumn: "span 2", color: "#ff5252", fontSize: "0.85rem" }}>⚠ {editModalError}</div>
              )}
              {/* Actions */}
              <div style={{ gridColumn: "span 2", display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button type="button" className="btn-back" onClick={() => setEditModalProject(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={editModalSaving}>
                  {editModalSaving ? "Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUOTATION DETAILS MODAL */}
      {selectedQuotation && (
        <div className="modal-overlay" onClick={() => setSelectedQuotation(null)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="text-gradient">Enquiry #{selectedQuotation.requestId}</h2>
              <button className="modal-close-btn" onClick={() => setSelectedQuotation(null)}>✕</button>
            </div>
            <div style={{ marginTop: "15px", display: "grid", gap: "10px", fontSize: "0.9rem", color: "#ccc" }}>
              <div><strong>Client:</strong> {selectedQuotation.fullName} ({selectedQuotation.email} | {selectedQuotation.phone})</div>
              {selectedQuotation.companyName && <div><strong>Company:</strong> {selectedQuotation.companyName}</div>}
              <div><strong>Project Name:</strong> {selectedQuotation.projectName}</div>
              <div><strong>Services Requested:</strong> {selectedQuotation.services.join(", ")}</div>
              {selectedQuotation.otherService && <div><strong>Custom Service:</strong> {selectedQuotation.otherService}</div>}
              <div><strong>Budget:</strong> {selectedQuotation.budget} | <strong>Timeline:</strong> {selectedQuotation.timeline}</div>
              <div><strong>Contact Preference:</strong> {selectedQuotation.contactPreference?.join(", ") || "Email"}</div>
              {selectedQuotation.hasExistingWebsite && <div><strong>Existing Website:</strong> {selectedQuotation.websiteUrl || "Yes"}</div>}
              <div style={{ background: "#111", padding: "10px", borderRadius: "6px", border: "1px solid #222" }}>
                <strong>Description:</strong>
                <p style={{ marginTop: "5px", color: "#fff" }}>"{selectedQuotation.description}"</p>
              </div>
              {selectedQuotation.additionalInformation && (
                <div style={{ background: "#111", padding: "10px", borderRadius: "6px", border: "1px solid #222" }}>
                  <strong>Additional Information:</strong>
                  <p style={{ marginTop: "5px", color: "#fff" }}>"{selectedQuotation.additionalInformation}"</p>
                </div>
              )}
            </div>
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button className="btn-primary" onClick={() => setSelectedQuotation(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
