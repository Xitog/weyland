import {Regex, Match, MatchSet} from "./weyland.mjs";

var num = 0;
var neutral = 0;
var good = 0;
var bad = 0;

class ExpectedResult
{
    constructor(good, left, result, length=null)
    {
        if (!result && left !== '...' && length !== null)
        {
            throw "A result without match and not partial can't have a length";
        }
        if (!result && left === '...' && length === null)
        {
            throw "A result without match but partial must have a length";
        }
        if (result && length === null)
        {
            throw "A matching result must have a length";
        }
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
        if (this.length !== null)
        {
            return "ExpectedResult {" + this.text.substring(0, this.length) + "||" + this.left +
               " (" + this.length + ") res=" + this.match + " part=" + this.partial + "}";
        }
        else
        {
            return "ExpectedResult { no match }";
        }
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

    display_result(m, level=0)
    {
        console.log("    ".repeat(level) + m.toString());
        if (m instanceof MatchSet)
        {
            for (let i=0; i < m.getNbElementMatched(); i++)
            {
                this.display_result(m.get(i), level + 1);
            }
        }
    }

    test(key)
    {
        num += 1;
        let title = num.toString().padStart(3, 0) + '. Testing: pattern=|' + this.pattern + '|';
        title += (this.text.length !== 0) ? ' vs candidate=|' + this.text + '|': "";
        console.log(title);
        console.log('======================================================================');
        let r = new Regex(this.pattern);
        console.log('\nRegex:\n------\n');
        console.log(r.info());
        if (this.text.length !== 0)
        {
            let debug = [];
            console.log('\nMatching:\n---------\n');
            let m = r.match(this.text, debug);
            for (let d of debug)
            {
                //console.log('    '.repeat(d[0]) + d[0].toString().padStart(3, '0') + '. ' + d[1]);
                console.log('    '.repeat(d[0]) + d[1]);
            }
            console.log('\nResults:\n--------\n');
            this.display_result(m);
            if (this.expected !== null && this.expected instanceof ExpectedResult)
            {
                let expected_match = new Match(r.root, this.expected.text); // Because it'Seq with is linked to Match instance. Should be changed.
                expected_match.length = this.expected.length;
                expected_match.text = this.expected.text;
                expected_match.match = this.expected.match;
                expected_match.partial = this.expected.partial;
                if (m.equals(expected_match))
                {
                    console.log('\n<' + key + '> === OK ===\n');
                    good += 1;
                    return 1;
                }
                else
                {
                    console.log('\n<' + key + '> !!! KO !!!');
                    console.log('Expected:', this.expected.toString());
                    console.log('Result  :', m.toString(), "\n");
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

// ExpectedResult
//  1. la partie du texte qui est matchée
//  2. la partie du texte qui est laissée ou ... si partial
//  3. match ou pas? (un match partial est FAUX)
//  4. la longueur de la partie matchée (ou partiellement matchée)

var tests = {
    // Basic

     100: new Test('abc', 'abc', new ExpectedResult('abc', '', true, 3)),
     101: new Test("abc", "zor", new ExpectedResult('', 'zor', false)),
     102: new Test("abc", "ab", new ExpectedResult('ab', '...', false, 2)), // On ne précise la longueur d'un false que dans le cas d'un partial
     103: new Test("abc", "abc", new ExpectedResult('abc', '', true, 3)),
     104: new Test("abc", "abcd", new ExpectedResult('abc', 'd', true, 3)),

    // Specials

     2: new Test('#', '1', new ExpectedResult('1', '', true, 1)),
     3: new Test('°', ' ', new ExpectedResult(' ', '', true, 1)),
     4: new Test('@', 'a', new ExpectedResult('a', '', true, 1)),
     5: new Test('&', 'b', new ExpectedResult('b', '', true, 1)),

    110: new Test("&", "5", new ExpectedResult('5', '', true, 1)),
    111: new Test("\\w", "5", new ExpectedResult('5', '', true, 1)),
    112: new Test("&", "a", new ExpectedResult('a', '', true, 1)),
    113: new Test("\\w", "a", new ExpectedResult('a', '', true, 1)),
    114: new Test("&", "ab", new ExpectedResult('a', 'b', true, 1)),
    115: new Test("\\w", "ab", new ExpectedResult('a', 'b', true, 1)),

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

    15: new Test('abc', 'abcdef', new ExpectedResult('abc', 'def', true, 3)),

    // Special match

    16: new Test('#', '1', new ExpectedResult('1', '', true, 1)),
    17: new Test('##', '12', new ExpectedResult('12', '', true, 2)),
    18: new Test('###', '123', new ExpectedResult('123', '', true, 3)),
    19: new Test('@', 'a', new ExpectedResult('a', '', true, 1)),
    20: new Test('@@', 'aà', new ExpectedResult('aà', '', true, 2)),
    21: new Test('@@@', 'aàu', new ExpectedResult('aàu', '', true, 3)),
    22: new Test('&&&', '1a_', new ExpectedResult('1a_', '', true, 3)),

    // Custom class match

    23: new Test('[ab]', 'a', new ExpectedResult('a', '', true, 1)),

    // Basic match with quantifiers

    24: new Test('a+', 'aaaaaaaaaaaaaaaaaa', new ExpectedResult('aaaaaaaaaaaaaaaaaa', '', true, 18)),
    25: new Test('ba+b', 'baaaaaab', new ExpectedResult('baaaaaab', '', true, 8)),

    // Special match with quantifiers

    26: new Test('#+', '123', new ExpectedResult('123', '', true, 3)),
    27: new Test('@+', 'àbcdéf', new ExpectedResult('àbcdéf', '', true, 6)),
    28: new Test('&+', 'abc_123', new ExpectedResult('abc_123', '', true, 7)),

    150: new Test("a&+", "a5", new ExpectedResult('a5', '', true, 2)),
    151: new Test("a&+", "a", new ExpectedResult('a', '...', false, 1)),
    152: new Test("a&+", "ab", new ExpectedResult('ab', '', true, 2)),
    153: new Test("a&+", "abc", new ExpectedResult('abc', '', true, 3)),

    154: new Test("a@+", "a", new ExpectedResult('a', '...', false, 1)),
    155: new Test("a@+", "ab", new ExpectedResult('ab', '', true, 2)),
    156: new Test("a@+", "a5", new ExpectedResult('a', '5', false)),
    157: new Test("a@*", "a5", new ExpectedResult('a', '5', true, 1)),

    158: new Test("a@*", "a", new ExpectedResult('a', 'a', true, 1)),
    159: new Test("a@*", "ab", new ExpectedResult('ab', '', true, 2)),
    160: new Test("a@*", "abc", new ExpectedResult('abc', '', true, 3)),

    200: new Test("#", "a", new ExpectedResult('', 'a', false)),
    201: new Test("\\d", "a", new ExpectedResult('', 'a', false)),
    202: new Test("#", "1", new ExpectedResult('1', '', true, 1)),
    203: new Test("\\d", "1", new ExpectedResult('1', '', true, 1)),
    204: new Test("#", "15", new ExpectedResult('1', '5', true, 1)),
    205: new Test("\\d", "15", new ExpectedResult('1', '5', true, 1)),

    // Actual match

    29: new Test('".*"', '"abc"', new ExpectedResult('"abc"', '', true, 5)),
    30: new Test("'.*'", "'Je suis un zorba'", new ExpectedResult("'Je suis un zorba'", '', true, 18)),
    31: new Test('#+', '123', new ExpectedResult('123', '', true, 3)),

    // Group

    1000: new Test("(ab)(cd)", "abcd", new ExpectedResult('abcd', '', true, 4)), // My first group
    1001: new Test("(ab)*", "ababab", new ExpectedResult('ababab', '', true, 6)),
    1002: new Test("ab(cd)*ef", "abcdef", new ExpectedResult('abcdef', '', true, 6)),
    1003: new Test("ab(cd)*ef", "abef", new ExpectedResult('abef', '', true, 4))
}

let to_execute = Object.keys(tests);
//let to_execute = [156];

//for (let [key, value] of Object.entries(tests))
for (let key of to_execute)
{
    let value = tests[key];
    process.stdout.write('<' + key + '> ');
    value.test(key);
}

console.log("Good    :", good);
console.log("Neutral :", neutral);
console.log("Bad     :", bad);
console.log("Total   :", good + neutral + bad);
