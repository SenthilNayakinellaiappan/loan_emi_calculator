const loanAmount = document.getElementById("loan-amount");
const loanTenureYears = document.getElementById("loan-tenure-years");
const loanTenureMonths = document.getElementById("loan-tenure-months");
const loanRate = document.getElementById("loan-interest");
const loanEmi = document.getElementById("loanemi");
const loanPrinciple = document.getElementById("loanprinciple");
const loanTotal = document.getElementById("loantotal");
const loanInterest = document.getElementById("loaninterest");
let submitBtn = document.getElementById("calcbtn");
let error = document.querySelector(".error");
let result = document.querySelector(".result");

function calculate() {
    if (loanAmount.value === '' || loanTenureYears.value === '' || loanTenureMonths.value === '' || loanRate.value === '') {
        error.style.display = "block";
        error.innerHTML = "Please Fill All The Fields";
        setTimeout(() => {
            error.style.display = "none";
        }, 2000);
        return;
    }

    if (loanAmount.value <= 0 || loanTenureYears.value <= 0 || loanTenureMonths.value < 0 || loanRate.value <= 0) {
        error.style.display = "block";
        error.innerHTML = "The fields should not have negative values";
        setTimeout(() => {
            error.style.display = "none";
        }, 2000);
        return;
    }

    calculateEmi();
}

function calculateEmi() {
    const amount = parseFloat(loanAmount.value);
    const tenureYears = parseFloat(loanTenureYears.value);
    const tenureMonths = parseFloat(loanTenureMonths.value);
    const totalMonths = (tenureYears * 12) + tenureMonths;
    const rate = parseFloat(loanRate.value) / 12 / 100;

    const emi = (amount * rate) / (1 - Math.pow(1 + rate, -totalMonths));
    const emi_mod = Math.round(emi * 100.0) / 100.0;
    const total = emi_mod * totalMonths;
    const interest = total - amount;

    result.style.display = "block";
    document.querySelector(".container").style.height = "100%";
    loanEmi.innerHTML = Math.floor(emi_mod);
    loanPrinciple.innerHTML = Math.floor(amount);
    loanTotal.innerHTML = Math.floor(total);
    loanInterest.innerHTML = Math.floor(interest);

    const tableBody = document.querySelector("#emiTable tbody");
    tableBody.innerHTML = "";

    let p = amount;
    const today = new Date();
    let currentMonth = today.getMonth(); // 0 = January, 11 = December
    let currentYear = today.getFullYear(); // Get the current year

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthlyBalances = []; // Array to store monthly balances

    for (let i = 0; i < totalMonths; i++) {
        const int_amt = p * rate;
        const pr = emi_mod - int_amt;
        const due = p - pr;

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

    // Displaying pie chart that describes the details
    let xValues = ["Principle", "Interest"];
    let yValues = [amount, Math.floor(interest)];
    let barColors = ["#3598DB", "#d6f0fd"];

    new Chart("loanChart", {
        type: "pie",
        data: {
            labels: xValues,
            datasets: [
                {
                    backgroundColor: barColors,
                    data: yValues
                }
            ]
        },
        options: {
            title: {
                display: false
            }
        }
    });

    // Group monthly balances by year and month for the bar chart
    const groupedBalances = [];
    monthlyBalances.forEach(item => {
        groupedBalances.push(`${item.month} ${item.year}`);
    });

    const barChartLabels = groupedBalances;
    const barChartData = monthlyBalances.map(item => item.balance);

    // Displaying bar chart for month-wise balances
    new Chart("balanceChart", {
        type: "bar",
        data: {
            labels: barChartLabels,
            datasets: [
                {
                    label: 'Balance (Rs)',
                    data: barChartData,
                    backgroundColor: '#3598DB',
                    borderColor: '#3598DB',
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
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            if (label) {
                                return `${label}: Rs ${context.raw}`;
                            }
                            return null;
                        }
                    }
                }
            }
        }
    });
}
screenshotBtn.addEventListener("click", function() {
    // Wait for rendering to complete
    setTimeout(() => {
        html2canvas(document.body).then(canvas => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF();
            const imgWidth = 210; // A4 size
            const imgHeight = canvas.height * imgWidth / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save("EMI_Details.pdf");
        }).catch(error => {
            console.error('Error generating PDF:', error);
        });
    }, 1000); // Adjust timing as needed
});

