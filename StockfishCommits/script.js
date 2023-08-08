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
                const committerString = `<strong>Committer: </strong><a href="${commit.committer.html_url}" target="_blank">${commit.committer.login}</a>`;
                let authorString = "";
                if (commit.author === null) {
                    authorString = `<strong>Author: </strong>${commit.commit.author.name} | `;
                } else if (commit.author.id !== commit.committer.id) {
                    authorString = `<strong>Author: </strong><a href="${commit.author.html_url}" target="_blank">${commit.author.login}</a> | `;
                }
                const [firstLine, ...restOfTextLines] = formatCommitMessage(commit.commit.message).split('\n');
                const restOfText = restOfTextLines.join('\n');
                commitRow.innerHTML = `<td class="p-3">
                    <div class="d-flex mb-0">
                        <div>${authorString + committerString}<span class="mb-0" title="${commit.commit.committer.date.replace(/T|Z/g, " ")}"> | ${formatRelativeTime(commit.commit.committer.date)}</span></div>
                        <div class="ms-auto"><a href="${commitUrl + commit.sha}" target="_blank" title="${commit.sha}" class="monospace">${commit.sha.substring(0,8)}</a></div>
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

function formatCommitMessage(message) {
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

function updatePagination() {
    document.getElementById('prev').addEventListener('click', () => {
        event.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            fetchCommits(currentPage);
        }
    });

    document.getElementById('next').addEventListener('click', () => {
        event.preventDefault();
        currentPage++;
        fetchCommits(currentPage);
    });
}

function getUserOS() {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf("Win") !== -1) {
        return "Windows";
    } else if (userAgent.indexOf("Linux") !== -1) {
        return "Linux";
    } else if (userAgent.indexOf("Mac") !== -1) {
        return "MacOS";
     } else if (userAgent.indexOf("Android") !== -1) {
        return "Android";
    }
    return "Unknown";
}

const releases = {
    "Windows": [
        ["VNNI-512", "windows-x86-64-vnni512.zip"],
        ["VNNI-256", "windows-x86-64-vnni256.zip"],
        ["AVX-512", "windows-x86-64-avx512.zip"],
        ["BMI-2", "windows-x86-64-bmi2.zip"],
        ["AVX-2", "windows-x86-64-avx2.zip"],
        ["SSE41-POPCNT", "windows-x86-64-sse41-popcnt.zip"],
        ["64-bit", "windows-x86-64.zip"],
    ],
    "Linux": [
        ["VNNI-512", "ubuntu-x86-64-vnni512.tar"],
        ["VNNI-256", "ubuntu-x86-64-vnni256.tar"],
        ["AVX-512", "ubuntu-x86-64-avx512.tar"],
        ["BMI-2", "ubuntu-x86-64-bmi2.tar"],
        ["AVX-2", "ubuntu-x86-64-avx2.tar"],
        ["SSE41-POPCNT", "ubuntu-x86-64-sse41-popcnt.tar"],
        ["64-bit", "ubuntu-x86-64.tar"],
        ["32-bit", "ubuntu-x86-32.tar"],
    ],
    "MacOS": [
        ["BMI-2", "macos-x86-64-bmi2.tar"],
        ["AVX-2", "macos-x86-64-avx2.tar"],
        ["SSE41-POPCNT", "macos-x86-64-sse41-popcnt.tar"],
        ["64-bit", "macos-x86-64.tar"],
    ],
    "Android": [
        ["ARMv8 DotProd", "android-armv8-dotprod.tar"],
        ["ARMv8", "android-armv8.tar"],
        ["ARMv7 Neon", "android-armv7-neon.tar"],
        ["ARMv7", "android-armv7.tar"],
    ],
}

function getLatestRelease() {
    console.log("Getting releases...");
    const downloadLink = `https://github.com/${repo}/releases/download/stockfish-dev-20230807-5c2111cc/stockfish-`;
    const userOS = getUserOS();
    const dropdownMenu = document.querySelector("#mainDownloadBtn .dropdown-menu");

    if (userOS === "Unknown") {
        console.error("Unknown userAgent");
        document.getElementById("mainDownloadBtn").classList.add("d-none");
    } else {
        document.getElementById("userOS").textContent = "for " + userOS;
        document.getElementById("mainDownloadBtn").classList.remove("d-none");
        dropdownMenu.innerHTML = "";
        const osReleases = releases[userOS];
        if (osReleases) {
            osReleases.forEach(release => {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.className = "dropdown-item";
                a.href = `${downloadLink}${release[1]}`;
                a.textContent = release[0];
                li.appendChild(a);
                dropdownMenu.appendChild(li);
            });
        }
    }

    Object.keys(releases).forEach(os => {
        if (os !== userOS) {
            const notUserOSDiv = document.createElement("div");
            notUserOSDiv.className = "rounded border mt-3 p-3 notUserOS";

            const innerDiv = document.createElement("div");
            innerDiv.className = "d-flex justify-content-between align-items-center";

            const h4 = document.createElement("div");
            h4.className = "h4 mb-0";
            h4.textContent = os;
            innerDiv.appendChild(h4);

            const dropdownDiv = document.createElement("div");
            dropdownDiv.className = "d-flex";

            const inputGroup = document.createElement("div");
            inputGroup.className = "input-group";

            const button = document.createElement("button");
            button.className = "btn btn-outline-primary dropdown-toggle";
            button.setAttribute("type", "button");
            button.setAttribute("data-bs-toggle", "dropdown");
            button.textContent = "Download";

            const ul = document.createElement("ul");
            ul.className = "dropdown-menu dropdown-menu-end";

            releases[os].forEach(release => {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.className = "dropdown-item";
                a.href = `${downloadLink}${release[1]}`;
                a.textContent = release[0];
                li.appendChild(a);
                ul.appendChild(li);
            });

            inputGroup.appendChild(button);
            inputGroup.appendChild(ul);
            dropdownDiv.appendChild(inputGroup);
            innerDiv.appendChild(dropdownDiv);
            notUserOSDiv.appendChild(innerDiv);
            notUserOSDownloads.appendChild(notUserOSDiv);
        }
    });
}

fetchCommits(currentPage);
updatePagination();
getLatestRelease();
