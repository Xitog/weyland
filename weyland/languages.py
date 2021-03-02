# -----------------------------------------------------------
# MIT Licence (Expat License Wording)
# -----------------------------------------------------------
# Copyright © 2020, Damien Gouteux
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#
# For more information about my projects see:
# https://xitog.github.io/dgx (in French)

"""This file provides languages definition"""

#-------------------------------------------------------------------------------
# Globals and constants
#-------------------------------------------------------------------------------

class Language:

    def __init__(self, name, tokens, specials = None):
        self.name = name
        self.tokens = tokens
        self.specials = specials if specials is not None else {}

    def __str__(self):
        return self.name

# text
# bnf
# hamill
# game
# ash, json, lua, python

LANGUAGES = {
    'text': Language('text', {
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
        # Special
        {
            'ante_identifier': [],
        }
    ),
    'bnf': Language('bnf', {
            'keyword': ['<[@#_- ]+>'],  # non-terminal
            'identifier': ['expansion', 'A', 'B', 'C', 'D', 'nom'], # expansion
            'operator': ['::=', '|', '\.\.\.', '=', '-', '\?', '\*', '\+', '\@', '\$', '_'],
            'separator': ['(', ')', '\[', ']', '{', '}', ',', ';'],
            'string' : ['"[@#_- <>:=,;|\']*"', "'[@#_- <>:=,;|\"]*'"], # terminal
            'blank': [' +'],
            'comment': ['\#[@#_- "\'\\\#\@\$,;:=\.-\+\*\? ]*\n'],
            'newline' : ['\n'],
        },
        {
        }
    ),
    'hamill' : Language('hamill', {
            'keyword': ['var', 'const', 'include', 'require', 'css', 'html'],
            'identifier' : ['[@_]$*'],
            'integer' : ['#+'],
            'boolean' : ['true', 'false'],
            'nil': [],
            'operator': [':'],
            'separator' : ['{', '}', '\#', '.'],
            'wrong_int' : ['#+$+'],
            'blank': [' +'],
            'newline' : ['\n'],
            'line_comment': ['§§'],
        },
        # Special
        {
            'ante_identifier': ['var', 'const'],
            'accept_unknown': True,
            'string_markers': [],
            'number' : True
        }
    ),
    'game': Language('game', {
            'number': ['#+'],
            'normal': ['[@_][@#\'-]*'], # Total Annihilation => 2 tokens, Baldur's => 1, Half-life => 1
            'blank': [' +'],
            'wrong_int' : ['#+@+'],
            'newline' : ['\n'],
            'operator': [':'] # FarCry: 
        },
        {
        }
    ),
    'ash': Language('ash', {
            'keyword' : ['if', 'then', 'else', 'end', 'while', 'do', 'for',
                 'break', 'next', 'return',
                 'var', 'fun', 'sub', 'get', 'set', 'class',
                 'import', 'from', 'as',
                 'try', 'catch', 'finally', 'raise'],
            'identifier' : ['[@_]$*'],
            # Old
            'AFFECTATION' : ['='],
            'COMBINED_AFFECTATION' : [r'\+=', '-=', r'\*=', '/=', '//=', r'\*\*=', '%='],
            'TYPE' : [':', '->'],
            'FAST' : ['=>'],
            'LABEL' : ['::'],
            'UNARY_OPERATOR' : ['-', 'not', r'\#', '~'],
            # New
            'integer' : [r'#+'],
            'boolean' : ['false', 'true'],
            'nil': ['nil'],
            'binary_operator' : ['and', 'or', # boolean
                  'in', # belongs to
                  r'\+', '-', r'\*', '/', '//', r'\*\*', '%', # mathematical
                  '&', '|', '~', '>>', '<<', # bitwise
                  '<', '<=', '>', '>=', '==', '!=', # comparison
                  '\.'], # call
            'separator': ['{', '}', '(', ')', r'\[', ']', ',', ';'],
            'wrong_int' : ['#+@+$+'],
            'blank': [' +'],
            'newline' : ['\n'],
            'line_comment': ['--'],
            'string' : ['"[@#_- <>:=,;|\']*"', "'[@#_- <>:=,;|\"]*'"],
        },
        # Special
        {
            'ante_identifier': ['def', 'class'],
        }
    ),
    'json': Language('json', {
            'identifier' : ['[@_]$*'],
            'number' : ['#+', '#+\.#+'],
            'boolean': ['true', 'false'],
            'string' : ['".*"', "'.*'"],
            'nil': [],
            'keyword': ['null'],
            'operator': [],
            'separator': ['{', '}', '(', ')', r'\[', ']', ',', ':', "\."],
            'line_comment' : [],
            'newline' : ['\n'],
            'blank': [' +'],
            'wrong_int' : ['#+@+$+'],
        },
        # Special
        {
            'ante_identifier': [],
        }
    ),
    'lua': Language('lua', {
            #'keyword': ['and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for',
            #            'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or',
            #            'repeat', 'return', 'then', 'true', 'until', 'while'],
            'keyword': ['and', 'break', 'do', 'else', 'elseif', 'end', 'for',
                        'function', 'goto', 'if', 'in', 'local', 'not', 'or',
                        'repeat', 'return', 'then', 'until', 'while'],
            'identifier' : ['[@_]$*'],
            'number' : ['#+', '#+\.#+'],
            'boolean': ['true', 'false'],
            'string' : ['".*"', "'.*'"],
            'nil' : ['nil'],
            'operator': ['=', '==', '~=', r'\+', r'\*', '-', '/', '%', '^',
                         '<', '<=', '>', '>=', r'\.\.', r'\#', ':'],
            'separator': ['{', '}', '(', ')', r'\[', ']', ',', ';'],
            'line_comment': ['--.+\n', '--.+'], # the second is for @@-- xxx@@ without \n
            'newline' : ['\n'],
            'blank': [' +'],
            'wrong_int' : ['#+@+$+'],
            'special': ['ipairs', 'pairs', '\?', 'print'], # ? is here for demonstration only
        },
        # Special
        {
            'ante_identifier': ['function'],
        }
    ),
    'python': Language('python', {
            'keyword' : ['await', 'else', 'import', 'pass', 'break', 'except', 'in',
                     'raise', 'class', 'finally', 'is', 'return', 'and', 'for',
                     'continue', 'lambda', 'try', 'as', 'def', 'from', 'while',
                     'nonlocal', 'assert', 'del', 'global', 'not', 'with', 'if',
                     'async', 'elif', 'or', 'yield'],
            'identifier' : ['[@_]$*'],
            'integer' : ['#+'],
            'boolean' : ['True', 'False'],
            'string' : ['".*"', "'.*'"],
            'nil': ['None'],
            'operator': [r'\+', '/', '//', '&', '^', '~', '|', r'\*\*', '<<', '%', r'\*',
                      '-', '>>', ':', '<', '<=', '==', '!=', '>=', '>', r'\+=',
                      '&=', '//=', '<<=', '%=', '\*=', '|=', r'\*\*=', '>>=', '-=',
                      '/=', '^=', '\.', '='],
            'separator': ['{', '}', '(', ')', r'\[', ']', ',', ';'],
            'line_comment': ['\#.+\n'],
            'newline' : ['\n'],
            'blank': [' +'],
            'wrong_int' : ['#+@+$+'],
            'special': ['print'],
        },
        # Special
        {
            'ante_identifier': ['def', 'class'],
        }
    ),
}

RECOGNIZED_LANGUAGES = list(LANGUAGES.keys())
