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

/**
 * La classe char
 * Elle permet de faire abstraction des échappements de caractère.
 * Lorsque l'on demande si ce caractère est-il ")" avec is(")"), c'est implicite qu'il n'est pas échappé.
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

    toRepr()
    {
        let s = this.escaped ? "\\" : "";
        s += this.value;
        return s;
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

    cardToString()
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
        return card;
    }

    toString()
    {
        let card = this.cardToString();
        return this.constructor.name + " |" + this.value + "|" + card;
    }

    info(level=0, prefix='')
    {
        return '    '.repeat(level) + prefix + this.toString();
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
        let res = (matched >= this.min) ? true : false;
        return new Match(this, candidate, res, start, matched);
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
// Others
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
        res = false;
        if (matched >= this.min)
        {
            res = true;
        }
        //if (!res && i < candidate.length) // we break because of a bad thing, not because we reached the end of the candidate string
        //{
        //    matched = 0;
        //}
        return new Match(this, candidate, res, start, matched);;
    }
}
// Classes
Special.Alpha = '@';
Special.AlphaEscaped = 'a';
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
        let card = this.cardToString();
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
        res = false;
        if (matched.length >= this.min)
        {
            res = true;
        }
        return new Match(matched, candidate, res, start, matched.length);
    }
}
// Custom classes
Class.Open = '[';
Class.Close = ']';
Class.Invert = '^';
Class.Range = '-';

//-----------------------------------------------------------------------------
// Group
//-----------------------------------------------------------------------------

class Group extends Element
{

    constructor(value, parent=null, elements=null)
    {
        super(value, parent);
        this.elements = elements === null ? [] : elements;
        for (let e of this.elements)
        {
            e.parent = this;
        }
    }

    push(element)
    {
        this.elements.push(element);
    }

    last()
    {
        return ((this.elements.length > 0) ? this.elements[this.elements.length - 1] : null);
    }

    info(level=0, prefix='')
    {
        let s = '    '.repeat(level) + prefix + this.toString() + "\n";
        for (let i = 0; i < this.elements.length; i++)
        {
            s +=  this.elements[i].info(level + 1, i.toString().padStart(2, '0') + '. ');
            if (i + 1 < this.elements.length)
            {
                s += "\n";
            }
        }
        return s;
    }

    size()
    {
        return this.elements.length;
    }

    toString()
    {
        let card = this.cardToString();
        return 'Group |' + this.value + '| (' + this.elements.length + ')' + card;
    }

    match(candidate , start=0, level=0, debug=null)
    {
        if (debug !== null)
        {
            debug.push([level, 'Group#match: START cand=|' + candidate + '| vs seq=|' + this.value + '| start=' + start])
        }
        let matched = new MatchSet(this, candidate, false, start);
        let index_candidate = start;
        let index_regex = 0;
        let nb_matched = 0;
        while (index_candidate < candidate.length && index_regex < this.elements.length)
        {
            let elem = this.elements[index_regex];
            if (debug !== null)
            {
                debug.push([level + 1, 'loop ic=' + index_candidate + ' ir=' + index_regex + ' ' +
                            candidate.substring(index_candidate) + ' vs '+ elem.toString()]);
            }
            let res = elem.match(candidate, index_candidate, level + 2, debug);
            if (!res.isMatch())
            {

                if (elem.getMin() === 0  && index_regex + 1 < this.elements.length)
                {
                    if (debug !== null)
                    {
                        debug.push([level + 1, '---> no result, passing to next']);
                    }
                    index_regex += 1;
                    continue;
                }
                else
                {
                    if (debug !== null)
                    {
                        debug.push([level + 1, '---> no result, breaking']);
                    }
                    break;
                }
            }
            // Test next group element against the minimal next
            if (elem.getMax() > 1 && elem.getQuantifier() != Element.Possessive && index_regex + 1 < this.elements.length)
            {
                let next = this.elements[index_regex + 1];
                let index_candidate_start_next = index_candidate;
                if (elem.getQuantifier() === Element.Lazy) // We want to match the least number of chars
                {
                    index_candidate_start_next += elem.getMin();
                }
                else // Element.Normal
                {
                    index_candidate_start_next += res.size() - 1; // Arbitrary
                }
                if (debug !== null)
                {
                    debug.push([level + 2, '???? next ic=' + index_candidate_start_next + ' ir=' +
                                (index_regex + 1) + ' ' + candidate.substring(index_candidate_start_next) + ' vs ' +
                                next.toString() + ' (' + (res.size() - elem.getMin()) + ' chars of freedom)']);
                }
                let next_res = next.match(candidate, index_candidate_start_next, level + 3, debug);
                if (next_res !== null)
                {
                    if (elem.getQuantifier() === Element.Lazy) // We want to match the least number of chars
                    {
                        res.reduce();
                    }
                    else if (elem.getQuantifier() === Element.Greedy)
                    {
                        if (index_candidate + res.size() === candidate.length && index_regex < this.elements.length - 1) // end of string but not end of regex
                        {
                            res.reduce(1); // Arbitrary
                        }
                    }
                    if (debug !== null)
                    {
                        debug.push([level + 2, '---> ' + next_res.toString() + ' = |' + next_res.getMatched(candidate) + '|']);
                    }
                }
                else
                {
                    if (debug !== null)
                    {
                        debug.push([level + 2, '---> no result']);
                    }
                }
            }
            matched.push(res);
            index_regex += 1;
            index_candidate += res.size();
            if (debug !== null)
            {
                debug.push([level + 1, '---> ' + res.toString() + ' = |' + res.getMatched(candidate) + '|']);
            }
            if (index_regex === this.elements.length)
            {
                nb_matched += 1;
                if (nb_matched < this.max)
                {
                    index_regex = 0; // Restart
                }
            }
            //let len = matched.reduce((a, b) => a.size() + b, 0);
            //console.log('        iter index_candidate=' + index_candidate + '/' + (stop - start - 1) +
            //                            ' index_regex=' + index_regex + '/' + (this.elements.length - 1) +
            //                            ' ' + candidate[index_candidate] + ' vs ' + elem + ' => ' + res);
        }
        if (debug !== null)
        {
            debug.push([level, 'Group#match: END icand=' + index_candidate + ' iregex=' + index_regex + ' lregex=' + this.elements.length + ' parent=' + this.parent]);
        }
        // ???
        matched.match = (nb_matched > 0); // (index_regex === this.elements.length);
        // Si tous les suivants sont optionnels, c'est un match quand même
        let all_optional = true;
        for (let i = index_regex; i < this.elements.length; i++)
        {
            if (!this.elements[i].isOptionnal())
            {
                all_optional = false;
                break;
            }
        }
        if (all_optional)
        {
            matched.match = true;
        }
        matched.partial = (index_candidate === candidate.length && index_regex < this.elements.length);
        if (matched.match)
        {
            matched.partial = false; // On force à false si matched
        }
        return matched;
    }
}
Group.Open = '(';
Group.Close = ')';

//-----------------------------------------------------------------------------
// Choice
//-----------------------------------------------------------------------------

class Choice extends Element
{
    constructor(value, parent=null, elements=null)
    {
        super(value, parent);
        this.elements = elements === null ? [] : elements;
        for (let e of this.elements)
        {
            e.parent = this;
        }
    }

    size()
    {
        return this.elements.length;
    }

    toString()
    {
        let card = this.cardToString();
        return 'Choice |' + this.value + '| (' + this.elements.length + ')' + card;
    }
}
Choice.Alternative = '|';

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
        // Checks
        if (temp.length === 0)
        {
            throw "A regex must have at least one char.";
        }
        if (temp[0].is(Element.ZeroOrMore) || temp[0].is(Element.ZeroOrOne) || temp[0].is(Element.OneOrMore))
        {
            throw "A regex cannot start with a quantifier.";
        }
        if (temp[0].is(Choice.Alternative))
        {
            throw "A regex cannot start with an alternate char.";
        }
        if (temp[0].is(Class.Close))
        {
            throw "A regex cannot start with a closing class char.";
        }
        if (temp[temp.length-1].is(Element.Escape))
        {
            throw "A regex cannot finish with an escaped char.";
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
        else if (current.is(Special.Alpha) || current.is_escaped(Special.AlphaEscaped))
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

    find_next_symbol(text, start, symbol, counter_symbol=null)
    {
        let index = null;
        let level = 0;
        for (let i = start ; i < text.length ; i++)
        {
            if (text[i].is(symbol) && level === 0)
            {
                index = i;
                break;
            }
            else if (text[i].is(symbol) && level > 0)
            {
                level -= 1;
            }
            else if (counter_symbol !== null && text[i].is(counter_symbol))
            {
                level += 1;
            }
        }
        return index;
    }

    subcompile(temp, start, end, parent=null)
    {
        let elements = [];
        let pattern = "";
        // Tree
        for (let i = start; i < end; i++)
        {
            let current = temp[i];
            pattern += current.toRepr();
            let prev = elements.length > 0 ? elements[elements.length - 1] : null;
            // Classes
            if (this.compile_specials(current, elements))
            {
                // everything is done in the function, do nothing here.
            }
            // Custom classes
            else if (current.is(Class.Open))
            {
                let value = "";
                let members = [];
                let inverted = false;
                let closing = this.find_next_symbol(temp, i + 1, Class.Close);
                if (closing === null)
                {
                    throw "No ending ] for [ at " + i;
                }
                for (let j = i + 1; j < closing; j++)
                {
                    if (j == i + 1 && temp[j].is(Class.Invert))
                    {
                        inverted = true;
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
                if (members.length < 2)
                {
                    throw "A custom class must have at least 2 elements."
                }
                elements.push(new Class(value, null, members, inverted));
                i = closing;
            }
            // Quantifiers
            else if (current.is(Element.OneOrMore)) // +
            {
                // There was a previous modifier, this one is making it possessive
                if (prev !== null && (prev.min !== 1 || prev.max !== 1))
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
                if (prev === null)
                {
                    throw "Cannot start with *";
                }
                prev.min = 0;
                prev.max = Infinity;
                prev.setQuantifier(Element.Greedy);
            }
            else if (current.is(Element.ZeroOrOne)) // ?
            {
                // There was a previous modifier, this one is making it lazy
                if (prev !== null && (prev.min !== 1 || prev.max !== 1))
                {
                    prev.setQuantifier(Element.Lazy);
                }
                else
                {
                    prev.min = 0;
                    prev.setQuantifier(Element.Greedy);
                }
            }
            else if (current.is(Group.Open))
            {
                let closing = this.find_next_symbol(temp, i + 1, Group.Close, Group.Open);
                if (closing === null)
                {
                    throw "No ending ) for ( at " + i;
                }
                elements.push(this.subcompile(temp, i + 1, closing, null));
                i = closing;
            }
            else
            {
                elements.push(new Element(current.value));
            }
        }
        return new Group(pattern, parent, elements);
    }

    compile()
    {
        let temp = this.precompile();
        this.root = this.subcompile(temp, 0, temp.length);
        this.root.value = this.pattern; // Hack to have the full regex
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

class Match
{
    constructor(element, text, match=false, start=null, length=null, partial=false)
    {
        this.element = element; // Regex element
        this.text = text;       // Text candidate
        this.start = start;     // Start of the match in text candidate
        this.length = length;   // Length of candidate text matched
        this.match = match;     // Matched or not?
        this.partial = partial; // In case of not matching, is it due to not enough chars?
        //this.element_matches = [];  // Length of candidate text matched for each elements of the Regex
    }

    equals(other)
    {
        //console.log("getMatched()", this.getMatched(), other.getMatched(),
        //          "match", this.match, other.match, "partial", this.partial, other.partial,
        //          "length", this.length, other.length);
        return (this.element === other.element && this.getMatched() === other.getMatched() &&
                this.match === other.match && this.partial === other.partial &&
                this.length === other.length);
    }

    isPartial()
    {
        return this.partial;
    }

    isMatch()
    {
        return this.match;
    }

    reduce(length=null)
    {
        if (length === null)
        {
            this.length = this.element.getMin();
        }
        else
        {
            this.length -= length;
            if (this.length < this.element.getMin())
            {
                throw "Illogical match: can't be reduced lower than element min.";
            }
        }
    }


    // Pas de surchage de length en JavaScript
    size()
    {
        return this.length;
    }

    toString()
    {
        if (this.match)
        {
            return '<Match matched |' + this.getMatched() + '| #' + this.length + ' (' + this.start + ' to ' + (this.start + this.length - 1) + ')>';
        }
        else if (this.partial)
        {
            return '<Match partial |' + this.getMatched() + '| #' + this.length + ' ('  + this.start + ') >';
        }
        else
        {
            return '<Match none>';
        }
    }

    getMatched()
    {
        return ((this.length === null ? '' : this.text.substring(this.start, this.start + this.length)));
    }
}

//-----------------------------------------------------------------------------
// La classe MatchSet une encapsulation d'une liste de match
//-----------------------------------------------------------------------------

class MatchSet extends Match
{
    constructor(element, text, match=false, start=null, length=null, partial=false)
    {
        super(element, text, match, start, length, partial);
        this.matches = [];
    }

    push(m)
    {
        this.matches.push(m);
        this.length = this.size();
    }

    get(i)
    {
        if (i < 0 || i > this.matches.length)
        {
            throw "Index out of range: " + i + " / " + this.matches.length;
        }
        return this.matches[i];
    }

    last()
    {
        if (this.matches.length === 0)
        {
            throw "Cannot get the last element on an empty list";
        }
        return this.matches[this.matches.length - 1];
    }

    equals(other)
    {
        //console.log(this.size(), other.length);
        if (this.size() !== other.length)
        {
            return false;
        }
        if (other instanceof MatchSet)
        {
            for (let i = 0; i < this.matches.length; i++)
            {
                if (!this.matches[i].equals(other.get(i)))
                {
                    return false;
                }
            }
            return true;
        }
        else
        {
            this.length = this.size();
            return super.equals(other);
        }
    }

    reduce(length=null)
    {
        if (length === null)
        {
            this.last().length = this.last().element.getMin();
        }
        else
        {
            this.last().length -= length;
            if (this.last().length < this.last().element.getMin())
            {
                throw "Illogical match: can't be reduced lower than element min.";
            }
        }
    }

    // Pas de surchage de length en JavaScript
    size()
    {
        if (!this.match && !this.partial)
        {
            return null;
        }
        let total = null;
        for (let m of this.matches)
        {
            if (m.isMatch())
            {
                if (total === null)
                {
                    total = 0;
                }
                total += m.size();
            }
        }
        return total;
    }

    toString()
    {
        if (this.match)
        {
            return '<MatchSet(' + this.matches.length + ') matched |' + this.getMatched() + '| #' + this.size() + ' (' + this.start + ' to ' + (this.start + this.size() - 1) + ')>';
        }
        else if (this.partial)
        {
            return '<MatchSet(' + this.matches.length + ') partial |' + this.getMatched() + '| #' + this.size() + ' ('  + this.start + ') >';
        }
        else
        {
            return '<MatchSet(0) none>';
        }
    }

    getNbElementMatched()
    {
        return this.matches.length;
    }

    get(index)
    {
        if (index < 0 || index >= this.matches.length)
        {
            throw "Out of range index: " + index + " should be between 0 and inferior to " + this.matches.length;
        }
        return this.matches[index];
    }

    getMatched()
    {
        if (!this.match && !this.partial)
        {
            return '';
        }
        let total = '';
        for (let m of this.matches)
        {
            total += m.getMatched();
        }
        return total;
    }
}

/*
    isOverload()
    {
        return (this.length !== null && this.length <= this.text.length);
    }

    getOverload()
    {
        if (this.length === null || this.length === this.text.length)
        {
            return '';
        } else {
            return this.text.substring(this.length);
        }
    }
}
*/

export {Regex, Group, Class, Special, Match, MatchSet};