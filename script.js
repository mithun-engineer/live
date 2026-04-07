const form = document.getElementById("complaintForm");
const complaintsList = document.getElementById("complaintsList");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    
    // Log the form data
    console.log("Submitting form data:");
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    try {
        const response = await fetch("/api/cyber-complaints", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        console.log("Server response:", result);

        if (response.ok) {
            alert("Complaint submitted successfully!");
            form.reset();
            loadComplaints(); // Reload the list
        } else {
            alert("Error: " + (result.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Error submitting complaint. Check console for details.");
    }
});

async function loadComplaints() {
    try {
        console.log("Loading complaints...");
        const res = await fetch("/api/cyber-complaints");
        const complaints = await res.json();
        console.log("Received complaints:", complaints);

        complaintsList.innerHTML = "";

        if (complaints.length === 0) {
            complaintsList.innerHTML = "<p style='color: white; text-align: center;'>No complaints yet</p>";
            return;
        }

        complaints.forEach((complaint) => {
            complaintsList.innerHTML += `
                <div style="background: rgba(0,255,255,0.1); border: 1px solid #00ffff; border-radius: 10px; padding: 15px; margin-bottom: 15px;">
                    <strong>Name:</strong> ${complaint.fullName}<br><br>
                    <strong>Crime Type:</strong> ${complaint.crimeType}<br><br>
                    <strong>Description:</strong> ${complaint.crimeDescription}<br><br>
                    <strong>Status:</strong> 
                    <span style="color: #00ffff;">${complaint.status}</span>
                    <br><br>
                    ${complaint.documentUrl ? `<a href="${complaint.documentUrl}" target="_blank" style="color: #00ffff;">View Evidence</a>` : ''}
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading complaints:", error);
        complaintsList.innerHTML = "<p style='color: red;'>Error loading complaints</p>";
    }
}

// Load complaints when page loads
loadComplaints();

// Get phone from URL
const urlParams = new URLSearchParams(window.location.search);
const phone = urlParams.get("phone");
if(phone) {
    console.log("Logged in with phone:", phone);
}