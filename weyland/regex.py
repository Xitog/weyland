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
#-------------------------------------------------------------------------------
# Language:
#   Special chars for classes:
#       @ = alpha
#       # = digit
#       $ = alpha + digit + _
#       . = any but newline
#   Special chars for repeatability/optionality:
#       * repeat (0, n)
#       + repeat (1, n)
#       ? repeat (0, 1)
#   Escape for special chars and \:
#       \
#   Choice:
#       [xy] => x or y
#       In choice, no repeat, no option, and no sub expression like [(xa)y]

"""Regex: a alternative way to define regex"""

#-------------------------------------------------------------------------------
# Imports
#-------------------------------------------------------------------------------

from enum import Enum
from collections import namedtuple
from weyland.console import Console

#-------------------------------------------------------------------------------
# Types
#-------------------------------------------------------------------------------

RexTest = namedtuple('Test', ['regex', 'length', 'candidate', 'expected'])

#-------------------------------------------------------------------------------
# Classes
#-------------------------------------------------------------------------------

class Element:
    """This class represents a element of a regex."""
    
    def __init__(self, core, option=False, repeat=False, special=False):
        self.option = option
        self.repeat = repeat
        self.special = special
        self.core = core

    def __str__(self):
        return f'{self.core} *={str(self.repeat):5s} ?={str(self.option):5s} !={str(self.special):5s}'

    def __repr__(self):
        return f'|{self.core}|'

    def is_special(self):
        if self.is_choice():
            for elem in self.core:
                if elem.special:
                    return True
            return False
        else:
            return self.special

    def is_optionnal(self):
        return self.option

    def is_repeatable(self):
        return self.repeat

    def is_choice(self):
        return isinstance(self.core, list)

    def is_included(self, other): # only to check #?#
        if self.is_choice():
            for sub_elem in self.core:
                res = sub_elem.is_included(other)
                if res:
                    return res
            return False
        elif other.is_choice():
            for sub_elem in other.core:
                res = self.is_included(sub_elem)
                if res:
                    return res
            return False
        elif self.special:
            if self.core == '#':
                return other.core == '#' or other.core.isdigit()
            elif self.core == '@':
                return other.core == '@' or other.core.isalpha()
            elif self.core == '$':
                return other.core in ['$', '_'] or other.core.isalnum()
            elif self.core == '.':
                return other.core != '\n'
        else:
            return self.core == other.core

    def check(self, candidate):
        if self.is_choice():
            res = False
            for sub_elem in self.core:
                res = sub_elem.check(candidate)
                if res:
                    break
        elif self.special:
            if self.core == '#':   # \d
                res = candidate.isdigit()
            elif self.core == '@': # \a
                res = candidate.isalpha()
            elif self.core == '$': # \w
                res = (candidate.isalnum() or candidate == '_')
            elif self.core == '.':
                res = (candidate != '\n')
            else:
                raise Exception(f'Unknown special char {self.elements[index].elem}')
        else:
            res = (candidate == self.core)
        return res


class Match:

    def __init__(self, text):
        self.text = text
        self.match = False
        self.partial = False
        self.length = None

    def __len__(self):
        return self.length

    def is_partial(self):
        """Not a match but the last char matched is the last char of the text"""
        return not self.match and self.length == len(text)

    def is_match(self):
        return self.match

    def get_match(self):
        return '' if self.length is None else self.text[:self.length]

    def is_overload(self):
        if self.length is not None and self.length < len(self.text):
            return True
        else:
            return False

    def get_overload(self):
        if self.length is None or self.length == len(self.text):
            return ''
        else:
            return self.text[self.length:]
        
    def info(self):
        print(text)
        if self.last is not None:
            print('^' * self.length)
        else:
            print('No match')

    def __str__(self):
        return f'<Match ?{self.match} ...{self.partial} |{self.get_match()}|>'


class AwaitedResult:

    def __init__(self, match=False, partial=False, length=None):
        self.match = match
        self.partial = partial
        self.length = length

    def check(self, res):
        return res.match == self.match and res.partial == self.partial and res.length == self.length

    def __str__(self):
        return f'AwaitedResult => match={self.match} partial={self.partial} length={self.length}'


class Check:

    def __init__(self, good='', over=''):
        self.good = good
        self.over = over

    def check(self, res):
        if self.over == '...': # partial
            return not res.match and res.partial and res.text[:res.length] == self.good
        elif res.length is not None:
            return res.text[:res.length] == self.good and res.get_overload() == self.over
        else:
            return self.good == ''

    def __str__(self):
        return f'+|{self.good}| -|{self.over}|'


class Rex:
    """ This class handles the core of the Regex
        It compiles from a pattern (a simple string)
    """

    MODIFIERS = ['?', '+', '*']
    CLASSES = ['#', '@', '$', '.'] # \d \a \w
    ESCAPABLES = MODIFIERS + CLASSES + ['\\', '[', '.']
    
    def __init__(self, pattern, debug=False):
        self.pattern = pattern
        self.debug = debug
        self.elements = []
        self.compile()

    def __str__(self):
        if self.pattern != '\n':
            return f"Regex |{self.pattern}| ({len(self)})"
        else:
            return f"Regex |NEWLINE| ({len(self)})"

    def __repr__(self):
        if self.pattern != '\n':
            return f"Regex |NEWLINE|"
        else:
            return f"Regex |{self.pattern}|"
    
    def compile(self, start=0, limit=None):
        index = start
        if limit is None:
            limit = len(self.pattern)
        while index < limit:
            c = self.pattern[index]
            if c == '[': # choice
                sub_index = index + 1
                if sub_index >= len(self.pattern):
                    raise Exception(f"No [ at the end of a regex: |{self.pattern}|")
                c = self.pattern[sub_index]
                while c != ']' and sub_index < limit:
                    if c == '[': # no choice allowed in choice
                        raise Exception("No choice in choice")
                    elif c == '\\':
                        sub_index += 2
                    elif c in Rex.MODIFIERS:
                        raise Exception("No modifiers ? + * in choice")
                    else:
                        sub_index += 1
                    c = self.pattern[sub_index]
                if c != ']':
                    raise Exception("Uncomplete choice: opening [ has not matching closing ]")
                old = self.elements
                self.elements = []
                self.compile(start=index + 1, limit=sub_index)
                if len(self.elements) < 2:
                    raise Exception("Choice with one or zero element: not a choice")
                sub_elems = self.elements
                self.elements = old
                self.elements.append(Element(sub_elems))
                index = sub_index + 1
            elif c in Rex.MODIFIERS:
                if index == 0:
                    raise Exception(f'{c} without something to repeat in {self.pattern}. Did you miss to escape?')
                if c == '?':
                    self.elements[-1].repeat = False
                    self.elements[-1].option = True
                elif c == '+':
                    self.elements[-1].repeat = True
                    self.elements[-1].option = False
                elif c == '*':
                    self.elements[-1].repeat = True
                    self.elements[-1].option = True
                index += 1
            elif c == '\\':
                if index + 1 >= len(self.pattern):
                    raise Exception("A regex cannot finish with an escaped char")
                cnext = self.pattern[index + 1]
                if cnext not in Rex.ESCAPABLES:
                    raise Exception("Unable to escape char: " + cnext)
                self.elements.append(Element(cnext))
                index += 2
            elif c in Rex.CLASSES:
                self.elements.append(Element(c, special=True))
                index += 1
            else:
                self.elements.append(Element(c))
                index += 1
        # Check
        for index, elem in enumerate(self.elements):
            if index < len(self) - 1:
                #print(index, elem, self.elements[index + 1], elem.is_included(self.elements[index+1]))
                # '.*' ok because ' (after .*) is not special
                if elem.is_optionnal() and (self.elements[index+1].core == elem.core or (elem.is_included(self.elements[index+1]) and self.elements[index+1].special)):
                    raise Exception(f"An optionnal element can't be followed by the same non optionnal element in {self.pattern}.") # x?x forbidden, how to match this?

    def check_at(self, candidate, index):
        if index >= len(self.elements):
            raise Exception('Index out of range of Rex')
        return self.elements[index].check(candidate)

    def __len__(self):
        return len(self.elements)

    def info(self, starter=''):
        index = 0
        print(f'{starter}{self}')
        max_length = 0
        for i, e in enumerate(self.elements):
            print(f'{starter}{i} {e}')

    def is_specific(self):
        return all(map(lambda elem: not elem.is_special(), self.elements))
    
    def match(self, candidate):
        if self.debug:
            print(f'{self} vs |{candidate}|')
        matched = [0] * len(self.elements)
        index_candidate = 0
        index_regex = 0
        final = Match(candidate)
        previous = False
        while index_candidate < len(candidate) and index_regex < len(self):
            elem = self.elements[index_regex]
            res = self.check_at(candidate[index_candidate], index_regex)
            if self.debug:
                pass #print(f'    iter {index_candidate=} {index_regex=} {candidate[index_candidate]} vs {elem} => {res}')
            if res:
                # pb of |."| We should quit the '.' as soon as possible
                if elem.is_repeatable():
                    if (elem.is_optionnal() or matched[index_regex] > 0) and index_regex + 1 < len(self.elements):
                        next_res = self.check_at(candidate[index_candidate], index_regex + 1)
                        if next_res: # We prefer the next one
                            index_regex += 1
                    matched[index_regex] += 1    
                else: # next element
                    matched[index_regex] += 1
                    index_regex += 1
                index_candidate += 1
            else:
                if elem.is_optionnal() or matched[index_regex] > 0: # ?/* or (+ and nb > 0)
                    index_regex += 1 # test next
                else:
                    break
        # Get last none empty
        if self.debug:
            print(f'\n    Iter   Element                        Num   Matched')
        res = True
        count = 0
        for i, c in enumerate(matched):
            count += matched[i]
            if self.debug:
                cnd = candidate[i:i+matched[i]]
                print(f'    {i:05d}. {str(self.elements[i]):30s} {matched[i]:05d} {str(cnd):8s}')
            if c == 0 and not self.elements[i].is_optionnal():
                res = False
        if self.debug:
            print(f'    Unmatched: {candidate[count:]} ({len(candidate[count:])})')
            print()
        final.match = res
        final.partial = True if not final.match and count == len(candidate) else False
        if final.match or final.partial:
            final.length = count
        return final
