// -----------------------------------------------------------
// MIT Licence (Expat License Wording)
// -----------------------------------------------------------
// Copyright © 2020, Damien Gouteux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// For more information about my projects see:
// https://xitog.github.io/dgx (in French)

// This file provides several languages definitions :
//   text
//   bnf
//   hamill
//   game
//   ash
//   json
//   lua
//   python
//   line
//   test

//-------------------------------------------------------------------------------
// Functions
//-------------------------------------------------------------------------------

function ln(s)
{
    return s.replace('\n', '<NL>');
}

//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

class Language
{
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

    isWrong(type)
    {
        return this.wrong.includes(type);
    }

    getName()
    {
        return this.name;
    }

    getTypeDefinitions()
    {
        return Object.entries(this.definitions);
    }

    getNumberOfTypes()
    {
        return Object.keys(this.definitions).length;
    }

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
}

class Token
{
    constructor(type, value, start)
    {
        this.type = type;
        this.value = value;
        this.start = start;
    }

    getType()
    {
        return this.type;
    }

    getValue()
    {
        return this.value;
    }

    getStart()
    {
        return this.start;
    }

    toString()
    {
        return `Token ${this.type.padEnd(20)}  |${(ln(this.value) + '|').padEnd(10)}  #${this.value.length}} @${this.getStart()}`;
    }
}

class Lexer
{
    constructor(lang, discards=[])
    {
        if (typeof lang === "string")
        {
            this.lang = LANGUAGES[lang];
        } else if (typeof lang === "object" && lang instanceof Language) {
            this.lang = lang;
        } else {
            throw new Exception(`Lang |${lang}| must be a recognized language or an instance of Language`);
        }
        this.discards = discards;
    }

    getLanguage()
    {
        return this.lang;
    }

    match(start, word, debug=false)
    {
        let matches = [];
        for (const [type, variants] of this.lang.getTypeDefinitions())
        {
            for (let elem of variants)
            {
                //if (debug) console.log(ln(word), 'vs', elem, '=', elem.test(word));
                if (elem.test(word))
                {
                    if (debug) console.log('    Match: ' + type + ' : ' + variants + ' => ' + elem.test(word));
                    matches.push([type, elem, start]);
                }
            }
        }
        return matches;
    }

    lex(text, discards=null, debug=false)
    {
        discards = discards === null ? this.discards : discards;
        let word = '';
        let old = null;
        let matched = [];
        let tokens = [];
        let start = 0;
        for (let i = 0; i < text.length; i++)
        {
            word += text[i];
            if (debug)
            {
                console.log(i, `|${ln(word)}|`);
            }
            matched = this.match(start, word, debug);
            if (debug && matched.length === 0)
            {
                console.log('    no match this turn');
            }

            if (matched.length === 0 && (old === null || old.length === 0))
            {
                // Nothing, we try to add the maximum
                //throw new Error("Impossible to map the language.");
            } else if (matched.length === 0) { // old !== null && old.length > 0
                // Visions: trying to see if there is something after
                if (i + 1 < text.length)
                {
                    let future_index = i + 1;
                    let future_word = word + text[future_index];
                    matched = this.match(start, future_word, debug);
                    if (debug && matched.length > 0)
                    {
                        console.log('    vision of the future OK');
                    }
                }
                // Si et seulement si dans le futur on n'aura rien on fait un jeton, sinon on continue
                if (matched.length === 0)
                {
                    let content =  word.substring(0, word.length-1);
                    if (debug)
                    {
                        console.log('pour le mot ' + content + ' nous avons :');
                        for (let res of old)
                        {
                            console.log('    ' + res[0] + ' : ' + res[1]);
                        }
                    }
                    if (this.lang.isWrong(old[0][0]))
                    {
                        throw new Error(`A wrong token definition ${old[0][0]} : ${old[0][1]} has been validated by the lexer: ${content}`);
                    }
                    if (!discards.includes(old[0][0]))
                    {
                        tokens.push(new Token(old[0][0], content, old[0][2]));
                    }
                    word = '';
                    i -= 1;
                    start = i;
                }
            }
            old = matched;
            matched = [];
        }
        if (old.length > 0)
        {
            let content =  word;
            if (debug)
            {
                console.log('pour le mot ' + content + ' nous avons :');
                for (let res of old)
                {
                    console.log('    ' + res[0] + ' : ' + res[1]);
                }
            }
            if (this.lang.isWrong(old[0][0]))
            {
                throw new Error(`A wrong token definition ${old[0][0]} : ${old[0][1]} has been validated by the lexer: ${content}`);
            }
            if (!discards.includes(old[0][0]))
            {
                tokens.push(new Token(old[0][0], content, old[0][2]));
            }
        } else if (word.length > 0)
        {
            console.log(tokens);
            console.log(word.charCodeAt(0));
            throw new Error(`Text not lexed at the end: ${word}`);
        }
        return tokens;
    }

    to_html(text=null, tokens=null, raws=[])
    {
        if (text === null && tokens === null)
        {
            throw new Error("Nothing send to to_html");
        } else if (text !== null && tokens !== null) {
            throw new Error("Send to to_html text OR tokens, not both!");
        }
        if (text !== null)
        {
            tokens = this.lex(text, []) // don't discard anything, we will produce raws instead
        }
        let output = '';
        for (const tok of tokens)
        {
            if (raws.includes(tok.getType()))
            {
                output += tok.getValue();
            } else {
                let val = tok.getValue();
                val = val.replace('&', '&amp;');
                val = val.replace('>', '&gt;');
                val = val.replace('<', '&lt;');
                output += `<span class="${this.lang.getName()}-${tok.getType()}">${val}</span>`;
            }
        }
        return output;
    }
}

class Test
{
    constructor(lexer, text, result)
    {
        this.lexer = lexer;
        this.text = text;
        this.result = result;
        if (this.result === null || this.result === undefined)
        {
            throw new Error(`No expected results for test ${text}`);
        }
    }

    test(num=0, debug=false)
    {
        let tokens = this.lexer.lex(this.text, null, debug);
        if (tokens.length !== this.result.length)
        {
            let longuest = Math.max(tokens.length, this.result.length);
            for (let index = 0; index < longuest; index++)
            {
                if (index < tokens.length && index < this.result.length)
                {
                    console.log(index, this.result[index], tokens[index].getType(), ln(tokens[index].getValue()));
                } else if (index < tokens.length) {
                    console.log(index, 'null', tokens[index].getType(), ln(tokens[index].getValue()));
                } else if (index < this.result.length) {
                    console.log(index, this.result[index], 'null');
                }
            }
            throw new Error(`Error: expected ${this.result.length} tokens and got ${tokens.length}`);
        }
        for (const [index, r] of this.result.entries())
        {
            if (tokens[index].getType() !== r)
            {
                throw new Error(`Error: expected ${r} and got ${tokens[index].getType()} in ${this.text}`);
            }
        }
        console.log(`[SUCCESS] Test n°${num} Lang : ${this.lexer.getLanguage()}\nText : |${ln(this.text)}|\nResult:`);
        for (const tok of tokens)
        {
            console.log(tok);
        }
    }
}

//-------------------------------------------------------------------------------
// Globals and constants
//-------------------------------------------------------------------------------

// Shared definitions
//var WRONG_INT    = ['[123456789]#*@&*', '0[aAbCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWyYzZ]#*@&*', '00#*@&*'];
//var INTEGER_SEP  = ['#+[#_]*#+'];

const PATTERNS = {
    'IDENTIFIER'    : ['[a-zA-Z]\\w*'],
    'INTEGER'       : ['\\d+'],
    'INTEGER_HEXA'  : ['0[xX][\\dABCDEFabcdef]+'],
    'INTEGER_BIN'   : ['0[bB][01]+'],
    'WRONG_INTEGER' : ['\\d+\\w+'],
    'FLOAT'         : ['\\d+\\.\\d+', '\\d+[eE]-\\d+', '\\d+\\.\\d+[eE]-?\\d+'],
    'WRONG_FLOAT'   : ['\\d+\\.'],
    'BLANKS'        : ['[ \u00A0\\t]+'],
    'NEWLINES'      : ['\n', '\n\r', '\r\n'],
    'OPERATORS'     : ['==', '=', '\\.'],
    'STRINGS'       : ["'([^\\\\]|\\\\['nt])*'", '"([^\\\\]|\\\\["nt])*"'],
    'SEPARATORS'    : ['\\(', '\\)']
};

const LANGUAGES = {
    'ash': new Language('ash',
        {
            'keyword' : ['if', 'then', 'elif', 'else', 'end',
                'while', 'do', 'for',
                'break', 'next', 'return',
                'var', 'fun', 'sub', 'get', 'set', 'class',
                'import', 'from', 'as',
                'try', 'catch', 'finally', 'raise', 'const'],
            'identifier' : PATTERNS["IDENTIFIER"],
            // Old
            'affectation' : ['='],
            'combined_affectation' : ['\\+=', '-=', '\\*=', '/=', '//=', '\\*\\*=', '%='],
            'type' : [':', '->'],
            'fast' : ['=>'],
            'label' : ['::'],
            // 'unary_operator' : ['-', 'not', r'\#', '~'],
            // New
            'integer' : PATTERNS["INTEGER"].concat(PATTERNS["INTEGER_BIN"]).concat(PATTERNS["INTEGER_HEXA"]),
            'number' : PATTERNS["FLOAT"],
            'boolean' : ['false', 'true'],
            'nil': ['nil'],
            // 'binary_operator' : ['and', 'or', # boolean
            'operator' : ['-', 'not', '#', '~', 'and', 'or', // boolean
                'in', // belongs to
                '\\+', '-', '\\*', '/', '//', '\\*\\*', '%', // mathematical
                '&', '\\|', '~', '>>', '<<', // bitwise
                '<', '<=', '>', '>=', '==', '!=', // comparison
                '\\.'], // call
            'separator': ['\\{', '\\}', '\\(', '\\)', '\\[', '\\]', ',', ';'],
            'wrong_int' : PATTERNS["WRONG_INTEGER"],
            'blank': PATTERNS["BLANKS"],
            'newline' : PATTERNS["NEWLINES"],
            'comment': ['--[^\n]*(\n|$)'],
            'string' : PATTERNS["STRINGS"],
        },
        ['wrong_int'],
        // Special
        {
            'ante_identifier': ['var', 'const', 'function', 'procedure', 'fun', 'pro', 'class', 'module'],
        }
    ),
    'bnf': new Language('bnf',
        {
            'keyword': ['<[\\w- ]+>'],  // non-terminal
            'identifier': ['expansion', 'A', 'B', 'C', 'D', 'nom'], // expansion
            'operator': ['::=', '\\|', '\\.\\.\\.', '=', '-', '\\?', '\\*', '\\+', '@', '\\$', '_'],
            'separator': ['\\(', '\\)', '\\[', '\\]', '\\{', '\\}', ',', ';'],
            'string' : ['"[\\w- <>:=,;\\|\']*"', "'[\\w- <>:=,;\\|\"]*'"], // terminal
            'blank': PATTERNS['BLANKS'],
            'comment': ['#[^\n]*\n'],
            'newline' : PATTERNS['NEWLINES'],
        }
    ),
    'bnf-mini': new Language('bnf-mini',
        {
            'keyword': ['<[\\w- ]+>'],   // non-terminal
            'string' : PATTERNS['STRINGS'], // terminal
            'operator': ['::=', '\\|'],    // affect and choice
            'blank': PATTERNS['BLANKS'],
            'newline' : PATTERNS['NEWLINES'],
            'comment': ['\\#.*'],
        }
    ),
    'fr': new Language('fr',
        {
            'word': ['[a-zA-ZéàèùâêîôûëïüÿçœæÉÀÈÙÂÊÎÔÛËÏÜŸÇŒÆ]+'],
            'punct': [',', '\\.', ':', ';', '-', '\\(', '\\)', '!', '\\?', "'", '"'],
            'blank': [' ', '\n', '\t']
        }
    ),
    'game': new Language('game',
        {
            'number': ['\\d+'],
            'normal': ['\\w[\\w\'-]*'], // Total Annihilation => 2 tokens, Baldur's => 1, Half-life => 1
            'blank': PATTERNS['BLANKS'],
            'wrong_int' : PATTERNS['WRONG_INTEGER'],
            'newline' : ['\n'],
            'operator': [':'] // FarCry:
        }
    ),
    'hamill' : new Language('hamill',
        {
            'keyword': ['var', 'const', 'include', 'require', 'css', 'html'],
            'identifier' : PATTERNS["IDENTIFIER"],
            'integer' : PATTERNS["INTEGER"],
            'boolean' : ['true', 'false'],
            'nil': [],
            'operator': [':'],
            'separator' : ['\\{', '\\}', '#', '\\.'],
            'wrong_int' : PATTERNS["WRONG_INTEGER"],
            'blank': PATTERNS["BLANKS"],
            'newline' : PATTERNS["NEWLINES"],
            'comment': ['§§.*(\n|$)'],
        },
        ['wrong_int'],
        // Special
        {
            'ante_identifier': ['var', 'const'],
            'accept_unknown': true,
            'string_markers': [],
            'number' : true
        }
    ),
    'json': new Language('json',
        {
            'boolean': ['true', 'false'],
            'identifier' : PATTERNS['IDENTIFIER'],
            'number' : PATTERNS['INTEGER'].concat(PATTERNS['FLOAT']),
            'string' : PATTERNS['STRINGS'],
            'nil': [],
            'keyword': ['null'],
            'operator': [],
            'separator': ['\\{', '\\}', '\\(', '\\)', '\\[', '\\]', ',', ':', "\\."],
            'comment' : [],
            'newline' : PATTERNS['NEWLINES'],
            'blank': PATTERNS['BLANKS'],
            'wrong_int' : PATTERNS['WRONG_INTEGER'],
        },
        ['wrong_int'],
        // Special
        {
            'ante_identifier': [],
        }
    ),
    // Un langage qui divise simplement en lignes
    'line': new Language('line',
        {
            'line': ['.*(\n|$)']
        }
    ),
    'lua': new Language('lua',
        {
            'keyword': ['and', 'break', 'do', 'else', 'elseif', 'end', 'for',
                        'function', 'goto', 'if', 'in', 'local', 'not', 'or',
                        'repeat', 'return', 'then', 'until', 'while'],
            'special': ['ipairs', 'pairs', '\\?', 'print'], // ? is here for demonstration only */
            'boolean': ['true', 'false'],
            'nil' : ['nil'],
            'identifier' : PATTERNS['IDENTIFIER'],
            'number' : ['\\d+', '\\d+\\.\\d+'],
            'string' : PATTERNS['STRINGS'],
            'operator': ['==', '~=', '<', '<=', '>', '>=',
                         '=',
                         '\\+', '\\*', '-', '/', '%', '\\^',
                         '&', '\\|', '~', '>>', '<<',
                         '\\.', '\\.\\.',
                         '#', ':'],
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
    'python': new Language('python',
        {
            'keyword' : ['await', 'else', 'import', 'pass', 'break', 'except', 'in',
                     'raise', 'class', 'finally', 'is', 'return', 'and', 'for',
                     'continue', 'lambda', 'try', 'as', 'def', 'from', 'while',
                     'nonlocal', 'assert', 'del', 'global', 'not', 'with', 'if',
                     'async', 'elif', 'or', 'yield'],
            'special': ['print'],
            'identifier' : PATTERNS["IDENTIFIER"],
            'integer' : PATTERNS["INTEGER"].concat(PATTERNS["INTEGER_HEXA"]).concat(PATTERNS["INTEGER_BIN"]),
            'float' : PATTERNS["FLOAT"],
            'boolean' : ['True', 'False'],
            'string' : PATTERNS["STRINGS"],
            'nil': ['None'],
            'operator': ['\\+', '/', '//', '&', '\\^', '~', '\\|', '\\*\\*', '<<', '%', '\\*',
                      '-', '>>', ':', '<', '<=', '==', '!=', '>=', '>', '\\+=',
                      '&=', '/=', '<<=', '%=', '\\*=', '\\|=', '\\*\\*=', '>>=', '-=',
                      '/=', '\\^=', '\\.', '='],
            'separator': ['\\{', '\\}', '\\(', '\\)', '\\[', '\\]', ',', ';'],
            'comment': ['#[^\n]*(\n|$)'],
            'newline' : PATTERNS["NEWLINES"],
            'blank': PATTERNS["BLANKS"],
            'wrong_int' : PATTERNS["WRONG_INTEGER"],
        },
        ['wrong_int'],
        // Special
        {
            'ante_identifier': ['def', 'class'],
        }
    ),
    'test': new Language('test',
        {
            'keyword': ['if', 'then', 'end'],
            'identifier': PATTERNS['IDENTIFIER'],
            'integer': PATTERNS['INTEGER'].concat(PATTERNS['INTEGER_HEXA']),
            'wrong_integer': PATTERNS['WRONG_INTEGER'],
            'float': PATTERNS['FLOAT'],
            //'wrong_float': WRONG_FLOAT,
            'blank': PATTERNS['BLANKS'],
            'newline': PATTERNS['NEWLINES'],
            'operators': PATTERNS['OPERATORS'],
            'separators': PATTERNS['SEPARATORS'],
            'strings': PATTERNS['STRINGS']
        },
        ['wrong_integer']), //, 'wrong_float']);
    'text': new Language('text', {
        'normal': ['[^ \\t]*'],
        'blank': PATTERNS['BLANKS'],
        'newline': PATTERNS['NEWLINES'],
        }),
}

const LEXERS = {
    'ash': new Lexer(LANGUAGES['ash'], ['blank']),
    'bnf': new Lexer(LANGUAGES['bnf'], ['blank']),
    'bnf-mini': new Lexer(LANGUAGES['bnf-mini'], ['blank']),
    'fr': new Lexer(LANGUAGES['fr'], ['blank']),
    'game': new Lexer(LANGUAGES['game'], ['blank', 'newline']),
    'hamill': new Lexer(LANGUAGES['hamill'], ['blank']),
    'json': new Lexer(LANGUAGES['json'], ['blank', 'newline']),
    'line': new Lexer(LANGUAGES['line']),
    'lua': new Lexer(LANGUAGES['lua'], ['blank']),
    'python': new Lexer(LANGUAGES['python']),
    'text': new Lexer(LANGUAGES['text'], ['blank'])
}

const TESTS = [
    new Test(LEXERS['line'], "bonjour\ntoi qui\nvient de loin", ['line', 'line', 'line']),
    new Test(LEXERS['fr'], "bonjour l'ami !", ['word', 'word', 'punct', 'word', 'punct']),
    new Test(LEXERS['text'], "je suis là", ['normal', 'normal', 'normal']),
    new Test(LEXERS['game'], "Baldur's Gate\nTotal Annihilation\nHalf-Life\nFar Cry: Blood Dragon",
             ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'operator', 'normal', 'normal']),
    new Test(LEXERS['json'], "{'alpharius': 20, 'heretic': true}",
             ['separator', 'string', 'separator', 'number', 'separator', 'string', 'separator', 'boolean', 'separator']),
    new Test(LEXERS['bnf'], "<rule 1> ::= 'terminal1' 'terminal2'",
             ['keyword', 'operator', 'string', 'string']),
    new Test(LEXERS['bnf-mini'], "<rule xtrem> ::= 'terminal xtrem'", ['keyword', 'operator', 'string']),
    new Test(LEXERS['python'], "def a():\n\tif a == 5:\n\t\tprint('hello')",
             ['keyword', 'blank', 'identifier', 'separator', 'separator', 'operator', 'newline',
              'blank', 'keyword', 'blank', 'identifier', 'blank', 'operator', 'blank', 'integer', 'operator', 'newline',
              'blank', 'special', 'separator', 'string', 'separator']),

    new Test(LEXERS['hamill'], "§§ ceci est un commentaire\n§§ ceci est un autre", ['comment', 'comment']),
    new Test(LEXERS['lua'], '3+5', ['number', 'operator', 'number']),
    new Test(LEXERS['lua'], 'a = 5', ['identifier', 'operator', 'number']),
    new Test(LEXERS['lua'], 't = { ["k1"] = 5 }', ['identifier', 'operator', 'separator', 'separator', 'string', 'separator', 'operator', 'number', 'separator']),
    new Test(LEXERS['lua'], 't = { ["k1"] = 5, ["k2"] = "v", [4] = 6 } -- Définition\nprint(t["k1"]) -- Accès\nprint(t.k1) -- Accès avec sucre syntaxique',
            ['identifier', 'operator', 'separator', 'separator', 'string', 'separator', 'operator', 'number', 'separator',
             'separator', 'string', 'separator', 'operator', 'string', 'separator', 'separator', 'number', 'separator', 'operator', 'number',
             'separator', 'comment', 'special', 'separator', 'identifier', 'separator', 'string', 'separator', 'separator', 'comment',
             'special', 'separator', 'identifier', 'operator', 'identifier', 'separator', 'comment']),
    new Test(LEXERS['lua'], '--[[Ceci est un\nz--]]', ['comment']),
    new Test(LEXERS['lua'], '--[[Ceci est un\ncommentaire multiligne--]]', ['comment']),

    new Test(LEXERS['ash'], "a ** 5", ['identifier', 'operator', 'integer']),
    new Test(LEXERS['ash'], 'writeln("hello")', ['identifier', 'separator', 'string', 'separator']),
    new Test(LEXERS['ash'], 'if a == 5 then\n    writeln("hello")\nend',
                ['keyword', 'identifier', 'operator', 'integer', 'keyword', 'newline',
                 'identifier', 'separator', 'string', 'separator', 'newline',
                 'keyword'])
]

//const TESTS2 = [new Test(LEXERS['lua'], '3+5', ['number', 'operator', 'number']),]

function tests(debug=false)
{
    const text = "if a == 5 then\nprintln('hello')\nend\nendly = 5\na = 2.5\nb = 0xAE\nc = 2.5.to_i()\nd = 2.to_s()\n"; //5A";
    //const text = "if a == 5";
    let lexer = new Lexer(LANGUAGES['test'], ['blank']);
    let tokens = lexer.lex(text);
    console.log('Text:', text);
    for (const [index, tok] of tokens.entries())
    {
        console.log(`${index.toString().padStart(4)}  ` + tok.toString());
    }

    for (const [index, t] of TESTS.entries())
    {
        t.test(index + 1, debug);
    }

    console.log(LEXERS['lua'].to_html("if a >= 5 then println('hello') end", null, ['blank']));
}

//tests(true);

export {ln, Language, Token, Lexer, LANGUAGES, PATTERNS, LEXERS};
