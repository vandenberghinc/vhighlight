/*
 * Author: Daan van den Bergh
 * Copyright: © 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Module vhighlight.

const vhighlight = {};

// Get the general tokenizer object by language.
// Returns `null` when the language is not supported.
vhighlight.get_tokenizer = function(language) {
	if (language == "cpp" || language == "c++" || language == "c") {
		return vhighlight.cpp;
	} else if (language == "markdown" || language == "md") {
		return vhighlight.md;
	} else if (language == "js" || language == "javascript") {
		return vhighlight.js;
	} else if (language == "json") {
		return vhighlight.json;
	} else if (language == "python") {
		return vhighlight.python;
	} else if (language == "css") {
		return vhighlight.css;
	} else if (language == "html") {
		return vhighlight.html;
	} else if (language == "bash" || language == "sh" || language == "zsh" || language == "shell") {
		return vhighlight.bash;
	} else {
		return null;
	}
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
	
	// Show loader.
	show_loader();

	// Delay the syntax highlighting process.
	// Otherwise the loader does not show and the unhighlted code is shown instead.
	setTimeout(() => {

		// Highlight.
		let highlighted_code = tokenizer.tokenize({code: code, build_html: true});

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
        document.body.appendChild(pre);
        const pre_height = pre.clientHeight;
        const line_height = parseFloat(element.style.lineHeight);
        document.body.removeChild(pre);
        const lines = Math.floor(pre_height / line_height);

		// Set line numbers.
        line_numbers_div.innerHTML = "";
		for (var i = 0; i < lines; i++) {
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

// Get the global tokenizer class or initialize a new class based on a language name.
// - Returns `null` when the language is not supported.
vhighlight.get_tokenizer = function(language) {
	if (language == "cpp" || language == "c++" || language == "c") {
        return vhighlight.cpp;
    }
    else if (language == "markdown" || language == "md") {
        return vhighlight.md;
    }
    else if (language == "js" || language == "javascript") {
        return vhighlight.js;
    }
    else if (language == "json") {
        return vhighlight.json;
    }
    else if (language == "python") {
        return vhighlight.python;
    }
    else if (language == "css") {
        return vhighlight.css;
    }
    else if (language == "html") {
        return vhighlight.html;
    }
    else if (language == "bash" || language == "sh" || language == "zsh" || language == "shell") {
        return vhighlight.bash;
    } else {
        return null;
    }
}
vhighlight.init_tokenizer = function(language) {
	if (language == "cpp" || language == "c++" || language == "c") {
        return new vhighlight.CPP();
    }
    else if (language == "markdown" || language == "md") {
        return new vhighlight.Markdown();
    }
    else if (language == "js" || language == "javascript") {
        return new vhighlight.JS();
    }
    else if (language == "json") {
        return new vhighlight.JSON();
    }
    else if (language == "python") {
        return new vhighlight.Python();
    }
    else if (language == "css") {
        return new vhighlight.CSS();
    }
    else if (language == "html") {
        return new vhighlight.HTML();
    }
    else if (language == "bash" || language == "sh" || language == "zsh" || language == "shell") {
        return new vhighlight.Bash();
    } else {
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