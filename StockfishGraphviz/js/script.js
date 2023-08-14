const input = document.getElementById("input"),
    generate = document.getElementById("generate"),
    output = document.getElementById("output"),
    copy = document.getElementById("copy"),
    regexPV = /(\d+ -> \d+)\[color=red/gm,
    regexEval = /label=(-?\d+)/gm,
    regexLabel = /label=(.*?)([,|\]])/gm,
    regexShapes = /label=(.*?),shape/gm,
    pawnValue = 328, // https://github.com/official-stockfish/Stockfish/commit/52e84e4b4675aae52a619c309479684dc5478bf5
    pawnValueInput = document.getElementById("normalizeToPawnValue");
    replacerEvals = (_, p1) => `label=${(p1 / pawnValueInput.value * 1).toFixed(2)}`;

pawnValueInput.value = pawnValue;

const process = () => {
    let pvs = [];
    let inputContent = input.value;
    // REMOVE LABELS
    if (document.getElementById("removeLabelsOutput").checked) {
       inputContent = inputContent.replace(regexLabel, 'label=""$2')
       inputContent = inputContent.replace(regexShapes, 'label=$1,height=0,width=0,shape')
    }
    // FIX PV
    if (document.getElementById("fixPVOutput").checked) {
        while ((m = regexPV.exec(inputContent)) !== null) {
            if (m.index === regexPV.lastIndex) regexPV.lastIndex++;
            pvs.push(m[1]);
        }
        pvs.forEach((e) => {
            let regexLabel = new RegExp(`${e}\\[label.*?\\n`, "gm");
            inputContent = inputContent.replace(regexLabel, "");
        });
    }
    // CONVERT EVALS
    if (document.getElementById("convertEvalsOutput").checked) {
        inputContent = inputContent.replace(regexEval, replacerEvals);
    }
    let outputArr = inputContent.split("\n");
    output.value = "";
    // REMOVE DUPLICATES
    if (document.getElementById("removeDuplicatesOutput").checked) {
        outputArr = outputArr.filter((item, index) => outputArr.indexOf(item) === index);
    }
    // SORT (this may cause weird graphs)
    if (document.getElementById("sortOutput").checked) {
        outputArr = outputArr.sort(); // (a, b) => a.localeCompare(b)
    }
    output.value += "digraph G {\n";
    // CURVED LINES
    if (!document.getElementById("curvedLinesOutput").checked) {
        output.value += "splines=line\n";
    }
    // ARROW HEAD
    if (!document.getElementById("arrowHeadOutput").checked) {
        output.value += "edge [arrowhead=none]\n";
    }
    outputArr.forEach((e) => (output.value += `${e}\n`));
    output.value += "}";
};

const copyToClipboard = () => {
    output.select();
    navigator.clipboard.writeText(output.value);
};

generate.addEventListener("click", process);
copy.addEventListener("click", copyToClipboard);
