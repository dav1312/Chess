const win_rate_model = (eval, ply, model) => {
	console.log(`Using model: ${model}`);
	let pawnValue, v, x, as, bs;

	switch (model) {
		case "2023-06-22":
			pawnValue = 328;
			v = eval * pawnValue;
			as = [0.38036525, -2.82015070, 23.17882135, 307.36768407];
			bs = [-2.29434733, 13.27689788, -14.26828904, 63.45318330];
			x = Math.min(Math.max(v, -4000), 4000);
			break;

		case "2023-05-20":
			pawnValue = 343;
			v = eval * pawnValue;
			as = [1.07390458, -6.94334517, 31.95090161, 317.75424048];
			bs = [-2.82843814, 16.64518180, -19.74439200, 68.39499088];
			x = Math.min(Math.max(v, -4000), 4000);
			break;

		case "2023-02-02":
				pawnValue = 394;
				v = eval * pawnValue;
				as = [0.33677609, -4.30175627, 33.08810557, 365.60223431];
				bs = [-2.50471102, 14.23235405, -14.33066859, 71.42705250];
				x = Math.min(Math.max(v, -4000), 4000);
				break;

		case "2022-11-20":
			pawnValue = 361;
			v = eval * pawnValue;
			as = [-0.58270499, 2.68512549, 15.24638015, 344.49745382];
			bs = [-2.65734562, 15.96509799, -20.69040836, 73.61029937];
			x = Math.min(Math.max(v, -4000), 4000);
			break;

		case "2022-11-05":
			pawnValue = 348;
			v = eval * pawnValue;
			as = [1.04790516, -8.58534089, 39.42615625, 316.17524816];
			bs = [-3.57324784, 22.28816201, -35.47480551, 85.60617701];
			x = Math.min(Math.max(v, -4000), 4000);
			break;

		case "2022-08-06":
			pawnValue = 208;
			v = eval * pawnValue;
			as = [0.50379905, -4.12755858, 18.95487051, 152.00733652];
			bs = [-1.71790378, 10.71543602, -17.05515898, 41.15680404];
			x = Math.min(Math.max((100 * v) / pawnValue, -2000), 2000);
			break;

		case "2022-04-16":
			pawnValue = 208;
			v = eval * pawnValue;
			as = [-1.1720246e-1, 5.94729104e-1, 1.12065546e1, 1.22606222e2];
			bs = [-1.79066759, 11.30759193, -17.43677612, 36.47147479];
			x = Math.min(Math.max((100 * v) / pawnValue, -2000), 2000);
			break;

		case "2021-06-28":
			pawnValue = 208;
			v = eval * pawnValue;
			as = [-3.68389304, 30.07065921, -60.52878723, 149.53378557];
			bs = [-2.0181857, 15.85685038, -29.83452023, 47.59078827];
			x = Math.min(Math.max((100 * v) / pawnValue, -2000), 2000);
			break;

		default:
			pawnValue = 208;
			v = eval * pawnValue;
			as = [-8.24404295, 64.23892342, -95.73056462, 153.86478679];
			bs = [-3.37154371, 28.44489198, -56.67657741, 72.05858751];
			x = Math.min(Math.max((100 * v) / pawnValue, -2000), 2000);
			break;
	}

	const m = Math.min(240, ply) / 64;
	const a = ((as[0] * m + as[1]) * m + as[2]) * m + as[3];
	const b = ((bs[0] * m + bs[1]) * m + bs[2]) * m + bs[3];
	return Math.floor(0.5 + 1000 / (1 + Math.exp((a - x) / b)));
};

const calculateWinRate = () => {
	const form = document.forms.form;
	const eval = form.eval.value * 1;
	let ply = form.move.value;
	if (ply < 0) {
		ply *= -1;
		form.move.value = ply;
	}
	ply *= 2;
	const model = form.model.value;
	const wdl_w = win_rate_model(eval, ply, model);
	const wdl_l = win_rate_model(-eval, ply, model);
	const wdl_d = 1000 - wdl_w - wdl_l;
	form.win.value = `${wdl_w / 10}%`;
	form.loss.value = `${wdl_l / 10}%`;
	form.draw.value = `${wdl_d / 10}%`;
};

const copyWDL = () => {
	const WDLText = `${form.win.value} W ${form.draw.value} D ${form.loss.value} L`;
	navigator.clipboard.writeText(WDLText);
};

window.onload = calculateWinRate;
