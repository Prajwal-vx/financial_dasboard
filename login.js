'use strict';

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const nameInput = document.getElementById('name');
const nameField = document.getElementById('name-field');
const errorBox = document.getElementById('auth-error');
const heading = document.getElementById('auth-heading');
const lead = document.getElementById('auth-lead');
const submitBtn = document.getElementById('auth-submit');
const modeToggle = document.getElementById('auth-mode-toggle');

let isRegistering = false;

function showError(message, isSuccess = false) {
  errorBox.textContent = message;
  errorBox.classList.add('visible');
  if (isSuccess) {
    errorBox.style.background = 'rgba(27, 128, 61, 0.5)';
    errorBox.style.borderColor = 'rgba(34, 197, 94, 0.5)';
    errorBox.style.color = '#fff';
  } else {
    errorBox.style.background = 'var(--error-bg)';
    errorBox.style.borderColor = 'rgba(255, 174, 174, 0.35)';
    errorBox.style.color = '#fff1f1';
  }
}

function clearError() {
  errorBox.textContent = '';
  errorBox.classList.remove('visible');
  errorBox.style.background = '';
  errorBox.style.borderColor = '';
  errorBox.style.color = '';
}

function toggleAuthMode() {
  isRegistering = !isRegistering;
  
  if (isRegistering) {
    // Switch to register mode
    nameField.classList.remove('hidden');
    nameInput.required = true;
    passwordInput.autocomplete = 'new-password';
    heading.textContent = 'Create your account';
    lead.textContent = 'Start with an empty, private ledger. You can add accounts and transactions next.';
    submitBtn.textContent = 'Create account';
    modeToggle.textContent = 'Already have an account? Sign in';
  } else {
    // Switch to login mode
    nameField.classList.add('hidden');
    nameInput.required = false;
    passwordInput.autocomplete = 'current-password';
    heading.textContent = 'Sign in to your Dashboard';
    lead.textContent = 'Your financial records are stored in your own account.';
    submitBtn.textContent = 'Sign in';
    modeToggle.textContent = 'Create a new account';
  }
  
  clearError();
  form.reset();
}

modeToggle?.addEventListener('click', toggleAuthMode);

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();
  
  const payload = {
    email: emailInput.value.trim(),
    password: passwordInput.value
  };
  
  if (isRegistering) {
    payload.name = nameInput.value.trim();
  }

  submitBtn.disabled = true;

  try {
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.detail || 'Request failed');
    }

    if (isRegistering) {
      // Registration successful - show success and switch to login
      showError('Account created successfully! Please sign in with your credentials.', true);
      toggleAuthMode(); // Switch back to login mode
      setTimeout(clearError, 3000);
    } else {
      // Login successful - redirect to dashboard
      window.location.href = '/dashboard';
    }
  } catch (error) {
    showError(error.message || 'Unable to complete request. Please try again.');
  } finally {
    submitBtn.disabled = false;
  }
});
