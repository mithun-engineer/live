let allComplaints = [];

// Load complaints on page load
async function loadComplaints() {
    try {
        const res = await fetch("/api/cyber-complaints");
        allComplaints = await res.json();
        updateStats();
        displayComplaints(allComplaints);
    } catch (error) {
        console.error("Error loading complaints:", error);
        document.getElementById("adminList").innerHTML = `
            <div style="text-align: center; padding: 50px; color: #ff6b6b;">
                ❌ Error loading complaints. Please try again.
            </div>
        `;
    }
}

// Update statistics with animation
function updateStats() {
    animateNumber("totalComplaints", allComplaints.length);
    animateNumber("pendingReview", allComplaints.filter(c => c.status === "Pending Review").length);
    animateNumber("underInvestigation", allComplaints.filter(c => c.status === "Under Investigation").length);
    animateNumber("closed", allComplaints.filter(c => c.status === "Closed").length);
}

// Animate number counting
function animateNumber(elementId, finalNumber) {
    const element = document.getElementById(elementId);
    const currentNumber = parseInt(element.textContent) || 0;
    const duration = 1000;
    const steps = 50;
    const increment = (finalNumber - currentNumber) / steps;
    let step = 0;

    const interval = setInterval(() => {
        step++;
        if (step >= steps) {
            element.textContent = finalNumber;
            clearInterval(interval);
        } else {
            element.textContent = Math.round(currentNumber + (increment * step));
        }
    }, duration / steps);
}

// Filter complaints
function filterComplaints() {
    const statusFilter = document.getElementById("statusFilter").value;
    const crimeFilter = document.getElementById("crimeTypeFilter").value;
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();

    let filtered = allComplaints;

    if (statusFilter !== "all") {
        filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (crimeFilter !== "all") {
        filtered = filtered.filter(c => c.crimeType === crimeFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.fullName?.toLowerCase().includes(searchTerm) ||
            c.phone?.includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm)
        );
    }

    displayComplaints(filtered);
}

// Display complaints
function displayComplaints(complaints) {
    const container = document.getElementById("adminList");
    
    if (complaints.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px; color: #a0a0c0;">
                <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
                <div style="font-size: 20px;">No complaints found</div>
            </div>
        `;
        return;
    }

    container.innerHTML = complaints.map((complaint, index) => `
        <div class="complaint-detail" id="complaint-${complaint._id}" style="animation-delay: ${index * 0.1}s">
            <div class="complaint-header">
                <span class="complaint-id">🔹 CASE #${complaint._id.slice(-8).toUpperCase()}</span>
                <span class="status-badge status-${complaint.status.toLowerCase().replace(/\s+/g, '')}">
                    ${complaint.status}
                </span>
            </div>

            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">👤 Complainant</div>
                    <div class="detail-value">${complaint.fullName}</div>
                    <div class="detail-value">📞 ${complaint.phone}</div>
                    ${complaint.email ? `<div class="detail-value">✉️ ${complaint.email}</div>` : ''}
                </div>

                <div class="detail-item">
                    <div class="detail-label">🔍 Crime Details</div>
                    <div class="detail-value">Type: ${complaint.crimeType}</div>
                    <div class="detail-value">Date: ${complaint.crimeDate ? new Date(complaint.crimeDate).toLocaleDateString() : 'N/A'}</div>
                    <div class="detail-value">Filed: ${new Date(complaint.createdAt).toLocaleDateString()}</div>
                </div>

                <div class="detail-item" style="grid-column: span 2;">
                    <div class="detail-label">📝 Description</div>
                    <div class="detail-value">${complaint.crimeDescription}</div>
                </div>
            </div>

            ${complaint.documentUrl ? `
            <div style="margin: 15px 0; padding: 10px; background: rgba(74, 144, 226, 0.1); border-radius: 6px;">
                <a href="${complaint.documentUrl}" target="_blank" style="color: var(--admin-primary); text-decoration: none;">
                    📎 VIEW EVIDENCE DOCUMENT →
                </a>
            </div>
            ` : ''}

            <!-- Update Form -->
            <div class="update-form">
                <h4 style="color: var(--admin-primary); margin-top: 0; margin-bottom: 15px;">⚙️ UPDATE CASE</h4>
                
                <div class="half-width">
                    <select id="status-${complaint._id}">
                        <option value="Pending Review" ${complaint.status === 'Pending Review' ? 'selected' : ''}>⏳ Pending Review</option>
                        <option value="Under Investigation" ${complaint.status === 'Under Investigation' ? 'selected' : ''}>🔍 Under Investigation</option>
                        <option value="Evidence Required" ${complaint.status === 'Evidence Required' ? 'selected' : ''}>📎 Evidence Required</option>
                        <option value="Case Registered" ${complaint.status === 'Case Registered' ? 'selected' : ''}>📋 Case Registered</option>
                        <option value="Closed" ${complaint.status === 'Closed' ? 'selected' : ''}>✅ Closed</option>
                    </select>
                    
                    <input type="text" id="officer-${complaint._id}" placeholder="👮 Assigned Officer" 
                           value="${complaint.assignedOfficer || ''}">
                </div>
                
                <textarea id="remarks-${complaint._id}" rows="2" 
                    placeholder="📝 Officer Remarks">${complaint.officerRemarks || ''}</textarea>
                
                <div class="half-width" style="margin-top: 15px;">
                    <input type="text" id="fir-${complaint._id}" placeholder="📄 FIR Number" 
                           value="${complaint.firNumber || ''}">
                    <input type="text" id="policeStation-${complaint._id}" placeholder="🏛️ Police Station" 
                           value="${complaint.policeStation || ''}">
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="updateComplaint('${complaint._id}')" style="flex: 2;">
                        💾 UPDATE CASE
                    </button>
                    <button onclick="deleteComplaint('${complaint._id}')" class="delete" style="flex: 1;">
                        🗑️ DELETE
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Update complaint
async function updateComplaint(id) {
    const status = document.getElementById(`status-${id}`).value;
    const officer = document.getElementById(`officer-${id}`).value;
    const remarks = document.getElementById(`remarks-${id}`).value;
    const fir = document.getElementById(`fir-${id}`).value;
    const policeStation = document.getElementById(`policeStation-${id}`).value;

    // Add loading state to button
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '⏳ UPDATING...';
    btn.disabled = true;

    try {
        const res = await fetch(`/api/cyber-complaints/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status,
                assignedOfficer: officer,
                officerRemarks: remarks,
                firNumber: fir,
                policeStation: policeStation
            })
        });

        if (res.ok) {
            showNotification('✅ Case updated successfully!', 'success');
            loadComplaints();
        }
    } catch (error) {
        showNotification('❌ Error updating case', 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Delete complaint
async function deleteComplaint(id) {
    if (!confirm("⚠️ Are you sure you want to delete this case? This action cannot be undone.")) return;

    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '⏳ DELETING...';
    btn.disabled = true;

    try {
        const res = await fetch(`/api/cyber-complaints/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            showNotification('✅ Case deleted successfully!', 'success');
            loadComplaints();
        }
    } catch (error) {
        showNotification('❌ Error deleting case', 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #7ed321, #4a90e2)' : 'linear-gradient(135deg, #d0021b, #9013fe)'};
        color: white;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Load on page start
document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("isAdmin")) {
        window.location.href = "login.html?mode=admin";
        return;
    }
    loadComplaints();
});

// Debounced search
let searchTimeout;
document.getElementById("searchInput").addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterComplaints, 500);
});