def d(level, s):
    print('   ' * level + s)

def w(s):
    return s.replace('\n', Element.NewLineCode).replace(' ', Element.WhiteSpaceCode)

class Char:

    def __init__(self, value, escaped=False):
        self.value = value
        self.escaped = escaped

    def is_a(self, element):
        return element == self.value and not self.escaped

    def is_escaped(self, element):
        return element == self.value and self.escaped

    def __repr__(self):
        s = "\\" if self.escaped else ""
        v = "<NL>" if self.value == "\n" else self.value
        s += v
        return s

    def __str__(self):
        return 'Char | ' + repr(self) + '| esc? ' + str(self.escaped)


class Element:

    ZeroOrOne = '?'
    OneOrMore = '+'
    ZeroOrMore = '*'
    
    Normal = 0
    Greedy = 1
    Lazy = 2
    Possessive = 3

    Escape = '\\'
    NewLineCode = '<NL>'
    WhiteSpaceCode = '<WS>'

    def __init__(self, value, parent=None):
        self.value = value
        self.parent = parent
        self.min = 1
        self.max = 1
        self.quantifier = Element.Normal
        self.value = value.replace("\n", Element.NewLineCode)

    def get_pattern(self):
        return w(self.value)

    def set_quantifier(self, qt):
        if qt not in [Element.Normal, Element.Greedy, Element.Lazy, Element.Possessive]:
           raise Exception("Quantifier not known: " + str(qt))
        self.quantifier = qt

    def get_quantifier(self):
        return self.quantifier

    def card_to_string(self):
        card = ""
        if self.min != 1 or self.max != 1:
            vmax = "*" if self.max == -1 else self.max
            card = " {" + self.min + ", " + self.max + "}"
            if self.quantifier == Element.Greedy:
                card += ' greedy'
            elif self.quantifier == Element.Lazy:
                card += ' lazy'
            elif self.quantifier == Element.Possessive:
                card += ' possessive'
        return card

    def __str__(self):
        card = self.card_to_string()
        return self.__class__.__name__ + " " + self.get_pattern() + card

    def info(self, level=0, prefix=''):
        return '    ' * level + prefix + str(self)

    def is_optionnal(self):
        return self.min == 0

    def is_repeatable(self):
        return self.max > 1

    def set_card(self, pmin, pmax):
        if pmin > pmax:
            raise Exception("Max cardinality must be superior or equal to min cardinality")
        self.min = pmin
        self.max = pmax

    def get_min(self):
        return self.min

    def get_max(self):
        return self.max

    def match(self, candidate, start=0, level=0, debug=False):
        matched = 0
        i = start
        while i < len(candidate) and matched < self.max:
            if candidate[i] == self.value:
                matched += 1
            else:
                break
            if debug:
                d(level, 'Element#match: ' + candidate[i] + " vs " + str(self) + " matched=" + matched + " @" + i)
            i+=1
        res = (matched >= self.min)
        return Match(self, candidate, res, start, matched)


class Special(Element):
    pass

c = Char('\n', True)
print(c)
print(repr(c))
