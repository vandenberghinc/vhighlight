/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Module vhighlight.

const vhighlight = {};

// All languages.
vhighlight.languages = function() {
	if (this._languages === undefined) {
		this._languages = [
			vhighlight.cpp.language,
			vhighlight.md.language,
			vhighlight.js.language,
			vhighlight.json.language,
			vhighlight.python.language,
			vhighlight.css.language,
			vhighlight.html.language,
			vhighlight.bash.language,
		]
	}
	return this._languages;
};

// Get the global tokenizer class or initialize a new class based on a language name.
// - Returns `null` when the language is not supported.
vhighlight.get_tokenizer = function(language) {
	switch (language.toLowerCase()) {
		
		// C.
		case "cpp":
		case "c++":
		case "c":
			return vhighlight.cpp;
		
		// Markdown.
		case "markdown":
		case "md":
			return vhighlight.md;
		
		// JS.
		case "js":
		case "javascript":
		case "nodejs":
			return vhighlight.js;
		
		// JSON.
		case "json":
			return vhighlight.json;
		
		// Python.
		case "python":
		case "py":
			return vhighlight.python;
		
		// CSS.
		case "css":
			return vhighlight.css;
		
		// HTML.
		case "html":
			return vhighlight.html;
		
		// Bash.
		case "bash":
		case "sh":
		case "zsh":
		case "shell":
		case "curl":
			return vhighlight.bash;

		// Unsupported.
		default:
			return null;
	}
}
vhighlight.init_tokenizer = function(language) {
	switch (language.toLowerCase()) {
		
		// C.
		case "cpp":
		case "c++":
		case "c":
			return new vhighlight.CPP();
		
		// Markdown.
		case "markdown":
		case "md":
			return new vhighlight.Markdown();
		
		// JS.
		case "js":
		case "javascript":
		case "nodejs":
			return new vhighlight.JS();
		
		// JSON.
		case "json":
			return new vhighlight.JSON();
		
		// Python.
		case "python":
		case "py":
			return new vhighlight.Python();
		
		// CSS.
		case "css":
			return new vhighlight.CSS();
		
		// HTML.
		case "html":
			return new vhighlight.HTML();
		
		// Bash.
		case "bash":
		case "sh":
		case "zsh":
		case "shell":
		case "curl":
			return new vhighlight.Bash();

		// Unsupported.
		default:
			return null;
	}
}

// Get the supported language from a path extension.
vhighlight.language_extensions = {
	"cpp": [".c", ".cp", ".cpp", ".h", ".hp", ".hpp"],
    "js": [".js"], 
    "md": [".md"],
    "python": [".py"],
    "css": [".css"],
    "json": [".json", ".vide", ".vpackage", ".vweb"],
    "shell": [".sh", ".zsh"],
    "html": [".html"],
};
vhighlight.get_tokenizer_by_extension = function(extension) {
	if (extension == null || extension.length === 0) { return null; }
	if (extension.charAt(0) != ".") {
		extension = `.${extension}`;
	}
	return Object.keys(vhighlight.language_extensions).iterate((lang) => {
        if (vhighlight.language_extensions[lang].includes(extension)) {
            return vhighlight.get_tokenizer(lang);
        }
    })
}
vhighlight.init_tokenizer_by_extension = function(extension) {
	if (extension == null || extension.length === 0) { return null; }
	if (extension.charAt(0) != ".") {
		extension = `.${extension}`;
	}
	return Object.keys(vhighlight.language_extensions).iterate((lang) => {
        if (vhighlight.language_extensions[lang].includes(extension)) {
            return vhighlight.init_tokenizer(lang);
        }
    })
}

// Tokenize code.
// - Returns "null" when the language is not supported.
// - Make sure to replace < with &lt; and > with &gt; before assigning the code to the <code> element.
vhighlight.tokenize = function({
	element = null,			// the html code element.
	code = null,			// when the code is assigned the highlighted code will be returned.
	language = null,		// code language, precedes element attribute "language".
	line_numbers = null,	// show line numbers, precedes element attribute "line_numbers".
	animate = false,		// animate code writing.
	delay = 25,				// animation delay in milliseconds, only used when providing parameter "element".
	// is_func = false,	 	// enable when cpp code is inside a function.
	build_html = false,		// with build_html as `true` this function will build the html and return the html code when parameter `code` is defined, with build_html as `false` it will return the array of tokens.
}) {

	// Get language.
	if (language == null && element != null) {
		language = element.getAttribute("language");
	}
	
	// Line numbers.
	if (line_numbers == null && element != null) {
		line_numbers = element.getAttribute('line_numbers') == "true";
	}
	
	// Delay.
	if (delay == null) {
		delay = 25;
	}

	// Get tokenizer.
	const tokenizer = vhighlight.get_tokenizer(language);
	if (tokenizer == null) {
		return null;
	}
	
	// When the code is assigned just highlight the code and return the highlighted code/
	if (code != null) {
		return tokenizer.tokenize({code: code, build_html: build_html});
	}

	// When the element is a <pre> just highlight it.
	else if (element.tagName == "PRE") {
		code = element.innerText.replaceAll(">", "&gt;").replaceAll("<", "&lt;");
		element.innerHTML = tokenizer.tokenize({code: code, build_html: true});
		return ;
	}

	// When the element is a <code> more options become available.

	// Stop when no language is defined.
	if (language == "" || language == null) {
		return ;
	}
	
	// Create children.
	let loader;
	let line_numbers_div;
	let line_numbers_divider;
	let code_pre;
	if (element.children.length <= 1) {
		
		// Set style.
		element.style.display = 'flex';
		element.style.height = "auto";
		if (element.style.fontFamily == "") {
			element.style.fontFamily = "'Menlo', 'Consolas', monospace";
		}
		
		// Get code.
		code = element.textContent;
		element.innerHTML = "";
		
		// Loader.
		loader = document.createElement("div");
		loader.style.display = "flex";
		loader.className = "vhighlight_loader";
		for (let i = 0; i < 4; i++) {
			let child = document.createElement("div");
			child.style.border = "4px solid " + element.style.color;
			child.style.borderColor = element.style.color + " transparent transparent transparent";
			loader.appendChild(child);
		}
		element.appendChild(loader);
		
		// Line numbers.
		line_numbers_div = document.createElement("pre");
		line_numbers_div.style.padding = '0px';
		line_numbers_div.style.margin = '0px';
		element.appendChild(line_numbers_div);
		
		// Line numbers divider.
		line_numbers_divider = document.createElement("div");
		line_numbers_divider.className = "token_line_number_divider";
		line_numbers_divider.style.minWidth = "0.5px";
		line_numbers_divider.style.width = "0.5px";
		line_numbers_divider.style.padding = '0px';
		line_numbers_divider.style.margin = "0px 10px 0px 10px";
		element.appendChild(line_numbers_divider);
		
		// Code.
		code_pre = document.createElement("pre");
		code_pre.style.padding = "0px";
		code_pre.style.margin = "0px";
		code_pre.style.whiteSpace = "pre";
		code_pre.style.overflowX = "auto";
		element.appendChild(code_pre);
	}
	
	// Get elements.
	else {
		loader = element.children[0];
		line_numbers_div = element.children[1];
		line_numbers_divider = element.children[2];
		code_pre = element.children[3];
		code = code_pre.textContent;
	}

	// Get the tokens.
	let tokens = tokenizer.tokenize({code: code});

	// Build the html.
	let highlighted_code = tokenizer.build_html(tokens);

	// Functions.
	function show_loader() {
		element.style.justifyContent = "center";
		element.style.alignItems = "center";
		loader.style.display = "flex";
		line_numbers_div.style.display = "none";
		line_numbers_divider.style.display = "none";
		code_pre.style.display = "none";
	}
	function hide_loader() {
		element.style.justifyContent = "start";
		element.style.alignItems = "stretch";
		loader.style.display = "none";
		if (line_numbers) {
			line_numbers_div.style.display = "block";
			line_numbers_divider.style.display = "block";
		}
		code_pre.style.display = "block";
	}
	function animate_writing(highlighted_code) {
		
		// Reset content.
		code_pre.innerHTML = "";

		// Add char.
		function add_char(index) {
			if (index < highlighted_code.length) {
				
				// Span opening.
				if (highlighted_code[index] == '<') {
					
					// Fins span open, close and code.
					let span_index;
					let span_open = "";
					let span_close = "";
					let span_code = "";
					let open = true;
					let first = true;
					for (span_index = index; span_index < highlighted_code.length; span_index++) {
						const char = highlighted_code[span_index];
						if (char == '<' || open) {
							open = true;
							if (first) {
								span_open += char;
							} else {
								span_close += char;
							}
							if (char == '>') {
								open = false;
								if (first) {
									first = false;
									continue;
								}
									
								// Animate span code writing.
								let before = code_pre.innerHTML;
								let added_span_code = "";
								function add_span_code(index) {
									if (index < span_code.length) {
										added_span_code += span_code[index]
										let add = before;
										add += span_open;
										add += added_span_code;
										add += span_close;
										code_pre.innerHTML = add;
										setTimeout(() => add_span_code(index + 1), delay);
									} else {
										setTimeout(() => add_char(span_index + 1), delay);
									}
								}
								add_span_code(0)
								
								// Stop.
								break;
							}
						}
						
						// Add non span code.
						else {
							span_code += char;
						}
						
					}
				}
				
				// Non span code.
				else {
					code_pre.innerHTML += highlighted_code.charAt(index);
					setTimeout(() => add_char(index + 1), delay);
				}
			}
			
			// Non span code.
			else {
				code_pre.innerHTML = highlighted_code;
			}
			
		}
		
		// Start animation.
		add_char(0);
	}

	// Set the min height otherwise the height expands while scrolling while the writing is animated then this can created unwanted behviour when scrolling up.
	const computed = window.getComputedStyle(element);
	element.style.minHeight = `${parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom) + parseFloat(computed.lineHeight) * tokens.length}px`;
	
	// Show loader.
	show_loader();

	// Delay the syntax highlighting process.
	// Otherwise the loader does not show and the unhighlted code is shown instead.
	setTimeout(() => {

		// No line numbers.
		// So add code directly.
		if (line_numbers == false) {
			hide_loader();
			if (animate == true) {
				animate_writing(highlighted_code);
			} else {
				code_pre.innerHTML = highlighted_code;
			}
			return ;
		}
		
		// Set style for line numbers.
		element.style.justifyContent = "start";
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

		// Set line numbers.
        line_numbers_div.innerHTML = "";
		for (var i = 0; i < tokens.length; i++) {
			let span = document.createElement("span");
			span.className = "token_line_number";
			span.textContent = (i + 1) + "\n";
			line_numbers_div.appendChild(span);
		}

		// Set code.
		hide_loader();
		if (animate == true) {
			animate_writing(highlighted_code);
		} else {
			code_pre.innerHTML = highlighted_code;
		}
		
		
	}, 50);
}