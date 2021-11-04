/**
 * Evolutions from Weyland 0.x :
 * Replaced option and repeat parameters by min and max.
 * - min=0 => option
 * - max>1 => repeat
 * Added choice parameter to distinguish between choice [ ] and group ( )
 *
 * Added possibility of grouping
 * Added alternative operator |
 *
 * Classes + Modifiers + Custom Classes
 * Todo : invert Custom Classes, range in Custom Classes, group, named group, match
 */

//-----------------------------------------------------------------------------
// La classe Char
//-----------------------------------------------------------------------------

/* Elle permet de faire abstraction des échappements de caractère.
   Lorsque l'on demande si ce caractère est-il ")" avec is(")"), c'est implicite qu'il n'est pas échappé.
 */

class Char
{
    constructor(value, escaped=false)
    {
        this.value = value;
        this.escaped = escaped;
    }

    in(elements)
    {
        return (elements.includes(this.value) && !this.escaped);
    }

    is(element)
    {
        return (element === this.value && !this.escaped);
    }

    is_escaped(element)
    {
        return (element === this.value && this.escaped);
    }

    toString()
    {
        return 'Char |' + this.value + '| esc? ' + this.escaped;
    }
}

//-----------------------------------------------------------------------------
// La classe Element
//-----------------------------------------------------------------------------

class Element
{
    constructor(value, parent=null)
    {
        this.value = value;
        this.parent = parent;
        this.min = 1;
        this.max = 1;
        this.quantifier = Element.Normal;
        this.value = value.replace("\n", Element.NewLineCode)
    }

    getPattern()
    {
        return this.value;
    }

    setQuantifier(qt)
    {
        if (qt !== Element.Normal && qt !== Element.Greedy && qt !== Element.Lazy && qt !== Element.Possessive)
        {
            throw "Quantifier not known: " + qt;
        }
        this.quantifier = qt;
    }

    getQuantifier()
    {
        return this.quantifier;
    }

    toString()
    {
        let card = "";
        if (this.min !== 1 || this.max !== 1)
        {
            let max = (this.max === -1) ? "*" : this.max;
            card = " {" + this.min + ", " + max + "}";
            switch (this.quantifier)
            {
                case Element.Greedy:
                    card += ' greedy';
                    break;
                case Element.Lazy:
                    card += ' lazy';
                    break;
                case Element.Possessive:
                    card += ' possessive';
                    break;
            }
        }
        return this.constructor.name + " |" + this.value + "|" + card;
    }

    info(level=0, prefix='')
    {
        return '   '.repeat(level) + prefix + this.toString();
    }

    isOptionnal()
    {
        return this.min === 0;
    }

    isRepeatable()
    {
        return this.max > 1;
    }

    setCard(min, max)
    {
        if (min > max)
        {
            throw "Max cardinality must be superior or equal to min cardinality";
        }
        this.min = min;
        this.max = max;
    }

    getMin()
    {
        return this.min;
    }

    getMax()
    {
        return this.max;
    }

    match(candidate , start=0, level=0, debug=null)
    {
        let matched = 0;
        for (let i = start; i < candidate.length && matched <= this.max; i++)
        {
            if (candidate[i] === this.value)
            {
                matched += 1;
            }
            else
            {
                break;
            }
            if (debug !== null)
            {
                debug.push([level, 'Element#match: ' + candidate[i] + " vs " + this + " matched=" + matched]);
            }
        }
        let res = null;
        if (matched >= this.min)
        {
            res = new MiniMatch(this, matched);
        }
        return res;
    }

}

// Quantifiers
Element.ZeroOrOne = '?'; // Can be lazy too
Element.OneOrMore = '+';
Element.ZeroOrMore = '*';
Element.Normal = 0;
Element.Greedy = 1;
Element.Lazy = 2;
Element.Possessive = 3;
// Group
Element.CloseGroup = ')';
// Others
Element.Alternative = '|';
Element.Escape = '\\';
// For clean display
Element.NewLineCode = "<NL>";

//-----------------------------------------------------------------------------
// La classe Special
//-----------------------------------------------------------------------------

class Special extends Element
{
    constructor(value, parent=null)
    {
        super(value, parent);
        if (value !== Special.Alpha && value !== Special.Digit && value !== Special.AlphaNum
            && value !== Special.Space && value !== Special.Any)
        {
            throw "A special element must be digit, letter, space or word not: |" + value + "|";
        }
    }

    match(candidate , start=0, level=0, debug=null)
    {
        let matched = 0;
        let res = null;
        for (let i = start; i < candidate.length && matched < this.max; i++)
        {
            if (this.value === Special.Alpha)
            {
                res = Special.Letters.includes(candidate[i]);
            }
            else if (this.value === Special.Digit)
            {
                res = Special.Digits.includes(candidate[i]);
            }
            else if (this.value === Special.AlphaNum)
            {
                res = (candidate[i] === '_' || Special.Latin.includes(candidate[i]) || Special.Digits.includes(candidate[i]));
            }
            else if (this.value === Special.Space)
            {
                res = Special.Spaces.includes(candidate[i]);
            }
            else if (this.value === Special.Any)
            {
                res = (candidate[i] !== '\n');
            }
            if (res)
            {
                matched += 1;
                if (debug !== null)
                {
                    debug.push([level, 'Special#match: ' + candidate[i] + " vs " + this + " matched= " + matched + " / " + this.max]);
                }
            }
            else
            {
                break;
            }
        }
        res = null;
        if (matched >= this.min)
        {
            res = new MiniMatch(this, matched);
        }
        return res;
    }
}
// Classes
Special.Alpha = '@';
Special.Digit = '#';
Special.DigitEscaped = 'd';
Special.AlphaNum = '&'; // w (alpha + digit + _)
Special.AlphaNumEscaped = 'w';
Special.Space = '°';    // s (' ', '\t', '\n', '\f')
Special.SpaceEscaped = 's';
Special.Any = '.';
// Base
Special.Spaces = [' ', '\t', '\n', '\f'];
Special.Digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
Special.Latin = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
                 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
                 'U', 'V', 'W', 'X', 'Y', 'Z',
                 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
                 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
                 'u', 'v', 'w', 'x', 'y', 'z'];
Special.Letters = Special.Latin + [
                'Á', 'À', 'Â', 'Ä', 'Å', 'Ă', 'Æ', 'Ç', 'É', 'È', 'Ê', 'Ë', 'Í', 'Ì', 'Î', 'Œ', 'Ñ',
                'Ó', 'Ò', 'Ô', 'Ö', 'Ø', 'Ú', 'Ù', 'Û', 'Ü', 'Š', 'Ș', 'Ț', 'Ž', 'ẞ',
                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
                'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
                'u', 'v', 'w', 'x', 'y', 'z',
                'á', 'à', 'â', 'ä', 'å', 'ă', 'æ', 'ç', 'é', 'è', 'ê', 'ë', 'í', 'ì', 'î', 'œ', 'ñ',
                'ó', 'ò', 'ô', 'ö', 'ø', 'ú', 'ù', 'û', 'ü', 'š', 'ș', 'ț', 'ž', 'ß'];

//-----------------------------------------------------------------------------
// La classe Class
//-----------------------------------------------------------------------------

class Class extends Element
{
    constructor(value, parent=null, elements=null, inverted=false)
    {
        super(value, parent);
        this.inverted = inverted;
        if (elements === null || elements.length <= 1)
        {
            throw "A class must have at least two elements.";
        }
        this.elements = elements;
    }

    toString()
    {
        let card = "";
        if (this.min !== 1 || this.max !== 1)
        {
            let max = (this.max === -1) ? "*" : this.max;
            card = " {" + this.min + ", " + max + "}";
        }
        let nb = " (" + this.elements.length + ")";
        let inverted = (this.inverted) ? " inverted" : ""
        return "Class |" + this.value + "|" + card + nb + inverted;
    }

    info(level=0, prefix='')
    {
        return '    '.repeat(level) + prefix + this.toString();
    }

    match(candidate , start=0, level=0, debug=null)
    {
        let matched = [];
        let res = null;
        for (let i = start; i < candidate.length && matched.length <= this.max; i++)
        {
            for (let e of this.elements)
            {
                if (e.match(candidate, i, level + 1, debug) !== null)
                {
                    res = e;
                    break;
                }
            }
            if (res !== null)
            {
                matched.push(res);
            }
            if (debug !== null)
            {
                debug.push([level, 'Class#match: ' + candidate[i] + " vs " + this.value + " matched=" + matched]);
            }
        }
        res = null;
        if (matched.length >= this.min)
        {
            res = new MiniMatch(matched, matched.length);
        }
        return res;
    }
}
// Custom classes
Class.Open = '[';
Class.Close = ']';
Class.Invert = '^';
Class.Range = '-';

//-----------------------------------------------------------------------------
// Sequence
//-----------------------------------------------------------------------------

class Sequence extends Element
{

    constructor(value, parent=null)
    {
        super(value, parent);
        this.elements = [];
    }

    add(element)
    {
        this.elements.push(element);
    }

    last()
    {
        return ((this.elements.length > 0) ? this.elements[this.elements.length - 1] : null);
    }

    info(level=0, prefix='')
    {
        let s = '    '.repeat(level) + this.toString() + "\n";
        for (let i = 0; i < this.elements.length; i++)
        {
            s +=  this.elements[i].info(level + 1, i.toString().padStart(2, '0') + '. ') + "\n";
        }
        return s;
    }

    size()
    {
        return this.elements.length;
    }

    toString()
    {
        return 'Sequence |' + this.value + '| (' + this.elements.length + ')';
    }

    match(candidate , start=0, level=0, debug=null)
    {
        if (debug !== null)
        {
            debug.push([level, 'Sequence#match: "' + candidate + '" vs |' + this.value + '| start=' + start])
        }
        let matched = [];
        let index_candidate = start;
        let index_regex = 0;
        while (index_candidate < candidate.length && index_regex < this.elements.length)
        {
            let elem = this.elements[index_regex];
            let next = (index_regex + 1 < this.elements.length) ? this.elements[index_regex + 1] : null;
            let res = elem.match(candidate, index_candidate, level + 1, debug);
            if (res === null)
            {
                break;
            }
            matched.push(res);
            index_regex += 1;
            index_candidate += res.size();
            if (debug !== null)
            {
                debug.push([level, "Sequence#match: " + matched.length]);
            }
            /*if (res.isRepeatable())
            {

            }*/
            //console.log('        iter index_candidate=' + index_candidate + '/' + (stop - start - 1) +
            //                            ' index_regex=' + index_regex + '/' + (this.elements.length - 1) +
            //                            ' ' + candidate[index_candidate] + ' vs ' + elem + ' => ' + res);
            /*if (!elem.isOptionnal())
            {
                break;
            }*/
        }
        if (debug !== null)
        {
            debug.push([level, 'End of loop: icandidate=' + index_candidate + ' iregex=' + index_regex + ' lregex=' + this.elements.length + ' parent=' + this.parent]);
        }
        let final_res = (index_regex === this.elements.length);
        if (this.parent !== null)
        {
            if (final_res)
            {
                return [final_res, matched.reduce((a, b) => a.size() + b, 0)];
            }
            else
            {
                return [final_res, 0];
            }
        }
        else
        {
            let final = new Match(this, candidate);
            final.match = final_res;
            final.length = index_candidate;
            final.element_matches = matched; // Length of candidate text matched for each elements of the Regex
            //this.partial = false;       // In case of not matching, is it due to not enough chars?
            return final;
        }
    }
}

//-----------------------------------------------------------------------------
// La classe Regex
//-----------------------------------------------------------------------------

class Regex
{
    constructor(pattern, autocompile=true)
    {
        this.raw = pattern;
        this.pattern = pattern.replace('\n', '\\n');
        this.root = null;
        if (autocompile)
        {
            this.compile();
        }
    }

    toString()
    {
        return 'Regex |' + this.pattern + '|';
    }

    info()
    {
        return this.root.info();
    }

    precompile()
    {
        // Transformation de la chaîne en une liste de Char : fusion de \x en un seul char (ne compte plus pour 2 !)
        // Cas particulier : \\x : le premier escape le deuxième qui n'escape pas le troisième.
        let temp = [];
        let escaped = false;
        for (let i = 0; i < this.raw.length; i++)
        {
            let current = this.raw[i];
            if (current === "\\" && !escaped)
            {
                escaped = true;
            } else {
                temp.push(new Char(current, escaped));
                escaped = false;
            }
        }
        if (escaped) // Si on finit par un \ on le met mais ça ne passera pas les checks
        {
            temp.push(new Char(this.raw[this.raw.length-1], false));
        }
        return temp;
    }

    compile_specials(current, target)
    {
        if (target === null || target === undefined)
        {
            throw "Target must not be null in order to add the special to it.";
        }
        let res = true;
        if (current.is(Special.Digit) || current.is_escaped(Special.DigitEscaped))
        {
            target.push(new Special(Special.Digit));
        }
        else if (current.is(Special.Alpha))
        {
            target.push(new Special(Special.Alpha));
        }
        else if (current.is(Special.Space) || current.is_escaped(Special.SpaceEscaped))
        {
            target.push(new Special(Special.Space));
        }
        else if (current.is(Special.AlphaNum) || current.is_escaped(Special.AlphaNumEscaped))
        {
            target.push(new Special(Special.AlphaNum));
        }
        else if (current.is(Special.Any))
        {
            target.push(new Special(Special.Any));
        }
        else
        {
            res = false; // not a class
        }
        return res;
    }

    compile()
    {
        let temp = this.precompile();
        this.root = new Sequence(this.pattern);
        // Checks
        if (temp.length === 0)
        {
            throw "A regex must have at least one char.";
        }
        if (temp[0].is(Element.ZeroOrMore) || temp[0].is(Element.ZeroOrOne) || temp[0].is(Element.OneOrMore))
        {
            throw "A regex cannot start with a quantifier.";
        }
        if (temp[0].is(Element.Alternative))
        {
            throw "A regex cannot start with an alternate char.";
        }
        if (temp[0].is(Element.CloseClass))
        {
            throw "A regex cannot start with a closing class char.";
        }
        if (temp[temp.length-1].is(Element.Escape))
        {
            throw "A regex cannot finish with an escaped char.";
        }
        // Tree
        for (let i = 0; i < temp.length; i++)
        {
            let current = temp[i];
            let prev = this.root.last();
            // Classes
            if (this.compile_specials(current, this.root.elements))
            {
                // everything is done in the function, do nothing here.
            }
            // Custom classes
            else if (current.is(Class.Open))
            {
                let value = "";
                let end = -1;
                let members = [];
                let inverted = false;
                for (let j = i + 1; j < temp.length; j++)
                {
                    if (j == i + 1 && temp[j].is(Class.Invert))
                    {
                        inverted = true;
                    }
                    else if (temp[j].is(Class.Close))
                    {
                        end = j;
                        break;
                    }
                    else if (this.compile_specials(temp[j], members))
                    {
                        // including in members is done in the function.
                        value += temp[j].value;

                    }
                    else
                    {
                        members.push(new Element(temp[j].value));
                        value += temp[j].value;
                    }
                }
                if (end === -1)
                {
                    throw "No ending ] for [ at " + i;
                }
                if (members.length < 2)
                {
                    throw "A custom class must have at least 2 elements."
                }
                this.elements.push(new Class(value, null, members, inverted));
                i = end;
            }
            // Quantifiers
            else if (current.is(Element.OneOrMore)) // +
            {
                // There was a previous modifier, this one is making it possessive
                if (prev.min !== 1 || prev.max !== 1)
                {
                    prev.setQuantifier(Element.Possessive);
                }
                else
                {
                    prev.max = Infinity;
                    prev.setQuantifier(Element.Greedy);
                }
            }
            else if (current.is(Element.ZeroOrMore)) // *
            {
                prev.min = 0;
                prev.max = Infinity;
                prev.setQuantifier(Element.Greedy);
            }
            else if (current.is(Element.ZeroOrOne)) // ?
            {
                // There was a previous modifier, this one is making it lazy
                if (prev.min !== 1 || prev.max !== 1)
                {
                    prev.setQuantifier(Element.Lazy);
                }
                else
                {
                    prev.min = 0;
                    prev.setQuantifier(Element.Greedy);
                }
            }
            else
            {
                this.root.add(new Element(current.value));
            }
        }
        if (this.root.size() === 0)
        {
            throw "Impossible to have a regex with 0 element.";
        }
    }

    match(text, debug=null)
    {
        return this.root.match(text, 0, 0, debug);
    }
}

// Standard PCRE Regex Special char (15) : . ^ $ * + - ? ( ) [ ] { } \ |
// Added (3) : @ # &

Char.Start = '^';
Char.End = '$';
Char.OpenGroup = '(';

Char.NameGroup = '?'
Char.OpenNameGroup = '<';
Char.CloseNameGroup = '>';

Char.OpenRepeat = '{';
Char.CloseRepeat = '}';
Char.SeparatorRepeat = ',';

Char.StartCode = "<START>";
Char.EndCode = "<END>";

Regex.Positions = [Char.Start, Char.End];
Regex.Escapables = Regex.Modifiers + Regex.Classes + Regex.Positions + [
    Char.OpenGroup,
    Char.CloseGroup,
    Char.NameGroup,
    Char.OpenNameGroup,
    Char.CloseNameGroup,
    Char.OpenClass,
    Char.CloseClass,
    Char.InvertClass,
    Char.RangeClass,
    Char.OpenRepeat,
    Char.CloseRepeat,
    Char.SeparatorRepeat,
    Char.Alternative,
    Char.Escape];

//-----------------------------------------------------------------------------
// La classe Match
//-----------------------------------------------------------------------------

class MiniMatch
{
    constructor(element, length=1)
    {
        this.element = element;
        this.length = length;
    }

    add(length=1)
    {
        this.length += length;
    }

    size()
    {
        return this.length;
    }
}

class Match
{
    constructor(regex, text)
    {
        this.regex = regex;         // Regex
        this.text = text;           // Candidate
        this.match = false;         // Matched or not?
        this.partial = false;       // In case of not matching, is it due to not enough chars?
        this.length = null;         // Length of candidate text matched
        this.element_matches = [];  // Length of candidate text matched for each elements of the Regex
    }

    // Pas de surchage de length en JavaScript
    size()
    {
        return this.length;
    }

    is_partial()
    {
        return this.partial;
    }

    is_match()
    {
        return this.match;
    }

    getNbElementMatched()
    {
        return this.element_matches.length;
    }

    get(index)
    {
        if (index < 0 || index >= this.element_matches.length)
        {
            throw "Out of range index: " + index + " should be between 0 and inferior to " + this.element_matches.length;
        }
        return this.element_matches[index];
    }

    getMatch()
    {
        return ((this.length === null ? '' : this.text.substring(0, this.length)));
    }

    is_overload()
    {
        return (this.length !== null && this.length <= this.text.length);
    }

    get_overload()
    {
        if (this.length === null || this.length === this.text.length)
        {
            return '';
        } else {
            return this.text.substring(this.length);
        }
    }

    toString()
    {
        if (this.match)
        {
            return '<Match matched |' + this.getMatch() + '| (' + 0 + ' to ' + (this.length - 1) + ')>';
        } else if (this.partial) {
            return '<Match partial |' + this.getMatch() + '|>';
        } else {
            return '<Match none>';
        }
    }

}

export {Regex, Sequence, Class, Special};