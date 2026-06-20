// API Configuration: Automatically routes locally or points to your production Render backend URL.
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? (window.location.port === '5000' ? '' : 'http://localhost:5000')
    : 'https://steamsight-backend.onrender.com'; // CHANGE THIS to your Render backend web service URL.

// Keep track of active Chart.js instances to avoid overlapping rendering bugs
let telemetryChartInstance = null;
let pricingChartInstance = null;
let reviewsChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
    setupRegistryForm();
    setupFilters();
    setupSearch();
    setupCSVExport();
});

async function loadDashboardData() {
    try {
        // Fetch all telemetry data concurrently (with historical dataset)
        const [telResponse, pricingResponse, reviewsResponse, historyResponse] = await Promise.all([
            fetch(`${API_BASE}/api/telemetry`),
            fetch(`${API_BASE}/api/pricing`),
            fetch(`${API_BASE}/api/reviews`),
            fetch(`${API_BASE}/api/telemetry/history?days=7`)
        ]);

        const telData = await telResponse.json();
        const pricingData = await pricingResponse.json();
        const reviewsData = await reviewsResponse.json();
        const historyData = await historyResponse.json();

        // 1. Update KPI Summary Cards
        updateDashboardSummary(telData, reviewsData);

        // 2. Initialize and render the three charts
        renderHistoryChart(historyData);
        renderPricingChart(pricingData);
        renderReviewsChart(reviewsData);

        // 3. Populate Recent Telemetry Data Table
        populateTelemetryTable(telData, pricingData, reviewsData);

    } catch (error) {
        console.error("❌ Failed to load dashboard data:", error);
    }
}

function updateDashboardSummary(telData, reviewsData) {
    // 1. Calculate Total Players
    const totalPlayers = telData.reduce((sum, item) => sum + parseInt(item.current_players || 0), 0);
    const playersEl = document.getElementById('global-players');
    if (playersEl) {
        playersEl.innerText = totalPlayers.toLocaleString();
    }

    // 2. Calculate Active Games Count
    const gamesEl = document.getElementById('active-games');
    if (gamesEl) {
        gamesEl.innerText = telData.length.toLocaleString();
    }

    // 3. Calculate Average Sentiment
    const totalSentimentRatio = reviewsData.reduce((sum, item) => {
        const pos = parseInt(item.positive_reviews || 0);
        const neg = parseInt(item.negative_reviews || 0);
        return sum + (pos + neg > 0 ? (pos / (pos + neg)) : 0);
    }, 0);
    
    const avgSentiment = reviewsData.length > 0 ? Math.round((totalSentimentRatio / reviewsData.length) * 100) : 0;
    const sentimentEl = document.getElementById('average-sentiment');
    if (sentimentEl) {
        sentimentEl.innerText = avgSentiment + '%';
    }
}

function renderHistoryChart(data) {
    const canvas = document.getElementById('telemetryChart');
    if (!canvas) return;

    // Clean up active chart overlay instances
    if (telemetryChartInstance) {
        telemetryChartInstance.destroy();
    }

    // Group items by game_name
    const gameGroups = {};
    data.forEach(item => {
        if (!gameGroups[item.game_name]) {
            gameGroups[item.game_name] = [];
        }
        const dateObj = new Date(item.recorded_at);
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
        gameGroups[item.game_name].push({
            x: timeStr,
            y: parseInt(item.current_players)
        });
    });

    const lineColors = [
        '#ffffff',                  // Pure White
        '#cccccc',                  // Light Grey
        'rgba(255, 255, 255, 0.6)', // Translucent White
        '#888888',                  // Medium Grey
        '#444444'                   // Dark Grey
    ];

    const datasets = [];
    let colorIndex = 0;
    for (const [gameName, points] of Object.entries(gameGroups)) {
        datasets.push({
            label: gameName,
            data: points.map(p => p.y),
            borderColor: lineColors[colorIndex % lineColors.length],
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5
        });
        colorIndex++;
    }

    // Get unique timestamps from first game as labels
    const firstGameName = Object.keys(gameGroups)[0];
    const labels = firstGameName ? gameGroups[firstGameName].map(p => p.x) : [];

    telemetryChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#aaaaaa' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#aaaaaa' }
                }
            },
            plugins: {
                legend: { labels: { color: '#ffffff' } }
            }
        }
    });
}

function renderPricingChart(data) {
    const canvas = document.getElementById('pricingChart');
    if (!canvas) return;

    if (pricingChartInstance) {
        pricingChartInstance.destroy();
    }

    const gameNames = data.map(item => item.game_name);
    const prices = data.map(item => parseFloat(item.price_usd));

    pricingChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: gameNames,
            datasets: [{
                label: 'Price (USD)',
                data: prices,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderColor: '#ffffff',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { 
                        color: '#aaaaaa',
                        callback: function(value) { return '$' + value.toFixed(2); }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#aaaaaa' }
                }
            },
            plugins: {
                legend: { labels: { color: '#ffffff' } }
            }
        }
    });
}

function renderReviewsChart(data) {
    const canvas = document.getElementById('reviewsChart');
    if (!canvas) return;

    if (reviewsChartInstance) {
        reviewsChartInstance.destroy();
    }

    const gameNames = data.map(item => item.game_name);
    const positiveReviews = data.map(item => item.positive_reviews);
    const negativeReviews = data.map(item => item.negative_reviews);

    reviewsChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: gameNames,
            datasets: [
                {
                    label: 'Positive Reviews',
                    data: positiveReviews,
                    backgroundColor: '#ffffff',
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Negative Reviews',
                    data: negativeReviews,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: '#ffffff',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: '#aaaaaa' }
                },
                y: {
                    stacked: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#aaaaaa' }
                }
            },
            plugins: {
                legend: { labels: { color: '#ffffff' } }
            }
        }
    });
}

function populateTelemetryTable(telData, pricingData, reviewsData) {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const merged = {};
    
    telData.forEach(item => {
        merged[item.game_name] = {
            game_name: item.game_name,
            recorded_at: item.recorded_at,
            current_players: item.current_players,
            price_usd: 0.0,
            discount_percent: 0,
            positive_reviews: 0,
            negative_reviews: 0
        };
    });

    pricingData.forEach(item => {
        if (merged[item.game_name]) {
            merged[item.game_name].price_usd = parseFloat(item.price_usd);
            merged[item.game_name].discount_percent = parseInt(item.discount_percent || 0);
        }
    });

    reviewsData.forEach(item => {
        if (merged[item.game_name]) {
            merged[item.game_name].positive_reviews = parseInt(item.positive_reviews || 0);
            merged[item.game_name].negative_reviews = parseInt(item.negative_reviews || 0);
        }
    });

    Object.values(merged).forEach(game => {
        const tr = document.createElement('tr');
        const iconSvg = getGameIconSvg(game.game_name);

        let dateStr = 'Unknown';
        if (game.recorded_at) {
            const dateObj = new Date(game.recorded_at);
            dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        let priceStr = 'Free to Play';
        if (game.price_usd > 0) {
            priceStr = `$${game.price_usd.toFixed(2)}`;
            if (game.discount_percent > 0) {
                priceStr += ` (-${game.discount_percent}%)`;
            }
        }

        const total = game.positive_reviews + game.negative_reviews;
        const ratio = total > 0 ? (game.positive_reviews / total) : 0;
        const percent = Math.round(ratio * 100);
        
        let statusClass = 'mixed';
        let reviewText = 'No Reviews';
        
        if (total > 0) {
            if (percent >= 80) {
                statusClass = 'positive';
                reviewText = `Positive (${percent}%)`;
            } else if (percent >= 50) {
                statusClass = 'mixed';
                reviewText = `Mixed (${percent}%)`;
            } else {
                statusClass = 'mixed';
                reviewText = `Negative (${percent}%)`;
            }
        }

        tr.innerHTML = `
            <td>
                <div class="game-info-cell">
                    <div class="game-icon">
                        ${iconSvg}
                    </div>
                    <span class="game-name">${game.game_name}</span>
                </div>
            </td>
            <td class="date-cell">${dateStr}</td>
            <td class="price-cell">${priceStr}</td>
            <td class="player-count-cell">${parseInt(game.current_players || 0).toLocaleString()}</td>
            <td>
                <div class="reviews-cell">
                    <div class="status-indicator ${statusClass}"></div>
                    <span class="reviews-text">${reviewText}</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupRegistryForm() {
    const form = document.getElementById('add-game-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const appIdInput = document.getElementById('reg-app-id');
        const gameNameInput = document.getElementById('reg-game-name');
        const feedback = document.getElementById('registration-feedback');

        if (!appIdInput || !gameNameInput || !feedback) return;

        const app_id = appIdInput.value.trim();
        const game_name = gameNameInput.value.trim();

        feedback.style.display = 'block';
        feedback.style.color = '#ffffff';
        feedback.innerText = '⏳ Registering game...';

        try {
            const response = await fetch(`${API_BASE}/api/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ app_id, game_name })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                feedback.style.color = '#ffffff';
                feedback.innerText = '✅ Game registered! Scraper will track on next cycle.';
                form.reset();
                setTimeout(async () => {
                    await loadDashboardData();
                    feedback.style.display = 'none';
                }, 3000);
            } else {
                feedback.style.color = '#ffffff';
                feedback.innerText = `❌ Error: ${result.error || 'Failed to register'}`;
            }
        } catch (err) {
            console.error("Error submitting registration:", err);
            feedback.style.color = '#ffffff';
            feedback.innerText = '❌ Connection failed.';
        }
    });
}

function setupFilters() {
    const tabs = document.querySelectorAll('.filter-tabs .tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            let days = 7;
            const text = tab.innerText.trim();
            if (text === '24H') days = 1;
            else if (text === '7D') days = 7;
            else if (text === '30D') days = 30;

            try {
                const response = await fetch(`${API_BASE}/api/telemetry/history?days=${days}`);
                const historyData = await response.json();
                renderHistoryChart(historyData);
            } catch (err) {
                console.error("❌ Failed to update history filter:", err);
            }
        });
    });
}

function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;

    searchInput.addEventListener('keyup', () => {
        const query = searchInput.value.toLowerCase().trim();
        const rows = document.querySelectorAll('.data-table tbody tr');

        rows.forEach(row => {
            if (row.id === 'no-results-row') return;
            const gameNameEl = row.querySelector('.game-name');
            if (!gameNameEl) return;
            const gameName = gameNameEl.innerText.toLowerCase();

            if (gameName.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
        
        const visibleRows = Array.from(rows).filter(r => r.style.display !== 'none' && r.id !== 'no-results-row');
        const existingNoResults = document.getElementById('no-results-row');
        
        if (visibleRows.length === 0) {
            if (!existingNoResults) {
                const tbody = document.querySelector('.data-table tbody');
                const tr = document.createElement('tr');
                tr.id = 'no-results-row';
                tr.innerHTML = `
                    <td colspan="5" style="text-align: center; color: var(--color-on-surface-variant); padding: 2rem; font-family: 'JetBrains Mono', monospace;">
                        🔍 No matching games found
                    </td>
                `;
                tbody.appendChild(tr);
            }
        } else {
            if (existingNoResults) {
                existingNoResults.remove();
            }
        }
    });
}

function setupCSVExport() {
    const exportBtn = document.querySelector('.export-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
        const rows = document.querySelectorAll('.data-table tbody tr');
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Game Name,Date,Price,Player Count,Sentiment\n";

        rows.forEach(row => {
            if (row.id === 'no-results-row') return;
            
            const gameName = row.querySelector('.game-name')?.innerText || '';
            const date = row.querySelector('.date-cell')?.innerText || '';
            const price = row.querySelector('.price-cell')?.innerText.replace('$', '') || '';
            const playerCount = row.querySelector('.player-count-cell')?.innerText.replace(/,/g, '') || '';
            const sentiment = row.querySelector('.reviews-text')?.innerText || '';

            const escapedName = `"${gameName.replace(/"/g, '""')}"`;
            const escapedSentiment = `"${sentiment.replace(/"/g, '""')}"`;

            csvContent += `${escapedName},"${date}",${price},${playerCount},${escapedSentiment}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `steamsight_telemetry_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

function getGameIconSvg(gameName) {
    const style = 'width: 100%; height: 100%; display: block; padding: 6px; box-sizing: border-box; color: #ffffff;';
    switch (gameName) {
        case 'Counter-Strike 2':
            return `<svg viewBox="0 0 24 24" style="${style}" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="22" y1="12" x2="18" y2="12"></line>
                <line x1="6" y1="12" x2="2" y2="12"></line>
                <line x1="12" y1="6" x2="12" y2="2"></line>
                <line x1="12" y1="22" x2="12" y2="18"></line>
                <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
            </svg>`;
        case 'Dota 2':
            return `<svg viewBox="0 0 24 24" style="${style}" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>`;
        case 'Apex Legends':
            return `<svg viewBox="0 0 24 24" style="${style}" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L3 22h18L12 2z"></path>
                <path d="M12 10l-4 8h8z"></path>
            </svg>`;
        case 'PUBG: BATTLEGROUNDS':
            return `<svg viewBox="0 0 24 24" style="${style}" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
            </svg>`;
        case 'Cyberpunk 2077':
            return `<svg viewBox="0 0 24 24" style="${style}" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
                <line x1="9" y1="1" x2="9" y2="4"></line>
                <line x1="15" y1="1" x2="15" y2="4"></line>
                <line x1="9" y1="20" x2="9" y2="23"></line>
                <line x1="15" y1="20" x2="15" y2="23"></line>
                <line x1="20" y1="9" x2="23" y2="9"></line>
                <line x1="20" y1="15" x2="23" y2="15"></line>
                <line x1="1" y1="9" x2="4" y2="9"></line>
                <line x1="1" y1="15" x2="4" y2="15"></line>
            </svg>`;
        default:
            return `<svg viewBox="0 0 24 24" style="${style}" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="3"></rect>
                <line x1="6" y1="12" x2="10" y2="12"></line>
                <line x1="8" y1="10" x2="8" y2="14"></line>
                <line x1="15" y1="13" x2="15.01" y2="13"></line>
                <line x1="18" y1="11" x2="18.01" y2="11"></line>
            </svg>`;
    }
}
