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
                    resolve(JSON.parse(data).items.slice(0, 5));
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

    let html = fs.readFileSync("template.html", "utf8");
    html = html.replace(/{{PROGRESS}}/g, progress)
               .replace(/{{DAYS}}/g, daysLeft)
               .replace(/{{DATE}}/g, today.toDateString());

    fs.writeFileSync("README.md", html);

    const targetRepo = "Gretta-Bot-Projects";
    const userData = await octokit.rest.users.getAuthenticated();
    const owner = userData.data.login;

    try {
        await octokit.rest.repos.createForAuthenticatedUser({
            name: targetRepo,
            description: "Managed by Gretta Bot",
            auto_init: true
        });
    } catch (e) {}

    const newsItems = await fetchDevNews();
    const newsList = newsItems.map(item => `<li><a href="${item.link}">${item.title}</a></li>`).join("");
    const pageContent = `<html><head><title>Gretta Bot News Feed</title></head><body><h1>Dev Feed</h1><ul>${newsList}</ul><p>Last Gretta Sync: ${today.toISOString()}</p></body></html>`;

    try {
        let sha;
        try {
            const { data } = await octokit.rest.repos.getContent({ owner, repo: targetRepo, path: "index.html" });
            sha = data.sha;
        } catch (e) {}

        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo: targetRepo,
            path: "index.html",
            message: "Gretta Bot: Daily News & Web Update",
            content: Buffer.from(pageContent).toString('base64'),
            sha: sha
        });
    } catch (e) {}
}

run();