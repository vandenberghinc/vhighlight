#include <iostream>
#include <string>
#include <vector>
#include <functional>
#include <map>
#include <concepts>

// Check reversal of function call without inside func.
// myfunc(x);

// Function Declarations with post-modifiers
void constMemberFunction(int a) const;

// Function Declarations with post-modifiers
void constMemberFunction(int a) requires std::integral<X> {}

// Function Declarations with post-modifiers
void constMemberFunction(int a, int b = myfunc()) {}

template<typename T>
void templateFunction1(T value);

template<
    typename T,
    String S,
    String... SA,
>
void templateFunction2(T value);

template<
    String S,
    String... S
>
void templateFunction3(T value);

template<typename T, typename... TA>
void templateFunction4(T value);

template<String S, String... S>
void templateFunction4(T value);

template<typename T>
requires std::integral<T>
void templateFunctionWithRequires(T value);

// Class with member functions having post-modifiers
class MyClass {
public:
    void constMemberFunction(int a) const {
        String inside_func_1();
        inside_func_2();
        inside_func_3<X>();
    }

    void functionWithConstAndNoexcept(int a) const noexcept {
        // Implementation would go here
    }
};

if (x > 0) {

}

// C++20 Concept for the templateFunctionWithRequires
template<typename T>
concept Integral = std::is_integral_v<T>;

template<Integral T>
void templateFunctionWithRequires(T value) {
    std::cout << "Value is: " << value << std::endl;
}

// Function with multi-line parameters and post-modifiers
void multiLineParamsAndModifiers(
    const std::vector<int>& vec,
    const std::vector<int>* vec,
    const std::vector<int> vec,
    vector<int> vec,
    std::string& str,
    const String str,
    const String& str,
    const String* str,
    String str,
    String& str,
    String* str,
) const noexcept {
    // Function body omitted for brevity
}

// Member function in a class with C++20 'requires' clause
class ExampleWithRequires {
public:
    template<typename T>
    requires std::integral<T>
    void memberFunctionWithRequires(T param) {
        // Implementation would go here
    }
};

const String& str_func_1() {}
const std::String& str_func_2() {}


template <> requires (x == 0 && y == 2 && (x == 0 || x == 1)) constexpr static friend
const String& pre_requires_func_1() {}

const String& post_requires_func_1() requires (x == 0 && y == 2 && (x == 0 || x == 1)) constexpr static friend {}

// Demonstrating usage of 'requires' with a lambda expression
auto lambdaWithRequires = []<typename T>(T x) requires std::integral<T> {
    // Lambda body omitted
};

void mylib::mynamespace::myfunc();


