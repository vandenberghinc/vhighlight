//
//  main.cpp
//  vdocs
//
//  Created by administrator on 08/10/2022.
//

// #include "../include/vhighlight/vhighlight.h"
#include "/Volumes/persistance/private/vinc/vlib/include/vlib/vlib.h"
void test() {
	vlib::Path source = vlib::Path(__FILE__).base(2);
	vlib::String html = source.join("dev/test.html").load();
	html.replace_r("$SOURCE", source);
	html.replace_r("$TEST_PATH", source + "/dev/tests/test.html");
	html.replace_r("$LANGUAGE", "html");
	html.replace_r("$DATA", source.join("/dev/tests/test.html").load());
	html.save(source.join("dev/tests/output.html"));
	print("Saved to ", source.join("dev/tests/output.html"));

	/*
	
	// vlib::Path source = vlib::Path(__FILE__).base(2);
	// vlib::Code html;
	// html << "<link rel=\"stylesheet\" href=\"" << source << "/include/vhighlight/tokens.css\">" << "\n";
	// html << "<pre style='color: #FFFFFF; background: black'>" <<
	// // vhighlight::md::highlight(source.join("tests/test.md").load()) <<
	// vhighlight::python::highlight(source.join("tests/test.py").load()) <<
	// "</pre>";
	// html.save(source.join("tests/output.html"));
	// print("Saved to ", source.join("tests/output.html"));
	
	
	vlib::Path source = vlib::Path(__FILE__).base(2);
	print(source);
	vlib::Code html;
	html << "<link rel=\"stylesheet\" href=\"" << source << "/include/vhighlight/css/vhighlight.css\">" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/highlight.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/tokenizer.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/utils.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/cpp.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/markdown.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/python.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/js.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/bash.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/css.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/html.js\"></script>" << "\n" <<
	"<body style='position: absolute: top: 0; left: 0; right: 0; bottom: 0; background: black;'>\n" <<
	// "<pre id='codetest' language='cpp' line_numbers='true' style='color: #FFFFFF; background: black; width: 100%; height: 100%;'>" <<
	// source.join("dev/tests/somecode2.h").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// "<code language='markdown' line_numbers='true' style='color: #FFFFFF; background: black; width: 100%; height: 100%;'>" <<
	// source.join("tests/test.md").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// "<code language='python' line_numbers='true' style='color: #FFFFFF; background: black; width: 100%; height: 100%;'>" <<
	// source.join("tests/test.py").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// "<pre id='codetest' language='js' line_numbers='true' style='color: #FFFFFF; background: black; width: 100%; height: 100%;'>" <<
	// source.join("dev/tests/test.js").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	"<pre id='codetest' style='color: #FFFFFF; background: black; width: 100%; height: 100%;'>" <<
	// vlib::Path::load("/Volumes/persistance/private/vinc/vide/test/vweb.js").replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// source.join("dev/tests/test2.js").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// source.join("dev/tests/somecode.h").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// source.join("dev/tests/test.py").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// source.join("dev/tests/test.html").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// source.join("dev/tests/test.md").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// source.join("dev/tests/test.sh").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// source.join("dev/tests/css.css").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	"</pre>" <<
	"<script type='text/javascript'>" <<
	// "vhighlight.highlight({element: document.getElementById('codetest'), line_numbers: true});" <<
	"const start = performance.now();"
	"const e = document.getElementById('codetest');"
	"const code = `" << source.join("dev/tests/test.html").load() << "`;"
	"const result = vhighlight.highlight({code: code, language: 'html'});" <<
	// "console.log(result);" <<
	// "e.innerHTML = result.code;" <<
	"e.innerHTML = result;" <<
	// "console.log(result);" <<
	"const end = performance.now();"
	"console.log('Speed: ', ((end - start) / 1000) + 's');" <<
	"</script>" <<
	"</body>\n" <<
	html.save(source.join("dev/tests/output.html"));
	print("Saved to ", source.join("dev/tests/output.html"));
	*/
}

