// Configuration
const API_URL = 'http://localhost:3000/api'; // Change this to your API URL
let token = localStorage.getItem('token') || '';
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// DOM Elements
const sections = {
  login: document.getElementById('login-section'),
  dashboard: document.getElementById('dashboard-section'),
  lightning: document.getElementById('lightning-section'),
  mpesa: document.getElementById('mpesa-section'),
  history: document.getElementById('history-section'),
};

// Show a specific section and hide others
function showSection(sectionId) {
  Object.keys(sections).forEach((key) => {
    sections[key].classList.remove('active');
  });
  sections[sectionId].classList.add('active');
}

// Check if user is logged in
function checkAuth() {
  if (token && currentUser) {
    showSection('dashboard');
    updateBalance();
  } else {
    showSection('login');
  }
}

// API request helper
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const phoneNumber = document.getElementById('phone').value;
  const pin = document.getElementById('pin').value;
  const errorElement = document.getElementById('login-error');

  try {
    errorElement.textContent = '';

    const result = await apiRequest('/auth/login', 'POST', {
      phoneNumber,
      pin,
    });

    token = result.token;
    currentUser = result.user;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));

    showSection('dashboard');
    updateBalance();
  } catch (error) {
    errorElement.textContent = error.message || 'Login failed';
  }
});

// Update wallet balance
async function updateBalance() {
  try {
    const balanceElement = document.getElementById('balance');
    balanceElement.innerHTML = '<span class="loading"></span>';

    const result = await apiRequest('/wallet/balance');
    balanceElement.textContent = result.balance;
  } catch (error) {
    document.getElementById('balance').textContent = 'Error';
    console.error('Balance error:', error);
  }
}

// Refresh balance button
document
  .getElementById('refresh-balance')
  .addEventListener('click', updateBalance);

// Navigation buttons
document
  .getElementById('show-lightning')
  .addEventListener('click', () => showSection('lightning'));
document
  .getElementById('show-mpesa')
  .addEventListener('click', () => showSection('mpesa'));
document.getElementById('show-history').addEventListener('click', () => {
  showSection('history');
  loadTransactions();
});
document
  .getElementById('back-from-lightning')
  .addEventListener('click', () => showSection('dashboard'));
document
  .getElementById('back-from-mpesa')
  .addEventListener('click', () => showSection('dashboard'));
document
  .getElementById('back-from-history')
  .addEventListener('click', () => showSection('dashboard'));

// Create Lightning invoice
document
  .getElementById('invoice-form')
  .addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = document.getElementById('amount').value;
    const memo = document.getElementById('memo').value;

    try {
      const result = await apiRequest('/wallet/invoice', 'POST', {
        amount: parseInt(amount),
        memo: memo || 'Test payment',
      });

      // Display invoice details
      document.getElementById('payment-request').value = result.paymentRequest;
      document.getElementById('payment-hash').value = result.paymentHash;

      // Generate QR code
      const qrcodeElement = document.getElementById('qrcode');
      qrcodeElement.innerHTML = '';

      if (result.qrCode) {
        // If the API returns a QR code image
        const img = document.createElement('img');
        img.src = result.qrCode;
        img.alt = 'Payment QR Code';
        img.className = 'img-fluid';
        qrcodeElement.appendChild(img);
      } else {
        // Generate QR code from payment request
        QRCode.toCanvas(qrcodeElement, result.paymentRequest, {
          width: 200,
          margin: 1,
        });
      }

      document.getElementById('invoice-result').style.display = 'block';
      document.getElementById('payment-status').style.display = 'none';
    } catch (error) {
      alert('Failed to create invoice: ' + error.message);
    }
  });

// Copy payment request to clipboard
document.getElementById('copy-request').addEventListener('click', () => {
  const paymentRequest = document.getElementById('payment-request');
  paymentRequest.select();
  document.execCommand('copy');
  alert('Payment request copied to clipboard');
});

// Check Lightning payment status
document.getElementById('check-payment').addEventListener('click', async () => {
  const paymentHash = document.getElementById('payment-hash').value;
  const statusElement = document.getElementById('payment-status');

  try {
    statusElement.innerHTML =
      '<span class="loading"></span> Checking payment status...';
    statusElement.className = 'alert alert-info mt-3';
    statusElement.style.display = 'block';

    const result = await apiRequest(`/wallet/invoice/${paymentHash}`);

    if (result.paid) {
      statusElement.textContent =
        'Payment confirmed! Your balance has been updated.';
      statusElement.className = 'alert alert-success mt-3';
      updateBalance();
    } else {
      statusElement.textContent =
        'Payment not detected yet. Please try again in a few moments.';
      statusElement.className = 'alert alert-warning mt-3';
    }
  } catch (error) {
    statusElement.textContent = 'Error checking payment: ' + error.message;
    statusElement.className = 'alert alert-danger mt-3';
  }
});

// Initiate M-Pesa STK Push
document.getElementById('mpesa-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const phoneNumber = document.getElementById('mpesa-phone').value;
  const amount = document.getElementById('mpesa-amount').value;

  try {
    const result = await apiRequest('/payments/mpesa/stk-push', 'POST', {
      phoneNumber,
      amount: parseInt(amount),
    });

    document.getElementById('transaction-id').textContent =
      result.transactionId;
    document.getElementById('mpesa-result').style.display = 'block';
    document.getElementById('mpesa-status').style.display = 'none';
  } catch (error) {
    alert('Failed to initiate M-Pesa payment: ' + error.message);
  }
});

// Check M-Pesa payment status
document.getElementById('check-mpesa').addEventListener('click', async () => {
  const transactionId = document.getElementById('transaction-id').textContent;
  const statusElement = document.getElementById('mpesa-status');

  try {
    statusElement.innerHTML =
      '<span class="loading"></span> Checking payment status...';
    statusElement.className = 'alert alert-info mt-3';
    statusElement.style.display = 'block';

    const result = await apiRequest(`/payments/status/${transactionId}`);

    if (result.status === 'completed') {
      statusElement.textContent =
        'Payment completed! Your balance has been updated.';
      statusElement.className = 'alert alert-success mt-3';
      updateBalance();
    } else if (result.status === 'failed') {
      statusElement.textContent =
        'Payment failed: ' + (result.resultDesc || 'Unknown error');
      statusElement.className = 'alert alert-danger mt-3';
    } else {
      statusElement.textContent =
        'Payment is still pending. Please check your phone and complete the payment.';
      statusElement.className = 'alert alert-warning mt-3';
    }
  } catch (error) {
    statusElement.textContent = 'Error checking payment: ' + error.message;
    statusElement.className = 'alert alert-danger mt-3';
  }
});

// Load transaction history
async function loadTransactions() {
  const tableBody = document.getElementById('transactions-table');

  try {
    tableBody.innerHTML =
      '<tr><td colspan="4" class="text-center"><span class="loading"></span> Loading transactions...</td></tr>';

    const result = await apiRequest('/wallet/transactions');

    if (result.transactions && result.transactions.length > 0) {
      tableBody.innerHTML = '';

      result.transactions.forEach((tx) => {
        const row = document.createElement('tr');

        // Format date
        const date =
          tx.timestamp && tx.timestamp.toDate
            ? new Date(tx.timestamp.toDate())
            : new Date(tx.timestamp);

        const dateStr = date.toLocaleString();

        row.innerHTML = `
                    <td>${dateStr}</td>
                    <td>${tx.type}</td>
                    <td>${tx.amount} sats</td>
                    <td>${tx.description || '-'}</td>
                `;

        tableBody.appendChild(row);
      });
    } else {
      tableBody.innerHTML =
        '<tr><td colspan="4" class="text-center">No transactions found</td></tr>';
    }
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading transactions: ${error.message}</td></tr>`;
  }
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  token = '';
  currentUser = null;
  showSection('login');
}

// Add logout button to dashboard
const dashboardHeader = document.querySelector(
  '#dashboard-section .card-header'
);
const logoutButton = document.createElement('button');
logoutButton.className = 'btn btn-sm btn-outline-danger';
logoutButton.textContent = 'Logout';
logoutButton.addEventListener('click', logout);
dashboardHeader.appendChild(logoutButton);

// Initialize the app
checkAuth();
