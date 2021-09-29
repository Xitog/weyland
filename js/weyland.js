/**
 * Evolutions from Weyland 0.x :
 * Replaced option and repeat parameters by min and max.
 * - min=0 => option
 * - max>1 => repeat
 * Added choice parameter to distinguish between choice [ ] and group ( )
 * 
 * Added possibility of grouping
 * Added alternative operator |
 */

/*
class Element
{
    toString()
    {
        let s = this.special ? "Special" : "Element";
        if (this.inverted)
        {
            s += "!";
        }
        let v = this.core.replace("\n", Element.NewLineCode);
        return "<" + s + " |" + v + "| {" + this.min + ", " + this.max + "}>";
    }

    is_choice()
    {
        return this.choice;
    }

    is_group()
    {
        return Array.isArray(this.core) && !this.choice;
    }

    is_included(other)
    {
        // gérer les choix et les groupes
    }
}
*/

//-----------------------------------------------------------------------------
// Fonctions de démarrage et de réaction
//-----------------------------------------------------------------------------

/* Fonctions de démarrage */

function start()
{
    let input = document.getElementById('code');
    input.addEventListener("keypress", 
        function (event)
        {
            if (event.code === "Enter")
            {
                react();
            }
        }
    );
    input.value = ' ';
}

function react()
{
    let input = document.getElementById('code');
    let output = document.getElementById('output');
    let val = input.value.trim();
    if (val.length === 0)
    {
        val = " ";
    }
    output.innerText = val;
    console.log('Text : ' + val);
    let regex = new Regex(val);
    console.log('Regex : ' + regex.toString());
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
        this.val = value;
        this.esc = escaped;
    }

    in(elements)
    {
        return (elements.includes(this.val) && !this.esc);
    }

    is(element)
    {
        return (element === this.val && !this.esc);
    }

    toString()
    {
        return '<Char |' + this.val + '| esc? ' + this.esc + '>'
    }
}

// Standard PCRE Regex Special char (15) : . ^ $ * + - ? ( ) [ ] { } \ |
// Added (3) : @ # &

Char.Alpha = '@';
Char.Digit = '#';
Char.AlphaNum = '&';
Char.Any = '.';
Char.Classes = [Char.Alpha, Char.Digit, Char.AlphaNum, Char.Any];

Char.ZeroOrOne = '?';
Char.OneOrMore = '+';
Char.ZeroOrMore = '*';
Char.Quantifiers = [Char.ZeroOrOne, Char.OneOrMore, Char.ZeroOrMore];

Char.OpenClass = '[';
Char.CloseClass = ']';

Char.Digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
Char.Letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 
                   'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 
                   'u', 'v', 'w', 'x', 'y', 'z'];
Char.Start = '^';
Char.End = '$';
Char.OpenGroup = '(';
Char.CloseGroup = ')';
Char.NameGroup = '?'
Char.OpenNameGroup = '<';
Char.CloseNameGroup = '>';
Char.InvertClass = '^';
Char.RangeClass = '-';
Char.OpenRepeat = '{';
Char.CloseRepeat = '}';
Char.SeparatorRepeat = ',';

Char.Alternative = '|';
Char.Escape = '\\';

Char.NewLineCode = "<NL>";
Char.StartCode = "<START>";
Char.EndCode = "<END>";

//-----------------------------------------------------------------------------
// La classe Group
//-----------------------------------------------------------------------------

class Group
{
    constructor(parent, start, end)
    {
        this.parent = parent;
        this.start = start;
        this.end = end;
    }

    toString()
    {
        return '<Group |' + this.parent.substring(this.start, this.end) + '| (' + this.start + ', ' + this.end + ')>'
    }
}

//-----------------------------------------------------------------------------
// La classe Node
//-----------------------------------------------------------------------------

class Node
{
    constructor(parent=null, value=null, min=1, max=1, special=false, inverted=false, choice=false) // Inverted & choice not used
    {
        this.parent = parent;
        this.children = [];
        this.value = value; // List of Element for [ ], List of Element or Regex for |
        this.min = min;
        this.max = max;
        this.special = special;
    }

    is_special()
    {
        return this.special;
    }

    is_optionnal()
    {
        return this.min === 0;
    }

    is_repeatable()
    {
        return this.max > 1;
    }

    is_root()
    {
        return (this.parent === null);
    }

    
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
        } else if (this.is_group()) { // Invalid now

        } else if (this.special) {
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
        } else {
            res = (candidate == this.core);
        }
    }

    last()
    {
        if (this.children.length === 0)
        {
            throw "Trying to get last siblings but this node has no children.";
        }
        return this.children[this.children.length - 1];
    }

    add(node)
    {
        this.children.push(node);
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
}

//-----------------------------------------------------------------------------
// La classe Regex
//-----------------------------------------------------------------------------

class Regex
{
    constructor(pattern)
    {
        this.pattern = pattern
        this.repr_pattern = pattern.replace("\n", Element.NewLineCode)
        this.elements = [];
        this.compile();
        if (this.elements.length === 0)
        {
            throw "Impossible to have a 0 element regex";
        }
    }

    toString()
    {
        // Dummy
        return '<Regex |' + this.repr_pattern + '| (' + this.elements.length + ')>';
    }

    compile()
    {
        // Transformation de la chaîne en une liste de Char : fusion de \x en un seul char (ne compte plus pour 2 !)
        // Cas particulier : \\x : le premier escape le deuxième qui n'escape pas le troisième. 
        let temp = [];
        let escaped = false;
        for (let i = 0; i < this.pattern.length; i++)
        {
            if (this.pattern[i] === "\\" && !escaped)
            {
                escaped = true;
            } else {
                temp.push(new Char(this.pattern[i], escaped));
                escaped = false;
            }
        }
        // Debug
        console.log("Chars :");
        if (temp.length === 0)
        {
            throw "A regex must have at least one char.";
        }
        if (temp[0].is(Char.Alternative))
        {
            throw "A regex cannot start with an alternate char.";
        }
        if (temp[0].is(Char.CloseClass))
        {
            throw "A regex cannot start with a closing class char.";
        }
        if (temp[temp.length-1].is(Char.Escape))
        {
            throw "A regex cannot finish with an escaped char.";
        }
        for (let i = 0; i < temp.length; i++)
        {
            console.log(i.toString().padStart(3, ' ') + '. ' + temp[i]);
        }
        // Tree
        let tree = new Node();
        let node = tree;
        for (let i = 0; i < temp.length; i++)
        {
            let current = temp[i];
            if (current.in(Char.Quantifiers)) { // +, *, ?
                let prev = node.last();
                if (current.is(Char.OneOrMore)) // +
                {
                    prev.max = -1;
                } else if (current.is(Char.ZeroOrMore)) // *
                {
                    prev.min = 0;
                    prev.max = -1;
                } else if (current.is(Char.ZeroOrOne)) // ?
                {
                    prev.min = 0;
                }
            } else if (current.is(Char.OpenClass)) {
                
            } else {
                node.add(new Node(node, current)); 
            }
        }
        console.log('Display tree :');
        console.log(tree.display());

        /*
        // On fait les groupes pour () et []
        let tree = new Node();
        let node = tree;
        for (let i = 0; i < temp.length; i++)
        {
            if (temp[i].is(Element.OpenGroup))
            {
                let level = 1;
                let end = null;
                for (let j = i+1; j < temp.length; j++)
                {
                    if (temp[j].is(Element.OpenGroup))
                    {
                        level += 1;
                    }
                    if (temp[j].is(Element.CloseGroup))
                    {
                        if (level == 1)
                        {
                            end = j;
                            break;
                        } else {
                            level -= 1;
                        }
                    }
                }
                if (end === null)
                {
                    throw "No ending ) for ( at " + i;
                }
                node.add(new Node(node, new Group(i, j)));
            } else {
                node.add(new Node(node, temp[i]));
            }
        }
        
        */
        this.elements = [new Element('a')]; // Dummy
        return;
    }

    check_at(candidate, index)
    {
        if (index >= this.elements.length)
        {
            throw 'Index ' + index + ' out of range of Regex (' + this.elements.length + ')';
        }
        return this.elements[index].check(candidate);
    }

    // Pas de surcharge de [ ] en JavaScript
    get(index)
    {
        return this.elements[index];
    }

    // Pas de surchage de length en JavaScript
    size()
    {
        return this.elements.length
    }

    info()
    {

    }

    is_specific()
    {

    }

    match(candidate)
    {
        if (this.debug)
        {
            console.log('    Regex#match ' + this.toString() + ' vs |' + candidate + '|');
        }
        let matched = Array(this.elements.length).fill(0);
        let index_candidate = 0;
        let index_regex = 0;
        let final = new Match(this, candidate);
        let res = true;
        while (index_candidate < candidate.length && index_regex < this.elements.length)
        {
            let elem = this.elements[index_regex];
            res = this.check_at(candidate[index_candidate], index_regex)
            if (this.debug)
            {
                console.log('        iter index_candidate=' + index_candidate + '/' + (candidate.length - 1) + 
                                        ' index_regex=' + index_regex + '/' + (this.elements.length - 1) +
                                        ' ' + candidate[index_candidate] + ' vs ' + elem + ' => ' + res)
            }
            if (res)
            {
                if (elem.is_repeatable())
                {

                } else {
                    matched[index_regex] += 1;
                    index_regex += 1;
                }
            } else {
                if (elem.is_optionnal() || matched[index_regex] > 0) // ?/* or (+ and 
                {
                    index_regex += 1
                } else {
                    break;
                }
            }
        }
        // Get last none empty
        let count = 0;
        for (let i=0; i < matched.length; i++)
        {
            count += matched[i];
            if (matched[i] === 0 && !this.elements[i].is_optionnal())
            {
                res = false;
            }
        }
        // at_start is not tested because match search only at the start of the string
        // this test is only valid because match search only at the start of the string
    }
}

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

    get_match()
    {
        return ((this.length === null ? '' : this.text.substring(0, this.length - 1)));
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
            return '<Match matched |' + this.get_match() + '|>';
        } else if (this.partial) {
            return '<Match partial |' + this.get_match() + '|>';
        } else {
            return '<Match none>';
        }
    }
}

//var e = new Element('a');
//console.log(e.toString());
//var r = new Regex('abc');
//console.log(r.toString());
//console.log(r.match('abc'));
