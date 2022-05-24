import { Regex, assert, w } from "./weyland.mjs";
import { Language } from "./languages.mjs";

class TokenDef
{

    constructor(typ, pattern)
    {
        this.typ = typ;
        this.regex = new Regex(pattern);
        if (this.regex === null || this.regex.root === null)
        {
            throw new Error(`Error during regex compilation for |${pattern}|`);
        }
    }

    toString()
    {
        return `TokenDef ${this.typ} ${this.regex.getPattern()}`;
    }

    toRepr()
    {
        return `${this.typ} ${this.regex}`;
    }
}

class Token
{
    constructor(typ, val, first)
    {
        this.typ = typ;
        this.val = val;
        this.first = first;
        this.length = val.length;
        this.last = this.first + this.length - 1;
    }

    toString()
    {
        return `${this.typ} |${this.val}| (${this.first}, ${this.last}) #${this.length}`;
    }

    toRepr()
    {
        return this.toString();
    }

    size()
    {
        return this.length;
    }

    equals(o)
    {
        return (o instanceof Token && this.typ == o.typ && this.val == o.val && this.first == o.first);
    }
}

class Lexer
{
    constructor(lang, discards=null, debug=false)
    {
        assert(lang instanceof Language, "lang parameter must be an instance of Language");
        assert(lang.size() > 0, "lang doit avoir au moins un type de token défini");
        assert(discards === null || Array.isArray(discards), "discards parameter must be an array or null");
        assert(typeof debug === "boolean", "debug parameter must be true or false");
        this.debug = debug;
        this.lang = lang;
        this.defs = [];
        this.discards = discards === null ? [] : discards;
        for (const [typ, values] of Object.entries(lang.tokens))
        {
            if (Array.isArray(values))
            {
                for(const val of values)
                {
                    this.defs.push(new TokenDef(typ, val, this.debug));
                }
            }
            else
            {
                this.defs.push(new TokenDef(typ, values, this.debug));
            }
        }
        if (this.debug)
        {
            this.info();
        }
    }

    ignore(typ)
    {
        if (typeof typ === string)
        {
            this.discards.push(typ);
        } else if (Array.isArray(typ, list)) {
            for (const t of typ)
            {
                this.ignore(t);
            }
        } else {
            throw new Error(`Unknown type to ignore: ${typ} of ${typeof typ}`);
        }
    }

    clear_ignored()
    {
        this.discards = [];
    }

    info()
    {
        console.log('----------------------------------------');
        console.log('Language');
        console.log('----------------------------------------');
        console.log('Types :', this.lang.size());
        for (const [typ, val] of Object.entries(this.lang.tokens))
        {
            console.log('   ', typ, '=>', val);
        }
        console.log('----------------------------------------');
        console.log('Token definitions :', this.defs.length);
        for (const [index, tokdef] of Object.entries(this.defs))
        {
            console.log('   ', index.toString().padStart(3), tokdef.toRepr());
        }
        console.log('----------------------------------------');
    }

    check(string, typs, vals)
    {
        console.log(`Text: ${string}`);
        let tokens = this.lex(string);
        if (tokens.length !== vals.length)
        {
            console.log(`ERROR        Wrong length of tokens expected: ${typs.length}, got ${tokens.length}:`);
            for (const [i, t] of Object.entries(tokens))
            {
                console.log(`    ${t.typ.padStart(10)} |${t.val}|`);
            }
            return false;
        }
        console.log(`Tokens: ${tokens.length}`);
        for (const [i, t] of Object.entries(tokens))
        {
            if (t.typ == typs[i] && t.val == vals[i])
            {
                val_inf = t.val.replace('\n', Lexer.REPLACE_NEWLINE);
                console.log(`OK  ${i.toString().padStart(5)}. ${t.typ.padStart(10)} |${val_inf}|`);
            } else {
                val_err = t.val.replace('\n', Lexer.REPLACE_NEWLINE);
                val_exp = vals[i].replace('\n', Lexer.REPLACE_NEWLINE);
                console.log(`ERROR   ${i.toString().padStart(5)}. ${t.typ.padStart(10)} |${val_err}|`);
                console.log(`EXPECTED ${typs[i].padStart(10)} |${vals[i]}|`);
                return false;
            }
        }
        return true;
    }

    to_html(text=null, tokens=null, raws=null)
    {
        if (text === null && tokens === null)
        {
            throw new Error("Nothing send to html");
        } else if (text !== null && tokens !== null) {
            throw new Error("Send to html text OR tokens, not both!");
        }
        if (text !== null)
        {
            tokens = this.lex(text)
        }
        raws = raws === null ? [] : raws;
        let output = '';
        for (const tok of tokens)
        {
            if (raws.includes(tok.typ))
            {
                output += tok.val
            } else {
                output += `<span class="${this.lang}-${tok.typ}">${encodeURI(tok.val).replace(/%20/g, " ")}</span>`;
            }
        }
        return output;
    }

    getBestMatch(matches, text, start)
    {
        // Finding the longuest match and the earliest declared
        let target = null;
        let count = null;
        for (let i = 0; i < matches.length; i++)
        {
            if (matches[i].match)
            {
                if (count === null)
                {
                    target = i;
                } else if (matches[i].size() > count) { // Il faut qu'il soit supérieur, ce qui fait qu'on prendra le 1er déclaré
                    target = i;
                }
            }
        }
        if (target === null)
        {
            throw new Error(`No suitable token found at ${w(text.substring(start))}.`);
        }
        return target;
    }

    lex(text)
    {
        if (this.debug)
        {
            console.log(`Texte = |${text}|`);
        }
        let index = 0;
        let start = 0;
        let tokens = [];
        let matches = null;
        while (index < text.length)
        {
            // Get Regex matching the current word
            if (this.debug)
            {
                console.log(`-- ${index.toString().padStart(5, 0)} index ---------------------------- |${w(text.substring(start, index + 1))}|`);
            }
            let nb_partial = 0;
            let nb_match = 0;
            matches = Array(this.defs.length);
            for (let i = 0; i < this.defs.length; i++)
            {
                let def = this.defs[i];


                if (index === 24 && i === 29)
                {
                    //console.log("wtf", def.toString());
                    //let rx = def.regex.match(text.substring(start, index + 7), true);
                    //console.log(rx);
                    //exit();
                }

                let r = def.regex.match(text.substring(start, index + 1));
                matches[i] = r;
                if (r.match || r.partial)
                    console.log(`    |${text.substring(start, index + 1)}| vs`, def.toString().padEnd(30), r.toString().padEnd(30),
                                'p', r.partial.toString().padEnd(5), 'm', r.match.toString().padEnd(5), 'o', r.isOverload());
                if (r.partial || (r.match && !r.isOverload()))
                {
                    if (r.partial)
                    {
                        nb_partial += 1;
                    } else {
                        nb_match += 1;
                        if (this.debug)
                        {
                            //console.log(`    Matching  ${i.toString().padStart(3, 0)}  ${def.toString().padEnd(20)}  ${def.regex.toString().padEnd(20)}  ${r.toString().padStart(20)}`);
                        }
                    }
                }
            }
            if (this.debug)
            {
                console.log('    |\n    => index', index, 'start', start, 'nb_tok', tokens.length, 'nb_part', nb_partial, 'nb_match', nb_match,
                            'char', text[index], `word |${text.substring(start, index+1)}|`);
            }
            // We got too far: deciding the correct matching regex
            if (nb_partial === 0 && nb_match === 0)
            {
                let target = this.getBestMatch(matches, text, start);
                let token = new Token(this.defs[target].typ, matches[target].getMatched(), start);
                console.log('    New token:', token.toString());
                if (!this.discards.includes(this.defs[target].typ))
                {
                    tokens.push(token);
                }
                start = token.last + 1;
                index = token.last;
            }
            index += 1;
        }
        let target = this.getBestMatch(matches, text, start);
        if (!this.discards.includes(this.defs[target].typ))
        {
            let token = new Token(this.defs[target].typ, matches[target].getMatched(), start);
            tokens.push(token);
            console.log('END New token:', token.toString());
        }
        return tokens;
    }
}

Lexer.REPLACE_NEWLINE = '\\n';

export {Lexer};
