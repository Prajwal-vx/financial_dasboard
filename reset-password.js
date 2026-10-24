'use strict';

const form = document.getElementById('reset-form');
const message = document.getElementById('message');
const token = new URLSearchParams(window.location.search).get('token');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = document.getElementById('password').value;
  if (password.length < 12) {
    message.textContent = 'Use at least 12 characters.';
    return;
  }
  try {
    const response = await fetch('/api/auth/password-reset/confirm', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token || '', password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || 'Password reset failed.');
    form.hidden = true;
    message.textContent = data.detail;
  } catch (error) {
    message.textContent = error.message;
  }
});
