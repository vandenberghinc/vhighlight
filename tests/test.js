// Single-line comment
/*
    Multi-line
    comment
*/

class Me extends Person {
  constructor(name, age) {
    super(name, age);
  }  
  sayHello() {
    console.log(`Howdy!`);
    console.log('Howdy! {');
    console.log(`Hello, my name is ${this.name}`);
  }
}

class Me extends Person {
  constructor(name, age) {
    super(name, age);
  }  
  // {
  sayHello() {
    console.log(`Howdy!`);
    console.log('Howdy! {');
    console.log(`Hello, my name is ${this.name}`);
  }
}

class Me extends Person {
  constructor(name, age) {
    super(name, age);
  }  
  // }
  sayHello() {
    console.log(`Howdy!`);
    console.log('Howdy! {');
    console.log(`Hello, my name is ${this.name}`);
  }
}

// Variables
var x = 5;
let y = 10;
const z = 15;

// Data types
let str = "Hello, world!";
let num = 42;
let bool = true;
let arr = [1, 2, 3];
let obj = { name: "John", age: 30 };

// Functions
function add(a, b) {
    return a + b;
}

const multiply = (a, b) => a * b;

let x = 'I am a string';
let x = "I am a string";
let x = `I am a string`;
let x = `I am a string ${b} some more`;
let x = `
  I am a string
  OKay!
`;
let x = `
  I am a string
  OKay ${b}!
`;

ifme();

// Control flow
if(x > 0) {
}
if (x > 0) {
    console.log("x is positive");
} else if (x < 0) {
    console.log("x is negative");
} else {
    console.log("x is zero");
}

for (let i = 0; i < 5; i++) {
    console.log(i);
}

let i = 0;
while (i < 5) {
    console.log(i);
    i++;
}

// Objects and classes
function Person() {
    this.name = name;
    this.age = age;
}
function Person(name, age) {
    this.name = name;
    this.age = age;
}
function Person(
  name, 
  age
) {
    this.name = name;
    this.age = age;
}

// Objects and classes
class Person {
    constructor(name, age) {
      this.name = name;
      this.age = age;
    }
    hello(
      name, 
      age,
      width = 10,
      width = "10",
      width = null,
    ) {
      this.name = name;
      this.age = age;
    }
    hello(
      name, 
      age,
      width = 10,
      width = "10",
      width = me(),
    ) {
      this.name = name;
      this.age = age;
      function (foi,foi) {

      }
      function(foi,foi) {
        
      }
      ((foi,foi)=>{

      });
      ((foi,foi)=>{

      });
    }
}

console.log(`Hello, my name is ) OI`);

Person.prototype.sayHello = function(hello, world) {
  console.log(`Hello, my name is ${this.name}`);
  console.log(`Hello, my name is ) OI`);
};

Person.prototype.sayHello = (hello, world) => {
  console.log(`Hello, my name is ${this.name}`);
  console.log(`Hello, my name is ) OI`);
};

class Me extends Person {
  constructor(name, age) {
    super(name, age);
  }
  constructor(name, age) {
    super(name, age);
  }
      constructor(name, age) {
        super(name, age);
    }
  constructor(name, age) {
    super(name, age);
  }
  
    sayHello() {
        console.log(`Howdy!`);
    }
  sayHello() {
    console.log(`Howdy!`);
  }
  sayHello () {
    console.log(`Howdy!`);
  }
  sayHello (arg) {
    console.log(`Howdy!`);
  }

  static sayHello() {
      console.log(`Hello, my name is ${this.name}`);
  }
}
class Me extends Person {
  constructor(name, age) {
    super(name, age);
  }
  
  sayHello() {
    console.log(`Hello, my name is ${this.name}`);
  }
}

class Me extends Person {
  constructor(name, age) {
    super(name, age);
  }  
  sayHello() {
    console.log(`Howdy!`);
    console.log('Howdy! {');
    console.log(`Hello, my name is ${this.name}`);
  }
}
class Me extends Person {
  constructor(name, age) {
    super(name, age);
  }  
  sayHello () {
    console.log(`Howdy!`);
    console.log(`Hello, my name is ${this.name}`);
  }
}
class Me extends Person {
  constructor(name, age) {
    super(name, age);
  }  
  sayHello (arg) {
    console.log(`Howdy!`);
    console.log(`Hello, my name is ${this.name}`);
  }
}

const john = new Person("John", 30);
john.sayHello();

(foiME, foiME) => {
  console.log('OI!');
};

// Promises
const fetchData = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve("Data fetched successfully!");
        }, 2000);
    });
};

fetchData ()

fetchData()
    .then(function (data) {
        console.log(data);
    })
    .catch(function (error) {
        console.error(error);
    });

fetchData()
    .then((data) => {
        console.log(data);
    })
    .catch((error) => {
        console.error(error);
    });

// Regular expressions
const regex = /[a-z]+/;
const matches = str.match(regex);
console.log(matches);

// Modules
// import { square } from './math.js';
// console.log(square(5));

// Template literals
const name = "Alice";
const message = `Hello, ${name}!`;

console.log(message);
