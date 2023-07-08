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
                commitRow.innerHTML = `
<td class="p-3">
    <p class="mb-0">${authorString + committerString}</p>
    <p class="mb-0"><strong>Commit: </strong><a href="${commitUrl + commit.sha}" target="_blank">${commit.sha}</a></p>
    <p class="mb-0"><strong>Date: </strong>${commit.commit.author.date.replace("T", " ").replace("Z", "")}</p>
    <p class="code small monospace mb-0">${formatCommitMessage(commit.commit.message)}</p>
</td>
                `;
                const patchType = getPatchType(commit.commit.message);
                commitRow.style.borderLeft = `5px solid ${patchType}`;
                commitsBody.appendChild(commitRow);

                document.getElementById('curr').textContent = currentPage;
            });
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
        const elo = calcEloFromWDL(parseInt(w), parseInt(d), parseInt(l));
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
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const previousPage = document.createElement('li');
    previousPage.classList.add("page-item");
    previousPage.innerHTML = `<a id="prev" class="page-link" href="#">Previous</a>`;
    previousPage.addEventListener('click', () => {
        event.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            fetchCommits(currentPage);
        }
    });

    const nextPage = document.createElement('li');
    nextPage.classList.add("page-item");
    nextPage.innerHTML = `<a id="next" class="page-link" href="#">Next</a>`;
    nextPage.addEventListener('click', () => {
        event.preventDefault();
        currentPage++;
        fetchCommits(currentPage);
    });

    pagination.appendChild(previousPage);
    pagination.appendChild(nextPage);
}

function updatePagination1() {
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

fetchCommits(currentPage);
updatePagination1();
