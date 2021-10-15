import {Regex} from "./weyland.js";

function test(pattern, text='')
{
    let title = 'Testing: ' + pattern;
    title += (text.length !== 0) ? ' vs ' + text : "";
    console.log(title);
    console.log('----------');
    let r = new Regex(pattern);
    console.log(r.info());
    if (text.length !== 0)
    {
        let m = r.match(text);
        console.log(m.toString());
    }
}

// Basic

test('abc');

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
