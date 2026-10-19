import { mkdir, writeFile } from "node:fs/promises";

const user = process.env.GITHUB_ACTOR || "boobaGreen";
const token = process.env.GITHUB_TOKEN;
const headers = { Accept: "application/vnd.github+json", "User-Agent": `${user}-profile-readme`, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
const response = await fetch(`https://api.github.com/users/${user}/events/public?per_page=100`, { headers });
if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
const events = await response.json();

const days = 42;
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const series = Array.from({ length: days }, (_, index) => { const date = new Date(today); date.setUTCDate(date.getUTCDate() - (days - 1 - index)); return { date: date.toISOString().slice(0, 10), count: 0 }; });
const byDate = new Map(series.map((day) => [day.date, day]));
for (const event of events) { const day = byDate.get(event.created_at?.slice(0, 10)); if (day) day.count += event.type === "PushEvent" ? Math.max(event.payload?.size || 1, 1) : 1; }

const max = Math.max(...series.map((day) => day.count), 1);
const total = series.reduce((sum, day) => sum + day.count, 0);
const active = series.filter((day) => day.count > 0).length;
const bars = series.map((day, index) => { const height = day.count ? Math.max(7, Math.round((day.count / max) * 70)) : 3; const x = 34 + index * 25.8; const y = 132 - height; const opacity = day.count ? (0.48 + (day.count / max) * 0.52).toFixed(2) : "0.18"; return `<rect x="${x.toFixed(1)}" y="${y}" width="15" height="${height}" rx="4" fill="url(#bar)" opacity="${opacity}"><title>${day.date}: ${day.count} public signals</title></rect>`; }).join("");

const svg = `<svg width="1200" height="190" viewBox="0 0 1200 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc"><title id="title">${user}'s recent GitHub activity pulse</title><desc id="desc">${total} public activity signals across ${active} active days in the last ${days} days.</desc><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#09131E"/><stop offset="1" stop-color="#0D1927"/></linearGradient><linearGradient id="bar" y2="1"><stop stop-color="#7CF4C5"/><stop offset="1" stop-color="#4E9ED4"/></linearGradient><pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="#A8C7E8" stroke-opacity=".05"/></pattern></defs><rect width="1200" height="190" rx="18" fill="url(#bg)"/><rect width="1200" height="190" rx="18" fill="url(#grid)"/><rect x="20" y="20" width="1160" height="150" rx="12" fill="none" stroke="#A8C7E8" stroke-opacity=".12"/><g font-family="Consolas,monospace"><text x="34" y="48" fill="#7CF4C5" font-size="12" letter-spacing="2">ACTIVITY / LAST ${days} DAYS</text><text x="1160" y="48" text-anchor="end" fill="#A8BED2" font-size="12">${active} ACTIVE DAYS · ${total} SIGNALS</text>${bars}<text x="34" y="157" fill="#526C84" font-size="10">${series[0].date}</text><text x="1160" y="157" text-anchor="end" fill="#526C84" font-size="10">UPDATED ${today.toISOString().slice(0, 10)} UTC</text></g></svg>`;
await mkdir("assets", { recursive: true });
await writeFile("assets/activity.svg", svg);
console.log(`Generated activity.svg with ${total} signals across ${active} active days.`);
