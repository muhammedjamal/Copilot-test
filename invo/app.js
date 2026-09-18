const defaultItems = [
  { description: 'Brand identity design', quantity: 1, rate: 1800 },
  { description: 'Website art direction', quantity: 1, rate: 950 },
  { description: 'Launch consultation', quantity: 2, rate: 175 }
];

const state = { items: structuredClone(defaultItems) };
const $ = (id) => document.getElementById(id);
const fields = ['invoiceNumber', 'issueDate', 'dueDate', 'currency', 'fromName', 'fromEmail', 'fromAddress', 'clientName', 'clientEmail', 'clientAddress', 'notes', 'taxRate', 'discountRate'];

function formatMoney(value) {
  const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  return `${symbols[$('currency').value] || '$'}${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value, fallback) {
  if (!value) return fallback;
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderItems() {
  $('itemRows').innerHTML = state.items.map((item, index) => `
    <div class="item-row" data-index="${index}">
      <input aria-label="Item description" class="item-description" type="text" value="${escapeHtml(item.description)}" placeholder="Service or product">
      <input aria-label="Quantity" class="item-quantity" type="number" min="0" step="1" value="${item.quantity}">
      <input aria-label="Rate" class="item-rate" type="number" min="0" step="0.01" value="${item.rate}">
      <span class="item-amount">${formatMoney(item.quantity * item.rate)}</span>
      <button class="remove-item" type="button" aria-label="Remove item">×</button>
    </div>`).join('');
  $('previewItems').innerHTML = state.items.length ? state.items.map((item) => `<div class="paper-item"><span>${escapeHtml(item.description || 'Untitled item')} <small>× ${item.quantity}</small></span><span>${formatMoney(item.quantity * item.rate)}</span></div>`).join('') : '<div class="paper-item"><span>No items added</span><span>$0.00</span></div>';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function updatePreview() {
  const subtotal = state.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0), 0);
  const taxRate = Math.max(0, Number($('taxRate').value) || 0);
  const discountRate = Math.max(0, Number($('discountRate').value) || 0);
  const tax = subtotal * taxRate / 100;
  const discount = subtotal * discountRate / 100;
  const total = subtotal + tax - discount;
  const text = (id, value, fallback) => { $(id).textContent = value || fallback; };

  text('previewFromName', $('fromName').value, 'Your business');
  text('previewClientName', $('clientName').value, 'Your client');
  text('previewClientEmail', $('clientEmail').value, 'client@company.com');
  text('previewClientAddress', $('clientAddress').value, 'Client address');
  text('previewInvoiceNumber', $('invoiceNumber').value, 'INV-000');
  text('previewIssueDate', formatDate($('issueDate').value, 'Issued today'));
  text('previewDueDate', formatDate($('dueDate').value, 'Due on receipt'));
  text('previewNotes', $('notes').value, 'Thank you for your business.');
  text('previewTaxRate', taxRate.toFixed(2).replace(/\.00$/, ''));
  text('previewSubtotal', formatMoney(subtotal));
  text('previewTax', formatMoney(tax));
  text('previewTotal', formatMoney(total));
  renderItems();
  localStorage.setItem('invo-draft', JSON.stringify({ fields: Object.fromEntries(fields.map((id) => [id, $(id).value])), items: state.items }));
  $('saveState').textContent = 'Draft saved locally';
}

function loadDraft() {
  const saved = localStorage.getItem('invo-draft');
  if (!saved) {
    const today = new Date();
    const due = new Date(today); due.setDate(today.getDate() + 14);
    $('issueDate').value = today.toISOString().slice(0, 10);
    $('dueDate').value = due.toISOString().slice(0, 10);
    return;
  }
  try {
    const draft = JSON.parse(saved);
    fields.forEach((id) => { if (draft.fields?.[id] !== undefined) $(id).value = draft.fields[id]; });
    if (Array.isArray(draft.items)) state.items = draft.items;
  } catch { localStorage.removeItem('invo-draft'); }
}

$('addItemButton').addEventListener('click', () => { state.items.push({ description: '', quantity: 1, rate: 0 }); updatePreview(); });
$('printButton').addEventListener('click', () => window.print());
$('resetButton').addEventListener('click', () => {
  if (!confirm('Start a new invoice? Your current draft will be cleared.')) return;
  localStorage.removeItem('invo-draft');
  window.location.reload();
});
$('itemsTable').addEventListener('input', (event) => {
  const row = event.target.closest('.item-row');
  if (!row) return;
  const item = state.items[Number(row.dataset.index)];
  if (event.target.classList.contains('item-description')) item.description = event.target.value;
  if (event.target.classList.contains('item-quantity')) item.quantity = Number(event.target.value) || 0;
  if (event.target.classList.contains('item-rate')) item.rate = Number(event.target.value) || 0;
  updatePreview();
});
$('itemsTable').addEventListener('click', (event) => {
  const button = event.target.closest('.remove-item');
  if (!button) return;
  state.items.splice(Number(button.closest('.item-row').dataset.index), 1);
  updatePreview();
});
fields.forEach((id) => $(id).addEventListener('input', updatePreview));
loadDraft();
updatePreview();
