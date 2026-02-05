const { Octokit } = require("octokit");
const fs = require("fs");
const https = require("https");

const octokit = new Octokit({ auth: process.env.GH_TOKEN });

async function fetchDevNews() {
    return new Promise((resolve) => {
        https.get("https://api.rss2json.com/v1/api.json?rss_url=https://dev.to/feed", (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data).items.slice(0, 10));
                } catch (e) {
                    resolve([]);
                }
            });
        }).on("error", () => resolve([]));
    });
}

async function run() {
    const start = new Date("2026-02-01");
    const end = new Date("2026-05-05");
    const today = new Date();

    const progress = Math.min(Math.max(Math.round(((today - start) / (end - start)) * 100), 0), 100);
    const daysLeft = Math.max(Math.ceil((end - today) / (1000 * 60 * 60 * 24)), 0);

    let profileHtml = fs.readFileSync("template.html", "utf8");
    profileHtml = profileHtml.replace(/{{PROGRESS}}/g, progress)
                             .replace(/{{DAYS}}/g, daysLeft)
                             .replace(/{{DATE}}/g, today.toDateString());

    fs.writeFileSync("README.md", profileHtml);

    const targetRepo = "Gretta-Bot-Projects";
    const userData = await octokit.rest.users.getAuthenticated();
    const owner = userData.data.login;

    try {
        await octokit.rest.repos.createForAuthenticatedUser({
            name: targetRepo,
            description: "Gretta Intelligence: Global Developer Command Center",
            auto_init: true
        });
    } catch (e) {}

    const newsItems = await fetchDevNews();
    const newsCards = newsItems.map(item => `
        <div class="card">
            <div class="card-header">
                <span class="platform-tag">GLOBAL FEED</span>
                <span class="timestamp">${new Date(item.pubDate).toLocaleTimeString()}</span>
            </div>
            <a href="${item.link}" target="_blank" class="title">${item.title}</a>
            <div class="card-footer">Source: Dev.io Intelligence</div>
        </div>
    `).join("");

    const pageContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gretta Command Center</title>
    <style>
        :root {
            --bg: #010409;
            --panel: #0d1117;
            --accent: #238636;
            --glow: #2ea043;
            --text: #c9d1d9;
            --border: #30363d;
            --blue: #58a6ff;
        }
        body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        
        .top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 30px; }
        .logo { color: var(--glow); font-size: 24px; font-weight: bold; letter-spacing: 2px; }
        .system-status { display: flex; gap: 15px; font-size: 11px; text-transform: uppercase; }
        .status-dot { color: var(--glow); animation: blink 1.5s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .monitor-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .monitor-item { background: var(--panel); border: 1px solid var(--border); padding: 15px; border-radius: 8px; text-align: center; }
        .monitor-label { font-size: 10px; color: #8b949e; margin-bottom: 5px; }
        .monitor-value { font-size: 14px; font-weight: bold; color: var(--blue); }

        .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .card { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; transition: 0.3s; position: relative; overflow: hidden; }
        .card:hover { border-color: var(--glow); transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
        .card::before { content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--glow); opacity: 0; transition: 0.3s; }
        .card:hover::before { opacity: 1; }
        
        .card-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .platform-tag { font-size: 10px; background: rgba(46, 160, 67, 0.15); color: var(--glow); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--glow); }
        .timestamp { font-size: 10px; color: #8b949e; }
        .title { display: block; color: var(--text); text-decoration: none; font-size: 16px; font-weight: 600; line-height: 1.4; margin-bottom: 15px; }
        .card-footer { font-size: 10px; color: #484f58; border-top: 1px solid var(--border); padding-top: 10px; }

        footer { text-align: center; margin-top: 50px; padding: 20px; border-top: 1px solid var(--border); color: #484f58; font-size: 12px; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="top-bar">
            <div class="logo">GRETTA // COMMAND</div>
            <div class="system-status">
                <div><span class="status-dot">●</span> System: Online</div>
                <div>Security: Level 5</div>
                <div>Uptime: 99.9%</div>
            </div>
        </div>

        <div class="monitor-grid">
            <div class="monitor-item"><div class="monitor-label">GITHUB</div><div class="monitor-value">CONNECTED</div></div>
            <div class="monitor-item"><div class="monitor-label">GITLAB</div><div class="monitor-value">SYNCED</div></div>
            <div class="monitor-item"><div class="monitor-label">NETLIFY</div><div class="monitor-value">ACTIVE</div></div>
            <div class="monitor-item"><div class="monitor-label">BITBUCKET</div><div class="monitor-value">STANDBY</div></div>
        </div>

        <div class="news-grid">
            ${newsCards}
        </div>

        <footer>
            PRODUCED BY GRETTA INTELLIGENCE &bull; AUTHORIZED ACCESS ONLY &bull; ${today.toISOString()}
        </footer>
    </div>
</body>
</html>`;

    try {
        let sha;
        try {
            const { data } = await octokit.rest.repos.getContent({ owner, repo: targetRepo, path: "index.html" });
            sha = data.sha;
        } catch (e) {}

        await octokit.rest.repos.createOrUpdateFileContents({
            owner, repo: targetRepo, path: "index.html",
            message: "Gretta: Systematic Global Intelligence Sync",
            content: Buffer.from(pageContent).toString('base64'),
            sha: sha
        });
        console.log("Gretta Command Center Updated.");
    } catch (e) {
        console.error("Gretta Error:", e.message);
    }
}

run();