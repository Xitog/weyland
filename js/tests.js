import {Regex, Match} from "./weyland.mjs";

var num = 0;
var neutral = 0;
var good = 0;
var bad = 0;

class ExpectedMatch
{
    constructor(good, left, length, result)
    {
        if (left !== '...')
        {
            this.text = good + left;
            this.left = left; // good = thjs.text.substring(0, this.length)
            this.partial = false;
        }
        else
        {
            this.text = good;
            this.left = '';
            this.partial = true;
        }
        this.length = length;
        this.match = result;
    }

    toString()
    {
        return "ExpectedMatch {" + this.text.substring(0, this.length) + "||" + this.left +
               " (" + this.length + ") res= " + this.match + " part= " + this.partial + "}";
    }

    getMatch()
    {
        return ((this.length === null ? '' : this.text.substring(0, this.length)));
    }
}

class Test
{
    constructor(pattern, text='', expected=null)
    {
        this.pattern = pattern;
        this.text = text;
        this.expected = expected;
    }

    test()
    {
        num += 1;
        let title = num.toString().padStart(3, 0) + '. Testing: pattern=|' + this.pattern + '|';
        title += (this.text.length !== 0) ? ' vs candidate=|' + this.text + '|': "";
        console.log(title);
        console.log('----------');
        let r = new Regex(this.pattern);
        console.log(r.info());
        if (this.text.length !== 0)
        {
            let debug = [];
            let m = r.match(this.text, debug);
            for (let d of debug)
            {
                //console.log('    '.repeat(d[0]) + d[0].toString().padStart(3, '0') + '. ' + d[1]);
                console.log('    '.repeat(d[0]) + d[1]);
            }
            console.log(m.toString());
            if (this.expected !== null && this.expected instanceof ExpectedMatch)
            {
                let expected_match = new Match(r.root, this.expected.text); // Because it'Seq with is linked to Match instance. Should be changed.
                expected_match.length = this.expected.length;
                expected_match.text = this.expected.text;
                expected_match.match = this.expected.match;
                if (m.equals(expected_match))
                {
                    console.log('=== OK ===\n');
                    good += 1;
                    return 1;
                }
                else
                {
                    console.log('!!! KO !!!');
                    console.log('Expected:', this.expected.toString());
                    console.log('Result  :', m, "\n");
                    bad += 1;
                    process.exit() // return -1
                }
            }
            else
            {
                console.log("");
            }
        }
        neutral += 1;
        return 0;
    }
}

// ExpectedMatch
//  1. la partie du texte qui est matchée
//  2. la partie du texte qui est laissée ou ... si partial
//  3. la longueur de la partie matchée
//  4. match ou pas? (un match partial est FAUX)

var tests = {
    // Basic
     100: new Test('abc', 'abc', new ExpectedMatch('abc', '', 3, true)),
     101: new Test("abc", "zor", new ExpectedMatch('', 'zor', 0, false)),
     102: new Test("abc", "ab", new ExpectedMatch('ab', '...', 2, false)),
     103: new Test("abc", "abc", new ExpectedMatch('abc', '', 3, true)),
     104: new Test("abc", "abcd", new ExpectedMatch('abc', 'd', 3, true)),

    // Specials
     2: new Test('#', '1', new ExpectedMatch('1', '', 1, true)),
     3: new Test('°', ' ', new ExpectedMatch(' ', '', 1, true)),
     4: new Test('@', 'a', new ExpectedMatch('a', '', 1, true)),
     5: new Test('&', 'b', new ExpectedMatch('b', '', 1, true)),

    // All quantifiers in greedy, lazy and possessive forms

     6: new Test('ab?c'),
     7: new Test('ab+c'),
     8: new Test('ab*c'),
     9: new Test('ab??c'),
    10: new Test('ab+?c'),
    11: new Test('ab*?c'),
    12: new Test('ab?+c'),
    13: new Test('ab++c'),
    14: new Test('ab*+c'),

    // Basic match

    15: new Test('abc', 'abcdef', new ExpectedMatch('abc', 'def', 3, true)),

    // Special match

    16: new Test('#', '1', new ExpectedMatch('1', '', 1, true)),
    17: new Test('##', '12', new ExpectedMatch('12', '', 2, true)),
    18: new Test('###', '123', new ExpectedMatch('123', '', 3, true)),
    19: new Test('@', 'a', new ExpectedMatch('a', '', 1, true)),
    20: new Test('@@', 'aà', new ExpectedMatch('aà', '', 2, true)),
    21: new Test('@@@', 'aàu', new ExpectedMatch('aàu', '', 3, true)),
    22: new Test('&&&', '1a_', new ExpectedMatch('1a_', '', 3, true)),

    // Custom class match

    23: new Test('[ab]', 'a', new ExpectedMatch('a', '', 1, true)),

    // Basic match with quantifiers

    24: new Test('a+', 'aaaaaaaaaaaaaaaaaa', new ExpectedMatch('aaaaaaaaaaaaaaaaaa', '', 18, true)),
    25: new Test('ba+b', 'baaaaaab', new ExpectedMatch('baaaaaab', '', 8, true)),

    // Special match with quantifiers

    26: new Test('#+', '123', new ExpectedMatch('123', '', 3, true)),
    27: new Test('@+', 'àbcdéf', new ExpectedMatch('àbcdéf', '', 6, true)),
    28: new Test('&+', 'abc_123', new ExpectedMatch('abc_123', '', 7, true)),

    // Actual match

    29: new Test('".*"', '"abc"', new ExpectedMatch('"abc"', '', 5, true)),
    30: new Test("'.*'", "'Je suis un zorba'", new ExpectedMatch("'Je suis un zorba'", '', 18, true)),
    31: new Test('#+', '123', new ExpectedMatch('123', '', 3, true))
}

for (let [key, value] of Object.entries(tests))
{
    process.stdout.write('<' + key + '> ');
    value.test();
}

console.log("Good    :", good);
console.log("Neutral :", neutral);
console.log("Bad     :", bad);
console.log("Total   :", good + neutral + bad);
