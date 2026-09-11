const form = document.querySelector('#checkout-form');
const submitButton = form.querySelector('button');
const status = document.querySelector('#payment-status');
const runId = new URLSearchParams(window.location.search).get('runId') ?? 'browser-demo';
const variant = globalThis.PAYDEMO_VARIANT ?? 'fixed-v2';

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (variant === 'fixed-v2') submitButton.disabled = true;
  status.textContent = 'Recording payment…';

  const paymentMethod = variant === 'buggy-v1' ? 'card' : form.elements['payment-method'].value;
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': `paydemo-${runId}` },
    body: JSON.stringify({ runId, planId: 'starter', amountCents: 1000, paymentMethod }),
  });

  if (!response.ok) {
    status.textContent = 'Payment could not be recorded.';
    if (variant === 'fixed-v2') submitButton.disabled = false;
    return;
  }

  const payment = await response.json();
  status.textContent = `Payment recorded by ${payment.paymentMethod === 'bank' ? 'bank transfer' : 'card'}.`;
});
