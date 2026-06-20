document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the three charts
    await initTelemetryChart();
    await initPricingChart();
    await initReviewsChart();
    
    // Load dynamic summary stats in cards
    await updateDashboardSummary();
});

async function updateDashboardSummary() {
    try {
        // Fetch telemetry to calculate Total Players & Active Games
        const telResponse = await fetch('http://localhost:5000/api/telemetry');
        const telData = await telResponse.json();
        
        const totalPlayers = telData.reduce((sum, item) => sum + parseInt(item.current_players || 0), 0);
        const playersEl = document.getElementById('global-players');
        if (playersEl) {
            playersEl.innerText = totalPlayers.toLocaleString();
        }

        const gamesEl = document.getElementById('active-games');
        if (gamesEl) {
            gamesEl.innerText = telData.length.toLocaleString();
        }

        // Fetch reviews to calculate Average Sentiment
        const revResponse = await fetch('http://localhost:5000/api/reviews');
        const revData = await revResponse.json();
        
        const totalSentimentRatio = revData.reduce((sum, item) => {
            const pos = parseInt(item.positive_reviews || 0);
            const neg = parseInt(item.negative_reviews || 0);
            return sum + (pos + neg > 0 ? (pos / (pos + neg)) : 0);
        }, 0);
        
        const avgSentiment = revData.length > 0 ? Math.round((totalSentimentRatio / revData.length) * 100) : 0;
        const sentimentEl = document.getElementById('average-sentiment');
        if (sentimentEl) {
            sentimentEl.innerText = avgSentiment + '%';
        }
    } catch (error) {
        console.error("❌ Failed to update dashboard summary:", error);
    }
}

async function initTelemetryChart() {
    const canvas = document.getElementById('telemetryChart');
    if (!canvas) return;

    try {
        const response = await fetch('http://localhost:5000/api/telemetry');
        const data = await response.json();

        const gameNames = data.map(item => item.game_name);
        const playerCounts = data.map(item => item.current_players);

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: gameNames,
                datasets: [{
                    label: 'Current Players',
                    data: playerCounts,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    } catch (error) {
        console.error("❌ Failed to load telemetry data:", error);
    }
}

async function initPricingChart() {
    const canvas = document.getElementById('pricingChart');
    if (!canvas) return;

    try {
        const response = await fetch('http://localhost:5000/api/pricing');
        const data = await response.json();

        const gameNames = data.map(item => item.game_name);
        const prices = data.map(item => parseFloat(item.price_usd));

        new Chart(canvas, {
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
    } catch (error) {
        console.error("❌ Failed to load pricing data:", error);
    }
}

async function initReviewsChart() {
    const canvas = document.getElementById('reviewsChart');
    if (!canvas) return;

    try {
        const response = await fetch('http://localhost:5000/api/reviews');
        const data = await response.json();

        const gameNames = data.map(item => item.game_name);
        const positiveReviews = data.map(item => item.positive_reviews);
        const negativeReviews = data.map(item => item.negative_reviews);

        new Chart(canvas, {
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
    } catch (error) {
        console.error("❌ Failed to load reviews data:", error);
    }
}
