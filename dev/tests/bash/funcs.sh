#!/bin/bash

# Basic function declaration with the function keyword
function basicFunction {
    echo "This is a basic function"
}

# Function declaration without the function keyword, using parentheses
alternateFunction() {
    echo "This is an alternate form of function declaration"
}

# Function with parameters (accessed via $1, $2, etc.)
paramFunction() {
    echo "Function called with parameter: $1"
}

# Function that returns a value via 'return' statement (numeric only)
returnFunction() {
    local value=10
    return $value
}

# Function that echoes something, capturing output instead of using return
echoFunction() {
    echo "Echo function returns this string"
}

# Multiline argument list and command grouping with { }
multilineFunction() {
    echo "This is a function"
    echo "with commands spread over"
    echo "multiple lines."
}

# Function using local variables
localVarFunction() {
    local localVar="I am local to this function."
    echo $localVar
}

# Demonstrate function calls
basicFunction
alternateFunction
paramFunction "TestParam"
returnFunction
returnValue=$?
echo "Return function returned: $returnValue"
result=$(echoFunction)
echo "Echo function output: $result"
multilineFunction
localVarFunction

# Function with conditional logic
conditionalFunction() {
    if [ $1 -gt 100 ]; then
        echo "$1 is greater than 100"
    else
        echo "$1 is not greater than 100"
    fi
}

conditionalFunction 150
conditionalFunction 50

# Note: Bash functions cannot return string values directly with 'return'
# Use 'echo' for string output and command substitution to capture it.
