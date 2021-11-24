function CalculateElo() {
	var wins = document.score.wins.value * 1;
	var draws = document.score.draws.value * 1;
	var losses = document.score.losses.value * 1;
	var score = wins + draws / 2;
	var total = wins + draws + losses;
	var percentage = score / total;
	var EloDifference = (-400 * Math.log(1 / percentage - 1)) / Math.LN10;
	var Sign = "";
	if (EloDifference > 0) {
		Sign = "+";
	}
	document.points.points.value = score;
	document.points.totalgames.value = total;
	document.percent.winning.value = Math.round((percentage + Number.EPSILON) * 100000) / 1000;
	document.Elo.difference.value = Sign + Math.round((EloDifference + Number.EPSILON) * 1000) / 1000;
}
function CalculateEloFromScore() {
	var score = document.points.points.value;
	var total = document.points.totalgames.value;
	var percentage = score / total;
	var EloDifference = (-400 * Math.log(1 / percentage - 1)) / Math.LN10;
	var Sign = "";
	if (EloDifference > 0) {
		Sign = "+";
	}
	document.percent.winning.value = Math.round((percentage + Number.EPSILON) * 100000) / 1000;
	document.Elo.difference.value = Sign + Math.round((EloDifference + Number.EPSILON) * 1000) / 1000;
}
function CalculateEloFromPercent() {
	var percentage = document.percent.winning.value / 100;
	var EloDifference = (-400 * Math.log(1 / percentage - 1)) / Math.LN10;
	var Sign = "";
	if (EloDifference > 0) {
		Sign = "+";
	}
	document.Elo.difference.value = Sign + Math.round((EloDifference + Number.EPSILON) * 1000) / 1000;
}
function CalculatePercentFromElo() {
	var EloDifference = document.Elo.difference.value * 1;
	var WinningPct = (1 / (Math.exp(-(EloDifference * Math.LN10) / 400) + 1)) * 100;
	document.percent.winning.value = Math.round((WinningPct + Number.EPSILON) * 1000) / 1000;
}
