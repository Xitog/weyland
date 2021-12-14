def d(level, s):
    print('   ' * level + s)

def w(s):
    return s.replace('\n', Element.NewLineCode).replace(' ', Element.WhiteSpaceCode)

class Char:

    def __init__(self, value, escaped=False):
        self.value = value
        self.escaped = escaped

    def isA(self, element):
        return element == self.value and not self.escaped

    def isEscaped(self, element):
        return element == self.value and self.escaped

    def toRepr(self):
        s = "\\" if self.escaped else ""
        v = "<NL>" if self.value == "\n" else self.value
        s += v
        return s

    def __str__(self):
        return 'Char | ' + self.toRepr() + '| esc? ' + str(self.escaped)


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
        return 'xxx'

c = Char('\n', True)
print(c)
print(c.toRepr())
