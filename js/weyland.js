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
        let v = this.core === "\n" ? "<NL>" : this.core;
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

    }

    compile()
    {

    }

    check_at()
    {

    }

    // Index ?
    get(index)
    {

    }

    // Length ?

    info()
    {

    }

    is_specific()
    {

    }

    match(candidate)
    {

    }
}

class Match
{

}

var e = new Element('a');
console.log(e.toString());
