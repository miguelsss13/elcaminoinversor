// ==========================================
// SPA ROUTER
// ==========================================
function switchTab(tabId) {
    // Hide all sections
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Set nav link active
    const activeLink = document.getElementById(`nav-${tabId}`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Synchronize inputs (Number inputs with Range sliders)
function syncRangeInput(inputId, value) {
    const numInput = document.getElementById(inputId);
    if (numInput) {
        numInput.value = value;
    }
    
    // Update the visual range highlight if needed
    const rangeInput = document.getElementById(`${inputId}-range`);
    if (rangeInput) {
        rangeInput.value = value;
    }
}

// Helper to format currency
function formatEuro(value) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
}


// ==========================================
// CALCULADORA DE HIPOTECAS (Amortización Francesa)
// ==========================================
function calculateMortgage() {
    const amountInput = document.getElementById('mortgage-amount');
    const interestInput = document.getElementById('mortgage-interest');
    const termInput = document.getElementById('mortgage-term');

    const amount = parseFloat(amountInput.value) || 0;
    const annualInterest = parseFloat(interestInput.value) || 0;
    const termYears = parseInt(termInput.value) || 0;

    const monthlyInterestRate = (annualInterest / 100) / 12;
    const totalPaymentsMonths = termYears * 12;

    let monthlyPayment = 0;
    let totalPaid = 0;
    let totalInterest = 0;

    if (amount > 0 && termYears > 0) {
        if (annualInterest === 0) {
            monthlyPayment = amount / totalPaymentsMonths;
        } else {
            // French Amortization Formula
            monthlyPayment = amount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPaymentsMonths)) / 
                             (Math.pow(1 + monthlyInterestRate, totalPaymentsMonths) - 1);
        }
        totalPaid = monthlyPayment * totalPaymentsMonths;
        totalInterest = totalPaid - amount;
    }

        // Render results
    document.getElementById('mortgage-monthly').innerText = formatEuro(monthlyPayment);
    document.getElementById('mortgage-capital-res').innerText = formatEuro(amount);
    document.getElementById('mortgage-interest-res').innerText = formatEuro(totalInterest);
    document.getElementById('mortgage-total-res').innerText = formatEuro(totalPaid);

    // Sync cuota in the middle comparison column
    const cuotaCompareEl = document.getElementById('effort-cuota-compare');
    if (cuotaCompareEl) cuotaCompareEl.innerText = formatEuro(monthlyPayment);

    // Update Donut Chart
    drawMortgageChart(amount, totalInterest);

    // Effort calculation (35% of monthly income)
    const salaryInput = document.getElementById('salary-input');
    const salaryRaw = parseFloat(salaryInput?.value) || 0;
    const salaryType = document.querySelector('input[name="salary-type"]:checked')?.value || 'monthly';
    const monthlyIncome = salaryType === 'annual' ? salaryRaw / 12 : salaryRaw;
    const effort = monthlyIncome * 0.35;
    const effortEl = document.getElementById('effort-rate');
    if (effortEl) effortEl.innerText = formatEuro(effort);

    // Status based on monthly payment vs 35% effort rule — large visual badge
    const statusEl = document.getElementById('effort-status');
    if (statusEl) {
        if (monthlyIncome > 0 && monthlyPayment > 0) {
            if (monthlyPayment <= effort) {
                statusEl.innerHTML = `
                    <div style="background:rgba(0,200,83,0.12); border:2px solid var(--primary); border-radius:14px; padding:1.1rem 1.5rem; text-align:center; margin-top:0.75rem;">
                        <div style="font-size:2.2rem; font-weight:900; color:var(--primary); letter-spacing:1px;">
                            <i class="fa-solid fa-circle-check"></i> OK
                        </div>
                        <div style="font-size:0.88rem; color:var(--text-secondary); margin-top:0.4rem; line-height:1.5;">
                            La cuota está dentro del 35% de tu ingreso mensual.<br>Puedes asumir esta hipoteca.
                        </div>
                    </div>`;
            } else {
                statusEl.innerHTML = `
                    <div style="background:rgba(255,59,48,0.12); border:2px solid var(--danger); border-radius:14px; padding:1.1rem 1.5rem; text-align:center; margin-top:0.75rem;">
                        <div style="font-size:2.2rem; font-weight:900; color:var(--danger); letter-spacing:1px;">
                            <i class="fa-solid fa-triangle-exclamation"></i> KO
                        </div>
                        <div style="font-size:0.88rem; color:var(--text-secondary); margin-top:0.4rem; line-height:1.5;">
                            La cuota supera el 35% de tu ingreso mensual.<br>No se recomienda solicitar este préstamo.
                        </div>
                    </div>`;
            }
        } else {
            statusEl.innerHTML = '';
        }
    }
}

function updateSalaryLabel() {
    const salaryType = document.querySelector('input[name="salary-type"]:checked')?.value || 'monthly';
    const label = document.getElementById('salary-type-label');
    if (label) {
        label.innerText = salaryType === 'annual'
            ? 'Salario bruto anual (se divide entre 12 para obtener el ingreso mensual)'
            : 'Ingreso neto mensual';
    }
}

// Export calculation data to CSV
function exportCsv() {
  const salary = parseFloat(document.getElementById('salary-input')?.value) || 0;
  const amount = parseFloat(document.getElementById('mortgage-amount')?.value) || 0;
  const interest = parseFloat(document.getElementById('mortgage-interest')?.value) || 0;
  const term = parseInt(document.getElementById('mortgage-term')?.value) || 0;
  const effort = salary * 0.35;
  const monthly = document.getElementById('mortgage-monthly').innerText.replace(/[^0-9,.-]/g, '');
  const totalInterest = document.getElementById('mortgage-interest-res').innerText.replace(/[^0-9,.-]/g, '');
  const totalPaid = document.getElementById('mortgage-total-res').innerText.replace(/[^0-9,.-]/g, '');
  const csvLines = [
    ['Salario', salary],
    ['Esfuerzo (35%)', effort],
    ['Importe Préstamo', amount],
    ['Interés Anual (%)', interest],
    ['Plazo (Años)', term],
    ['Cuota Mensual', monthly],
    ['Intereses Totales', totalInterest],
    ['Total a Pagar', totalPaid]
  ];
  const csvContent = csvLines.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hipoteca_calculo.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Export compound interest calculation to CSV
function exportCompoundCsv() {
  const initial = parseFloat(document.getElementById('compound-initial')?.value) || 0;
  const monthly = parseFloat(document.getElementById('compound-monthly')?.value) || 0;
  const rate = parseFloat(document.getElementById('compound-rate')?.value) || 0;
  const years = parseInt(document.getElementById('compound-years')?.value) || 0;
  const finalAmount = document.getElementById('compound-final').innerText.replace(/[^0-9,.-]/g, '');
  const contributions = document.getElementById('compound-contributions').innerText.replace(/[^0-9,.-]/g, '');
  const interest = document.getElementById('compound-interest-res').innerText.replace(/[^0-9,.-]/g, '');
  const csvLines = [
    ['Inversión Inicial (€)', initial],
    ['Aportación Mensual (€)', monthly],
    ['Rentabilidad Anual Estimada (%)', rate],
    ['Horizonte Temporal (Años)', years],
    ['Capital Final Acumulado (€)', finalAmount],
    ['Aportaciones Totales (€)', contributions],
    ['Intereses Acumulados (€)', interest]
  ];
  const csvContent = csvLines.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'interes_compuesto.csv';
  a.click();
  URL.revokeObjectURL(url);
}


function drawMortgageChart(capital, interest) {
    const svg = document.getElementById('mortgage-chart-svg');
    if (!svg) return;

    const total = capital + interest;
    if (total === 0) {
        svg.innerHTML = '';
        return;
    }

    const capitalPercent = (capital / total) * 100;
    const interestPercent = (interest / total) * 100;

    // SVG parameters for donut chart (Radius 30, center 50,50)
    const r = 30;
    const cx = 50;
    const cy = 50;
    const circumference = 2 * Math.PI * r;

    const capitalOffset = circumference;
    const interestStrokeDash = (interestPercent / 100) * circumference;
    const capitalStrokeDash = (capitalPercent / 100) * circumference;

    svg.innerHTML = `
        <!-- Background circle -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="transparent" stroke="rgba(255,255,255,0.03)" stroke-width="8" />
        
        <!-- Capital Stroke -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="transparent" 
                stroke="var(--secondary)" stroke-width="8" 
                stroke-dasharray="${capitalStrokeDash} ${circumference - capitalStrokeDash}" 
                stroke-dashoffset="0"
                transform="rotate(-90 ${cx} ${cy})"
                class="chart-segment"
                data-name="Capital"
                data-val="${formatEuro(capital)} (${capitalPercent.toFixed(1)}%)"
        />
        
        <!-- Interest Stroke -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="transparent" 
                stroke="var(--danger)" stroke-width="8" 
                stroke-dasharray="${interestStrokeDash} ${circumference - interestStrokeDash}" 
                stroke-dashoffset="-${capitalStrokeDash}"
                transform="rotate(-90 ${cx} ${cy})"
                class="chart-segment"
                data-name="Intereses"
                data-val="${formatEuro(interest)} (${interestPercent.toFixed(1)}%)"
        />

        <!-- Center Text -->
        <text x="${cx}" y="${cy - 2}" text-anchor="middle" fill="var(--text-secondary)" font-size="5" font-weight="500">PROPORCIÓN</text>
        <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="var(--text-primary)" font-size="7" font-weight="700">Costes</text>
    `;

    // Tooltip logic for Donut chart
    const segments = svg.querySelectorAll('.chart-segment');
    const tooltip = document.getElementById('mortgage-tooltip');

    segments.forEach(segment => {
        segment.addEventListener('mousemove', (e) => {
            const name = segment.getAttribute('data-name');
            const val = segment.getAttribute('data-val');
            tooltip.style.opacity = 1;
            tooltip.innerHTML = `<strong>${name}:</strong> ${val}`;
            const rect = svg.getBoundingClientRect();
            tooltip.style.left = `${e.clientX - rect.left + 15}px`;
            tooltip.style.top = `${e.clientY - rect.top + 15}px`;
        });
        segment.addEventListener('mouseleave', () => {
            tooltip.style.opacity = 0;
        });
    });

    // Always-visible legend below the chart
    const legend = document.getElementById('mortgage-chart-legend');
    if (legend) {
        legend.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="display:inline-block; width:14px; height:14px; border-radius:3px; background:var(--secondary); flex-shrink:0;"></span>
                <span style="font-size:0.85rem; color:var(--text-secondary);">Capital: <strong style="color:var(--text-primary);">${formatEuro(capital)}</strong> <span style="color:var(--text-muted);">(${capitalPercent.toFixed(1)}%)</span></span>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="display:inline-block; width:14px; height:14px; border-radius:3px; background:var(--danger); flex-shrink:0;"></span>
                <span style="font-size:0.85rem; color:var(--text-secondary);">Intereses: <strong style="color:var(--danger);">${formatEuro(interest)}</strong> <span style="color:var(--text-muted);">(${interestPercent.toFixed(1)}%)</span></span>
            </div>
        `;
    }
}


// ==========================================
// SIMULADOR DE INTERÉS COMPUESTO
// ==========================================
function calculateCompound() {
    const initialInput = document.getElementById('compound-initial');
    const monthlyInput = document.getElementById('compound-monthly');
    const rateInput = document.getElementById('compound-rate');
    const yearsInput = document.getElementById('compound-years');

    const initial = parseFloat(initialInput.value) || 0;
    const monthly = parseFloat(monthlyInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    const years = parseInt(yearsInput.value) || 0;

    const monthlyRate = (rate / 100) / 12;
    let balance = initial;
    let totalContributions = initial;
    
    // We will save projections yearly for the chart
    let yearlyData = [{ year: 0, capital: initial, interest: 0, contributions: initial }];

    for (let year = 1; year <= years; year++) {
        let interestThisYear = 0;
        let contributionsThisYear = 0;

        for (let month = 1; month <= 12; month++) {
            const interestEarned = balance * monthlyRate;
            balance += interestEarned + monthly;
            totalContributions += monthly;
            interestThisYear += interestEarned;
            contributionsThisYear += monthly;
        }

        yearlyData.push({
            year: year,
            capital: balance,
            contributions: totalContributions,
            interest: balance - totalContributions
        });
    }

    // Update Text results
    document.getElementById('compound-final').innerText = formatEuro(balance);
    document.getElementById('compound-contributions').innerText = formatEuro(totalContributions);
    document.getElementById('compound-interest-res').innerText = formatEuro(balance - totalContributions);

    // Draw Bar Chart
    drawCompoundChart(yearlyData);
}

function drawCompoundChart(data) {
    const svg = document.getElementById('compound-chart-svg');
    if (!svg) return;

    svg.innerHTML = ''; // Clear previous

    const width = 400;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 55 };

    const maxVal = data[data.length - 1].capital * 1.1; // Add 10% space above
    
    // Grid Lines & Y Axis Labels
    const numYGrid = 4;
    for (let i = 0; i <= numYGrid; i++) {
        const val = (maxVal / numYGrid) * i;
        const y = height - padding.bottom - ((height - padding.top - padding.bottom) / numYGrid) * i;
        
        // Grid Line
        svg.innerHTML += `
            <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" 
                  stroke="rgba(255, 255, 255, 0.05)" stroke-width="1" stroke-dasharray="2, 2" />
            <text x="${padding.left - 10}" y="${y + 4}" fill="var(--text-muted)" font-size="8" text-anchor="end">
                ${formatShortEuro(val)}
            </text>
        `;
    }

    // Draw Bars
    const chartWidth = width - padding.left - padding.right;
    const barWidth = Math.max(4, Math.floor((chartWidth / data.length) * 0.6));
    const step = chartWidth / (data.length - 1 || 1);

    data.forEach((d, idx) => {
        const x = padding.left + step * idx - barWidth / 2;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Contributions bar height
        const contribHeight = (d.contributions / maxVal) * chartHeight;
        const contribY = height - padding.bottom - contribHeight;

        // Interest bar height
        const interestHeight = (d.interest / maxVal) * chartHeight;
        const interestY = contribY - interestHeight;

        // Draw stacked bars
        svg.innerHTML += `
            <!-- Total Contributions Block -->
            <rect x="${x}" y="${contribY}" width="${barWidth}" height="${contribHeight}" 
                  fill="var(--secondary)" opacity="0.8" rx="2" 
                  class="chart-bar" 
                  data-year="${d.year}"
                  data-contrib="${formatEuro(d.contributions)}"
                  data-interest="${formatEuro(d.interest)}"
                  data-total="${formatEuro(d.capital)}"
            />
            
            <!-- Interest Block -->
            <rect x="${x}" y="${interestY}" width="${barWidth}" height="${interestHeight}" 
                  fill="var(--primary)" opacity="0.8" rx="2" 
                  class="chart-bar" 
                  data-year="${d.year}"
                  data-contrib="${formatEuro(d.contributions)}"
                  data-interest="${formatEuro(d.interest)}"
                  data-total="${formatEuro(d.capital)}"
            />
        `;

        // Render standard X axis labels (Skip years to avoid overlap)
        const totalYears = data.length - 1;
        const skipFactor = Math.ceil(totalYears / 8);
        if (d.year % skipFactor === 0 || d.year === totalYears) {
            svg.innerHTML += `
                <text x="${padding.left + step * idx}" y="${height - padding.bottom + 15}" 
                      fill="var(--text-muted)" font-size="8" text-anchor="middle">
                    Año ${d.year}
                </text>
            `;
        }
    });

    // Tooltip logic for Bar chart
    const bars = svg.querySelectorAll('.chart-bar');
    const tooltip = document.getElementById('compound-tooltip');

    bars.forEach(bar => {
        bar.addEventListener('mousemove', (e) => {
            const year = bar.getAttribute('data-year');
            const contrib = bar.getAttribute('data-contrib');
            const interest = bar.getAttribute('data-interest');
            const total = bar.getAttribute('data-total');

            tooltip.style.opacity = 1;
            tooltip.innerHTML = `
                <strong style="color:var(--text-primary)">Año ${year}</strong><br>
                <span style="color:var(--secondary)">Aportaciones:</span> ${contrib}<br>
                <span style="color:var(--primary)">Interés Compuesto:</span> ${interest}<br>
                <strong>Capital Acumulado:</strong> ${total}
            `;
            
            const rect = svg.getBoundingClientRect();
            tooltip.style.left = `${e.clientX - rect.left + 15}px`;
            tooltip.style.top = `${e.clientY - rect.top - 70}px`; // Display slightly above mouse
        });

        bar.addEventListener('mouseleave', () => {
            tooltip.style.opacity = 0;
        });
    });
}

function formatShortEuro(value) {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M €';
    }
    if (value >= 1000) {
        return (value / 100).toFixed(0) / 10 + 'k €';
    }
    return value.toFixed(0) + ' €';
}


// ==========================================
// BALANCE DE PATRIMONIO NETO
// ==========================================
const DEFAULT_ASSETS = [
    { concept: 'Vivienda Habitual (Valor Estimado)', type: 'Inmuebles', value: 160000 },
    { concept: 'Cuenta Corriente & Ahorro', type: 'Efectivo', value: 12500 },
    { concept: 'Cartera Fondos Indexados (Renta Variable)', type: 'Inversiones', value: 18000 }
];

const DEFAULT_LIABILITIES = [
    { concept: 'Préstamo Hipotecario Vivienda', type: 'Hipoteca', value: 92000 },
    { concept: 'Tarjeta de Crédito Pendiente', type: 'Consumo', value: 450 }
];

let assets = [];
let liabilities = [];

// Initialize Sheets
function initNetWorthSheet() {
    const localAssets = localStorage.getItem('elcamino_assets');
    const localLiabilities = localStorage.getItem('elcamino_liabilities');

    if (localAssets) {
        assets = JSON.parse(localAssets);
    } else {
        assets = JSON.parse(JSON.stringify(DEFAULT_ASSETS));
        localStorage.setItem('elcamino_assets', JSON.stringify(assets));
    }

    if (localLiabilities) {
        liabilities = JSON.parse(localLiabilities);
    } else {
        liabilities = JSON.parse(JSON.stringify(DEFAULT_LIABILITIES));
        localStorage.setItem('elcamino_liabilities', JSON.stringify(liabilities));
    }

    renderNetWorth();
}

function renderNetWorth() {
    // 1. Render Assets Table
    const assetsList = document.getElementById('assets-list');
    if (!assetsList) return;
    assetsList.innerHTML = '';

    let totalAssets = 0;

    assets.forEach((item, idx) => {
        totalAssets += item.value;
        assetsList.innerHTML += `
            <tr>
                <td>
                    <input type="text" class="table-input" value="${item.concept}" 
                           onchange="updateSheetItem('assets', ${idx}, 'concept', this.value)">
                </td>
                <td>
                    <span class="asset-badge badge-asset">${item.type}</span>
                </td>
                <td>
                    <div class="input-wrapper" style="max-width: 150px;">
                        <span class="input-prefix" style="left:0.5rem">€</span>
                        <input type="number" class="table-input" style="padding-left:1.2rem; text-align:right" 
                               value="${item.value}" step="100" min="0" 
                               onchange="updateSheetItem('assets', ${idx}, 'value', parseFloat(this.value) || 0)">
                    </div>
                </td>
                <td style="text-align: center;">
                    <span style="color:var(--danger); cursor:pointer; font-size:1.1rem" onclick="deleteRow('assets', ${idx})">
                        <i class="fa-regular fa-trash-can"></i>
                    </span>
                </td>
            </tr>
        `;
    });

    document.getElementById('assets-total-val').innerText = formatEuro(totalAssets);

    // 2. Render Liabilities Table
    const liabilitiesList = document.getElementById('liabilities-list');
    if (!liabilitiesList) return;
    liabilitiesList.innerHTML = '';

    let totalLiabilities = 0;

    liabilities.forEach((item, idx) => {
        totalLiabilities += item.value;
        liabilitiesList.innerHTML += `
            <tr>
                <td>
                    <input type="text" class="table-input" value="${item.concept}" 
                           onchange="updateSheetItem('liabilities', ${idx}, 'concept', this.value)">
                </td>
                <td>
                    <span class="asset-badge badge-liability">${item.type}</span>
                </td>
                <td>
                    <div class="input-wrapper" style="max-width: 150px;">
                        <span class="input-prefix" style="left:0.5rem">€</span>
                        <input type="number" class="table-input" style="padding-left:1.2rem; text-align:right" 
                               value="${item.value}" step="100" min="0" 
                               onchange="updateSheetItem('liabilities', ${idx}, 'value', parseFloat(this.value) || 0)">
                    </div>
                </td>
                <td style="text-align: center;">
                    <span style="color:var(--danger); cursor:pointer; font-size:1.1rem" onclick="deleteRow('liabilities', ${idx})">
                        <i class="fa-regular fa-trash-can"></i>
                    </span>
                </td>
            </tr>
        `;
    });

    document.getElementById('liabilities-total-val').innerText = formatEuro(totalLiabilities);

    // 3. Compute Net Worth
    const netWorth = totalAssets - totalLiabilities;
    const netWorthContainer = document.getElementById('net-worth-final-val');
    netWorthContainer.innerText = formatEuro(netWorth);
    
    // Update KPI in Dashboard
    document.getElementById('kpi-net-worth').innerText = formatEuro(netWorth);

    // Color code and summary feedback
    const descText = document.getElementById('net-worth-summary-text');
    const dashboardDesc = document.getElementById('kpi-net-worth-desc');
    
    if (netWorth >= 0) {
        netWorthContainer.style.color = 'var(--primary)';
        const ratio = totalAssets > 0 ? (netWorth / totalAssets) * 100 : 100;
        
        const summaryMsg = `Tienes un balance patrimonial positivo. El ${ratio.toFixed(0)}% de tus activos está libre de deuda.`;
        descText.innerText = summaryMsg;
        dashboardDesc.innerHTML = `<span style="color: var(--primary)"><i class="fa-solid fa-circle-check"></i> Saludable</span> (Relación activos/deudas positiva)`;
    } else {
        netWorthContainer.style.color = 'var(--danger)';
        descText.innerText = 'Tu patrimonio neto es negativo. Tus deudas pendientes superan al valor de tus activos.';
        dashboardDesc.innerHTML = `<span style="color: var(--danger)"><i class="fa-solid fa-triangle-exclamation"></i> Alerta</span> (Tus pasivos superan a tus activos)`;
    }
}

function updateSheetItem(sheet, index, field, value) {
    if (sheet === 'assets') {
        assets[index][field] = value;
        localStorage.setItem('elcamino_assets', JSON.stringify(assets));
    } else {
        liabilities[index][field] = value;
        localStorage.setItem('elcamino_liabilities', JSON.stringify(liabilities));
    }
    renderNetWorth();
}

function addNewRow(sheet) {
    if (sheet === 'assets') {
        assets.push({ concept: 'Nuevo Activo', type: 'Otros', value: 1000 });
        localStorage.setItem('elcamino_assets', JSON.stringify(assets));
    } else {
        liabilities.push({ concept: 'Nuevo Pasivo', type: 'Otros', value: 500 });
        localStorage.setItem('elcamino_liabilities', JSON.stringify(liabilities));
    }
    renderNetWorth();
}

function deleteRow(sheet, index) {
    if (sheet === 'assets') {
        assets.splice(index, 1);
        localStorage.setItem('elcamino_assets', JSON.stringify(assets));
    } else {
        liabilities.splice(index, 1);
        localStorage.setItem('elcamino_liabilities', JSON.stringify(liabilities));
    }
    renderNetWorth();
}


// ==========================================
// REGISTRO DE INGRESOS Y GASTOS (CASH FLOW)
// ==========================================
const INCOME_CATEGORIES = ['Sueldo / Nómina', 'Inversiones (Dividendos/Rentas)', 'Ventas / Negocios', 'Otros Ingresos'];
const EXPENSE_CATEGORIES = ['Vivienda / Alquiler', 'Alimentación / Supermercado', 'Ocio / Restauración', 'Transporte', 'Suscripciones / Luz', 'Otros Gastos'];

const DEFAULT_TRANSACTIONS = [
    { id: 1, concept: 'Nómina Mensual', type: 'income', category: 'Sueldo / Nómina', amount: 2200, date: '2026-05-25' },
    { id: 2, concept: 'Alquiler Piso', type: 'expense', category: 'Vivienda / Alquiler', amount: 750, date: '2026-05-01' },
    { id: 3, concept: 'Compra Supermercado', type: 'expense', category: 'Alimentación / Supermercado', amount: 220.5, date: '2026-05-12' },
    { id: 4, concept: 'Cena Amigos', type: 'expense', category: 'Ocio / Restauración', amount: 65, date: '2026-05-18' },
    { id: 5, concept: 'Suscripciones Online', type: 'expense', category: 'Suscripciones / Luz', amount: 24.99, date: '2026-05-05' }
];

let transactions = [];

function initCashFlowSheet() {
    // Set date input to today
    const dateInput = document.getElementById('tx-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Set categories based on default expense selection
    adjustCategories('expense');

    const localTx = localStorage.getItem('elcamino_transactions');
    if (localTx) {
        transactions = JSON.parse(localTx);
    } else {
        transactions = JSON.parse(JSON.stringify(DEFAULT_TRANSACTIONS));
        localStorage.setItem('elcamino_transactions', JSON.stringify(transactions));
    }

    renderTransactions();
}

function adjustCategories(type) {
    const catSelect = document.getElementById('tx-category');
    if (!catSelect) return;

    catSelect.innerHTML = '';
    const categories = (type === 'income') ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    
    categories.forEach(cat => {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function renderTransactions() {
    const txList = document.getElementById('transaction-list');
    if (!txList) return;
    txList.innerHTML = '';

    let totalIncome = 0;
    let totalExpenses = 0;

    // Sort transactions by date descending
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(tx => {
        if (tx.type === 'income') {
            totalIncome += tx.amount;
        } else {
            totalExpenses += tx.amount;
        }

        const amtFormatted = tx.type === 'income' ? `+${formatEuro(tx.amount)}` : `-${formatEuro(tx.amount)}`;
        const amtClass = tx.type === 'income' ? 'income-type' : 'expense-type';

        // Format Date nicely
        const cleanDate = new Date(tx.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

        txList.innerHTML += `
            <tr>
                <td style="font-size:0.85rem; color:var(--text-secondary)">${cleanDate}</td>
                <td style="font-weight:500">${tx.concept}</td>
                <td><span class="asset-badge ${tx.type === 'income' ? 'badge-asset' : 'badge-liability'}">${tx.category}</span></td>
                <td class="${amtClass}">${amtFormatted}</td>
                <td style="text-align: center;">
                    <span style="color:var(--danger); cursor:pointer;" onclick="deleteTransaction(${tx.id})">
                        <i class="fa-solid fa-xmark"></i>
                    </span>
                </td>
            </tr>
        `;
    });

    // Update KPI numbers
    document.getElementById('kpi-income').innerText = formatEuro(totalIncome);
    document.getElementById('kpi-expense').innerText = formatEuro(totalExpenses);

    // Compute savings rate
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    
    const kpiSavings = document.getElementById('kpi-savings-rate');
    const badgeSavings = document.getElementById('saving-ratio-badge');

    if (savingsRate >= 0) {
        kpiSavings.className = "metric-change positive";
        kpiSavings.innerHTML = `<i class="fa-solid fa-circle-arrow-up"></i> Ahorro neto: ${formatEuro(savings)} (${savingsRate.toFixed(1)}%)`;
        badgeSavings.innerText = `Tasa de Ahorro Mensual: ${savingsRate.toFixed(1)}%`;
        badgeSavings.style.color = "var(--primary)";
    } else {
        kpiSavings.className = "metric-change negative";
        kpiSavings.innerHTML = `<i class="fa-solid fa-circle-arrow-down"></i> Déficit neto: ${formatEuro(Math.abs(savings))} (${savingsRate.toFixed(1)}%)`;
        badgeSavings.innerText = `Tasa de Ahorro Mensual: ${savingsRate.toFixed(1)}% (Déficit)`;
        badgeSavings.style.color = "var(--danger)";
    }
}

function addTransaction(e) {
    e.preventDefault();

    const concept = document.getElementById('tx-concept').value;
    const type = document.getElementById('tx-type').value;
    const category = document.getElementById('tx-category').value;
    const amount = parseFloat(document.getElementById('tx-amount').value) || 0;
    const date = document.getElementById('tx-date').value;

    if (amount <= 0 || !concept || !date) return;

    const newTx = {
        id: Date.now(),
        concept: concept,
        type: type,
        category: category,
        amount: amount,
        date: date
    };

    transactions.push(newTx);
    localStorage.setItem('elcamino_transactions', JSON.stringify(transactions));

    // Reset Form
    document.getElementById('tx-concept').value = '';
    document.getElementById('tx-amount').value = '';
    
    renderTransactions();
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('elcamino_transactions', JSON.stringify(transactions));
    renderTransactions();
}

function clearTransactions() {
    if (confirm('¿Estás seguro de que quieres eliminar todo el historial de transacciones?')) {
        transactions = [];
        localStorage.setItem('elcamino_transactions', JSON.stringify([]));
        renderTransactions();
    }
}


// ==========================================
// MOTOR DE BLOG Y ARTÍCULOS
// ==========================================
const ARTICLES_DATABASE = [
    {
        title: '¿Qué es MIFID II y por qué es una garantía total para ti?',
        excerpt: 'Descubre los exigentes requisitos del marco legal europeo diseñado para proteger al inversor minorista de la mala praxis financiera.',
        icon: '🔒',
        date: '31 Mayo, 2026',
        category: 'Regulación',
        body: `
            <p>En el complejo mundo de las inversiones y las finanzas personales, la seguridad y la transparencia jurídica son el pilar fundamental para tomar decisiones correctas. Aquí es donde entra en juego la directiva europea <strong>MIFID II</strong> (Markets in Financial Instruments Directive II).</p>
            
            <h3>¿Qué es exactamente MIFID II?</h3>
            <p>MIFID II es una de las normativas de protección financiera más avanzadas y rigurosas del mundo. Aprobada por el Parlamento Europeo, su principal propósito es regular la prestación de servicios de inversión y proteger de manera prioritaria al <strong>inversor minorista</strong> (los ahorradores particulares).</p>
            
            <h3>Los 3 Grandes Pilares de Protección</h3>
            <blockquote>"La directiva obliga a colocar los intereses del cliente siempre por delante de las comisiones del banco o del asesor."</blockquote>
            
            <p>Bajo el estándar MIFID II, cualquier profesional que actúe en España (supervisado por la CNMV) debe cumplir con tres principios estrictos:</p>
            <ol style="margin-left: 1.5rem; margin-bottom: 1.5rem;">
                <li><strong>El Test de Idoneidad:</strong> Antes de recomendarte cualquier fondo o acción, el asesor debe realizar obligatoriamente un análisis clínico de tu situación financiera, tus objetivos temporales y tu tolerancia psicológica al riesgo. Si un producto no se adecúa a tu perfil, la ley prohíbe recomendarlo.</li>
                <li><strong>Transparencia Absoluta de Costes:</strong> Se desglosan de forma agregada todos los costes directos e indirectos. Debes saber exactamente cuánto estás pagando en comisiones implícitas (las que cobran los fondos en segundo plano).</li>
                <li><strong>Gestión de Conflictos de Interés:</strong> La normativa pone freno a las comisiones ocultas y los incentivos ("retrocesiones") que las gestoras de fondos pagan a los bancos comerciales para que vendan productos caros e ineficientes.</li>
            </ol>

            <h3>¿Por qué sacarse el MIFID II es tan importante?</h3>
            <p>Obtener la certificación oficial MIFID II exige aprobar exámenes muy estrictos sobre matemática financiera, mercados de renta fija y variable, productos complejos (derivados, seguros de inversión) y legislación de compliance. Para un cliente, trabajar con alguien certificado garantiza que está hablando con un profesional cualificado y sujeto a responsabilidad legal, y no con un autoproclamado "gurú" de redes sociales.</p>
        `
    },
    {
        title: 'El Poder del Interés Compuesto: La Octava Maravilla',
        excerpt: 'Aprende matemáticamente cómo el tiempo y la constancia multiplican tus ahorros de forma exponencial, minimizando el esfuerzo.',
        icon: '📈',
        date: '28 Mayo, 2026',
        category: 'Educación',
        body: `
            <p>Albert Einstein catalogó al interés compuesto como la fuerza más poderosa del universo, llamándola "la octava maravilla del mundo". Aquel que lo comprende, se beneficia de él; aquel que no, lo paga.</p>
            
            <h3>Diferencia entre Interés Simple e Interés Compuesto</h3>
            <p>Para entender su poder, comparemos ambos sistemas:</p>
            <ul>
                <li><strong>Interés Simple:</strong> Los beneficios generados por tus ahorros se retiran o se guardan aparte. El capital que produce intereses siempre se mantiene idéntico.</li>
                <li><strong>Interés Compuesto:</strong> Los rendimientos anuales se **reinvierten automáticamente** sumándose al capital principal. El siguiente año, los nuevos intereses se calculan sobre la suma total, de modo que los intereses empiezan a generar nuevos intereses.</li>
            </ul>

            <h3>La Bola de Nieve Financiera</h3>
            <p>Imagina que comienzas con €10.000 y aportas €200 al mes con un rendimiento anual histórico conservador del 7% (típico de índices mundiales como el MSCI World a largo plazo):</p>
            <ul>
                <li>En **10 años** habrás aportado €34.000 propios, pero tu saldo total será de **€48.500** (has ganado €14.500 en intereses).</li>
                <li>En **20 años** habrás aportado €53.000, pero tu saldo acumulado rozará los **€109.000** (el interés ya supera a tus aportaciones).</li>
                <li>En **30 Años** habrás invertido €82.000 y tu patrimonio será de más de **€235.000** (¡has ganado €153.000 limpios simplemente dejando trabajar al dinero!).</li>
            </ul>
            
            <blockquote>El verdadero secreto del interés compuesto no es la cantidad de dinero que inviertes, sino el tiempo que dejas que actúe. Empezar 5 años antes duplica los resultados a largo plazo.</blockquote>

            <h3>Consejos para maximizarlo</h3>
            <p>Para exprimir el interés compuesto necesitas tres factores: comenzar lo antes posible (el tiempo es el factor exponencial), automatizar tus aportaciones mensuales (disciplina) e invertir a través de vehículos eficientes fiscalmente en España, como los fondos de inversión traspasables (donde no pagas impuestos hasta que retiras el dinero definitivo).</p>
        `
    },
    {
        title: 'Guía para estructurar tu Balance de Patrimonio Neto',
        excerpt: 'Tu patrimonio neto es la brújula real de tu salud financiera. Aprende a ordenarlo y a evitar deudas destructivas.',
        icon: '💼',
        date: '20 Mayo, 2026',
        category: 'Planificación',
        body: `
            <p>Muchos creen que la salud financiera se mide por el sueldo mensual. Sin embargo, esto es un error grave de concepto: la verdadera riqueza no se mide por lo que ganas, sino por **lo que conservas**.</p>
            
            <h3>¿Qué es el Patrimonio Neto?</h3>
            <p>El patrimonio neto es el valor monetario real que te quedaría si hoy mismo vendieras todas tus pertenencias y pagaras todas tus deudas pendientes. Es la fotografía financiera real de tu vida.</p>
            <p style="text-align: center; font-weight: 700; font-size: 1.25rem; margin: 1.5rem 0;">Patrimonio Neto = Total Activos - Total Pasivos</p>

            <h3>Clasificación Inteligente de Activos</h3>
            <p>Un activo es todo bien que posee valor económico y que puede convertirse en dinero líquido. Dividimos los activos en:</p>
            <ol style="margin-left: 1.5rem; margin-bottom: 1.5rem;">
                <li><strong>Líquidos / Efectivo:</strong> Cuentas corrientes, depósitos de ahorro de disponibilidad inmediata. Son tu fondo de emergencia.</li>
                <li><strong>Inversiones Financieras:</strong> Acciones, fondos indexados, planes de pensiones. Su misión es batir a la inflación.</li>
                <li><strong>Bienes Raíces (Inmuebles):</strong> El valor tasado de tus propiedades.</li>
                <li><strong>Activos Reales o Personales:</strong> Vehículos, joyas u otros bienes con valor residual de venta.</li>
            </ol>

            <h3>Control Riguroso de Pasivos</h3>
            <p>Los pasivos son deudas pendientes con terceros. Hay deudas buenas (que te permiten apalancarte para comprar activos que producen valor, como una hipoteca moderada para una casa eficiente) y deudas malas (que destruyen tu riqueza, como créditos de consumo o tarjetas de crédito al 20% de interés para comprar cosas que se deprecian).</p>

            <h3>¿Cómo evaluar tus resultados?</h3>
            <p>Tu objetivo a largo plazo debe ser que tu Patrimonio Neto crezca de forma constante año tras año. Al ordenar tu balance patrimonial en nuestra sección **Patrimonio**, puedes supervisar la relación deuda/activo. Idealmente, la deuda de consumo debe ser cero, y la hipoteca debe suponer menos del 40% del valor total de tus activos para mantener una salud financiera intachable.</p>
        `
    }
];

function initBlogEngine() {
    const grid = document.getElementById('blog-posts-grid');
    if (!grid) return;
    grid.innerHTML = '';

    ARTICLES_DATABASE.forEach((article, idx) => {
        grid.innerHTML += `
            <div class="blog-card" onclick="openArticle(${idx})">
                <div class="blog-cover">${article.icon}</div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="asset-badge badge-asset">${article.category}</span>
                        <span>&bull;</span>
                        <span>${article.date}</span>
                    </div>
                    <h3 class="blog-title">${article.title}</h3>
                    <p class="blog-excerpt">${article.excerpt}</p>
                    <span class="read-more">Leer artículo <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            </div>
        `;
    });
}

function openArticle(index) {
    const article = ARTICLES_DATABASE[index];
    if (!article) return;

    const modal = document.getElementById('article-reader-modal');
    const target = document.getElementById('article-content-target');

    target.innerHTML = `
        <div class="article-header">
            <span class="asset-badge badge-asset" style="margin-bottom: 0.75rem;">${article.category}</span>
            <h2>${article.title}</h2>
            <div style="color:var(--text-muted); font-size:0.9rem">Publicado el ${article.date} &bull; Escrito por un futuro asesor MIFID II</div>
        </div>
        <div class="article-body">
            ${article.body}
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Stop background scrolling
}

function closeArticleModal() {
    const modal = document.getElementById('article-reader-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Enable scrolling
}


// ==========================================
// LEAD GENERATION & CONTACT FORM
// ==========================================
function handleContactSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const phone = document.getElementById('contact-phone').value;
    const interest = document.getElementById('contact-interest').value;
    const msg = document.getElementById('contact-msg').value;

    if (!name || !email) return;

    // Simulate safe API submission success with a premium alert UI overlay
    const container = document.getElementById('lead-contact-form');
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; animation: fadeIn 0.4s ease forwards;">
            <div style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;">
                <i class="fa-solid fa-circle-check"></i>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 0.75rem; color:var(--text-primary)">
                ¡Solicitud Registrada Exitosamente!
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
                Hola <strong>${name}</strong>, he recibido tus datos para la consulta sobre <strong>"${interest.toUpperCase()}"</strong>.<br><br>
                Como futuro asesor financiero bajo estándares <strong>MIFID II</strong>, revisaré tu caso con máxima confidencialidad. Me pondré en contacto contigo en tu correo (<strong>${email}</strong>) o teléfono en menos de 24 horas laborables para agendar nuestra videollamada estratégica de diagnóstico.
            </p>
            <button class="btn btn-outline btn-sm" onclick="resetContactForm()"><i class="fa-solid fa-rotate-left"></i> Volver a enviar</button>
        </div>
    `;
}

function resetContactForm() {
    // Reset the contact form card to its original HTML state
    const tabSection = document.getElementById('contacto');
    // Let's re-render just the card
    const card = tabSection.querySelectorAll('.card')[1];
    card.innerHTML = `
        <div class="card-title"><i class="fa-regular fa-envelope"></i> Agenda tu Sesión de Diagnóstico</div>
        <form id="lead-contact-form" onsubmit="handleContactSubmit(event)">
            <div class="form-group">
                <label for="contact-name">Nombre Completo</label>
                <input type="text" id="contact-name" placeholder="Tu nombre" required>
            </div>

            <div class="form-group">
                <label for="contact-email">Correo Electrónico</label>
                <input type="text" id="contact-email" placeholder="tucorreo@ejemplo.com" required>
            </div>

            <div class="form-group">
                <label for="contact-phone">Teléfono de Contacto (Opcional)</label>
                <input type="text" id="contact-phone" placeholder="Ej. +34 600 000 000">
            </div>

            <div class="form-group">
                <label for="contact-interest">¿En qué estás más interesado?</label>
                <select id="contact-interest">
                    <option value="patrimonio">Optimización de mi Patrimonio Neto</option>
                    <option value="hipoteca">Planificación Hipotecaria y Deudas</option>
                    <option value="inversion">Estrategia de Inversión a largo plazo</option>
                    <option value="mifid">Consultoría Financiera General</option>
                </select>
            </div>

            <div class="form-group">
                <label for="contact-msg">Notas o Comentarios Adicionales</label>
                <textarea id="contact-msg" rows="3" placeholder="Cuéntame brevemente tu situación financiera actual..."></textarea>
            </div>

            <button type="submit" class="btn btn-secondary" style="width: 100%;"><i class="fa-solid fa-paper-plane"></i> Solicitar Sesión Gratuita</button>
        </form>
    `;
}


// ==========================================
// APP INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // Calculators
    calculateMortgage();
    calculateCompound();

    // Sheets
    initNetWorthSheet();
    initCashFlowSheet();

    // Blog
    initBlogEngine();
});
