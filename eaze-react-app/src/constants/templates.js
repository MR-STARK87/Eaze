export const TEMPLATE_PROGRAMS = [
    {
        id: 'welcome-say',
        icon: '👋',
        title: 'Welcome Message',
        desc: 'Your first program: show a friendly message on the screen.',
        tags: ['say'],
        fileBase: 'welcome',
        code:
`# Welcome to Eaze!

say "Welcome to Eaze!"
say "You can change this message 🙂"`
    },
    {
        id: 'greeter-ask',
        icon: '🗣️',
        title: 'Ask My Name (Greeter)',
        desc: 'Ask the user a question and greet them using a variable.',
        tags: ['ask', 'set', 'show'],
        fileBase: 'greeter',
        code:
`# Ask the user for their name
ask "What is your name?" into user_name

show "Welcome, " + user_name
show "Nice to meet you!"`
    },
    {
        id: 'counter-repeat',
        icon: '🔁',
        title: 'Counting with repeat',
        desc: 'Count from 1 to 5 using a repeat loop.',
        tags: ['set', 'repeat', 'show'],
        fileBase: 'counter',
        code:
`# Count up using repeat
set i to 1

repeat 5 times
    show i
    set i to i + 1
end

show "Done counting!"`
    },
    {
        id: 'countdown-while',
        icon: '⏳',
        title: 'Countdown with while',
        desc: 'Count down to 0 using a while loop.',
        tags: ['set', 'while', 'show'],
        fileBase: 'countdown',
        code:
`# Count down using while
set n to 5

while n >= 0
    show n
    set n to n - 1
end

show "Blast off!"`
    },
    {
        id: 'age-check-if',
        icon: '🤔',
        title: 'Age Checker (if / else)',
        desc: 'Use if/else to make a decision based on age.',
        tags: ['ask', 'if', 'else', 'show'],
        fileBase: 'age-checker',
        code:
`# Ask for age and decide
ask "How old are you?" into age

if age >= 18
    show "You are an adult."
else
    show "You are not an adult yet."
end`
    },
    {
        id: 'math-two-numbers',
        icon: '🧮',
        title: 'Add Two Numbers',
        desc: 'Ask for two numbers and show the answer.',
        tags: ['ask', 'show', '+'],
        fileBase: 'add-two-numbers',
        code:
`# Add two numbers
ask "First number?" into a
ask "Second number?" into b

show "a + b ="
show a + b`
    },
    {
        id: 'calculator-basic',
        icon: '➕',
        title: 'Mini Calculator',
        desc: 'Show +, -, ×, and ÷ (with a safe divide-by-zero check).',
        tags: ['ask', 'if', 'show'],
        fileBase: 'calculator',
        code:
`# Mini calculator
ask "Number A?" into a
ask "Number B?" into b

show "A + B ="
show a + b

show "A - B ="
show a - b

show "A * B ="
show a * b

if b == 0
    show "A / B = (cannot divide by 0)"
else
    show "A / B ="
    show a / b
end`
    },
    {
        id: 'lists-arrays',
        icon: '📦',
        title: 'Lists (Arrays) Basics',
        desc: 'Make a list, read an item, and change an item.',
        tags: ['set', 'arrays', 'index', 'show'],
        fileBase: 'lists',
        code:
`# Lists (arrays) are ordered values
set fruits to ["Apple", "Banana", "Cherry"]

show "First fruit:"
show fruits[0]

# Change the second fruit (index 1)
set fruits[1] to "Blueberry"

show "All fruits:"
show fruits`
    },
    {
        id: 'running-total',
        icon: '🎯',
        title: 'Running Total',
        desc: 'Add numbers together over and over in a loop.',
        tags: ['set', 'repeat', 'ask', 'show'],
        fileBase: 'running-total',
        code:
`# Add up 3 numbers
set total to 0

repeat 3 times
    ask "Give me a number" into x
    set total to total + x
end

show "Total is:"
show total`
    },
    {
        id: 'guess-game',
        icon: '🎲',
        title: 'Guess the Secret Number',
        desc: 'A simple game using while + if. (The secret is hardcoded.)',
        tags: ['set', 'while', 'ask', 'if', 'show'],
        fileBase: 'guess-game',
        code:
`# Guessing game (no random yet)
set secret to 7
set guess to -1

show "I am thinking of a number from 1 to 10."

while guess != secret
    ask "Your guess?" into guess

    if guess < secret
        show "Too small!"
    else
        if guess > secret
            show "Too big!"
        else
            show "Correct!"
        end
    end
end`
    },
    {
        id: 'password-lock',
        icon: '🔒',
        title: 'Password Lock',
        desc: 'Keep asking until the user types the correct password.',
        tags: ['set', 'while', 'ask', 'show', 'not'],
        fileBase: 'password-lock',
        code:
`# Keep asking until correct
set password to "eaze"
set attempt to ""

while attempt != password
    ask "Password?" into attempt
end

show "Unlocked!"`
    },
    {
        id: 'choose-adventure',
        icon: '🧭',
        title: 'Choose Your Own Adventure',
        desc: 'A tiny story that changes based on your choice.',
        tags: ['ask', 'if', 'else', 'show'],
        fileBase: 'adventure',
        code:
`# Choose a path
ask "Choose: left or right?" into path

if path == "left"
    show "You find a treasure chest!"
else
    show "You meet a friendly dragon."
end`
    },
    {
        id: 'functions-square',
        icon: '🧩',
        title: 'Functions: square()',
        desc: 'Define a function, return a value, and call it.',
        tags: ['define', 'return', 'call', 'set', 'show'],
        fileBase: 'square-function',
        code:
`# Functions are reusable blocks
define square(n)
    return n * n
end

ask "Number to square?" into n
set result to call square(n)

show "Square is:"
show result`
    },
    {
        id: 'logic-demo',
        icon: '🧠',
        title: 'Logic: and / or / not',
        desc: 'See how logic works with true (1) and false (0).',
        tags: ['set', 'and', 'or', 'not', 'show'],
        fileBase: 'logic',
        code:
`# 1 means true, 0 means false
set a to 1
set b to 0

show "a is:"
show a
show "b is:"
show b

show "not a is:"
show not a

show "a and b is:"
show a and b

show "a or b is:"
show a or b`
    }
];
