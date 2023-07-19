//
//  main.cpp
//  vdocs
//
//  Created by administrator on 08/10/2022.
//

#include "../include/vhighlight/vhighlight.h"
int main() {
	
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
	vlib::Code html;
	html << "<link rel=\"stylesheet\" href=\"" << source << "/include/vhighlight/css/vhighlight.css\">" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/highlight.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/utils.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/cpp.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/markdown.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/python.js\"></script>" << "\n" <<
	"<script src=\"" << source << "/include/vhighlight/js/js.js\"></script>" << "\n" <<
	"<body style='position: absolute: top: 0; left: 0; right: 0; bottom: 0; background: black;'>\n" <<
	// "<code language='cpp' line_numbers='true' style='color: #FFFFFF; background: black; width: 100%; height: 100%;'>" <<
	// source.join("tests/somecode.h").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// "<code language='markdown' line_numbers='true' style='color: #FFFFFF; background: black; width: 100%; height: 100%;'>" <<
	// source.join("tests/test.md").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	// "<code language='python' line_numbers='true' style='color: #FFFFFF; background: black; width: 100%; height: 100%;'>" <<
	// source.join("tests/test.py").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	"<code language='js' line_numbers='true' style='color: #FFFFFF; background: black; width: 100%; height: 100%;'>" <<
	source.join("tests/test.js").load().replace_r("<", "&lt;").replace_r(">", "&gt;") <<
	"</code>" <<
	"</body>\n" <<
	html.save(source.join("tests/output.html"));
	print("Saved to ", source.join("tests/output.html"));
}

