const defaultExpenses = [
  { name: 'House Rent', monthlyAmount: 18000, monthsPayable: 12, isLoan: false, selectedMonths: [] },
  { name: 'Loan EMI', monthlyAmount: 8000, monthsPayable: 12, isLoan: true, selectedMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { name: 'Groceries', monthlyAmount: 7000, monthsPayable: 12, isLoan: false, selectedMonths: [] },
  { name: 'Electricity', monthlyAmount: 2500, monthsPayable: 12, isLoan: false, selectedMonths: [] },
  { name: 'Water', monthlyAmount: 700, monthsPayable: 12, isLoan: false, selectedMonths: [] },
  { name: 'Internet', monthlyAmount: 1200, monthsPayable: 12, isLoan: false, selectedMonths: [] },
  { name: 'Mobile Bill', monthlyAmount: 900, monthsPayable: 12, isLoan: false, selectedMonths: [] },
  { name: 'Transport', monthlyAmount: 3500, monthsPayable: 12, isLoan: false, selectedMonths: [] },
  { name: 'Insurance', monthlyAmount: 4000, monthsPayable: 12, isLoan: false, selectedMonths: [] },
  { name: 'Entertainment', monthlyAmount: 2500, monthsPayable: 12, isLoan: false, selectedMonths: [] }
];

const state = {
  view: 'monthly',
  monthlySalary: 0,
  yearlySalary: 0,
  plannedSavings: 0,
  actualSavings: 0,
  expenses: structuredClone(defaultExpenses)
};

const dom = {
  viewToggle: document.getElementById('viewToggle'),
  salaryInput: document.getElementById('salaryInput'),
  salaryError: document.getElementById('salaryError'),
  monthlySalaryDisplay: document.getElementById('monthlySalaryDisplay'),
  yearlySalaryDisplay: document.getElementById('yearlySalaryDisplay'),
  plannedSavings: document.getElementById('plannedSavings'),
  actualSavings: document.getElementById('actualSavings'),
  plannedYearlyDisplay: document.getElementById('plannedYearlyDisplay'),
  actualYearlyDisplay: document.getElementById('actualYearlyDisplay'),
  expenseTableBody: document.getElementById('expenseTableBody'),
  expenseError: document.getElementById('expenseError'),
  totalSalary: document.getElementById('totalSalary'),
  totalExpenses: document.getElementById('totalExpenses'),
  netBalance: document.getElementById('netBalance'),
  overspendAlert: document.getElementById('overspendAlert'),
  addExpenseBtn: document.getElementById('addExpenseBtn'),
  exportExcelBtn: document.getElementById('exportExcelBtn'),
  exportPdfBtn: document.getElementById('exportPdfBtn')
};

let pieChart;
let trendChart;

const toCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number.isFinite(amount) ? amount : 0);

function parseMonthList(value) {
  if (!value.trim()) return [];
  const parsed = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);

  return [...new Set(parsed)].sort((a, b) => a - b);
}

function calculateExpenseYearly(expense) {
  if (expense.isLoan && expense.selectedMonths.length > 0) {
    return expense.monthlyAmount * expense.selectedMonths.length;
  }
  return expense.monthlyAmount * expense.monthsPayable;
}

function getTotals() {
  const totalMonthlyExpenses = state.expenses.reduce((sum, exp) => {
    if (exp.isLoan && exp.selectedMonths.length > 0) {
      return sum + (exp.selectedMonths.includes(1) ? exp.monthlyAmount : 0);
    }
    return sum + exp.monthlyAmount;
  }, 0);

  const totalYearlyExpenses = state.expenses.reduce((sum, exp) => sum + calculateExpenseYearly(exp), 0);

  const totalCredited = state.view === 'monthly' ? state.monthlySalary : state.yearlySalary;
  const expensesForView = state.view === 'monthly' ? totalMonthlyExpenses : totalYearlyExpenses;

  return {
    totalMonthlyExpenses,
    totalYearlyExpenses,
    totalCredited,
    expensesForView,
    net: totalCredited - expensesForView
  };
}

function renderExpenseTable() {
  dom.expenseTableBody.innerHTML = '';
  dom.expensesValidationError = '';

  state.expenses.forEach((expense, index) => {
    const row = document.createElement('tr');
    const salaryRef = state.monthlySalary || 0;
    const percent = salaryRef > 0 ? ((expense.monthlyAmount / salaryRef) * 100).toFixed(1) : '0.0';

    row.innerHTML = `
      <td><input data-field="name" data-index="${index}" value="${expense.name}" /></td>
      <td><input data-field="monthlyAmount" data-index="${index}" type="number" min="0" step="0.01" value="${expense.monthlyAmount}" /></td>
      <td><input data-field="monthsPayable" data-index="${index}" type="number" min="1" max="12" value="${expense.monthsPayable}" ${expense.isLoan ? 'disabled' : ''} /></td>
      <td><input data-field="isLoan" data-index="${index}" type="checkbox" ${expense.isLoan ? 'checked' : ''} /></td>
      <td><input data-field="selectedMonths" data-index="${index}" placeholder="1,2,3" value="${expense.selectedMonths.join(',')}" ${!expense.isLoan ? 'disabled' : ''} /></td>
      <td>${percent}%</td>
      <td><button class="btn danger" data-remove="${index}">Remove</button></td>
    `;

    dom.expenseTableBody.appendChild(row);
  });
}

function updateSalaryFromInput() {
  const value = Number(dom.salaryInput.value);
  dom.salaryError.textContent = '';

  if (Number.isNaN(value) || value < 0) {
    dom.salaryError.textContent = 'Please enter a valid non-negative salary amount.';
    return;
  }

  if (state.view === 'monthly') {
    state.monthlySalary = value;
    state.yearlySalary = value * 12;
  } else {
    state.yearlySalary = value;
    state.monthlySalary = value / 12;
  }

  refresh();
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

  dom.monthlySalaryDisplay.textContent = toCurrency(state.monthlySalary);
  dom.yearlySalaryDisplay.textContent = toCurrency(state.yearlySalary);
  dom.totalSalary.textContent = toCurrency(totals.totalCredited);
  dom.totalExpenses.textContent = toCurrency(totals.expensesForView);
  dom.netBalance.textContent = toCurrency(totals.net);
  dom.netBalance.style.color = totals.net < 0 ? '#d43d4f' : '#00a488';

  if (totals.net < 0) {
    dom.overspendAlert.classList.remove('hidden');
  } else {
    dom.overspendAlert.classList.add('hidden');
  }
}

function updateCharts() {
  const labels = state.expenses.map((exp) => exp.name);
  const yearlyValues = state.expenses.map((exp) => calculateExpenseYearly(exp));
  const monthlyValues = state.expenses.map((exp) => exp.monthlyAmount);
  const totals = getTotals();

  pieChart.data.labels = labels;
  pieChart.data.datasets[0].data = state.view === 'monthly' ? monthlyValues : yearlyValues;
  pieChart.update();

  const monthlyExpenseEstimate = totals.totalYearlyExpenses / 12;

  trendChart.data.datasets[0].data = Array(12).fill(state.monthlySalary);
  trendChart.data.datasets[1].data = Array(12).fill(monthlyExpenseEstimate);
  trendChart.update();
}

function refresh() {
  renderExpenseTable();
  updateSavings();
  updateSummaryAndAlerts();
  updateCharts();
}

function createCharts() {
  pieChart = new Chart(document.getElementById('expensePie'), {
    type: 'pie',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: ['#3659ff', '#54c7ec', '#37d67a', '#f6c343', '#ff7d7d', '#9b6bff', '#00a488', '#6f89ff', '#f39c6b', '#ff5ca8', '#66c2a5', '#ffcc00']
      }]
    },
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
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function bindEvents() {
  dom.viewToggle.addEventListener('change', (event) => {
    state.view = event.target.value;
    dom.salaryInput.value = state.view === 'monthly' ? state.monthlySalary : state.yearlySalary;
    refresh();
  });

  dom.salaryInput.addEventListener('input', updateSalaryFromInput);
  dom.plannedSavings.addEventListener('input', () => {
    updateSavings();
  });
  dom.actualSavings.addEventListener('input', () => {
    updateSavings();
  });

  dom.addExpenseBtn.addEventListener('click', () => {
    state.expenses.push({
      name: 'New Expense',
      monthlyAmount: 0,
      monthsPayable: 12,
      isLoan: false,
      selectedMonths: []
    });
    refresh();
  });

  dom.expenseTableBody.addEventListener('input', (event) => {
    const target = event.target;
    const index = Number(target.dataset.index);
    const field = target.dataset.field;

    if (!Number.isInteger(index) || !state.expenses[index]) return;

    const current = state.expenses[index];

    if (field === 'monthlyAmount' || field === 'monthsPayable') {
      const numeric = Number(target.value);
      if (!Number.isFinite(numeric) || numeric < 0 || (field === 'monthsPayable' && (numeric < 1 || numeric > 12))) {
        dom.expenseError.textContent = 'Monthly amount must be non-negative and months payable must be between 1 and 12.';
        return;
      }
      dom.expenseError.textContent = '';
      current[field] = numeric;
    } else if (field === 'selectedMonths') {
      current.selectedMonths = parseMonthList(target.value);
    } else if (field === 'isLoan') {
      current.isLoan = target.checked;
      if (!current.isLoan) {
        current.selectedMonths = [];
      }
    } else if (field === 'name') {
      current.name = target.value.trim() || 'Unnamed Expense';
    }

    refresh();
  });

  dom.expenseTableBody.addEventListener('click', (event) => {
    const removeIndex = event.target.dataset.remove;
    if (removeIndex === undefined) return;

    state.expenses.splice(Number(removeIndex), 1);
    refresh();
  });

  dom.exportExcelBtn.addEventListener('click', exportExcel);
  dom.exportPdfBtn.addEventListener('click', exportPdf);
}

function exportExcel() {
  const totals = getTotals();
  const rows = state.expenses.map((exp) => ({
    'Expense Name': exp.name,
    'Monthly Amount': exp.monthlyAmount,
    'Months Payable': exp.isLoan ? exp.selectedMonths.join(',') || 0 : exp.monthsPayable,
    'Yearly Amount': calculateExpenseYearly(exp)
  }));

  rows.push(
    {},
    { 'Expense Name': 'Total Salary', 'Yearly Amount': state.yearlySalary },
    { 'Expense Name': 'Total Yearly Expenses', 'Yearly Amount': totals.totalYearlyExpenses },
    { 'Expense Name': 'Net Yearly Balance', 'Yearly Amount': state.yearlySalary - totals.totalYearlyExpenses }
  );

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
  doc.text(`Monthly Salary: ${toCurrency(state.monthlySalary)}`, 14, 30);
  doc.text(`Yearly Salary: ${toCurrency(state.yearlySalary)}`, 14, 38);
  doc.text(`Total Yearly Expenses: ${toCurrency(totals.totalYearlyExpenses)}`, 14, 46);
  doc.text(`Net Yearly Balance: ${toCurrency(state.yearlySalary - totals.totalYearlyExpenses)}`, 14, 54);

  let y = 66;
  doc.text('Expenses:', 14, y);
  y += 8;

  state.expenses.forEach((exp) => {
    doc.text(`${exp.name}: ${toCurrency(calculateExpenseYearly(exp))}`, 14, y);
    y += 7;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save('salary-expense-summary.pdf');
}

function init() {
  createCharts();
  bindEvents();
  dom.salaryInput.value = 0;
  refresh();
}

init();
