# Weyland

Weyland provides an alternative way to write regular expression handling incomplete matching and  lexers using them.

Install with: ``pip install weyland``

## A. Syntax of regular expression

In Weyland, we call regular expression **rex** instead of *regex* to differenciate them.

### A.1 Sequence

``ab`` means a then b

### A.2 Choice

``[ab]`` means a or b

### A.3 Option and repetition

* ``a?b`` means b or ab (a is optionnal, it can appear between 0 and 1 time),
* ``a+b`` means ab, aab, aaab, aaaab, etc. (a is mandatory, it must appear betweean 1 and X times),
* ``a*b`` means b, ab, aab, aaab, aaaab, etc. (a is optionnal, it can appear between 0 and X times).

### A.4 Special chararacters

* ``#`` means any digits (0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
* ``@`` means any letters
* ``$`` means any digits, letters and the underscore character (_)
* ``.`` means any characters which is not a new line

### A.5 Limitations

* In a choice, **you can only choose between one element** not between sequences,
* In a choice, no repeated element nor optionnal element.
* You can only use terminals and special characters in rex definitions.

## B. Lexers

Weyland provides also several lexers using the incomplete matching feature of Weyland's rex.

### B.1 Languages available

A set of lexers and associated tokens are available for the following languages: 

* Data language: json,
* Programming languages: lua, python,
* Description languages: bnf, hamill.

## C. Websites

* Source code on Github: https://github.com/Xitog/weyland
* PyPI repository: https://pypi.org/project/weyland/
* Stats: https://libraries.io/pypi/weyland

