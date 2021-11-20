import {Regex, Match} from "./weyland.mjs";

var num = 0;
var neutral = 0;
var good = 0;
var bad = 0;

class ExpectedMatch
{
    constructor(text, length, result)
    {
        this.text = text;
        this.length = length;
        this.match = result;
    }
}

function test(pattern, text='', expected=null)
{
    num += 1;
    let title = num.toString().padStart(3, 0) + '. Testing: pattern=|' + pattern + '|';
    title += (text.length !== 0) ? ' vs candidate=|' + text + '|': "";
    console.log(title);
    console.log('----------');
    let r = new Regex(pattern);
    console.log(r.info());
    if (text.length !== 0)
    {
        let debug = [];
        let m = r.match(text, debug);
        for (let d of debug)
        {
            //console.log('    '.repeat(d[0]) + d[0].toString().padStart(3, '0') + '. ' + d[1]);
            console.log('    '.repeat(d[0]) + d[1]);
        }
        console.log(m.toString());
        if (expected !== null && expected instanceof ExpectedMatch)
        {
            let expected_match = new Match(r.root, expected.text); // Because it'Seq with is linked to Match instance. Should be changed.
            expected_match.length = expected.length;
            expected_match.text = expected.text;
            expected_match.match = expected.match;
            if (m.equals(expected_match))
            {
                console.log('=== OK ===\n');
                good += 1;
                return 1;
            }
            else
            {
                console.log('!!! KO !!!');
                console.log('Expected:', expected);
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

// Basic

test('abc');

// Specials

test('#');
test('°');
test('@');
test('&');

// All quantifiers in greedy, lazy and possessive forms

test('ab?c');
test('ab+c');
test('ab*c');
test('ab??c');
test('ab+?c');
test('ab*?c');
test('ab?+c');
test('ab++c');
test('ab*+c');

// Basic match

test('abc', 'abcdef');

// Special match

test('#', '1', new ExpectedMatch('1', 1, true));
test('##', '12', new ExpectedMatch('12', 2, true));
test('###', '123', new ExpectedMatch('123', 3, true));
test('@', 'a', new ExpectedMatch('a', 1, true));
test('@@', 'aà', new ExpectedMatch('aà', 2, true));
test('@@@', 'aàu', new ExpectedMatch('aàu', 3, true));
test('&&&', '1a_', new ExpectedMatch('1a_', 3, true));

// Custom class match

test('[ab]', 'a', new ExpectedMatch('a', 1, true));

// Basic match with quantifiers

test('a+', 'aaaaaaaaaaaaaaaaaa');
test('ba+b', 'baaaaaab');

// Special match with quantifiers

test('#+', '123');
test('@+', 'àbcdéf');
test('&+', 'abc_123');

// Actual match

test('".*"', '"abc"');
test('#+', '123');

console.log("Good    :", good);
console.log("Neutral :", neutral);
console.log("Bad     :", bad);
console.log("Total   :", good + neutral + bad);
