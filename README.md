# Weyland

Weyland provides an alternative way to write regular expression (regex) and a lexer using them.

## Syntax of regular expression

In Weyland, we call regular expression **rex** instead of regex to differenciate them.

### Sequence

``ab`` means a then b

### Choice

``[ab]`` means a or b

### Option and repetition

* ``a?b`` means b or ab (a is optionnal, it can appear between 0 and 1 time),
* ``a+b`` means ab, aab, aaab, aaaab, etc. (a is mandatory, it must appear betweean 1 and X times),
* ``a*b`` means b, ab, aab, aaab, aaaab, etc. (a is optionnal, it can appear between 0 and X times).

### Special chararacters

* ``#`` means any digits
* ``@`` means any letters
* ``$`` means any digits, letters and the underscore character (_)
* ``.`` means any characters which is not a new line

### Limitations

* In a choice, **you can only choose between one element** not between sequences,
* In a choice, no repeated element nor optionnal element.

### Languages available

* A set of tokens is available for the languages: bnf, json, lua python and hamill.
