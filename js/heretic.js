const IDENTIFIER = ['\\w+'];
const INTEGER = ['\\d+'];
const SPACES = ['[ \\t]+'];
const NEWLINE = ['\n', '\n\r', '\r\n'];
const OPERATORS = ['==', '='];
const STRINGS = ["'.*'"];
const SEPARATORS = ['\\(', '\\)'];

const lang = {
    'keyword': ['if', 'then', 'end'],
    'identifier': IDENTIFIER,
    'integer': INTEGER,
    'blanks': SPACES,
    'newline': NEWLINE,
    'operators': OPERATORS,
    'separators': SEPARATORS,
    'strings': STRINGS
};

const discards = ['blanks'];

class NeoToken
{
    constructor(type, value)
    {
        this.type = type;
        this.value = value;
    }

    toString()
    {
        return `Token ${this.type.padEnd(10)}  |${(this.value.replace('\n', '<NL>') + '|').padEnd(10)}  #${this.value.length}}`;
    }
}

for (const [typ, variants] of Object.entries(lang))
{
    for (let index of Object.keys(variants))
    {
        variants[index] = new RegExp('^' + variants[index] + '$');
    }
}

const text = "if a == 5 then\nprintln('hello')\nend\nendly = 5";

let word = '';
let old = null;
let matched = [];
let tokens = [];
for (let i = 0; i < text.length; i++)
{
    word += text[i];
    console.log(i, `|${word}|`);
    for (const [typ, variants] of Object.entries(lang))
    {
        for (let elem of variants)
        {
            console.log('    ' + typ + ' : ' + variants + ' => ' + elem.test(word));
            if (elem.test(word))
            {
                matched.push([typ, elem]);
            }
        }
    }
    if (matched.length === 0 && (old === null || old.length === 0))
    {
        // Nothing, we try to add the maxixum
        //throw new Error("Impossible to map the language.");
    } else if (matched.length === 0) { // old !== null && old.length > 0
        let content =  word.substring(0, word.length-1);
        console.log('pour le mot ' + content + ' nous avons :');
        /*for (let res of old)
        {
            console.log('    ' + res[0] + ' : ' + res[1]);
        }*/
        if (!discards.includes(old[0][0]))
        {
            tokens.push(new NeoToken(old[0][0], content));
        }
        word = '';
        i -= 1;
    }
    old = matched;
    matched = [];
}
if (old.length > 1)
{
    let content =  word;
    console.log('pour le mot ' + content + ' nous avons :');
    /*for (let res of old)
    {
        console.log('    ' + res[0] + ' : ' + res[1]);
    }*/
    if (!discards.includes(old[0][0]))
    {
        tokens.push(new NeoToken(old[0][0], content));
    }
}

for (let tok of tokens)
{
    console.log(tok.toString());
}