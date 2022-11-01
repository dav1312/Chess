window.onload = calculateWinRate;

function win_rate_model(eval, ply) {
	const Internal2Pawn = 348;
	const v = eval * Internal2Pawn;
	const m = Math.min(240, ply) / 64;
	const as = [1.04790516, -8.58534089, 39.42615625, 316.17524816];
	const bs = [-3.57324784, 22.28816201, -35.47480551, 85.60617701];
	const a = (((as[0] * m + as[1]) * m + as[2]) * m) + as[3];
	const b = (((bs[0] * m + bs[1]) * m + bs[2]) * m) + bs[3];
	const x = Math.min(Math.max((v), -4000), 4000);
	return Math.round(0.5 + 1000 / (1 + Math.exp((a - x) / b)));
}

function calculateWinRate() {
	const form = document.forms.form;
	const eval = form.eval.value * 1;
	const ply = form.move.value * 2;
	const wdl_w = win_rate_model(eval, ply);
	const wdl_l = win_rate_model(-eval, ply);
	const wdl_d = 1000 - wdl_w - wdl_l;
	const wdl_w_perc = `${wdl_w / 10}%`;
	const wdl_l_perc = `${wdl_l / 10}%`;
	const wdl_d_perc = `${wdl_d / 10}%`;
	form.win.value = wdl_w_perc;
	form.loss.value = wdl_l_perc;
	form.draw.value = wdl_d_perc;
}
