#-------------------------------------------------------------------------------
# Functions
#-------------------------------------------------------------------------------

def ln(s):
    return s.replace('\n', '<NL>')

#-------------------------------------------------------------------------------
# Class
#-------------------------------------------------------------------------------

class Language:
    
    constructor(name, definitions, wrong=[], specials={})
    {
        this.name = name;
        if (typeof definitions !== 'object')
        {
            throw new Error("Tokens should be an object of {type: [regex]} and it is a " + typeof definitions);
        }
        this.definitions = definitions;
        for (const [type, variants] of Object.entries(definitions))
        {
            if (variants === null || variants === undefined)
            {
                throw new Error(`No variants for ${type} in language ${name}`);
            }
        }
        // In order to match the entire string we put ^ and $ at the start of each regex
        for (const variants of Object.values(definitions))
        {
            for (let index of Object.keys(variants))
            {
                if (typeof variants[index] !==  "object")
                {
                    let pattern = variants[index];
                    if (pattern[0] !== '^') { pattern = '^' + pattern;}
                    if (pattern[pattern.length-1] !== '$') { pattern += '$'}
                    if (pattern.includes('[\\s\\S]'))
                    {
                        variants[index] = new RegExp(pattern, 'm');
                    } else {
                        variants[index] = new RegExp(pattern);
                    }
                }
            }
        }
        this.specials = specials;
        this.wrong = wrong;
    }

    def isWrong(typ):
        return typ in self.wrong

    def get_name(self)
        return self.name

    def get_type_definitions(self):
        return self.definitions.items()

    def get_number_of_types(self):
        return len(self.definitions)

    getNumberOfRegex()
    {
        let sum = 0;
        for (const [k, v] of Object.entries(this.definitions))
        {
            sum += v.length;
        }
        return sum;
    }

    toString()
    {
        return `Language ${this.getName()} with ${this.getNumberOfTypes()} types and ${this.getNumberOfRegex()} regex`;
    }


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
        return this.start

    def __str__(self):
        return f"Token {self.typ:20s}  |{(ln(self.value) + '|'):10s}  {len(self.value)} @{self.start}"


class Lexer:

    def __init__(self, lang, discards=[]):
        self.lang = lang
        self.discards = discards

    def get_lang(self):
        return self.lang

    def match(self, start, word, debug=False):
        matches = []
        for typ, variants in self.lang.get_type_definitions():
            for elem in variants:
                if elem.test(word):
                    if debug:
                        print('    Match: ' + typ + ' : ' + variants + ' => ' + elem.test(word))
                    matches.append([typ, elem, start])
        return matches

    def lex(self, text, discards=None, debug=False):
        discards = self.discards if discards is None else discards
        word = ''
        old = None
        matched = []
        tokens = []
        start = 0
        for i in range(0, len(text)):
            word += text[i]
            if debug:
                print(i, f"|{ln(word)}|")
            matched = self.match(start, word, debug)
            if debug and len(matched) == 0:
                print('    no match this turn')
            if len(matched) == 0 and (old is None or len(old) == 0):
                # Nothing, we try to add the maximum
            elif len(matched) == 0: # old is not None and old.length > 0
                # Visions: trying to see if there is something after
                future_index = i + 1
                future_word = word + text[future_index]
                matched = self.match(start, future_word, debug)
                if debug and len(matched) > 0:
                    print('    vision of the future OK')
                # Si et seulement si dans le futur on n'aura rien on fait un jeton, sinon on continue
                if len(matched) == 0:
                    content = word[0:len(word)-1]
                    if debug:
                        print('pour le mot ' + content + ' nous avons :')
                        for res in old:
                            print('    ' + res[0] + ' : ' + res[1])
                    if self.lang.is_wrong(old[0][0]):
                       raise Exception('A wrong token definition ' + old[0][0] + ' : ' + old[0][1] + ' has been validated by the lexer: ' + content)
                    if old[0][0] not in discards:
                        tokens.append(Token(old[0][0], content, old[0][2]))
                    word = ''
                    i -= 1
                    start = i
            old = matched
            matched =[]
        if len(old) > 0:
            content = word
            if debug:
                print('pour le mot ' + content + ' nous avons :')
                for res in old:
                    print('    ' + res[0] + ' : ' + res[1])
            if self.lang.is_wrong(old[0][0]):
                raise Exception('A wrong token definition ' + old[0][0] + ' : ' + old[0][1] + ' has been validated by the lexer: ' + content)
            if old[0][0] not in discards:
                tokens.append(Token(old[0][0], content, old[0][2]))
        elif len(word) > 0:
            raise Exception('Text not lexed at the end: ' + word)
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
    pass

#-------------------------------------------------------------------------------
# Globals and constants
#-------------------------------------------------------------------------------

PATTERNS = {
    'IDENTIFIER'    : ['[a-zA-Z]\\w*'],
    'INTEGER'       : ['\\d+'],
}

LANGUAGES = {
    'lua': Language('lua',
        {
            'keyword': ['and', 'break', 'do', 'else', 'elseif', 'end', 'for',
                        'function', 'goto', 'if', 'in', 'local', 'not', 'or',
                        'repeat', 'return', 'then', 'until', 'while'],
            'special': ['ipairs', 'pairs', '\\?', 'print'], # ? is here for demonstration only */
            'boolean': ['true', 'false'],
            'nil' : ['nil'],
            'identifier' : PATTERNS['IDENTIFIER'],
            'number' : ['\\d+', '\\d+\.\\d+'],
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
}
