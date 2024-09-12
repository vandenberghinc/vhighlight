const vhighlight={};
vhighlight.internal={};
vhighlight.languages=function(){
if (this._languages===undefined){
this._languages=[
vhighlight.cpp.language,
vhighlight.md.language,
vhighlight.js.language,
vhighlight.json.language,
vhighlight.python.language,
vhighlight.css.language,
vhighlight.html.language,
vhighlight.bash.language,
vhighlight.yaml.language,
vhighlight.lmx.language,
]
}
return this._languages;
};
vhighlight.get_tokenizer=function(language){
switch (language.toLowerCase()){
case "cpp":
case "c++":
case "c":
return vhighlight.cpp;
case "markdown":
case "md":
return vhighlight.md;
case "js":
case "javascript":
case "nodejs":
return vhighlight.js;
case "json":
return vhighlight.json;
case "python":
case "py":
return vhighlight.python;
case "css":
return vhighlight.css;
case "html":
return vhighlight.html;
case "bash":
case "sh":
case "zsh":
case "shell":
case "curl":
case "cli":
return vhighlight.bash;
case "yaml":
return vhighlight.yaml;
case "lmx":
return vhighlight.lmx;
default:
return null;
}
}
vhighlight.init_tokenizer=function(language,args={}){
switch (language.toLowerCase()){
case "cpp":
case "c++":
case "c":
return new vhighlight.CPP(args);
case "markdown":
case "md":
return new vhighlight.Markdown(args);
case "js":
case "javascript":
case "nodejs":
return new vhighlight.JS(args);
case "json":
return new vhighlight.JSON(args);
case "python":
case "py":
return new vhighlight.Python(args);
case "css":
return new vhighlight.CSS(args);
case "html":
return new vhighlight.HTML(args);
case "bash":
case "sh":
case "zsh":
case "shell":
case "curl":
case "cli":
return new vhighlight.Bash(args);
case "yaml":
return new vhighlight.YAML(args);
case "lmx":
return new vhighlight.LMX(args);
default:
return null;
}
}
vhighlight.language_extensions={
"cpp":[".c",".cp",".cpp",".h",".hp",".hpp"],
"js":[".js"],
"md":[".md"],
"python":[".py"],
"css":[".css"],
"json":[".json",".vide",".vpackage",".vweb"],
"shell":[".sh",".zsh"],
"html":[".html"],
"yaml":[".yaml"],
"lmx":[".lmx"],
};
vhighlight.get_tokenizer_by_extension=function(extension){
if (extension==null||extension.length===0){return null;}
if (extension.charAt(0)!="."){
extension=`.${extension}`;
}
return Object.keys(vhighlight.language_extensions).iterate((lang)=>{
if (vhighlight.language_extensions[lang].includes(extension)){
return vhighlight.get_tokenizer(lang);
}
})
}
vhighlight.init_tokenizer_by_extension=function(extension,args={}){
if (extension==null||extension.length===0){return null;}
if (extension.charAt(0)!="."){
extension=`.${extension}`;
}
return Object.keys(vhighlight.language_extensions).iterate((lang)=>{
if (vhighlight.language_extensions[lang].includes(extension)){
return vhighlight.init_tokenizer(lang,args);
}
})
}
if (Array.prototype.iterate===undefined){
Array.prototype.iterate=function(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=start;i<end;i++){
const res=handler(this[i]);
if (res!=null){
return res;
}
}
return null;
};
}
if (Array.prototype.iterate_reversed===undefined){
Array.prototype.iterate_reversed=function(start,end,handler){
if (handler==null&&start!=null){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=end-1;i>=start;i--){
const res=handler(this[i]);
if (res!=null){
return res;
}
}
return null;
};
}
if (Array.prototype.last===undefined){
Array.prototype.last=function(){
return this[this.length-1];
};
}
vhighlight.NestedDepth=class NestedDepth{
constructor(curly,bracket,parenth){
this.curly=curly;
this.bracket=bracket;
this.parenth=parenth;
}
assign(curly,bracket,parenth){
this.curly=curly;
this.bracket=bracket;
this.parenth=parenth;
}
eq(other){
return this.curly===other.curly&&this.bracket===other.bracket&&this.parenth===other.parenth;
}
gt(other){
return this.curly<other.curly&&this.bracket<other.bracket&&this.parenth<other.parenth;
}
gte(other){
return this.curly<=other.curly&&this.bracket<=other.bracket&&this.parenth<=other.parenth;
}
lt(other){
return this.curly>other.curly&&this.bracket>other.bracket&&this.parenth>other.parenth;
}
lte(other){
return this.curly>=other.curly&&this.bracket>=other.bracket&&this.parenth>=other.parenth;
}
eq_values(curly,bracket,parenth){
return this.curly===curly&&this.bracket===bracket&&this.parenth===parenth;
}
process_token(token){
if (token.token==null){
switch (token.data){
case "{":++this.curly; break;
case "}":--this.curly; break;
case "[":++this.bracket; break;
case "]":--this.bracket; break;
case "(":++this.parenth; break;
case ")":--this.parenth; break;
}
}
}
}
vhighlight.Tokens=class Tokens extends Array{
constructor(){
super();
}
iterate_tokens(start,end,handler){
if (typeof start==="function"){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=start;i<end;i++){
const tokens=this[i];
if (tokens===undefined){return null;}
for (let i=0;i<tokens.length;i++){
const res=handler(tokens[i]);
if (res!=null){
return res;
}
}
}
return null;
};
iterate_tokens_reversed(start,end,handler){
if (handler==null&&start!=null){
handler=start;
start=null;
}
if (start==null){
start=0;
}
if (end==null){
end=this.length;
}
for (let i=end-1;i>=start;i--){
const tokens=this[i];
for (let i=tokens.length-1;i>=0;i--){
const res=handler(tokens[i]);
if (res!=null){
return res;
}
}
}
return null;
};
}
vhighlight.internal.obj_eq=function(x,y){
if (typeof x!==typeof y){return false;}
else if (x instanceof vhighlight.TokenizerState){
if (!(y instanceof vhighlight.TokenizerState)){
return false;
}
return x.equals(y);
}
else if (x instanceof String){
return x.toString()===y.toString();
}
else if (Array.isArray(x)){
if (!Array.isArray(y)||x.length!==y.length){return false;}
for (let i=0;i<x.length;i++){
if (!vhighlight.internal.obj_eq(x[i],y[i])){
return false;
}
}
return true;
}
else if (x!=null&&typeof x==="object"){
const x_keys=Object.keys(x);
const y_keys=Object.keys(y);
if (x_keys.length!==y_keys.length){
return false;
}
for (const key of x_keys){
if (!vhighlight.internal.obj_eq(x[key],y[key])){
return false
}
}
return true;
}
else {
return x===y;
}
}
vhighlight.internal.deep_copy=function(obj){
if (obj instanceof vhighlight.TokenizerState){
return obj.clone();
}
else if (Array.isArray(obj)){
const copy=[];
obj.iterate((item)=>{
copy.append(vhighlight.internal.deep_copy(item));
})
return copy;
}
else if (obj!==null&&obj instanceof String){
return new String(obj.toString());
}
else if (obj!==null&&typeof obj==="object"){
const copy={};
const keys=Object.keys(obj);
const values=Object.values(obj);
for (let i=0;i<keys.length;i++){
copy[keys[i]]=vhighlight.internal.deep_copy(values[i]);
}
return copy;
}
else {
return obj;
}
}
vhighlight.TokenizerState=class TokenizerState{
constructor(data={}){
this.data=data;
}
equals(other){
return vhighlight.internal.obj_eq(this.data,other.data);
}
clone(){
return new TokenizerState(vhighlight.internal.deep_copy(this.data));
}
}
vhighlight.Tokenizer=class Tokenizer{
static alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
static uppercase_alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
static numerics="0123456789";
constructor({
keywords=[],
type_keywords=[],
type_def_keywords=[],
exclude_type_def_keywords_on_prev=[],
operators=[],
special_string_prefixes=[],
single_line_comment_start=false,
multi_line_comment_start=false,
multi_line_comment_end=false,
multi_line_comment_only_at_start=false,
allow_strings=true,
allow_strings_double_quote=true,
allow_numerics=true,
allow_preprocessors=false,
allow_slash_regexes=false,
allow_comment_keyword=true,
allow_comment_codeblock=true,
allow_parameters=true,
allow_decorators=false,
allowed_keywords_before_type_defs=[],
excluded_word_boundary_joinings=[],
is_indent_language=false,
is_type_language=false,
scope_separators=[
"{",
"}",
],
seperate_scope_by_type_def=false,
compiler=false,
language=null,
}){
this.code=null;
this.keywords=keywords;
this.type_keywords=type_keywords;
this.type_def_keywords=type_def_keywords;
this.exclude_type_def_keywords_on_prev=exclude_type_def_keywords_on_prev;
this.operators=operators;
this.special_string_prefixes=special_string_prefixes;
this.single_line_comment_start=single_line_comment_start;
this.multi_line_comment_start=multi_line_comment_start;
this.multi_line_comment_start_is_array=Array.isArray(this.multi_line_comment_start);
this.multi_line_comment_end=multi_line_comment_end;
this.multi_line_comment_only_at_start=multi_line_comment_only_at_start;
this.allow_strings=allow_strings;
this.allow_strings_double_quote=allow_strings_double_quote;
this.allow_numerics=allow_numerics;
this.allow_preprocessors=allow_preprocessors;
this.allow_slash_regexes=allow_slash_regexes;
this.allow_comment_keyword=allow_comment_keyword;
this.allow_comment_codeblock=allow_comment_codeblock;
this.allow_parameters=allow_parameters;
this.allow_decorators=allow_decorators;
this.allowed_keywords_before_type_defs=allowed_keywords_before_type_defs;
this.is_indent_language=is_indent_language;
this.is_type_language=is_type_language;
this.scope_separators=scope_separators;
this.seperate_scope_by_type_def=seperate_scope_by_type_def;
this.compiler=compiler;
this.language=language;
this.word_boundaries=[
' ',
'\t',
'\n',
'\r',
'.',
',',
'!',
'?',
';',
':',
'-',
'/',
'\\',
'|',
'(',
')',
'[',
']',
'{',
'}',
'<',
'>',
'=',
'+',
'*',
'&',
'%',
'$',
'#',
'@',
'`',
'~',
'"',
"'",
'\u2019',
'\u2018',
'\u201d',
'\u201c',
];
this.excluded_word_boundary_joinings=[
"{","}","[","]","(",")","<",">",
",","=",
]
.concat(this.scope_separators)
.concat(excluded_word_boundary_joinings)
this.excluded_word_boundary_joinings=this.excluded_word_boundary_joinings.reduce((accumulator,val)=>{
if (!accumulator.includes(val)){
accumulator.push(val);
}
return accumulator;
},[]);
this.reset();
this.is_js=this.language==="JS";
this.is_py=this.language==="Python";
this.is_cpp=this.language==="C++";
}
reset(){
this.tokens=new vhighlight.Tokens();
this.added_tokens=0;
this.index=null;
this.prev_char=null;
this.next_char=null;
this.batch="";
this.line=0;
this.is_comment=false;
this.is_str=false;
this.is_regex=false;
this.is_preprocessor=false;
this.is_comment_keyword=false;
this.is_comment_keyword_multi_line=false;
this.is_comment_codeblock=false;
this.parenth_depth=0;
this.bracket_depth=0;
this.curly_depth=0;
this.next_token=null;
this.offset=0;
this.parents=[];
this.line_indent=0;
this.start_of_line=true;
this.prev_nw_token_data=null;
this.is_post_type_def_modifier=false;
this.post_type_def_modifier_type_def_token=null;
this.is_keyword_before_parentheses=false;
this.last_non_whiste_space_line_break_token=null;
this.after_dot_is_type_js=false;
this.func_end_queue=[];
this.inside_parameters=[];
this.preprocess_code=true;
this.iter_code_is_comment=false;
this.iter_code_is_multi_line_comment=false;
this.iter_code_string_char=null;
this.iter_code_is_regex=false;
this.iter_code_is_preprocessor=false;
this.iter_code_prev_non_whitespace_char=null;
this.iter_code_multi_line_comment_check_close_from_index=null;
this.iter_code_inside_template_curly_depth=0;
this.iter_code_inside_template_curly_end=[];
this.iter_code_forced_multi_line_comment_end=null;
}
state(state=null){
if (state==null){
const data={
prev_char:this.prev_char,
next_char:this.next_char,
is_comment:this.is_comment,
is_str:this.is_str,
is_regex:this.is_regex,
is_preprocessor:this.is_preprocessor,
is_comment_keyword:this.is_comment_keyword,
is_comment_keyword_multi_line:this.is_comment_keyword_multi_line,
is_comment_codeblock:this.is_comment_codeblock,
parenth_depth:this.parenth_depth,
bracket_depth:this.bracket_depth,
curly_depth:this.curly_depth,
next_token:this.next_token,
parents:this.parents,
prev_nw_token_data:this.prev_nw_token_data,
is_post_type_def_modifier:this.is_post_type_def_modifier,
post_type_def_modifier_type_def_token:this.post_type_def_modifier_type_def_token,
is_keyword_before_parentheses:this.is_keyword_before_parentheses,
last_non_whiste_space_line_break_token:this.last_non_whiste_space_line_break_token,
after_dot_is_type_js:this.after_dot_is_type_js,
func_end_queue:this.func_end_queue,
inside_parameters:this.inside_parameters,
preprocess_code:this.preprocess_code,
iter_code_is_comment:this.iter_code_is_comment,
iter_code_is_multi_line_comment:this.iter_code_is_multi_line_comment,
iter_code_string_char:this.iter_code_string_char,
iter_code_is_regex:this.iter_code_is_regex,
iter_code_is_preprocessor:this.iter_code_is_preprocessor,
iter_code_prev_non_whitespace_char:this.iter_code_prev_non_whitespace_char,
iter_code_inside_template_curly_depth:this.iter_code_inside_template_curly_depth,
iter_code_inside_template_curly_end:this.iter_code_inside_template_curly_end,
iter_code_forced_multi_line_comment_end:this.iter_code_forced_multi_line_comment_end,
};
if (this.derived_retrieve_state){
this.derived_retrieve_state(data);
}
return new vhighlight.TokenizerState(vhighlight.internal.deep_copy(data));
}
const keys=Object.keys(state.data);
for (let i=0;i<keys.length;i++){
if (typeof state.data[keys[i]]==="object"&&state.data[keys[i]]!=null){
this[keys[i]]=vhighlight.internal.deep_copy(state.data[keys[i]]);
}
else {
this[keys[i]]=state.data[keys[i]];
}
}
}
_random=function(length=32){
const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let result="";
for (let i=0;i<length;i++){
result+=chars.charAt(Math.floor(Math.random()*chars.length));
}
return result;
}
add_parent(token,curly_depth=null,parenth_depth=null){
if (token.data.length>0){
if (this.is_indent_language){
this.parents.push({token:token,indent:this.line_indent});
}else {
if (curly_depth==null){
curly_depth=this.curly_depth;
}
if (parenth_depth==null){
parenth_depth=this.parenth_depth;
}
this.parents.push({token:token,curly:curly_depth,parenth:parenth_depth});
}
}
}
assign_parents(token){
token.parents=[];
this.parents.iterate((item)=>{
token.parents.push(item.token);
})
}
copy_parents(){
let copy=[];
this.parents.iterate((item)=>{
copy.push({...item});
})
return copy;
}
get_last_token(exclude=[]){
return this.tokens.iterate_tokens_reversed((token)=>{
if (token.data!=""&&(exclude.length===0||!exclude.includes(token.data))){
return token;
}
})
}
get_prev_token_by_token(token,exclude=[" ","\t","\n"],also_check_current_token=false,exclude_comments=false){
if (token==="last"){
if (this.tokens[this.line]==null){
token=null;
}else {
token=this.tokens[this.line];
if (token){token=token.last()};
}
}
if (token===null){
return null;
}
let line=token.line;
let col=token.col;
const get_prev=()=>{
if (line<0){return null;}
else if (col===0){
if (line===0){return null;}
--line;
col=this.tokens[line].length-1;
return this.tokens[line][col];
}
--col;
return this.tokens[line][col];
}
if (also_check_current_token){
do {
if (exclude_comments&&token.is_comment){
continue;
}
else if (
token.data!=""&&!exclude.includes(token.data)
){
return token;
}
}
while ((token=get_prev())!=null);
}else {
while ((token=get_prev())!=null){
if (exclude_comments&&token.is_comment){
continue;
}
else if (
token.data!=""&&!exclude.includes(token.data)
){
return token;
}
}
}
return null;
}
get_next_token_by_token(token,exclude=[" ","\t","\n"],exclude_comments=false){
if (token===null){return null;}
let line=token.line,col=token.col;
const get_next=()=>{
if (line>this.line){return null;}
else if (col===this.tokens[line].length-1){
if (line===this.line){return null;}
++line;
col=0;
return this.tokens[line][col];
}
++col;
return this.tokens[line][col];
}
while ((token=get_next())!=null){
if (exclude_comments&&token.is_comment){
continue;
}
else if (
token.data!=""&&!exclude.includes(token.data)
){
return token;
}
}
return null;
}
get_prev_token(index,exclude=[" ","\t","\n"],exclude_comments=false){
if (index===null){return null;}
else if (typeof index==="object"){
const get_prev=()=>{
if (index.line<0){return null;}
else if (index.col===0){
if (index.line===0){return null;}
--index.line;
index.col=this.tokens[index.line].length-1;
return this.tokens[index.line][index.col];
}
--index.col;
return this.tokens[index.line][index.col];
}
let token;
while ((token=get_prev())!=null){
if (exclude_comments&&token.is_comment){
continue;
}
else if (
token.data!=""&&!exclude.includes(token.data)
){
return token;
}
}
return null;
}
else {
return this.tokens.iterate_tokens_reversed((token)=>{
if (token.index<=index){
if (exclude_comments&&token.is_comment){
return null;
}
if (token.data!=""&&!exclude.includes(token.data)){
return token;
}
}
})
}
}
str_includes_word_boundary(str){
for (let i=0;i<this.word_boundaries.length;i++){
if (str.includes(this.word_boundaries[i])){
return true;
}
}
return false;
}
is_linebreak_whitespace_batch(x=null){
if (x!==null){
for (let i=0;i<x.length;i++){
const c=x.charAt(i);
if (c!==" "&&c!=="\t"&&c!=="\n"){
return false;
}
}
return true;
}else {
for (let i=0;i<this.batch.length;i++){
const c=this.batch.charAt(i);
if (c!==" "&&c!=="\t"&&c!=="\n"){
return false;
}
}
return true;
}
}
eq_first(substr,start_index=0){
if (start_index+substr.length>this.code.length){
return false;
}
const end=start_index+substr.length;
let y=0;
for (let x=start_index;x<end;x++){
if (this.code.charAt(x)!=substr.charAt(y)){
return false;
}
++y;
}
return true;
}
eq_first_of(array,start_index=0){
for (let i=0;i<array.length;i++){
if (this.eq_first(array[i],start_index)){
return i;
}
}
return null;
}
lookup({query,index=0,exclude_str=true,exclude_comment=true,exclude_regex=true,exclude_preprocessor=true,exclude_escaped=true}){
if (typeof query==="string"){
query=[query];
}
const info_obj={index:null};
const query_match=()=>{
for (let i=0;i<query.length;i++){
if (this.eq_first(query[i],info_obj.index)){
return true;
}
}
return false;
}
return this.iterate_code(info_obj,index, null,(char,is_str,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor)=>{
if (
(exclude_str===false||is_str===false)&&
(exclude_comment===false||(is_comment===false&&is_multi_line_comment===false))&&
(exclude_regex===false||is_regex===false)&&
(exclude_preprocessor===false||is_preprocessor===false)&&
(exclude_escaped===false||is_escaped===false)&&
query_match()
){
return info_obj.index;
}
});
}
get_closing_parentheses(index){
return this.get_closing_wrapper(index,"(",")");
}
get_closing_curly(index){
return this.get_closing_wrapper(index,"{","}");
}
get_closing_bracket(index){
return this.get_closing_wrapper(index,"[","]");
}
get_closing_template(index){
return this.get_closing_wrapper(index,"<",">");
}
get_closing_wrapper(index,opener,closer){
let depth=0;
let start_index=index;
if (this.code.charAt(index)===closer){
depth=1;
start_index=index+1;
}
const info_obj={index:null};
return this.iterate_code(info_obj,start_index, null,(char,is_str,is_comment,is_multi_line_comment,is_regex)=>{
if (!is_str&&!is_comment&&!is_multi_line_comment&&!is_regex){
if (char===opener){
++depth;
}else if (char===closer){
--depth;
if (depth===0){
return info_obj.index;
}
}
}
});
}
get_opening_parentheses(index){
return this.get_opening_wrapper(index,"(",")");
}
get_opening_curly(index){
return this.get_opening_wrapper(index,"{","}");
}
get_opening_bracket(index){
return this.get_opening_wrapper(index,"[","]");
}
get_opening_template(index){
return this.get_opening_wrapper(index,"<",">");
}
get_opening_wrapper=(index,opener,closer)=>{
let depth=0;
let start_index=index;
let result=null;
this.tokens.iterate_reversed((line_tokens)=>{
if (line_tokens.length>0){
line_tokens.iterate_reversed((token)=>{
if (token.index<=start_index){
if (token.data===opener){
--depth;
if (depth===0){
result=token;
return false;
}
}else if (token.data===closer){
++depth;
}
}
})
if (result!==null){
return false;
}
}
})
return result;
}
get_first_non_whitespace(index,include_line_breaks=false){
if (index==null){
return null;
}
let end;
for (end=index;end<this.code.length;end++){
const c=this.code.charAt(end);
if (c!==" "&&c!=="\t"&&(include_line_breaks===false||c!=="\n")){
return end;
}
}
return null;
}
get_first_whitespace(index,include_line_breaks=false,def=null){
if (index==null){
return def;
}
let end;
for (end=index;end<this.code.length;end++){
const c=this.code.charAt(end);
if (c===" "||c==="\t"||(include_line_breaks&&c==="\n")){
return end;
}
}
return def;
}
get_first_word_boundary(index){
if (index==null){
return null;
}
for (let i=index;i<this.code.length;i++){
if (this.word_boundaries.includes(this.code.charAt(i))){
return i;
}
}
return this.code.length;
}
is_whitespace(char){
return char==" "||char=="\t";
}
is_alphabetical(char){
return char.length>0&&Tokenizer.alphabet.includes(char);
}
is_uppercase(char){
return char.length>0&&Tokenizer.uppercase_alphabet.includes(char);
}
is_full_uppercase(str,other_allowed_chars=null){
if (str.length===0){
return false;
}
for (let i=0;i<str.length;i++){
if (
Tokenizer.uppercase_alphabet.includes(str.charAt(i))===false&&
(other_allowed_chars===null||other_allowed_chars.includes(str.charAt(i))===false)
){
return false;
}
}
return true;
}
is_numerical(char){
return char.length>0&&Tokenizer.numerics.includes(char);
}
is_escaped(index,str=null){
if (str==null){
if (this.code.charAt(index-1)=="\\"){
if (this.code.charAt(index-2)=="\\"){
return this.is_escaped(index-2);
}
return true;
}
}else {
if (str.charAt(index-1)=="\\"){
if (str.charAt(index-2)=="\\"){
return this.is_escaped(index-2,str);
}
return true;
}
}
return false;
}
concat_tokens(tokens){
tokens.iterate_tokens((token)=>{
token.line=this.line;
if (token.is_line_break){
++this.line;
}
token.offset=this.offset;
this.offset+=token.data.length;
token.index=this.added_tokens;
++this.added_tokens;
if (this.tokens[token.line]===undefined){
token.col=0;
this.tokens[token.line]=[token];
}else {
token.col=this.tokens[token.line].length;
this.tokens[token.line].push(token);
}
})
}
assign_tokens(tokens){
this.tokens=new vhighlight.Tokens();
this.line=0;
this.offset=0;
this.added_tokens=0;
tokens.iterate_tokens((token)=>{
if (token.remove===true){
return null;
}
token.line=this.line;
if (token.is_line_break){
++this.line;
}
token.offset=this.offset;
this.offset+=token.data.length;
token.index=this.added_tokens;
++this.added_tokens;
if (this.tokens[token.line]===undefined){
token.col=0;
this.tokens[token.line]=[token];
}else {
token.col=this.tokens[token.line].length;
this.tokens[token.line].push(token);
}
})
}
trim_tokens(tokens,reversed=false){
if (tokens.length===0){return [];}
for (let i=tokens.length-1;i>=0;i--){
const token=tokens[i];
if (token.is_whitespace===true){
--tokens.length;
}else {
break;
}
}
let clean=[],first=true;
for (let i=0;i<tokens.length;i++){
const token=tokens[i];
if (first&&token.is_whitespace===true){
continue;
}else {
first=false;
clean.push(token)
}
}
if (reversed){
tokens=[];
clean.iterate_reversed((token)=>{
tokens.push(token)
})
return tokens;
}else {
return clean;
}
return clean;
}
assign_token_as_type(token){
token.token="type";
}
assign_token_as_type_def(token,opts={start_token:null}){
token.token="type_def"



if (
token.parents!=null&&token.parents.length>0&&
((this.is_js&&token.data==="constructor")||(this.is_py&&token.data==="__init__"))
){
const class_parent=token.parents[0];
class_parent.constructor_index=token.index;
}
if (this.compiler){
let start_token=token;
if (opts.start_token!=null){
start_token=opts.start_token;
}
else if (this.is_js){
let prev=token;
let must_be_keyword=false;
let allow_next=false;
while ((prev=this.get_prev_token_by_token(prev,[" ","\t","\n"]))!=null){
if (allow_next){
start_token=prev;
allow_next=false;
}
else if (prev.token==="keyword"){
must_be_keyword=true;
start_token=prev;
}else if (must_be_keyword){
break;
}
else if (prev.data==="."){
start_token=prev;
allow_next=true;
}
else {
break;
}
}
}
let prev=start_token;
let indent="";
while ((prev=this.get_prev_token_by_token(prev,[]))!=null){
if (prev.is_whitespace&&!prev.is_line_break){
indent+=prev.data;
}else {
break;
}
}
const func_id=this._random(16);
start_token.func_id=func_id;
start_token.curly_depth=this.curly_depth;
start_token.parenth_depth=this.parenth_depth;
start_token.bracket_depth=this.bracket_depth;
start_token.indent=indent;
this.func_end_queue.push({
func_id:func_id,
curly_depth:this.curly_depth,
parenth_depth:this.parenth_depth,
bracket_depth:this.bracket_depth,
token:start_token,
});
}
}
append_token(token=null,extended={}){
const obj={...extended};
obj.data=this.batch;
obj.index=this.added_tokens;
obj.line=this.line;
obj.offset=this.offset;
if (token!=null){
obj.token=token;
}
if (
(extended.is_word_boundary===true)||
(
this.batch.length===1&&
(token===null||token==="operator")&&
this.word_boundaries.includes(this.batch)
)
){
obj.is_word_boundary=true;
}
if (obj.data.length===1&&(obj.data===" "||obj.data==="\t"||obj.data==="\n")){
obj.is_whitespace=true;
}
if (token==="line"||(this.allow_preprocessors&&token==="string")){
if (this.is_comment){
obj.is_comment=true;
}
if (this.is_str){
obj.is_str=true;
}
if (this.is_regex){
obj.is_regex=true;
}
if (this.is_preprocessor){
obj.is_preprocessor=true;
}
}
this.offset+=this.batch.length;
if (obj.is_line_break!==true&&this.batch!==" "&&this.batch!=="\t"&&this.batch!=="\n"){
this.prev_nw_token_data=obj.data;
}
++this.added_tokens;
if (token==="line"){
obj.is_line_break=true;
}
if (this.tokens[this.line]===undefined){
obj.col=0;
this.tokens[this.line]=[obj];
}else {
obj.col=this.tokens[this.line].length;
this.tokens[this.line].push(obj);
}
if (obj.is_whitespace!==true&&obj.is_line_break!==true){
this.last_non_whiste_space_line_break_token=obj;
}
if (token==="type_def"){
this.assign_parents(obj);
this.assign_token_as_type_def(obj);
if (this.on_type_def_keyword===undefined){
this.add_parent(obj);
}
}
if (token==="type"||token==="type_def"){
obj.curly_depth=this.curly_depth;
obj.parenth_depth=this.parenth_depth;
obj.bracket_depth=this.bracket_depth;
}else {
switch (obj.data){
case "[":case "]":
case "{":case "}":
case "(":case ")":
obj.curly_depth=this.curly_depth;
obj.parenth_depth=this.parenth_depth;
obj.bracket_depth=this.bracket_depth;
break;
default:
break;
}
}
if (this.compiler){
if (obj.data==="}"&&(this.is_js||this.is_cpp)){
let dropped=[];
this.func_end_queue.iterate((item)=>{
if (
obj.curly_depth===item.curly_depth&&
obj.parenth_depth===item.parenth_depth&&
obj.bracket_depth===item.bracket_depth
){
obj.func_id=item.func_id;
item.token.func_end={line:obj.line,col:obj.col}
return false;
}
else {
dropped.push(item);
}
})
this.func_end_queue=dropped;
}
}
return obj;
}
append_batch(token=null,extended={}){
if (this.batch.length==0){
return null;
}
let appended_token;
if (
this.after_dot_is_type_js&&
this.batch!=="extends"&&
this.batch!=="."&&
this.batch!==" "&&
this.batch!=="\n"&&
this.batch!=="\t"&&
this.code.charAt(this.index)!=="."
){
token="type";
this.after_dot_is_type_js=false;
}
if (token==false){
appended_token=this.append_token(null,extended);
}
else if (token!=null){
appended_token=this.append_token(token,extended);
}
else if (this.next_token!=null){
if (this.is_linebreak_whitespace_batch()){
appended_token=this.append_token(null,extended);
}
else if (extended.is_word_boundary===true||this.word_boundaries.includes(this.batch)){
appended_token=this.append_token(null,{is_word_boundary:true});
this.next_token=null;
}
else if (this.keywords.includes(this.batch)){
appended_token=this.append_token("keyword");
this.next_token=null;
}
else {
appended_token=this.append_token(this.next_token,extended);
if (this.next_token==="type_def"&&this.on_type_def_keyword!==undefined){
this.on_type_def_keyword(appended_token);
}
this.next_token=null;
}
}
else {
if (this.keywords.includes(this.batch)){
if (
this.type_def_keywords.includes(this.batch)&&
(this.prev_nw_token_data==null||this.exclude_type_def_keywords_on_prev.length===0||this.exclude_type_def_keywords_on_prev.includes(this.prev_nw_token_data)==false)
){
this.next_token="type_def";
}
else if (this.type_keywords.includes(this.batch)){
if (this.is_js&&this.batch==="extends"){
this.after_dot_is_type_js=true;
}else {
this.next_token="type";
}
}
appended_token=this.append_token("keyword");
}
else if (
this.operators.includes(this.batch)&&
(this.language!=="Bash"||this.batch!=="/"||(this.is_alphabetical(this.next_char)===false&&this.is_alphabetical(this.prev_char)===false))
){
appended_token=this.append_token("operator",{is_word_boundary:true});
}
else if (this.allow_numerics&&/^-?\d+(\.\d+)?$/.test(this.batch)){
appended_token=this.append_token("numeric");
}
else {
appended_token=this.append_token(null,extended);
}
}
this.batch="";
return appended_token;
}
append_forward_lookup_batch(token,data,extended={}){
let appended_token,appended_tokens=[];
if (this.batch.length>0){
appended_token=this.append_batch();
if (appended_token!=null){
appended_tokens.push(appended_token);
}
}
this.batch="";
this.next_token=null;
for (let i=0;i<data.length;i++){
let c=data.charAt(i);
if (c=="\n"&&!this.is_escaped(i,data)){
appended_token=this.append_batch(token,extended);
if (appended_token!=null){
appended_tokens.push(appended_token);
}
this.batch="\n";
const appended_line_token=this.append_batch("line",extended);
if (appended_token!=null){
appended_tokens.push(appended_token);
}
++this.line;
}else {
this.batch+=c;
}
}
appended_token=this.append_batch(token,extended);
if (appended_token!=null){
appended_tokens.push(appended_token);
}
return appended_tokens;
}
resume_on_index(index){
this.index=index;
}
iterate_code(info_obj={index:0,prev_char:null,next_char:null},start=null,end=null,callback){
if (start==null){
start=0;
}
if (end==null){
end=this.code.length;
}
let is_comment=false;
let is_multi_line_comment=false;
let string_char=null;
let is_regex=false;
let is_preprocessor=false;
let prev_non_whitespace_char=null;
let multi_line_comment_check_close_from_index=null;
let inside_template_curly_depth=0;
let inside_template_curly_end=[];
let forced_multi_line_comment_end=null;
if (info_obj===this){
is_comment=this.iter_code_is_comment;
is_multi_line_comment=this.iter_code_is_multi_line_comment;
string_char=this.iter_code_string_char;
is_regex=this.iter_code_is_regex;
is_preprocessor=this.iter_code_is_preprocessor;
prev_non_whitespace_char=this.iter_code_prev_non_whitespace_char;
inside_template_curly_depth=this.iter_code_inside_template_curly_depth;
inside_template_curly_end=this.iter_code_inside_template_curly_end;
forced_multi_line_comment_end=this.iter_code_forced_multi_line_comment_end;
}
for (info_obj.index=start;info_obj.index<end;info_obj.index++){
const char=this.code.charAt(info_obj.index);
if (info_obj.index>0){
info_obj.prev_char=this.code.charAt(info_obj.index-1);
}
info_obj.next_char=this.code.charAt(info_obj.index+1);
if (info_obj.prev_char!=" "&&info_obj.prev_char!="\t"){
prev_non_whitespace_char=info_obj.prev_char;
}
const is_escaped=this.is_escaped(info_obj.index);
if (
this.allow_preprocessors&&
!is_preprocessor&&
(prev_non_whitespace_char=="\n"||info_obj.index===0)&&
char=="#"
){
is_preprocessor=true;
const res=callback(char, false,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
else if (
is_preprocessor&&
(char=="\n"&&prev_non_whitespace_char!="\\")
){
is_preprocessor=false;
const res=callback(char, false,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
if (
!is_escaped&&
!is_comment&&
!is_multi_line_comment&&
!is_regex
&&string_char==null
){
if (
this.single_line_comment_start!==false&&
(
(this.single_line_comment_start.length===1&&char===this.single_line_comment_start)||
(this.single_line_comment_start.length!==1&&this.eq_first(this.single_line_comment_start,info_obj.index))
)
){
is_preprocessor=false;
is_comment=true;
const res=callback(char, false,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
let is_array_index;
if (
this.multi_line_comment_start!==false&&
(this.multi_line_comment_only_at_start===false||prev_non_whitespace_char==="\n"||prev_non_whitespace_char==="")&&
(
(!this.multi_line_comment_start_is_array&&this.multi_line_comment_start.length===1&&char===this.multi_line_comment_start)||
(!this.multi_line_comment_start_is_array&&this.multi_line_comment_start.length!==1&&this.eq_first(this.multi_line_comment_start,info_obj.index))||
(this.multi_line_comment_start_is_array&&(is_array_index=this.eq_first_of(this.multi_line_comment_start,info_obj.index))!==null)
)
){
if (this.multi_line_comment_start_is_array){
forced_multi_line_comment_end=this.multi_line_comment_start[is_array_index];
multi_line_comment_check_close_from_index=info_obj.index+forced_multi_line_comment_end.length*2;
}else {
multi_line_comment_check_close_from_index=info_obj.index+this.multi_line_comment_start.length+this.multi_line_comment_end.length;
}
is_multi_line_comment=true;
const res=callback(char, false,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
}
else if (
is_comment&&
!is_escaped&&char=="\n"
){
is_comment=false;
const res=callback(char, false,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
else if (
is_multi_line_comment&&
!is_escaped&&
info_obj.index>=multi_line_comment_check_close_from_index&&
(
(!this.multi_line_comment_start_is_array&&this.multi_line_comment_end.length===1&&char==this.multi_line_comment_end)||
(!this.multi_line_comment_start_is_array&&this.multi_line_comment_end.length!==1&&this.eq_first(this.multi_line_comment_end,info_obj.index-(this.multi_line_comment_end.length-1)))||
(this.multi_line_comment_start_is_array&&forced_multi_line_comment_end!==null&&this.eq_first(forced_multi_line_comment_end,info_obj.index-(forced_multi_line_comment_end.length-1)))
)
){
forced_multi_line_comment_end=null;
is_multi_line_comment=false;
const res=callback(char, false,is_comment, true,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
if (
(this.allow_strings||(this.allow_strings_double_quote&&char==='"'))&&
!is_escaped&&
!is_comment&&
!is_multi_line_comment&&
!is_regex&&
string_char===null&&
(
char=='"'||
char=="'"||
char=='`'
)
){
string_char=char;
const res=callback(char, true,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
else if (
!is_escaped&&
string_char!==null&&
char===string_char
){
string_char=null;
const res=callback(char, true,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
else if (string_char!==null){
if (string_char==="`"&&this.is_js&&char==="$"&&info_obj.next_char==="{"){
if (inside_template_curly_end.length===0){
inside_template_curly_depth=0;
}
inside_template_curly_end.push(inside_template_curly_depth);
string_char=null;
const res=callback(char, false,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
const res=callback(char, true,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
if (inside_template_curly_end.length!==0){
if (string_char===null&&char==="{"){
++inside_template_curly_depth;
}else if (string_char===null&&char==="}"){
--inside_template_curly_depth;
if (inside_template_curly_end[inside_template_curly_end.length-1]===inside_template_curly_depth){
--inside_template_curly_end.length;
string_char="`";
const res=callback(char, false,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
}
}
else if (is_comment||is_multi_line_comment){
const res=callback(char, false,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
if (this.allow_slash_regexes&&!is_escaped&&!is_regex&&char=="/"){
let prev=null;
for (let p=info_obj.index-1;p>=0;p--){
const c=this.code.charAt(p);
if (c!=" "&&c!="\t"){
prev=c;
break;
}
}
if (
prev!=null&&
prev!=="<"&&
this.code.charAt(info_obj.index+1)!==">"&&
(
prev=="\n"||prev==","||prev=="("||
prev=="["||prev=="{"||prev==":"||
this.operators.includes(prev)
)
){
is_regex=true;
const res=callback(char, false,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
}
else if (is_regex){
if (char=='/'&&!is_escaped){
is_regex=false;
}
const res=callback(char, false,is_comment,is_multi_line_comment, true,is_escaped,is_preprocessor);
if (res!=null){return res;}
continue;
}
const res=callback(char, false,is_comment,is_multi_line_comment,is_regex,is_escaped,is_preprocessor);
if (res!=null){return res;}
}
if (info_obj===this){
this.iter_code_is_comment=is_comment;
this.iter_code_is_multi_line_comment=is_multi_line_comment;
this.iter_code_string_char=string_char;
this.iter_code_is_regex=is_regex;
this.iter_code_is_preprocessor=is_preprocessor;
this.iter_code_prev_non_whitespace_char=prev_non_whitespace_char;
this.iter_code_inside_template_curly_depth=inside_template_curly_depth;
this.iter_code_inside_template_curly_end=inside_template_curly_end;
this.iter_code_forced_multi_line_comment_end=forced_multi_line_comment_end;
}
return null;
};
tokenize({
code=null,
stop_callback=undefined,
build_html=false,
is_insert_tokens=false,
state=null,
}={}){
this.reset();
if (this.derived_reset!==undefined){
this.derived_reset();
}
if (state){
this.state(state);
}
if (code!==null){
this.code=code;
}
const append_comment_codeblock_batch=()=>{
if (this.multi_line_comment_start==="/*"){
let i,separate=false;
for (i=0;i<this.batch.length;i++){
const c=this.batch.charAt(i);
if (c==="*"){
separate=true;
const next=this.batch.charAt(i+1);
if (next===" "||next==="\t"){
i+=2;
}
break;
}
else if (c===" "||c==="\t"){
continue;
}
else {
break;
}
}
if (separate){
const after=this.batch.substr(i);
this.batch=this.batch.substr(0,i);
this.append_batch("comment",{is_comment:true});
this.batch=after;
}
}
this.append_batch("comment_codeblock",{is_comment:true});
}
const auto_append_batch_switch=(default_append=true)=>{
if (this.is_comment_keyword){
this.append_batch("comment_keyword",{is_comment:true,is_multi_line_comment:this.is_comment_keyword_multi_line});
}else if (this.is_comment_codeblock){
append_comment_codeblock_batch();
}else if (this.is_comment){
this.append_batch("comment",{is_comment:true});
}else if (this.is_str){
this.append_batch("string");
}else if (this.is_regex){
this.append_batch("string");
}else if (this.is_preprocessor){
this.append_batch("preprocessor");
}else {
if (default_append){
this.append_batch();
}else {
return false;
}
}
return true;
}
let shebang_allowed=true;
let disable_start_of_line=false;
let start_of_line_last_line=null;
const stopped=this.iterate_code(this, null, null,(char,local_is_str,local_is_comment,is_multi_line_comment,local_is_regex,is_escaped,is_preprocessor)=>{
if (!this.preprocess_code){
this.callback(char,is_escaped, this.is_preprocessor)
return null;
}
if (disable_start_of_line){
disable_start_of_line=false;
this.start_of_line=false;
}
else if (this.start_of_line||start_of_line_last_line!=this.line){
this.start_of_line=true;
if (char===" "||char==="\t"){
++this.line_indent;
disable_start_of_line=false;
}
else if (char!=="\n"){
disable_start_of_line=true;
start_of_line_last_line=this.line;
}
}
if (
this.start_of_line&&
this.is_indent_language&&
char!==" "&&char!=="\t"&&char!=="\n"&&
char!==this.single_line_comment_start&&
char!==this.multi_line_comment_start&&
this.parents.length>0&&
this.parents[this.parents.length-1].indent>=this.line_indent
){
let parents=[];
this.parents.iterate((item)=>{
if (item.indent>=this.line_indent){
return null;
}
parents.push(item);
})
this.parents=parents;
}
if (this.line===0&&this.start_of_line&&char==="#"&&this.next_char==="!"){
this.append_batch();
let shebang="";
let resume_index;
for (resume_index=this.index;resume_index<this.code.length;resume_index++){
const c=this.code.charAt(resume_index);
if (c==="\n"){
break;
}
shebang+=c;
}
let last_word_boundary;
for (last_word_boundary=shebang.length-1;last_word_boundary>0;last_word_boundary--){
if (this.word_boundaries.includes(shebang.charAt(last_word_boundary))){
break;
}
}
if (last_word_boundary===0){
this.batch=shebang;
this.append_batch("comment");
}else {
++last_word_boundary;
this.batch=shebang.substr(0,last_word_boundary);
this.append_batch("comment");
this.batch=shebang.substr(last_word_boundary);
this.append_batch("keyword");
}
this.resume_on_index(resume_index-1);
return null;
}
else if (!is_escaped&&char=="\n"){
auto_append_batch_switch();
if (!local_is_str){
this.is_str=false;
}
if (!local_is_comment&&!is_multi_line_comment){
this.is_comment=false;
this.is_comment_keyword=false;
this.is_comment_keyword_multi_line=false;
}
if (!local_is_regex){
this.is_regex=false;
}
if (this.is_preprocessor&&!is_preprocessor){
this.is_preprocessor=false;
this.is_str=false;
}
this.batch+=char;
this.append_batch("line");
if (stop_callback!==undefined){
const stop=stop_callback(this.line, this.tokens[this.line]);
if (stop){
return true;
}
}
this.start_of_line=true;
this.line_indent=0;
++this.line;
}
else if (local_is_comment||is_multi_line_comment){
if (!this.is_comment){
auto_append_batch_switch();
this.is_comment=true;
this.batch+=char;
}
else {
const is_not_ui_escaped=this.prev_char!=="\\";
if (this.is_comment_codeblock&&char==="`"&&this.next_char!=="`"){
this.batch+=char;
auto_append_batch_switch();
this.is_comment_codeblock=false;
}
else if (this.allow_comment_codeblock&&is_not_ui_escaped&&!this.is_comment_codeblock&&char==="`"){
auto_append_batch_switch();
this.is_comment_codeblock=true;
this.batch+=char;
}
else if (this.allow_comment_keyword&&!this.is_comment_codeblock&&char==="@"&&is_not_ui_escaped){
auto_append_batch_switch();
this.is_comment_keyword=true;
this.is_comment_keyword_multi_line=is_multi_line_comment;
this.batch+=char;
}
else if (this.is_comment_keyword&&is_not_ui_escaped&&(char!=="-"&&char!=="_"&&char!=="/"&&this.word_boundaries.includes(char))){
auto_append_batch_switch();
this.is_comment_keyword=false;
this.is_comment_keyword_multi_line=false;
this.batch+=char;
}
else {
this.batch+=char;
}
}
}
else if (local_is_str){
if (!this.is_str){
if (auto_append_batch_switch(false)===false){
if (this.special_string_prefixes.includes(this.batch)){
this.append_batch("keyword");
}else {
this.append_batch();
}
}
this.is_str=true;
}
this.batch+=char;
}
else if (local_is_regex){
if (!this.is_regex){
auto_append_batch_switch();
this.is_regex=true;
}
this.batch+=char;
}
else if (is_preprocessor){
if (!this.is_preprocessor){
auto_append_batch_switch();
this.is_preprocessor=true;
}
if (char=="<"&&this.batch.replaceAll(" ","").replaceAll("\t","")=="#include"){
auto_append_batch_switch();
this.is_str=true;
this.batch+=char;
}else if (char==">"&&this.is_str){
this.batch+=char;
auto_append_batch_switch();
this.is_str=false;
}
else {
this.batch+=char;
}
}
else {
if (char=="["){
++this.bracket_depth;
}else if (char=="]"){
--this.bracket_depth;
}
if (char=="{"){
++this.curly_depth;
if (this.is_post_type_def_modifier){
this.is_post_type_def_modifier=false;
if (this.on_post_type_def_modifier_end!==undefined){
const last_token=this.get_last_token();
if (last_token!=null){
this.on_post_type_def_modifier_end(this.post_type_def_modifier_type_def_token,last_token);
}
}
}
}else if (char=="}"){
--this.curly_depth;
if (this.is_indent_language===false){
let parents=[];
this.parents.iterate((item)=>{
if (item.curly===this.curly_depth&&item.parenth===this.parenth_depth){
return null;
}
parents.push(item);
})
this.parents=parents;
}
}
if (char=="("){
++this.parenth_depth;
if (this.is_type_language){
if (
this.last_non_whiste_space_line_break_token!==null&&
this.last_non_whiste_space_line_break_token.token==="keyword"&&
this.allowed_keywords_before_type_defs.includes(this.last_non_whiste_space_line_break_token.data)===false
){
this.is_keyword_before_parentheses=true;
}
else {
this.is_keyword_before_parentheses=false;
}
}
}else if (char==")"){
--this.parenth_depth;
}
if (this.is_post_type_def_modifier&&char===";"){
this.is_post_type_def_modifier=false;
if (this.on_post_type_def_modifier_end!==undefined){
const last_token=this.get_last_token();
if (last_token!=null){
this.on_post_type_def_modifier_end(this.post_type_def_modifier_type_def_token,last_token);
}
}
}
if (this.is_comment_keyword){
this.append_batch("comment_keyword",{is_comment:true});
this.is_comment_keyword=false;
this.is_comment_keyword_multi_line=false;
}
else if (this.is_comment_codeblock){
append_comment_codeblock_batch();
this.is_comment_codeblock=false;
}
else if (this.is_comment){
this.append_batch("comment",{is_comment:true});
this.is_comment=false;
this.is_comment_keyword=false;
this.is_comment_keyword_multi_line=false;
this.is_comment_codeblock=false;
}
else if (this.is_str){
this.append_batch("string");
this.is_str=false;
}
else if (this.is_regex){
this.append_batch("string");
this.is_regex=false;
}
else if (this.is_preprocessor){
this.append_batch("preprocessor");
this.is_preprocessor=false;
}
if (this.allow_decorators&&char==="@"){
this.append_batch();
let batch="@";
for (let i=this.index+1;i<this.code.length;i++){
const c=this.code.charAt(i);
if (this.word_boundaries.includes(c)){
break;
}
batch+=c;
}
if (batch.length>1){
this.batch=batch;
this.append_batch("type",{is_decorator:true,parameters:[]});
this.index+=batch.length-1;
return null;
}
}
else if (char==="("){
let token=this.append_batch();
token=this.get_prev_token_by_token("last",[" ","\t","\n"], true, true);
let added_inside_parameters=false;
if (token){
if (token.token!=="type_def"&&this.on_parenth_open!==undefined){
const res=this.on_parenth_open(token);
if (res){
token=res;
}
}
if (token!=null&&this.allow_parameters&&(token.token==="type_def"||token.token==="type")){
if (this.is_js){
token.is_assignment_parameters=undefined;
}
token.parameters=[];
this.inside_parameters.append({
is_type_def:token.token==="type_def",
curly_depth:this.curly_depth,
bracket_depth:this.bracket_depth,
parenth_depth:this.parenth_depth-1,
token:token,
parenth_tokens:[],
parenth_tokens_correct_depth:[],
});
added_inside_parameters=true;
}
}
this.batch+=char;
const added_token=this.append_batch(false,{is_word_boundary:true});
if (added_inside_parameters){
this.inside_parameters.last().opening_parenth_token=added_token;
}
return null;
}
else if (
this.inside_parameters.length>0&&
this.word_boundaries.includes(char)
){
const inside_param=this.inside_parameters.last();
const type_token=inside_param.token;
if (
this.is_js&&
inside_param.is_type_def&&
type_token.is_assignment_parameters===undefined&&
char==="{"
){
const prev=this.get_last_token([" ","\t","\n"]);
if (prev&&prev===inside_param.opening_parenth_token){
type_token.is_assignment_parameters=true;
}
}
let prev;
if (
inside_param.bracket_depth===this.bracket_depth&&
(inside_param.curly_depth===this.curly_depth||(type_token.is_assignment_parameters&&inside_param.curly_depth+1===this.curly_depth))&&
(this.parenth_depth===inside_param.parenth_depth+1||this.parenth_depth===inside_param.parenth_depth)&&
(
(prev=this.get_prev_token_by_token("last",[" ","\t","\n"], true, true))==null||
prev.data==="("||
prev.data===","||
(type_token.is_assignment_parameters&&prev.data==="{")||
(this.is_type_language&&(prev.token==="keyword"||prev.token==="type"||prev.token==="operator"||prev.data===">"))
)
){
const token=this.append_batch();
if (inside_param.is_type_def&&token!=null&&token.token==null&&!token.is_word_boundary&&!token.is_whitespace&&!token.is_line_break){
if (!this.is_type_language||(
this.is_type_language&&
(prev.token==="keyword"||prev.token==="type"||prev.token==="operator"||prev.data===">")
)){
token.token="parameter";
}else if (this.is_type_language){
token.token="type";
}
}
}
let is_end=false;
if (
char===")"&&
inside_param.parenth_depth===this.parenth_depth&&
inside_param.bracket_depth===this.bracket_depth&&
inside_param.curly_depth===this.curly_depth
){
is_end=true;
const token=this.append_batch();
if (inside_param.is_type_def&&token!=null&&token.token==null&&!token.is_word_boundary&&!token.is_whitespace&&!token.is_line_break){
token.token="parameter";
}
--this.inside_parameters.length;
this.is_post_type_def_modifier=true;
this.post_type_def_modifier_type_def_token=type_token;
const at_correct_depth_flags=[];
const parameter_tokens=[];
const last_token=this.get_last_token();
const correct_depth=new vhighlight.NestedDepth(type_token.is_assignment_parameters?1:0,0,1);
const parameter_depth=new vhighlight.NestedDepth(0,0,1);
const current_depth=new vhighlight.NestedDepth(0,0,0);
let line=type_token.line,col=type_token.col;
while (line<this.tokens.length){
++col;
if (col>=this.tokens[line].length){
++line;
col=0;
}
const token=this.tokens[line][col];
if (token!=null){
current_depth.process_token(token);
if (parameter_depth.gte(current_depth)&&(parameter_tokens.length>0||token.data!=="(")){
parameter_tokens.append(token);
at_correct_depth_flags.append(correct_depth.eq(current_depth)&&(at_correct_depth_flags.length>0||(token.data!=="("&&token.data!=="{")));
}
if (token===last_token){
break;
}
}else {break;}
}
let mode=1;
const params=[];
const init_param=()=>{
return {
name:null,
index:null,
value:[],
type:[],
};
}
const append_param=(param)=>{
if (param!==undefined){
param.type=this.trim_tokens(param.type);
param.value=this.trim_tokens(param.value);
param.index=params.length;
if (param.name!=null){
params.push(param);
}
};
}
const get_next_assignment_operator=(parenth_index)=>{
let next,next_i=parenth_index+1;
while ((next=parameter_tokens[next_i])!=null){
if (next.data.length===1&&next.data==="="){
if (parameter_tokens[next_i-1]!=null&&parameter_tokens[next_i-1].token==="operator"){
return null;
}
return next;
}else if (next.data.length!==1||(next.data!==" "&&next.data!=="\t"&&next.data==="\n")){
return null;
}
++next_i;
}
return null;
}
const is_type_def=type_token.token==="type_def";
const is_decorator=type_token.is_decorator===true;
let param;
let is_type=true;
let index=-1;
parameter_tokens.iterate(token=>{
++index;
const at_correct_depth=at_correct_depth_flags[index];
if (at_correct_depth&&token.is_word_boundary===true&&token.data===","){
append_param(param);
param=init_param();
mode=1;
is_type=true;
}
else if (at_correct_depth&&token.is_word_boundary===true&&token.data==="="){
mode=2;
}
else if (mode===1){
if (param===undefined){
param=init_param();
}
if (
at_correct_depth===false
){
return null;
}
if (
is_type&&
(
token.token==="keyword"||
token.token==="type"||
token.is_whitespace===true||
token.token==="operator"||
token.data==="."||
token.data===":"||
token.data==="<"||
token.data===">"||
token.data==="*"||
token.data==="&"
)
){
param.type.push(token);
}
else {
is_type=false;
const allow_assignment=(
token.token==="type_def"||
token.token==="parameter"||
(token.token===undefined&&token.data!=="{"&&token.data!=="}"&&token.data!=="("&&token.data!==")"&&token.data!=="["&&token.data!=="]")
);
if (allow_assignment&&(is_type_def||(this.is_js&&type_token===null))){
if (token.is_whitespace===true||token.is_word_boundary===true){
return null;
}
param.name=token.data.trim();
}
else if (!is_type_def&&(allow_assignment||is_decorator)){
const next=get_next_assignment_operator(index);
if (next!=null&&allow_assignment){
if (token.is_whitespace===true||token.is_word_boundary===true){
return null;
}
param.name=token.data.trim();
}
else if (next==null&&is_decorator){
param.value.push(token);
}
}
}
}
else if (
mode===2&&
(is_type_def||is_decorator)
){
param.value.push(token);
}
})
append_param(param);
type_token.parameters=params;
type_token.parameter_tokens=parameter_tokens;
}
}
if (this.callback===undefined||this.callback(char,is_escaped, this.is_preprocessor)!==true){
if (this.word_boundaries.includes(char)){
this.append_batch();
this.batch+=char;
this.append_batch(null,{is_word_boundary:true});
}
else {
this.batch+=char;
}
}
}
return null;
});
auto_append_batch_switch();
const last_line=this.tokens[this.tokens.length-1];
if (
is_insert_tokens===false&&
stop_callback==null&&
(last_line===undefined||(last_line.length>0&&last_line[last_line.length-1].is_line_break))
){
this.tokens.push([]);
}
if (build_html){
return this.build_html();
}
else {
return this.tokens;
}
}
build_html({
tokens=null,
token_prefix="token_",
reformat=true,
lt="<",
gt=">",
trim=false,
line_containers=false,
line_break="\n",
}={}){
if (tokens==null){
tokens=this.tokens;
}
let html="";
let is_codeblock=false;
const build_token=(token)=>{
if (token.token===undefined){
if (reformat){
html+=token.data.replaceAll("<","&lt;").replaceAll(">","&gt;");
}else {
html+=token.data;
}
}else if (token.token==="line"){
html+=line_break;
}else {
if (token.is_codeblock_start===true){
html+=`${lt}span class='token_codeblock'${gt}`;
is_codeblock=true;
}
let class_="";
if (token.token!==undefined){
class_=`class="${token_prefix}${token.token}"`;
}
if (reformat){
html+=`${lt}span ${class_}${gt}${token.data.replaceAll("<","&lt;").replaceAll(">","&gt;")}${lt}/span${gt}`
}else {
html+=`${lt}span ${class_}${gt}${token.data}${lt}/span${gt}`
}
if (token.is_codeblock_end===true){
html+=`${lt}/span${gt}`;
is_codeblock=false;
}
}
}
const build_tokens=(tokens)=>{
if (line_containers){
html+=`${lt}span class='token_line_container'${gt}`
}
if (is_codeblock){
html+=`${lt}span class='token_codeblock'${gt}`;
}
let start=true;
let end=null;
if (trim){
for (let i=tokens.length-1;i>=0;i--){
const token=tokens[i];
if (token.is_whitespace===true||token.is_line_break===true){
end=i;
}else {
break;
}
}
}
tokens.iterate(0,end,(token)=>{
if (trim){
if (start&&(token.is_whitespace===true||token.is_line_break===true)){
return null;
}
start=false;
}
build_token(token);
});
if (is_codeblock){
html+=`${lt}/span${gt}`
}
if (line_containers){
html+=`${lt}/span${gt}`
}
}
if (tokens.length>0){
let start=true;
if (Array.isArray(tokens[0])){
tokens.iterate(build_tokens);
}else {
build_tokens(tokens);
}
}
return html;
}
}
vhighlight.Bash=class Bash extends vhighlight.Tokenizer{
constructor(){
super({
keywords:[
"if",
"then",
"else",
"elif",
"fi",
"case",
"esac",
"while",
"do",
"done",
"for",
"select",
"until",
"function",
"in",
"return",
"continue",
"break",
"readonly",
"declare",
"local",
"typeset",
"true",
"false",
],
type_def_keywords:[
"function",
],
operators:[
'+','-','*','/','%',
'=','!=',
'!','-o','-a',
'-eq','-ne','-lt','-le','-gt','-ge',
'-e','-f','-d','-s','-r','-w','-x',
'&','|','^','~','<<','>>',
],
single_line_comment_start:"#",
allow_parameters:false,
language:"Bash",
});
}
callback(char,is_escaped){
const is_whitespace=this.is_whitespace(char);
if (char=="-"&&this.prev_char!=="-"&&this.word_boundaries.includes(this.prev_char)){
const next_whitespace=this.get_first_whitespace(this.index, true, this.code.length);
const arg=this.code.substr(this.index,next_whitespace-this.index);
this.append_batch();
this.append_forward_lookup_batch("parameter",arg);
this.resume_on_index(this.index+arg.length-1);
return true;
}
if (char=="$"&&(this.is_numerical(this.next_char)||this.next_char==="@"||this.next_char==="#"||this.next_char==="?")){
let batch="$";
let index=this.index+1;
while (true){
const c=this.code.charAt(index);
if (c==="@"||c==="#"||c==="?"||this.is_numerical(c)){
batch+=c;
}else {
break;
}
++index;
}
if (batch.length>1){
this.append_batch();
this.append_forward_lookup_batch("keyword",batch);
this.resume_on_index(this.index+batch.length-1);
return true;
}
}
if (this.start_of_line&&char==="$"&&(this.next_char===" "||this.next_char==="\t"||this.next_char==="\n")){
this.append_batch();
this.batch+=char;
this.append_batch("keyword");
this.current_line=null;
return true;
}
if ((this.start_of_line||this.prev_nw_token_data==="&")&&(this.is_alphabetical(char))){
let finished=false;
let passed_whitespace=false;
let word="";
let end_index=null;
for (let i=this.index;i<this.code.length;i++){
const c=this.code.charAt(i);
if (c==" "||c=="\t"){
passed_whitespace=true;
}else if (!passed_whitespace&&(this.is_alphabetical(c)||this.is_numerical(c))){
word+=c;
end_index=i;
}else if (passed_whitespace&&(char=="\\"||!this.operators.includes(char))){
finished=true;
break;
}else {
break;
}
}
if (finished&&!this.keywords.includes(word)){
this.append_batch();
this.append_forward_lookup_batch("type",word);
this.resume_on_index(end_index);
return true;
}
}
if (this.start_of_line&&char==":"){
let style=null;
let start_index=null;
let end_index=null;
for (let i=this.index+1;i<this.code.length;i++){
const c=this.code.charAt(i);
if (c==" "||c=="\t"){
continue;
}else if (c=="<"){
if (this.code.charAt(i+1)=="<"){
start_index=i+2;
style=1;
}
break;
}else if (c=="'"||c=='"'){
start_index=i+1;
style=2;
}else {
break;
}
}
if (style==1){
let close_sequence="";
let found_close_sequence=false;
const eq_first=(start_index)=>{
if (start_index+close_sequence.length>this.code.length){
return false;
}
const end=start_index+close_sequence.length;
let y=0;
for (let x=start_index;x<end;x++){
if (this.code.charAt(x)!=close_sequence.charAt(y)){
return false;
}
++y;
}
return true;
}
for (let i=start_index;i<this.code.length;i++){
const c=this.code.charAt(i);
if (!found_close_sequence){
if (this.is_whitespace(c)){
continue;
}else if (
c=='"'||
c=="'"||
c=="_"||
c=="-"||
this.is_numerical(c)||
this.is_alphabetical(c)
){
close_sequence+=c;
}else {
found_close_sequence=true;
if (close_sequence!='"'&&close_sequence!='""'&&close_sequence!="'"&&close_sequence!="''"){
const start_char=close_sequence.charAt(0);
if (start_char=="'"||start_char=='"'){
close_sequence=close_sequence.substr(1);
}
const end_char=close_sequence.charAt(close_sequence.length-1);
if (end_char=="'"||end_char=='"'){
close_sequence=close_sequence.substr(0,close_sequence.length-1);
}
}
}
}else {
if (eq_first(i)){
end_index=i+close_sequence.length-1;
break;
}
}
}
}
else if (style==2){
const closing_char=this.code.charAt(start_index-1);
for (let i=start_index;i<this.code.length;i++){
const c=this.code.charAt(i);
if (!is_escaped&&c==closing_char){
end_index=i;
break;
}
}
}
if (end_index!=null){
this.append_batch();
this.append_forward_lookup_batch("comment", this.code.substr(this.index,end_index-this.index+1));
this.resume_on_index(end_index);
return true;
}
}
return false;
}
on_parenth_open(token){
if (token.is_word_boundary){return ;}
let next=")";
for (let i=this.index+1;i<this.code.length;i++){
const c=this.code.charAt(i);
if (c===next){
if (next===")"){
next="{";
}else {
break;
}
}else if (c!==" "&&c!=="\t"&&c!=="\n"){
console.log("STOP",{c})
return ;
}
}
this.assign_parents(token);
this.assign_token_as_type_def(token);
return token;
}
}
vhighlight.bash=new vhighlight.Bash();
vhighlight.CPP=class CPP extends vhighlight.Tokenizer{
constructor({
allow_header_type_defs=true,
compiler=false,
inside_func=false,
}={}){
super({
keywords:[
"alignas",
"alignof",
"and",
"and_eq",
"asm",
"atomic_cancel",
"atomic_commit",
"atomic_noexcept",
"auto",
"bitand",
"bitor",
"bool",
"break",
"case",
"catch",
"char",
"char8_t",
"char16_t",
"char32_t",
"class",
"compl",
"concept",
"const",
"consteval",
"constexpr",
"constinit",
"const_cast",
"continue",
"co_await",
"co_return",
"co_yield",
"decltype",
"default",
"delete",
"do",
"double",
"dynamic_cast",
"else",
"enum",
"explicit",
"export",
"extern",
"false",
"float",
"for",
"friend",
"goto",
"if",
"inline",
"int",
"long",
"mutable",
"namespace",
"new",
"noexcept",
"not",
"not_eq",
"nullptr",
"operator",
"or",
"or_eq",
"private",
"protected",
"public",
"reflexpr",
"register",
"reinterpret_cast",
"requires",
"return",
"short",
"signed",
"sizeof",
"static",
"static_assert",
"static_cast",
"struct",
"switch",
"synchronized",
"template",
"this",
"thread_local",
"throw",
"true",
"try",
"typedef",
"typeid",
"typename",
"union",
"unsigned",
"using",
"virtual",
"void",
"volatile",
"wchar_t",
"while",
"xor",
"xor_eq",
],
type_def_keywords:[
"namespace",
"struct",
"class",
"enum",
"union",
],
exclude_type_def_keywords_on_prev:[
"using",
],
allowed_keywords_before_type_defs:[
"operator",
],
type_keywords:[
"const",
"constexpr",
"static",
"volatile",
"mutable",
"namespace",
],
operators:[
"&&","||","!","==","!=",">","<",">=","<=","+","-","*","/","%",
"=","+=","-=","*=","/=","%=","++","--","<<",">>","&","|","^","~",
"?",
],
special_string_prefixes:[
"L",
"u",
"U",
"R",
"u8",
],
single_line_comment_start:"//",
multi_line_comment_start:"/*",
multi_line_comment_end:"*/",
allow_preprocessors:true,
excluded_word_boundary_joinings:["."],
is_type_language:true,
language:"C++",
compiler,
});
this.allow_header_type_defs=allow_header_type_defs;
this.all_function_modifiers=["static","virtual","volatile","inline","friend","extern","explicit","noexcept","const","constexpr","mutable","decltype","override","final","requires","template"];
this.post_function_modifiers=["static","virtual","volatile","inline","friend","extern","explicit","noexcept","const","constexpr","mutable","decltype","override","final","requires","template"];
this.pre_function_modifiers=["static","virtual","volatile","inline","friend","extern","explicit","noexcept","constexpr","mutable","decltype","override","final","requires","template"];
if (inside_func){
this.cpp_scopes.append({
depth:new vhighlight.NestedDepth(-1,-1,-1),
scope:"func",
is_open:true,
})
}
}
callback(char){
if (this.cpp_scopes.length>0&&char==="{"){
let scope;
if (
(scope=this.cpp_scopes.last())!=null&&
!scope.is_open&&
scope.depth.eq_values(this.curly_depth-1, this.bracket_depth, this.parenth_depth)
){
scope.is_open=true;
}
}
if (this.cpp_scopes.length>0&&(char===")"||char==="}")){
let scope;
while (
(scope=this.cpp_scopes.last())!=null&&
scope.is_open&&
scope.depth.eq_values(this.curly_depth, this.bracket_depth, this.parenth_depth)
){
this.cpp_scopes.pop();
}
}
if (char==="{"&&this.capture_inherit_start_token!==undefined){
this.append_batch();
const start_token=this.capture_inherit_start_token;
let success=false;
let inherited_types=[];
let inherit_privacy_type=null;
let post_colon=false;
this.tokens.iterate_tokens(start_token.line, null,(token)=>{
if (token.index>start_token.index){
if (post_colon){
if (token.token==="keyword"){
inherit_privacy_type=token.data;
}else if (inherit_privacy_type!=null){
if (token.is_whitespace){
return null;
}
else if (token.is_word_boundary){
inherit_privacy_type=null;
}else {
token.token="type";
inherited_types.push({
type:inherit_privacy_type,
token:token,
})
}
}
}
else if (token.token===undefined&&token.data===":"){
post_colon=true;
}
}
})
if (inherited_types.length>0){
start_token.inherited=inherited_types;
}
this.capture_inherit_start_token=undefined;
}
if (this.cpp_inside_template_keyword===0&&char==="<"){
this.append_batch();
const prev=this.get_prev_token_by_token("last",[" ","\t","\n"], true);
if (
prev&&(
(prev.token==="keyword"&&prev.data==="template")
)
){
this.cpp_inside_template_keyword=1;
this.cpp_scopes.append({
depth:new vhighlight.NestedDepth(),
scope:"template_keyword",
is_open:false,
})
this.batch=char;
this.append_batch(false);
return true;
}
else {
let is_template=false;
let depth=1;
let parenth_depth=0;
let word="";
let append_to_batch=[[false,char]];
let index;
let next_is_type=true;
let c;
const add_word=(is_word_boundary=false,set_seperator=false)=>{
if (word.length>0){
if (word==="typename"){
append_to_batch.push(["keyword",word]);
next_is_type=true;
}
else if (this.keywords.includes(word)){
append_to_batch.push(["keyword",word]);
}
else if (next_is_type){
append_to_batch.push(["type",word]);
next_is_type=false;
}
else {
append_to_batch.push([false,word]);
}
word="";
if (set_seperator){
if (c==","){
next_is_type=true;
}else if (c=="("){
next_is_type=true;
}
}
}
}
for (index=this.index+1;index<this.code.length;index++){
c=this.code.charAt(index);
if (c=="<"){
next_is_type=true;
add_word();
append_to_batch.push([false,c]);
++depth;
}else if (c==">"){
next_is_type=true;
add_word();
append_to_batch.push([false,c]);
--depth;
if (depth==0){
is_template=true;
break;
}
}
else if (c==="("){
++parenth_depth;
next_is_type=true;
add_word(true);
append_to_batch.push([false,c]);
}
else if (c===")"){
if (parenth_depth===0){
break;
}
--parenth_depth;
next_is_type=true;
add_word(true);
append_to_batch.push([false,c]);
}
else if (c==="{"||c==="}"){
if (parenth_depth===0){
break;
}
add_word(true);
append_to_batch.push([false,c]);
}
else if (c==="="){
add_word(true);
append_to_batch.push(["operator",c]);
next_is_type=true;
}
else if (this.operators.includes(c)){
if (c==="&"&&this.code.charAt(index+1)==="&"){
break;
}
else if (c==="|"&&this.code.charAt(index+1)==="|"){
break;
}
add_word(true);
append_to_batch.push(["operator",c]);
}
else if (c===":"){
add_word(true);
append_to_batch.push([false,c]);
if (this.code.charAt(index-1)===":"){
next_is_type=true;
}
}
else if (this.is_whitespace(c)||c==","||c==":"||c=="\n"||c=="["||c=="]"||c=="_"){
add_word(true);
append_to_batch.push([false,c]);
}
else if (this.is_alphabetical(c)||this.is_numerical(c)){
word+=c;
}
else {
break;
}
}
if (is_template){
for (let i=0;i<append_to_batch.length;i++){
this.append_forward_lookup_batch(append_to_batch[i][0],append_to_batch[i][1],{is_template:true});
}
this.resume_on_index(index);
return true;
}
}
this.batch=char;
this.append_batch();
return true;
}
else if (this.cpp_inside_template_keyword>0){
if (char==="<"){
++this.cpp_inside_template_keyword;
}else if (char===">"){
--this.cpp_inside_template_keyword;
if (this.cpp_inside_template_keyword===0){
this.append_batch();
this.batch=char;
const token=this.append_batch(false);
let prev=token;
while (true){
prev.is_template=true;
prev=this.get_prev_token_by_token(prev,[]);
if (prev==null||(prev.token==="keyword"&&prev.data==="template")){
break;
}
}
if (this.cpp_scopes.length>0&&this.cpp_scopes.last().scope==="template_keyword"){
--this.cpp_scopes.length;
}
return true;
}
}
if (this.word_boundaries.includes(char)){
this.append_batch();
const last=this.get_prev_token_by_token("last",[" ","\t","\n"], true);
if (last!=null&&last.token===undefined){
const prev=this.get_prev_token_by_token(last,[" ","\t","\n"]);
if (prev.token===undefined&&(prev.data==="<"||prev.data===",")){
this.assign_token_as_type(last);
}
}
this.batch=char;
this.append_batch(null,{is_word_boundary:true});
return true;
}
}
if (
(this.last_line_type!=this.line&&char!=" "&&char!="\t")||
(this.is_keyword_before_parentheses!==true&&this.prev_char=="("||(this.parenth_depth>0&&this.prev_char==","))
){
this.last_line_type=this.line;
this.append_batch();
let is_type=false;
let hit_template=0;
let word="";
let words=0;
let append_to_batch=[];
let last_index,last_append_index;
for (let index=this.index;index<this.code.length;index++){
const c=this.code.charAt(index);
if (hit_template==2){
if (c==" "||c=="\t"||c=="*"||c=="&"||c=="\n"){
continue;
}
else if (this.is_alphabetical(c)){
if (words==1){
is_type=true;
break;
}
break;
}
else {
break;
}
}
else if (hit_template==1){
if (c==">"){
hit_template=2;
}
}
else {
if (c==" "||c=="\t"||c==":"||c=="*"||c=="&"||(words==0&&c=="<")){
if (c=="<"){
hit_template=1;
}
if (word.length>0){
if (this.keywords.includes(word)){
if (this.type_def_keywords.includes(word)){
return false;
}
append_to_batch.push(["keyword",word]);
}else {
if (c!=":"||this.code.charAt(index+1)!=":"){
++words;
}
append_to_batch.push(["type",word]);
}
last_index=index;
last_append_index=append_to_batch.length-1;
word="";
}
if (c=="*"||c=="&"){
append_to_batch.push(["operator",c]);
}else {
append_to_batch.push([null,c]);
}
}
else if (this.is_alphabetical(c)||(word.length>0&&this.is_numerical(c))){
if (words==1){
is_type=true;
break;
}
word+=c;
}
else {
break;
}
}
}
if (is_type){
for (let i=0;i<=last_append_index;i++){
this.append_forward_lookup_batch(append_to_batch[i][0],append_to_batch[i][1]);
}
this.resume_on_index(last_index-1);
return true;
}
return false;
}
if (char=="{"){
this.append_batch();
let prev=this.get_prev_token(this.added_tokens-1,[" ","\t","\n","&","*"]);
if (prev==null){return false;}
let prev_prev=this.get_prev_token_by_token(prev,[" ","\t","\n","*","&"]);
if (prev.data===">"&&(prev_prev==null||prev_prev.data!=="-")){
const token=this.get_opening_template(prev.index);
if (token!=null){
prev=this.get_prev_token_by_token(token,[]);
}
}
prev_prev=this.get_prev_token_by_token(prev,[" ","\t","\n","&","*"]);
if (prev_prev!=null&&prev_prev.data==">"){
let prev_prev_prev=this.get_prev_token_by_token(prev,[" ","\t","\n","*","&"]);
if (prev_prev==null||prev_prev.data!=="-"){
const token=this.get_opening_template(prev_prev.index);
if (token!=null){
prev_prev=this.get_prev_token_by_token(token,[]);
}
}
}
if (
(prev_prev==null||prev_prev.token!="type")&&
prev.token===undefined&&prev.is_word_boundary!==true
){
prev.token="type";
}
return false;
}
if (char==":"&&this.prev_char==":"){
this.append_batch();
this.batch+=char;
this.append_batch(false);
this.next_token="type";
let prev=this.get_prev_token(this.added_tokens-1,[":"]);
if (prev==null){
return true;
}
let prev_prev=this.get_prev_token_by_token(prev,[" ","\t","\n","*","&"]);
if (prev.data===">"&&(prev_prev==null||prev_prev.data!=="-")){
prev=this.get_opening_template(prev.index);
if (prev!==null){
prev=this.get_prev_token_by_token(prev,[])
}
}
if (prev==null){
return true;
}
if (
(prev.token===undefined||prev.token=="type_def")&&
!this.str_includes_word_boundary(prev.data)
){
prev.token="type";
}
return true;
}
return false;
}
first_char_matches_function_modifier(char){
for (let i=0;i<this.all_function_modifiers.length;i++){
if (this.all_function_modifiers[i].charAt(0)===char){
return true;
}
}
return false;
}
parse_pre_type_def_modifiers(first_type_def_token,type_def_token,type_defs_from_colon=[]){
let type_tokens=[];
let templates_tokens=[];
let requires_tokens=[];
let modifier_tokens=[];
let first_type_keyword=true;
let post_type=false;
let is_template=false;
let parenth_depth=0;
let check_reset_requires_tokens=false;
let on_lower_than_index=first_type_def_token.index;
let lookback_requires_tokens=[];
let template_closed=false;
let requires_closed=false;
const check_end_of_modifiers=(token)=>{
if (requires_tokens.length>0){
return false;
}
let ends_with_requires=false;
let lookback_parenth_depth=0;
let lookback_curly_depth=0;
this.tokens.iterate_tokens_reversed(0,token.line+1,(lookback)=>{
if (lookback.index<=token.index){
if (lookback.token===undefined&&lookback.data.length===1){
if (lookback.data==="{"){
--lookback_curly_depth;
if (lookback_curly_depth===0){
lookback_requires_tokens.push(lookback);
return null;
}
}
else if (lookback.data==="}"){++lookback_curly_depth;}
else if (lookback.data==="("){
--lookback_parenth_depth;
if (lookback_parenth_depth===0){
lookback_requires_tokens.push(lookback);
return null;
}
}
else if (lookback.data===")"){++lookback_parenth_depth;}
}
if (lookback.is_whitespace===true){
lookback_requires_tokens.push(lookback);
}
else if (lookback_curly_depth>0&&lookback_parenth_depth===0){
return false;
}
else if (lookback_curly_depth!==0||lookback_parenth_depth!==0){
lookback_requires_tokens.push(lookback);
}
else if (lookback.is_template===true){
lookback_requires_tokens.push(lookback);
}
else if (lookback.token==="keyword"&&lookback.data==="requires"){
ends_with_requires=true;
modifier_tokens.push(lookback)
on_lower_than_index=lookback.token;
return false;
}
else if (lookback.token==="operator"){
lookback_requires_tokens.push(lookback);
}
else if (lookback.is_word_boundary===true&&lookback.data!==":"&&lookback.data!==">"){
return false;
}
else {
lookback_requires_tokens.push(lookback);
}
}
});
if (ends_with_requires){
requires_tokens=lookback_requires_tokens;
return null;
}else {
return false;
}
}
this.tokens.iterate_tokens_reversed(0,first_type_def_token.line+1,(token)=>{
if (token.index<on_lower_than_index){
if (post_type===false){
if (token.is_template===true){
type_tokens.push(token);
return null;
}
else if (token.is_whitespace===true){
type_tokens.push(token);
return null;
}
else if (token.token==="type"){
type_tokens.push(token);
return null;
}
else if (first_type_keyword&&token.token==="keyword"&&this.pre_function_modifiers.includes(token.data)===false){
type_tokens.push(token);
post_type=true;
first_type_keyword=false;
return null;
}
else if (token.token===undefined&&token.data.indexOf(":")!==-1){
type_tokens.push(token);
return null;
}
else if (token.token==="operator"&&(token.data==="&"||token.data==="*")){
type_tokens.push(token);
return null;
}
post_type=true;
}
if (post_type===true){
if (check_reset_requires_tokens===1){
check_reset_requires_tokens=true;
}else {
check_reset_requires_tokens=false;
}
if (is_template===false){
if (token.token===undefined&&token.data=="("){
if (parenth_depth===0){
return false;
}
--parenth_depth;
if (requires_closed===false&&parenth_depth===0){
requires_tokens.push(token);
check_reset_requires_tokens=1;
return null;
}
}else if (token.token===undefined&&token.data==")"){
++parenth_depth;
}
}
if (template_closed===false&&is_template&&parenth_depth===0&&token.is_template!==true&&token.is_whitespace!==true&&(token.token!=="keyword"||token.data!=="template")){
lookback_requires_tokens=templates_tokens;
templates_tokens=[];
is_template=false;
return check_end_of_modifiers(token);
}
else if (template_closed===false&&is_template&&parenth_depth===0&&token.is_template!==true&&token.token==="keyword"&&token.data==="template"){
modifier_tokens.push(token);
return check_end_of_modifiers(token);
}
else if (requires_closed===false&&check_reset_requires_tokens===true&&is_template===false&&token.is_whitespace!==true&&(token.token!=="keyword"||token.data!=="requires")){
lookback_requires_tokens=requires_tokens;
requires_tokens=[];
check_reset_requires_tokens=false;
return check_end_of_modifiers(token);
}
else if (requires_closed===false&&check_reset_requires_tokens===true&&is_template===false&&token.token==="keyword"&&token.data==="requires"){
modifier_tokens.push(token);
requires_closed=true;
return check_end_of_modifiers(token);
}
else if (requires_closed===false&&is_template===false&&parenth_depth!==0){
requires_tokens.push(token);
}
else if (template_closed===false&&parenth_depth===0&&token.is_template===true){
templates_tokens.push(token);
is_template=true;
}
else if ((token.token===undefined||token.token==="keyword")&&this.pre_function_modifiers.includes(token.data)){
modifier_tokens.push(token);
}
else if (token.is_whitespace!==true&&token.is_line_break!==true&&this.is_full_uppercase(token.data,["_","1","2","3","4","5","6","7","8","9"])){
token.token="type";
modifier_tokens.push(token);
}
else if (token.is_whitespace!==true&&token.is_line_break!==true){
lookback_requires_tokens=[];
return check_end_of_modifiers(token);
}
}
}
})
type_tokens=this.trim_tokens(type_tokens, true);
type_def_token.type=type_tokens;
templates_tokens=this.trim_tokens(templates_tokens, true);
if (templates_tokens.length>0){
const init_template=()=>{
template={
name:null,
index:null,
value:[],
type:[],
};
}
const append_template=()=>{
if (template!==null){
template.type=this.trim_tokens(template.type);
if (template.type.length>0){
template.name=template.type.pop().data;
if (template.name!=null){
template.name=template.name.trim();
}
template.type=this.trim_tokens(template.type);
template.value=this.trim_tokens(template.value);
template.index=templates.length;
templates.push(template);
}
template=null;
};
}
let mode=1;
const templates=[];
let template=null;
let template_depth=0,curly_depth=0,parenth_depth=0,bracket_depth=0;
templates_tokens.iterate(1,templates_tokens.length-1,(token)=>{
if ((token.token===undefined||token.token==="operator")&&token.data.length===1){
if (token.data==="<"){++template_depth;}
else if (token.data===">"){--template_depth;}
else if (token.data==="("){++parenth_depth;}
else if (token.data===")"){--parenth_depth;}
else if (token.data==="["){++bracket_depth;}
else if (token.data==="]"){--bracket_depth;}
else if (token.data==="{"){++curly_depth;}
else if (token.data==="}"){--curly_depth;}
}
if (template_depth===0&&parenth_depth===0&&curly_depth===0&&bracket_depth===0&&token.data===","){
append_template();
mode=1;
}
else if (mode===1){
if (template===null){
init_template();
}
if (token.data==="="){
mode=2;
}
else {
template.type.push(token);
}
}
else if (mode===2){
template.value.push(token);
}
})
append_template();
type_def_token.templates=templates;
type_def_token.template_tokens=templates_tokens;
}
requires_tokens=this.trim_tokens(requires_tokens, true);
if (requires_tokens.length>0){
type_def_token.requires_tokens=requires_tokens;
}
if (modifier_tokens.length>0){
type_def_token.pre_modifiers=[];
modifier_tokens.iterate_reversed((item)=>{
type_def_token.pre_modifiers.push(item);
})
}
let first_token=null;
const get_first_token=(token)=>{
if (first_token==null||token.index<first_token.index){
first_token=token;
}
}
requires_tokens.iterate(get_first_token);
modifier_tokens.iterate(get_first_token);
templates_tokens.iterate(get_first_token);
type_tokens.iterate(get_first_token);
return first_token;
}
on_parenth_open(token_before_opening_parenth){
let prev=token_before_opening_parenth;
if ((prev.data===">"&&!prev.is_template)||prev.data==="*"||prev.data==="&"){
let prev_prev=this.get_prev_token_by_token(prev,[" ","\t","\n","*","&"]);
if (prev_prev.data!=="operator"){
if (prev.data==="*"){
prev.token="operator";
}else if (prev.token!==undefined){
delete prev.token;
}
if (prev.data===">"&&(prev_prev==null||prev_prev.data!=="-")){
const token=this.get_opening_template(prev.index);
if (token!=null){
prev=this.get_prev_token_by_token(token,[" ","\t","\n"]);
}
}
prev_prev=this.get_prev_token_by_token(prev,[" ","\t","\n","*","&"]);
if (prev_prev==null||prev_prev.token!="type"){
this.assign_token_as_type(prev);
}
if (this.cpp_scopes.length===0){
this.cpp_scopes.append({
depth:new vhighlight.NestedDepth(this.curly_depth+1, this.bracket_depth, this.parenth_depth),
scope:"func",
is_open:true,
})
}
return null;
}
}
let prev_prev=this.get_prev_token_by_token(prev,[" ","\t","\n"]);
let prev_prev_prev=this.get_prev_token_by_token(prev_prev,[" ","\t","\n"]);
if (
(prev_prev!=null&&prev_prev.data===",")||
(
prev_prev!=null&&prev_prev.data===":"&&
(prev_prev_prev==null||(prev_prev_prev!=null&&prev_prev_prev.data!==":"))
)
){
this.assign_token_as_type(prev);
return null;
}
let type_def_token=prev;
let is_operator_overload=false;
let overloaded_operator_tokens=[];
if (
type_def_token.token==="operator"||
type_def_token.data==="["||type_def_token.data==="]"||
type_def_token.data==="("||type_def_token.data===")"
){
let operator_keyword=type_def_token;
while (true){
if (operator_keyword.token==="keyword"&&operator_keyword.data==="operator"){
type_def_token=operator_keyword;
type_def_token.token="type_def";
type_def_token.overloaded_operators=[];
overloaded_operator_tokens.iterate_reversed((token)=>{
type_def_token.overloaded_operators.push(token);
});
is_operator_overload=true;
break;
}else if (
operator_keyword.is_whitespace!==true&&
operator_keyword.token!=="operator"&&
operator_keyword.data!=="["&&operator_keyword.data!=="]"&&
operator_keyword.data!=="("&&operator_keyword.data!==")"
){
break;
}else {
overloaded_operator_tokens.push(operator_keyword);
}
operator_keyword=this.get_prev_token_by_token(operator_keyword,["\n"]);
}
}
if (type_def_token.is_word_boundary||type_def_token.token==="keyword"){
return ;
}
const last_scope=this.cpp_scopes.last();
const inside_func=last_scope!=null&&(last_scope.scope==="func"||last_scope.scope==="template_keyword");
if (!inside_func){
type_def_token.token="type_def";
let token_for_parse_pre_type_def_modifiers=type_def_token;
const colon_token=this.get_prev_token_by_token(type_def_token,[]);
let before_colon_token;
const parents=[];
if (
colon_token&&colon_token.data===":"&&
(before_colon_token=this.get_prev_token_by_token(colon_token,[]))!=null&&before_colon_token.data===":"
){
let parent=before_colon_token;
while (true){
parent=this.get_prev_token_by_token(parent,[]);
if (parent==null){
break;
}
else if (parent.data===":"){
continue;
}
else if (this.str_includes_word_boundary(parent.data)){
break;
}
parent.token="type_def";
parent.is_duplicate=true;
token_for_parse_pre_type_def_modifiers=parent;
parents.push(parent);
}
}
if (parents.length>0){
type_def_token.parents=[];
parents.iterate_reversed((parent)=>{
type_def_token.parents.push(parent);
})
}
const first_func_token=this.parse_pre_type_def_modifiers(token_for_parse_pre_type_def_modifiers,type_def_token,parents);
if (type_def_token.token==="type_def"){
this.cpp_scopes.append({
depth:new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth-1),
scope:"func",
is_open:false,
})
if (parents.length===0){
this.assign_parents(type_def_token);
}
this.assign_token_as_type_def(type_def_token,{start_token:first_func_token});
}
return type_def_token;
}
else {
let prev_prev=this.get_prev_token_by_token(type_def_token,[" ","\t","\n","*","&"]);
if (type_def_token.data===">"&&(prev_prev==null||prev_prev.data!=="-")){
const token=this.get_opening_template(type_def_token.index);
if (token!=null){
type_def_token=this.get_prev_token_by_token(token,[" ","\t","\n"]);
}
}
else if (prev_prev!=null&&prev_prev.data===">"&&prev_prev.token!=="operator"){
prev_prev.token="operator"
}
prev_prev=this.get_prev_token_by_token(type_def_token,[" ","\t","\n","*","&"]);
if (prev_prev==null||prev_prev.token!="type"){
if (prev_prev.data==="]"){
return ;
}
this.assign_token_as_type(type_def_token);
const colon_token=this.get_prev_token_by_token(type_def_token,[]);
let before_colon_token;
if (
colon_token&&colon_token.data===":"&&
(before_colon_token=this.get_prev_token_by_token(colon_token,[]))!=null&&before_colon_token.data===":"
){
let parent=before_colon_token;
while (true){
parent=this.get_prev_token_by_token(parent,[]);
if (parent==null){
break;
}
else if (parent.data===":"){
continue;
}
else if (this.str_includes_word_boundary(parent.data)){
break;
}
parent.token="type";
}
}
}
}
}
on_post_type_def_modifier_end(type_def_token,last_token){
let scope;
if (
type_def_token.token==="type_def"&&
this.code.charAt(this.index)===";"&&
(scope=this.cpp_scopes.last())!=null&&
scope.depth.eq_values(this.curly_depth, this.bracket_depth, this.parenth_depth)
){
this.cpp_scopes.pop();
}
let parenth_depth=0;
let closing_parenth_token;
let templates_tokens=[];
let requires_tokens=[];
let modifier_tokens=[];
let is_requires=false;
let is_template=false;
this.tokens.iterate_tokens(type_def_token.line, null,(token)=>{
if (token.index===last_token.index){
if (token.token===undefined&&token.data===")"){
--parenth_depth;
if (parenth_depth===0){
closing_parenth_token=token;
return false;
}
}
return false;
}
else if (token.index>type_def_token.index&&token.token===undefined&&token.data.length===1){
if (token.data==="("){
++parenth_depth;
}else if (token.data===")"){
--parenth_depth;
if (parenth_depth===0){
closing_parenth_token=token;
return false;
}
}
}
})
if (closing_parenth_token===undefined){
throw Error(`Unable to find the closing paremeter parentheses of function "${type_def_token.data}()" line ${type_def_token.line+1}.`);
}
this.tokens.iterate_tokens(closing_parenth_token.line,last_token.line+1,(token)=>{
if (token.index>closing_parenth_token.index&&token.index<=last_token.index){
const is_keyword=token.token==="keyword";
if (is_template&&token.is_template!==true&&token.is_whitespace!==true){
is_template=false;
}
if (is_template){
is_template=true;
templates_tokens.push(token);
}
else if (is_keyword&&token.data==="template"){
is_template=true;
modifier_tokens.push(token);
}
else if (is_keyword&&token.data==="requires"){
is_requires=true;
modifier_tokens.push(token);
}
else if (is_keyword&&this.post_function_modifiers.includes(token.data)){
is_requires=false;
modifier_tokens.push(token);
}
else if (is_requires){
requires_tokens.push(token);
}
}
})
requires_tokens=this.trim_tokens(requires_tokens);
if (requires_tokens.length>0){
type_def_token.requires_tokens=requires_tokens
}
if (modifier_tokens.length>0){
type_def_token.post_modifiers=[];
modifier_tokens.iterate((item)=>{
type_def_token.post_modifiers.push(item);
})
}
}
on_type_def_keyword(token){
let next_index=this.get_first_non_whitespace(this.index, false)
if (this.code.charAt(next_index)==="<"){
next_index=this.get_closing_template(next_index);
if (next_index==null){
next_index=this.code.length;
}
next_index=this.get_first_non_whitespace(next_index+1, false)
}
if (next_index==null){
next_index=this.code.length;
}
switch (this.code.charAt(next_index)){
case ":":
case "{":
break;
default:
this.assign_token_as_type(token);
return ;
}
const prev=this.get_prev_token_by_token(token,[" ","\t","\n"]);
if (prev!==null&&prev.token==="keyword"&&prev.data==="namespace"){
token.is_namespace=true;
}
this.assign_parents(token);
this.add_parent(token);
const first_func_token=this.parse_pre_type_def_modifiers(token,token);
if (!token.is_namespace){
this.assign_token_as_type_def(token,{start_token:first_func_token});
}
this.cpp_scopes.append({
depth:new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth),
scope:"class",
is_open:false,
})
if (prev!==null&&(prev.data==="struct"||prev.data==="class")){
this.capture_inherit_start_token=token;
}
}
derived_reset(){
this.last_line_type=null;
this.cpp_scopes=[];
this.cpp_inside_template_keyword=0;
this.capture_inherit_start_token=undefined;
}
derived_retrieve_state(data){
data.last_line_type=this.last_line_type;
data.cpp_scopes=this.cpp_scopes;
data.cpp_inside_template_keyword=this.cpp_inside_template_keyword;
data.capture_inherit_start_token=this.capture_inherit_start_token;
}
}
vhighlight.cpp=new vhighlight.CPP();
vhighlight.CSS=class CSS extends vhighlight.Tokenizer{
constructor(){
super({
keywords:[
'ease',
'ease-in',
'ease-out',
'ease-in-out',
'linear',
'step-start',
'step-end',
'ease-in-quad',
'ease-in-cubic',
'ease-in-quart',
'ease-in-quint',
'ease-in-sine',
'ease-in-expo',
'ease-in-circ',
'ease-in-back',
'ease-out-quad',
'ease-out-cubic',
'ease-out-quart',
'ease-out-quint',
'ease-out-sine',
'ease-out-expo',
'ease-out-circ',
'ease-out-back',
'ease-in-out-quad',
'ease-in-out-cubic',
'ease-in-out-quart',
'ease-in-out-quint',
'ease-in-out-sine',
'ease-in-out-expo',
'ease-in-out-circ',
'ease-in-out-back',
'none',
'forwards',
'backwards',
'both',
'paused',
'running',
'linear-gradient',
'radial-gradient',
'conic-gradient',
'rgb',
'rgba',
'hsl',
'hsla',
'url',
'from',
'to',
'infinite',
'alternate',
'alternate-reverse',
],
multi_line_comment_start:"/*",
multi_line_comment_end:"*/",
allow_parameters:false,
language:"CSS",
});
const numeric_suffixes=[
'px',
'em',
'rem',
'ex',
'ch',
'vw',
'vh',
'vmin',
'vmax',
'%',
'in',
'cm',
'mm',
'pt',
'pc',
'fr',
'deg',
'grad',
'rad',
'turn',
'ms',
's',
'Hz',
'kHz',
'dpi',
'dpcm',
'dppx',
'x'
].join("|");
this.numeric_regex=new RegExp(`^-?\\d+(\\.\\d+)?(${numeric_suffixes})*$`);
}
callback(char,is_escaped){
if (char=="@"){
const end=this.get_first_word_boundary(this.index+1);
this.append_batch();
this.append_forward_lookup_batch("keyword", this.code.substr(this.index,end-this.index));
this.resume_on_index(end-1);
return true;
}
if (this.batch==""&&char=="#"){
const end=this.get_first_word_boundary(this.index+1);
this.append_batch();
this.append_forward_lookup_batch("string", this.code.substr(this.index,end-this.index));
this.resume_on_index(end-1);
return true;
}
else if (char=="{"){
this.append_batch();
let index=this.added_tokens-1;
while (true){
const prev=this.get_prev_token(index,[" ",",","\t",":"]);
if (prev==null||prev.data=="\n"){
break;
}
else if (
(prev.token=="string")||
(prev.token=="keyword"&&prev.data.charAt(0)!="@")||
(prev.token===undefined&&
(
prev.data=="#"||
prev.data=="."||
prev.data=="*"||
prev.data=="-"||
this.is_alphabetical(prev.data.charAt(0))
)
)
){
const pprev=this.tokens[prev.index-1];
if (pprev!=null&&pprev.data==":"){
prev.token="keyword";
}else {
prev.token="type_def";
}
}
index=prev.index-1;
}
}
else if (this.curly_depth>0&&char==":"){
this.append_batch();
let index=this.added_tokens-1;
let edits=[];
let finished=false;
while (true){
const prev=this.get_prev_token(index,[" ","\t"]);
if (prev==null){
break;
}
else if (prev.data=="\n"||prev.data==";"){
finished=true;
break;
}
else if (prev.token===undefined){
edits.push(prev);
}
index=prev.index-1;
}
if (finished){
for (let i=0;i<edits.length;i++){
edits[i].token="keyword";
}
this.style_start=this.index;
for (let i=this.index+1;i<this.code.length;i++){
const c=this.code.charAt(i);
if (c=="\n"){
this.style_start=null;
break;
}else if (c==";"){
this.style_end=i;
break;
}
}
}
}
else if (char=="%"&&this.numeric_regex.test(this.batch+char)){
this.batch+=char;
this.append_batch("numeric");
return true;
}
else if (this.word_boundaries.includes(char)&&this.numeric_regex.test(this.batch)){
this.append_batch("numeric");
}
else if (this.style_end!=null&&this.index>=this.style_end){
this.append_batch();
let index=this.added_tokens-1;
let finished=false;
const edits=[];
while (true){
const prev=this.get_prev_token(index,[" ","\t"]);
if (prev==null||prev=="\n"){
break;
}
else if (prev.data==":"){
finished=true;
break;
}
else if (prev.token===undefined&&!this.str_includes_word_boundary(prev.data)){
edits.push(prev);
}
index=prev.index-1;
}
if (finished){
for (let i=0;i<edits.length;i++){
edits[i].token="keyword";
}
}
this.style_end=null;
}
return false;
}
on_parenth_open(token){
if (!token.is_word_boundary&&token.token===undefined){
this.assign_token_as_type(token);
return token;
}
}
derived_reset(){
this.style_start=null;
this.style_end=null;
}
derived_retrieve_state(data){
data.style_start=this.style_start;
data.style_end=this.style_end;
}
}
vhighlight.css=new vhighlight.CSS();
vhighlight.HTML=class HTML extends vhighlight.Tokenizer{
static language_tags=[
"script",
"style",
"js",
];
static verbatim_tags=[
'textarea',
'pre',
'xmp',
'plaintext',
'listing',
];
constructor({
allow_entities=true,
}={}){
super({
multi_line_comment_start:"<!--",
multi_line_comment_end:"-->",
allow_parameters:false,
language:"HTML",
});
this.allow_entities=allow_entities;
this.callback=HTML.create_callback().bind(this);
this.derived_reset=HTML.create_derived_reset().bind(this);
this.derived_retrieve_state=HTML.create_derived_retrieve_state().bind(this);
}
static create_callback(){
const number_regex=/^-?\d+(\.\d+)?$/;
return function(char){
if (this.html_inside_opening_tag!=null){
if (this.word_boundaries.includes(char)){
let token_type;
switch (this.batch){
case "true":case "True":case "false":case "False":case "null":case "none":
token_type="keyword"
break;
default:
if (number_regex.test(this.batch)){
token_type="numeric";
}
else if (this.curly_depth===0){
token_type="parameter";
}
break;
}
this.append_batch(token_type)
}
if (char===">"){
this.append_batch();
this.batch+=">"
this.append_batch("keyword")
this.html_inside_opening_tag=null;
if (this.html_inside_verbatim_tag){
this.preprocess_code=false;
}
this.allow_strings=this._old_allow_strings
return true;
}
return false;
}
else if (this.html_inside_verbatim_tag){
if (this.preprocess_code&&char===">"){
this.preprocess_code=false;
}
let start;
if (
this.index+1===this.code.length||
(
char==="<"&&
(start=this.get_first_non_whitespace(this.index+1, true))!=null&&
this.code.charAt(start)==="/"&&
this.code.eq_first(this.html_inside_verbatim_tag,start+1)
)
){
if (this.index+1===this.code.length){
this.batch+=char;
}
switch (this.html_inside_verbatim_tag){
case "js":
case "JS":
case "GlobalJS":
case "script":{
const tokenizer=new vhighlight.JS();
const tokens=tokenizer.tokenize({code:this.batch,state:this.html_inside_verbatim_tag_state});
this.concat_tokens(tokens);
this.html_inside_verbatim_tag_state=tokenizer.state();
break;
}
case "html":
case "HTML":
{
const tokenizer=new vhighlight.HTML();
const tokens=tokenizer.tokenize({code:this.batch,state:this.html_inside_verbatim_tag_state});
this.concat_tokens(tokens);
this.html_inside_verbatim_tag_state=tokenizer.state();
break;
}
case "style":{
const tokenizer=new vhighlight.CSS();
const tokens=tokenizer.tokenize({code:this.batch,state:this.html_inside_verbatim_tag_state});
this.concat_tokens(tokens);
this.html_inside_verbatim_tag_state=tokenizer.state();
break;
}
default:
this.append_batch();
break;
}
if (start!=null){
let end=this.code.indexOf(">",start+1);
if (end===-1){
end=this.code.length;
}else {
++end;
}
this.batch=this.code.substr(this.index,end-this.index);
this.append_batch("keyword");
this.resume_on_index(end-1);
this.html_inside_verbatim_tag=null;
this.html_inside_verbatim_tag_state=null;
}
this.preprocess_code=true;
return true;
}
this.batch+=char;
return true;
}
else if (char==="<"){
const lookup_tokens=[];
let resume_on_index=null;
let tag_name_start=this.get_first_non_whitespace(this.index+1, true);
if (tag_name_start===null){return false;}
const is_tag_closer=this.code.charAt(tag_name_start)==="/";
lookup_tokens.push(["operator","<"]);
const whitespace=tag_name_start-(this.index+1);
if (whitespace>0){
lookup_tokens.push([false, this.code.substr(this.index+1,whitespace)]);
}
let skip=["/","!"];
while (skip.includes(this.code.charAt(tag_name_start))){
lookup_tokens.push(["operator", this.code.charAt(tag_name_start)]);
const real_tag_name_start=this.get_first_non_whitespace(tag_name_start+1, true);
if (real_tag_name_start===null){return false;}
const whitespace=real_tag_name_start-(tag_name_start+1);
if (whitespace>0){
lookup_tokens.push([false, this.code.substr(tag_name_start+1,whitespace)]);
}
tag_name_start=real_tag_name_start;
}
let tag_name_end=tag_name_start;
while (true){
tag_name_end=this.get_first_word_boundary(tag_name_end);
if (tag_name_end===null){
tag_name_end=this.code.length;
break;
}else if (this.code.charAt(tag_name_end)!=="-"){
break;
}else {
++tag_name_end;
}
}
const tag_name=this.code.substr(tag_name_start,tag_name_end-tag_name_start);
lookup_tokens.push(["keyword",tag_name]);
if (
!is_tag_closer&&
(
vhighlight.HTML.verbatim_tags.includes(tag_name)||
vhighlight.HTML.language_tags.includes(tag_name)||
tag_name==="JS"||
tag_name==="GlobalJS"
)
){
this.html_inside_verbatim_tag=tag_name;
}
for (let i=0;i<lookup_tokens.length;i++){
this.append_forward_lookup_batch(lookup_tokens[i][0],lookup_tokens[i][1]);
}
this.resume_on_index(tag_name_end-1);
if (!is_tag_closer){
this.html_inside_opening_tag=tag_name;
this._old_allow_strings=this.allow_strings;
this.allow_strings=true;
}else {
let close=this.code.indexOf(">",tag_name_end);
if (close===-1){
close=this.code.length;
}
this.append_forward_lookup_batch("keyword", this.code.substr(tag_name_end,(close+1)-tag_name_end));
this.resume_on_index(close);
}
return true;
}
else if (char==="&"){
this.append_batch();
let batch;
if (this.allow_entities){
batch="&";
}else {
batch="&amp;";
}
let success=false;
let index=0;
for (index=this.index+1;index<this.code.length;index++){
const c=this.code.charAt(index);
batch+=c;
if (c===" "||c==="\t"||c==="\n"){
break;
}else if (c===";"){
batch=batch.substr(0,batch.length-1)+"\;"
success=true;
break;
}
}
if (success){
this.batch=batch;
this.append_batch("keyword");
this.resume_on_index(index);
return true;
}
}
return false;
}
}
static create_derived_reset(){
return function (){
this.html_inside_opening_tag=null;
this.html_inside_verbatim_tag=null;
this.html_inside_verbatim_tag_state=null;
}
}
static create_derived_retrieve_state(){
return function (data){
data.html_inside_opening_tag=this.html_inside_opening_tag;
data.html_inside_verbatim_tag=this.html_inside_verbatim_tag;
data.html_inside_verbatim_tag_state=this.html_inside_verbatim_tag_state;
}
}
}
vhighlight.html=new vhighlight.HTML();
vhighlight.JS=class JS extends vhighlight.Tokenizer{
constructor({
keywords=[
"break",
"case",
"catch",
"class",
"const",
"continue",
"debugger",
"default",
"delete",
"do",
"else",
"export",
"extends",
"finally",
"for",
"function",
"if",
"import",
"in",
"instanceof",
"let",
"new",
"of",
"return",
"super",
"switch",
"this",
"throw",
"try",
"typeof",
"var",
"void",
"while",
"with",
"yield",
"prototype",
"true",
"false",
"null",
"static",
"async",
"await",
"process",
"module",
"exports",
"get",
"set",
"undefined",
],
type_def_keywords=[
"class"
],
type_keywords=[
"extends",
],
operators=[
"+","-","*","/","%","**","=","+=","-=","*=","/=","%=","**=",
"==","!=","===","!==",">","<",">=","<=","&&","||","!","&","|",
"^","~","<<",">>",">>>","++","--","?",
],
single_line_comment_start="//",
multi_line_comment_start="/*",
multi_line_comment_end="*/",
allow_slash_regexes=true,
allow_decorators=true,
allow_preprocessors=false,
allowed_keywords_before_type_defs=["function","async","static","get","set","*"],
excluded_word_boundary_joinings=[],
compiler=false,
}={}){
super({
keywords:keywords,
type_def_keywords:type_def_keywords,
type_keywords:type_keywords,
operators:operators,
single_line_comment_start:single_line_comment_start,
multi_line_comment_start:multi_line_comment_start,
multi_line_comment_end:multi_line_comment_end,
allow_slash_regexes:allow_slash_regexes,
allow_decorators:allow_decorators,
allow_preprocessors:allow_preprocessors,
allowed_keywords_before_type_defs:allowed_keywords_before_type_defs,
excluded_word_boundary_joinings:excluded_word_boundary_joinings,
language:"JS",
compiler,
});
this.function_modifiers=["async","static","get","set","*"];
}
derived_reset(){
this.capture_inherit_start_token=undefined;
this.js_scopes=[];
}
derived_retrieve_state(data){
data.capture_inherit_start_token=this.capture_inherit_start_token;
data.js_scopes=this.js_scopes;
}
on_type_def_keyword(token){
token.type=[this.get_prev_token_by_token(token,[" ","\t","\n"])];
const assignment=this.get_prev_token_by_token(token,[" ","\t","\n","class"]);
if (assignment!=null&&assignment.data==="="){
const before_assignment=this.get_prev_token_by_token(assignment,[" ","\t","\n"]);
token.is_duplicate=true;
let parents=[];
let parent=before_assignment;
while (true){
parent=this.get_prev_token_by_token(parent,[]);
if (parent==null){
break;
}
else if (parent.data==="."){
continue;
}
else if (this.str_includes_word_boundary(parent.data)){
break;
}
parents.push(parent);
}
token.parents=[];
parents.iterate_reversed((parent)=>{
token.parents.push(parent);
this.add_parent(parent);
})
this.assign_parents(before_assignment);
this.assign_token_as_type_def(before_assignment);
this.add_parent(before_assignment);
before_assignment.type=token.type;
}
else {
this.assign_parents(token);
this.assign_token_as_type_def(token);
this.add_parent(token);
}
this.js_scopes.append({scope:"class",depth:new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth)})
this.capture_inherit_start_token=token;
}
parse_assignment_parents(token){
let parents=[];
let parent=token;
while (true){
parent=this.get_prev_token_by_token(parent,[]);
if (parent==null){
break;
}
else if (parent.data==="."){
continue;
}
else if (parent.is_word_boundary||this.str_includes_word_boundary(parent.data)){
break;
}
parents.push(parent);
}
token.parents=[];
parents.iterate_reversed((parent)=>{
token.parents.push(parent);
})
}
on_parenth_open(token){
const extract_pre_modifiers=(from_token,auto_prev_on_initial_token=true)=>{
let pre_modifiers=[];
let name_token;
if (!auto_prev_on_initial_token||from_token.token==="keyword"||(from_token.token==="operator"&&(from_token.data==="*"||from_token.data==="#"))){
name_token=from_token;
}else {
name_token=this.get_prev_token_by_token(from_token,[" ","\t","\n"]);
}
while (name_token!=null&&(name_token.token==="keyword"||(name_token.token==="operator"&&(name_token.data==="*"||name_token.data==="#")))){
if (this.function_modifiers.includes(name_token.data)){
pre_modifiers.push(name_token);
}
name_token=this.get_prev_token_by_token(name_token,[" ","\t","\n"]);
if (name_token==null){
break;
}
}
return {pre_modifiers,name_token}
}
let prev=this.get_prev_token_by_token(token,[" ","\t","\n"], false, true);
if (prev&&prev.token==="keyword"&&prev.data==="extends"){
return ;
}
if (prev&&prev.token==="keyword"&&prev.data==="function"){
const {pre_modifiers}=extract_pre_modifiers(token);
this.assign_parents(token);
this.assign_token_as_type_def(token);
this.js_scopes.append({scope:"parameters",depth:new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth-1)})
token.pre_modifiers=pre_modifiers;
return token;
}
let last_scope=this.js_scopes.last();
if (last_scope&&last_scope.scope==="class"){
if (token.data===":"){
const prev=this.get_prev_token_by_token(token,[" ","\t","\n"]);
this.assign_parents(prev);
this.assign_token_as_type_def(prev);
this.js_scopes.append({scope:"parameters",depth:new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth-1)})
return prev;
}
else if (token.token==="keyword"){
const {name_token,pre_modifiers}=extract_pre_modifiers(token);
if (name_token&&name_token.data===":"){
const prev=this.get_prev_token_by_token(name_token,[" ","\t","\n"]);
this.assign_parents(prev);
this.assign_token_as_type_def(prev);
this.js_scopes.append({scope:"parameters",depth:new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth-1)})
prev.pre_modifiers=pre_modifiers;
return prev;
}
}
const prev=this.get_prev_token_by_token(token);
if (prev){
const {pre_modifiers}=extract_pre_modifiers(prev, false);
this.assign_parents(token);
this.assign_token_as_type_def(token);
this.js_scopes.append({scope:"parameters",depth:new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth-1)})
token.pre_modifiers=pre_modifiers;
return token;
}
}
const {name_token,pre_modifiers}=extract_pre_modifiers(token, false);
if (name_token&&(name_token.data==="="||name_token.data===":")){
const prev=this.get_prev_token_by_token(name_token,[" ","\t","\n"]);
this.parse_assignment_parents(prev);
this.assign_token_as_type_def(prev);
this.js_scopes.append({scope:"parameters",depth:new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth-1)})
prev.pre_modifiers=pre_modifiers;
return prev;
}
if (
last_scope&&
last_scope.scope==="raw_object"&&
token.token===undefined&&
!token.is_word_boundary&&
last_scope.depth.eq_values(this.curly_depth-1, this.bracket_depth, this.parenth_depth-1)
){
const prev=this.get_prev_token_by_token(token,[" ","\t","\n"], false , true );
if (prev&&(!prev.is_word_boundary||prev.data===","||prev.data==="{")){
const {name_token,pre_modifiers}=extract_pre_modifiers(prev, false);
if (name_token&&(name_token.data===","||name_token.data==="{")){
this.assign_parents(token);
this.assign_token_as_type_def(token);
this.js_scopes.append({scope:"parameters",depth:new vhighlight.NestedDepth(this.curly_depth, this.bracket_depth, this.parenth_depth-1)})
token.pre_modifiers=pre_modifiers;
return token;
}
}
}
if (!token.is_whitespace&&!token.is_line_break&&!token.is_word_boundary&&(token.token!=="keyword"||token.data==="await")){
this.assign_token_as_type(token);
}
}
callback(char){
if (char==="{"){
this.append_batch();
const prev=this.get_prev_token_by_token("last",[" ","\t","\n"], false, true);
if (prev&&(
prev.data==="return"||
prev.data===","||
prev.data===":"||
prev.data==="="||
prev.data==="["||
prev.data==="("||
prev.data==="?"||
prev.data==="|"
)){
this.js_scopes.append({
depth:new vhighlight.NestedDepth(this.curly_depth-1, this.bracket_depth, this.parenth_depth),
scope:"raw_object",
})
if (prev.data===":"||prev.data==="="){
let prev_prev=this.get_prev_token_by_token(prev);
if (prev_prev&&!prev_prev.is_word_boundary&&prev_prev.token!=="keyword"){
this.add_parent(prev_prev, this.curly_depth-1);
prev_prev.is_object_def=true;
}
}
}
}
if (this.js_scopes.length>0&&char===")"){
let scope;
if (
(scope=this.js_scopes.last())!=null&&
scope.scope==="parameters"&&
(scope.is_open===undefined||scope.is_open===true)&&
scope.depth.eq_values(this.curly_depth, this.bracket_depth, this.parenth_depth)
){
this.js_scopes.pop();
let index=this.get_first_non_whitespace(this.index+1, true  );
if (this.code.charAt(index)==="="&&this.code.charAt(index+1)===">"){
index=this.get_first_non_whitespace(index+2, true  );
}
if (index!==null&&this.code.charAt(index)==="{"){
this.js_scopes.append({scope:"function",depth:scope.depth})
}
}
}
else if (this.js_scopes.length>0&&char==="}"){
let scope;
while (
(scope=this.js_scopes.last())!=null&&
scope.scope!=="parameters"&&
scope.depth.eq_values(this.curly_depth, this.bracket_depth, this.parenth_depth)
){
this.js_scopes.pop();
}
}
if (char==="}"&&this.capture_inherit_start_token!==undefined){
this.append_batch();
const start_token=this.capture_inherit_start_token;
let success=false;
let inherited_types=[];
this.tokens.iterate_tokens_reversed((token)=>{
if (token.index<=start_token.index){
return false;
}
else if (token.token==="keyword"&&token.data==="extends"){
success=true;
return false;
}
else if (token.token==="type"){
inherited_types.push({
type:"public",
token:token,
tokens:[token],
full_name:token.data,
});
}else if (!token.is_whitespace&&inherited_types.length>0){
const last=inherited_types.last();
last.tokens=[token, ...last.tokens];
last.full_name=token.data+last.full_name;
}
})
if (success&&inherited_types.length>0){
start_token.inherited=inherited_types;
}
this.capture_inherit_start_token=undefined;
}
else if (
char==="."&&
this.code.charAt(this.index+1)==="."&&
this.code.charAt(this.index+2)==="."
){
this.append_batch();
this.batch="...";
this.append_batch("keyword");
this.resume_on_index(this.index+2);
return true;
}
}
}
vhighlight.js=new vhighlight.JS();
if (typeof module!=="undefined"&&typeof module.exports!=="undefined"){
const libfs=require("fs");
const {parse:babel_parse}=require('@babel/parser');
const babel_traverse=require('@babel/traverse').default;
vhighlight.JSCompiler=class JSCompiler{
constructor({
line_breaks=true,
double_line_breaks=false,
comments=false,
white_space=false,
tree_shaking=false,
mangle=false,
}={}){
this.line_breaks=line_breaks;
this.double_line_breaks=double_line_breaks;
this.comments=comments;
this.white_space=white_space;
this.tree_shaking=tree_shaking;
this.mangle=mangle;
this.str_chars=["\"","'","`;"]
this.tokenizer=new vhighlight.JS({
allow_preprocessors:true,
excluded_word_boundary_joinings:[" ","\t"],
compiler:true,
});
}
bundle({
export_path=null,
includes=[],
excludes=[],
compile_min=false,
log=false,
}){
this.preprocessor_defs={};
this.serialized_preprocessor_defs={};
let code="";
const paths=[];
const include_path=(path)=>{
if (typeof path==="object"){
path=path.toString();
}
if (excludes.includes(path)){
return null;
}
if (!libfs.existsSync(path)){
throw Error(`Path "${path}" does not exist.`);
}
if (libfs.statSync(path).isDirectory()){
const files=libfs.readdirSync(path);
for (let i=0;i<files.length;i++){
include_path(`${path}/${files[i]}`);
}
}
else if (paths.includes(path)===false){
paths.push(path);
}
}
for (let i=0;i<includes.length;i++){
include_path(includes[i]);
}
for (let i=0;i<paths.length;i++){
const path=paths[i];
if (compile_min===false&&path.length>7&&path.substr(path.length-7)===".min.js"){
code+=libfs.readFileSync(path);
}else {
code+=this.compile(path);
}
}
libfs.writeFileSync(export_path,code);
if (log){
console.log(`Bundled into "${export_path}".`);
}
}
compile(path){
return this.compile_code(libfs.readFileSync(path).toString(),path);
}
compile_code(code_data,path="<raw code data>",_first_run=true){
this.tokenizer.code=code_data;
this.tokens=this.tokenizer.tokenize()
if (_first_run&&this.tree_shaking){
this.remove_dead_code(path);
}
this.code_insertions=[];
let code="";
let prev_prev_token;
let prev_prev_nw_token;
let prev_token;
let prev_nw_token;
let prev_is_whitespace=false;
let prev_is_operator=false;
let prev_is_colon=false;
let resume_on=0;
let line_index=-1;
let token_index=-1;
const get_next_token=(lookup=1,exclude=[])=>{
return this.tokens.iterate_tokens(line_index, null,(token)=>{
if (token.index>=token_index+lookup&&token.data!=""&&!exclude.includes(token.data)){
return token;
}
})
}
const serialize_str_variable=(value)=>{
if (
(value.charAt(0)=="\""&&value.charAt(value.length-1)=="\"")||
(value.charAt(0)=="'"&&value.charAt(value.length-1)=="'")||
(value.charAt(0)=="`"&&value.charAt(value.length-1)=="`")
){
value=value.substr(1,value.length-2);
}
else if (
(value.charAt(0)=="["&&value.charAt(value.length-1)=="]")||
(value.charAt(0)=="{"&&value.charAt(value.length-1)=="}")
){
value=JSON.parse(value);
}
else if (value==="true"){
value=true;
}
else if (value==="false"){
value=false;
}
else if (value==="null"){
value=null;
}
else if (value==="undefined"){
value=undefined;
}
else if (/^-?\d+(\.\d+)?$/.test(value)){
value=parseFloat(value);
}
return value;
}
this.tokens.iterate((line_tokens)=>{
++line_index;
let added_tokens=0;
let at_line_start=true;
line_tokens.iterate((token)=>{
++token_index;
let add_to_code=true;
const is_whitespace=token.is_word_boundary===true&&token.data.length===1&&(token.data===" "||token.data==="\t");
const is_operator=token.token==="operator";
const next_nw_token=get_next_token(1,[" ","\t","\n",""]);
const next_token=get_next_token(1);
const next_is_operator=next_token!==null&&next_token.token=="operator";
const next_is_whitespace=next_token!==null&&next_token.is_word_boundary===true&&next_token.data.length===1&&(next_token.data===" "||next_token.data==="\t");
if (at_line_start&&is_whitespace===false){
at_line_start=false;
}
if (_first_run&&token.is_decorator===true){
resume_on=this.apply_decorator(path,token);
return null;
}
if (token.index<resume_on){
return null;
}
if (
token.is_line_break&&
(token.is_comment!==true&&token.is_str!==true&&token.is_regex!==true&&token.is_preprocessor!==true)&&
(
prev_nw_token==null||
(
prev_nw_token.is_comment!==true&&
prev_nw_token.is_str!==true&&
prev_nw_token.is_regex!==true&&
prev_nw_token.is_preprocessor!==true
)
)
){
if (
(this.double_line_breaks===false&&added_tokens==0)
||(
this.line_breaks===false&&
prev_nw_token!=null&&
(
prev_nw_token.data===","
||prev_nw_token.data===";"
||prev_nw_token.data===":"
||prev_nw_token.data==="&"
||prev_nw_token.data==="|"
||prev_nw_token.data==="["
||prev_nw_token.data==="{"
||prev_nw_token.data==="("
||prev_nw_token.data==="+"
||prev_nw_token.data==="-"
||prev_nw_token.data==="*"
||prev_nw_token.data==="/"
)
)
){
if (prev_nw_token!==undefined&&prev_nw_token.token==="keyword"){
code+=" ";
}
return null;
}
else if (
this.line_breaks===false&&
(
prev_nw_token.data==="]"
||prev_nw_token.data==="}"
||prev_nw_token.data===")"
)&&
(
next_nw_token!=null&&
(
next_nw_token.data==="]"||
next_nw_token.data==="}"||
next_nw_token.data===")"
)
)
){
return null;
}
else if (
this.line_breaks===false&&
next_nw_token!=null&&
(
next_nw_token.data==="."||
next_nw_token.data===")"||
next_nw_token.data==="}"||
next_nw_token.data==="]"
)
){
return null;
}
}
if (
this.white_space===false&&
is_whitespace&&
(
at_line_start||
prev_is_operator||
prev_is_colon||
next_is_whitespace||
next_is_operator||
(
prev_token!=null&&
(
prev_token.data==="{"||
prev_token.data==="}"
)
)||
(
(prev_nw_token==null||prev_nw_token.token!=="keyword")&&
(next_token==null||next_token.token!=="keyword")
)
)
){
return null;
}
if (
this.comments===false&&
token.is_comment===true&&
(token.is_line_break!==true||added_tokens===0)
){
return null;
}
if (
_first_run&&
prev_nw_token!==undefined&&
prev_nw_token.token==="string"&&
token.token==="string"&&
this.str_chars.includes(prev_nw_token.data[prev_nw_token.data.length-1])&&
this.str_chars.includes(token.data[0])&&
prev_nw_token.data[prev_nw_token.data.length-1]===token.data[0]
){
const closer=prev_nw_token.data[prev_nw_token.data.length-1];
let success=false,close_index;
for (close_index=code.length-1;close_index>=0;close_index--){
if (code.charAt(close_index)===closer){
success=true;
break;
}
}
if (success){
code=code.substr(0,close_index);
token.data=token.data.substr(1);
}
}
if (_first_run&&token.token==="string"&&token.data.startsWith("```")){
let remove_indent="",indent="";
this.tokens.iterate_tokens_reversed(0,token.line+1,(token)=>{
if (token.index<=token_index){
if (token.is_line_break){
remove_indent=indent;
return true;
}else if (token.is_whitespace){
indent+=token.data;
}else {
indent="";
}
}
})
let prev=null;
this.tokens.iterate_tokens(token.line, null,(token)=>{
if (token.index===token_index){
code+="`";
code+=token.data.substr(3);
}
else if (token.index>=token_index){
if (remove_indent.length>0&&prev.is_line_break===true&&token.data.startsWith(remove_indent)){
token.data=token.data.substr(remove_indent.length);
}
if (
token.token==="string"&&token.data.endsWith("```")
){
code+=token.data.substr(0,token.data.length-3);
code+="`";
resume_on=token.index+1;
return true;
}
code+=token.data;
}
prev=token;
});
add_to_code=false;
}
if (_first_run&&token.token==="numeric"){
if (next_token!=null){
if (
next_token.data.length===1&&
(
next_token.data==="%"||
next_token.data==="#"||
next_token.data==="px"||
next_token.data==="em"
)
){
code+=`"${token.data}${next_token.data}"`;
resume_on=next_token.index+1;
add_to_code=false;
}
else if (
next_token.data.length===2&&
(
next_token.data==="px"||
next_token.data==="em"
)
){
code+=`"${token.data}${next_token.data.substr(0,2)}"`;
next_token.data=next_token.data.substr(2);
add_to_code=false;
}
else if (
next_token.data.length>1&&
(
next_token.data.charAt(0)==="%"||
next_token.data.charAt(0)==="#"
)
){
code+=`"${token.data}${next_token.data.charAt(0)}"`;
next_token.data=next_token.data.substr(1);
add_to_code=false;
}
}
}
if (_first_run&&token.token==="preprocessor"){
let preprocessor_data=token.data;
let lookup=1;
while (true){
const next=get_next_token(lookup);
if (next!=null&&(next.token==="preprocessor"||next.is_preprocessor===true)){
++lookup;
if (token.is_line_break===true){
preprocessor_data+=" ";
}else {
preprocessor_data+=next.data;
}
}else {
break;
}
}
resume_on=token_index+lookup;
preprocessor_data=preprocessor_data.trim();
add_to_code=false;
if (preprocessor_data.startsWith("#define")){
const splitted=preprocessor_data.split(" ");
if (splitted.length>=3){
let value=splitted.slice(2).join(" ");
this.preprocessor_defs[splitted[1]]=value;
this.serialized_preprocessor_defs[splitted[1]]=serialize_str_variable(value);
}
}
else if (preprocessor_data.startsWith("#if")){
const statement_tokens=[[]];
const statement_conditions=[preprocessor_data];
const statement_conditions_tokens=[[]];
let statement_lookup=lookup;
let statement=null;
let statement_index=0;
let end_token=null;
let is_non_statement_preprocessor=false;
while (true){
const next=get_next_token(statement_lookup);
if (next.token==="preprocessor"||next.is_preprocessor===true){
if (statement==null){
if (
next.data.startsWith("#if")===false&&
next.data.startsWith("#elif")===false&&
next.data.startsWith("#else")===false&&
next.data.startsWith("#endif")===false
){
is_non_statement_preprocessor=true;
statement_tokens[statement_index].push(next)
}
}
if (is_non_statement_preprocessor!==true){
if (statement===null){
statement="";
}
if (next.token==="line"){
statement+=" ";
}else {
statement+=next.data;
}
statement_conditions_tokens.push(next);
if (statement.startsWith("#endif")){
end_token=next.index;
break;
}
}
}
else {
is_non_statement_preprocessor=false;
if (statement!==null){
statement_conditions.push(statement);
statement_tokens.push([])
++statement_index;
statement=null;
}
statement_tokens[statement_index].push(next)
}
++statement_lookup;
}
let evaluated_index=null;
for (let i=0;i<statement_conditions.length;i++){
let result;
let statement=statement_conditions[i];
const start=statement.indexOf(" ");
if (start===-1){
result=statement==="#else";
}
statement=statement.substr(start+1).trim()
if (statement.startsWith("path_exists(")){
let path=statement.substr(12).trim();
if (path.charAt(path.length-1)===")"){
path=path.substr(0,path.length-1);
}
path=serialize_str_variable(path);
try {
result=libfs.existsSync(path)
}catch (error){
result=false;
}
}
else if (statement.startsWith("argv_present")){
const params=statement.substr(12).replaceAll("\t"," ").replaceAll("\n"," ").replaceAll("  "," ").trim().split(" ");
result=process.argv.includes(params[0].slice(1,-1))
}
else if (statement.startsWith("argv_eq")){
const params=statement.substr(7).replaceAll("\t"," ").replaceAll("\n"," ").replaceAll("  "," ").trim().split(" ");
const index=process.argv.indexOf(params[0].slice(1,-1));
result=false;
if (index!==-1&&index+1<process.argv.length){
result=params[1].slice(1,-1)===process.argv[index+1];
}
}
else if (result!==true){
const evaluate=new Function(...Object.keys(this.serialized_preprocessor_defs),`return ${statement};`);
try {
result=evaluate(...Object.values(this.serialized_preprocessor_defs));
}catch (error){
throw Error(`Encountered an error while evaluating statement "${statement}": ${error}`);
}
}
if (result){
evaluated_index=i;
break;
}
}
if (evaluated_index!==null){
for (let i=0;i<statement_conditions.length;i++){
if (i!==evaluated_index){
statement_tokens[i].iterate((token)=>{
token.data="";
token.token=undefined;
})
}
}
statement_conditions_tokens.iterate((token)=>{
token.data="";
token.token=undefined;
});
}
}
else {
throw Error(`Unknown preprocessor statement "${token.data}"`)
}
}
else if (_first_run&&this.preprocessor_defs!==undefined&&this.preprocessor_defs[token.data]!=null){
const value=this.preprocessor_defs[token.data];
if (typeof value==="string"){
code+=value;
add_to_code=false;
}
}
if (add_to_code){
code+=token.data;
}
if (this.code_insertions.length>0){
const new_code_insertions=[];
this.code_insertions.iterate((item)=>{
if (item.after_token===token.index){
code+=item.data;
}else {
new_code_insertions.push(item);
}
})
this.code_insertions=new_code_insertions;
}
++added_tokens;
prev_prev_token=prev_token;
prev_token=token;
prev_is_whitespace=is_whitespace;
prev_is_operator=is_operator;
prev_is_colon=token.token===undefined&&token.data.length>0&&token.data.charAt(token.data.length-1)===":";
if (
token.is_line_break!==true&&
(token.data.length>1||(token.data!=" "&&token.data!="\t"))
){
prev_prev_nw_token=prev_nw_token;
prev_nw_token=token;
}
})
})
code=code.trim()+(_first_run?"\n":"");
return code;
}
async _bundle_library({
source,
name,
author=null,
start_year=null,
version=null,
embed_data=[],
dependencies=[],
compile_libs=[],
embed_libs=[],
embed_dependencies=[],
includes=[],
excludes=[],
npm_config_path=null,
templates={},
}){
const vlib=require(`${process.env.PERSISTANCE}/private/dev/vinc/vlib/js/vlib.js`);
source=new vlib.Path(source);
const package_path=npm_config_path?new vlib.Path(npm_config_path):source.join("package.json");
const package_data=package_path.exists()?JSON.parse(package_path.load_sync()):null;
if (version==null){
version=package_data.version;
}
compile_libs.iterate((path)=>{require(path);});
if (source==null){
throw new Error("Define parameter \"source\".");
}
if (name==null){
throw new Error("Define parameter \"name\".");
}
source=new vlib.Path(source).abs();
const export_path=source.join(name);
this.bundle({
includes,
excludes,
export_path:export_path.str(),
});
let bundled=export_path.load_sync();
let update_bundled=false;
if (version){
update_bundled=true;
bundled=bundled.replaceAll("__VERSION__",`"${version}"`);
}
bundled=this._fill_templates(bundled,templates, true);
const first_party_bytes=export_path.size;
export_path.reset();
let prepend="";
embed_data.iterate(data=>{prepend+=data;})
if (author!=null){
prepend+=
`/*\n`+
` * Author: ${author}\n`+
` * Copyright: © ${start_year===null?new Date().getFullYear():start_year} - ${new Date().getFullYear()} ${author}\n`+
` * Version: v${version?version:"?"}\n`+
` */\n`;
}
if (embed_libs.length>0){
embed_libs.iterate((path)=>{
if (path!=null&&typeof path==="object"&&path.data){
prepend+=path.data;
}else {
prepend+=new vlib.Path(path).load_sync();
}
});
export_path.save_sync(prepend+";"+bundled);
}
else {
export_path.save_sync(prepend+bundled);
}
if (embed_dependencies.length>0){
let install_dependencies=[];
embed_dependencies.iterate((path)=>{
const package_dependencies=JSON.parse(new vlib.Path(path).load_sync()).dependencies;
if (typeof package_dependencies==="object"){
Object.keys(package_dependencies).iterate((key)=>{
install_dependencies.push(`${key}@${package_dependencies[key]}`);
dependencies.push(key);
});
}
});
if (install_dependencies.length>0){
const proc=new vlib.Proc();
const exit_status=await proc.start({
command:"npm",
args:["install","--save", ...install_dependencies],
working_directory:source.str(),
});
if (exit_status!==0){
throw new Error(`Installing dependencies failed with exit_status ${proc.exit_status}.\n${proc.err}`);
}
}
}
let remove_dependencies=[];
if (embed_dependencies.length>0&&package_path.exists()){
const installed_dependencies=package_data.dependencies;
if (typeof installed_dependencies==="object"){
Object.keys(installed_dependencies).iterate((lib)=>{
if (!dependencies.includes(lib)){
remove_dependencies.push(lib);
}
});
if (remove_dependencies.length>0){
const proc=new vlib.Proc();
const exit_status=await proc.start({
command:"npm",
args:["uninstall","--save", ...remove_dependencies],
working_directory:source.str(),
});
if (exit_status!==0){
throw new Error(`Uninstalling dependencies failed with exit_status ${proc.exit_status}.\n${proc.err}`);
}
}
}
}else if (embed_dependencies.length>0&&!package_path.exists()){
console.log(`Warning: NPM package path "${package_path.str()}" does not exist, not uninstalling any dependencies.`);
}
const total_bytes=(export_path.size/1024).toFixed(2);
const third_party_bytes=((1.0-(first_party_bytes/export_path.size))*100).toFixed(2)
if (embed_libs.length>0){
vlib.print_marker(`Compiled ${export_path.name()}${version?"@"+version:""} [${total_bytes}KB, ${third_party_bytes}% from embedded libs].`);
}else {
vlib.print_marker(`Compiled ${export_path.name()}${version?"@"+version:""} [${total_bytes}KB].`);
}
}
extract_globals(code){
const ast=babel_parse(code,{
sourceType:'module',
plugins:['jsx']
});
const globals={
variables:new Set(),
classes:new Set(),
functions:new Set()
};
babel_traverse(ast,{
VariableDeclaration(path){
if (path.parent.type==='Program'){
path.node.declarations.forEach(declaration=>{
if (declaration.id.type==='Identifier'){
globals.variables.add(declaration.id.name);
}
});
}
},
FunctionDeclaration(path){
if (path.parent.type==='Program'&&path.node.id&&path.node.id.name){
globals.functions.add(path.node.id.name);
}
},
ClassDeclaration(path){
if (path.parent.type==='Program'&&path.node.id&&path.node.id.name){
globals.classes.add(path.node.id.name);
}
}
});
return [...Array.from(globals.variables), ...Array.from(globals.classes), ...Array.from(globals.functions)];
}
remove_dead_code(path="<raw code data>"){
const dont_remove=[
"constructor",
"toString",
"valueOf",
"hasOwnProperty",
"isPrototypeOf",
"propertyIsEnumerable",
"toLocaleString",
"apply",
"call",
"bind",
"__defineGetter__",
"__defineSetter__",
"__lookupGetter__",
"__lookupSetter__"
];
const detect_types=(start_token)=>{
let skip_till=null;
const detected_types=[];
this.tokens.iterate_tokens(start_token.line, null,(token)=>{
if (token.index<=start_token.index){
return null;
}
if (
skip_till!=null&&
token.curly_depth===skip_till[0]&&
token.bracket_depth===skip_till[1]&&
token.parenth_depth===skip_till[2]
){
skip_till=null;
}else if (token.token==="type_def"){
skip_till=[token.curly_depth,token.bracket_depth,token.parenth_depth];
return null;
}else if (skip_till!=null){
return null;
}
if (
token!==start_token&&
token.curly_depth===start_token.curly_depth&&
token.bracket_depth===start_token.bracket_depth&&
token.parenth_depth===start_token.parenth_depth
){
return false;
}
else if (token.token==="type"){
detected_types.push(token.data);
}
})
return detected_types;
}
const type_defs=[];
const type_defs_names=new Set();
const main_level_calls=new Set();
let end_of_func=null;
this.tokens.iterate_tokens((token)=>{
if (
end_of_func!=null&&
token.curly_depth===end_of_func[0]&&
token.bracket_depth===end_of_func[1]&&
token.parenth_depth===end_of_func[2]
){
end_of_func=null;
}
if (token.token==="type_def"&&token.curly_depth!=null){
let used=false;
if (token.type!=null){
token.type.iterate((item)=>{
if (item.data==="class"&&item.token==="keyword"){
used=true;
return false;
}
})
}
type_defs.push({
name:token.data,
calls:null,
used,
token,
});
type_defs_names.add(token.data);
end_of_func=[
token.curly_depth,
token.bracket_depth,
token.parenth_depth,
];
}
else if (end_of_func===null){
if (token.token==="type"){
main_level_calls.add(token.data);
}
}
})
const mark_as_used=(name)=>{
type_defs.iterate((type_def)=>{
if (!type_def._iterated&&name===type_def.name){
type_def.used=true;
type_def._iterated=true;
if (type_def.calls===null){
type_def.calls=detect_types(type_def.token);
}
type_def.calls.iterate(mark_as_used)
}
})
}
Array.from(main_level_calls).iterate(mark_as_used);
type_defs.iterate((type_def)=>{
if (dont_remove.includes(type_def.name)){
type_def.used=true;
type_def._iterated=true;
if (type_def.calls===null){
type_def.calls=detect_types(type_def.token);
}
type_def.calls.iterate(mark_as_used)
}
})
this.tokens.iterate_tokens((token)=>{
if (
token.token===undefined&&
!token.is_whitespace&&
!token.is_word_boundary&&
!token.is_line_break&&
type_defs_names.has(token.data)
){
mark_as_used(token.data);
}
});
const remove_tokens=new Map();
type_defs.iterate((type_def)=>{
if (!type_def.used){
let prev_token=type_def.token;
let also_remove_before=false;
let start_remove_index=type_def.token.index;
while ((prev_token=this.tokenizer.get_prev_token_by_token(prev_token,[" ","\t","\n"]))!=null){
if (
prev_token.token==="keyword"||
prev_token.data===","||
also_remove_before
){
start_remove_index=prev_token.index;
also_remove_before=false;
}
else if (
prev_token.data==="="||
prev_token.data==="."||
prev_token.data===":"
){
start_remove_index=prev_token.index;
also_remove_before=true;
}
else {
break;
}
}
remove_tokens.set(start_remove_index,{
curly_depth:type_def.token.curly_depth,
bracket_depth:type_def.token.bracket_depth,
parenth_depth:type_def.token.parenth_depth,
});
}
})
let remove_index=null;
this.tokens.iterate_tokens((token)=>{
if (remove_index!==null){
const info=remove_tokens.get(remove_index);
if (
token.data==="}"&&
token.curly_depth===info.curly_depth&&
token.bracket_depth===info.bracket_depth&&
token.parenth_depth===info.parenth_depth
){
remove_index=null;
}
token.remove=true;
}
else if (remove_tokens.has(token.index)){
remove_index=token.index;
token.remove=true;
}
})
this.tokenizer.assign_tokens(this.tokens);
this.tokens=this.tokenizer.tokens;
}
_fill_templates(data,templates,curly_style=true){
if (templates==null){return data;}
const keys=Object.keys(templates);
if (keys.length>0){
for (let i=0;i<data.length;i++){
if (curly_style&&data.charAt(i)==="{"&&data.charAt(i+1)==="{"){
for (let k=0;k<keys.length;k++){
if (
data.charAt(i+keys[k].length+2)==="}"&&
data.charAt(i+keys[k].length+3)==="}"&&
data.eq_first(keys[k],i+2)
){
const end_index=i+keys[k].length+4;
if (templates[keys[k]]!=null&&typeof templates[keys[k]]==="object"){
data=data.replace_indices(JSON.stringify(templates[keys[k]]),i,end_index);
}else {
data=data.replace_indices(templates[keys[k]],i,end_index);
}
i=end_index-1;
}
}
}
else if (!curly_style&&data.charAt(i)==="$"){
for (let k=0;k<keys.length;k++){
if (
data.eq_first(keys[k],i+1)
){
const end_index=i+keys[k].length+1;
if (templates[keys[k]]!=null&&typeof templates[keys[k]]==="object"){
data=data.replace_indices(JSON.stringify(templates[keys[k]]),i,end_index);
}else {
data=data.replace_indices(templates[keys[k]],i,end_index);
}
i=end_index-1;
}
}
}
}
}
return data;
}
get_next_type_def(line,start_index){
return this.tokens.iterate_tokens(line, null,(token)=>{
if (token.index>=start_index&&token.token==="type_def"){
return token;
}
})
}
get_closing_token(line,start_index,opener="(",closer=")",allow_non_whitespace=true){
let depth=0,open_token=null,close_token=null;
const res=this.tokens.iterate_tokens(line, null,(token)=>{
if (token.index>=start_index){
if (token.token===undefined&&token.data.length===1&&token.data===opener){
if (depth===0){
open_token=token;
}
++depth;
}else if (token.token===undefined&&token.data.length===1&&token.data===closer){
--depth;
if (depth===0){
close_token=token;
return true;
}
}else if (
depth===0&&
allow_non_whitespace===false&&
(
token.data.length>1||
(token.data!=" "&&token.data!="\t"&&token.data!="\n")
)
){
return false;
}
}
})
return {close_token,open_token};
}
apply_decorator(path,token){
const column=token.offset-this.tokens[token.line][0].offset;
const decorator=token.data;
let resume_on;
const line_break=this.line_breaks?"":"\n";
const get_param_value=(name,def=null,unqoute=false)=>{
let value=def;
token.parameters.iterate((param)=>{
if (param.name===name){
if (param.value!==null&&param.value.length>0){
value="";
param.value.iterate((item)=>{
value+=item.data;
})
}
return true;
}
})
if (value===undefined){value=def;}
while (value.length>=2&&this.str_chars.includes(value.charAt(0))&&this.str_chars.includes(value.charAt(value.length-1))){
value=value.substr(1,value.length-2);
}
const str_chars=["'",'"',"`"];
if (unqoute&&str_chars.includes(value.charAt(0))&&str_chars.includes(value.charAt(value.length-1))){
value=value.substr(1,value.length-2);
}
return value;
}
const check_prev_is_keyword_class=(type_def_token)=>{
const class_keyword=this.tokenizer.get_prev_token_by_token(type_def_token,[" ","\t","\n"]);
if (class_keyword==null||class_keyword.data!=="class"){
throw Error(`${path}:${token.line}:${column}: The target type definition "${type_def_token.data}" is not a class (${decorator}).`);
}
return class_keyword;
}
const build_params=(params)=>{
let data="(";
let i=0,last_i=params.lenth-1;
params.iterate((param)=>{
if (param.name!=null){
data+=`${param.name}=`;
}
data+=param.value;
if (i!=last_i){
data+=",";
}
++i;
})
data+=")";
return data;
}
const get_assignment_name=(from_token_index)=>{
const assignment=this.tokenizer.get_prev_token(from_token_index,[" ","\t","\n"]);
let assignment_name=null;
if (assignment!=null&&assignment.data==="="){
assignment_name="";
this.tokens.iterate_tokens_reversed(assignment.line,assignment.line+1,(token)=>{
if (token.index<assignment.index){
if (assignment_name.length===0&&token.is_word_boundary!==true){
assignment_name+=token.data;
}else if (assignment_name.length!==0){
if (token.is_word_boundary&&token.data!=="."){
return false;
}else {
assignment_name=token.data+assignment_name;
}
}
}
})
if (assignment_name.length===0){
assignment_name=null;
}
}
return assignment_name;
}
let resume=this.get_closing_token(token.line,token.index+1,"(",")", false);
if (resume.close_token==null){
resume_on=token.index+1;
}else {
resume_on=resume.close_token.index+1;
}
let {open_token,close_token}=this.get_closing_token(token.line,resume_on-1,"{","}");
if (open_token===null||close_token===null){
throw Error(`${path}:${token.line}:${column}: Unable to find the scope's open and close tokens (${decorator}).`);
}else {
let prev=this.tokenizer.get_prev_token_by_token(open_token,[" ","\t","\n"]);
if (prev!=null&&prev.data==="("){
const res=this.get_closing_token(token.line,close_token.index+1,"{","}");
open_token=res.open_token;
close_token=res.close_token;
if (open_token===null||close_token===null){
throw Error(`${path}:${token.line}:${column}: Unable to find the scope's open and close tokens (${decorator}).`);
}
}
}
const type_def_token=this.get_next_type_def(token.line,resume_on-1);
if (type_def_token===null||type_def_token.index>=open_token.index){
throw Error(`${path}:${token.line}:${column}: There is no type definition before the scope opening (${decorator}).`);
}
if (decorator==="@constructor_wrapper"){
const class_keyword=check_prev_is_keyword_class(type_def_token);
const assignment_name=get_assignment_name(class_keyword.index-1);
let suffix=get_param_value("suffix","Class", true);
if (
type_def_token.data.length<suffix.length||
type_def_token.data.substr(type_def_token.data.length-suffix.length)!=suffix
){
const old_suffix=suffix;
suffix="Element";
if (
type_def_token.data.length<suffix.length||
type_def_token.data.substr(type_def_token.data.length-suffix.length)!=suffix
){
throw Error(`${path}:${token.line}:${column}: The target type definition "${type_def_token.data}" does not contain suffix "${old_suffix}" (${decorator}).`);
}
}
let data=";";
if (assignment_name!==null){
data+=`${assignment_name}=`;
}
data+=`${line_break}function ${type_def_token.data.substr(0,type_def_token.data.length-suffix.length)}(...args){return new ${type_def_token.data}(...args)};`;
this.code_insertions.push({
after_token:close_token.index,
data:data,
});
}
else if (decorator==="@register_element"){
const class_keyword=check_prev_is_keyword_class(type_def_token);
const data=`;${line_break}vweb.elements.register(${type_def_token.data});`;
this.code_insertions.push({
after_token:close_token.index,
data:data,
});
}
else {
if (type_def_token.custom_decorators===undefined){
this.code_insertions.push({
after_token:open_token.index,
data:`${line_break}let callback=()=>{`,
})
this.code_insertions.push({
after_token:close_token.index-1,
data:`};${line_break}`,
})
}
let old_decorators=[];
if (type_def_token.custom_decorators!==undefined){
const new_insertions=[];
this.code_insertions.iterate((item)=>{
if (item.decorator!==type_def_token.offset){
new_insertions.push(item);
}
else if (item.end_decorator!==true){
old_decorators.push(item);
}
})
this.code_insertions=new_insertions;
}
let data=`callback=${decorator.substr(1)}({callback:callback`;
token.parameters.iterate((param)=>{
if (param.name==null){
throw Error(`${path}:${token.line}:${column}: Decorator parameters must always use keyword assignment "@decorator(my_param = 0)" (${decorator}).`);
}
data+=`,${param.name}:${param.value}`
})
data+=`});${line_break}`
this.code_insertions.push({
after_token:close_token.index-1,
data:data,
decorator:type_def_token.offset,
})
old_decorators.iterate((item)=>{
this.code_insertions.push(item);
})
this.code_insertions.push({
after_token:close_token.index-1,
data:`return callback();${line_break}`,
decorator:type_def_token.offset,
end_decorator:true,
})
if (type_def_token.custom_decorators===undefined){
type_def_token.custom_decorators=[decorator];
}else {
type_def_token.custom_decorators.push(decorator);
}
}
return resume_on;
}
}
}
vhighlight.JSON=class JSON extends vhighlight.Tokenizer{
constructor(){
super({
keywords:[
"true",
"false",
"null",
],
single_line_comment_start:"//",
multi_line_comment_start:"/*",
multi_line_comment_end:"*/",
scope_separators:[
"{",
"}",
",",
],
language:"JSON",
});
}
}
vhighlight.json=new vhighlight.JSON();
vhighlight.Markdown=class Markdown extends vhighlight.Tokenizer{
constructor({
insert_codeblocks=true,
}={}){
super({
allow_strings:false,
allow_numerics:false,
scope_separators:[],
language:"Markdown",
});
this.insert_codeblocks=insert_codeblocks;
this.allow_markdown_bold_italic=true;
this.callback=Markdown.create_callback().bind(this);
this.derived_reset=Markdown.create_derived_reset().bind(this);
this.derived_retrieve_state=Markdown.create_derived_retrieve_state().bind(this);
}
static create_callback(){
return function(char,a,b,c,d,is_escaped){
if (this.md_inside_codeblock!=null){
let closing_index=this.code.indexOf("```", this.index);
let found_close=true;
if (closing_index===-1){
closing_index=this.code.length;
found_close=false;
}
const code=this.code.substr(this.index,closing_index-this.index);
let tokenizer=vhighlight.init_tokenizer(this.md_inside_codeblock)
if (this.insert_codeblocks){
if (tokenizer!=null){
tokenizer.code=code;
const tokens=tokenizer.tokenize({is_insert_tokens:true,state:this.md_inside_codeblock_state});
this.md_inside_codeblock_state=tokenizer.state();
this.concat_tokens(tokens);
}else {
this.append_forward_lookup_batch(this.allow_comment_codeblock?"codeblock":null,code);
}
if (found_close){
this.append_forward_lookup_batch("keyword","```",{is_codeblock_end:true});
}
}
else {
this.batch=code;
this.append_batch(this.allow_comment_codeblock?"codeblock":null,{language:tokenizer==null?null :tokenizer.language});
}
if (found_close){
this.md_inside_codeblock=null;
this.md_inside_codeblock_state=null;
}
this.resume_on_index(closing_index+3);
return true;
}
if (this.start_of_line&&char=="#"){
this.append_batch();
const add=[];
let last_index=null;
let at_start=true;
let word="";
for (let i=this.index;i<this.code.length;i++){
const c=this.code.charAt(i);
if (c=="\n"){
if (word.length>0){
add.push(["bold",word]);
word="";
}
last_index=i-1;
break;
}
else if (c==" "||c=="\t"){
if (word.length>0){
add.push(["bold",word]);
word="";
}
add.push([false,c]);
}
else if (at_start&&c=="#"){
add.push(["keyword",c]);
}
else if (this.word_boundaries.includes(c)){
at_start=false;
if (word.length>0){
add.push(["bold",word]);
word="";
}
add.push([false,c]);
}
else {
at_start=false;
word+=c;
}
}
if (word.length>0){
add.push(["bold",word]);
word="";
}
if (add.length>0){
if (last_index==null){
last_index=this.code.length;
}
for (let i=0;i<add.length;i++){
this.append_forward_lookup_batch(add[i][0],add[i][1]);
}
this.resume_on_index(last_index);
return true;
}
}
else if (
this.start_of_line&&
this.md_inside_metadata===null&&
char==="-"&&
this.code.charAt(this.index+1)==="-"&&
this.code.charAt(this.index+2)==="-"
){
this.md_inside_metadata=true;
}
else if (this.md_inside_metadata){
if (char===":"){
const last=this.get_last_token();
if (last&&last.is_line_break){
this.append_batch("keyword");
}
}
else if (
this.start_of_line&&
char==="-"&&
this.code.charAt(this.index+1)==="-"&&
this.code.charAt(this.index+2)==="-"
){
this.md_inside_metadata=false;
}
return false;
}
else if (
this.allow_markdown_bold_italic&&
(
(char=="*"&&this.next_char=="*")||
(char=="_"&&this.next_char=="_")
)&&
!this.is_whitespace(this.code.charAt(this.index+2))
){
let closing_index=null;
for (let i=this.index+2;i<this.code.length;i++){
if (
this.code.charAt(i)==char&&
(this.code.charAt(i-1)==null||!this.is_whitespace(this.code.charAt(i-1)))&&
!this.is_escaped(i)
){
closing_index=i;
break;
}
}
if (closing_index==null){return false;}
this.append_batch();
this.append_forward_lookup_batch("keyword",char+char);
this.append_forward_lookup_batch("bold", this.code.substr(this.index+2,closing_index-(this.index+2)));
this.append_forward_lookup_batch("keyword",char+char);
this.resume_on_index(closing_index+1);
return true;
}
else if (
this.allow_markdown_bold_italic&&
(char=="*"||char=="_")&&
!this.is_whitespace(this.next_char)
){
let closing_index=null;
for (let i=this.index+1;i<this.code.length;i++){
if (
this.code.charAt(i)==char&&
(this.code.charAt(i-1)==null||!this.is_whitespace(this.code.charAt(i-1)))&&
!this.is_escaped(i)
){
closing_index=i;
break;
}
}
if (closing_index==null){return false;}
this.append_batch();
this.append_forward_lookup_batch("keyword",char);
this.append_forward_lookup_batch("italic", this.code.substr(this.index+1,closing_index-(this.index+1)));
this.append_forward_lookup_batch("keyword",char);
this.resume_on_index(closing_index);
return true;
}
else if (this.start_of_line&&char==">"){
this.append_batch();
this.batch=char;
this.append_batch("keyword");
return true;
}
else if (
this.start_of_line&&
(char=="-"||char=="*"||char=="+")&&
this.is_whitespace(this.next_char)
){
this.append_batch();
this.batch=char;
this.append_batch("keyword");
return true;
}
else if (this.start_of_line&&this.is_numerical(char)){
let batch=char;
let finished=false;
let last_index=null;
for (let i=this.index+1;i<this.code.length;i++){
const c=this.code.charAt(i);
if (c=="\n"){
break;
}else if (c=="."){
batch+=c;
finished=true;
last_index=i;
break;
}else if (this.is_numerical(c)){
batch+=c;
}else {
break;
}
}
if (finished){
this.append_batch();
this.append_forward_lookup_batch("keyword",batch);
this.resume_on_index(last_index);
return true;
}
}
else if (char=="["&&!is_escaped){
this.append_batch();
const opening_bracket=this.index;
const closing_bracket=this.get_closing_bracket(opening_bracket);
if (closing_bracket==null){return false;}
let opening_parentheses=null;
for (let i=closing_bracket+1;i<this.code.length;i++){
const c=this.code.charAt(i);
if (c==" "||c=="\t"){
continue;
}else if (c=="("){
opening_parentheses=i;
break;
}else {
break;
}
}
if (opening_parentheses==null){return false;}
const closing_parentheses=this.get_closing_parentheses(opening_parentheses);
if (closing_parentheses==null){return false;}
const prev=this.get_prev_token(this.added_tokens-1,[" ","\t"]);
const is_image=prev!=null&&prev.data=="!";
if (is_image){
prev.token="keyword";
}
this.append_forward_lookup_batch("keyword","[");
this.append_forward_lookup_batch("string", this.code.substr(opening_bracket+1,(closing_bracket-1)-(opening_bracket+1)+1));
this.append_forward_lookup_batch("keyword","]");
this.append_forward_lookup_batch("keyword","(");
this.append_forward_lookup_batch("string", this.code.substr(opening_parentheses+1,(closing_parentheses-1)-(opening_parentheses+1)+1));
this.append_forward_lookup_batch("keyword",")");
this.resume_on_index(closing_parentheses);
return true;
}
else if (this.prev_char!=="\\"&&char=="`"&&this.next_char!="`"&&this.prev_char!="`"){
let closing_index=null;
for (let i=this.index+1;i<this.code.length;i++){
const c=this.code.charAt(i);
if (c=="`"){
closing_index=i;
break;
}
}
if (closing_index==null){return false;}
this.append_forward_lookup_batch("codeline", this.code.substr(this.index,closing_index-this.index+1));
this.resume_on_index(closing_index);
return true;
}
else if (this.prev_char!=="\\"&&char=="`"&&this.next_char=="`"&&this.code.charAt(this.index+2)=="`"){
let closing_index=null;
let do_language=true;
let language="";
for (let i=this.index+3;i<this.code.length;i++){
const c=this.code.charAt(i);
const is_whitespace=this.is_whitespace(c);
if (c=="`"&&this.code.charAt(i+1)=='`'&&this.code.charAt(i+2)=="`"){
closing_index=i+2;
break;
}else if (do_language&&(is_whitespace||c=="\n")){
do_language=false;
}else if (do_language&&language.length==0&&!is_whitespace&&!this.is_alphabetical(c)){
do_language=false;
}else if (do_language&&!is_whitespace&&c!="\n"){
language+=c;
}
}
if (closing_index==null){
this.md_inside_codeblock=language;
closing_index=this.code.length+3;
}
const start=this.index+3+language.length;
const code=this.code.substr(start,(closing_index-3)-start+1);
let tokenizer=language==""?null :vhighlight.init_tokenizer(language)
if (this.insert_codeblocks){
let result=null;
if (tokenizer!=null){
tokenizer.code=code;
result=tokenizer.tokenize({is_insert_tokens:true})
if (closing_index==null){
this.md_inside_codeblock_state=tokenizer.state();
}
}
this.append_forward_lookup_batch("keyword","```",{is_codeblock_start:true});
if (result==null){
this.append_forward_lookup_batch(this.allow_comment_codeblock?"codeblock":null,language+code);
}else {
this.append_forward_lookup_batch("keyword",language);
this.concat_tokens(result);
}
this.append_forward_lookup_batch("keyword","```",{is_codeblock_end:true});
}
else {
this.batch=code;
this.append_batch(this.allow_comment_codeblock?"codeblock":null,{language:tokenizer==null?null :tokenizer.language});
}
this.resume_on_index(closing_index);
return true;
}
else if (char==="\\"&&this.next_char==="`"){
return true;
}
return false;
}
}
static create_derived_reset(){
return function (){
this.md_inside_codeblock=null;
this.md_inside_codeblock_state=null;
this.md_inside_metadata=null;
}
}
static create_derived_retrieve_state(){
return function (data){
data.md_inside_codeblock=this.md_inside_codeblock;
data.md_inside_codeblock_state=this.md_inside_codeblock_state;
data.md_inside_metadata=this.md_inside_metadata;
}
}
}
vhighlight.md=new vhighlight.Markdown();
vhighlight.Python=class Python extends vhighlight.Tokenizer{
constructor(){
super({
keywords:[
"and",
"as",
"assert",
"break",
"class",
"continue",
"def",
"del",
"elif",
"else",
"except",
"finally",
"for",
"from",
"global",
"if",
"import",
"in",
"is",
"lambda",
"not",
"or",
"pass",
"raise",
"return",
"try",
"while",
"with",
"yield",
"self",
"True",
"False",
"None",
"async",
"await",
],
type_def_keywords:[
"def",
"class",
],
type_keywords:[],
operators:[
"==","!=","<",">","<=",">=","+","-","*","/","%","**","//","=","!","?","&","|",
"^","~","<<",">>",
],
special_string_prefixes:[
"f",
"r",
"u",
"b",
],
single_line_comment_start:"#",
multi_line_comment_start:['"""',"'''"],
multi_line_comment_only_at_start:true,
is_indent_language:true,
language:"Python",
});
this.callback=(char)=>{
if (char=="("){
this.append_batch();
if (this.capture_inherit_start_token!==undefined){
const start_token=this.capture_inherit_start_token;
let depth=0;
let batch="";
let lookup_tokens=[];
let resume_on_index;
const append_batch=(token=null)=>{
if (batch.length>0){
if (token!=null){
lookup_tokens.push([token,batch]);
}else {
lookup_tokens.push(["type",batch]);
}
batch="";
}
}
for (let i=this.index;i<this.code.length;i++){
const c=this.code.charAt(i);
if (c==="("){
append_batch();
batch=c;
append_batch(false);
++depth;
}
else if (c===")"){
append_batch();
batch=c;
append_batch(false);
--depth;
if (depth===0){
resume_on_index=i;
break;
}
}
else if (c===","||c===" "||c==="\t"||c==="\n"){
append_batch();
batch=c;
append_batch(false);
}
else if (c!=="."&&c!=="_"&&this.word_boundaries.includes(c)){
break;
}
else if (batch.length===0&&c!=="_"&&this.is_alphabetical(c)===false){
break;
}
else {
batch+=c;
}
}
this.capture_inherit_start_token=undefined;
if (resume_on_index!==undefined){
let inherited_types=[];
for (let i=0;i<lookup_tokens.length;i++){
const appended_tokens=this.append_forward_lookup_batch(lookup_tokens[i][0],lookup_tokens[i][1]);
appended_tokens.iterate((token)=>{
if (token.token==="type"){
inherited_types.push({
type:"public",
token:token,
});
}
})
}
this.resume_on_index(resume_on_index-1);
if (inherited_types.length>0){
start_token.inherited=inherited_types;
}
return true;
}
}
else {
const prev=this.get_prev_token(this.added_tokens-1,[" ","\t","\n"]);
if (prev!=null&&prev.token===undefined&&!this.str_includes_word_boundary(prev.data)){
prev.token="type";
}
}
}
return false;
}
this.function_modifiers=["async"];
this.on_type_def_keyword=(token)=>{
const async_token=this.get_prev_token_by_token(token,[" ","\t","\n","def"]);
if (async_token!=null&&async_token.token==="keyword"&&async_token.data==="async"){
token.pre_modifiers=[async_token];
}
const prev=this.get_prev_token_by_token(token,[" ","\t","\n"]);
if (prev!==null&&prev.data==="class"){
this.capture_inherit_start_token=token;
token.type=[prev];
}
this.assign_parents(token);
this.add_parent(token);
}
}
derived_reset(){
this.capture_inherit_start_token=undefined;
}
derived_retrieve_state(data){
data.capture_inherit_start_token=this.capture_inherit_start_token;
}
}
vhighlight.python=new vhighlight.Python();
vhighlight.YAML=class YAML extends vhighlight.Tokenizer{
constructor({
line_by_line_mode=false,
}={}){
super({
keywords:[
"null",
"|",
],
single_line_comment_start:"#",
line_by_line_mode,
language:"YAML",
});
this.callback=(char)=>{
if (char==="-"&&this.is_alphabetical(this.code.charAt(this.index-1))&&this.is_alphabetical(this.code.charAt(this.index+1))){
this.batch+=char;
return true;
}
else if (char===":"){
let prev=this.get_last_token();
if (prev==null){
this.append_batch("keyword");
return false;
}
if (!prev.is_line_break){
while (true){
prev=this.get_prev_token_by_token(prev,[" ","\t","-"]);
if (prev!=null&&!prev.is_line_break&&prev.is_whitespace){
continue;
}
break;
}
}
if (prev==null||prev.is_line_break){
this.append_batch("keyword");
}
}
return false;
}
}
}
vhighlight.yaml=new vhighlight.YAML();
vhighlight.LMX=class LMX extends vhighlight.Tokenizer{
constructor({
insert_codeblocks=true,
allow_entities=true,
}={}){
super({
multi_line_comment_start:"<!--",
multi_line_comment_end:"-->",
allow_parameters:false,
allow_strings:false,
language:"LMX",
});
this.insert_codeblocks=insert_codeblocks;
this.allow_entities=allow_entities;
this.allow_markdown_bold_italic=false;
this.md_callback=vhighlight.Markdown.create_callback().bind(this);
this.md_derived_reset=vhighlight.Markdown.create_derived_reset().bind(this);
this.md_derived_retrieve_state=vhighlight.Markdown.create_derived_retrieve_state().bind(this);
this.html_callback=vhighlight.HTML.create_callback().bind(this);
this.html_derived_reset=vhighlight.HTML.create_derived_reset().bind(this);
this.html_derived_retrieve_state=vhighlight.HTML.create_derived_retrieve_state().bind(this);
this.callback=(char,a,b,c,d,is_escaped)=>{
if (
this.html_inside_opening_tag==null&&
this.html_inside_verbatim_tag==null&&
this.md_callback(char,a,b,c,d,is_escaped)
){
return true;
}
if (
this.md_inside_codeblock==null&&
this.html_callback(char)
){
return true;
}
if (char==="{"&&this.next_char==="{"){
let index=this.code.indexOf("}}", this.index+2);
if (index!==-1){
index+=1;
this.append_batch();
this.batch=this.code.substr(this.index,index-this.index);
this.append_batch("template")
this.resume_on_index(index-1);
return true;
}
}
return false;
}
}
derived_reset(){
this.md_derived_reset();
this.html_derived_reset();
}
derived_retrieve_state(data){
this.md_derived_retrieve_state(data);
this.html_derived_retrieve_state(data);
}
}
vhighlight.lmx=new vhighlight.LMX();
if (typeof module!=="undefined"&&typeof module.exports!=="undefined"){
vhighlight.web_exports={
"css":`${__dirname}/css/vhighlight.css`,
"js":`${__dirname}/vhighlight.js`,
}
vhighlight.version="1.2.3";
module.exports=vhighlight;
}
