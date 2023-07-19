/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Module vhighlight.

const vhighlight = {};
	
// Highlight
// Make sure to replace < with &lt; and > with &gt; before assigning the code to the <code> element.
vhighlight.highlight = function(element, options = {}) {

	// Get language.
	const language = element.getAttribute("language");
	if (language == "") {
		return ;
	}

	// Get code.
	const code = element.textContent;
	element.innerHTML = "";

	// Set loader.
	element.style.display = 'flex';
	element.style.justifyContent = "center";
	element.style.alignItems = "center";
	let loader = document.createElement("div");
	loader.className = "vhighlight_loader";
	for (let i = 0; i < 4; i++) {
		let child = document.createElement("div");
		child.style.border = "4px solid " + element.style.color;
		child.style.borderColor = element.style.color + " transparent transparent transparent";
		loader.appendChild(child);
	}
	element.appendChild(loader);

	// Delay the syntax highlighting process.
	// Otherwise the loader does not show and the unhighlted code is shown instead.
	setTimeout(() => {

		// Set style.
		if (element.style.fontFamily == "") {
			element.style.fontFamily = "'Menlo', 'Consolas', monospace";
		}

		// Highlight.
		let highlighted_code;
		if (language == "cpp") {
			highlighted_code = vhighlight.cpp.highlight(code, options);
		} else if (language == "markdown") {
			highlighted_code = vhighlight.md.highlight(code);
		} else if (language == "js") {
			highlighted_code = vhighlight.js.highlight(code);
		} else if (language == "python") {
			highlighted_code = vhighlight.python.highlight(code);
		} else {
			console.error("Unsupported language \"" + language + "\" for syntax highlighting.");
			// element.innerHTML = "<p style='color: red;'>Error: Unsupported language \"" + language + "\" for syntax highlighting.</p>";
			return ;
		}

		// No line numbers.
		if (element.getAttribute('line_numbers') != "true") {
			let code_pre = document.createElement("pre");
			code_pre.style.padding = "0px";
			code_pre.style.margin = "0px";
			code_pre.style.whiteSpace = "pre";
			code_pre.style.overflowX = "auto";
			code_pre.innerHTML = highlighted_code;
			element.style.justifyContent = "start";
			element.style.alignItems = "stretch";
			element.innerHTML = "";
			element.appendChild(code_pre);
			return ;
		}
		
		// Set style for line numbers.
		element.style.alignItems = 'stretch';
		if (element.style.height === 'undefined' || element.style.height == "100%") {
			element.style.height = 'auto';
		}
		if (element.style.tabSize === 'undefined') {
			element.style.tabSize = '4';
		}
		if (element.style.lineHeight == "") {
			element.style.lineHeight = '16px'; // must be assigned for the show codelines optoin.
		}

		// Get linecount.
		// Cant be done with split() since that also counts the wrapped lined.
        const pre = document.createElement('pre');
        pre.textContent = code;
        pre.style.whiteSpace = 'pre';
        pre.style.overflow = 'visible';
        pre.style.lineHeight = element.style.lineHeight;
        document.body.appendChild(pre);
        const pre_height = pre.clientHeight;
        const line_height = parseFloat(element.style.lineHeight);
        document.body.removeChild(pre);
        const lines = Math.floor(pre_height / line_height);

        let line_div = document.createElement("div");
        line_div.style.display = "flex";
        line_div.style.padding = '0px';
        line_div.style.margin = '0px';

        let line_numbers = document.createElement("pre");
        line_numbers.style.padding = '0px';
        line_numbers.style.margin = '0px';
		for (var i = 0; i < lines; i++) {
			let span = document.createElement("span");
			span.className = "token_line_number";
			span.textContent = (i + 1) + "\n";
			line_numbers.appendChild(span);
		}

		let divider = document.createElement("div");
		divider.className = "token_line_number_divider";
		divider.style.minWidth = "0.5px";
		divider.style.width = "0.5px";
		divider.style.padding = '0px';
		divider.style.margin = "0px 10px 0px 10px";

		let code_pre = document.createElement("pre");
		code_pre.style.padding = "0px";
		code_pre.style.margin = "0px";
		code_pre.style.whiteSpace = "pre";
		code_pre.style.overflowX = "auto";

		code_pre.innerHTML = highlighted_code;
		element.style.height = "auto";
		element.style.justifyContent = "start";
		element.style.alignItems = "stretch";
		element.innerHTML = "";

		element.appendChild(line_numbers);
		element.appendChild(divider);
		element.appendChild(code_pre);
	
	}, 50);
}

// ---------------------------------------------------------
// Observe all pre elements.

// vhighlight.observe = function() {
// 	window.addEventListener('DOMContentLoaded', function() {
		
// 		// Function to handle attribute changes
// 		const handle_code_attribute_change = (mutations_list) => {
// 			mutations_list.forEach((mutation) => {
// 				if (mutation.attributeName === 'language') {
// 					const language = mutation.target.getAttribute('language');
// 					if (language) {
// 						vhighlight.highlight(language);
// 					}
// 				}
// 			});
// 		};
		
// 		// Create a MutationObserver instance
// 		const vhighlight_observer = new MutationObserver(handle_code_attribute_change);
		
// 		// Select all <code> elements
// 		const vhighlight_elements = document.querySelectorAll('code');
		
// 		// Start observing attribute changes on each <code> element
// 		vhighlight_elements.forEach((element) => {
// 			vhighlight.highlight(element);
// 			vhighlight_observer.observe(element, { attributes: true });
// 		});
		
// 	});
// }
