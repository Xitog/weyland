// -----------------------------------------------------------
// MIT Licence (Expat License Wording)
// -----------------------------------------------------------
// Copyright © 2020, Damien Gouteux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// For more information about my projects see:
// https://xitog.github.io/dgx (in French)

// This file provides languages definition

//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

class Language
{
    constructor(name, tokens, specials=null)
    {
        this.name = name;
        if (typeof tokens !== 'object')
        {
            throw new Error("Tokens should be an object and it is a " + typeof tokens);
        }
        this.tokens = tokens;
        this.specials = specials !== null ? specials : {};
    }

    size()
    {
        return Object.keys(this.tokens).length;
    }

    toString()
    {
        return this.name;
    }
}

//-------------------------------------------------------------------------------
// Globals and constants
//-------------------------------------------------------------------------------

// Shared definitions
var IDENTIFIER   = ['[@_]&*'];
var WRONG_INT    = ['[123456789]#*@&*', '0[aAbCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWyYzZ]#*@&*', '00#*@&*'];
var INTEGER      = ['#+'];
var INTEGER_HEXA = ['0[xX][#ABCDEFabcdef]+'];
var INTEGER_SEP  = ['#+[#_]*#+'];
var INTEGER_BIN  = ['0[bB][01]+'];
var FLOAT        = ['#+\\.#+', '#+[eE]-?#+', '#+\\.#+[eE]-?#+'];
var STRING       = ['"[^"]*"', "'[^']*'"]; // pb : can't escape \" and \'
var BLANKS       = ['[\t ]+'];
var NEWLINES     = ['\n', '\r\n', '\n\r'];

// Languages
//   text
//   bnf
//   hamill
//   game
//   ash, json, lua, python

var LANGUAGES = {
    // Un langage qui divise simplement en lignes
    'line': new Language('line', {
            'line': ['.*\n', '.*$']
        }
    ),
    'fr': new Language('fr', {
            'word': ['@+'],
            'punct': [',', '\\.', ':', ';', '-', '(', ')', '!', '\?'],
            'blank': [' ', '\n', '\t']
        }
    ),
    'text': new Language('text', {
            'normal': ['.*'],
            'identifier': [],
            'integer': [],
            'boolean': [],
            'nil': [],
            'keyword': [],
            'operator': [],
            'separator': [],
            'wrong_int': [],
            'blank': [' +'],
            'newline' : ['\n'],
            'line_comment' : [],
        },
        // Special
        {
            'ante_identifier': [],
        }
    ),
    'bnf': new Language('bnf', {
            'keyword': ['<[@#_- ]+>'],  // non-terminal
            'identifier': ['expansion', 'A', 'B', 'C', 'D', 'nom'], // expansion
            'operator': ['::=', '|', '\\.\\.\\.', '=', '-', '\\?', '\\*', '\\+', '\\@', '\\$', '_'],
            'separator': ['(', ')', '\\[', ']', '{', '}', ',', ';'],
            'string' : ['"[@#_- <>:=,;|\']*"', "'[@#_- <>:=,;|\"]*'"], // terminal
            'blank': [' +'],
            'comment': ['\\#[@#_- "\'\\\\#\\@\\$,;:=\\.-\\+\\*\\? ]*\n'],
            'newline' : ['\n'],
        },
        {
        }
    ),
    'bnf-mini': new Language('bnf-mini', {
            'keyword': ['<[@#_- ]+>'],   // non-terminal
            'string' : ['".*"', "'.*'"], // terminal
            'operator': ['::=', '|'],    // affect and choice
            'blank': [' +'],
            'newline' : ['\n'],
            'comment': ['\\#.*'],
        },
        {}
    ),
    'hamill' : new Language('hamill', {
            'keyword': ['var', 'const', 'include', 'require', 'css', 'html'],
            'identifier' : IDENTIFIER,
            'integer' : ['#+'],
            'boolean' : ['true', 'false'],
            'nil': [],
            'operator': [':'],
            'separator' : ['{', '}', '\\#', '.'],
            'wrong_int' : WRONG_INT,
            'blank': [' +'],
            'newline' : ['\n'],
            'line_comment': ['§§'],
        },
        // Special
        {
            'ante_identifier': ['var', 'const'],
            'accept_unknown': true,
            'string_markers': [],
            'number' : true
        }
    ),
    'game': new Language('game', {
            'number': ['#+'],
            'normal': ['[@_][@#\'-]*'], // Total Annihilation => 2 tokens, Baldur's => 1, Half-life => 1
            'blank': [' +'],
            'wrong_int' : WRONG_INT,
            'newline' : ['\n'],
            'operator': [':'] // FarCry:
        },
        // Special
        {
        }
    ),
    'ash': new Language('ash', {
            'keyword' : ['if', 'then', 'elif', 'else', 'end',
                 'while', 'do', 'for',
                 'break', 'next', 'return',
                 'var', 'fun', 'sub', 'get', 'set', 'class',
                 'import', 'from', 'as',
                 'try', 'catch', 'finally', 'raise', 'const'],
            'identifier' : IDENTIFIER,
            // Old
            'affectation' : ['='],
            'combined_affectation' : ['\\+=', '-=', '\\*=', '/=', '//=', '\\*\\*=', '%='],
            'type' : [':', '->'],
            'fast' : ['=>'],
            'label' : ['::'],
            // 'unary_operator' : ['-', 'not', r'\#', '~'],
            // New
            'integer' : ['#+'] + INTEGER_BIN + INTEGER_HEXA,
            'number' : FLOAT,
            'boolean' : ['false', 'true'],
            'nil': ['nil'],
            // 'binary_operator' : ['and', 'or', # boolean
            'operator' : ['-', 'not', '\\#', '~', 'and', 'or', // boolean
                  'in', // belongs to
                  '\\+', '-', '\\*', '/', '//', '\\*\\*', '%', // mathematical
                  '\\&', '|', '~', '>>', '<<', // bitwise
                  '<', '<=', '>', '>=', '==', '!=', // comparison
                  '\\.'], // call
            'separator': ['{', '}', '(', ')', '\\[', ']', ',', ';'],
            'wrong_int' : WRONG_INT,
            'blank': [' +'],
            'newline' : ['\n'],
            'line_comment': ['--.*\n', '--.*$'],
            'string' : STRING,
        },
        // Special
        {
            'ante_identifier': ['var', 'const', 'function', 'procedure', 'fun', 'pro', 'class', 'module'],
        }
    ),
    'json': new Language('json', {
            'identifier' : IDENTIFIER,
            'number' : ['#+', '#+\\.#+'],
            'boolean': ['true', 'false'],
            'string' : ['".*"', "'.*'"],
            'nil': [],
            'keyword': ['null'],
            'operator': [],
            'separator': ['{', '}', '(', ')', '\\[', ']', ',', ':', "\\."],
            'line_comment' : [],
            'newline' : ['\n'],
            'blank': [' +'],
            'wrong_int' : WRONG_INT,
        },
        // Special
        {
            'ante_identifier': [],
        }
    ),
    'lua': new Language('lua', {
            'keyword': ['and', 'break', 'do', 'else', 'elseif', 'end', 'for',
                        'function', 'goto', 'if', 'in', 'local', 'not', 'or',
                        'repeat', 'return', 'then', 'until', 'while'],
            'special': ['ipairs', 'pairs', '\\?', 'print'], // ? is here for demonstration only */
            'identifier' : IDENTIFIER,
            'number' : ['#+', '#+\.#+'],
            'boolean': ['true', 'false'],
            'string' : ['".*"', "'.*'"],
            'nil' : ['nil'],
            'operator': ['=', '==', '~=', '\\+', '\\*', '-', '/', '%', '\\^',
                         '<', '<=', '>', '>=', '\\.\\.', '\\#', ':'],
            'separator': ['{', '}', '\\(', '\\)', '\\[', '\\]', ',', ';'],
            'line_comment': ['--.*\n', '--.*$'],
            'newline' : NEWLINES,
            'blank': BLANKS,
            'wrong_int' : WRONG_INT,
        },
        // Special
        {
            'ante_identifier': ['function'],
        }
    ),
    'python': new Language('python', {
            'keyword' : ['await', 'else', 'import', 'pass', 'break', 'except', 'in',
                     'raise', 'class', 'finally', 'is', 'return', 'and', 'for',
                     'continue', 'lambda', 'try', 'as', 'def', 'from', 'while',
                     'nonlocal', 'assert', 'del', 'global', 'not', 'with', 'if',
                     'async', 'elif', 'or', 'yield'],
            'identifier' : IDENTIFIER,
            'integer' : INTEGER + INTEGER_HEXA + INTEGER_BIN,
            'float' : FLOAT,
            'boolean' : ['True', 'False'],
            'string' : ['".*"', "'.*'"],
            'nil': ['None'],
            'operator': ['\\+', '/', '//', '\\&', '\\^', '~', '|', '\\*\\*', '<<', '%', '\\*',
                      '-', '>>', ':', '<', '<=', '==', '!=', '>=', '>', '\\+=',
                      '\\&=', '//=', '<<=', '%=', '\*=', '|=', '\\*\\*=', '>>=', '-=',
                      '/=', '\\^=', '\\.', '='],
            'separator': ['{', '}', '(', ')', '\\[', ']', ',', ';'],
            'line_comment': ['\\#.*\\n', '\\#.*$'],
            'newline' : ['\n'],
            'blank': [' +'],
            'wrong_int' : WRONG_INT,
            'special': ['print'],
        },
        // Special
        {
            'ante_identifier': ['def', 'class'],
        }
    ),
}

var RECOGNIZED_LANGUAGES = Object.keys(LANGUAGES);

export {Language, LANGUAGES, RECOGNIZED_LANGUAGES, INTEGER, IDENTIFIER, BLANKS};
