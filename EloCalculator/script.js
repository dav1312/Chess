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
	form.difference.value = sign + roundThreeDecimals(eloDifference, 1) + calcErrorMargin(wins, draws, losses);
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
	let winningPct = 1 / (Math.exp(-(eloDifference * Math.LN10) / 400) + 1);

	form.winningPerc.value = winningPct;
}

function roundThreeDecimals(number, multiplier) {
	//return number * multiplier;
	return Math.round((number + Number.EPSILON) * 1000 * multiplier) / 1000;
}

function calcEloDifference(percentage) {
	return (-400 * Math.log(1 / percentage - 1)) / Math.LN10;
}

function setSign(eloDifference) {
	return eloDifference > 0 ? "+" : "";
}

function calcErrorMargin(wins, draws, losses) {
	let total = wins + draws + losses;
	let winPerc = wins / total;
	let drawPerc = draws / total;
	let lossPerc = losses / total;
	let score = wins + draws / 2;
	let percentage = score / total;
	let winsDev = winPerc * Math.pow(1 - percentage, 2);
	let drawsDev = drawPerc * Math.pow(0.5 - percentage, 2);
	let lossesDev = lossPerc * Math.pow(0 - percentage, 2);
	let stdDeviation = Math.sqrt(winsDev + drawsDev + lossesDev) / Math.sqrt(total);

	let confidencePerc = 0.95; // Default
	confidencePerc = form.sigma.value * 1;
	console.log(confidencePerc);
	let minConfidencePerc = (1 - confidencePerc) / 2;
	let maxConfidencePerc = 1 - minConfidencePerc;
	let devMin = percentage + phiInv(minConfidencePerc) * stdDeviation;
	let devMax = percentage + phiInv(maxConfidencePerc) * stdDeviation;

	let difference = calcEloDifference(devMax) - calcEloDifference(devMin);

	return " +/- " + Math.round(difference / 2 * 10) / 10;
}

function phiInv(p) {
	return Math.sqrt(2) * calcInverseErrorFunction(2 * p - 1);
}

function calcInverseErrorFunction(x) {
	let pi = Math.PI;
	let a = (8 * (pi - 3)) / (3 * pi * (4 - pi));
	let y = Math.log(1 - x * x);
	let z = 2 / (pi * a) + y / 2;

	let ret = Math.sqrt(Math.sqrt(z * z - y / a) - z);

	if (x < 0) {
		return -ret;
	}

	return ret;
}
