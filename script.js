// Load existing expenses from local storage
document.addEventListener('DOMContentLoaded', () => {
    loadExpenses();
    loadBudget();
});

// Form submission handler
document.getElementById('expense-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    
    if (description && amount && date && category) {
        const expense = {
            description,
            amount,
            date,
            category
        };
        
        addExpense(expense);
        this.reset(); // Clear the form
    }
});

// Add expense to the list and local storage
function addExpense(expense) {
    let expenses = getExpensesFromStorage();
    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    displayExpenses(expenses);
}

// Get expenses from local storage
function getExpensesFromStorage() {
    const expenses = localStorage.getItem('expenses');
    return expenses ? JSON.parse(expenses) : [];
}

// Display expenses with sorting and filtering
function displayExpenses(expenses, sortBy = 'date') {
    const expenseList = document.getElementById('expense-list');
    expenseList.innerHTML = '';
    
    // Sort expenses
    expenses.sort((a, b) => {
        if (sortBy === 'amount') {
            return b.amount - a.amount;
        } else if (sortBy === 'category') {
            return a.category.localeCompare(b.category);
        } else {
            return new Date(b.date) - new Date(a.date);
        }
    });
    
    expenses.forEach((expense, index) => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        expenseItem.innerHTML = `
            <span>${expense.description} -  ₹${expense.amount} (${expense.category})</span>
            <button onclick="deleteExpense(${index})">Delete</button>
        `;
        expenseList.appendChild(expenseItem);
    });
    
    updateSummary(expenses);
}

// Delete an expense
function deleteExpense(index) {
    let expenses = getExpensesFromStorage();
    expenses.splice(index, 1);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    displayExpenses(expenses);
}

// Load expenses on page load
function loadExpenses() {
    const expenses = getExpensesFromStorage();
    const sortOption = document.getElementById('sort-options').value;
    displayExpenses(expenses, sortOption);
}

// Event listener for sorting
document.getElementById('sort-options').addEventListener('change', function() {
    const sortOption = this.value;
    const expenses = getExpensesFromStorage();
    displayExpenses(expenses, sortOption);
});

// Event listener for filters
document.getElementById('apply-filters').addEventListener('click', function() {
    const fromDate = document.getElementById('filter-date-from').value;
    const toDate = document.getElementById('filter-date-to').value;
    const minAmount = parseFloat(document.getElementById('filter-min-amount').value) || 0;
    const maxAmount = parseFloat(document.getElementById('filter-max-amount').value) || Infinity;
    
    let expenses = getExpensesFromStorage();
    
    expenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return (
            (!fromDate || expenseDate >= new Date(fromDate)) &&
            (!toDate || expenseDate <= new Date(toDate)) &&
            expense.amount >= minAmount &&
            expense.amount <= maxAmount
        );
    });
    
    displayExpenses(expenses);
});

// Event listener for setting budget
document.getElementById('set-budget').addEventListener('click', function() {
    const budget = parseFloat(document.getElementById('budget').value);
    if (!isNaN(budget)) {
        localStorage.setItem('budget', budget);
        updateBudgetSummary();
    }
});

// Update budget summary
function updateBudgetSummary() {
    const budget = parseFloat(localStorage.getItem('budget')) || 0;
    const expenses = getExpensesFromStorage();
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const budgetSummary = document.getElementById('budget-summary');
    
    budgetSummary.innerHTML = `
        <h2>Budget: ₹${budget.toFixed(2)}</h2>
        <h3>Total Spent: ₹${totalSpent.toFixed(2)}</h3>
        <h3>Remaining: ₹${(budget - totalSpent).toFixed(2)}</h3>
    `;
}

// Update budget summary on page load
function loadBudget() {
    updateBudgetSummary();
}

// Export expenses as CSV
document.getElementById('export-csv').addEventListener('click', function() {
    const expenses = getExpensesFromStorage();
    let csvContent = "data:text/csv;charset=utf-8,Description,Amount,Date,Category\n";
    
    expenses.forEach(expense => {
        csvContent += `${expense.description},${expense.amount},${expense.date},${expense.category}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'expenses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Update chart
function updateChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    const expenses = getExpensesFromStorage();
    
    const categories = {};
    expenses.forEach(expense => {
        if (!categories[expense.category]) {
            categories[expense.category] = 0;
        }
        categories[expense.category] += expense.amount;
    });
    
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    
    if (window.expenseChart) {
        window.expenseChart.data.labels = labels;
        window.expenseChart.data.datasets[0].data = data;
        window.expenseChart.update();
    } else {
        window.expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Expenses by Category',
                    data: data,
                    backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                return `${tooltipItem.label}: ₹${tooltipItem.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Update chart on page load
updateChart();

// Update chart on expense addition
document.getElementById('expense-form').addEventListener('submit', function() {
    setTimeout(updateChart, 0); // Ensure chart updates after expense is added
});

// Update chart on filters or sorting
document.getElementById('apply-filters').addEventListener('click', updateChart);
document.getElementById('sort-options').addEventListener('change', updateChart);
