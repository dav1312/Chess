const repo = "official-stockfish/Stockfish";
const apiUrl = `https://api.github.com/repos/${repo}/commits`;
const commitUrl = `https://github.com/${repo}/commit/`;
const perPage = 100;
let currentPage = 1;

function shouldHideText(expander) {
    return expander.scrollHeight > expander.clientHeight
}

function calcEloFromWDL(w, d, l) {
    const score = w + d / 2;
    const total = w + d + l;
    const percentage = score / total;
    return calcEloDifference(percentage);
}

function calcEloDifference(percentage) {
    return (-400 * Math.log(1 / percentage - 1)) / Math.LN10;
}

function setSign(v) {
    return v > 0 ? "+" : "";
}

function getPatchType(message) {
    const gainerRegex = /LLR:.*?[<\[\{]0/;
    const SimplRegex = /LLR:.*?[<\[\{]-/;
    if (message.includes("functional change")) {
        return "var(--bs-secondary)";
    } else if (gainerRegex.test(message)) {
        return "rgba(var(--bs-success-rgb), 1)";
    } else if (SimplRegex.test(message)) {
        return "var(--bs-blue)";
    }
    return "initial";
}

function getRelativeTime(value, unit) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    return rtf.format(value, unit);
}

function formatRelativeTime(dateString) {
    if (!window.Intl || typeof window.Intl.RelativeTimeFormat !== "function") {
        return dateString.replace(/T|Z/g, " ");
    }
    const date = new Date(dateString);
    const now = new Date();
    const timeDiff = date.getTime() - now.getTime();
    if (timeDiff >= -60000) {
        return getRelativeTime(Math.ceil(timeDiff / 1000), "second");
    }
    if (timeDiff >= -3600000) {
        return getRelativeTime(Math.ceil(timeDiff / 60000), "minute");
    }
    if (timeDiff >= -86400000) {
        return getRelativeTime(Math.ceil(timeDiff / 3600000), "hour");
    }
    if (timeDiff >= -2592000000) {
        return getRelativeTime(Math.ceil(timeDiff / 86400000), "day");
    }
    if (timeDiff >= -31104000000) {
        return getRelativeTime(Math.ceil(timeDiff / 2592000000), "month");
    }
    return dateString.replace(/T|Z/g, " ");
}

function fetchCommits(page) {
    const url = `${apiUrl}?per_page=${perPage}&page=${page}`;

    fetch(url)
        .then(response => response.json())
        .then(commits => {
            const commitsBody = document.getElementById('commitsBody');
            commitsBody.innerHTML = '';

            commits.forEach(commit => {
                const commitRow = document.createElement('tr');

                let committerInfo = "";
                if (commit.committer === null || Object.keys(commit.committer).length === 0) {
                    committerInfo = `<abbr class="text-danger" title="Issue with committer.\nCheck console for more info.">${commit.commit.committer.name}</abbr>`;
                    console.log("Issue with committer:", [commit.commit.committer.name, commit.commit.committer.email, commit.sha.substring(0, 8), commit]);
                } else {
                    committerInfo = `<a href="${commit.committer.html_url}" target="_blank">${commit.committer.login}</a>`;
                }
                const committerString = `<span class="d-block d-sm-inline"><strong>Committer: </strong>${committerInfo}</span>`;

                let authorInfo = "";
                if (commit.author === null || Object.keys(commit.author).length === 0) {
                    authorInfo = `<abbr class="text-danger" title="Issue with author.\nCheck console for more info.">${commit.commit.author.name}</abbr>`;
                    console.log("Issue with author:", [commit.commit.author.name, commit.commit.author.email, commit.sha.substring(0, 8), commit]);
                } else {
                    authorInfo = `<a href="${commit.author.html_url}" target="_blank">${commit.author.login}</a>`;
                }
                let authorString = "";
                if (
                    ((commit.author === null || Object.keys(commit.author).length === 0) &&
                        commit.commit.author.name !== commit.commit.committer.name) ||
                    commit.commit.author.email !== commit.commit.committer.email
                ) {
                    authorString = `<span class="d-block d-sm-inline"><strong>Author: </strong>${authorInfo}</span><span class="d-none d-sm-inline"> | </span>`;
                }

                const [firstLine, ...restOfTextLines] = formatCommitMessage(commit.commit.message).split('\n');
                const restOfText = restOfTextLines.join('\n');
                commitRow.innerHTML = `<td class="p-3">
                    <div class="d-flex mb-0">
                        <div>
                            ${authorString + committerString}
                            <span class="d-none d-sm-inline"> | </span>
                            <span class="d-block d-sm-inline mb-0" title="${commit.commit.committer.date.replace(/T|Z/g, " ")}">${formatRelativeTime(commit.commit.committer.date)}</span>
                        </div>
                        <div class="ms-auto">
                            <a href="${commitUrl + commit.sha}" target="_blank" title="${commit.sha}" class="monospace">${commit.sha.substring(0, 8)}</a>
                        </div>
                    </div>
                    <p class="code small monospace mb-0 fs-5"><a href="${commitUrl + commit.sha}" target="_blank" title="${commit.sha}"><strong>${firstLine}</strong></a></p>
                    <p class="code small monospace mb-0">${restOfText}</p>
                </td>`;
                const patchType = getPatchType(commit.commit.message);
                commitRow.style.borderLeft = `5px solid ${patchType}`;
                commitsBody.appendChild(commitRow);
            });
            document.getElementById('curr').textContent = currentPage;
            const prevBtn = document.getElementById('prev');
            if (currentPage === 1) {
                prevBtn.classList.add("disabled");
            } else {
                prevBtn.classList.remove("disabled");
            }
        })
        .catch(error => {
            console.error('Error fetching commits:', error);
        });
}

const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#x60;',
    '=': '&#x3D;',
    '&#': '&#x26;&#x23;'
};

function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=]/g, s => entityMap[s]);
}

function formatCommitMessage(message) {
    message = escapeHtml(message);

    const urlRegex = /\bhttps?:\/\/[^\s\/$.?#].[^\s]*/gi;
    message = message.replace(urlRegex, '<a href="$&" target="_blank">$&</a>');

    const nnueRegex = /\bnn-\w{12}\.nnue/g;
    message = message.replace(nnueRegex, '<a href="https://tests.stockfishchess.org/api/nn/$&" target="_blank">$&</a>');

    const ptnmlRegex = /Ptnml\(0-2\): (\d+), (\d+), (\d+), (\d+), (\d+)/g;
    message = message.replace(ptnmlRegex, (match, ll, ld, d, wd, ww) => {
        const l = parseInt(ll) + parseInt(ld);
        const w = parseInt(ww) + parseInt(wd);
        const elo = calcEloFromWDL(parseInt(w), parseInt(d), parseInt(l)) / 2;
        const sign = setSign(elo);
        return `${match} (Elo: <span class="text-${sign === "+" ? "success" : "danger"}">${sign + elo.toFixed(2)}</span>)`;
    });

    const eloRegex = /Total: \d+ W: (\d+) L: (\d+) D: (\d+)/g;
    message = message.replace(eloRegex, (match, w, l, d) => {
        const elo = calcEloFromWDL(parseInt(w), parseInt(d), parseInt(l));
        const sign = setSign(elo);
        return `${match} (Elo: <span class="text-${sign === "+" ? "success" : "danger"}">${sign + elo.toFixed(2)}</span>)`;
    });

    return message;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        fetchCommits(currentPage);
    }
}

function nextPage() {
    currentPage++;
    fetchCommits(currentPage);
}

document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") {
        prevPage();
    } else if (event.key === "ArrowRight") {
        nextPage();
    }
});

document.getElementById('prev').addEventListener('click', prevPage);

document.getElementById('next').addEventListener('click', nextPage);

async function getLatestRelease() {
    const userOS = getUserOS();
    const dropdownMenu = document.querySelector("#mainDownloadBtn .dropdown-menu");
    const notUserOSDownloads = document.getElementById("notUserOSDownloads");

    if (userOS === "Other") {
        console.log("Unknown userAgent");
        document.getElementById("mainDownloadBtn").classList.add("d-none");
    } else {
        document.getElementById("userOS").textContent = "for " + userOS;
        document.getElementById("mainDownloadBtn").classList.remove("d-none");
    }
    // Clear existing dropdown items and not userOS downloads
    dropdownMenu.innerHTML = "";
    notUserOSDownloads.innerHTML = "";

    // Fetch latest release information from GitHub API
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=1`);
        const releasesData = await response.json();

        if (Array.isArray(releasesData) && releasesData.length > 0) {
            document.getElementById("accordionDownload").classList.remove("d-none");
            const latestRelease = releasesData[0];
            document.getElementById("downloadVersion").title = latestRelease.name;

            // Group assets by OS
            const assetsByOS = {};

            latestRelease.assets.forEach(asset => {
                const os = getOSFromAssetName(asset.name);
                if (!assetsByOS[os]) {
                    assetsByOS[os] = [];
                }
                assetsByOS[os].push(asset);
            });

            // Add dropdown items for userOS
            const osAssets = assetsByOS[userOS];
            if (osAssets) {
                osAssets.sort((a, b) => customSortKey(a) - customSortKey(b));
                osAssets.forEach(asset => {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.className = "dropdown-item";
                    a.href = asset.browser_download_url;
                    a.textContent = getAssetName(asset.name);
                    li.appendChild(a);
                    dropdownMenu.appendChild(li);
                });
            }

            // Add not userOS downloads
            Object.keys(assetsByOS).forEach(os => {
                if (os !== userOS) {
                    const notUserOSDiv = createNotUserOSDiv(os, assetsByOS[os]);
                    notUserOSDownloads.appendChild(notUserOSDiv);
                }
            });
        }
    } catch (error) {
        console.error("Error fetching release information:", error);
        document.getElementById("accordionDownload").classList.add("d-none");
    }
}

function getUserOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) return "Windows";
    if (userAgent.includes("android") || userAgent.includes("raspberry")) return "ARM";
    if (userAgent.includes("linux")) return "Linux";
    if (userAgent.includes("mac")) return "MacOS";
    return "Other";
}

function getOSFromAssetName(assetName) {
    const osMatches = {
        "windows": "Windows",
        "ubuntu": "Linux",
        "android": "ARM",
        "macos": "MacOS"
    };
    for (const os in osMatches) {
        if (assetName.includes(os)) {
            return osMatches[os];
        }
    }
    return "Other";
}

function getAssetName(assetName) {
    return assetName.replace(/\w+?-\w+?-(.*?)\..*/, "$1");
}

function customSortKey(obj) {
    const order = [
        "apple-silicon",
        "armv8-dotprod",
        "armv8",
        "armv7-neon",
        "armv7",
        "x86-64-vnni512",
        "x86-64-vnni256",
        "x86-64-avx512",
        "x86-64-avxvnni",
        "x86-64-bmi2",
        "x86-64-avx2",
        "x86-64-sse41-popcnt",
        "x86-64-ssse3",
        "x86-64-sse3-popcnt",
        "x86-64",
        "x86-32-sse41-popcnt",
        "x86-32-sse2",
        "x86-32",
        "general-64",
        "general-32",
    ];

    for (let i = 0; i < order.length; i++) {
        if (obj.name.includes(order[i])) {
            return i;
        }
    }
    return order.length;
}

function createNotUserOSDiv(os, assets) {
    const notUserOSDiv = document.createElement("div");
    notUserOSDiv.className = "rounded border mt-3 p-3";

    const assetsList = assets.sort((a, b) => customSortKey(a) - customSortKey(b)).map(asset => `
        <li>
            <a class="dropdown-item" href="${asset.browser_download_url}">
                ${getAssetName(asset.name)}
            </a>
        </li>`).join('');

    const dropdownHTML = `
        <div class="d-flex">
            <div class="input-group">
                <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    Download
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    ${assetsList}
                </ul>
            </div>
        </div>`;

    const innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div class="h4 mb-0">${os}</div>
            ${dropdownHTML}
        </div>`;

    notUserOSDiv.innerHTML = innerHTML;

    return notUserOSDiv;
}

fetchCommits(currentPage);
getLatestRelease();
