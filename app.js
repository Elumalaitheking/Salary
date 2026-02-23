const APP_VERSION = 'v1.2.0';
const STORAGE_KEY = 'salary-expense-manager-v2';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const defaultExpenses = [
  { name: 'House Rent', monthlyAmount: 18000, applyMode: 'all', monthsPayable: 12, customMonths: [], type: 'Regular', notes: '' },
  { name: 'Loan EMI', monthlyAmount: 8000, applyMode: 'custom', monthsPayable: 12, customMonths: [1,2,3,4,5,6,7,8,9,10,11,12], type: 'Loan/EMI', notes: '' },
  { name: 'Groceries', monthlyAmount: 7000, applyMode: 'all', monthsPayable: 12, customMonths: [], type: 'Regular', notes: '' },
  { name: 'Electricity', monthlyAmount: 2500, applyMode: 'all', monthsPayable: 12, customMonths: [], type: 'Utility', notes: '' },
  { name: 'Water', monthlyAmount: 700, applyMode: 'all', monthsPayable: 12, customMonths: [], type: 'Utility', notes: '' },
  { name: 'Internet', monthlyAmount: 1200, applyMode: 'all', monthsPayable: 12, customMonths: [], type: 'Utility', notes: '' },
  { name: 'Mobile Bill', monthlyAmount: 900, applyMode: 'all', monthsPayable: 12, customMonths: [], type: 'Utility', notes: '' },
  { name: 'Transport', monthlyAmount: 3500, applyMode: 'all', monthsPayable: 12, customMonths: [], type: 'Regular', notes: '' },
  { name: 'Insurance', monthlyAmount: 4000, applyMode: 'fixed', monthsPayable: 12, customMonths: [], type: 'Regular', notes: '' },
  { name: 'Entertainment', monthlyAmount: 2500, applyMode: 'all', monthsPayable: 12, customMonths: [], type: 'Optional', notes: '' }
];

const state = {
  view: 'monthly',
  selectedMonth: 1,
  monthlySalaries: Array(12).fill(0),
  plannedSavings: 0,
  actualSavings: 0,
  expenses: structuredClone(defaultExpenses)
};

const dom = {
  viewToggle: document.getElementById('viewToggle'),
  selectedMonth: document.getElementById('selectedMonth'),
  salaryInput: document.getElementById('salaryInput'),
  salaryError: document.getElementById('salaryError'),
  monthlySalaryDisplay: document.getElementById('monthlySalaryDisplay'),
  yearlySalaryDisplay: document.getElementById('yearlySalaryDisplay'),
  plannedSavings: document.getElementById('plannedSavings'),
  actualSavings: document.getElementById('actualSavings'),
  plannedYearlyDisplay: document.getElementById('plannedYearlyDisplay'),
  actualYearlyDisplay: document.getElementById('actualYearlyDisplay'),
  selectedMonthExpense: document.getElementById('selectedMonthExpense'),
  selectedMonthBalance: document.getElementById('selectedMonthBalance'),
  selectedMonthName: document.getElementById('selectedMonthName'),
  expenseTableBody: document.getElementById('expenseTableBody'),
  expenseError: document.getElementById('expenseError'),
  totalSalary: document.getElementById('totalSalary'),
  totalExpenses: document.getElementById('totalExpenses'),
  netBalance: document.getElementById('netBalance'),
  overspendAlert: document.getElementById('overspendAlert'),
  saveMessage: document.getElementById('saveMessage'),
  addExpenseBtn: document.getElementById('addExpenseBtn'),
  saveDataBtn: document.getElementById('saveDataBtn'),
  resetDataBtn: document.getElementById('resetDataBtn'),
  exportExcelBtn: document.getElementById('exportExcelBtn'),
  exportPdfBtn: document.getElementById('exportPdfBtn'),
  appVersionLabel: document.getElementById('appVersionLabel')
};

let pieChart;
let trendChart;

const toCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number.isFinite(amount) ? amount : 0);

function parseMonthList(value) {
  if (!value.trim()) return [];
  return [...new Set(value.split(',').map((i) => Number(i.trim())).filter((n) => Number.isInteger(n) && n >= 1 && n <= 12))].sort((a, b) => a - b);
}

function monthIncluded(expense, month) {
  if (expense.applyMode === 'all') return true;
  if (expense.applyMode === 'fixed') return month <= expense.monthsPayable;
  return expense.customMonths.includes(month);
}

function getMonthExpense(month) {
  return state.expenses.reduce((sum, exp) => sum + (monthIncluded(exp, month) ? exp.monthlyAmount : 0), 0);
}

function getYearlySalary() {
  return state.monthlySalaries.reduce((a, b) => a + b, 0);
}

function getTotals() {
  const yearlySalary = getYearlySalary();
  const monthlySalary = state.monthlySalaries[state.selectedMonth - 1] || 0;
  const totalYearlyExpenses = Array.from({ length: 12 }, (_, i) => getMonthExpense(i + 1)).reduce((a, b) => a + b, 0);
  const selectedMonthExpense = getMonthExpense(state.selectedMonth);

  const totalCredited = state.view === 'monthly' ? monthlySalary : yearlySalary;
  const expensesForView = state.view === 'monthly' ? selectedMonthExpense : totalYearlyExpenses;

  return {
    monthlySalary,
    yearlySalary,
    selectedMonthExpense,
    totalYearlyExpenses,
    totalCredited,
    expensesForView,
    net: totalCredited - expensesForView
  };
}

function createMonthOptions() {
  dom.selectedMonth.innerHTML = MONTHS.map((month, idx) => `<option value="${idx + 1}">${month}</option>`).join('');
}

function renderExpenseTable() {
  dom.expenseTableBody.innerHTML = '';

  state.expenses.forEach((expense, index) => {
    const salaryRef = state.monthlySalaries[state.selectedMonth - 1] || 0;
    const percent = salaryRef > 0 ? ((expense.monthlyAmount / salaryRef) * 100).toFixed(1) : '0.0';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input data-field="name" data-index="${index}" value="${expense.name}" /></td>
      <td><input data-field="monthlyAmount" data-index="${index}" type="number" min="0" step="0.01" value="${expense.monthlyAmount}" /></td>
      <td>
        <select data-field="applyMode" data-index="${index}">
          <option value="all" ${expense.applyMode === 'all' ? 'selected' : ''}>All 12 months</option>
          <option value="fixed" ${expense.applyMode === 'fixed' ? 'selected' : ''}>Fixed month count</option>
          <option value="custom" ${expense.applyMode === 'custom' ? 'selected' : ''}>Custom month list</option>
        </select>
      </td>
      <td><input data-field="monthsPayable" data-index="${index}" type="number" min="1" max="12" value="${expense.monthsPayable}" ${expense.applyMode === 'fixed' ? '' : 'disabled'} /></td>
      <td><input data-field="customMonths" data-index="${index}" placeholder="1,2,3" value="${expense.customMonths.join(',')}" ${expense.applyMode === 'custom' ? '' : 'disabled'} /></td>
      <td>
        <select data-field="type" data-index="${index}">
          <option value="Regular" ${expense.type === 'Regular' ? 'selected' : ''}>Regular</option>
          <option value="Loan/EMI" ${expense.type === 'Loan/EMI' ? 'selected' : ''}>Loan/EMI</option>
          <option value="Utility" ${expense.type === 'Utility' ? 'selected' : ''}>Utility</option>
          <option value="Optional" ${expense.type === 'Optional' ? 'selected' : ''}>Optional</option>
        </select>
      </td>
      <td><input data-field="notes" data-index="${index}" value="${expense.notes || ''}" placeholder="Notes" /></td>
      <td>${percent}%</td>
      <td><button class="btn danger" data-remove="${index}">Remove</button></td>
    `;
    dom.expenseTableBody.appendChild(row);
  });
}

function updateSalaryFromInput() {
  dom.salaryError.textContent = '';
  const value = Number(dom.salaryInput.value);

  if (!Number.isFinite(value) || value < 0) {
    dom.salaryError.textContent = 'Please enter a valid non-negative salary amount.';
    return;
  }

  if (state.view === 'monthly') {
    state.monthlySalaries[state.selectedMonth - 1] = value;
  } else {
    const split = value / 12;
    state.monthlySalaries = state.monthlySalaries.map(() => split);
  }

  refresh();
  autoSave();
}

function updateSavings() {
  const planned = Number(dom.plannedSavings.value);
  const actual = Number(dom.actualSavings.value);

  state.plannedSavings = Number.isFinite(planned) && planned >= 0 ? planned : 0;
  state.actualSavings = Number.isFinite(actual) && actual >= 0 ? actual : 0;

  dom.plannedYearlyDisplay.textContent = toCurrency(state.plannedSavings * 12);
  dom.actualYearlyDisplay.textContent = toCurrency(state.actualSavings * 12);
}

function updateSummaryAndAlerts() {
  const totals = getTotals();
  dom.monthlySalaryDisplay.textContent = toCurrency(totals.monthlySalary);
  dom.yearlySalaryDisplay.textContent = toCurrency(totals.yearlySalary);
  dom.totalSalary.textContent = toCurrency(totals.totalCredited);
  dom.totalExpenses.textContent = toCurrency(totals.expensesForView);
  dom.netBalance.textContent = toCurrency(totals.net);
  dom.netBalance.style.color = totals.net < 0 ? '#d43d4f' : '#00a488';

  dom.selectedMonthExpense.textContent = toCurrency(totals.selectedMonthExpense);
  dom.selectedMonthBalance.textContent = toCurrency(totals.monthlySalary - totals.selectedMonthExpense);
  dom.selectedMonthName.textContent = MONTHS[state.selectedMonth - 1];

  dom.overspendAlert.classList.toggle('hidden', totals.net >= 0);
}

function updateCharts() {
  const yearlyExpenseByCategory = state.expenses.map((exp) => Array.from({ length: 12 }, (_, i) => (monthIncluded(exp, i + 1) ? exp.monthlyAmount : 0)).reduce((a, b) => a + b, 0));

  pieChart.data.labels = state.expenses.map((exp) => exp.name);
  pieChart.data.datasets[0].data = state.view === 'monthly'
    ? state.expenses.map((exp) => (monthIncluded(exp, state.selectedMonth) ? exp.monthlyAmount : 0))
    : yearlyExpenseByCategory;
  pieChart.update();

  trendChart.data.datasets[0].data = [...state.monthlySalaries];
  trendChart.data.datasets[1].data = Array.from({ length: 12 }, (_, i) => getMonthExpense(i + 1));
  trendChart.update();
}

function refresh() {
  const totals = getTotals();
  dom.salaryInput.value = state.view === 'monthly' ? state.monthlySalaries[state.selectedMonth - 1] : totals.yearlySalary;
  dom.selectedMonth.value = String(state.selectedMonth);
  renderExpenseTable();
  updateSavings();
  updateSummaryAndAlerts();
  updateCharts();
}

function saveState(message = 'Data saved locally in this browser.') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  dom.saveMessage.textContent = message;
}

function autoSave() {
  saveState('Auto-saved.');
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state.view = parsed.view || 'monthly';
    state.selectedMonth = Math.min(12, Math.max(1, Number(parsed.selectedMonth) || 1));
    state.monthlySalaries = Array.isArray(parsed.monthlySalaries) && parsed.monthlySalaries.length === 12
      ? parsed.monthlySalaries.map((n) => Number(n) || 0)
      : Array(12).fill(0);
    state.plannedSavings = Number(parsed.plannedSavings) || 0;
    state.actualSavings = Number(parsed.actualSavings) || 0;
    state.expenses = Array.isArray(parsed.expenses) ? parsed.expenses : structuredClone(defaultExpenses);
    dom.saveMessage.textContent = 'Loaded saved data from browser storage.';
  } catch {
    dom.saveMessage.textContent = 'Saved data was invalid and ignored.';
  }
}

function createCharts() {
  pieChart = new Chart(document.getElementById('expensePie'), {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: ['#3659ff', '#54c7ec', '#37d67a', '#f6c343', '#ff7d7d', '#9b6bff', '#00a488', '#6f89ff', '#f39c6b', '#ff5ca8', '#66c2a5', '#ffcc00'] }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  });

  trendChart = new Chart(document.getElementById('salaryExpenseTrend'), {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        { label: 'Salary', data: [], backgroundColor: '#3659ff' },
        { label: 'Expenses', data: [], backgroundColor: '#ff7d7d' }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

function bindEvents() {
  dom.viewToggle.addEventListener('change', (event) => {
    state.view = event.target.value;
    refresh();
    autoSave();
  });

  dom.selectedMonth.addEventListener('change', (event) => {
    state.selectedMonth = Number(event.target.value);
    refresh();
    autoSave();
  });

  dom.salaryInput.addEventListener('input', updateSalaryFromInput);

  dom.plannedSavings.addEventListener('input', () => {
    updateSavings();
    autoSave();
  });

  dom.actualSavings.addEventListener('input', () => {
    updateSavings();
    autoSave();
  });

  dom.addExpenseBtn.addEventListener('click', () => {
    state.expenses.push({ name: 'New Expense', monthlyAmount: 0, applyMode: 'all', monthsPayable: 12, customMonths: [], type: 'Regular', notes: '' });
    refresh();
    autoSave();
  });

  dom.expenseTableBody.addEventListener('input', (event) => {
    const target = event.target;
    const index = Number(target.dataset.index);
    const field = target.dataset.field;
    if (!Number.isInteger(index) || !state.expenses[index]) return;

    const expense = state.expenses[index];

    if (field === 'monthlyAmount' || field === 'monthsPayable') {
      const numeric = Number(target.value);
      if (!Number.isFinite(numeric) || numeric < 0 || (field === 'monthsPayable' && (numeric < 1 || numeric > 12))) {
        dom.expenseError.textContent = 'Monthly amount must be non-negative and months count must be between 1 and 12.';
        return;
      }
      dom.expenseError.textContent = '';
      expense[field] = numeric;
    } else if (field === 'customMonths') {
      expense.customMonths = parseMonthList(target.value);
    } else if (field === 'applyMode' || field === 'type') {
      expense[field] = target.value;
    } else if (field === 'name' || field === 'notes') {
      expense[field] = target.value;
    }

    refresh();
    autoSave();
  });

  dom.expenseTableBody.addEventListener('click', (event) => {
    const removeIndex = event.target.dataset.remove;
    if (removeIndex === undefined) return;
    state.expenses.splice(Number(removeIndex), 1);
    refresh();
    autoSave();
  });

  dom.saveDataBtn.addEventListener('click', () => saveState());
  dom.resetDataBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
  dom.exportExcelBtn.addEventListener('click', exportExcel);
  dom.exportPdfBtn.addEventListener('click', exportPdf);
}

function exportExcel() {
  const totals = getTotals();
  const rows = state.expenses.map((exp) => ({
    'Expense Name': exp.name,
    Type: exp.type,
    'Monthly Amount': exp.monthlyAmount,
    'Apply Mode': exp.applyMode,
    'Months Count': exp.monthsPayable,
    'Custom Months': exp.customMonths.join(','),
    Notes: exp.notes,
    'Yearly Amount': Array.from({ length: 12 }, (_, i) => (monthIncluded(exp, i + 1) ? exp.monthlyAmount : 0)).reduce((a, b) => a + b, 0)
  }));

  rows.push({}, { 'Expense Name': 'App Version', 'Yearly Amount': APP_VERSION }, { 'Expense Name': 'Yearly Salary', 'Yearly Amount': totals.yearlySalary }, { 'Expense Name': 'Total Yearly Expenses', 'Yearly Amount': totals.totalYearlyExpenses }, { 'Expense Name': 'Net Yearly Balance', 'Yearly Amount': totals.yearlySalary - totals.totalYearlyExpenses });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  XLSX.writeFile(wb, 'salary-expense-summary.xlsx');
}

function exportPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const totals = getTotals();

  doc.setFontSize(16);
  doc.text('Salary & Expense Summary', 14, 18);
  doc.setFontSize(11);
  doc.text(`App Version: ${APP_VERSION}`, 14, 24);
  doc.text(`Selected Month: ${MONTHS[state.selectedMonth - 1]}`, 14, 30);
  doc.text(`Selected Month Salary: ${toCurrency(totals.monthlySalary)}`, 14, 38);
  doc.text(`Yearly Salary: ${toCurrency(totals.yearlySalary)}`, 14, 46);
  doc.text(`Yearly Expenses: ${toCurrency(totals.totalYearlyExpenses)}`, 14, 54);

  let y = 66;
  state.expenses.forEach((exp) => {
    const yearly = Array.from({ length: 12 }, (_, i) => (monthIncluded(exp, i + 1) ? exp.monthlyAmount : 0)).reduce((a, b) => a + b, 0);
    doc.text(`${exp.name} (${exp.type}): ${toCurrency(yearly)}`, 14, y);
    y += 7;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save('salary-expense-summary.pdf');
}

function init() {
  createMonthOptions();
  loadState();
  createCharts();
  bindEvents();

  dom.viewToggle.value = state.view;
  dom.appVersionLabel.textContent = `Version: ${APP_VERSION}`;
  dom.plannedSavings.value = state.plannedSavings;
  dom.actualSavings.value = state.actualSavings;

  refresh();
}

init();
