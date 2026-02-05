const { Octokit } = require("octokit");
const fs = require("fs");

const octokit = new Octokit({ auth: process.env.GH_TOKEN });

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

    try {
        const repoName = `holiday-project-plan-${today.getMonth() + 1}`;
        await octokit.rest.repos.createForAuthenticatedUser({
            name: repoName,
            description: "Auto-generated project folder",
            auto_init: true
        });
    } catch (e) {}
}

run();