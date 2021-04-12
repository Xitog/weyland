# Weyland

Weyland provides an alternative way to write regular expression handling incomplete matching and lexers using them.

Install with: ``pip install weyland``

## A. Syntax of regular expression

In Weyland, we call regular expression **rex** instead of *regex* to differenciate them.

This is a short definition of the language used to define them.

### A.1 Sequence

``ab`` a then b

### A.2 Classes

A class is a group of characters represented by a single special character.

* ``#`` any digits (0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
* ``@`` any letters
* ``&`` any digits, letters and the underscore character (_)
* ``.`` any characters which is not a new line

### A.3 Positions

A position can be also represented by a single special character.

* ``^`` start of string or line
* ``$`` end of string or line

### A.4 Choices

``[ab]`` a or b

### A.5 Optionality and repetition

Optionality and repetition of a character, a class or a choice can be represented by a single special character.

* ``a?b`` b or ab (a is optionnal, it can appear between 0 and 1 time),
* ``a+b`` ab, aab, aaab, aaaab, etc. (a is mandatory, it must appear betweean 1 and X times),
* ``a*b`` b, ab, aab, aaab, aaaab, etc. (a is optionnal, it can appear between 0 and X times).

Optionality and repetition can't be used for positions.

### A.6 Escaping special characters

In order to use a special characters as a normal character in a rex, you must escape them by putting the (\) character before it.

There are 12 escapable characters: #, @, &, ., ^, $, [, ], ?, +, *, \.

### A.7 Limitations

* In a choice, **you can only choose between one element** not between sequences,
* In a choice, **no repeated element nor optionnal element**.
* You can only use terminals and special characters in rex definitions.
* You can't define groups in rex definitions.

## B. Lexers

Weyland provides also several lexers using the incomplete matching feature of Weyland's rex.

### B.1 Languages available

A set of lexers and associated tokens are available for the following languages: 

* Data language: json,
* Programming languages: lua, python,
* Description languages: bnf, hamill.

## C. Websites

List of websites about Weyland:

* Source code on Github: https://github.com/Xitog/weyland
* Project on PyPI: https://pypi.org/project/weyland/
* Documentation: see project description on Github or PyPI
* Stats: https://libraries.io/pypi/weyland

