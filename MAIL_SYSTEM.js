       // Firebase konfiguration
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
        import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

        // VIGTIGT: Erstat med dine egne Firebase config værdier
        const firebaseConfig = {
  apiKey: "AIzaSyDwoTI7bvJ0Ib4gEqRMx76aXDOKkjSZUpo",
  authDomain: "esben-og-simon-crm.firebaseapp.com",
  projectId: "esben-og-simon-crm",
  storageBucket: "esben-og-simon-crm.firebasestorage.app",
  messagingSenderId: "634930800544",
  appId: "1:634930800544:web:a49fdfe615fcdcabc1e6c5",
  measurementId: "G-CJW7GFMP9E"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        let contacts = [];
        let editingContactId = null;

        // Funktioner til at håndtere data
        window.addContact = async function() {
            const virksomhed = document.getElementById('virksomhed').value.trim();
            const kontaktperson = document.getElementById('kontaktperson').value.trim();
            const email = document.getElementById('email').value.trim();
            const status = document.getElementById('status').value;
            const naesteDato = document.getElementById('naesteDato').value;
            const kommentar = document.getElementById('kommentar').value.trim();

            if (!virksomhed || !kontaktperson || !email) {
                alert('Udfyld venligst alle obligatoriske felter (virksomhed, kontaktperson, email)');
                return;
            }

            try {
                const newContact = {
                    virksomhed,
                    kontaktperson,
                    email,
                    mail1: false,
                    mail2: false,
                    mail3: false,
                    status,
                    naesteDato: naesteDato || null,
                    kommentar,
                    oprettet: new Date().toISOString()
                };

                await addDoc(collection(db, 'contacts'), newContact);
                
                // Clear form
                document.getElementById('virksomhed').value = '';
                document.getElementById('kontaktperson').value = '';
                document.getElementById('email').value = '';
                document.getElementById('status').value = 'Venter på svar';
                document.getElementById('naesteDato').value = '';
                document.getElementById('kommentar').value = '';

                await loadContacts();
                alert('Kontakt tilføjet succesfuldt!');
            } catch (error) {
                console.error('Fejl ved tilføjelse af kontakt:', error);
                alert('Der opstod en fejl ved tilføjelse af kontakt. Tjek console for detaljer.');
            }
        };

        window.loadContacts = async function() {
            try {
                const q = query(collection(db, 'contacts'), orderBy('oprettet', 'desc'));
                const querySnapshot = await getDocs(q);
                
                contacts = [];
                querySnapshot.forEach((doc) => {
                    contacts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                renderContacts();
                updateStats();
                document.getElementById('loading').style.display = 'none';
                document.getElementById('contactsTable').style.display = 'table';
            } catch (error) {
                console.error('Fejl ved indlæsning af kontakter:', error);
                document.getElementById('loading').innerHTML = 'Fejl ved indlæsning af data. Tjek Firebase konfiguration.';
            }
        };

        window.renderContacts = function(filteredContacts = contacts) {
            const tbody = document.getElementById('contactsBody');
            tbody.innerHTML = '';

            filteredContacts.forEach(contact => {
                const row = document.createElement('tr');
                
                const statusClass = contact.status.toLowerCase().replace(/\s+/g, '-').replace(/å/g, 'a').replace(/ø/g, 'o').replace(/æ/g, 'ae');
                
                row.innerHTML = `
                    <td><strong>${contact.virksomhed}</strong></td>
                    <td>${contact.kontaktperson}</td>
                    <td><a href="mailto:${contact.email}">${contact.email}</a></td>
                    <td>
                        <div class="mail-checkbox ${contact.mail1 ? 'mail-sent' : 'mail-not-sent'}" 
                             onclick="toggleMail('${contact.id}', 'mail1')">
                            ${contact.mail1 ? '✓' : '1'}
                        </div>
                    </td>
                    <td>
                        <div class="mail-checkbox ${contact.mail2 ? 'mail-sent' : 'mail-not-sent'}" 
                             onclick="toggleMail('${contact.id}', 'mail2')">
                            ${contact.mail2 ? '✓' : '2'}
                        </div>
                    </td>
                    <td>
                        <div class="mail-checkbox ${contact.mail3 ? 'mail-sent' : 'mail-not-sent'}" 
                             onclick="toggleMail('${contact.id}', 'mail3')">
                            ${contact.mail3 ? '✓' : '3'}
                        </div>
                    </td>
                    <td><span class="status-badge status-${statusClass}">${contact.status}</span></td>
                    <td>${contact.naesteDato ? new Date(contact.naesteDato).toLocaleDateString('da-DK') : '-'}</td>
                    <td>${contact.kommentar || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-warning btn-small" onclick="editContact('${contact.id}')">✏️</button>
                            <button class="btn btn-danger btn-small" onclick="deleteContact('${contact.id}')">🗑️</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        };

        window.toggleMail = async function(contactId, mailField) {
            try {
                const contact = contacts.find(c => c.id === contactId);
                if (!contact) return;

                const newValue = !contact[mailField];
                await updateDoc(doc(db, 'contacts', contactId), {
                    [mailField]: newValue
                });

                contact[mailField] = newValue;
                renderContacts();
            } catch (error) {
                console.error('Fejl ved opdatering af mail status:', error);
                alert('Der opstod en fejl ved opdatering af mail status.');
            }
        };

        window.editContact = function(contactId) {
            const contact = contacts.find(c => c.id === contactId);
            if (!contact) return;

            editingContactId = contactId;
            
            document.getElementById('editVirksomhed').value = contact.virksomhed;
            document.getElementById('editKontaktperson').value = contact.kontaktperson;
            document.getElementById('editEmail').value = contact.email;
            document.getElementById('editStatus').value = contact.status;
            document.getElementById('editNaesteDato').value = contact.naesteDato || '';
            document.getElementById('editKommentar').value = contact.kommentar || '';
            document.getElementById('editMail1').checked = contact.mail1;
            document.getElementById('editMail2').checked = contact.mail2;
            document.getElementById('editMail3').checked = contact.mail3;

            document.getElementById('editModal').style.display = 'block';
        };

        window.saveEdit = async function() {
            if (!editingContactId) return;

            try {
                const updatedData = {
                    virksomhed: document.getElementById('editVirksomhed').value.trim(),
                    kontaktperson: document.getElementById('editKontaktperson').value.trim(),
                    email: document.getElementById('editEmail').value.trim(),
                    status: document.getElementById('editStatus').value,
                    naesteDato: document.getElementById('editNaesteDato').value || null,
                    kommentar: document.getElementById('editKommentar').value.trim(),
                    mail1: document.getElementById('editMail1').checked,
                    mail2: document.getElementById('editMail2').checked,
                    mail3: document.getElementById('editMail3').checked
                };

                await updateDoc(doc(db, 'contacts', editingContactId), updatedData);
                
                const contactIndex = contacts.findIndex(c => c.id === editingContactId);
                if (contactIndex !== -1) {
                    contacts[contactIndex] = { ...contacts[contactIndex], ...updatedData };
                }

                renderContacts();
                updateStats();
                closeModal();
                alert('Kontakt opdateret succesfuldt!');
            } catch (error) {
                console.error('Fejl ved opdatering af kontakt:', error);
                alert('Der opstod en fejl ved opdatering af kontakt.');
            }
        };

        window.deleteContact = async function(contactId) {
            if (!confirm('Er du sikker på, at du vil slette denne kontakt?')) return;

            try {
                await deleteDoc(doc(db, 'contacts', contactId));
                contacts = contacts.filter(c => c.id !== contactId);
                renderContacts();
                updateStats();
                alert('Kontakt slettet succesfuldt!');
            } catch (error) {
                console.error('Fejl ved sletning af kontakt:', error);
                alert('Der opstod en fejl ved sletning af kontakt.');
            }
        };

        window.closeModal = function() {
            document.getElementById('editModal').style.display = 'none';
            editingContactId = null;
        };

        window.updateStats = function() {
            const total = contacts.length;
            const waiting = contacts.filter(c => c.status === 'Venter på svar').length;
            const interested = contacts.filter(c => c.status === 'Interesseret').length;
            const notInterested = contacts.filter(c => c.status === 'Ikke interesseret').length;
            const booked = contacts.filter(c => c.status === 'Booket møde').length;

            document.getElementById('totalCount').textContent = total;
            document.getElementById('waitingCount').textContent = waiting;
            document.getElementById('interestedCount').textContent = interested;
            document.getElementById('notInterestedCount').textContent = notInterested;
            document.getElementById('bookedCount').textContent = booked;
        };

        window.filterContacts = function() {
            const statusFilter = document.getElementById('statusFilter').value;
            
            let filtered = contacts;
            if (statusFilter) {
                filtered = contacts.filter(c => c.status === statusFilter);
            }
            
            renderContacts(filtered);
        };

        window.showDueToday = function() {
            const today = new Date().toISOString().split('T')[0];
            const dueToday = contacts.filter(c => c.naesteDato === today);
            
            if (dueToday.length === 0) {
                alert('Ingen kontakter er forfaldne i dag!');
                return;
            }
            
            renderContacts(dueToday);
            alert(`${dueToday.length} kontakter er forfaldne i dag!`);
        };

        window.exportData = function() {
            const csv = [
                ['Virksomhed', 'Kontaktperson', 'Email', 'Mail 1', 'Mail 2', 'Mail 3', 'Status', 'Næste dato', 'Kommentar'].join(','),
                ...contacts.map(c => [
                    c.virksomhed,
                    c.kontaktperson,
                    c.email,
                    c.mail1 ? 'Ja' : 'Nej',
                    c.mail2 ? 'Ja' : 'Nej',
                    c.mail3 ? 'Ja' : 'Nej',
                    c.status,
                    c.naesteDato || '',
                    c.kommentar || ''
                ].map(field => `"${field}"`).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `crm_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        };

        // Load contacts når siden indlæses
        window.addEventListener('load', loadContacts);

        // Luk modal ved klik udenfor
        window.onclick = function(event) {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                closeModal();
            }
        };