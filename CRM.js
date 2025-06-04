// Firebase Configuration (Du skal erstatte med dine egne værdier)

const firebaseConfig = {
    apiKey: "AIzaSyDwoTI7bvJ0Ib4gEqRMx76aXDOKkjSZUpo",
    authDomain: "esben-og-simon-crm.firebaseapp.com",
    projectId: "esben-og-simon-crm",
    storageBucket: "esben-og-simon-crm.firebasestorage.app",
    messagingSenderId: "634930800544",
    appId: "1:634930800544:web:ee659bbe83c3f397c1e6c5",
    measurementId: "G-XQWR60VZ2D"
};

// Initialize Firebase (kun hvis config er tilgængelig)
let auth, db;
if (firebaseConfig.apiKey !== "your-api-key") {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
} else {
    // Demo mode without Firebase
    console.log("Demo mode - Firebase not configured");
}

let currentUser = null;
let companies = [];
let editingCompanyId = null;

// Authentication functions
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Add validation
    if (!email || !password) {
        alert('Udfyld email og password');
        return;
    }

    if (!auth) {
        alert('Firebase ikke konfigureret - dette er demo mode');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            currentUser = userCredential.user;
            // Clear login form
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            showDashboard();
            loadCompanies();
        })
        .catch((error) => {
            console.error('Login error:', error);
            alert('Login fejl: ' + error.message);
        });
}

function signup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!auth) {
        alert('Firebase ikke konfigureret - dette er demo mode');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            currentUser = auth.currentUser;
            showDashboard();
            hideSignup();
        })
        .catch((error) => {
            alert('Oprettelse fejl: ' + error.message);
        });
}

function logout() {
    if (auth) {
        auth.signOut();
    } else {
        currentUser = null;
        showLogin();
    }
}

function showSignup() {
    document.getElementById('signupForm').classList.remove('hidden');
}

function hideSignup() {
    document.getElementById('signupForm').classList.add('hidden');
}

function showLogin() {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    
    if (loginScreen) {
        loginScreen.style.display = 'block';
        loginScreen.classList.remove('hidden');
    }
    if (dashboard) {
        dashboard.style.display = 'none';
        dashboard.classList.add('hidden');
    }
}

function showDashboard() {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    
    if (loginScreen) {
        loginScreen.style.display = 'none';
        loginScreen.classList.add('hidden');
    }
    if (dashboard) {
        dashboard.style.display = 'block';
        dashboard.classList.remove('hidden');
    }
    
    if (currentUser && currentUser.email) {
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = currentUser.email;
        }
    }
}

// Company management functions
function showAddModal() {
    editingCompanyId = null;
    document.getElementById('modalTitle').textContent = 'Tilføj virksomhed';
    document.getElementById('companyForm').reset();
    document.getElementById('companyModal').style.display = 'block';
}

function showEditModal(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    editingCompanyId = companyId;
    document.getElementById('modalTitle').textContent = 'Rediger virksomhed';
    
    document.getElementById('companyName').value = company.name || '';
    document.getElementById('cvrNumber').value = company.cvrNumber || '';
    document.getElementById('contactPerson').value = company.contactPerson || '';
    document.getElementById('contactEmail').value = company.email || '';
    document.getElementById('contactPhone').value = company.phone || '';
    document.getElementById('website').value = company.website || '';
    document.getElementById('industry').value = company.industry || '';
    document.getElementById('status').value = company.status || 'not-contacted';
    document.getElementById('emailConsent').value = company.emailConsent || 'unknown';
    document.getElementById('notes').value = company.notes || '';
    
    document.getElementById('companyModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('companyModal').style.display = 'none';
    editingCompanyId = null;
}

function deleteCompany(companyId) {
    if (!confirm('Er du sikker på at du vil slette denne virksomhed?')) return;

    if (db) {
        db.collection('companies').doc(companyId).delete()
            .then(() => {
                loadCompanies();
            })
            .catch((error) => {
                alert('Fejl ved sletning: ' + error.message);
            });
    } else {
        // Demo mode
        companies = companies.filter(c => c.id !== companyId);
        renderCompanies();
        updateStats();
    }
}

// Form submission
document.getElementById('companyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const companyData = {
        name: document.getElementById('companyName').value,
        cvrNumber: document.getElementById('cvrNumber').value,
        contactPerson: document.getElementById('contactPerson').value,
        email: document.getElementById('contactEmail').value,
        phone: document.getElementById('contactPhone').value,
        website: document.getElementById('website').value,
        industry: document.getElementById('industry').value,
        status: document.getElementById('status').value,
        emailConsent: document.getElementById('emailConsent').value,
        notes: document.getElementById('notes').value,
        updatedAt: new Date(),
        updatedBy: currentUser ? currentUser.email : 'demo@example.com'
    };

    if (db) {
        if (editingCompanyId) {
            // Update existing
            db.collection('companies').doc(editingCompanyId).update(companyData)
                .then(() => {
                    closeModal();
                    loadCompanies();
                })
                .catch((error) => {
                    alert('Fejl ved opdatering: ' + error.message);
                });
        } else {
            // Add new
            companyData.createdAt = new Date();
            companyData.createdBy = currentUser ? currentUser.email : 'demo@example.com';
            
            db.collection('companies').add(companyData)
                .then(() => {
                    closeModal();
                    loadCompanies();
                })
                .catch((error) => {
                    alert('Fejl ved oprettelse: ' + error.message);
                });
        }
    } else {
        // Demo mode
        if (editingCompanyId) {
            const index = companies.findIndex(c => c.id === editingCompanyId);
            if (index !== -1) {
                companies[index] = { ...companyData, id: editingCompanyId };
            }
        } else {
            companyData.id = 'demo-' + Date.now();
            companyData.createdAt = new Date();
            companies.push(companyData);
        }
        closeModal();
        renderCompanies();
        updateStats();
    }
});

// Load companies from Firestore
function loadCompanies() {
    if (!db) return;

    db.collection('companies')
        .orderBy('updatedAt', 'desc')
        .onSnapshot((querySnapshot) => {
            companies = [];
            querySnapshot.forEach((doc) => {
                companies.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            renderCompanies();
            updateStats();
        });
}

// Load demo data for testing
function loadDemoData() {
    companies = [
        {
            id: 'demo-1',
            name: 'Acme Corp',
            cvrNumber: '12345678',
            contactPerson: 'John Doe',
            email: 'john@acme.com',
            phone: '+45 12 34 56 78',
            website: 'https://acme.com',
            industry: 'Technology',
            status: 'contacted',
            emailConsent: 'yes',
            notes: 'Sendt første email d. 1/6',
            updatedAt: new Date('2024-06-01'),
            updatedBy: 'demo@example.com'
        },
        {
            id: 'demo-2',
            name: 'TechStart ApS',
            cvrNumber: '87654321',
            contactPerson: 'Jane Smith',
            email: 'jane@techstart.dk',
            phone: '+45 87 65 43 21',
            website: 'https://techstart.dk',
            industry: 'Software',
            status: 'replied',
            emailConsent: 'yes',
            notes: 'Positiv respons, book møde',
            updatedAt: new Date('2024-06-02'),
            updatedBy: 'demo@example.com'
        },
        {
            id: 'demo-3',
            name: 'Design Studio',
            cvrNumber: '11223344',
            contactPerson: 'Lars Hansen',
            email: 'lars@designstudio.dk',
            phone: '+45 11 22 33 44',
            industry: 'Design',
            status: 'not-contacted',
            emailConsent: 'unknown',
            notes: '',
            updatedAt: new Date('2024-06-02'),
            updatedBy: 'demo@example.com'
        }
    ];
    renderCompanies();
    updateStats();
}

// Render companies in table
function renderCompanies() {
    const tbody = document.getElementById('companiesTableBody');
    tbody.innerHTML = '';

    companies.forEach(company => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${company.name}</strong></td>
            <td>${company.cvrNumber || '-'}</td>
            <td>${company.contactPerson || '-'}</td>
            <td><a href="mailto:${company.email}">${company.email}</a></td>
            <td>${company.phone || '-'}</td>
            <td><span class="status-badge status-${company.status}">${getStatusText(company.status)}</span></td>
            <td><span class="email-consent-badge consent-${company.emailConsent || 'unknown'}">${getEmailConsentText(company.emailConsent)}</span></td>
            <td>${formatDate(company.updatedAt)}</td>
            <td>
                <button onclick="showEditModal('${company.id}')" class="btn btn-small" style="margin-right: 5px;">Rediger</button>
                <button onclick="deleteCompany('${company.id}')" class="btn btn-danger btn-small">Slet</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Filter companies
function filterCompanies() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const emailConsentFilter = document.getElementById('emailConsentFilter').value;
    
    const filteredCompanies = companies.filter(company => {
        const matchesSearch = !searchTerm || 
            company.name.toLowerCase().includes(searchTerm) ||
            (company.contactPerson && company.contactPerson.toLowerCase().includes(searchTerm)) ||
            company.email.toLowerCase().includes(searchTerm) ||
            (company.cvrNumber && company.cvrNumber.includes(searchTerm));
        
        const matchesStatus = !statusFilter || company.status === statusFilter;
        const matchesEmailConsent = !emailConsentFilter || (company.emailConsent || 'unknown') === emailConsentFilter;
        
        return matchesSearch && matchesStatus && matchesEmailConsent;
    });

    const tbody = document.getElementById('companiesTableBody');
    tbody.innerHTML = '';

    filteredCompanies.forEach(company => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${company.name}</strong></td>
            <td>${company.cvrNumber || '-'}</td>
            <td>${company.contactPerson || '-'}</td>
            <td><a href="mailto:${company.email}">${company.email}</a></td>
            <td>${company.phone || '-'}</td>
            <td><span class="status-badge status-${company.status}">${getStatusText(company.status)}</span></td>
            <td><span class="email-consent-badge consent-${company.emailConsent || 'unknown'}">${getEmailConsentText(company.emailConsent)}</span></td>
            <td>${formatDate(company.updatedAt)}</td>
            <td>
                <button onclick="showEditModal('${company.id}')" class="btn btn-small" style="margin-right: 5px;">Rediger</button>
                <button onclick="deleteCompany('${company.id}')" class="btn btn-danger btn-small">Slet</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update statistics
function updateStats() {
    const total = companies.length;
    const contacted = companies.filter(c => c.status === 'contacted').length;
    const replied = companies.filter(c => c.status === 'replied').length;
    const interested = companies.filter(c => c.status === 'interested').length;

    document.getElementById('totalCompanies').textContent = total;
    document.getElementById('contactedCount').textContent = contacted;
    document.getElementById('repliedCount').textContent = replied;
    document.getElementById('interestedCount').textContent = interested;
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'not-contacted': 'Ikke kontaktet',
        'contacted': 'Kontaktet',
        'replied': 'Svar modtaget',
        'interested': 'Interesseret',
        'closed': 'Lukket'
    };
    return statusMap[status] || status;
}

function getEmailConsentText(consent) {
    const consentMap = {
        'yes': 'Ja',
        'no': 'Nej',
        'unknown': 'Ukendt'
    };
    return consentMap[consent] || 'Ukendt';
}

function formatDate(date) {
    if (!date) return '-';
    if (date.toDate) date = date.toDate(); // Firestore timestamp
    return date.toLocaleDateString('da-DK') + ' ' + date.toLocaleTimeString('da-DK', {hour: '2-digit', minute: '2-digit'});
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('companyModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Firebase Auth State Listener - ONLY ONE INSTANCE
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            showDashboard();
            loadCompanies();
        } else {
            currentUser = null;
            showLogin();
        }
    });
}

// Initialize the app
window.addEventListener('DOMContentLoaded', function() {
    // Initially hide dashboard and show login
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    
    if (loginScreen) {
        loginScreen.style.display = 'block';
        loginScreen.classList.remove('hidden');
    }
    if (dashboard) {
        dashboard.style.display = 'none';
        dashboard.classList.add('hidden');
    }
    
    if (auth) {
        // Firebase is configured, wait for auth state
        // Auth state listener will handle the rest
    } else {
        // Demo mode, show login
        showLogin();
        loadDemoData(); // Load demo data in demo mode
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape to close modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});

// Auto-save draft when typing in notes (demo feature)
let notesTimeout;
document.getElementById('notes').addEventListener('input', function() {
    clearTimeout(notesTimeout);
    notesTimeout = setTimeout(() => {
        // In a real app, you might save drafts here
        console.log('Draft saved');
    }, 2000);
});

// Export functionality (demo)
function exportData() {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Virksomhed,CVR,Kontaktperson,Email,Telefon,Status,Email Tilladelse,Branche,Noter\n"
        + companies.map(c => [
            c.name,
            c.cvrNumber || '',
            c.contactPerson || '',
            c.email,
            c.phone || '',
            getStatusText(c.status),
            getEmailConsentText(c.emailConsent),
            c.industry || '',
            (c.notes || '').replace(/\n/g, ' ')
        ].map(field => `"${field}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "virksomheder.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add export button functionality (you can add this button to the UI if needed)
// <button onclick="exportData()" class="btn btn-secondary">Eksporter CSV</button>