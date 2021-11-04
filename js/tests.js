import {Regex} from "./weyland.mjs";

var num = 0;

function test(pattern, text='')
{
    num += 1;
    let title = num.toString().padStart(3, 0) + '. Testing: ' + pattern;
    title += (text.length !== 0) ? ' vs ' + text : "";
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
            console.log('    '.repeat(d[0]) + d[0].toString().padStart(3, '0') + '. ' + d[1]);
        }
        console.log(m.toString() + "\n");
    }
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

test('#', '1');
test('##', '12');
test('###', '123');
test('@', 'a');
test('@@', 'aà');
test('@@@', 'aàu');
test('&&&', '1a_');

// Custom class match

// Basic match with quantifiers

test('a+', 'aaaaaaaaaaaaaaaaaa');
test('ba+b', 'baaaaaab');

// Special match with quantifiers

test('#+', '123');
test('@+', 'àbcdéf');
test('&+', 'abc_123');
