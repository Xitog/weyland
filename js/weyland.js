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
    let val = input.value;
    if (val.length === 0)
    {
        val = " "
    }
    output.innerText = val;
    console.log(val);
}

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
class Element
{
    constructor(core, min=1, max=1, special=false, inverted=false, choice=false)
    {
        this.core = core;
        this.min = min;
        this.max = max;
        this.special = special;
        this.inverted = inverted;
        this.choice = choice;
    }

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

    check(candidate)
    {
        let res = false;
        if (this.is_choice())
        {
            for (let sub_elem in self.core)
            {
                res = sub_elem.check(candidate);
                if (res)
                {
                    break;
                }
            }
        } else if (this.is_group()) {

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
}

Element.Digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
Element.Letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 
                   'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 
                   'u', 'v', 'w', 'x', 'y', 'z'];
Element.Alpha = '@';
Element.Digit = '#';
Element.AlphaNum = '&';
Element.Any = '.';
Element.Start = '^';
Element.End = '$';
Element.OpenGroup = '(';
Element.CloseGroup = ')';
Element.NameGroup = '?'
Element.OpenNameGroup = '<';
Element.CloseNameGroup = '>';
Element.OpenClass = '[';
Element.CloseClass = ']';
Element.InvertClass = '^';
Element.RangeClass = '-';
Element.OpenRepeat = '{';
Element.CloseRepeat = '}';
Element.SeparatorRepeat = ',';
Element.ZeroOrOne = '?';
Element.OneOrMore = '+';
Element.ZeroOrMore = '*';
Element.Alternative = '|';
Element.NewLineCode = "<NL>";
Element.StartCode = "<START>";
Element.EndCode = "<END>";

class Regex
{
    constructor(pattern, debug=false)
    {
        this.pattern = pattern
        this.repr_pattern = pattern.replace("\n", Element.NewLineCode)
        this.debug = debug;
        this.elements = [];
        this.compile();
        if (this.elements.length === 0)
        {
            throw new Exception("Impossible to have a 0 element regex");
        }
    }

    toString()
    {
        // Dummy
        return '<Regex |' + this.repr_pattern + '|>';
    }

    compile()
    {
        // Dummy
        for (let c in this.pattern)
        {
            this.elements.push(new Element(c));
        }
    }

    check_at(candidate, index)
    {
        if (index >= this.elements.length)
        {
            throw new Exception('Index ' + index + ' out of range of Regex (' + this.elements.length + ')')
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

var e = new Element('a');
console.log(e.toString());
var r = new Regex('abc');
console.log(r.toString());
console.log(r.match('abc'));
