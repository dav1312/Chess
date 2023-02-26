/*
 * https://github.com/lichess-org/lila/blob/master/ui/ceval/src/winningChances.ts
 * https://github.com/lichess-org/lila/blob/0b5c121d65cc8fd46878b94542a17770d29a5ab8/ui/ceval/src/view.ts#L134-L152
 */

const evalSlider = document.getElementById("evalSlider");
const evalValue = document.getElementById("evalValue");
const blackBar = document.getElementById("black");

const toPov = (color, diff) => {
	return color === "white" ? diff : -diff;
}

const rawWinningChances = (cp) => {
	return 2 / (1 + Math.exp(-0.004 * cp)) - 1;
}

const cpWinningChances = (cp) => {
	return rawWinningChances(Math.min(Math.max(-1000, cp), 1000));
}

const evalWinningChances = (ev) => {
	return cpWinningChances(ev);
}

const povChances = (color, ev) => {
	return toPov(color, evalWinningChances(ev));
}

const updateEval = () => {
	let ev = povChances("white", evalSlider.value);
	evalValue.textContent = evalSlider.value / 100;
	blackBar.style.height = 100 - (ev + 1) * 50 + "%";
}

evalSlider.addEventListener("input", updateEval);

updateEval();
