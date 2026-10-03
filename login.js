'use strict';

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorBox = document.getElementById('auth-error');

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add('visible');
}

function clearError() {
  errorBox.textContent = '';
  errorBox.classList.remove('visible');
}

document.getElementById('register-link')?.addEventListener('click', () => {
  window.location.href = '/dashboard?mode=register';
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();
  const payload = { email: emailInput.value.trim(), password: passwordInput.value };

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || 'Request failed');
    window.location.href = '/dashboard';
  } catch (error) {
    showError(error.message || 'Unable to sign in. Check your details and try again.');
  }
});
