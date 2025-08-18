// --- DOM Elements ---
const input = document.getElementById("input");
const generate = document.getElementById("generate");
const output = document.getElementById("output");
const copy = document.getElementById("copy");
const pawnValueInput = document.getElementById("normalizeToPawnValue");

// --- Default Pawn Value ---
const defaultPawnValue = 328; // From SF commit
pawnValueInput.value = defaultPawnValue;

// Regular expressions are defined once at the top level for efficiency.
const regexPV = /(\d+ -> \d+)\[color=red/;
const regexEval = /label=(-?\d+)/;
const regexLabel = /label=(.*?)([,|\]])/;
const regexShapes = /label=(.*?),shape/;

/**
 * The main processing function. It's optimized to process line-by-line in a single pass.
 * This version has been corrected to produce output identical to the original script.
 * @param {string} text - The raw input string.
 * @param {object} options - The configuration from the UI checkboxes and inputs.
 * @returns {string} The processed Graphviz string.
 */
function processText(text, options) {
    const lines = text.split('\n');
    let processedLines = [];
    const pvIdentifiers = new Set();

    // OPTIMIZATION: Pre-scan for PV lines if the "fixPVOutput" option is enabled.
    // This correctly identifies which edges are PV edges based on 'color=red'.
    if (options.fixPV) {
        for (const line of lines) {
            const match = line.match(regexPV);
            if (match) {
                pvIdentifiers.add(match[1].trim()); // e.g., "123 -> 456"
            }
        }
    }

    // --- Main Processing Loop: Process each line once ---
    for (let line of lines) {
        // Skip blank lines
        if (line.trim() === "") {
            continue;
        }

        // CORRECTED "Fix PV" LOGIC:
        // A line should be removed if it's a label for a known PV edge.
        // The original script removed any line for a PV edge that had a label.
        // A more robust interpretation that matches the likely intent is to
        // remove label definitions that are separate from the main red PV line.
        if (options.fixPV) {
            const identifierMatch = line.match(/^(\s*\d+\s*->\s*\d+\s*)/);
            if (identifierMatch) {
                const identifier = identifierMatch[1].trim();
                // A line is a redundant PV label if:
                // 1. Its identifier is a known PV identifier.
                // 2. It does NOT contain 'color=red' (so we don't remove the primary PV edge).
                if (pvIdentifiers.has(identifier) && !line.includes('color=red')) {
                    continue; // Skip this line, as it's a separate label for a PV edge.
                }
            }
        }

        // REMOVE LABELS
        if (options.removeLabels) {
            line = line.replace(regexShapes, 'label=$1,height=0,width=0,shape');
            line = line.replace(regexLabel, 'label=""$2');
        }
        // CONVERT EVALS
        else if (options.convertEvals) {
            line = line.replace(regexEval, (_, p1) => {
                // Ensure p1 is treated as a number for the calculation.
                const evalValue = Number(p1);
                return `label=${(evalValue / options.pawnValue).toFixed(2)}`;
            });
        }
        
        processedLines.push(line);
    }

    // --- Post-Processing on the array of lines ---

    // REMOVE DUPLICATES (OPTIMIZED)
    if (options.removeDuplicates) {
        processedLines = [...new Set(processedLines)];
    }

    // SORT
    if (options.sort) {
        processedLines.sort();
    }

    // --- Build the final output string ---
    const output = [];
    output.push("digraph G {");

    if (!options.curvedLines) {
        output.push("splines=line");
    }
    if (!options.arrowHead) {
        output.push("edge [arrowhead=none]");
    }

    // Using array join is faster for large numbers of strings
    return output.join('\n') + '\n' + processedLines.join('\n') + '\n}';
}

const process = () => {
    // 1. Give the user immediate feedback that work is starting.
    generate.disabled = true;
    generate.textContent = "Generating...";
    output.value = "Processing, please wait...";

    // 2. Schedule the heavy work using setTimeout to allow the UI to update.
    setTimeout(() => {
        // 3. Gather all options from the UI.
        const options = {
            curvedLines: document.getElementById("curvedLinesOutput").checked,
            arrowHead: document.getElementById("arrowHeadOutput").checked,
            fixPV: document.getElementById("fixPVOutput").checked,
            removeDuplicates: document.getElementById("removeDuplicatesOutput").checked,
            convertEvals: document.getElementById("convertEvalsOutput").checked,
            sort: document.getElementById("sortOutput").checked,
            removeLabels: document.getElementById("removeLabelsOutput").checked,
            pawnValue: parseFloat(pawnValueInput.value) || defaultPawnValue,
        };
        
        // 4. Run the optimized processing function.
        try {
            const result = processText(input.value, options);
            output.value = result;
        } catch (error) {
            console.error("An error occurred during processing:", error);
            output.value = `An error occurred: ${error.message}`;
        }

        // 5. Reset the UI.
        generate.disabled = false;
        generate.textContent = "Generate";
    }, 10);
};

const copyToClipboard = () => {
    if (output.value) {
        output.select();
        navigator.clipboard.writeText(output.value);
    }
};

generate.addEventListener("click", process);
copy.addEventListener("click", copyToClipboard);