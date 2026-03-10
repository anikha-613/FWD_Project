// Data Storage
let students = JSON.parse(localStorage.getItem('students')) || [];
let admins = JSON.parse(localStorage.getItem('admins')) || [];
let recoveryRequests = JSON.parse(localStorage.getItem('recoveryRequests')) || [];
let currentUser = null;
let currentAdmin = null;

// Department mapping based on first 6 digits
const departmentMap = {
    '252003': 'CSE',
    '252004': 'ECE',
    '252008': 'AI&DS',
    '252009': 'CS&IT'
};

// Navigation Functions
function showHome() {
    hideAll();
    document.getElementById('heroSection').style.display = 'block';
    document.getElementById('portalSelection').style.display = 'flex';
}

function showStudentPortal() {
    hideAll();
    showStudentLogin();
}

function showAdminPortal() {
    hideAll();
    showAdminLogin();
}

function showLogin() {
    hideAll();
    document.getElementById('portalSelection').style.display = 'flex';
}

function showStudentRegistration() {
    hideAll();
    document.getElementById('studentRegistration').classList.add('active');
}

function showStudentLogin() {
    hideAll();
    document.getElementById('studentLogin').classList.add('active');
}

function showAdminRegistration() {
    hideAll();
    document.getElementById('adminRegistration').classList.add('active');
}

function showAdminLogin() {
    hideAll();
    document.getElementById('adminLogin').classList.add('active');
}

function hideAll() {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('portalSelection').style.display = 'none';
    document.getElementById('studentRegistration').classList.remove('active');
    document.getElementById('studentLogin').classList.remove('active');
    document.getElementById('adminRegistration').classList.remove('active');
    document.getElementById('adminLogin').classList.remove('active');
    document.getElementById('studentDashboard').classList.remove('active');
    document.getElementById('adminDashboard').classList.remove('active');
}

// Password toggle
function togglePassword(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Validate roll number and get department
function validateAndGetDepartment(rollNumber) {
    if (!/^\d{10}$/.test(rollNumber)) {
        return { valid: false, message: 'Roll number must be exactly 10 digits' };
    }

    const prefix = rollNumber.substring(0, 6);
    const department = departmentMap[prefix];

    if (!department) {
        return { 
            valid: false, 
            message: 'Invalid roll number prefix. Must start with 252003, 252004, 252008, or 252009' 
        };
    }

    return { valid: true, department };
}

// Student Registration
function registerStudent(event) {
    event.preventDefault();
    
    const name = document.getElementById('studentName').value.trim();
    const rollNumber = document.getElementById('rollNumber').value.trim();
    const password = document.getElementById('studentPassword').value;

    // Validate roll number
    const validation = validateAndGetDepartment(rollNumber);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    // Check if student already exists
    if (students.find(s => s.rollNumber === rollNumber)) {
        alert('Student already registered! Please login.');
        return;
    }

    const student = {
        name,
        rollNumber,
        password,
        department: validation.department,
        accounts: [],
        createdAt: new Date().toISOString()
    };

    students.push(student);
    localStorage.setItem('students', JSON.stringify(students));

    alert('Registration successful! Please login with your credentials.');
    showStudentLogin();
}

// Student Login
function loginStudent(event) {
    event.preventDefault();
    
    const rollNumber = document.getElementById('loginRollNumber').value.trim();
    const password = document.getElementById('loginPassword').value;

    const student = students.find(s => s.rollNumber === rollNumber && s.password === password);

    if (student) {
        currentUser = student;
        showStudentDashboard();
        addChatMessage('User logged into student dashboard', 'system');
    } else {
        alert('Invalid roll number or password!');
    }
}

// Show Student Dashboard
function showStudentDashboard() {
    hideAll();
    document.getElementById('studentDashboard').classList.add('active');
    
    document.getElementById('studentWelcome').textContent = `Welcome, ${currentUser.name}!`;
    document.getElementById('studentDepartment').textContent = `Department: ${currentUser.department}`;
    
    displayStudentAccounts();
    displayStudentRequests();
}

// Display Student Accounts
function displayStudentAccounts() {
    const container = document.getElementById('accountsContainer');
    
    if (!currentUser.accounts || currentUser.accounts.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">No accounts added yet. Use the form above to add your first account!</p>';
        return;
    }

    let html = '';
    currentUser.accounts.forEach((account, index) => {
        const isLocked = account.failedAttempts >= 3;
        const maskedPassword = '•'.repeat(account.password.length);
        
        html += `
            <div class="account-card">
                ${isLocked ? '<span class="locked-badge">🔒 LOCKED</span>' : ''}
                <div class="account-type">${account.type}</div>
                <div class="account-credentials">
                    <div><strong>Username:</strong> ${account.username}</div>
                    <div><strong>Password:</strong> ${isLocked ? '🔒 Locked' : maskedPassword}</div>
                    <div><small>Failed attempts: ${account.failedAttempts || 0}/3</small></div>
                </div>
                <div class="account-actions">
                    ${!isLocked ? 
                        `<button class="action-btn login-btn-sm" onclick="loginToAccount(${index})">🔑 Login</button>` : 
                        `<button class="action-btn recover-btn" onclick="requestRecovery(${index})">🆘 Request Recovery</button>`
                    }
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Display Student Requests
function displayStudentRequests() {
    const studentRequests = recoveryRequests.filter(r => r.rollNumber === currentUser.rollNumber);
    const container = document.getElementById('studentRequests');

    if (studentRequests.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 1rem;">No recovery requests found.</p>';
        return;
    }

    let html = '<table style="width: 100%;">';
    html += '<tr><th>Account Type</th><th>Request Date</th><th>Status</th><th>Action</th></tr>';
    
    studentRequests.sort((a, b) => new Date(b.requestTime) - new Date(a.requestTime)).forEach(request => {
        html += `
            <tr>
                <td>${request.accountType}</td>
                <td>${new Date(request.requestTime).toLocaleString()}</td>
                <td><span class="status-badge status-${request.status.toLowerCase()}">${request.status}</span></td>
                <td>
                    ${request.status === 'Approved' && !request.completed ? 
                        `<button class="action-btn login-btn-sm" onclick="setNewPassword('${request.id}')">Set New Password</button>` : 
                        request.status === 'Approved' ? 'Password Set' : '-'
                    }
                </td>
            </tr>
        `;
    });
    html += '</table>';

    container.innerHTML = html;
}

// Add Account
function addAccount(event) {
    event.preventDefault();
    
    const type = document.getElementById('accountType').value;
    const username = document.getElementById('accountUsername').value.trim();
    const password = document.getElementById('accountPassword').value;

    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }

    const account = {
        type,
        username,
        password,
        failedAttempts: 0,
        locked: false,
        addedAt: new Date().toISOString()
    };

    if (!currentUser.accounts) {
        currentUser.accounts = [];
    }

    currentUser.accounts.push(account);
    
    // Update in students array
    const index = students.findIndex(s => s.rollNumber === currentUser.rollNumber);
    students[index] = currentUser;
    localStorage.setItem('students', JSON.stringify(students));

    // Clear form
    document.getElementById('accountUsername').value = '';
    document.getElementById('accountPassword').value = '';

    displayStudentAccounts();
    alert('Account added successfully!');
}

// Login to Account
function loginToAccount(accountIndex) {
    const account = currentUser.accounts[accountIndex];
    
    // Simulate login attempt
    const password = prompt(`Enter password for ${account.type} account:`);
    
    if (password === account.password) {
        alert(`✅ Successfully logged into ${account.type}!`);
        account.failedAttempts = 0;
        
        // Simulate opening the account portal
        window.open(`https://${account.type.toLowerCase()}-portal.example.com`, '_blank');
    } else {
        account.failedAttempts = (account.failedAttempts || 0) + 1;
        
        if (account.failedAttempts >= 3) {
            alert(`❌ Account locked due to multiple failed attempts! Click 'Request Recovery' to unlock.`);
        } else {
            alert(`❌ Incorrect password! ${3 - account.failedAttempts} attempts remaining.`);
        }
    }

    // Update storage
    const index = students.findIndex(s => s.rollNumber === currentUser.rollNumber);
    students[index] = currentUser;
    localStorage.setItem('students', JSON.stringify(students));
    
    displayStudentAccounts();
}

// Request Recovery
function requestRecovery(accountIndex) {
    const account = currentUser.accounts[accountIndex];
    
    // Check if there's already a pending request for this account
    const existingRequest = recoveryRequests.find(r => 
        r.rollNumber === currentUser.rollNumber && 
        r.accountType === account.type && 
        r.status === 'Pending'
    );

    if (existingRequest) {
        alert('You already have a pending request for this account!');
        return;
    }
    
    const request = {
        id: Date.now().toString(),
        rollNumber: currentUser.rollNumber,
        studentName: currentUser.name,
        accountType: account.type,
        accountIndex: accountIndex,
        requestTime: new Date().toISOString(),
        status: 'Pending',
        completed: false
    };

    recoveryRequests.push(request);
    localStorage.setItem('recoveryRequests', JSON.stringify(recoveryRequests));

    alert('✅ Recovery request sent to admin! You can track its status below.');
    displayStudentRequests();
}

// Set New Password
function setNewPassword(requestId) {
    const request = recoveryRequests.find(r => r.id === requestId);
    if (!request) return;

    const newPassword = prompt('Enter your new password:');
    if (newPassword && newPassword.length >= 4) {
        const student = students.find(s => s.rollNumber === request.rollNumber);
        if (student) {
            student.accounts[request.accountIndex].password = newPassword;
            student.accounts[request.accountIndex].failedAttempts = 0;
            
            // Update storage
            localStorage.setItem('students', JSON.stringify(students));
            
            // Update request status
            request.status = 'Completed';
            request.completed = true;
            localStorage.setItem('recoveryRequests', JSON.stringify(recoveryRequests));
            
            alert('✅ Password updated successfully! You can now login to your account.');
            
            if (currentUser && currentUser.rollNumber === request.rollNumber) {
                displayStudentAccounts();
                displayStudentRequests();
            }
        }
    } else if (newPassword) {
        alert('Password must be at least 4 characters long!');
    }
}

// Admin Registration
function registerAdmin(event) {
    event.preventDefault();
    
    const name = document.getElementById('adminName').value.trim();
    const id = document.getElementById('adminId').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (!name || !id || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (admins.find(a => a.id === id)) {
        alert('Admin ID already exists! Please choose another.');
        return;
    }

    admins.push({ name, id, password });
    localStorage.setItem('admins', JSON.stringify(admins));

    alert('Admin registration successful! Please login.');
    showAdminLogin();
}

// Admin Login
function loginAdmin(event) {
    event.preventDefault();
    
    const id = document.getElementById('adminLoginId').value.trim();
    const password = document.getElementById('adminLoginPassword').value;

    const admin = admins.find(a => a.id === id && a.password === password);

    if (admin) {
        currentAdmin = admin;
        showAdminDashboard();
    } else {
        alert('Invalid admin ID or password!');
    }
}

// Show Admin Dashboard
function showAdminDashboard() {
    hideAll();
    document.getElementById('adminDashboard').classList.add('active');
    
    updateAdminStats();
    displayAdminRequests();
    displayAllRequests();
}

// Update Admin Statistics
function updateAdminStats() {
    const totalStudents = students.length;
    const pendingRequests = recoveryRequests.filter(r => r.status === 'Pending').length;
    const approvedRequests = recoveryRequests.filter(r => r.status === 'Approved').length;
    const rejectedRequests = recoveryRequests.filter(r => r.status === 'Rejected').length;
    const completedRequests = recoveryRequests.filter(r => r.status === 'Completed').length;
    
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentRecoveries = recoveryRequests.filter(r => 
        (r.status === 'Approved' || r.status === 'Completed') && 
        new Date(r.requestTime) > last7Days
    ).length;

    const statsContainer = document.getElementById('adminStats');
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${totalStudents}</div>
            <div class="stat-label">Total Students</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${pendingRequests}</div>
            <div class="stat-label">Pending Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${approvedRequests}</div>
            <div class="stat-label">Approved</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${completedRequests}</div>
            <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${recentRecoveries}</div>
            <div class="stat-label">Recent (7 days)</div>
        </div>
    `;
}

// Display Pending Admin Requests
function displayAdminRequests() {
    const pendingRequests = recoveryRequests.filter(r => r.status === 'Pending');
    const tbody = document.getElementById('adminRequestsBody');

    if (pendingRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No pending requests</td></tr>';
        return;
    }

    let html = '';
    pendingRequests.forEach(request => {
        html += `
            <tr>
                <td>${request.rollNumber}</td>
                <td>${request.studentName}</td>
                <td>${request.accountType}</td>
                <td>${new Date(request.requestTime).toLocaleString()}</td>
                <td><span class="status-badge status-pending">Pending</span></td>
                <td>
                    <button class="approve-btn" onclick="approveRequest('${request.id}')">✓ Approve</button>
                    <button class="reject-btn" onclick="rejectRequest('${request.id}')">✗ Reject</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Display All Requests History
function displayAllRequests() {
    const allRequests = recoveryRequests.sort((a, b) => new Date(b.requestTime) - new Date(a.requestTime));
    const tbody = document.getElementById('allRequestsBody');

    if (allRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No requests found</td></tr>';
        return;
    }

    let html = '';
    allRequests.slice(0, 10).forEach(request => { // Show last 10 requests
        html += `
            <tr>
                <td>${request.rollNumber}</td>
                <td>${request.studentName}</td>
                <td>${request.accountType}</td>
                <td>${new Date(request.requestTime).toLocaleString()}</td>
                <td><span class="status-badge status-${request.status.toLowerCase()}">${request.status}</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Approve Request
function approveRequest(requestId) {
    if (confirm('Approve this recovery request?')) {
        const request = recoveryRequests.find(r => r.id === requestId);
        if (request) {
            request.status = 'Approved';
            localStorage.setItem('recoveryRequests', JSON.stringify(recoveryRequests));
            
            updateAdminStats();
            displayAdminRequests();
            displayAllRequests();
            alert('✅ Request approved! Student can now set a new password.');
        }
    }
}

// Reject Request
function rejectRequest(requestId) {
    if (confirm('Reject this recovery request?')) {
        const request = recoveryRequests.find(r => r.id === requestId);
        if (request) {
            request.status = 'Rejected';
            localStorage.setItem('recoveryRequests', JSON.stringify(recoveryRequests));
            
            updateAdminStats();
            displayAdminRequests();
            displayAllRequests();
            alert('❌ Request rejected.');
        }
    }
}

// Logout
function logout() {
    currentUser = null;
    currentAdmin = null;
    showHome();
}

// AI Chatbot Functions
function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');
    chatbot.classList.toggle('active');
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    addChatMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Generate bot response after delay
    setTimeout(() => {
        removeTypingIndicator();
        const response = getBotResponse(message);
        addChatMessage(response, 'bot');
    }, 1000);
}

function showTypingIndicator() {
    const messages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator-container';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function addChatMessage(message, sender) {
    const messages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (sender === 'bot') {
        messageDiv.innerHTML = message.replace(/\n/g, '<br>');
    } else {
        messageDiv.textContent = message;
    }
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

function getBotResponse(message) {
    message = message.toLowerCase();

    // Account Creation Help
    if (message.includes('create account') || message.includes('register') || message.includes('sign up')) {
        return `📝 **How to create an account:**

**For Students:**
1. Click on "Student Portal"
2. Click "Register here"
3. Enter your full name
4. Enter your 10-digit roll number:
   • 252003xxxx → CSE
   • 252004xxxx → ECE
   • 252008xxxx → AI&DS
   • 252009xxxx → CS&IT
5. Choose a password
6. Click "Register"

**For Admins:**
1. Click on "Admin Portal"
2. Click "Register here"
3. Fill in admin details
4. Choose admin ID and password

Need help with anything specific?`;
    }

    // Login Help
    else if (message.includes('login') || message.includes('sign in')) {
        let response = `🔑 **Login Instructions:**

**Student Login:**
• Use your 10-digit roll number
• Use the password you created during registration
• After login, you can add and manage all your institutional accounts

**Admin Login:**
• Use your admin ID
• Use your admin password
• After login, you can view and manage all recovery requests

**Troubleshooting:**
• Forgot password? Contact admin at anikhadev@outlook.com
• Account locked? Use the recovery feature after login

Are you having trouble logging in?`;
        
        if (currentUser) {
            response += "\n\nYou're currently logged in as a student! Check your dashboard above.";
        } else if (currentAdmin) {
            response += "\n\nYou're currently logged in as an admin! Check your dashboard above.";
        }
        
        return response;
    }

    // Adding Accounts
    else if (message.includes('add account') || message.includes('save account')) {
        return `➕ **How to Add Accounts:**

1. Login to your student dashboard
2. Find the "Add New Account" section
3. Select account type from dropdown:
   • ERP Account
   • Library Account
   • WiFi Login
   • LMS Account
   • Lab System Login
   • Examination Portal
4. Enter your username/ID
5. Enter your password (hidden for security)
6. Click "Add Account"

Your accounts will be saved securely and displayed in the "Your Saved Accounts" section.

You can add multiple accounts of different types!`;
    }

    // Recovery Process
    else if (message.includes('recover') || message.includes('recovery') || message.includes('ticket') || message.includes('raise')) {
        return `🆘 **Recovery Request Process:**

**When to raise a ticket:**
• Forgot password for any account
• Account locked after 3 failed attempts

**How to raise a ticket:**
1. Login to your student dashboard
2. Go to "Your Saved Accounts"
3. Find the locked/forgotten account
4. Click "Request Recovery" button
5. Admin will receive your request

**After raising ticket:**
1. Status shows as "Pending"
2. Admin reviews your request
3. You'll see "Approved" or "Rejected"
4. If approved, click "Set New Password"
5. Enter your new password
6. Account is unlocked!

**Track Status:**
Check "Your Recovery Requests" section to track all your tickets.`;
    }

    // Account Locking
    else if (message.includes('lock') || message.includes('locked') || message.includes('failed attempt')) {
        return `🔒 **Account Locking System:**

**How locking works:**
• Accounts lock after 3 failed password attempts
• Locked accounts show with a red "LOCKED" badge
• Login button is replaced with "Request Recovery"

**What to do when locked:**
1. Click "Request Recovery" on the locked account
2. Wait for admin approval
3. Once approved, set a new password
4. Account is automatically unlocked

**Prevention Tips:**
• Use a password manager
• Save accounts immediately after adding
• Double-check username/password before submitting

Need help with a specific locked account?`;
    }

    // Admin Features
    else if (message.includes('admin')) {
        return `👨‍💼 **Admin Features:**

As an admin, you can:

1. **Dashboard Statistics:**
   • Total students registered
   • Pending/Approved/Rejected requests
   • Recently recovered accounts

2. **Manage Requests:**
   • View all pending recovery requests
   • See student details (Roll No, Name, Account Type)
   • Approve or reject requests
   • Track request history

3. **Student Management:**
   • Monitor all student accounts
   • Track recovery patterns
   • Ensure security compliance

**To access admin features:**
• Login with your admin credentials
• Navigate to Admin Dashboard
• All pending requests appear automatically

Need specific admin guidance?`;
    }

    // Contact/Support
    else if (message.includes('contact') || message.includes('support') || message.includes('help')) {
        return `📞 **Contact Support:**

**Developer:** Anikha Padala
**Phone:** 9553396237
**Email:** anikhadev@outlook.com

**Support Hours:** 24/7

**For urgent issues:**
• Account completely locked out
• Technical errors
• Admin assistance needed

You can also ask me anytime! I'm here 24/7 to help. 😊`;
    }

    // Department Information
    else if (message.includes('department') || message.includes('cse') || message.includes('ece') || message.includes('ai&ds') || message.includes('cs&it')) {
        return `🏫 **Department Information:**

Roll number prefixes determine department:

• **252003xxxx** → CSE Department
  (Computer Science & Engineering)

• **252004xxxx** → ECE Department
  (Electronics & Communication Engineering)

• **252008xxxx** → AI&DS Department
  (Artificial Intelligence & Data Science)

• **252009xxxx** → CS&IT Department
  (Computer Science & Information Technology)

**Note:** xxxx can be any 4 digits of your choice.

Your department is automatically detected and shown on your welcome page after registration!`;
    }

    // General greeting
    else if (message.includes('hi') || message.includes('hello') || message.includes('hey')) {
        return `👋 Hello! I'm Lucky, your AI assistant!

I can help you with:
• Creating accounts (student/admin)
• Login procedures
• Adding/managing accounts
• Raising recovery tickets
• Account locking issues
• Tracking request status

What would you like to know more about?`;
    }

    // Default response
    else {
        return `🤔 I'm not sure about that. Here's what I can help you with:

• Creating an account
• Login process
• Adding accounts
• Recovery tickets
• Account locking
• Admin features
• Contact support

Just ask me about any of these topics! Or try rephrasing your question. 😊`;
    }
}

// Initialize with sample data
window.onload = function() {
    showHome();
    
    // Add sample student if none exist
    if (students.length === 0) {
        const sampleStudent = {
            name: "John Doe",
            rollNumber: "2520031234",
            password: "password123",
            department: "CSE",
            accounts: [
                { 
                    type: "ERP", 
                    username: "john.erp", 
                    password: "erp123", 
                    failedAttempts: 0 
                },
                { 
                    type: "Library", 
                    username: "john.lib", 
                    password: "lib123", 
                    failedAttempts: 0 
                },
                { 
                    type: "WiFi", 
                    username: "john.wifi", 
                    password: "wifi123", 
                    failedAttempts: 0 
                }
            ],
            createdAt: new Date().toISOString()
        };
        students.push(sampleStudent);
        localStorage.setItem('students', JSON.stringify(students));
    }

    // Add sample admin if none exist
    if (admins.length === 0) {
        const sampleAdmin = {
            name: "Admin User",
            id: "ADMIN001",
            password: "admin123"
        };
        admins.push(sampleAdmin);
        localStorage.setItem('admins', JSON.stringify(admins));
    }

    // Add sample recovery request
    if (recoveryRequests.length === 0 && students.length > 0) {
        const sampleRequest = {
            id: Date.now().toString(),
            rollNumber: "2520031234",
            studentName: "John Doe",
            accountType: "ERP",
            accountIndex: 0,
            requestTime: new Date().toISOString(),
            status: "Pending",
            completed: false
        };
        recoveryRequests.push(sampleRequest);
        localStorage.setItem('recoveryRequests', JSON.stringify(recoveryRequests));
    }
};