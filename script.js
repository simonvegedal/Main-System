// Global variables
let currentDate = new Date();
let employees = [];
let events = [];
let db = null;
let selectedDate = null;
let currentEditingEventId = null;

// Firebase initialization
function initializeFirebase(event) {
    event.preventDefault();
    
    const firebaseConfig = {
        apiKey: document.getElementById('apiKey').value,
        authDomain: document.getElementById('authDomain').value,
        projectId: document.getElementById('projectId').value,
        storageBucket: document.getElementById('storageBucket').value,
        messagingSenderId: document.getElementById('messagingSenderId').value,
        appId: document.getElementById('appId').value
    };

    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        // Test connection
        db.collection('test').doc('connection').set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'connected'
        }).then(() => {
            showStatus('Firebase connected successfully!', 'success');
            document.getElementById('firebaseConfig').classList.add('hidden');
            document.getElementById('loginSection').classList.remove('hidden');
            
            // Load existing data
            loadEmployees();
            loadEvents();
        }).catch((error) => {
            showStatus('Firebase connection failed: ' + error.message, 'error');
        });

    } catch (error) {
        showStatus('Firebase initialization failed: ' + error.message, 'error');
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('firebaseStatus');
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
    statusEl.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
}

// Login functionality
function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username && password) {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        document.getElementById('navigationButtons').classList.remove('hidden');
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('welcomeText').textContent = `Welcome, ${username}`;
        
        generateCalendar();
        renderEmployeeList();
    }
}

function logout() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('navigationButtons').classList.add('hidden');
    document.getElementById('userInfo').style.display = 'none';
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Employee management with Firebase
async function loadEmployees() {
    if (!db) return;
    
    try {
        const snapshot = await db.collection('employees').get();
        employees = [];
        snapshot.forEach((doc) => {
            employees.push({ id: doc.id, ...doc.data() });
        });
        renderEmployeeList();
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

async function addEmployee(event) {
    event.preventDefault();
    
    if (!db) {
        alert('Firebase not initialized');
        return;
    }
    
    const name = document.getElementById('empName').value;
    const email = document.getElementById('empEmail').value;
    const phone = document.getElementById('empPhone').value;
    const role = document.getElementById('empRole').value;
    
    const newEmployee = {
        name,
        email,
        phone,
        role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        const docRef = await db.collection('employees').add(newEmployee);
        employees.push({ id: docRef.id, ...newEmployee });
        renderEmployeeList();
        
        // Clear form
        document.getElementById('empName').value = '';
        document.getElementById('empEmail').value = '';
        document.getElementById('empPhone').value = '';
        document.getElementById('empRole').value = '';
        
        showStatus('Employee added successfully!', 'success');
    } catch (error) {
        showStatus('Error adding employee: ' + error.message, 'error');
    }
}

async function removeEmployee(id) {
    if (!db) return;
    
    try {
        await db.collection('employees').doc(id).delete();
        employees = employees.filter(emp => emp.id !== id);
        renderEmployeeList();
        showStatus('Employee removed successfully!', 'success');
    } catch (error) {
        showStatus('Error removing employee: ' + error.message, 'error');
    }
}

function renderEmployeeList() {
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = '';
    
    employees.forEach(employee => {
        const employeeDiv = document.createElement('div');
        employeeDiv.className = 'employee-item';
        employeeDiv.innerHTML = `
            <div class="employee-info">
                <div class="employee-name">${employee.name}</div>
                <div class="employee-role">${employee.role}</div>
                <div class="employee-contact">${employee.email} | ${employee.phone}</div>
            </div>
            <button class="btn btn-danger" onclick="removeEmployee('${employee.id}')">Remove</button>
        `;
        employeeList.appendChild(employeeDiv);
    });
}

// Calendar functionality with Firebase
async function loadEvents() {
    if (!db) return;
    
    try {
        const snapshot = await db.collection('events').get();
        events = [];
        snapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });
        generateCalendar();
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function generateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendarBody = document.getElementById('calendarBody');
    calendarBody.innerHTML = '';
    
    let date = 1;
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('tr');
        
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            
            if (i === 0 && j < firstDay) {
                cell.textContent = '';
            } else if (date > daysInMonth) {
                break;
            } else {
                cell.textContent = date;
                cell.style.cursor = 'pointer';
                
                const today = new Date();
                if (year === today.getFullYear() && month === today.getMonth() && date === today.getDate()) {
                    cell.classList.add('today');
                }
                
                // Check for events on this date
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                const dayEvents = events.filter(event => event.date === dateStr);
                
                if (dayEvents.length > 0) {
                    cell.classList.add('has-event');
                    const dot = document.createElement('div');
                    dot.className = 'event-dot';
                    cell.appendChild(dot);
                }
                
                // Add click handler for viewing/adding events
                const currentDateForCell = date;
                cell.addEventListener('click', () => {
                    const clickedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDateForCell).padStart(2, '0')}`;
                    showDayModal(clickedDate, currentDateForCell, monthNames[month], year);
                });
                
                date++;
            }
            
            row.appendChild(cell);
        }
        
        calendarBody.appendChild(row);
        if (date > daysInMonth) break;
    }
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    generateCalendar();
}

// Day modal functions
function showDayModal(dateStr, day, month, year) {
    selectedDate = dateStr;
    const dayEvents = events.filter(event => event.date === dateStr);
    
    document.getElementById('dayModalTitle').textContent = `Events for ${month} ${day}, ${year}`;
    
    const dayModalContent = document.getElementById('dayModalContent');
    dayModalContent.innerHTML = '';
    
    if (dayEvents.length === 0) {
        dayModalContent.innerHTML = '<p style="text-align: center; color: #a0aec0; font-style: italic;">No events scheduled for this day.</p>';
    } else {
        dayEvents.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-item';
            eventDiv.innerHTML = `
                <div class="event-title">${event.title}</div>
                <div class="event-time">${event.time || 'All day'}</div>
                <div class="event-description">${event.description || 'No description'}</div>
                <div class="event-actions">
                    <button class="event-btn event-btn-edit" onclick="editEvent('${event.id}')">Edit</button>
                    <button class="event-btn event-btn-delete" onclick="confirmDeleteEvent('${event.id}')">Delete</button>
                </div>
            `;
            dayModalContent.appendChild(eventDiv);
        });
    }
    
    document.getElementById('dayModal').classList.remove('hidden');
}

function hideDayModal() {
    document.getElementById('dayModal').classList.add('hidden');
}

function addEventForDay() {
    hideDayModal();
    document.getElementById('eventDate').value = selectedDate;
    showEventModal();
}

// Event modal functions
function showEventModal() {
    document.getElementById('eventModal').classList.remove('hidden');
}

function hideEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('event-time-hour').value = '';
    document.getElementById('event-time-minute').value = '';
    document.getElementById('eventDescription').value = '';
}

async function addEvent(event) {
    event.preventDefault();
    
    if (!db) {
        alert('Firebase not initialized');
        return;
    }
    
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const hour = document.getElementById('event-time-hour').value;
    const minute = document.getElementById('event-time-minute').value;
    const description = document.getElementById('eventDescription').value;
    
    let time = '';
    if (hour && minute) {
        time = `${hour}:${minute}`;
    }
    
    const newEvent = {
        title,
        date,
        time,
        description,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        const docRef = await db.collection('events').add(newEvent);
        events.push({ id: docRef.id, ...newEvent });
        generateCalendar();
        hideEventModal();
        showStatus('Event added successfully!', 'success');
    } catch (error) {
        showStatus('Error adding event: ' + error.message, 'error');
    }
}

// Edit Event functions
function editEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    currentEditingEventId = eventId;
    
    document.getElementById('editEventId').value = eventId;
    document.getElementById('editEventTitle').value = event.title;
    document.getElementById('editEventDate').value = event.date;
    document.getElementById('editEventDescription').value = event.description || '';
    
    // Parse time
    if (event.time) {
        const [hour, minute] = event.time.split(':');
        document.getElementById('edit-event-time-hour').value = hour;
        document.getElementById('edit-event-time-minute').value = minute;
    } else {
        document.getElementById('edit-event-time-hour').value = '';
        document.getElementById('edit-event-time-minute').value = '';
    }
    
    hideDayModal();
    document.getElementById('editEventModal').classList.remove('hidden');
}

function hideEditEventModal() {
    document.getElementById('editEventModal').classList.add('hidden');
    currentEditingEventId = null;
}

async function updateEvent(event) {
    event.preventDefault();
    
    if (!db || !currentEditingEventId) {
        alert('Firebase not initialized or no event selected');
        return;
    }
    
    const title = document.getElementById('editEventTitle').value;
    const date = document.getElementById('editEventDate').value;
    const hour = document.getElementById('edit-event-time-hour').value;
    const minute = document.getElementById('edit-event-time-minute').value;
    const description = document.getElementById('editEventDescription').value;
    
    let time = '';
    if (hour && minute) {
        time = `${hour}:${minute}`;
    }
    
    const updatedEvent = {
        title,
        date,
        time,
        description,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('events').doc(currentEditingEventId).update(updatedEvent);
        
        // Update local events array
        const eventIndex = events.findIndex(e => e.id === currentEditingEventId);
        if (eventIndex !== -1) {
            events[eventIndex] = { id: currentEditingEventId, ...updatedEvent };
        }
        
        generateCalendar();
        hideEditEventModal();
        showStatus('Event updated successfully!', 'success');
    } catch (error) {
        showStatus('Error updating event: ' + error.message, 'error');
    }
}

// Delete Event functions
function confirmDeleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        deleteEventById(eventId);
    }
}

async function deleteEvent() {
    if (!db || !currentEditingEventId) {
        alert('Firebase not initialized or no event selected');
        return;
    }
    
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            await db.collection('events').doc(currentEditingEventId).delete();
            events = events.filter(event => event.id !== currentEditingEventId);
            generateCalendar();
            hideEditEventModal();
            showStatus('Event deleted successfully!', 'success');
        } catch (error) {
            showStatus('Error deleting event: ' + error.message, 'error');
        }
    }
}

async function deleteEventById(eventId) {
    if (!db) {
        alert('Firebase not initialized');
        return;
    }
    
    try {
        await db.collection('events').doc(eventId).delete();
        events = events.filter(event => event.id !== eventId);
        generateCalendar();
        hideDayModal();
        showStatus('Event deleted successfully!', 'success');
    } catch (error) {
        showStatus('Error deleting event: ' + error.message, 'error');
    }
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    const sections = ['calendarSection', 'employeeSection'];
    sections.forEach(section => {
        const sectionElement = document.getElementById(section);
        if (sectionElement) {
            sectionElement.classList.add('hidden');
        }
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionName);
    if (selectedSection) {
        selectedSection.classList.remove('hidden');
    }
    
    // Update active navigation button
    const navButtons = document.querySelectorAll('#navigationButtons button');
    navButtons.forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set default date in event form to today
    const today = new Date().toISOString().split('T')[0];
    const eventDateEl = document.getElementById('eventDate');
    const editEventDateEl = document.getElementById('editEventDate');
    
    if (eventDateEl) eventDateEl.value = today;
    if (editEventDateEl) editEventDateEl.value = today;
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const dayModal = document.getElementById('dayModal');
        const eventModal = document.getElementById('eventModal');
        const editEventModal = document.getElementById('editEventModal');
        
        if (event.target === dayModal) {
            hideDayModal();
        }
        if (event.target === eventModal) {
            hideEventModal();
        }
        if (event.target === editEventModal) {
            hideEditEventModal();
        }
    });
});