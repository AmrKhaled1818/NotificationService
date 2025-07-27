// generate-report.js
import fs from 'fs';

// Read the JSON data
const jsonData = JSON.parse(fs.readFileSync('load-test-summary.json', 'utf-8'));

// Create a custom HTML report
const createHTMLReport = (data) => {
  const metrics = data.metrics;
  const checks = data.root_group.checks;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K6 Load Test Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .metric-card h3 {
            margin: 0 0 15px 0;
            color: #495057;
            font-size: 1.1em;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #6c757d;
            font-size: 0.9em;
        }
        .checks-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
        }
        .check-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .check-item:last-child {
            border-bottom: none;
        }
        .check-name {
            font-weight: 500;
            color: #495057;
        }
        .check-stats {
            display: flex;
            gap: 20px;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-weight: bold;
            font-size: 1.2em;
        }
        .stat-label {
            font-size: 0.8em;
            color: #6c757d;
        }
        .pass {
            color: #28a745;
        }
        .fail {
            color: #dc3545;
        }
        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .summary-stat {
            background: white;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
            border: 1px solid #e9ecef;
        }
        .summary-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
        }
        .summary-label {
            color: #6c757d;
            font-size: 0.9em;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>K6 Load Test Report</h1>
            <p>Performance Test Results</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Test Summary</h2>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <div class="summary-value">${metrics.iterations?.count || 0}</div>
                        <div class="summary-label">Total Iterations</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-value">${metrics.http_reqs?.count || 0}</div>
                        <div class="summary-label">HTTP Requests</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-value">${metrics.http_req_failed?.passes || 0}</div>
                        <div class="summary-label">Failed Requests</div>
                    </div>
                    <div class="summary-stat">
                        <div class="summary-value">${metrics.vus?.max || 0}</div>
                        <div class="summary-label">Max Virtual Users</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Response Time Metrics</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Average Response Time</h3>
                        <div class="metric-value">${metrics.http_req_duration?.avg?.toFixed(2) || 'N/A'} ms</div>
                        <div class="metric-label">Mean response time across all requests</div>
                    </div>
                    <div class="metric-card">
                        <h3>Median Response Time</h3>
                        <div class="metric-value">${metrics.http_req_duration?.med?.toFixed(2) || 'N/A'} ms</div>
                        <div class="metric-label">50th percentile response time</div>
                    </div>
                    <div class="metric-card">
                        <h3>95th Percentile</h3>
                        <div class="metric-value">${metrics.http_req_duration?.['p(95)']?.toFixed(2) || 'N/A'} ms</div>
                        <div class="metric-label">95% of requests completed within this time</div>
                    </div>
                    <div class="metric-card">
                        <h3>Maximum Response Time</h3>
                        <div class="metric-value">${metrics.http_req_duration?.max?.toFixed(2) || 'N/A'} ms</div>
                        <div class="metric-label">Slowest response time observed</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Throughput Metrics</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Request Rate</h3>
                        <div class="metric-value">${metrics.http_reqs?.rate?.toFixed(2) || 'N/A'} req/s</div>
                        <div class="metric-label">Requests per second</div>
                    </div>
                    <div class="metric-card">
                        <h3>Iteration Rate</h3>
                        <div class="metric-value">${metrics.iterations?.rate?.toFixed(2) || 'N/A'} iter/s</div>
                        <div class="metric-label">Test iterations per second</div>
                    </div>
                    <div class="metric-card">
                        <h3>Data Received</h3>
                        <div class="metric-value">${(metrics.data_received?.count / 1024).toFixed(2) || 'N/A'} KB</div>
                        <div class="metric-label">Total data received</div>
                    </div>
                    <div class="metric-card">
                        <h3>Data Sent</h3>
                        <div class="metric-value">${(metrics.data_sent?.count / 1024).toFixed(2) || 'N/A'} KB</div>
                        <div class="metric-label">Total data sent</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Check Results</h2>
                <div class="checks-section">
                    ${Object.entries(checks).map(([name, check]) => `
                        <div class="check-item">
                            <div class="check-name">${name}</div>
                            <div class="check-stats">
                                <div class="stat">
                                    <div class="stat-value pass">${check.passes}</div>
                                    <div class="stat-label">Passed</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-value fail">${check.fails}</div>
                                    <div class="stat-label">Failed</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-value">${((check.passes / (check.passes + check.fails)) * 100).toFixed(1)}%</div>
                                    <div class="stat-label">Success Rate</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

const htmlReport = createHTMLReport(jsonData);
fs.writeFileSync('load-test-report.html', htmlReport);
console.log('✅ HTML report generated: load-test-report.html');
