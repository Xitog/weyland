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

"""Lexer: a simple lexer"""

#-------------------------------------------------------------------------------
# Imports
#-------------------------------------------------------------------------------

from weyland.languages import Language, LANGUAGES
import html
import re

#-------------------------------------------------------------------------------
# Functions
#-------------------------------------------------------------------------------

def ln(s):
    return s.replace('\n', '<NL>')

#-------------------------------------------------------------------------------
# Classes
#-------------------------------------------------------------------------------

class LexingException(Exception):
    pass


class Token:
    
    def __init__(self, typ, value, start):
        self.typ = typ
        self.value = value
        self.start = start

    def get_type(self):
        return self.typ

    def get_value(self):
        return self.value

    def get_start(self):
        return self.start

    def __str__(self):
        return f"Token {self.typ:20s}  |{(ln(self.value) + '|'):10s}  {len(self.value)} @{self.start}"


class Mini:

    def __init__(self, typ, elem, start):
        self.typ = typ
        self.elem = elem
        self.start = start


class Lexer:

    def __init__(self, lang, discards=[]):
        self.lang = lang
        self.discards = discards

    def get_language(self):
        return self.lang

    def match(self, start, word, debug=False):
        matches = []
        for typ, variants in self.lang.get_type_definitions():
            for elem in variants:
                m = elem.fullmatch(word)
                if m is not None:
                    if debug:
                        print(f"    Match: {typ} : {elem} => {m}")
                    matches.append(Mini(typ, elem, start))
        return matches

    def lex(self, text, discards=None, debug=False):
        discards = self.discards if discards is None else discards
        word = ''
        old = None
        matched = []
        tokens = []
        start = 0
        i = 0
        while i < len(text):
            word += text[i]
            if debug:
                print(f"{i}. @{start} |{ln(word)}|")
            matched = self.match(start, word, debug)
            if debug and len(matched) == 0:
                print('    no match this turn')
            if len(matched) == 0 and (old is None or len(old) == 0):
                # Nothing, we try to add the maximum
                pass
            elif len(matched) == 0: # old is not None and old.length > 0
                # Visions: trying to see if there is something after
                if i + 1 < len(text):
                    future_index = i + 1
                    future_word = word + text[future_index]
                    matched = self.match(start, future_word, debug)
                    if debug and len(matched) > 0:
                        print('    vision of the future OK')
                # Si et seulement si dans le futur on n'aura rien on fait un jeton, sinon on continue
                if len(matched) == 0:
                    content = word[0:len(word)-1]
                    if debug:
                        print(f'pour le mot |{content}| nous avons :')
                        for res in old:
                            print(f"    {res.typ} : {res.elem} @{res.start}")
                    if self.lang.is_wrong(old[0].typ):
                       raise LexingException(f'A wrong token definition {old[0].typ} : {old[0].elem} has been validated by the lexer: {content}')
                    if old[0].typ not in discards:
                        tokens.append(Token(old[0].typ, content, old[0].start))
                    word = ''
                    i -= 1
                    start = i
            old = matched
            matched =[]
            i += 1
        if len(old) > 0:
            content = word
            if debug:
                print('pour le mot ' + content + ' nous avons :')
                for res in old:
                    print(f'    {res.typ} : {res.elem}')
            if self.lang.is_wrong(old[0].typ):
                raise LexingException(f'A wrong token definition {old[0].typ} : {old[0].elem} has been validated by the lexer: {content}')
            if old[0].typ not in discards:
                tokens.append(Token(old[0].typ, content, old[0].start))
        elif len(word) > 0:
            raise LexingException(f'Text not lexed at the end: |{word}| in |{ln(text)}|')
        return tokens

    def to_html(self, text=None, tokens=None, raws=None):
        raws = [] if raws is None else raws
        if text is None and tokens is None:
            raise LexingException("Nothing send to to_html")
        elif text is not None and tokens is not None:
            raise LexingException("Send to to_html text OR tokens, not both!")
        if text is not None:
            tokens = self.lex(text, [])
        output = ''
        for tok in tokens:
            if tok.get_type() in raws:
                output += tok.get_value()
            else:
                val = tok.get_value()
                val = val.replace('&', '&amp;')
                val = val.replace('>', '&gt;')
                val = val.replace('<', '&lt;')
                output += f'<span class="{self.lang.get_name()}-{tok.get_type()}">{val}</span>'
        return output


class Test:

    def __init__(self, lexer, text, result):
        self.lexer = lexer
        self.text = text
        self.result = result
        if self.result is None:
            raise Exception(f"No expected results for test {text}")

    def test(self, num=0, debug=False):
        tokens = self.lexer.lex(self.text, None, debug)
        if len(tokens) != len(self.result):
            longuest = max(len(tokens), len(self.result))
            print("index expected        type            valeur")
            for index in range(longuest):
                if index < len(tokens) and index < len(self.result):
                    print(f"{index:5d} {self.result[index]:15s} {tokens[index].get_type():15s} {ln(tokens[index].get_value())}")
                elif index < len(tokens):
                    print(f"{index:5d} None            {tokens[index].get_type():15s} {ln(tokens[index].get_value())}")
                elif index < len(self.result):
                    print(index, self.result[index], 'None')
            raise Exception(f"Error: expected {len(self.result)} tokens and got {len(tokens)}")
        for index, r in enumerate(self.result):
            if tokens[index].get_type() != r:
                raise LexingException(f"Error: expected {r} and got {tokens[index].get_type()} in {self.text}")
        print(f"[SUCCESS] Test n°{num} Lang : {self.lexer.get_language()}\nText : |{ln(self.text)}|\nResult:")
        for tok in tokens:
            print(f'   {tok}')

#-------------------------------------------------------------------------------
# Globals and constants
#-------------------------------------------------------------------------------

lex = Lexer(LANGUAGES['lua'], ['blank'])
TESTS = [
    Test(lex, '3+5', ['number', 'operator', 'number']),
    Test(lex, 'a = 5', ['identifier', 'operator', 'number']),
    Test(lex, 't = { ["k1"] = 5 }', ['identifier', 'operator', 'separator', 'separator', 'string', 'separator', 'operator', 'number', 'separator']),
    Test(lex, 't = { ["k1"] = 5, ["k2"] = "v", [4] = 6 } -- Définition\nprint(t["k1"]) -- Accès\nprint(t.k1) -- Accès avec sucre syntaxique',
            ['identifier', 'operator', 'separator', 'separator', 'string', 'separator', 'operator', 'number', 'separator',
             'separator', 'string', 'separator', 'operator', 'string', 'separator', 'separator', 'number', 'separator', 'operator', 'number',
             'separator', 'comment', 'special', 'separator', 'identifier', 'separator', 'string', 'separator', 'separator', 'comment',
             'special', 'separator', 'identifier', 'operator', 'identifier', 'separator', 'comment']),
    Test(lex, '--[[Ceci est un\nz--]]', ['comment']),
    Test(lex, '--[[Ceci est un\ncommentaire multiligne--]]', ['comment'])
]

#TESTS = [Test(lex, '3+5', ['number', 'operator', 'number']),]

def tests(debug=False):
    for index, t in enumerate(TESTS):
        t.test(index + 1, debug)

#tests(True)
