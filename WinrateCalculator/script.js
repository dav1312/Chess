function win_rate_model(eval, ply) {
	const PawnValueEg = 208;
	const v = eval * PawnValueEg;
	let m = Math.min(240, ply) / 64;
	let as = [-3.68389304,  30.07065921, -60.52878723, 149.53378557];
	let bs = [-2.0181857,   15.85685038, -29.83452023,  47.59078827];
	let a = (((as[0] * m + as[1]) * m + as[2]) * m) + as[3];
	let b = (((bs[0] * m + bs[1]) * m + bs[2]) * m) + bs[3];
	var x = Math.min(Math.max(((100 * v) / PawnValueEg), -2000), 2000);
	return Math.round(0.5 + 1000 / (1 + Math.exp((a - x) / b)));
}

function calculateWinRate() {
	let form = document.forms.form;
	var eval = form.eval.value * 1;
	var ply = form.move.value * 2;
	let wdl_w = win_rate_model(eval, ply);
	let wdl_l = win_rate_model(-eval, ply);
	let wdl_d = 1000 - wdl_w - wdl_l;
	let wdl_w_perc = (wdl_w / 10)+"%";
	let wdl_l_perc = (wdl_l / 10)+"%";
	let wdl_d_perc = (wdl_d / 10)+"%";
	form.win.value = wdl_w_perc;
	form.loss.value = wdl_l_perc;
	form.draw.value = wdl_d_perc;
}
