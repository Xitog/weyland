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

from weyland.regex import Rex
from weyland.languages import Language # only for check
import html

#-------------------------------------------------------------------------------
# Classes
#-------------------------------------------------------------------------------

class TokenDef:
    
    def __init__(self, typ, pattern, debug=False):
        self.typ = typ
        self.regex = Rex(pattern, debug=False)
    
    def __str__(self):
        return f"TokenDef {self.typ}"

    def __repr__(self):
        return f"{self.typ} {self.regex}"


class Token:

    def __init__(self, typ, val, first):
        self.typ = typ
        self.val = val
        self.first = first
        self.length = len(val)
        self.last = self.first + self.length - 1
    
    def __str__(self):
        return f"{self.typ} |{self.val}| ({self.first}, {self.last}) #{self.length}"

    def __repr__(self):
        return str(self)

    def __len__(self):
        return self.length


class LexingException(Exception):
    pass


class Lexer:

    def __init__(self, lang, discards=None, debug=False):
        assert(isinstance(lang, Language))
        assert(discards is None or isinstance(discards, list))
        assert(isinstance(debug, bool))
        self.debug = debug
        self.lang = lang
        self.defs = []
        self.discards = [] if discards is None else discards
        for typ, values in lang.tokens.items():
            for val in values:
                self.defs.append(TokenDef(typ, val, self.debug))
        if self.debug:
            self.info()

    def ignore(self, typ):
        if isinstance(typ, str):
            self.discards.append(typ)
        elif isinstance(typ, list):
            for t in typ:
                self.ignore(t)
        else:
            raise Exception(f"Unknown type to ignore: {typ} of {type(typ)}")

    def clear_ignored(self):
        self.discards = []
    
    def info(self):
        print('----------------------------------------')
        print('Language')
        print('----------------------------------------')
        print('Types :', len(self.lang.tokens))
        for d in self.lang.tokens:
            print('   ', d)
        print('----------------------------------------')
        print('Token definitions :', len(self.defs))
        for tokdef in self.defs:
            print('   ', repr(tokdef))
        print('----------------------------------------')

    def check(self, string, typs, vals):
        print(f'Text: {string}')
        tokens = self.lex(string)
        if len(tokens) != len(vals):
            print(f'ERROR        Wrong length of tokens expected: {len(typs)}, got {len(tokens)}:')
            for i, t in enumerate(tokens):
                print(f'    {t.typ:10s} |{t.val:s}|')
            return False
        print(f'Tokens: {len(tokens)}')
        for i, t in enumerate(tokens):
            if t.typ == typs[i] and t.val == vals[i]:
                print(f'OK  {i:5d}. {t.typ:10s} |{t.val:s}|')
            else:
                print(f'ERROR   {i:5d}. {t.typ:10s} |{t.val:s}|')
                print(f'EXPECTED {typs[i]:10s} |{vals[i]:s}|')
                return False
        return True

    def to_html(self, text=None, tokens=None, raws=None):
        if text is None and tokens is None:
            raise LexingException("Nothing send to html")
        elif text is not None and tokens is not None:
            raise LexingException("Send to html text OR tokens, not both!")
        if text is not None:
            tokens = self.lex(text)
        raws = [] if raws is None else raws
        output = ''
        for tok in tokens:
            if tok.typ in raws:
                output += tok.val
            else:
                output += f'<span class="{self.lang}-{tok.typ}">{html.escape(tok.val)}</span>'
        return output

    def make_token(self, start, text, index, res):
        matches = list(filter(lambda elem: res[elem].match if res[elem] is not None else False, range(len(res))))
        count = len(matches)
        if count == 0:
            raise LexingException(f'\nLang:[{self.lang.name}]\nSource:\n|{text}|\nError:\nNo matching token for |{text[start:index + 1]}| from |{text}| in:\n{self.defs}')
        elif count == 1:
            i = matches[0]
            token = Token(self.defs[i].typ, res[i].get_match(), start)
        elif count > 1: # We try to get the longest match (greedy regex)
            max_length = None
            good = {}
            for i, r in enumerate(res):
                if r is None or not r.match:
                    continue
                length = len(r.get_match())
                if length in good:
                    good[length].append(i)
                else:
                    good[length] = [i]
                if max_length is None or length > max_length:
                    max_length = length
            if len(good[max_length]) > 1:
                # Last try: do we have a only one specific among them?
                specific = list(filter(lambda elem: self.defs[elem].regex.is_specific(), good[max_length]))
                if len(specific) == 1:
                    chosen = specific[0]
                else:
                    print('ERROR: Multiple matching tokens')
                    for i in good[max_length]:
                        print('   ', self.defs[i], res[i], len(res[i].get_match()))
                    raise LexingException(f'Multiple matching regex of same length: {good}')
            else:
                chosen = good[max_length][0]
            token = Token(self.defs[chosen].typ, res[chosen].get_match(), start)
        if self.debug:
            print(f'=>= Token {token}')
        return token

    def lex(self, text):
        if self.debug:
            print(f'Texte = |{text}|')
        index = 0
        res = [ None ] * len(self.defs)
        start = 0
        tokens = []
        while index < len(text):
            # Get Regex matching the current word
            if self.debug:
                print(f'-- {index:5d} ----------------------------')
            nb_partial = 0
            nb_match = 0
            for idf in range(len(self.defs)):
                r = self.defs[idf].regex.match(text[start:index + 1])
                if r.partial: nb_partial += 1
                if r.match and not r.is_overload(): nb_match += 1 
                if res[idf] is None or res[idf].partial:
                    res[idf] = r
                elif res[idf] is not None and res[idf].match and r.match:
                    res[idf] = r
                if self.debug and (res[idf].partial or res[idf].match):
                    print(f'{idf:5d} {self.defs[idf].typ:10s} {str(self.defs[idf].regex):20s} {str(res[idf]):20s}')
            if self.debug:
                print('index', index, 'start', start, 'nb_tok', len(tokens), 'nb_part', nb_partial, 'nb_match', nb_match, 'char', text[index], f'word |{text[start:index+1]}|')
            # We got too far: deciding the correct matching regex
            if nb_partial == 0 and nb_match == 0:
                tok = self.make_token(start, text, index, res)
                if tok.typ not in self.discards:
                    tokens.append(tok)
                start = tok.last + 1
                index = tok.last
                res = [ None ] * len(self.defs)
            index += 1
        tok = self.make_token(start, text, index, res)
        if tok.typ not in self.discards:
            tokens.append(tok)
        return tokens
