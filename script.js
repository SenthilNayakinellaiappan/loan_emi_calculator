// Global variables to store chart instances
let loanChartInstance;
let balanceChartInstance;

// Element selectors
const loanAmount = document.getElementById("loan-amount");
const loanTenureYears = document.getElementById("loan-tenure-years");
const loanTenureMonths = document.getElementById("loan-tenure-months");
const loanRate = document.getElementById("loan-interest");
const loanEmi = document.getElementById("loanemi");
const loanPrinciple = document.getElementById("loanprinciple");
const loanTotal = document.getElementById("loantotal");
const loanInterest = document.getElementById("loaninterest");
const submitBtn = document.getElementById("calcbtn");
const error = document.querySelector(".error");
const result = document.querySelector(".result");
const screenshotBtn = document.getElementById("screenshotBtn");
const emiMethod = document.getElementById("emi-method"); // Make sure this element exists

// Event listener for calculate button
submitBtn.addEventListener("click", calculate);

// Calculate function to validate inputs and trigger EMI calculation
function calculate() {
    if (!validateInputs()) {
        displayError("Please Fill All The Fields");
        return;
    }

    if (hasNegativeValues()) {
        displayError("The fields should not have negative values");
        return;
    }

    // Check the EMI method and call the appropriate function
    if (emiMethod.value === 'reducing') {
        calculateEmiReducing();
    } else if (emiMethod.value === 'flat') {
        calculateEmiFlat();
    } else {
        displayError("Invalid EMI Method");
    }
}

// Validate if inputs are not empty
function validateInputs() {
    return loanAmount.value !== '' && loanTenureYears.value !== '' && loanTenureMonths.value !== '' && loanRate.value !== '';
}

// Check if any input has negative values
function hasNegativeValues() {
    return loanAmount.value <= 0 || loanTenureYears.value <= 0 || loanTenureMonths.value < 0 || loanRate.value <= 0;
}

// Display error message
function displayError(message) {
    error.style.display = "block";
    error.innerHTML = message;
    setTimeout(() => {
        error.style.display = "none";
    }, 2000);
}

// Calculate EMI for reducing balance method
function calculateEmiReducing() {
    const { amount, tenureYears, tenureMonths, totalMonths, rate } = getInputValues();

    const emi = calculateEmi(amount, rate, totalMonths);
    const emi_mod = Math.round(emi * 100.0) / 100.0;
    const total = emi_mod * totalMonths;
    const interest = total - amount;

    displayResults(amount, emi_mod, total, interest);

    generateTableReducing(amount, rate, totalMonths, emi_mod);
    generateCharts(amount, interest);
}

// Get input values and calculate necessary parameters
function getInputValues() {
    const amount = parseFloat(loanAmount.value);
    const tenureYears = parseFloat(loanTenureYears.value);
    const tenureMonths = parseFloat(loanTenureMonths.value);
    const totalMonths = (tenureYears * 12) + tenureMonths;
    const rate = parseFloat(loanRate.value) / 12 / 100;

    return { amount, tenureYears, tenureMonths, totalMonths, rate };
}

// Calculate EMI
function calculateEmi(amount, rate, totalMonths) {
    return (amount * rate) / (1 - Math.pow(1 + rate, -totalMonths));
}

// Display results
function displayResults(amount, emi, total, interest) {
    result.style.display = "block";
    document.querySelector(".container").style.height = "100%";
    loanEmi.innerHTML = Math.floor(emi);
    loanPrinciple.innerHTML = Math.floor(amount);
    loanTotal.innerHTML = Math.floor(total);
    loanInterest.innerHTML = Math.floor(interest);
}

// Generate EMI table for reducing balance method
function generateTableReducing(amount, rate, totalMonths, emi_mod) {
    const tableBody = document.querySelector("#emiTable tbody");
    tableBody.innerHTML = "";

    let p = amount;
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyBalances = [];

    for (let i = 0; i < totalMonths; i++) {
        const int_amt = p * rate;
        const pr = emi_mod - int_amt;
        //const due = p - pr;
        const due = (i === totalMonths - 1) ? 0 : p - pr; 

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${monthNames[currentMonth]}</td>
            <td>${currentYear}</td>
            <td>${Math.floor(p)}</td>
            <td>${Math.floor(emi_mod)}</td>
            <td>${Math.floor(int_amt)}</td>
            <td>${Math.floor(pr)}</td>
            <td>${Math.floor(due)}</td>
        `;
        tableBody.appendChild(row);

        monthlyBalances.push({
            month: monthNames[currentMonth],
            year: currentYear,
            balance: Math.floor(due)
        });

        p = due;

        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }
}

function generateCharts(amount, interest) {
    // Destroy existing chart instances if they exist
    if (loanChartInstance) {
        loanChartInstance.destroy();
    }
    if (balanceChartInstance) {
        balanceChartInstance.destroy();
    }

    // Generate pie chart
    loanChartInstance = new Chart(document.getElementById("loanChart"), {
        type: "pie",
        data: {
            labels: ["Principle", "Interest"],
            datasets: [{
                backgroundColor: ["#3598DB", "#d6f0fd"],
                data: [amount, interest]
            }]
        },
        options: {
            title: {
                display: false
            }
        }
    });

    // Generate bar chart
    const table = document.getElementById("emiTable");
    const rows = table.querySelectorAll("tbody tr");
    const barChartLabels = Array.from(rows).map(row => `${row.cells[0].innerText} ${row.cells[1].innerText}`);
    const barChartData = Array.from(rows).map(row => parseFloat(row.cells[6].innerText));
    console.log(barChartData);

    balanceChartInstance = new Chart(document.getElementById("balanceChart"), {
        type: "bar",
        data: {
            labels: barChartLabels,
            datasets: [{
                label: "Balance (Rs)",
                data: barChartData,
                backgroundColor: "#3598DB",
                borderColor: "#3598DB",
                borderWidth: 1
            },
            {
                type: 'line',
                label: 'Balance Reduction',
                data: barChartData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false,
                lineTension: 0
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Calculate EMI for flat rate method
function calculateEmiFlat() {
    const amount = parseFloat(loanAmount.value);
    const tenureYears = parseFloat(loanTenureYears.value);
    const tenureMonths = parseFloat(loanTenureMonths.value);
    const totalMonths = (tenureYears * 12) + tenureMonths;
    const rate = parseFloat(loanRate.value) / 100;

    const interestAmount = amount * rate * (totalMonths / 12);
    const totalAmount = amount + interestAmount;
    const emi = totalAmount / totalMonths;

    displayResults(amount, emi, totalAmount, interestAmount);

    generateTableFlat(amount, rate, totalMonths, emi);
    generateChartsFlat(); // Call the chart generation separately
}

// Generate EMI table for flat rate method
function generateTableFlat(amount, rate, totalMonths, emi) {
    const tableBody = document.querySelector("#emiTable tbody");
    tableBody.innerHTML = '';

    let balance = amount;
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyBalances = [];

    for (let i = 0; i < totalMonths; i++) {
        const interest = (amount * rate) / 12;
        const principle = emi - interest;
        //balance -= principle;
        balance = (i === totalMonths - 1) ? 0 : balance - principle;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${monthNames[currentMonth]}</td>
            <td>${currentYear}</td>
            <td>Rs. ${Math.floor(balance)}</td>
            <td>Rs. ${Math.floor(emi)}</td>
            <td>Rs. ${Math.floor(interest)}</td>
            <td>Rs. ${Math.floor(principle)}</td>
            <td>Rs. ${Math.floor(balance)}</td>
        `;
        tableBody.appendChild(row);

        monthlyBalances.push(balance.toFixed(2));

        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }
}

// Generate charts (bar and pie) for flat rate method
function generateChartsFlat() {
    // Destroy existing instances if they exist
    if (balanceChartInstance) {
        balanceChartInstance.destroy();
    }
    if (loanChartInstance) {
        loanChartInstance.destroy();
    }

    const table = document.getElementById("emiTable");
    const rows = table.querySelectorAll("tbody tr");

    // Bar chart data
    const barChartLabels = Array.from(rows).map(row => `${row.cells[0].innerText} ${row.cells[1].innerText}`);
    const barChartData = Array.from(rows).map(row => {
        const valueString = row.cells[2].innerText.replace('Rs. ', ''); // Extract balance value and remove 'Rs. '
        return parseFloat(valueString); // Parse the remaining string to float
    });

    // Pie chart data
    const principal = parseFloat(loanPrinciple.innerText);
    const interest = parseFloat(loanInterest.innerText);

    // Generate bar chart
    balanceChartInstance = new Chart(document.getElementById("balanceChart"), {
        type: "bar",
        data: {
            labels: barChartLabels,
            datasets: [{
                label: "Balance (Rs)",
                data: barChartData,
                backgroundColor: "#3598DB",
                borderColor: "#3598DB",
                borderWidth: 1
            },
            {
                type: 'line',
                label: 'Balance Reduction',
                data: barChartData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false,
                lineTension: 0
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Generate pie chart
    loanChartInstance = new Chart(document.getElementById("loanChart"), {
        type: "pie",
        data: {
            labels: ["Principal", "Interest"],
            datasets: [{
                backgroundColor: ["#3598DB", "#d6f0fd"],
                data: [principal, interest]
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Principal vs Interest'
            }
        }
    });
}
function downloadPDF() {
    // Capture the entire scrollable document
    html2canvas(document.body, {
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
    }).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        
        // Initialize jsPDF with default values for A4 size
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Calculate dimensions for A4 size
        const pdfWidth = pdf.width;
        const pdfHeight = pdf.height;
        const imgWidth = pdfWidth;
        const imgHeight = canvas.height * imgWidth / canvas.width;

        // Add captured image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        // Save PDF
        pdf.save("download.pdf");
    });
}






