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
// Fonctions de démarrage et de réaction
//-----------------------------------------------------------------------------

/* Fonctions de démarrage */

let regex = null;
let last_text = null;

function start()
{
    let regex = document.getElementById('regex');
    regex.addEventListener("keypress",
        function (event)
        {
            if (event.code === "Enter")
            {
                react('regex');
            }
        }
    );
    regex.value = '';
    let text = document.getElementById('text');
    text.addEventListener("keypress",
        function (event)
        {
            if (event.code === "Enter")
            {
                react('text');
            }
        }
    );
    text.value = '';
}

function explore(tree, regex)
{
    let child = document.createElement('li');
    child.innerText = regex.toString();
    if (regex instanceof Regex)
    {
        if (regex.elements.length > 0)
        {
            let subtree = document.createElement('ol');
            for (let e of regex.elements)
            {
                explore(subtree, e);
            }
            child.appendChild(subtree);
        }
    } else if (regex instanceof Class) {
        if (regex.value === Class.Custom)
        {
            let subtree = document.createElement('ol');
            for (let e of regex.elements)
            {
                explore(subtree, e);
            }
            child.appendChild(subtree);
        }
    } else if (regex instanceof Element) {
        // pass
    }
    tree.appendChild(child);
}

function react(type)
{
    console.clear();

    let regex = null;

    // Clean
    let ana1 = document.getElementById('ana1');
    ana1.innerHTML = "";
    let ana2 = document.getElementById('ana2');
    ana2.innerHTML = "";
    let res1 = document.getElementById('res1');
    res1.innerHTML = "";
    let res2 = document.getElementById('res2');
    res2.innerHTML = "";

    // Get info
    let pattern = document.getElementById('regex').value.trim();
    let text = document.getElementById('text').value.trim();

    if (pattern !== "")
    {
        let output = document.getElementById('compile');
        output.setAttribute('style', 'display: block');

        regex = new Regex(pattern, null, false);

        // Get Chars
        let chars = regex.precompile();
        let list = document.createElement('ol');
        for (let i = 0; i < chars.length; i++)
        {
            let e = document.createElement('li');
            e.innerText = chars[i].toString();
            list.appendChild(e);
        }
        ana1.appendChild(list);
        // Get Regex
        regex.compile();
        let tree = document.createElement('ul');
        explore(tree, regex);
        ana2.appendChild(tree);
    }

    if (text !== "")
    {
        if (type === "text" && regex === null)
        {
            alert("No regex defined. Please, define a regex first.");
            return;
        }

        let output = document.getElementById('match');
        output.setAttribute('style', 'display: block');

        let result = regex.match(text);
        if (result === null || result === undefined)
        {
            res1.innerText = "No result.";
        }
        else
        {
            res1.innerText = result.toString();

            let list = document.createElement('ol');
            for (let i = 0; i < result.size(); i++)
            {
                let e = document.createElement('li');
                e.innerText = result.get(i).toString();
                list.appendChild(e);
            }
            res2.appendChild(list);
        }
    }
}

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
    constructor(value, min=1, max=1, greedy=true)
    {
        this.value = value;
        this.min = min;
        this.max = max;
        this.greedy = greedy;
        this.value = value.replace("\n", Element.NewLineCode)
    }

    getPattern()
    {
        return this.value;
    }

    setLazy()
    {
        this.greedy = false;
    }

    toString()
    {
        let card = "";
        if (this.min !== 1 || this.max !== 1)
        {
            let max = (this.max === -1) ? "*" : this.max;
            card = " {" + this.min + ", " + max + "}";
            card += (this.greedy) ? ' greedy' : ' lazy';
        }
        return "Element |" + this.value + "|" + card;
    }

    isOptionnal()
    {
        return this.min === 0;
    }

    isRepeatable()
    {
        return this.max > 1;
    }

    match_one(candidate)
    {
        return (candidate === this.value);
    }

    match(candidate, start, stop=null, next=null, level=0)
    {
        if (stop === null)
        {
            stop = candidate.length;
        }
        let matched = 0;
        console.log('    '.repeat(level) + 'Start Element#match loop with : ', candidate, ', ', start, ', ',
                    stop, ', |', candidate[start], '| vs ', this.value, ', min=', this.min, ', max=', this.max);
        let notbreak = true;
        for (let i = start; i < stop && matched< this.max && notbreak; i++)
        {
            let res = this.match_one(candidate[i]);
            if (!res)
            {
                notbreak = false;
            }
            else if (this.greedy || this.next === null || matched < this.min)
            {
                matched += 1;
            }
            else // res ok, not greedy => we must try if the next Element is ok and if it is stop
            {
                let next_res = next.match(candidate, i, stop, null, level + 1);
                if (next_res[0])
                {
                    notbreak = false;
                }
                else
                {
                    matched += 1;
                }
            }
            console.log('    '.repeat(level) + '( candidate[i=' + i + ']=' + candidate[i] + ' vs ' + this.value + ' ) res=' + res + ' matched=' + matched + ' notbreak=' + notbreak);
        }
        return [matched >= this.min, matched];
    }
}
// Classes
Element.Alpha = '@';
Element.Digit = '#';
Element.DigitEscaped = 'd';
Element.AlphaNum = '&'; // w (alpha + digit + _)
Element.AlphaNumEscaped = 'w';
Element.Space = '°';    // s (' ', '\t', '\n', '\f')
Element.SpaceEscaped = 's';
Element.Any = '.';
// Custom classes
Element.OpenClass = '[';
Element.CloseClass = ']';
Element.InvertClass = '^';
Element.RangeClass = '-';
// Quantifiers
Element.ZeroOrOne = '?'; // Can be lazy too
Element.OneOrMore = '+';
Element.ZeroOrMore = '*';
// Group
Element.CloseGroup = ')';
// Others
Element.Alternative = '|';
Element.Escape = '\\';
// For clean display
Element.NewLineCode = "<NL>";
// Base
Element.Spaces = [' ', '\t', '\n', '\f'];
Element.Digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
Element.Latin = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
'U', 'V', 'W', 'X', 'Y', 'Z'];
Element.Letters = Element.Latin + [
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
    constructor(type, inverted, elements=null)
    {
        super(type, 1, 1, false);
        if (type !== Element.Alpha && type !== Element.Digit && type !== Element.AlphaNum
            && type !== Element.Space && type !== Element.Any && type !== Class.Custom)
        {
            throw "A class must be digit, letter, space, word or custom not: |" + type + "|.";
        }
        this.inverted = inverted;
        if (type === Class.Custom && (elements === null || elements.length <= 1))
        {
            throw "A custom class must have at least two elements.";
        }
        if (type !== Class.Custom && elements !== null)
        {
            throw "A not custom class must not define elements.";
        }
        else if (type !== Class.Custom)
        {
            elements = [new Element(type)];
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
        let nb = "";
        if (this.value === Class.Custom)
        {
            nb = " (" + this.elements.length + ")";
        }
        let inverted = (this.inverted) ? " inverted" : ""
        return "Class |" + this.value + "|" + card + nb + inverted;
    }

    match_one(candidate)
    {
        if (this.value === Element.Alpha)
        {
            return Element.Letters.includes(candidate);
        }
        else if (this.value === Element.Digit)
        {
            return Element.Digits.includes(candidate);
        }
        else if (this.value === Element.AlphaNum)
        {
            return (candidate == '_' || Element.Latin.includes(candidate) || Element.Digit.includes(candidate));
        }
        else if (this.value === Element.Space)
        {
            return Element.Spaces.includes(candidate);
        }
        else if (this.value === Element.Any)
        {
            return (candidate !== '\n');
        }
        else if (this.value === Class.Custom)
        {
            for (let e of this.elements)
            {
                if (e.match(candidate))
                {
                    return true;
                }
            }
        }
        else
        {
            throw "Unknown type for class : " + this.value;
        }
    }
}
Class.Custom = 'Custom';

//-----------------------------------------------------------------------------
// La classe Regex
//-----------------------------------------------------------------------------

class Regex extends Element
{
    constructor(pattern, parent=null, autocompile=true)
    {
        super(pattern, 1, 1, false);
        this.elements = [];
        this.parent = parent;
        if (autocompile)
        {
            this.compile();
        }
    }

    toString()
    {
        return 'Regex |' + this.value + '| (' + this.elements.length.toString() + ')';
    }

    precompile()
    {
        // Transformation de la chaîne en une liste de Char : fusion de \x en un seul char (ne compte plus pour 2 !)
        // Cas particulier : \\x : le premier escape le deuxième qui n'escape pas le troisième.
        let temp = [];
        let escaped = false;
        for (let i = 0; i < this.value.length; i++)
        {
            if (this.value[i] === "\\" && !escaped)
            {
                escaped = true;
            } else {
                temp.push(new Char(this.value[i], escaped));
                escaped = false;
            }
        }
        if (escaped) // Si on finit par un \ on le met mais ça ne passera pas les checks
        {
            temp.push(new Char(this.value[this.value.length-1], false));
        }
        return temp;
    }

    compile_basic_classes(current, target)
    {
        let res = true;
        if (current.is(Element.Digit) || current.is_escaped(Element.DigitEscaped))
        {
            target.push(new Class(Element.Digit));
        }
        else if (current.is(Element.Alpha))
        {
            target.push(new Class(Element.Alpha));
        }
        else if (current.is(Element.Space) || current.is_escaped(Element.SpaceEscaped))
        {
            target.push(new Class(Element.Space));
        }
        else if (current.is(Element.AlphaNum) || current.is_escaped(Element.AlphaNumEscaped))
        {
            target.push(new Class(Element.AlphaNum));
        }
        else if (current.is(Element.Any))
        {
            target.push(new Class(Element.Any));
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
        this.elements = [];
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
            let prev = (this.elements.length > 0) ? this.elements[this.elements.length-1] : null;
            // Classes
            if (this.compile_basic_classes(current, this.elements))
            {
                // everything is done in the function, do nothing here.
            }
            // Custom classes
            else if (current.is(Element.OpenClass))
            {
                let end = -1;
                let members = [];
                let inverted = false;
                for (let j = i + 1; j < temp.length; j++)
                {
                    if (j == i + 1 && temp[j].is(Element.InvertClass))
                    {
                        inverted = true;
                    }
                    else if (temp[j].is(Element.CloseClass))
                    {
                        end = j;
                        break;
                    }
                    else if (this.compile_basic_classes(temp[j], members))
                    {
                        // everything is done in the function, do nothing here.
                    }
                    else
                    {
                        members.push(new Element(temp[j].value));
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
                this.elements.push(new Class(Class.Custom, inverted, members));
                //console.log(this.elements[this.elements.length-1]);
                i = end;
            }
            // Quantifiers
            else if (current.is(Element.OneOrMore)) // +
            {
                prev.max = Infinity;
            }
            else if (current.is(Element.ZeroOrMore)) // *
            {
                prev.min = 0;
                prev.max = Infinity;
            }
            else if (current.is(Element.ZeroOrOne)) // ?
            {
                // There was a previous modifier, this one is making it lazy
                if (prev.min !== 1 || prev.max !== 1)
                {
                    prev.setLazy();
                }
                else
                {
                    prev.min = 0;
                }
            }
            else
            {
                this.elements.push(new Element(current.value));
            }
        }
        if (this.elements.length === 0)
        {
            throw "Impossible to have a regex with 0 element.";
        }
    }

    match(candidate, start=0, stop=null, next=null, level=0)
    {
        if (stop === null)
        {
            stop = candidate.length;
        }
        // Regex is not an atomic Element but a list of Elements so matched is now an array instead of a single value
        let matched = Array(this.elements.length).fill(0);
        let index_candidate = start;
        let index_regex = 0;

        while (index_candidate < stop && index_regex < this.elements.length)
        {
            let elem = this.elements[index_regex];
            if (index_regex >= this.elements.length)
            {
                throw 'Index ' + index + ' out of range of Regex (' + this.elements.length + ')';
            }
            let next = (index_regex + 1 < this.elements.length) ? this.elements[index_regex + 1] : null;
            let res = elem.match(candidate, index_candidate, stop, next);
            //console.log('        iter index_candidate=' + index_candidate + '/' + (stop - start - 1) +
            //                            ' index_regex=' + index_regex + '/' + (this.elements.length - 1) +
            //                            ' ' + candidate[index_candidate] + ' vs ' + elem + ' => ' + res);
            if (res[0] === true)
            {
                matched[index_regex] += res[1];
            }
            else
            {
                if (!elem.isOptionnal())
                {
                    break;
                }
            }
            index_regex += 1;
            index_candidate += res[1];
        }
        console.log('End of loop: icandidate=', index_candidate, ' iregex=', index_regex, 'lregex=', this.elements.length, ' parent=', this.parent);
        let final_res = (index_regex === this.elements.length);
        if (this.parent !== null)
        {
            if (final_res)
            {
                return [final_res, matched.reduce((a, b) => a + b, 0)];
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
            // at_start is not tested because match search only at the start of the string
            // this test is only valid because match search only at the start of the string
            // TODO
        }
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

/*
    check(candidate)
    {
        let res = false;
        if (this.is_choice()) // Invalid now
        {
            for (let sub_elem in self.core)
            {
                res = sub_elem.check(candidate);
                if (res)
                {
                    break;
                }
            }

            if (this.core === Element.Alpha)
            {
                res = (Element.Letters.includes(candidate));
            } else if (this.core === Element.Digit) {
                res = (Element.Digits.includes(candidate));
            } else if (this.core === Element.AlphaNum) {
                res = (Element.Letters.includes(candidate) || Element.Digits.includes(candidate));
            } else if (this.core === Element.Any) {
                res = (candidate !== '\n');
            } else if (this.core === Element.Start) {
                res = (candidate === '<START>');
            } else if (this.core === Element.End) {
                res = (candidate === '<END>');
            }
    }

    display(level=0)
    {
        let val = (this.value === null) ? "" : this.value.toString();
        let label = (this.parent === null) ? "Root" : "Node";
        let min = this.min.toString();
        let max = (this.max === -1) ? "n" : this.max.toString();
        let card = (this.min === 1 && this.max === 1) ? "" : " {" + min + ", " + max + "}";
        let s = "    ".repeat(level) + "<" + label + " |" + val + "| " + card + ">";
        if (this.children.length > 0)
        {
            s += "\n";
        }
        for (let i=0; i < this.children.length; i++)
        {
            s += i.toString().padStart(3, ' ') + '. ' + this.children[i].display(level + 1) + "\n";
        }
        return s;
    }
*/

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

    get(index)
    {
        if (index < 0 || index >= this.element_matches.length)
        {
            throw "Out of range index: " + index + " should be between 0 and " + this.element_matches.length;
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

    info(starter='')
    {
        console.log(starter + this.text);
        if (this.match || this.partial)
        {
            console.log(starter + '^' * this.length + ' matched');
            let last = 0;
            console.log(starter + 'Iter  Element                Nb  Matched');
            for (let i = 0; i < this.regex.size(); i++)
            {
                let nb = this.element_matches[i];
                let tx = this.text.substring(last, last + nb);
                console.log(starter + i.toString().padStart(5, '0') + ' ' + this.regex.get(i).toString().padStart(22, ' ') + ' ' + nb.toString().padStart(3, '0') + ' |' + tx + '| (from ' + last.toString() + ')');
                last += nb;
            }
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
