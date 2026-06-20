document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the three charts
    await initTelemetryChart();
    await initPricingChart();
    await initReviewsChart();
});

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
