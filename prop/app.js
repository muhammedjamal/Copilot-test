const form = document.querySelector('#calculator-form');
const resultsBody = document.querySelector('#results-body');
const formMessage = document.querySelector('#form-message');
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function formatCurrency(value) {
  return currency.format(Math.round(value));
}

function formatPercentage(value) {
  return `${value.toFixed(2)}%`;
}

function formatSquareFeet(value) {
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value)} sq ft`;
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach((error) => { error.textContent = ''; });
  document.querySelectorAll('.field.invalid').forEach((field) => field.classList.remove('invalid'));
  formMessage.textContent = '';
}

function showError(fieldId, message) {
  const field = document.querySelector(`#${fieldId}`).closest('.field');
  field.classList.add('invalid');
  document.querySelector(`[data-error-for="${fieldId}"]`).textContent = message;
}

function renderResults(result) {
  document.querySelector('#total-value').textContent = formatCurrency(result.totalValue);
  document.querySelector('#land-total').textContent = formatCurrency(result.landValue);
  document.querySelector('#building-total').textContent = formatCurrency(result.buildingValue);
  document.querySelector('#land-amount-per-square-foot').textContent = formatCurrency(result.landAmountPerSquareFoot);
  document.querySelector('#building-amount-per-square-foot').textContent = formatCurrency(result.buildingAmountPerSquareFoot);
  resultsBody.innerHTML = result.totalShares.map((share, index) => `
    <tr>
      <th scope="row"><span class="owner-badge">${index + 1}</span>Owner ${index + 1}</th>
      <td><strong>L: ${formatSquareFeet(result.landSquareFeetShares[index])}</strong><small>B: ${formatSquareFeet(result.buildingSquareFeetShares[index])}</small></td>
      <td><strong>${formatCurrency(result.landShares[index])}</strong><small>${formatPercentage(result.landPercentages[index])}</small></td>
      <td><strong>${formatCurrency(result.buildingShares[index])}</strong><small>${formatPercentage(result.buildingPercentages[index])}</small></td>
      <td class="share-total">${formatCurrency(share)}</td>
    </tr>`).join('');
}

function calculate() {
  clearErrors();
  const data = new FormData(form);
  const values = Object.fromEntries(data.entries());

  try {
    const result = PropertyCalculations.calculatePropertySplit(values);
    renderResults(result);
  } catch (error) {
    formMessage.textContent = error.message;
    if (error.message.includes('amount')) {
      showError(values.landValue && !values.buildingValue ? 'land-value' : 'building-value', error.message);
    } else if (error.message.includes('square feet')) {
      showError('square-feet', error.message);
    } else if (error.message.includes('Owner')) {
      showError('owner-count', error.message);
    } else if (error.message.includes('ratio')) {
      showError('land-ratio', error.message);
      showError('building-ratio', error.message);
    }
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  calculate();
});

calculate();