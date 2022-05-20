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
    return s.replace(/\n/g, '<NL>');
}

//-------------------------------------------------------------------------------
// Class
//-------------------------------------------------------------------------------

class Language
{
    constructor(name, definitions, wrong=[], specials={}, after=null)
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
        this.after = after;
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
        if (DEBUG)
        {
            console.log(`Creating {Token} type=${type} value=|${value}| start=${start}`);
        }
        this.type = type;
        this.value = value;
        this.start = start;
    }

    is(value, type=null, start=null)
    {
        let ok_value = (value === null ? true : this.value === value);
        let ok_type  = (type  === null ? true : this.type  === type);
        let ok_start = (start === null ? true : this.start === start);
        return ok_value && ok_type && ok_start;
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

    info()
    {
        return `Token ${this.type.padEnd(20)}  |${(ln(this.value) + '|').padEnd(10)}  #${this.value.length} @${this.getStart()}`;
    }

    toString()
    {
        return `{Token ${this.type}  |${ln(this.value)}|  #${this.value.length} @${this.getStart()}}`;
    }
}

class Match
{
    constructor(type, elem, start)
    {
        if (DEBUG)
        {
            console.log(`Creating {Match} type=${type} elem=${elem} start=${start}`);
        }
        this.type = type;
        this.elem = elem;
        this.start = start;
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

    match(start, word)
    {
        let matches = [];
        for (const [type, variants] of this.lang.getTypeDefinitions())
        {
            for (let elem of variants)
            {
                //if (DEBUG) console.log(ln(word), 'vs', elem, '=', elem.test(word));
                if (elem.test(word))
                {
                    if (DEBUG) console.log('    Match: ' + type + ' : ' + variants + ' => ' + elem.test(word));
                    matches.push(new Match(type, elem, start));
                }
            }
        }
        return matches;
    }

    lex(text, discards=null)
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
            if (DEBUG)
            {
                console.log(start, `${i}. @start |${ln(word)}|`);
            }
            matched = this.match(start, word);
            if (DEBUG && matched.length === 0)
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
                    matched = this.match(start, future_word);
                    if (DEBUG && matched.length > 0)
                    {
                        console.log('    vision of the future OK');
                    }
                }
                // Si et seulement si dans le futur on n'aura rien on fait un jeton, sinon on continue
                if (matched.length === 0)
                {
                    let content =  word.substring(0, word.length-1);
                    if (DEBUG)
                    {
                        console.log(`pour le mot |${content}| nous avons :`);
                        for (let res of old)
                        {
                            console.log('    ' + res.type + ' : ' + res.elem + ' @' + res.start);
                        }
                    }
                    if (this.lang.isWrong(old[0].type))
                    {
                        throw new Error(`A wrong token definition ${old[0].type} : ${old[0].elem} has been validated by the lexer: ${content}`);
                    }
                    if (!discards.includes(old[0].type))
                    {
                        tokens.push(new Token(old[0].type, content, old[0].start));
                    }
                    word = '';
                    i -= 1;
                    start = old[0].start + content.length;
                }
            }
            old = matched;
            matched = [];
        }
        if (old !== null && old.length > 0)
        {
            let content =  word;
            if (DEBUG)
            {
                console.log('pour le mot ' + content + ' nous avons :');
                for (let res of old)
                {
                    console.log('    ' + res.type + ' : ' + res.start);
                }
            }
            if (this.lang.isWrong(old[0].type))
            {
                throw new Error(`A wrong token definition ${old[0].type} : ${old[0].elem} has been validated by the lexer: ${content}`);
            }
            if (!discards.includes(old[0].type))
            {
                tokens.push(new Token(old[0].type, content, old[0].start));
            }
        } else if (word.length > 0)
        {
            console.log(tokens);
            console.log(word.charCodeAt(0));
            throw new Error(`Text not lexed at the end: ${word}`);
        }
        if (this.lang.after !== null)
        {
            tokens = this.lang.after(tokens);
        }
        return tokens;
    }

    to_html(text=null, tokens=null, raws=[], enumerate=false)
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
        if (DEBUG)
        {
            for (const tok of tokens)
            {
                console.log('    to_html', tok);
            }
        }
        let output = '';
        let nb = 0;
        for (let i = 0; i < tokens.length; i++)
        {
            const tok = tokens[i];
            const next = (i + 1 < tokens.length) ? tokens[i+1] : null;
            if (raws.includes(tok.getType()))
            {
                output += tok.getValue();
            } else {
                let val = tok.getValue();
                val = val.replace('&', '&amp;');
                val = val.replace('>', '&gt;');
                val = val.replace('<', '&lt;');
                output += `<span class="${this.lang.getName()}-${tok.getType()}" title="token n°${nb} : ${tok.getType()}">${val}</span>`;
                if (enumerate)
                {
                    console.log(tok);
                    if (['integer', 'number', 'identifier', 'boolean'].includes(tok.getType()))
                    {
                        if (next != null && ['operator', 'keyword'].includes(next.getType()))
                        {
                            output += ' ';
                        }
                    }
                    else if (['keyword'].includes(tok.getType()))
                    {
                        if (!(['next', 'break', 'return'].includes(tok.getValue())))
                        {
                            output += ' ';
                        }
                    }
                    else if (next != null && ['affectation', 'combined_affectation'].includes(next.getType()))
                    {
                            output = ' '  + output + ' ';
                    }
                    else if (tok.is(',', 'separator'))
                    {
                        output += ' ';
                    }
                    else if (tok.is(null, 'operator'))
                    {
                        output += ' ';
                    }
                    // output += `<sup class='info'>${nb}</sup><span> </span>`;
                }
            }
            nb += 1;
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

    test(num=0)
    {
        let tokens = this.lexer.lex(this.text, null);
        if (tokens.length !== this.result.length)
        {
            console.log('ERROR\nText: |' + this.text + '|');
            console.log('Difference of length, dumping:')
            let longuest = Math.max(tokens.length, this.result.length);
            for (let index = 0; index < longuest; index++)
            {
                if (index < tokens.length && index < this.result.length)
                {
                    let cmp = (this.result[index] === tokens[index].getType());
                    console.log(`${index}. ${cmp} Expected=${this.result[index]} vs ${tokens[index].getType()} (${ln(tokens[index].getValue())})`);
                } else if (index < tokens.length) {
                    console.log(`${index}. Expected=null [null] vs ${tokens[index].getType()}`, ln(tokens[index].getValue()));
                } else if (index < this.result.length) {
                    console.log(`${index}. Expected=${this.result[index]} vs null`);
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
        console.log(`[SUCCESS] Test n°${num} Lang : ${this.lexer.getLanguage()}\n    Text : |${ln(this.text)}|\n    Result:`);
        for (const tok of tokens)
        {
            console.log('   ', tok);
        }
        console.log();
    }
}


class Node
{
    constructor(content=null)
    {
        this.content = content;
    }

    toString()
    {
        if (this.content === null)
        {
            return this.constructor.name;
        } else {
            return this.constructor.name + " { content: " + this.content + " }";
        }
    }
}

class Text extends Node {}
class Comment extends Node {}
class Div extends Node {}
class Markup extends Node {}
class RawHTML extends Node {}
class NewLine extends Node {}
class EndOfParagraph extends Node {}
class Title extends Node
{
    constructor(content, level)
    {
        super(content);
        this.level = level;
    }
}
class Link extends Node {}
class HR extends Node {}
class Include extends Node {}
class Macro extends Node {}
class TableSeparator extends Node {}
class TableHeader extends Node {}
class TableLineEnd extends Node {}
class TableLineStart extends Node
{
    constructor(header=false)
    {
        super(null);
        this.header = header;
    }

    toString()
    {
        if (this.header)
        {
            return 'TableLineStart (header)';
        }
        else
        {
            return 'TableLineStart';
        }
    }
}

class Document
{
    constructor()
    {
        this.constants = {};
        this.required = [];
        this.css = [];
        this.labels = {};
        this.nodes = [];
    }

    add_constant(k, v)
    {
        this.constants[k] = v;
    }

    add_required(r)
    {
        this.required.push(r);
    }

    add_css(c)
    {
        this.css.push(c);
    }

    add_label(l, v)
    {
        this.labels[l] = v;
    }

    add_node(n)
    {
        this.nodes.push(n);
    }

    get_constant(target, default_value=null)
    {
        if (! (target in this.constants))
        {
            if (default_value === null)
            {
                for (const label in this.constants)
                {
                    console.log(label);
                }
                throw new Error("Constant not found : " + target);
            }
            else
            {
                return default_value;
            }
        }
        return this.constants[target];
    }

    get_label(target)
    {
        if (! (target in this.labels))
        {
            for (const label in this.labels)
            {
                console.log(label);
            }
            throw new Error("Label not found : " + target);
        }
        return this.labels[target];
    }

    make_anchor(text)
    {
        return text.toLocaleLowerCase().replace(/ /g, '-');
    }

    to_html(discard_comment=true)
    {
        let start_time = new Date();
        let content = `<html lang="fr">
<head>
  <meta charset=utf-8>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${this.get_constant('TITLE', 'Undefined title')}</title>
  <link rel="icon" href="https://xitog.github.io/dgx/img/favicon.ico" type="image/x-icon" />
  <link rel="shortcut icon" href="https://xitog.github.io/dgx/img/favicon.ico" type="image/x-icon" />\n`;
        // For CSS
        if (this.required.length > 0)
        {
            for (let req of this.required)
            {
                if (req.endsWith('.css'))
                {
                    content += `  <link href="${req}" rel="stylesheet">\n`;
                }
            }
        }
        if (this.css.length > 0)
        {
            content += '<style type="text/css">\n';
            for (let cs of this.css)
            {
                content += cs + "\n";
            }
            content += '</style>\n';
        }
        // For javascript
        if (this.required.length > 0)
        {
            for (let req of this.required)
            {
                if (req.endsWith('.js'))
                {
                    content += `<script src="${req}"></script>\n`;
                }
            }
        }
        content += "</head>\n";
        content += "<body>\n";
        let first_text = true;
        let not_processed = 0;
        let types_not_processed = [];
        let in_table = false;
        let in_header_line = false;
        for (const [index, node] of this.nodes.entries())
        {
            //console.log(index, node, first_text);
            let next = null;
            if (index + 1 < this.nodes.length)
            {
                next = this.nodes[index + 1];
            }
            if (node instanceof Text)
            {
                if (first_text && !in_table)
                {
                    content += "<p>";
                    first_text = false;
                }
                content += node.content;
            }
            else if (node instanceof NewLine)
            {
                if (in_table)
                {
                    content += "</table>\n";
                    in_table = false;
                    content += "\n";
                }
            }
            else if (node instanceof EndOfParagraph)
            {
                if (!in_table)
                {
                    content += "</p>\n";
                    first_text = true;
                } else {
                    content += "</table>\n";
                    in_table = false;
                    content += "\n";
                }
            }
            else if (node instanceof Comment)
            {
                if (!discard_comment)
                {
                    content += '<!-- ' + node.content + ' -->\n';
                }
            }
            else if (node instanceof HR)
            {
                content += "<hr>\n";
            } else if (node instanceof Title)
            {
                content += `<h${node.level} id="${this.make_anchor(node.content)}">${node.content}</h${node.level}>\n`;
            }
            else if (node instanceof TableLineStart)
            {
                if (!first_text)
                {
                    content += "</p>\n";
                }
                first_text = true;
                if (in_table && node.header)
                {
                    throw new Error("Header line inside a table at " + index);
                }
                else if (!in_table)
                {
                    content += "<table>\n";
                    in_table = true;
                    if (node.header)
                    {
                        in_header_line = true;
                    }
                }
                if (in_header_line)
                {
                    content += '<tr><th>';
                }
                else
                {
                    content += "<tr><td>";
                }
            }
            else if (node instanceof TableLineEnd)
            {
                if (in_header_line)
                {
                    content += "</th></tr>\n";
                    in_header_line = false;
                }
                else
                {
                    content += "</td></tr>\n";
                }
            }
            else if (node instanceof TableSeparator)
            {
                if (in_header_line)
                {
                    content += "</th><th>"
                }
                else
                {
                    content += "</td><td>";
                }
            }
            else if (node instanceof Link)
            {
                // [[label]] (you must define somewhere ::label:: https://) display = url
                // [[https://...]] display = url
                // [[display->label]] (you must define somewhere ::label:: https://)
                // [[display->https://...]]
                let parts = node.content.split('->');
                let link_display = null;
                let link_url = null;
                if (parts.length === 1)
                {
                    link_display = parts[0];
                    if (parts[0].substring(0, 7) === 'http://' || parts[0].substring(0, 8) === 'https://')
                    {
                        link_url = parts[0];
                    }
                    else
                    {
                        link_url = this.get_label(parts[0]);
                    }
                }
                else
                {
                    link_display = parts[0];
                    // HACK
                    let tokens = LEXERS['hamill'].lex(link_display);
                    let in_sup = false;
                    let in_sub = false;
                    let in_bold = false;
                    let in_italic = false;
                    let in_underline = false;
                    let in_stroke = false;
                    link_display = '';
                    for (let tok of tokens)
                    {
                        switch (tok.getType())
                        {
                            case 'normal':
                                link_display += tok.getValue();
                                break;
                            case 'sup':
                                if (!in_sup) { link_display += '<sup>'; in_sup = true; }
                                else { link_display += '</sup>'; in_sup = false; }
                                break;
                            case 'sub':
                                if (!in_sub) { link_display += '<sub>'; in_sub = true; }
                                else { link_display += '</sub>'; in_sub = false; }
                                break;
                            case 'bold':
                                if (!in_bold) { link_display += '<b>'; in_bold = true; }
                                else { link_display += '</b>'; in_bold = false; }
                                break;
                            case 'italic':
                                if (!in_italic) { link_display += '<i>'; in_italic = true; }
                                else { link_display += '</i>'; in_italic = false; }
                                break;
                            case 'underline':
                                if (!in_underline) { link_display += '<u>'; in_underline = true; }
                                else { link_display += '</u>'; in_underline = false; }
                                break;
                            case 'stroke':
                                if (!in_stroke) { link_display += '<s>'; in_stroke = true; }
                                else { link_display += '</s>'; in_stroke = false; }
                                break;
                            default:
                                throw new Error("Miniparsing doesn't authorize this kind of token: " + tok);
                        }

                    }
                    if (parts[1].substring(0, 7) === 'http://' || parts[1].substring(0, 8) === 'https://')
                    {
                        link_url = parts[1];
                    }
                    else
                    {
                        link_url = this.get_label(parts[1]);
                    }
                }
                content += `<a href="${link_url}">${link_display}</a>`;
            }
            else if (node instanceof Div)
            {
                let parts = node.content.split(' ');
                if (parts.length === 1 && parts[0].trim() === 'end')
                {
                    content += '</div>\n';
                    continue;
                }
                let div_id = null;
                let div_class = null;
                for (let i in parts)
                {
                    let p = parts[i];
                    p = p.trim();
                    // Reading
                    if (p.substring(0,1) === '#')
                    {
                        div_id = p.substring(1);
                    }
                    else if (p.substring(0,1) === '.')
                    {
                        div_class = p.substring(1);
                    }
                }
                // Producing
                if (div_id === null && div_class === null)
                {
                    content += "<div>\n";
                }
                else if (div_id !== null && div_class === null)
                {
                    content += `<div id="${div_id}">\n`;
                }
                else if (div_id === null && div_class !== null)
                {
                    content += `<div class="${div_class}">\n`;
                }
                else
                {
                    content += `<div id="${div_id}" class="${div_class}">\n`;
                }
            }
            else if (node instanceof RawHTML)
            {
                content += node.content + "\n";
            }
            else if (node instanceof Markup)
            {
                let klass = null;
                if (node.content.substring(0,1) === '.')
                {
                    if (node.content.indexOf(' ') !== -1)
                    {
                        klass = node.content.substring(1, node.content.indexOf(' '));
                    }
                    else
                    {
                        klass = node.content.substring(1);
                    }
                }
                if (node.content.indexOf(' ') !== -1)
                {
                    let text = node.content.substring(klass.length + 2); // +2 because '.' before and ' ' after must be removed
                    content += `<span class="${klass}">${text}</span>`;
                }
                else
                {
                    if (!first_text)
                    {
                        throw new Error(`Impossible to declare a paragraph with {{.class}} inside a paragraph with ${node} at ${index}`);
                    }
                    content += `<p class="${klass}">`;
                    first_text = false;
                }
            }
            else if (node instanceof Macro)
            {
                if (node.content === "[=GENDATE]")
                {
                    content += new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                }
                else
                {
                    throw new Error("Macro unknown: " + node.content);
                }
            }
            else if (node instanceof Include)
            {
                let file = fs.readFileSync(node.content);
                content += file + "\n";
            }
            else
            {
                console.log('Pb : ', index, "" + node, node.constructor.name);
                not_processed += 1;
                if (!(node.constructor.name in types_not_processed))
                {
                    types_not_processed[node.constructor.name] = 0;
                }
                types_not_processed[node.constructor.name] += 1;
            }
        }
        if (in_table)
        {
            content += "</table>\n";
        }
        if (!first_text)
        {
            content += "</p>\n";
        }
        content += "</body>";
        console.log('\nNodes not processed:', not_processed, '/', this.nodes.length, 'types :');
        for (let [k, v] of Object.entries(types_not_processed))
        {
            console.log('   -', k, v);
        }
        let end_time = new Date();
        let elapsed = (end_time - start_time)/1000;
        console.log('Processed in:        %ds', elapsed, '\n');
        return content;
    }

    info()
    {
        console.log('\n------------------------------------------------------------------------');
        console.log('Liste des nodes du document');
        console.log('------------------------------------------------------------------------\n');
        for (const [index, node] of this.nodes.entries())
        {
            console.log(index, node.toString());
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
    'STRINGS'       : ["'([^\\\\']|\\\\['nt])*'", '"([^\\\\"]|\\\\["nt])*"'],
    'SEPARATORS'    : ['\\(', '\\)']
};

const SHORTCUTS = {
    'keyword': 'kw',
    'special': 'spe',
    'identifier': 'id',
    'affectation': 'aff',
    'combined_affectation': 'aff',
    'separator': 'sep',
    'operator': 'op',
    'comment': 'com',

    'boolean': 'bool',
    'integer': 'int',
    'number': 'num',
    'float': 'flt',
    'string': 'str',
}

const LANGUAGES = {
    'ash': new Language('ash',
        {
            'keyword' : ['if', 'then', 'elif', 'else', 'end',
                'while', 'do', 'for',
                'break', 'next', 'return',
                'var', 'fun', 'sub', 'get', 'set', 'class',
                'import', 'from', 'as',
                'try', 'catch', 'finally', 'raise', 'const'],
            'special': ['writeln', 'write'],
            'boolean' : ['false', 'true'],
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
            'comment': ['--[^\n]*'],
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
            'macro': ['\\[=GENDATE\\]'],
            'newline' : PATTERNS["NEWLINES"],
            'paragraph': ['(\n|\n\r|\r\n){2}'],
            'comment': ['//.*(\n|$)'],
            'markup': ['\\{\\{[^\\}]*\\}\\}'],
            'list': ['^([\t ])*(\\* )+'],
            //'link': ['[ \t]*\\[\\[[^\\]]*\\]\\][ \t]*'],
            'link': ['\\[\\[[^\\]]*\\]\\]*'],
            'bold': ['\\*\\*'],
            'special': ['\\\\\\*\\*', '\\*',"'", '\\^'],
            'italic': ["''"],
            'sup': ["\\^\\^"],
            'title': ['#+[^\n\r]*'],
            'hr': ['---[\n\r]'],
            'const': ['!const [^\n\r]*'],
            'var': ['!var [^\n\r]*'],
            'require': ['!require [^\n\r]*'],
            'include': ['!include [^\n\r]*'],
            'css': ['!css [^\n\r]*'],
            'html': ['!html [^\n\r]*'],
            'label': ['::[^:\n\r]*::[ \t]*'],
            'url': ['(https://|http://)[\\w\\./#]*'],
            'url_wrong': ['(https:|http:)'],
            'table_header_line': ['\\|-+\\|'],
            //'table_line': ['\\|[^\n\r]\\|'],
            //'normal': ["([^\\\\*'/\n\r]|\\\\\\*\\*|\\\\\\*|\\\\''|\\\\')+"], //|\\::|\\:)+"],
            'table': ['\\|'],
            'table_header_wrong': ['\\|-+'],
            'normal': ["[^\n\r\\*'\\|\\{\\[:\\^]*"]
        },
        // Nous avons besoin de "sustainers". Des définitions de tokens qui vont permettre d'atteindre le bon token.
        // Sinon https: s'arrêterait au ":" il ferait un <normal, https> puisque https: ne correspond à rien,
        // ni le "futur", càd https:/ Il faut au moins deux / pour embrayer sur la définition url.
        // On a pas ça avec les tokens d'un langage de prog. Ils se contiennent eux-mêmes :
        // i sera valide en id, même s'il fait partir de if plus tard.
        ['table_header_wrong', 'url_wrong'],
        // Special
        {
            'ante_identifier': ['var', 'const'],
            'string_markers': [],
        },
        function(tokens)
        {
            let res = [];
            // Première passe, fusion des speciaux / liste
            for (const [index, tok] of tokens.entries())
            {
                if (tok.getType() === 'special' || (tok.getType() === 'list' && index > 0 && !['newline', 'table'].includes(tokens[index-1].getType())))
                {
                    if (index > 0 && res.length > 0 && res[res.length - 1].getType() === 'normal')
                    {
                        res[res.length - 1].value += tok.getValue();
                    }
                    else if (index + 1 < tokens.length && tokens[index + 1].getType() === 'normal')
                    {
                        tokens[index + 1].value = tok.getValue() + tokens[index + 1].value;
                        tokens[index + 1].start -= tok.getValue().length;
                    }
                } else {
                    res.push(tok);
                }
            }
            // Seconde passe, fusion des normaux
            let res2 = [];
            let index = 0;
            while (index < res.length)
            {
                let tok = res[index];
                if (tok.getType() === 'normal')
                {
                    let futur = index + 1;
                    let merged_value = tok.getValue();
                    while (futur < res.length && res[futur].getType() === 'normal')
                    {
                        merged_value += res[futur].getValue();
                        futur += 1;
                    }
                    tok.value = merged_value;
                    res2.push(tok);
                    index = futur;
                }
                else
                {
                    res2.push(tok);
                    index+=1;
                }
            }
            // Dump #1
            /*for (let [index, tok] of res2.entries())
            {
                console.log('dump #1', index, tok);
            }*/
            // Troisième passe détermination des table avec newline/paragraph
            // et gestion des TableHeader
            let res3 = [];
            index = 0;
            while (index < res2.length)
            {
                let tok = res2[index];
                let next = null;
                if (index + 1 < res2.length)
                {
                    next = res2[index + 1];
                }
                //console.log('>>', index, tok.getType());
                // Start
                if (index === 0 && tok.getType() === 'table')
                {
                    // On ne pousse pas le token courrant, table remplacé par table_line_start
                    res3.push(new Token('table_line_start', '', tok.getStart()));
                }
                // End
                else if (index === res.length - 1 && tok.getType()  === 'table')
                {
                     // On ne pousse pas le token courrant, table remplacé par table_line_end
                     res3.push(new Token('table_line_end', '', tok.getStart()));
                }
                else if (['paragraph', 'newline'].includes(tok.getType()) && next !== null && next.getType() === 'table')
                {
                    if (tok.getType() === 'paragraph')
                    {
                        res3.push(new Token('newline', '\n', tok.getStart())); // we left a newline in order to separate TWO TABLE
                    }
                    res3.push(new Token('table_line_start', '', next.getStart()));
                    index += 1;
                }
                else if (tok.getType() === 'table' && next !== null && ['paragraph', 'newline'].includes(next.getType()))
                {
                    res3.push(new Token('table_line_end', '', next.getStart()));
                    // We left the newline in order to make the table_line_start
                }
                else if (tok.getType() === 'newline' && next !== null && next.getType() === 'table_header_line')
                {
                    let sub = res3.length - 1;
                    let subsub = res3.length - 2;
                    let found = false;
                    while (sub >= 0)
                    {
                        //console.log('----', 'sub', sub, res3[sub], 'subsub', subsub, res3[subsub]);
                        if (res3[sub].getType() === 'table_line_start' && (res3[subsub] === undefined || res3[subsub].getType() !== 'table_line_end'))
                        {
                            found = true;
                            break;
                        }
                        sub -= 1;
                        subsub -= 1;
                    }
                    if (found)
                    {
                        res3[sub].type = 'table_line_header_start';
                    }
                    index += 1;
                }
                else
                {
                    res3.push(tok);
                }
                index += 1;
            }
            // Dump #2
            /*for (let [index, tok] of res3.entries())
            {
                console.log('dump #2', index, tok);
            }*/
            return res3;
        }
    ),

            /*'bold': '[^\\]\*\*',
        'italic': "[^\\]''",
        'underline': '[^\\]__',
        'sup': '[^\\]^^',
        'sub': '[^\\]%%',
        'stroke': '[^\\]--',
        'code': '[^\\]@@',
        'link_start': '[^\\]\[\[',
        'link_end': '[^\\]\]\]',*/

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
    'text': new Lexer(LANGUAGES['text'], ['blank']),
    'hamill': new Lexer(LANGUAGES['hamill']) //, ['blank'])
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
    new Test(LEXERS['ash'], 'writeln("hello")', ['special', 'separator', 'string', 'separator']),
    new Test(LEXERS['ash'], 'if a == 5 then\n    writeln("hello")\nend',
                ['keyword', 'identifier', 'operator', 'integer', 'keyword', 'newline',
                 'special', 'separator', 'string', 'separator', 'newline',
                 'keyword']),

    new Test(LEXERS['hamill'], "// ceci est un commentaire\n// ceci est un autre", ['comment', 'comment']),
    new Test(LEXERS['hamill'], "**bold * \\** text**", ['bold', 'normal', 'bold']),
    new Test(LEXERS['hamill'], "**bold ''text''**", ['bold', 'normal', 'italic', 'normal', 'italic', 'bold']),
    new Test(LEXERS['hamill'], "* * * **ceci est une liste en gras**", ['list', 'bold', 'normal', 'bold']),
    new Test(LEXERS['hamill'], "|-----------------------|", ['table_header_line']),
    new Test(LEXERS['hamill'], "::label:: https://value", ['label', 'url']),
    new Test(LEXERS['hamill'], "::label:: http://value\ntext", ['label', 'url', 'newline', 'normal']),
    new Test(LEXERS['hamill'], "|une table avec du **gras**|", ['table_line_start', 'normal', 'bold', 'normal', 'bold', 'table_line_end']),
    new Test(LEXERS['hamill'], '|| * une continuation de table avec une liste|', ['table_line_start', 'table', 'list', 'normal', 'table_line_end']),
    new Test(LEXERS['hamill'], '{{pipo}}Damien Gouteux', ['markup', 'normal']),
    new Test(LEXERS['hamill'], '|ligne 1, col 1|ligne 1, col2|\n|ligne 2, col 1|ligne 2, col2|', ['table_line_start', 'normal', 'table', 'normal', 'table_line_end', 'table_line_start', 'normal', 'table', 'normal', 'table_line_end']),
    new Test(LEXERS['hamill'], '[[bonjour]] le monde', ['link', 'normal']),
]

function tests()
{
    /*
    const text = "if a == 5 then\nprintln('hello')\nend\nendly = 5\na = 2.5\nb = 0xAE\nc = 2.5.to_i()\nd = 2.to_s()\n"; //5A";
    let lexer = new Lexer(LANGUAGES['test'], ['blank']);
    let tokens = lexer.lex(text);
    console.log('    Text :', text);
    for (const [index, tok] of tokens.entries())
    {
        console.log(`${index.toString().padStart(4)}  ` + tok.toString());
    }
    */

    for (const [index, t] of TESTS.entries())
    {
        t.test(index + 1);
    }

    console.log("\n------------------------------------------------------------------------");
    console.log("Test de to_html");
    console.log("------------------------------------------------------------------------\n");

    console.log(LEXERS['lua'].to_html("if a >= 5 then println('hello') end", null, ['blank']));

    console.log("\n------------------------------------------------------------------------");
    console.log("Test de process_file (hamill)");
    console.log("------------------------------------------------------------------------\n");

    process_file('index.hml');
}

var DEBUG = false;
tests();

import fs from 'fs';


function process_file(name)
{
    let data = null;
    // require is specific to Node.js
    //const fs = require('fs');
    let doc = new Document();
    try
    {
        data = fs.readFileSync('index.hml', 'utf8');
    }
    catch (err)
    {
            console.error(err);
            return;
    }
    const tokens = LEXERS['hamill'].lex(data);
    let skip_if_paragraph = true;
    let skip_next = false;
    for (const [index, tok] of tokens.entries())
    {
        // Skipping
        if (skip_next === true)
        {
            skip_next = false;
            continue;
        }
        if (skip_if_paragraph && (tok.getType() === 'paragraph' || tok.getType() === 'newline'))
        {
            continue; // Skip ALL the next paragraphs
        }
        skip_if_paragraph = false;
        // Getting the next token
        let next = null;
        if (index + 1 < tokens.length)
        {
            next = tokens[index + 1];
        }
        // Getting the current token's value
        let value = tok.getValue();
        // Processing
        switch(tok.getType())
        {
            case 'paragraph':
                doc.add_node(new EndOfParagraph());
                skip_if_paragraph = true;
                break;
            case 'const':
                let s = value.replace('!const', '').split('=');
                let id = s[0].trim();
                value = s[1].trim();
                doc.add_constant(id, value);
                skip_if_paragraph = true;
                break;
            case 'require':
                value = value.replace('!require', '').trim();
                doc.add_required(value);
                skip_if_paragraph = true;
                break;
            case 'css':
                value = value.replace('!css', '').trim();
                doc.add_css(value);
                skip_if_paragraph = true;
                break;
            case 'html':
                doc.add_node(new RawHTML(value.substring(6)));
                skip_if_paragraph = true;
                break;
            case 'markup':
                if (next !== null && ['paragraph', 'newline'].includes(next.getType()))
                {
                    skip_if_paragraph = true;
                    doc.add_node(new Div(value.substring(2, value.length-2)));
                }
                else
                {
                    doc.add_node(new Markup(value.substring(2, value.length-2).trim()));
                }
                break;
            case 'label':
                if (next === null || next.getType() !== 'url')
                {
                    throw new Error("Label " + tok + " must be followed by an URL and is followed by: " + next.getType());
                }
                let label = value.replace(/::/g, '').trim();
                let url = next.getValue().trim();
                doc.add_label(label, url)
                skip_next = true;
                skip_if_paragraph = true;
                break;
            case 'newline':
                doc.add_node(new NewLine()); // don't discard for table !
                skip_if_paragraph = true;
                break;
            case 'normal':
                doc.add_node(new Text(value));
                break;
            case 'comment':
                doc.add_node(new Comment(value));
                skip_if_paragraph = true;
                break;
            case 'include':
                let include = value.replace('!include', '').trim();
                doc.add_node(new Include(include));
                skip_if_paragraph = true;
                break;
            case 'hr':
                doc.add_node(new HR());
                skip_if_paragraph = true;
                break;
            case 'title':
                let lvl = 0;
                for (let i = 0; i < value.length; i++)
                {
                    if (value[i] === '#')
                    {
                        lvl += 1;
                    }
                    else
                    {
                        break;
                    }
                }
                doc.add_node(new Title(value.substring(lvl+1).trim(), lvl));
                skip_if_paragraph = true;
                break;
            case 'link':
                value = value.trim()
                doc.add_node(new Link(value.substring(2, value.length-2)));
                break;
            case 'macro':
                doc.add_node(new Macro(value));
                break;
            case 'table':
                doc.add_node(new TableSeparator());
                break;
            case 'table_header_line':
                doc.add_node(new TableHeader());
                break;
            case 'table_line_start':
                doc.add_node(new TableLineStart());
                break;
            case 'table_line_end':
                doc.add_node(new TableLineEnd());
                break;
            case 'table_line_header_start':
                doc.add_node(new TableLineStart(true));
                break;
            default:
                console.log(index, tok);
                throw new Error("What to do with: " + tok);
        }
    }
    doc.info();
    // Emitting HTML
    fs.writeFileSync('out.html', doc.to_html());
}

export {ln, Language, Token, Lexer, LANGUAGES, PATTERNS, LEXERS};
