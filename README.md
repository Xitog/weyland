# Weyland

Weyland provides a way to define computing languages and a generic lexer to lex/tokenize/perform lexical analysis on them.

Install with: ``pip install weyland``

## A. Languages

Weyland offers the class **Language** to define the languages.

A language is initialized with:

* a **mandatory** dictionary { string : list } of token definitions, 
* a **optional** list of unwanted definitions in the language,
* a **optional** dictionary of tags to apply on tokens.

Token types are defined by a name and a list of matching patterns. A pattern is a standard Python regular expression.

Weyland comes with a list of predefined patterns stored in the dictionary PATTERNS for standard definitions like string, integer and float.

The unwanted definitions are a list of matched tokens which do not belong to the language. For example, 18A will be matched by the two tokens integer, identifier if we define only these two. By adding a token type wrong_integer corresponding to it, we will prevent this behavior but we must declare that is an error. We do that by putting wrong_integer in the list of unwanted definitions.

The last dictionary is a dictionary of tags to apply on lists of token types. It can help for syntax coloration for example.

Below is a short example:

```
LANGUAGES['ash'] = Language('ash',
                            {
                                'keyword'   : [ 'if', 'else', 'end', 'elif'],
                                'boolean'   : ['true', 'false'],
                                'nil'       : ['nil'],
                                'identifier': PATTERNS['IDENTIFIER'],
                                'number'    : ['\\d+', '\\d+\\.\\d+'],
                                'string'    : PATTERNS['STRINGS'],
                                'operator'  : ['\\+', '\\*', '-', '/', '%', '\\^'],
                                'separator' : ['\\(', '\\)', ','],
                                'comment'   : ['--(?!\\[\\[).*(\n|$)'],
                                'newline'   : PATTERNS['NEWLINES'],
                                'blank'     : PATTERNS['BLANKS'],
                                'wrong_int' : PATTERNS['WRONG_INTEGER'],
                            },
                            ['wrong_integer'],
                            {
                                'ante_identifier': ['function'],
                            }
                        )
```

Pattern with [\\\\s\\\\S] (anything including new line) are treated as multiline regex.

## B. Lexer

Weyland provides also a lexer class to perform lexical analysis on a text given a defined language.

A lexer is initialized with a language definition (an instance of the class Language) and a list of tokens to discard when lexing.

The function lex transform a given text to a list of tokens.

The algorithm is rather simple: 

* A word is initialized to an empty string
* The next char of the text is added to the word
* It tries to match all regex against the current word.
* If there is no match, it looks ahead of 1 char to try to do the matching
* If there is still no match, it looks at the previous iteration
  * If there is a token definition matching, it emits a token and empties the word
    * If there is more than one token definition matching, **the first defined in the language will be choosen**
  * If no, the lexing fails.

The lexer can emit a html representation of the tokens: each tokens is emitted in a span of class *language name - token type* except raws tokens which are emitted as their value.

The tokens are defined by:

* A type
* A value, the string which matches the pattern
* A starting index in the text

### B.1 Languages available

A set of lexers and associated languages are available in the package: 

* Data language: json,
* Programming languages: ash, lua, python,
* Description languages: bnf, hamill.

## C. Websites

List of websites about Weyland:

* Source code on Github: https://github.com/Xitog/weyland
* Project on PyPI: https://pypi.org/project/weyland/
* Documentation: see project description on Github or PyPI
* Stats: https://libraries.io/pypi/weyland
