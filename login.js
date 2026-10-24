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
const resendVerification = document.getElementById('resend-verification');
const requestPasswordReset = document.getElementById('request-password-reset');

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
    if (passwordInput.value.length < 12) {
      showError('Use a password at least 12 characters long.');
      return;
    }
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
  resendVerification?.classList.add('hidden');
  form.reset();
}

modeToggle?.addEventListener('click', toggleAuthMode);

resendVerification?.addEventListener('click', async () => {
  resendVerification.disabled = true;
  try {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.value.trim() })
    });
    const data = await response.json().catch(() => ({}));
    const message = data.verification_url
      ? `Verification link: ${data.verification_url}`
      : 'If the account needs verification, a new email has been sent.';
    showError(message, true);
  } catch {
    showError('Could not resend the email. Please try again.');
  } finally {
    resendVerification.disabled = false;
  }
});

requestPasswordReset?.addEventListener('click', async () => {
  if (!emailInput.value.trim()) {
    showError('Enter your email address first.');
    emailInput.focus();
    return;
  }
  requestPasswordReset.disabled = true;
  try {
    const response = await fetch('/api/auth/password-reset/request', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.value.trim() })
    });
    const data = await response.json().catch(() => ({}));
    showError(data.reset_url ? `Reset link: ${data.reset_url}` : data.detail || 'If the account exists, a reset email will be sent.', true);
  } catch {
    showError('Could not request a password reset. Please try again.');
  } finally {
    requestPasswordReset.disabled = false;
  }
});

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
      const detail = Array.isArray(data.detail)
        ? data.detail.map((issue) => issue.msg).join(' ')
        : data.detail;
      throw new Error(detail || 'Request failed');
    }

    if (isRegistering) {
      // Verification must complete before the account can sign in.
      toggleAuthMode(); // Switch back to login mode
      const message = data.verification_url
        ? `Account created. Verify your email to continue: ${data.verification_url}`
        : 'Account created. Check your email and follow the verification link before signing in.';
      showError(message, true);
      setTimeout(clearError, 3000);
    } else {
      // Login successful - redirect to dashboard
      window.location.href = '/dashboard';
    }
  } catch (error) {
    showError(error.message || 'Unable to complete request. Please try again.');
    if (!isRegistering && error.status === 403) resendVerification?.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
  }
});

// Password visibility toggle
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');

togglePasswordBtn?.addEventListener('click', () => {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  eyeIcon.style.display = type === 'password' ? 'block' : 'none';
  eyeOffIcon.style.display = type === 'password' ? 'none' : 'block';
  togglePasswordBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
});
