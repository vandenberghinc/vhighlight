#!/bin/bash

# This is a single-line comment

: <<'MULTILINE_COMMENT'
This is a multi-line comment.
You can add multiple lines here.
MULTILINE_COMMENT

a="Hello";

: <<'MULTILINE_COMMENT'
This is a multi-line comment.
You can add multiple lines here.
MULTILINE_COMMENT

a="Hello";

: << MULTILINE_COMMENT
This is a multi-line comment.
You can add multiple lines here.
MULTILINE_COMMENT

a="Hello";

: << '
This is a multi-line comment.
You can add multiple lines here.
'

a="Hello";

: '
This is a multi-line comment.
You can add multiple lines here.
'

a="Hello";

: "
This is a multi-line comment.
You can add multiple lines here.
"

x="
a
"

# Variables
name="John"
age=30

age=$1
age=$2
age=$999
age=$@
age=$#
age=$?

# Arithmetic operations
result=$((5 * 2 + 3))

# Echo statements
echo "Hello, $name! You are $age years old."

# Conditionals
if [ $age -lt 18 ]; then
    echo "You are under 18 years old."
elif [ $age -ge 18 ] && [ $age -lt 65 ]; then
    echo "You are an adult."
else
    echo "You are a senior."
fi

# Loops
for i in {1..5}; do
    echo "Iteration $i"
done

# Functions
myFunction() {
    local localVar="Local variable"
    echo "Function called with argument: $1"
    echo "$localVar"
}
myFunction(    )
    {
    local localVar="Local variable"
    echo "Function called with argument: $1"
    echo "$localVar"
}
function myFunction() {
    local localVar="Local variable"
    echo "Function called with argument: $1"
    echo "$localVar"
}

myFunction "Argument"

# Command substitution
currentDir=$(pwd)
echo "Current directory: $currentDir"

# String operators
string1="Hello"
string2="World"
concatenated="$string1 $string2"
echo "$concatenated"

# File test operators
if [ -f "/etc/passwd" ]; then
    echo "File '/etc/passwd' exists and is a regular file."
fi

# Special variables
scriptName="$0"
firstArgument="$1"
exitStatus="$?"

echo "Script name: $scriptName"
echo "First argument: $firstArgument"
echo "Exit status: $exitStatus"


if
then
else
elif
fi
case
esac
while
do
done
for
select
until
function
in
return
continue
break
shift
eval
exec
set
unset
readonly
declare
local
export
typeset
trap
true
false
test
