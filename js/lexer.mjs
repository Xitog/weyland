import { Regex } from "./weyland.mjs";
import { Language } from "./languages.mjs";

function assert(condition, message)
{
    if (!condition)
    {
        throw new Error(`Assertion failed: ${message}`);
    }
}

class TokenDef
{

    constructor(typ, pattern, debug=false)
    {
        this.typ = typ;
        this.regex = new Regex(pattern, debug);
    }

    toString()
    {
        return `TokenDef ${this.typ}`;
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
        for (let tokdef of this.defs)
        {
            console.log('   ', tokdef.toRepr());
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
        for (tok of tokens)
        {
            if (raws.includes(tok.typ))
            {
                output += tok.val
            } else {
                output += `<span class="${this.lang}-${this.typ}">${encodeURI(tok.val)}</span>`;
            }
        }
        return output;
    }

    make_token(start, text, index, res)
    {
        const matches = Array.from(Array(res.length).keys()).filter(elem => res[elem] !== undefined && res[elem].match);
        let count = matches.length;
        let token = null;
        let i = null;
        if (count === 0)
        {
            throw new Error(`\nLang:[${this.lang.name}]\nSource:\n|${text}|\nError:\nNo matching token for |${text.substring(start, index + 1)}| from |${text}| in:\n${this.defs}`)
        } else if (count === 1) {
            i = matches[0];
            token = new Token(this.defs[i].typ, res[i].getMatched(), start);
        } else if (count > 1) { // We try to get the longest match (greedy regex)
            let max_length = null;
            let good = {};
            for (const [i, r] in res.keys())
            {
                if (r === null || !r.match)
                {
                    continue;
                }
                let length = r.getMatched().length;
                if (good.includes(length))
                {
                    good[length].push(i);
                } else {
                    good[length] = [i];
                }
                if (max_length === null || length > max_length)
                {
                    max_length = length;
                }
            }
            if (good[max_length].length > 1)
            {
                // Last try: do we have a only one specific among them?
                const specific = good[max_length].filter(elem => this.defs[elem].regex.is_specific());
                if (specific.length === 1)
                {
                    chosen = specific[0];
                } else {
                    console.log('ERROR: Multiple matching tokens');
                    for (i of good[max_length])
                    {
                        console.log('   ', self.defs[i], res[i], len(res[i].getMatched()));
                    }
                    throw new Error(`Multiple matching regex of same length: ${good}`);
                }
            } else {
                chosen = good[max_length][0];
            }
            token = new Token(self.defs[chosen].typ, res[chosen].getMatched(), start);
        }
        if (this.debug)
        {
            console.log(`=>= Token ${token}`);
        }
        return token;
    }

    lex(text)
    {
        if (this.debug)
        {
            console.log(`Texte = |${text}|`);
        }
        let index = 0;
        let res = Array(this.defs.length);
        let start = 0;
        let tokens = [];
        while (index < text.length)
        {
            // Get Regex matching the current word
            if (this.debug)
            {
                console.log(`-- ${index.toString().padStart(5, 0)} ----------------------------`);
            }
            let nb_partial = 0;
            let nb_match = 0;
            let debug_matched = [];
            for (let idf = 0; idf < this.defs.length; idf++)
            {
                let r = this.defs[idf].regex.match(text.substring(start, index + 1));
                if (r.partial)
                {
                    nb_partial += 1;
                }
                console.log("WTF", idf, " <> ", r.isOverload());
                if (r.match && !r.isOverload()) // il n'y a pas de texte laissé en dehors du match
                {
                    nb_match += 1;
                    debug_matched.push(this.defs[idf].typ + " : " + this.defs[idf].regex.toString());
                }
                if (res[idf] === undefined || res[idf].partial)
                {
                    res[idf] = r;
                } else if (res[idf] !== null && res[idf].match && r.match) {
                    res[idf] = r;
                }
                if (this.debug && (res[idf].partial || res[idf].match))
                {
                    console.log(`${idf.toString().padStart(5, 0)} ${this.defs[idf].toString().padStart(10)} ${this.defs[idf].regex.toString().padStart(20)} ${res[idf].toString().padStart(20)}`);
                }
            }
            if (this.debug)
            {
                console.log('index', index, 'start', start, 'nb_tok', tokens.length, 'nb_part', nb_partial, 'nb_match', nb_match,
                            'char', text[index], `word |${text.substring(start, index+1)}|`);
                if (nb_match > 0)
                {
                    for (let rs of debug_matched)
                    {
                        console.log('   - ' + rs);
                    }
                }
            }
            // We got too far: deciding the correct matching regex
            if (nb_partial === 0 && nb_match === 0)
            {
                let tok = this.make_token(start, text, index, res);
                if (!self.discards.includes(tok.typ))
                {
                    tokens.push(tok);
                }
                start = tok.last + 1;
                index = tok.last;
                res = Array(this.defs.length);
            }
            index += 1;
        }
        let tok = this.make_token(start, text, index, res);
        if (!this.discards.includes(tok.typ))
        {
            tokens.push(tok);
        }
        return tokens;
    }
}

Lexer.REPLACE_NEWLINE = '\\n';

export {Lexer};
