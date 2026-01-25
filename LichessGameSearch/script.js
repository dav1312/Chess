// https://github.com/lichess-org/lila/blob/b2bb9cb7cf72c87f1e6814e3bc380f1f2f7a1cd7/modules/mod/src/main/SandbagWatch.scala
const getSuspiciousGameInfo = (gameData) => {
    // Pre-checks: Must be rated, have a winner, and not be from the 'api' source.
    if (!gameData.rated || !gameData.winner || gameData.source === 'api') {
        return {};
    }

    const winnerColor = gameData.winner;
    const loserColor = winnerColor === 'white' ? 'black' : 'white';
    const winnerPlayer = gameData.players[winnerColor];
    const loserPlayer = gameData.players[loserColor];

    // Winner must have gained a positive amount of rating.
    if (!winnerPlayer || !winnerPlayer.ratingDiff || winnerPlayer.ratingDiff <= 0) {
        return {};
    }

    // Game must be short. Determine the move threshold (`minTurns` in plies).
    const playedPlies = gameData.moves.split(' ').length;
    const loserRating = loserPlayer?.rating;

    const baseMinTurns = (loserRating > 1800) ? 20
                        : (loserRating > 1600) ? 12
                        : 8;

    const variant  = (gameData.variant || '').toLowerCase();
    const minTurns = (variant === 'atomic') ? baseMinTurns / 4
                    : (variant === 'kingofthehill' || variant === 'threecheck') ? baseMinTurns / 2
                    : baseMinTurns;

    // If the game is longer than the threshold, it's normal.
    if (playedPlies > minTurns) {
        return {};
    }

    // If all checks pass, the game is suspicious.
    return {
        sandbagger: loserColor,
        booster: winnerColor,
    };
};

// Safely creates a DOM element.
const createElement = (tag, options = {}, children = []) => {
    const el = document.createElement(tag);
    // Whitelist properties
    const properties = ['className', 'id', 'textContent', 'title', 'href', 'src', 'role', 'target', 'rel'];

    Object.entries(options).forEach(([key, value]) => {
        if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (properties.includes(key)) {
            if ((key === 'href' || key === 'src') && String(value).trim().toLowerCase().startsWith('javascript:')) {
                console.warn(`Blocked potentially unsafe URL: ${value}`);
            }
            el[key] = value;
        } else {
            console.warn(`Attempted to set unsafe or unknown property: ${key}`);
        }
    });

    children.forEach(child => {
        if (child) {
            el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        }
    });
    return el;
};

const patronColors = [
    "hsl(72, 38%, 51.6%)",
    "hsl(108, 38%, 56.7%)",
    "hsl(144, 49%, 51.2%)",
    "hsl(180, 52%, 48.1%)",
    "hsl(216, 89%, 72.2%)",
    "hsl(252, 83%, 79.1%)",
    "hsl(288, 81%, 74.5%)",
    "hsl(324, 76%, 73.4%)",
    "hsl(0, 90%, 75.7%)",
    "hsl(36, 74%, 54.2%)"
];

const initAutocomplete = (inputId, listId) => {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    let timer;

    input.addEventListener('input', () => {
        const term = input.value.trim();
        clearTimeout(timer);
        list.innerHTML = '';
        list.style.display = 'none';

        if (term.length >= 3) {
            timer = setTimeout(async () => {
                try {
                    const response = await fetch(`https://lichess.org/api/player/autocomplete?term=${term}&object=1`);
                    if (!response.ok) return;
                    const data = await response.json();

                    if (data.result && data.result.length > 0) {
                        list.style.display = 'block';
                        data.result.forEach(user => {
                            const item = createElement('button', { 
                                className: 'list-group-item list-group-item-action d-flex align-items-center' 
                            });

                            if (user.patron) {
                                const color = patronColors[(user.patronColor || 1) - 1] || patronColors[0];
                                item.appendChild(createElement('span', { 
                                    className: 'patron-icon', 
                                    style: { backgroundColor: color } 
                                }));
                            }

                            if (user.title) {
                                item.appendChild(createElement('span', { 
                                    className: `px-1 fw-bold font-monospace me-1 ${user.title === "BOT" ? "text-bg-bot" : "text-bg-title"} bg-opacity-100 rounded-1`, 
                                    textContent: user.title 
                                }));
                            }

                            item.appendChild(createElement('span', { textContent: user.name }));

                            item.addEventListener('click', (e) => {
                                e.preventDefault();
                                input.value = user.name;
                                list.style.display = 'none';
                            });
                            list.appendChild(item);
                        });
                    }
                } catch (err) { console.error(err); }
            }, 250);
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !list.contains(e.target)) {
            list.style.display = 'none';
        }
    });
};

initAutocomplete('username', 'username-ac');
initAutocomplete('versus', 'versus-ac');

document.getElementById('search-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const relativeTime = (epoch) => {
        const seconds = Math.floor((Date.now() - epoch) / 1000);
        const units = ['Y', 'M', 'D', 'h', 'm', 's'];
        const values = [31536000, 2592000, 86400, 3600, 60, 1];

        for (let i = 0; i < units.length; i++) {
            if (seconds >= values[i]) {
                return `${Math.floor(seconds / values[i])} ${units[i]} ago`;
            }
        }

        return 'Just now';
    }

    const username = document.getElementById('username').value.trim();
    const playerDataContainer = document.getElementById('playerData');
    playerDataContainer.innerHTML = ''; // Clear previous results

    let response = await fetch(`https://lichess.org/api/user/${username}`);
    const data = await response.json();
    if (response.ok) {
        // Player Info Card
        const titleSpan = data.title ? createElement('span', {
            className: `px-1 fw-bold font-monospace ${data.title === "BOT" ? "text-bg-bot" : "text-bg-title"} bg-opacity-100 rounded-1`,
            textContent: data.title
        }) : null;
        const playerInfoCard = createElement('div', { className: 'col-md-6' }, [
            createElement('div', { className: 'card h-100' }, [
                createElement('div', { className: 'card-body' }, [
                    createElement('div', { className: 'row' }, [
                        createElement('div', { className: 'col-md-6' }, [titleSpan, ` ${data.id}`]),
                        createElement('div', { className: 'col-md-6', textContent: `Joined: ${new Date(data.createdAt).toISOString().substring(0, 10)} (${relativeTime(data.createdAt)})` }),
                        createElement('div', { className: 'col-md-6', textContent: `Active: ${relativeTime(data.seenAt)}` }),
                        createElement('div', { className: 'col-md-6', textContent: `Verified: ${data.verified ? "Yes" : "No"}` }),
                        createElement('div', { className: 'col-md-6', textContent: `Patron: ${data.patron ? "Yes" : "No"}` }),
                        createElement('div', { className: 'col-md-6' }, ['Banned: ', data.tosViolation ? createElement('span', { className: 'text-danger', textContent: 'Yes' }) : 'No'])
                    ])
                ])
            ])
        ]);

        // Player Stats Card
        const winPerc = (data.count.win / data.count.all * 100).toFixed(2);
        const drawPerc = (data.count.draw / data.count.all * 100).toFixed(2);
        const lossPerc = (data.count.loss / data.count.all * 100).toFixed(2);
        const playerStatsCard = createElement('div', { className: 'col-md-6' }, [
            createElement('div', { className: 'card h-100' }, [
                createElement('div', { className: 'card-body' }, [
                    createElement('div', { className: 'row' }, [
                        createElement('div', { className: 'col-md-4', textContent: `Total: ${data.count.all}` }),
                        createElement('div', { className: 'col-md-4', textContent: `Rated: ${data.count.rated} (${(data.count.rated / data.count.all * 100).toFixed(2)}%)` }),
                        createElement('div', { className: 'col-md-4', textContent: `AI: ${data.count.ai} (${(data.count.ai / data.count.all * 100).toFixed(2)}%)` }),
                        createElement('div', { className: 'col-md-4', textContent: `Win: ${data.count.win} (${winPerc}%)` }),
                        createElement('div', { className: 'col-md-4', textContent: `Draw: ${data.count.draw} (${drawPerc}%)` }),
                        createElement('div', { className: 'col-md-4', textContent: `Loss: ${data.count.loss} (${lossPerc}%)` }),
                        createElement('div', { className: 'col-md-12' }, [
                            createElement('div', { className: 'progress', role: 'progressbar', style: { height: '1.5rem' } }, [
                                createElement('div', { className: 'progress-bar bg-success', style: { width: `${winPerc}%` }, textContent: `${winPerc}%` }),
                                createElement('div', { className: 'progress-bar bg-secondary', style: { width: `${drawPerc}%` }, textContent: `${drawPerc}%` }),
                                createElement('div', { className: 'progress-bar bg-danger', style: { width: `${lossPerc}%` }, textContent: `${lossPerc}%` })
                            ])
                        ])
                    ])
                ])
            ])
        ]);
        playerDataContainer.appendChild(playerInfoCard);
        playerDataContainer.appendChild(playerStatsCard);
    } else {
        playerDataContainer.textContent = 'Error: ' + response.statusText;
    }

    let url = 'https://lichess.org/api/games/user/' + username + '?accuracy=true&max=100';
    const until = document.getElementById('until').value;
    if (until) {
        url += `&until=${new Date(until).getTime()}`;
    }
    if (document.getElementById('oldFirst').checked) {
        url += '&sort=dateAsc';
    }
    if (document.getElementById('onlyRated').checked) {
        url += '&rated=true';
    }
    const versus = document.getElementById('versus').value.trim();
    if (versus) {
        url += `&vs=${versus}`;
    }
    const checkedPerfTypes = Array.from(document.querySelectorAll('input[name="perfType"]:checked'))
                                    .map(checkbox => checkbox.value);
    if (checkedPerfTypes.length > 0) {
        url += `&perfType=${checkedPerfTypes.join(',')}`;
    }

    response = await fetch(url, {headers: {'Accept': 'application/x-ndjson'}});
    const games = await response.text();

    const resultsTable = document.getElementById('results');
    resultsTable.innerHTML = ''; // Clear previous results

    // Create Results Header
    const thead = createElement('thead', { className: 'bg-body' }, [
        createElement('tr', {}, [
            createElement('th', { textContent: 'Speed' }),
            createElement('th', { textContent: 'Player' }),
            createElement('th', { className: 'text-center', textContent: 'Accuracy' }),
            createElement('th', { className: 'text-center', textContent: 'Moves' }),
            createElement('th', { className: 'text-center', textContent: 'Result' }),
            createElement('th', { className: 'text-center', textContent: 'Date' })
        ])
    ]);
    resultsTable.appendChild(thead);

    const playerTemplate = (gameData, player, playerColor, suspiciousInfo, username) => {
        const isUser = "user" in player;
        const isCurrentUser = isUser && player.user.name.toLowerCase() === username.toLowerCase();
        const hasTitle = isUser && "title" in player.user;
        const isAI = "aiLevel" in player;
        const badge = hasTitle ? player.user.title : isAI ? "SF" : "";
        const badgeClass = hasTitle ? (player.user.title === "BOT" ? "text-bg-bot" : "text-bg-title") : isAI ? "text-bg-success" : "";
        const name = isUser ? player.user.name : isAI ? `Stockfish level ${player.aiLevel}` : "Anonymous";
        const nameClass = isCurrentUser ? `fw-bold ${gameData.winner ? gameData.winner === playerColor ? "text-success" : "text-danger" : ""}` : "";
        const rating = "rating" in player;
        const ratingProvisional = rating && player.provisional ? "?" : "";
        const ratingDiff = "ratingDiff" in player;
        const ratingDiffClass = player.ratingDiff === 0 ? "" : player.ratingDiff > 0 ? "text-success" : "text-danger";
        const ratingDiffPrefix = player.ratingDiff === 0 ? "±" : player.ratingDiff > 0 ? "+" : "";

        let outcomeIcon = '';
        let outcomeTitle = '';
        if (suspiciousInfo.booster === playerColor) { outcomeIcon = '🔺'; outcomeTitle = 'Potential Boost'; }
        else if (suspiciousInfo.sandbagger === playerColor) { outcomeIcon = '🔻'; outcomeTitle = 'Potential Sandbag'; }

        const children = [];
        
        if (isUser && player.user.patron) {
            const color = patronColors[(player.user.patronColor || 1) - 1] || patronColors[0];
            children.push(createElement('span', { 
                className: 'patron-icon', 
                style: { backgroundColor: color } 
            }));
        }

        if (badge) {
            children.push(createElement('span', { className: `px-1 fw-bold font-monospace ${badgeClass} bg-opacity-100 rounded-1`, textContent: badge }));
            children.push(' ');
        }
        children.push(createElement('span', { className: nameClass, textContent: name }));
        if (rating) {
            children.push(` • `);
            children.push(createElement('span', { textContent: `${player.rating}${ratingProvisional}` }));
        }
        if (ratingDiff) {
            children.push(createElement('span', { className: ratingDiffClass, textContent: ` ${ratingDiffPrefix}${player.ratingDiff}` }));
        }
        if (outcomeIcon) {
            children.push(createElement('span', { title: outcomeTitle, textContent: outcomeIcon }));
        }
        return createElement('div', { className: !isCurrentUser ? "notSearchedUser" : "" }, children);
    };

    const gameAnalysis = (player, username) => {
        if (!player.analysis) return null;
        const isUser = "user" in player;
        const isCurrentUser = isUser && player.user.name.toLowerCase() === username.toLowerCase();
        const highAccuracy = player.analysis.accuracy >= 95 ? "text-bg-success bg-opacity-100 rounded-1" : "";
        return createElement('div', { className: !isCurrentUser ? "notSearchedUser" : "" }, [
            createElement('span', { className: `px-1 ${highAccuracy}`, textContent: `${player.analysis.accuracy}%` })
        ]);
    };

    const tbody = createElement('tbody');
    games.split('\n').forEach(function(game) {
        if (game.trim() !== '') {
            const gameData = JSON.parse(game);
            const suspiciousInfo = getSuspiciousGameInfo(gameData);
            let bannedPlayersClass = "";
            if (gameData.rated && gameData.moves.split(' ').length > 18 && !("ratingDiff" in gameData.players.white) && !("ratingDiff" in gameData.players.black)) {
                bannedPlayersClass = "bg-danger text-white bg-opacity-25";
            }

            const clockText = "clock" in gameData ? `${
                gameData.clock.initial / 60 === 0.5 ? "½" : gameData.clock.initial / 60 === 0.25 ? "¼" : gameData.clock.initial / 60 === 0.75 ? "¾" : gameData.clock.initial / 60
            }+${gameData.clock.increment} • ` : "";
            const sourceIconText = gameData.source === "arena" || gameData.source === "swiss" ? " • 🏆" : gameData.source === "simul" ? " • 👨‍👩‍👧‍👦" : "";

            const row = createElement('tr', { className: `text-nowrap position-relative ${gameData.rated ? "rated" : "casual"} ${bannedPlayersClass}` }, [
                createElement('td', { className: 'bg-transparent' }, [
                    createElement('a', {
                        className: 'position-absolute h-100 start-0 top-0 w-100 z-2',
                        href: `https://lichess.org/${gameData.id}`,
                        target: '_blank',
                        rel: 'noopener noreferrer'
                    }),
                    createElement('div', {}, [
                        document.createTextNode(clockText),
                        createElement('span', { textContent: gameData.speed.charAt(0).toUpperCase() + gameData.speed.slice(1) }),
                        document.createTextNode(` • ${gameData.rated ? "Rated" : "Casual"}`),
                        createElement('span', { textContent: sourceIconText })
                    ])
                ]),
                createElement('td', { className: 'bg-transparent' }, [
                    playerTemplate(gameData, gameData.players.white, 'white', suspiciousInfo, username),
                    playerTemplate(gameData, gameData.players.black, 'black', suspiciousInfo, username)
                ]),
                createElement('td', { className: 'text-center bg-transparent' }, [
                    gameAnalysis(gameData.players.white, username),
                    gameAnalysis(gameData.players.black, username)
                ]),
                createElement('td', { className: 'text-center bg-transparent' }, [
                    createElement('span', { textContent: gameData.moves.split(' ').filter((_, i) => i % 2 === 0).length })
                ]),
                createElement('td', { className: 'text-center bg-transparent' }, [
                    document.createTextNode(gameData.status.charAt(0).toUpperCase() + gameData.status.slice(1)),
                    "winner" in gameData ? createElement('span', { textContent: ` • ${gameData.winner.charAt(0).toUpperCase() + gameData.winner.slice(1)} wins` }) : null
                ]),
                createElement('td', { className: 'text-center bg-transparent' }, [
                    createElement('span', { textContent: relativeTime(gameData.lastMoveAt) })
                ])
            ]);
            tbody.appendChild(row);
        }
    });
    resultsTable.appendChild(tbody);
});