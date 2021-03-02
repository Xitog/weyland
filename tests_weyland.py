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
#
# Summary
#     Import
#     Function
#        test_regex
#        display
#     Tests of Regex
#     Tests of Lexer

#-------------------------------------------------------------------------------
# Import
#-------------------------------------------------------------------------------

from weyland import Rex, RexTest, AwaitedResult, Console, Check
from weyland import Lexer, LANGUAGES, Language, __version__
from collections import namedtuple
from datetime import datetime

#-------------------------------------------------------------------------------
# Constants and globals
#-------------------------------------------------------------------------------

TEST_REGEX = True
TEST_LEXER = True

Total = 0
Good = 0
Bad = 0

#-------------------------------------------------------------------------------
# Types
#-------------------------------------------------------------------------------

TestLexer = namedtuple('Test', ['text', 'language', 'nb'])

#-------------------------------------------------------------------------------
# Function
#-------------------------------------------------------------------------------

def reg(r):
    global Total, Good, Bad
    Total += 1
    if r:
        Good += 1
    else:
        Bad += 1

def test_regex(debug=False):
    global Total, Good, Bad
    console = Console()
    previous = None
    for test_index in tests:
        t = test_library[test_index]
        if previous != t.regex:
            print('-----------------------')
            regex = None
            msg = None
            try:
                regex = Rex(t.regex, debug)
            except Exception as e:
                msg = e
            end = '\n' if debug else ''
            if t.length is None:
                if regex is None:
                    console.write(f'= Building of {t.regex} failed as expected: {msg}', color='STRING')
                else:
                    console.write(f"= Building of {t.regex} didn't fail as expected", color='COMMENT')
                continue
            elif regex is None:
                print(msg)
                raise Exception("No regex!")
            elif len(regex) != t.length:
                console.write(f'= Building {regex} expected ({t.length}) -> KO{end}', color='COMMENT')
                continue
            console.write(f'= Building {regex} expected ({t.length}) -> OK{end}', color='KEYWORD')
            if debug:
                regex.info(starter='    ')
        console.write(f'{end}= {test_index:5d} Matching |{t.candidate}| vs {regex}{end}', color='KEYWORD')
        res = regex.match(t.candidate)
        Total += 1
        if t.expected.check(res):
           res_str = 'OK   '
           color = 'STRING'
           Good += 1
        else:
            res_str = 'ERROR'
            color = 'COMMENT'
            Bad += 1
        console.write(f'   {res_str} expected {t.expected} and found {res}', color)
        previous = t.regex

def display(tokens):
   print(f'Tokens: {len(tokens)}')
   for i, t in enumerate(tokens):
        print(f'    {i:5d}. {t.typ:10s} ({t.first:3d},{t.last:3d}) |{t.val:s}|')

#-------------------------------------------------------------------------------
# Tests of Regex
#-------------------------------------------------------------------------------

test_library = {

      1: RexTest("'.*'", 3, "'Je suis un zorba'", Check("'Je suis un zorba'")),
    
    100: RexTest("abc", 3, "zor", Check('', 'zor')),
    101: RexTest("abc", 3, "ab", Check('ab')),
    102: RexTest("abc", 3, "abc", Check('abc')),
    103: RexTest("abc", 3, "abcd", Check('abc', 'd')),

    110: RexTest("@", 1, "5", Check()),
    111: RexTest("@", 1, "a", Check('a')),
    112: RexTest("@", 1, "ab", Check('a', 'b')),

    150: RexTest("a@+", 2, "a5", Check()),
    151: RexTest("a@+", 2, "a", Check('a', '...')), # partial match
    152: RexTest("a@+", 2, "ab", Check('ab')),
    153: RexTest("a@+", 2, "abc", Check('abc')),

    154: RexTest("a@*", 2, "a5", Check('a', '5')),
    155: RexTest("a@*", 2, "a", Check('a')),
    156: RexTest("a@*", 2, "ab", Check('ab')),
    157: RexTest("a@*", 2, "abc", Check('abc')),

    200: RexTest("#", 1, "a", Check()),
    201: RexTest("#", 1, "1", Check('1')),
    202: RexTest("#", 1, "15", Check('1', '5')),

    220: RexTest("##", 2, "aa", Check()),
    221: RexTest("##", 2, "a5", Check()),
    222: RexTest("##", 2, "1", Check('1', '...')),
    223: RexTest("##", 2, "1a", Check('', '1a')),
    224: RexTest("##", 2, "15", Check('15')),
    225: RexTest("##", 2, "158", Check('15', '8')),
    
    230: RexTest("##?", 2, "a", Check()),
    231: RexTest("##?", 2, "1", Check('1')),
    232: RexTest("##?", 2, "15", Check('15')),
    233: RexTest("##?", 2, "158", Check('15', '8')),

    240: RexTest("##+", 2, "a", Check()),
    241: RexTest("##+", 2, "ab", Check()),
    242: RexTest("##+", 2, "1", Check('1', '...')),
    243: RexTest("##+", 2, "1a", Check('', '1a')), # ce n'est pas bon, ni partial !
    244: RexTest("##+", 2, "15", Check('15')),
    245: RexTest("##+", 2, "158", Check('158')),

    500: RexTest("a\?", 2, "b", Check()),
    501: RexTest("a\?", 2, "a", Check('a', '...')),
    502: RexTest("a\?", 2, "a?", Check('a?')),
    503: RexTest("a\?", 2, "ab", Check('', 'ab')),
    504: RexTest("a\?", 2, "a?b", Check('a?', 'b')),

    510: RexTest("a\\\\", 2, "b", Check()),
    511: RexTest("a\\\\", 2, "a", Check('a', '...')),
    512: RexTest("a\\\\", 2, "a\\", Check('a\\')),
    513: RexTest("a\\\\", 2, "ab", Check('', 'ab')),
    514: RexTest("a\\\\", 2, "a\\b", Check('a\\', 'b')),

    1000: RexTest("[ab]", 1, "c", Check()),
    1001: RexTest("[ab]", 1, "a", Check('a')),
    1002: RexTest("[ab]", 1, "b", Check('b')),
    1003: RexTest("[ab]", 1, "ac", Check('a', 'c')),
    1004: RexTest("[ab]c", 2, "ab", Check('', 'ab')),
    1005: RexTest("[ab]c", 2, "ac", Check('ac')),
    
    5000: RexTest(r"[@_]$*[\?!]?", 3, "_a15", Check('_a15')),
    5001: RexTest(r"[@_]$*[\?!]?", 3, "4a", Check()),
    5002: RexTest(r"[@_]$*[\?!]?", 3, "_isalpha?", Check('_isalpha?')),

    9000: RexTest("#?#", None, None, None),
    9001: RexTest("#?1", None, None, None),

    10000: RexTest(".", 1, " ", Check(' ')),
    10001: RexTest(".", 1, "a", Check('a')),
    10002: RexTest(".", 1, "5", Check('5')),
    10003: RexTest(".", 1, ">", Check('>')),
    
    #100: Test(r"[@_]\w*", 2, 1, "_a15", COMPLETE),
    #327: Test(r"\d\d?\d", 3, 2, "123", COMPLETE), # pb

} # [327]

start = datetime.now()

if TEST_REGEX:
    tests = test_library.keys() # [223]
    test_regex(False)

    # Independant test (uncounted)
    rex = Rex('aaa')
    res = rex.match('aaa')
    Console().write(res, 'STRING')

#-------------------------------------------------------------------------------
# Tests of Lexer
#-------------------------------------------------------------------------------

simple_one = Language('simple_one', {
                'A': ['aaa'],
                'B': ['bbb'],
                'SPACE': [' '],
            })

test_one = Language('test_one', {
                'KEYWORD' : ['bonjour', 'bon'],
                'IDENTIFIER' : ['[@_]$*'],
                'SPECIFIC_INTEGER' : ['08789'],
                'ALL_INTEGER' : ['#+'],
                'OPERATOR' : ['\+', '\+='],
                'NEWLINE' : ['\n'],
                'WRONGINT' : ['#+@+$+'],
                'SPACE': [' '],
            })

tests = [
    TestLexer(text = '1.2', language = LANGUAGES['json'], nb = 1),
    TestLexer(text = 'aaa bbb', language = simple_one, nb = 3),
    TestLexer(text = '08789 bonjour', language = test_one, nb = 3),
    TestLexer(text = '2 22 abc 2a2 a+b', language = test_one, nb = 11),
    TestLexer(text = 'bonjour 08789 b2974 0b01111 breaka break', language = LANGUAGES['ash'], nb = 11),
    TestLexer(text = 'bonjour bon bonjour 08789 22 abc + += a+b \n c _d 2a2 #a', language = LANGUAGES['ash'], nb = 30)
]
for tst in tests:
    print('------------------------------')
    print(f'{tst.text} with lang={tst.language}')
    lexer = Lexer(tst.language, debug=False)
    tokens = lexer.lex(tst.text)
    print()
    print(f'{tst.text} => {tokens} ({len(tokens)})')
    for i, t in enumerate(tokens):
        print('   ', i, t.typ, t.val)
    Total += 1
    if len(tokens) != tst.nb:
        print(f'ERROR: Wrong number of tokens: {len(tokens)}, expected: {tst.nb}')
        Bad += 1
    else:
        Good += 1
        print(f'OK')

#-------------------------------------------------------------------------------
# Breaking it: we must trace ALL the completes before (complete + overload)
#-------------------------------------------------------------------------------

funk = Language('funk', {
            'aaab': ['aaab'],
            'aa': ['aa'],
            'ac': ['ac'],
      })
lex = Lexer(funk, debug=True)
lex.info()
reg(lex.check("aaac",
          ['aa', 'ac'],
          ['aa', 'ac']))

#-------------------------------------------------------------------------------
# Tests for the Ash language
#-------------------------------------------------------------------------------

print('\nTest lexer')
lex = Lexer(LANGUAGES['ash'], discards=['blank'], debug=True)
reg(lex.check('if A then 5 end',
          ['keyword', 'identifier', 'keyword', 'integer', 'keyword'],
          ['if'     , 'A'         , 'then'   , '5'      , 'end']))

#-------------------------------------------------------------------------------
# Tests for the BNF language
#-------------------------------------------------------------------------------

print('\nTest "abc" "def" with bnf language')
lex = Lexer(LANGUAGES['bnf'])
reg(lex.check('"abc" "def"',
          ['string', 'blank', 'string'],
          ['"abc"' , ' '    , '"def"']))

print('\nTest [ (A B) C ] D with bnf language')
lex = Lexer(LANGUAGES['bnf'], discards=['blank'], debug=True)
reg(lex.check('[ (A B) C ] D',
          ['separator', 'separator', 'identifier', 'identifier', 'separator', 'identifier', 'separator', 'identifier'],
          ['['        , '('        , 'A'         , 'B'         , ')'        , 'C'         , ']'        , 'D']))

#-------------------------------------------------------------------------------
# Tests for the python language
#-------------------------------------------------------------------------------

print('\nTests of python language')
lex = Lexer(LANGUAGES['python'], debug=False)
reg(lex.check("Test 1999",
          ['identifier', 'blank', 'integer'],
          ['Test'  , ' '    , '1999']))

#-------------------------------------------------------------------------------
# Tests for the game language
#-------------------------------------------------------------------------------

print('\nTests of game language')
lex = Lexer(LANGUAGES['game'], debug=False)
lex.info()

reg(lex.check("Test 1999",
          ['normal', 'blank', 'number'],
          ['Test'  , ' '    , '1999']))

reg(lex.check("3D 3 D3",
          ['wrong_int', 'blank', 'number', 'blank', 'normal'],
          ['3D'    , ' '    , '3'     , ' '    , 'D3']))

reg(lex.check("Baldur's Gate",
          ['normal'  , 'blank', 'normal'],
          ["Baldur's", ' '    , 'Gate']))

reg(lex.check("FarCry: Blood Dragon",
          ['normal', 'operator', 'blank', 'normal', 'blank', 'normal'],
          ['FarCry', ':'       , ' '    , 'Blood' , ' '    , 'Dragon']))

print('Ignore blank')
lex.ignore('blank')
reg(lex.check("Je suis un jeu",
          ['normal', 'normal', 'normal', 'normal'],
          ['Je'    , 'suis'  , 'un'    , 'jeu']))
lex.clear_ignored()

def check_html(lang, text, expected, raws=None):
    global Total, Good
    lex = Lexer(LANGUAGES[lang], debug=False)
    print('Text:', text)
    output = lex.to_html(text=text, raws=raws)
    print('Result:', output)
    print('Length:', len(output), '( expected =', len(expected), ')')
    assert(output == expected)
    Total += 1
    Good += 1

check_html('game', 'Test 1999', '<span class="game-normal">Test</span><span class="game-blank"> </span><span class="game-number">1999</span>')

check_html('game', 'Test 1999', '<span class="game-normal">Test</span> <span class="game-number">1999</span>', raws=['blank'])

check_html('bnf', '<bonjour>', '<span class="bnf-keyword">&lt;bonjour&gt;</span>')

#lex.ignore([1, 'a'])

#-------------------------------------------------------------------------------
# Display results
#-------------------------------------------------------------------------------

Console().write('----------------------------------------', 'KEYWORD')
if Bad > 0:
    Console().write(f'{Total} tests, {Good} good, {Bad} bad', 'COMMENT')
else:
    Console().write(f'{Total} tests, {Good} good, {Bad} bad', 'STRING')

stop = datetime.now()
print("Duration:", stop - start)
print("Version of Weyland tested: ", __version__)

