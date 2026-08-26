import { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "./AdminMode.css";

// Initial mock data updated with Customer Name
const initialData = [
  { id: 1, customerName: "Acme Corp", name: "Nexus AI Platform", price: 250000, status: "Delivered", date: "2026-08-10" },
  { id: 2, customerName: "Global Tech", name: "FinTech Dashboard", price: 180000, status: "Delivered", date: "2026-08-15" },
  { id: 3, customerName: "Startup Inc", name: "E-Commerce App", price: 120000, status: "Pending", date: "2026-08-25" },
];

export default function AdminMode({ onLogout }: { onLogout: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [projects, setProjects] = useState(initialData);

  useEffect(() => {
    const savedProjects = localStorage.getItem('zeroone_projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zeroone_projects', JSON.stringify(projects));
  }, [projects]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCustomer, setNewCustomer] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newStatus, setNewStatus] = useState("Pending");
  const [newDate, setNewDate] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "zeroone2026") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid credentials");
    }
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer || !newName || !newPrice || !newDate) return;

    if (editingId) {
      setProjects(projects.map(p => p.id === editingId ? {
        id: editingId,
        customerName: newCustomer,
        name: newName,
        image: newImageUrl,
        price: parseInt(newPrice),
        status: newStatus,
        date: newDate
      } : p));
      setEditingId(null);
    } else {
      const newProject = {
        id: Date.now(),
        customerName: newCustomer,
        name: newName,
        image: newImageUrl,
        price: parseInt(newPrice),
        status: newStatus,
        date: newDate
      };
      setProjects([newProject, ...projects]);
    }
    
    // Reset form
    setNewCustomer("");
    setNewName("");
    setNewImageUrl("");
    setNewPrice("");
    setNewStatus("Pending");
    setNewDate("");
  };

  const handleEdit = (project: typeof initialData[0] & {image?: string}) => {
    setEditingId(project.id);
    setNewCustomer(project.customerName);
    setNewName(project.name);
    setNewImageUrl(project.image || "");
    setNewPrice(project.price.toString());
    setNewStatus(project.status);
    setNewDate(project.date);
  };

  const handleDelete = (id: number) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(projects);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, "ZeroOne_Projects.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        
        const formattedData = data.map(row => ({
          id: row.id || Date.now() + Math.random(),
          customerName: row.customerName || "Unknown",
          name: row.name || "Imported Project",
          image: row.image || "",
          price: parseInt(row.price) || 0,
          status: row.status || "Pending",
          date: row.date || new Date().toISOString().split('T')[0]
        }));
        
        setProjects([...formattedData, ...projects]);
      } catch (err) {
        alert("Error parsing Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadReceipt = (project: typeof initialData[0]) => {
    const doc = new jsPDF();
    
    // Branding
    doc.setFillColor(5, 5, 5);
    doc.rect(0, 0, 210, 297, 'F'); // Dark background
    
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
    doc.text(`Receipt ID: #ZO-${project.id.toString().slice(-6)}`, 20, 80);
    doc.text(`Date: ${project.date}`, 20, 90);
    
    doc.text("Billed To:", 20, 110);
    doc.setFont("helvetica", "bold");
    doc.text(project.customerName, 20, 120);
    
    doc.setFont("helvetica", "normal");
    doc.text("Project Description:", 20, 140);
    doc.setFont("helvetica", "bold");
    doc.text(project.name, 20, 150);
    
    // Total Amount Box
    doc.setFillColor(20, 20, 20);
    doc.rect(20, 170, 170, 30, 'F');
    doc.setTextColor(0, 229, 255);
    doc.text("Total Paid:", 30, 190);
    doc.setFontSize(20);
    doc.text(`Rs. ${project.price.toLocaleString('en-IN')}`, 100, 190);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for doing business with ZeroOne.", 20, 280);

    doc.save(`Receipt_${project.customerName.replace(/\s+/g, '_')}.pdf`);
  };

  // Derived metrics
  const metrics = useMemo(() => {
    const totalCustomers = new Set(projects.map(p => p.customerName)).size;
    const totalSales = projects.filter(p => p.status === "Delivered").length;
    const pendingItems = projects.filter(p => p.status === "Pending").length;
    
    const totalRevenue = projects.reduce((acc, curr) => acc + curr.price, 0);
    const monthlyRevenue = totalRevenue * 0.4; // fake calc
    const yearlyRevenue = totalRevenue;

    return { totalCustomers, totalSales, pendingItems, totalRevenue, monthlyRevenue, yearlyRevenue };
  }, [projects]);

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container animate-fade-in">
        <div className="glass-panel login-box">
          <h2 className="text-gradient">Admin Access</h2>
          <p>Restricted Area</p>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <div className="error-text">{error}</div>}
            <button type="submit" className="btn-primary" style={{marginTop: 15}}>Login</button>
            <button type="button" onClick={onLogout} className="btn-back">Back to Site</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard animate-fade-in">
      <header className="admin-header glass-panel">
        <h2>ZeroOne <span className="text-gradient">Dashboard</span></h2>
        <button onClick={onLogout} className="btn-primary">Logout</button>
      </header>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card glass-panel">
            <h3>Total Customers</h3>
            <div className="stat-value">{metrics.totalCustomers}</div>
          </div>
          <div className="stat-card glass-panel">
            <h3>Delivered Sales</h3>
            <div className="stat-value text-gradient">{metrics.totalSales}</div>
          </div>
          <div className="stat-card glass-panel">
            <h3>Pending Items</h3>
            <div className="stat-value" style={{color: '#ffab00'}}>{metrics.pendingItems}</div>
          </div>
          <div className="stat-card glass-panel">
            <h3>Monthly Revenue</h3>
            <div className="stat-value">{formatCurrency(metrics.monthlyRevenue)}</div>
          </div>
          <div className="stat-card glass-panel">
            <h3>Yearly Revenue</h3>
            <div className="stat-value">{formatCurrency(metrics.yearlyRevenue)}</div>
          </div>
        </div>

        <div className="employee-section glass-panel">
          <div className="section-header-flex">
            <h3>Employee Data Management</h3>
            <div className="export-actions">
              <input type="file" accept=".xlsx, .xls" style={{display: 'none'}} ref={fileInputRef} onChange={handleImportExcel} />
              <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Import Excel</button>
              <button className="btn-primary" onClick={handleExportExcel}>Export Excel</button>
            </div>
          </div>
          
          <form className="add-project-form" onSubmit={handleSaveProject}>
            <input type="text" placeholder="Customer Name" value={newCustomer} onChange={e => setNewCustomer(e.target.value)} required />
            <input type="text" placeholder="Project Name" value={newName} onChange={e => setNewName(e.target.value)} required />
            <input type="url" placeholder="Image URL (optional)" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} />
            <input type="number" placeholder="Price (₹)" value={newPrice} onChange={e => setNewPrice(e.target.value)} required />
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="Pending">Pending</option>
              <option value="Delivered">Delivered</option>
            </select>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required />
            <button type="submit" className="btn-primary">{editingId ? 'Update Entry' : 'Add Entry'}</button>
            {editingId && <button type="button" className="btn-back" onClick={() => { setEditingId(null); setNewCustomer(""); setNewName(""); setNewImageUrl(""); setNewPrice(""); setNewDate(""); }}>Cancel Edit</button>}
          </form>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Project Name</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} className={editingId === p.id ? "editing-row" : ""}>
                    <td>{p.customerName}</td>
                    <td>{p.name}</td>
                    <td>{formatCurrency(p.price)}</td>
                    <td><span className={`status-badge ${p.status.toLowerCase()}`}>{p.status}</span></td>
                    <td>{p.date}</td>
                    <td className="action-cell">
                      <button className="btn-action" onClick={() => handleDownloadReceipt(p)}>Receipt</button>
                      <button className="btn-action text-gradient" onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn-action delete" onClick={() => handleDelete(p.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
