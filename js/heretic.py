#-------------------------------------------------------------------------------
# Imports
#-------------------------------------------------------------------------------

import re

#-------------------------------------------------------------------------------
# Functions
#-------------------------------------------------------------------------------

def ln(s):
    return s.replace('\n', '<NL>')

#-------------------------------------------------------------------------------
# Class
#-------------------------------------------------------------------------------

class Language:
    
    def __init__(self, name, definitions, wrong=None, specials=None):
        wrong = [] if wrong is None else wrong
        specials = {} if specials is None else specials
        self.name = name
        if type(definitions) != dict:
            raise Exception("Tokens should be an object of {type: [regex]} and it is a " + type(definitions))
        self.definitions = definitions
        for typ, variants in definitions.items():
            if variants is None:
                raise Exception(f"No variants for {typ} in language {name}")
        # In order to match the entire string we put ^ and $ at the start of each regex
        for variants in definitions.values():
            for index, pattern in enumerate(variants):
                if type(pattern) != re.Pattern:
                    if pattern[0] != '^':
                        pattern = '^' + pattern
                    if pattern[-1] != '$':
                        pattern += '$'
                    if '[\\s\\S]' in pattern:
                        variants[index] = re.compile(pattern, re.M)
                    else:
                        variants[index] = re.compile(pattern)
        self.specials = specials
        self.wrong = wrong

    def is_wrong(self, typ):
        return typ in self.wrong
    
    def get_name(self):
        return self.name

    def get_type_definitions(self):
        return self.definitions.items()

    def get_number_of_types(self):
        return len(self.definitions)

    def get_number_of_regex(self):
        total = 0
        for k, v in enumerate(self.definitions):
            total += len(v)
        return total

    def __str__(self):
        return f"Language {self.get_name()} with {self.get_number_of_types()} types and {self.get_number_of_regex()} regex"


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
                       raise Exception(f'A wrong token definition {old[0].typ} : {old[0].elem} has been validated by the lexer: {content}')
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
                raise Exception(f'A wrong token definition {old[0].typ} : {old[0].elem} has been validated by the lexer: {content}')
            if old[0].typ not in discards:
                tokens.append(Token(old[0].typ, content, old[0].start))
        elif len(word) > 0:
            raise Exception(f'Text not lexed at the end: |{word}| in |{ln(text)}|')
        return tokens

    def to_html(self, text=None, tokens=None, raws=None):
        raws = [] if raws is None else raws
        if text is None and tokens is None:
            raise Exception("Nothing send to to_html")
        elif text is not None and tokens is not None:
            raise Exception("Send to to_html text OR tokens, not both!")
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
                raise Exception(f"Error: expected {r} and got {tokens[index].get_type()} in {self.text}")
        print(f"[SUCCESS] Test n°{num} Lang : {self.lexer.get_language()}\nText : |{ln(self.text)}|\nResult:")
        for tok in tokens:
            print(f'   {tok}')


#-------------------------------------------------------------------------------
# Globals and constants
#-------------------------------------------------------------------------------

PATTERNS = {
    'IDENTIFIER'    : ['[a-zA-Z]\\w*'],
    'INTEGER'       : ['\\d+'],
    'WRONG_INTEGER' : ['\\d+\\w+'],
    'BLANKS'        : ['[ \\t]+'],
    'NEWLINES'      : ['\n', '\n\r', '\r\n'],
    'STRINGS'       : ["'([^\\\\]|\\\\['nt])*'", '"([^\\\\]|\\\\["nt])*"'],
}

LANGUAGES = {
    'game': Language('game',
        {
            'number': ['\\d+'],
            'normal': ['\\w[\\w\'-]*'], # Total Annihilation => 2 tokens, Baldur's => 1, Half-life => 1
            'blank': PATTERNS['BLANKS'],
            'wrong_int' : PATTERNS['WRONG_INTEGER'],
            'newline' : ['\n'],
            'operator': [':'] # FarCry:
        }
    ),
    'lua': Language('lua',
        {
            'keyword': ['and', 'break', 'do', 'else', 'elseif', 'end', 'for',
                        'function', 'goto', 'if', 'in', 'local', 'not', 'or',
                        'repeat', 'return', 'then', 'until', 'while'],
            'special': ['ipairs', 'pairs', '\\?', 'print'], # ? is here for demonstration only */
            'boolean': ['true', 'false'],
            'nil' : ['nil'],
            'identifier' : PATTERNS['IDENTIFIER'],
            'number' : ['\\d+', '\\d+\\.\\d+'],
            'string' : PATTERNS['STRINGS'],
            'operator': ['=', '==', '~=', '\\+', '\\*', '-', '/', '%', '\\^',
                        '<', '<=', '>', '>=', '\\.', '\\.\\.', '#', ':'],
            'separator': ['\\{', '\\}', '\\(', '\\)', '\\[', '\\]', ',', ';'],
            'comment': ['--(?!\\[\\[).*(\n|$)', '--\\[\\[[\\s\\S]*--\\]\\](\n|$)'],
            'intermediate_comment': ['--\\[\\[[\\s\\S]*'],
            'newline' : PATTERNS['NEWLINES'],
            'blank': PATTERNS['BLANKS'],
            'wrong_int' : PATTERNS['WRONG_INTEGER'],
        },
        ['wrong_integer'],
        {
            'ante_identifier': ['function'],
        }
    ),
    'python': Language('python',
        {
            'keyword' : ['await', 'else', 'import', 'pass', 'break', 'except', 'in',
                     'raise', 'class', 'finally', 'is', 'return', 'and', 'for',
                     'continue', 'lambda', 'try', 'as', 'def', 'from', 'while',
                     'nonlocal', 'assert', 'del', 'global', 'not', 'with', 'if',
                     'async', 'elif', 'or', 'yield'],
            'operator': ['\\+', '/', '//', '&', '\\^', '~', '\\|', '\\*\\*', '<<', '%', '\\*',
                      '-', '>>', ':', '<', '<=', '==', '!=', '>=', '>', '\\+=',
                      '&=', '/=', '<<=', '%=', '\\*=', '\\|=', '\\*\\*=', '>>=', '-=',
                      '/=', '\\^=', '\\.', '='],
            'newline' : PATTERNS["NEWLINES"],
            'blank': PATTERNS["BLANKS"],
            'wrong_int' : PATTERNS["WRONG_INTEGER"],
        }
    ),
    'text': Language('text',
        {
            'normal': ['[^ \\t]*'],
            'blank': PATTERNS['BLANKS'],
            'newline': PATTERNS['NEWLINES'],
        }
    ),
}

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

# 12h09 : lexer Python marche :-). Attention, pas de range() si on modifie l'indice d'itération !
# 12h13 : commentaire multiline ok de base !

__version__ = 'heretic'
RECOGNIZED_LANGUAGES = LANGUAGES.keys()
