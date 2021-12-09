def d(level, s):
    print('   ' * level + s)

def w(s):
    return s.replace('\n', '<NL>').replace(' ', '<WL>')

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

c = Char('\n', True)
print(c)
print(c.toRepr())
