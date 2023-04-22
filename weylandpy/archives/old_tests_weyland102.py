# -----------------------------------------------------------
# MIT Licence (Expat License Wording)
# -----------------------------------------------------------
# Copyright © 2020-2021, Damien Gouteux
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

from weyland import Regex
from weyland import Lexer, LANGUAGES, Language, __version__
from collections import namedtuple
from datetime import datetime

#-------------------------------------------------------------------------------
# Constants
#-------------------------------------------------------------------------------

# Test en direct et sinon fait tous les tests
REPL          = True

DEFAULT       = False

# Test programs
TEST_REGEX    = DEFAULT
TEST_LEXER    = DEFAULT
TEST_FUNK     = DEFAULT
TEST_ASH      = DEFAULT
TEST_BNF      = DEFAULT
TEST_BNF_MINI = DEFAULT
TEST_LUA      = DEFAULT
TEST_PYTHON   = DEFAULT
TEST_GAME     = DEFAULT
TEST_LINE     = DEFAULT

# Global behaviour
DEBUG = True
STOP_ON_BAD = True

# Shortcuts for testing results
ID  = 'identifier'
KW  = 'keyword'
SEP = 'separator'
INT = 'integer'
NUM = 'number'
FLT = 'float'
OP  = 'operator'
BIN = 'binary_operator'
UNA = 'unary_operator'
NL  = 'newline'
STR = 'string'
BLK = 'blank'

#-------------------------------------------------------------------------------
# Globals
#-------------------------------------------------------------------------------

Total = 0
Good  = 0
Bad   = 0

#-------------------------------------------------------------------------------
# Types
#-------------------------------------------------------------------------------

RegexTest = namedtuple('Test', ['regex', 'length', 'candidate', 'expected'])
TestLexer = namedtuple('Test', ['text', 'language', 'nb'])

#-------------------------------------------------------------------------------
# Function
#-------------------------------------------------------------------------------

class Check:
    """Check takes two parameters: good and over.
       If good and over are empty, it will not match.
       If over is ... good will not be a match but only a partial match"""

    def __init__(self, good='', over=''):
        self.good = good
        self.over = over

    def check(self, res):
        if self.over == '...': # partial
            return not res.match and res.partial and res.text[:res.length] == self.good
        elif res.length is not None:
            return res.match and res.text[:res.length] == self.good and res.get_overload() == self.over
        else:
            return self.good == ''

    def __str__(self):
        return f'+|{self.good}| -|{self.over}|'

def xprint(string, color=None):
    print(string)

def reg(r):
    global Total, Good, Bad
    Total += 1
    if r:
        Good += 1
    else:
        Bad += 1
        #if STOP_ON_BAD:
        raise Exception("Error")

def test_regex(debug=False):
    global Total, Good, Bad
    previous = None
    for test_index in tests:
        t = test_library[test_index]
        if previous != t.regex:
            xprint('-----------------------')
            regex = None
            msg = None
            try:
                regex = Regex(t.regex, debug)
            except Exception as e:
                msg = e
            end = '\n' if debug else ''
            if t.length is None:
                if regex is None:
                    xprint(f'= Building of {t.regex} failed as expected: {msg}', color='STRING')
                else:
                    xprint(f"= Building of {t.regex} didn't fail as expected", color='COMMENT')
                continue
            elif regex is None:
                xprint(msg)
                raise Exception("No regex!")
            elif len(regex) != t.length:
                xprint(f'= Building {regex} expected ({t.length}) -> KO{end}', color='COMMENT')
                continue
            xprint(f'= Building {regex} expected ({t.length}) -> OK{end}', color='KEYWORD')
            if debug:
                regex.info(starter='    ')
        xprint(f'{end}= {test_index:5d} Matching |{t.candidate}| vs {regex}{end}', color='KEYWORD')
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
            raise Exception('error')
        if debug:
            print('    Debug match (Match#info):')
            res.info('        ')
        print()
        print('    Result:')
        xprint(f'        {res_str} expected {t.expected} and found {res}', color)
        previous = t.regex
        if res_str == 'ERROR' and STOP_ON_BAD:
            exit()

if REPL:
    print("Read eval print loop of Weyland", __version__)
    print("Commands : exit | filter | info | list | lex | set <lang> | <expression> | regex | match")
    cmd = ''
    regex = None
    lang = 'text'
    print("[INFO]  Lang set to", lang)
    lex = True
    lexer = Lexer(LANGUAGES[lang], debug=False)
    print("[INFO]  Lex:", lex)
    filter = False
    print("[INFO]  Filter:", filter)
    while cmd != 'exit':
        cmd = input('weyland> ')
        if cmd.startswith('set '):
            arr = cmd.split(' ')
            if len(arr) > 1:
                new = arr[1]
                if new in LANGUAGES:
                    lang = new
                    print('[INFO]  Language set to', lang)
                    lexer = Lexer(LANGUAGES[lang], debug=False)
                else:
                    print('[ERROR] Language unknown:', new)
                    print('[INFO]  Language is still:', lang)
        elif cmd == 'list':
            for i, l in enumerate(LANGUAGES):
                print(f"{i+1}.", l)
        elif cmd == 'info':
            if lex and lexer is not None:
                lexer.info()
        elif cmd == 'filter':
            filter = not filter
        elif cmd == 'exit':
            pass
        elif cmd.startswith('regex ') or cmd == 'regex':
            arg = cmd[len('regex'):].strip()
            if len(arg) == 0:
                if regex is not None:
                    print('[INFO]  Current regex is :', regex)
                else:
                    print('[INFO]  No regex defined')
            else:
                regex = Regex(arg)
                print('[INFO]  New regex defined:', regex)
        elif cmd.startswith('match '):
            arg = cmd[len('match '):].strip()
            res = regex.match(arg)
            print('[INFO]  Result:', res)
        else:
            if lex and lexer is not None:
                res = lexer.lex(cmd)
                print("Num | Type       | Val             | 1st | lst | len")
                for i, r in enumerate(res):
                    if filter and r.typ == 'blank':
                        continue
                    print(f"{i+1:3d} | {r.typ:10} | {r.val:15} | {r.first:3d} | {r.last:3d} | {r.length:3d}")
    exit()

#-------------------------------------------------------------------------------
# Tests of Regex
#-------------------------------------------------------------------------------

# RegexText : a regex, number of elements of the regex, test string, result

test_library = {

      1: RegexTest("'.*'", 3, "'Je suis un zorba'", Check("'Je suis un zorba'")),
    
    100: RegexTest("abc", 3, "zor", Check('', 'zor')),
    101: RegexTest("abc", 3, "ab", Check('ab', '...')),
    102: RegexTest("abc", 3, "abc", Check('abc')),
    103: RegexTest("abc", 3, "abcd", Check('abc', 'd')),

    110: RegexTest("@", 1, "5", Check()),
    111: RegexTest("\\a", 1, "5", Check()),
    112: RegexTest("@", 1, "a", Check('a')),
    113: RegexTest("\\a", 1, "a", Check('a')),
    114: RegexTest("@", 1, "ab", Check('a', 'b')),
    115: RegexTest("\\a", 1, "ab", Check('a', 'b')),
    116: RegexTest(r"\a", 1, "ab", Check('a', 'b')),

    150: RegexTest("a@+", 2, "a5", Check()),
    151: RegexTest("a@+", 2, "a", Check('a', '...')), # partial match
    152: RegexTest("a@+", 2, "ab", Check('ab')),
    153: RegexTest("a@+", 2, "abc", Check('abc')),

    154: RegexTest("a@*", 2, "a5", Check('a', '5')),
    155: RegexTest("a@*", 2, "a", Check('a')),
    156: RegexTest("a@*", 2, "ab", Check('ab')),
    157: RegexTest("a@*", 2, "abc", Check('abc')),

    200: RegexTest("#", 1, "a", Check()),
    201: RegexTest("\d", 1, "a", Check()),
    202: RegexTest("#", 1, "1", Check('1')),
    203: RegexTest("\d", 1, "1", Check('1')),
    204: RegexTest("#", 1, "15", Check('1', '5')),
    205: RegexTest("\d", 1, "15", Check('1', '5')),
    
    220: RegexTest("##", 2, "aa", Check()),
    221: RegexTest("##", 2, "a5", Check()),
    222: RegexTest("##", 2, "1", Check('1', '...')),
    223: RegexTest("##", 2, "1a", Check('', '1a')),
    224: RegexTest("##", 2, "15", Check('15')),
    225: RegexTest("##", 2, "158", Check('15', '8')),
    
    230: RegexTest("##?", 2, "a", Check()),
    231: RegexTest("##?", 2, "1", Check('1')),
    232: RegexTest("##?", 2, "15", Check('15')),
    233: RegexTest("##?", 2, "158", Check('15', '8')),

    240: RegexTest("##+", 2, "a", Check()),
    241: RegexTest("##+", 2, "ab", Check()),
    242: RegexTest("##+", 2, "1", Check('1', '...')),
    243: RegexTest("##+", 2, "1a", Check('', '1a')), # ce n'est pas bon, ni partial !
    244: RegexTest("##+", 2, "15", Check('15')),
    245: RegexTest("##+", 2, "158", Check('158')),

    500: RegexTest("a\?", 2, "b", Check()),
    501: RegexTest("a\?", 2, "a", Check('a', '...')),
    502: RegexTest("a\?", 2, "a?", Check('a?')),
    503: RegexTest("a\?", 2, "ab", Check('', 'ab')),
    504: RegexTest("a\?", 2, "a?b", Check('a?', 'b')),

    510: RegexTest("a\\\\", 2, "b", Check()),
    511: RegexTest("a\\\\", 2, "a", Check('a', '...')),
    512: RegexTest("a\\\\", 2, "a\\", Check('a\\')),
    513: RegexTest("a\\\\", 2, "ab", Check('', 'ab')),
    514: RegexTest("a\\\\", 2, "a\\b", Check('a\\', 'b')),

    # Test of the "&" special char
    600: RegexTest("&", 1, "a", Check('a')),
    601: RegexTest("&", 1, "1", Check('1')),
    602: RegexTest("&*", 1, "abc255", Check('abc255')),

    # Test of position
    700: RegexTest("hello", 5, "hello world", Check('hello', ' world')),
    701: RegexTest("hello$", 5, "hello world", Check()),
    702: RegexTest("hello$", 5, "hello", Check('hello')),
    
    703: RegexTest("\#.*", 2, "# comment\n", Check('# comment', '\n')),
    704: RegexTest("\#.*", 2, "# comment", Check('# comment')),
    705: RegexTest("\#.*\n", 3, "# comment", Check('# comment', '...')),
    706: RegexTest("\#.*$", 2, "# comment", Check('# comment')),

    1000: RegexTest("[ab]", 1, "c", Check()),
    1001: RegexTest("[ab]", 1, "a", Check('a')),
    1002: RegexTest("[ab]", 1, "b", Check('b')),
    1003: RegexTest("[ab]", 1, "ac", Check('a', 'c')),
    1004: RegexTest("[ab]c", 2, "ab", Check('', 'ab')),
    1005: RegexTest("[ab]c", 2, "ac", Check('ac')),
    
    5000: RegexTest(r"[@_]&*[\?!]?", 3, "_a15", Check('_a15')),
    5001: RegexTest(r"[@_]&*[\?!]?", 3, "4a", Check()),
    5002: RegexTest(r"[@_]&*[\?!]?", 3, "_isalpha?", Check('_isalpha?')),

    9000: RegexTest("#?#", None, None, None),
    9001: RegexTest("#?1", None, None, None),

    10000: RegexTest(".", 1, " ", Check(' ')),
    10001: RegexTest(".", 1, "a", Check('a')),
    10002: RegexTest(".", 1, "5", Check('5')),
    10003: RegexTest(".", 1, ">", Check('>')),
    
    #100: Test(r"[@_]\w*", 2, 1, "_a15", COMPLETE),
    #327: Test(r"\d\d?\d", 3, 2, "123", COMPLETE), # pb

} # [327]

start = datetime.now()

if TEST_REGEX:
    tests = test_library.keys()
    #tests = [706] #[223]
    print('Testing', len(tests), 'regex.')
    if len(tests) < 10:
        test_regex(True)
    else:
        test_regex(False)

    # Independant test (uncounted)
    #regex = Regex('aaa')
    #res = regex.match('aaa')
    #xprint(res, 'STRING')

#-------------------------------------------------------------------------------
# Tests of Lexer
#-------------------------------------------------------------------------------

if TEST_LEXER:
    
    simple_one = Language('simple_one', {
                    'A': ['aaa'],
                    'B': ['bbb'],
                    'SPACE': [' '],
                })

    test_one = Language('test_one', {
                    'KEYWORD' : ['bonjour', 'bon'],
                    'IDENTIFIER' : ['[@_]&*'],
                    'SPECIFIC_INTEGER' : ['08789'],
                    'ALL_INTEGER' : ['#+'],
                    'OPERATOR' : ['\+', '\+='],
                    'NEWLINE' : ['\n'],
                    'WRONGINT' : ['#+@&+'],
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
            raise Exception('error')
        else:
            Good += 1
            print(f'OK')
    
#-------------------------------------------------------------------------------
# Breaking it: we must trace ALL the completes before (complete + overload)
#-------------------------------------------------------------------------------

if TEST_FUNK:
    
    funk = Language('funk', {
                'aaab': ['aaab'],
                'aa': ['aa'],
                'ac': ['ac'],
          })
    lex = Lexer(funk, debug=DEBUG)
    lex.info()
    reg(lex.check("aaac",
              ['aa', 'ac'],
              ['aa', 'ac']))

#-------------------------------------------------------------------------------
# Tests for the Ash language
#-------------------------------------------------------------------------------

if TEST_ASH:

    print('\n-----------------------------------')
    print('Test Ash lexer')
    print('-----------------------------------\n')

    lex = Lexer(LANGUAGES['ash'], discards=['blank'], debug=DEBUG)

    reg(lex.check('if A then 5 end',
              [KW  , ID , KW    , INT, KW],
              ['if', 'A', 'then', '5', 'end']))

    print("")

    reg(lex.check('if A then 5 elif 6 else 7 end',
              [KW,  ID  , KW    , INT, KW    , INT, KW    , INT, KW],
              ['if', 'A', 'then', '5', 'elif', '6', 'else', '7', 'end']))

    print("")

    reg(lex.check('while A do 5 end',
              [KW     , ID , KW  , INT, KW],
              ['while', 'A', 'do', '5', 'end']))
    print("")

    reg(lex.check('do \n 5 \n while A end',
              [KW  , NL  , INT, NL  , KW     , ID , KW],
              ['do', '\n', '5', '\n', 'while', 'A', 'end']))
    print("")

    reg(lex.check('for a, b in c do 5 end',
              [KW   , ID , SEP, ID , OP , ID , KW  ,  INT, KW],
              ['for', 'a', ',', 'b', 'in', 'c', 'do',  '5', 'end']))

    print("")

    reg(lex.check('import A, B from "mod.ash"',
              [KW      ,  ID, SEP, ID , KW    , STR],
              ['import', 'A', ',', 'B', 'from', '"mod.ash"']))

#-------------------------------------------------------------------------------
# Tests for the BNF language
#-------------------------------------------------------------------------------

if TEST_BNF:
    
    print('\nTest "abc" "def" with BNF language')
    lex = Lexer(LANGUAGES['bnf'], debug=DEBUG)
    reg(lex.check('"abc" "def"',
              ['string', 'blank', 'string'],
              ['"abc"' , ' '    , '"def"']))

    print('\nTest [ (A B) C ] D with bnf language')
    lex = Lexer(LANGUAGES['bnf'], discards=['blank'], debug=DEBUG)
    reg(lex.check('[ (A B) C ] D',
              ['separator', 'separator', 'identifier', 'identifier', 'separator', 'identifier', 'separator', 'identifier'],
              ['['        , '('        , 'A'         , 'B'         , ')'        , 'C'         , ']'        , 'D']))

#-------------------------------------------------------------------------------
# Tests for the minimal BNF language
#-------------------------------------------------------------------------------

if TEST_BNF_MINI:
    
    print('\n-----------------------------------')
    print('Test for the minimal BNF language')
    print('-----------------------------------\n')

    lex = Lexer(LANGUAGES['bnf-mini'], discards=['blank'], debug=DEBUG)

    reg(lex.check('<digit> ::= "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"',
                  ['keyword', 'operator', 'string', 'operator', 'string', 'operator', 'string', 'operator'
                                        , 'string', 'operator', 'string', 'operator', 'string', 'operator'
                                        , 'string', 'operator', 'string', 'operator', 'string', 'operator'],
                  ['<digit>', '::='     , '"1"'   , '|'       , '"2"'   , '|'       , '"3"'   , '|'       ,
                                          '"4"'   , '|'       , '"5"'   , '|'       , '"6"'   , '|'       ,
                                          '"7"'   , '|'       , '"8"'   , '|'       , '"9"']))

    print("")

    reg(lex.check('<digit_zero> ::= <digit> | "0"',
                  ['keyword', 'operator', 'keyword', 'operator', 'string'],
                  ['<digit_zero>', '::=', '<digit>', '|', '"0"']))

    print("")

    reg(lex.check("# Can't start by a zero",
                  ["comment"],
                  ["# Can't start by a zero"]))

    print("")

    reg(lex.check('<integer> ::= <digit> | <digit_zero> <integer>',
                  ['keyword', 'operator', 'keyword', 'operator', 'keyword', 'keyword'],
                  ['<integer>', '::=', '<digit>', '|', '<digit_zero>', '<integer>']))

    print("")

    reg(lex.check('<after_dot_float> ::= <digit_zero> | <digit_zero> <after_dot_float>',
                  ['keyword', 'operator', 'keyword', 'operator', 'keyword', 'keyword'],
                  ['<after_dot_float>', '::=', '<digit_zero>', '|', '<digit_zero>', '<after_dot_float>']))

    print("")

    reg(lex.check('<float> ::= <integer> "." <after_dot_float>',
                  ['keyword', 'operator', 'keyword', 'string', 'keyword'],
                  ['<float>', '::=', '<integer>', '"."', '<after_dot_float>']))

    print("")

    simple_lang = """
    
    <digit> ::= "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
    
    <digit_zero> ::= <digit> | "0"
    
    # Can't start by a zero
    <integer> ::= <digit> | <digit_zero> <integer>
    
    <after_dot_float> ::= <digit_zero> | <digit_zero> <after_dot_float>

    <float> ::= <integer> "." <after_dot_float>
    """
    #parser = Parser()

#-------------------------------------------------------------------------------
# Tests for the lua language
#-------------------------------------------------------------------------------

if TEST_LUA:
    print('-------------------------------------------------------------------')
    print('Tests of lua language')
    print('-------------------------------------------------------------------\n')
    lex = Lexer(LANGUAGES['lua'], debug=DEBUG)
    reg(lex.check("a = 5",
              [ID , BLK, OP , BLK, NUM],
              ['a', ' ', '=', ' ', '5']))
    print()
    reg(lex.check("~=",
                  [OP],
                  ['~=']))
    print()

#-------------------------------------------------------------------------------
# Tests for the python language
#-------------------------------------------------------------------------------

if TEST_PYTHON:
    print('-------------------------------------------------------------------')
    print('Tests of python language')
    print('-------------------------------------------------------------------\n')
    lex = Lexer(LANGUAGES['python'], debug=DEBUG)
    
    # integer
    reg(lex.check("Test 1999",
              [ID      , BLK, INT],
              ['Test'  , ' ', '1999']))
    print()
    reg(lex.check("a = 5",
              [ID , BLK, OP , BLK, INT],
              ['a', ' ', '=', ' ', '5']))
    print()
    reg(lex.check("a = 1.2",
              [ID , BLK, OP , BLK, FLT],
              ['a', ' ', '=', ' ', '1.2']))
    print()
    reg(lex.check("a = 0b01",
              [ID , BLK, OP , BLK, INT],
              ['a', ' ', '=', ' ', '0b01']))
    print()
    reg(lex.check("a = 0xFF",
              [ID , BLK, OP , BLK, INT],
              ['a', ' ', '=', ' ', '0xFF']))

#-------------------------------------------------------------------------------
# Tests for the game language
#-------------------------------------------------------------------------------

def check_html(lang, text, expected, raws=None):
    global Total, Good
    lex = Lexer(LANGUAGES[lang], debug=DEBUG)
    print('Text:', text)
    output = lex.to_html(text=text, raws=raws)
    print('Result:', output)
    print('Length:', len(output), '( expected =', len(expected), ')')
    assert(output == expected)
    Total += 1
    Good += 1

if TEST_GAME:
    print('\n-------------------------------------------------------------------')
    print('Tests of game language')
    print('-------------------------------------------------------------------\n')
    lex = Lexer(LANGUAGES['game'], debug=DEBUG)
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

    check_html('game', 'Test 1999', '<span class="game-normal">Test</span><span class="game-blank"> </span><span class="game-number">1999</span>')
    
    check_html('game', 'Test 1999', '<span class="game-normal">Test</span> <span class="game-number">1999</span>', raws=['blank'])
    
    check_html('bnf', '<bonjour>', '<span class="bnf-keyword">&lt;bonjour&gt;</span>')

    #lex.ignore([1, 'a'])

#-------------------------------------------------------------------------------
# Tests for the line language
#-------------------------------------------------------------------------------

if TEST_LINE:
    print('\n-------------------------------------------------------------------')
    print('Tests of line language')
    print('-------------------------------------------------------------------\n')
    lex = Lexer(LANGUAGES['line'], debug=DEBUG)
    print()
    reg(lex.check('test',
              ['line'],
              ['test']))
    print()

    reg(lex.check('alpha\nbeta',
              ['line' , 'line'],
              ['alpha\n', 'beta']))
    print()

    test = "Depuis six mille ans la guerre\nPlait aux peuples querelleurs,\nEt Dieu perd son temps à faire\nLes étoiles et les fleurs." # Victor HUGO
    reg(lex.check(test,
              ['line'                            , 'line'                            , 'line'                            , 'line'                      ],
              ['Depuis six mille ans la guerre\n', 'Plait aux peuples querelleurs,\n', 'Et Dieu perd son temps à faire\n', 'Les étoiles et les fleurs.']))
    print()

#-------------------------------------------------------------------------------
# Display results
#-------------------------------------------------------------------------------

xprint('----------------------------------------', 'KEYWORD')
if Bad > 0:
    xprint(f'{Total} tests, {Good} good, {Bad} bad', 'COMMENT')
else:
    xprint(f'{Total} tests, {Good} good, {Bad} bad', 'STRING')

stop = datetime.now()
print("Duration:", stop - start)
print("Version of Weyland tested: ", __version__)

