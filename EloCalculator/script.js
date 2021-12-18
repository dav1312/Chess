let form = document.forms.form;

function calcEloFromWDL() {
	let wins = form.wins.value * 1;
	let draws = form.draws.value * 1;
	let losses = form.losses.value * 1;
	let score = wins + draws / 2;
	let total = wins + draws + losses;
	let percentage = score / total;
	let eloDifference = calcEloDifference(percentage);
	let sign = setSign(eloDifference);

	form.points.value = score;
	form.totalgames.value = total;
	form.winningPerc.value = roundThreeDecimals(percentage, 100);
	form.difference.value = sign + roundThreeDecimals(eloDifference, 1);
}

function calcEloFromScore() {
	let score = form.points.value;
	let total = form.totalgames.value;
	let percentage = score / total;
	let eloDifference = calcEloDifference(percentage);
	let sign = setSign(eloDifference);

	form.winningPerc.value = roundThreeDecimals(percentage, 100);
	form.difference.value = sign + roundThreeDecimals(eloDifference, 1);
}

function calcEloFromPercent() {
	let percentage = form.winningPerc.value / 100;
	let eloDifference = calcEloDifference(percentage);
	let sign = setSign(eloDifference);

	form.difference.value = sign + roundThreeDecimals(eloDifference, 1);
}

function calcPercentFromElo() {
	let eloDifference = form.difference.value * 1;
	let winningPct = (1 / (Math.exp(-(eloDifference * Math.LN10) / 400) + 1)) * 100;

	form.winningPerc.value = roundThreeDecimals(winningPct, 1);
}

function roundThreeDecimals(number, multiplier) {
	return Math.round((number + Number.EPSILON) * 1000 * multiplier) / 1000;
}

function calcEloDifference(percentage) {
	return (-400 * Math.log(1 / percentage - 1)) / Math.LN10;
}

function setSign(eloDifference) {
	return (eloDifference > 0) ? "+" : "";
}
