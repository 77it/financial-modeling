import { relaxedJSONToStrictJSON } from '../../src/lib/json_relaxed.js';
import { localDateToUTC } from '../../src/lib/date_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

/**
 * Parse helper: ensures output is valid strict JSON and equals expected JS value.
 * @param {string} input
 * @param {any} expected
 */
function expectParsedEqual(input, expected) {
  let out;
  try {
    out = relaxedJSONToStrictJSON(input);
    const parsed = JSON.parse(out);
    assert.deepEqual(parsed, expected, `OUT: ${out}`);
  } catch (e) {
    if (e instanceof Error) {
      assert.fail(`Input: ${input} converted to ${out} but JSON.parse failed: ${e.message}`);
    }
    assert.fail(`Input: ${input} converted to ${out} but JSON.parse failed: ${String(e)}`);
  }
}

/**
 * Parse helper expecting failure (invalid strict JSON is okay in negative tests).
 * @param {string} input
 */
function expectJSONParseThrows(input) {
  const out = relaxedJSONToStrictJSON(input);
  assert.throws(() => JSON.parse(out), /SyntaxError|Unexpected/, `Expected JSON.parse to throw. OUT: ${out}`);
}

t('Top-level: concatenation of bare tokens', () => {
  expectParsedEqual('123 mamma', '123 mamma');
  expectParsedEqual('foo    bar', 'foo bar');          // multiple spaces collapsed to single space in value
  expectParsedEqual('foo\tbar', 'foo bar');            // tabs treated as whitespace
  expectParsedEqual('foo\r\nbar', 'foo bar');          // CR/LF treated as whitespace
});

t('Object: simple object', () => {
  expectParsedEqual('{"a X":1}', {
    "a X": 1
  });

  expectParsedEqual('{a X:1}', {
    "a X": 1
  });

  expectParsedEqual('{a: 12, b: x}', {
    a: 12,
    b: 'x',
  });

  expectParsedEqual('{a: 123, b: 456, c: 789}', {
    a: 123,
    b: 456,
    c: 789,
  });
});

t('Object: tight punctuation, concatenation, no surrounding spaces', () => {
  expectParsedEqual('{mamma:123 babbo,pino:999 pappa}', {
    mamma: '123 babbo',
    pino:  '999 pappa',
  });
  expectParsedEqual('{a:1 b,c:2 d}', { a: '1 b', c: '2 d' });
});

t('Object: whitespace/newlines around values do not break concatenation', () => {
  expectParsedEqual('{\n a:\t1 \n b \r\n , c:\t2 \n d }', { a: '1 b', c: '2 d' });
});

t('Array: concatenation of items', () => {
  expectParsedEqual('[aa bb,cc dd]', ['aa bb', 'cc dd']);
  expectParsedEqual('[\nfoo   bar , \r\n baz\tqux ]', ['foo bar', 'baz qux']);
});

t('Quoted key with punctuation + bare, concatenated value', () => {
  expectParsedEqual('{"a,b":1 c}', { 'a,b': '1 c' });
  expectParsedEqual('{"x:y":hello world}', { 'x:y': 'hello world' });
});

t('BOM is stripped before processing', () => {
  expectParsedEqual('\uFEFF{a:1 b}', { a: '1 b' });
  expectParsedEqual('\uFEFF123 mamma', '123 mamma');
});

t('Reserved JSON literals remain bare ONLY when alone', () => {
  expectParsedEqual('true', true);
  expectParsedEqual('false', false);
  expectParsedEqual('null', null);

  // When concatenated, they must be strings.
  expectParsedEqual('true mamma', 'true mamma');
  expectParsedEqual('false x', 'false x');
  expectParsedEqual('null y', 'null y');
});

t('Special numeric tokens are quoted as strings', () => {
  expectParsedEqual('Infinity', 'Infinity');
  expectParsedEqual('-Infinity', '-Infinity');
  expectParsedEqual('NaN', 'NaN');
  expectParsedEqual('{v:NaN x}', { v: 'NaN x' }); // concatenation stays a string
});

t('Numeric underscores are stripped before numeric detection + quoting', () => {
  // decimal
  expectParsedEqual('12_345', '12345');
  expectParsedEqual('1_234.5_0', '1234.50');
  expectParsedEqual('1_2_3_4', '1234');

  // exponent (underscores anywhere)
  expectParsedEqual('1_234.5_0e+0_2', '1234.50e+02');

  // hex/bin/oct with underscores
  expectParsedEqual('0xFF_FF', '0xFFFF');
  expectParsedEqual('0b1010_1010', '0b10101010');
  expectParsedEqual('0o12_345', '0o12345');

  // non-numeric with underscore must be preserved as-is (string)
  expectParsedEqual('abc_def', 'abc_def');
  expectParsedEqual('123_abc', '123_abc');
  expectParsedEqual('{k:abc_123}', { k: 'abc_123' });
  expectParsedEqual('{a: 123_456 789_012}', {a:"123_456 789_012"});
});

t('Floating/leading-dot numbers are quoted as strings', () => {
  expectParsedEqual('.5', '.5');
  expectParsedEqual('.5e+2', '.5e+2');
  expectParsedEqual('0.50', '0.50');
});

t('Quoted strings are copied verbatim; escapes remain intact', () => {
  // one backslash before n -> JSON escape -> newline after JSON.parse
  const out1 = relaxedJSONToStrictJSON('"a\\nb"');
  assert.equal(out1, '"a\\nb"');
  assert.equal(JSON.parse(out1), 'a\nb');

  // And keep an explicit test for the literal backslash-n case:
  const out2 = relaxedJSONToStrictJSON('"a\\\\nb"'); // two backslashes in source
  assert.equal(out2, '"a\\\\nb"');
  assert.equal(JSON.parse(out2), 'a\\nb'); // literal backslash + n
});

t('Bare tokens with backslashes are minimally escaped as JSON strings', () => {
  // Input token: a\b (two chars: backslash + 'b'); output JSON must be "a\\b"
  expectParsedEqual('a\\b', 'a\\b');

  // Backslash followed by space or other letters
  expectParsedEqual('path\\to', 'path\\to');
});

t('Nested containers + concatenation', () => {
  expectParsedEqual('{a:[b c,{d:e f},["x y",z w]]}', {
    a: ['b c', { d: 'e f' }, ['x y', 'z w']],
  });
});

t('Top-level: lots of whitespace is allowed', () => {
  expectParsedEqual('   \r\n\t  foo  \n  bar  ', 'foo bar');
});

t('Colon/comma can be tightly packed with tokens', () => {
  expectParsedEqual('{a:1 b,c:2 d,e:[x y,z w]}', {
    a: '1 b',
    c: '2 d',
    e: ['x y', 'z w'],
  });
});

t('Invalid hex, octal, or binary fall back to plain strings (no numeric detection)', () => {
  expectParsedEqual('0xG1', '0xG1');
  expectParsedEqual('0b102', '0b102');
  expectParsedEqual('0o789', '0o789');
});

t('Negative/edge: unterminated quoted string yields invalid JSON output', () => {
  expectJSONParseThrows('"abc');
});

t('Negative/edge: unmatched structure still passes through, but JSON.parse should fail', () => {
  expectJSONParseThrows('{a:1 b');   // missing closing brace
  expectJSONParseThrows('a:1 b}');   // missing opening brace
  expectJSONParseThrows('[x y');     // missing closing bracket
  expectJSONParseThrows('x y]');     // missing opening bracket
});

t('Smoke: multiple mixed cases', () => {
  expectParsedEqual(
    '{k1:hello world,k2:["x y",a b],k3:{m:0xFF_FF n,n:1_2_3}}',
    { k1: 'hello world', k2: ['x y', 'a b'], k3: { m: '0xFF_FF n', n: '123' } }
  );
});

t('Object: concatenated bare keys with various whitespace', () => {
  expectParsedEqual('{a\tb:1}', { 'a b': 1 });
  expectParsedEqual('{\r\na  \n b:2}', { 'a b': 2 });
  expectParsedEqual('{  foo\tbar  :  3 }', { 'foo bar': 3 });
});

t('Object: value concatenation stops before next key (multiple parts)', () => {
  expectParsedEqual('{k:1 b c, n: 2}', { k: '1 b c', n: '2' });
  expectParsedEqual('{x:hello world again, y:ok}', { x: 'hello world again', y: 'ok' });
});

t('Object: quoted string with colon stays intact as a value', () => {
  expectParsedEqual('{k:"a:b"}', { k: 'a:b' });
  expectParsedEqual('{k:"a: b c"}', { k: 'a: b c' });
});

t('Bare value with embedded quote is minimally escaped', () => {
  // Input has a double-quote in a bare token → must be escaped in strict JSON
  expectParsedEqual('hello"world', 'hello"world');
  // Also within an object value
  expectParsedEqual('{k:foo"bar baz}', { k: 'foo"bar baz' });
});

t('BOM handling also works for arrays', () => {
  expectParsedEqual('\uFEFF["a b",c d]', ['a b', 'c d']);
});

t('Signed numbers remain quoted strings, sign preserved', () => {
  expectParsedEqual('+12', '+12');
  expectParsedEqual('-12_345', '-12345'); // underscores stripped but sign preserved
  expectParsedEqual('{k:+0.50e-1}', { k: '+0.50e-1' });
});

t('Date parsing', () => {
  expectParsedEqual('2023-01-05T01:02:03.004', '2023-01-05T01:02:03.004');
  expectParsedEqual('2023-01-05T01:02:03.004Z', '2023-01-05T01:02:03.004Z');
  expectParsedEqual('2023-01-05', '2023-01-05');
  expectParsedEqual('2023/01/05', '2023/01/05');
  expectParsedEqual('2023.01.05', '2023.01.05');

  expectParsedEqual('2023-1-05', '2023-1-05');
  expectParsedEqual('2023-01-5','2023-01-5');
  expectParsedEqual('2023-01', '2023-01');
  expectParsedEqual('2023', '2023');
});

t('Object keys: CR/LF in-between parts are tolerated for concatenation', () => {
  expectParsedEqual('{\r\nfoo \n bar : 1}', { 'foo bar': 1 });
});

t('Array: tight punctuation mix with quoted and bare values', () => {
  expectParsedEqual('["x y",a b,"c",d e]', ['x y', 'a b', 'c', 'd e']);
  expectParsedEqual('[a b,"c d",e f]', ['a b', 'c d', 'e f']);
});

t('Top-level: specials concatenated become strings; solo remain as tokens', () => {
  expectParsedEqual('NaN foo', 'NaN foo');
  expectParsedEqual('-Infinity bar', '-Infinity bar');
  expectParsedEqual('Infinity', 'Infinity');
});

t('Object: true/false/null as lone values remain bare; otherwise strings', () => {
  expectParsedEqual('{a:true,b:false,c:null}', { a: true, b: false, c: null });
  expectParsedEqual('{a:true x,b:false y,c:null z}', { a: 'true x', b: 'false y', c: 'null z' });
});

t('Hex/bin/oct numeric recognition vs invalid variants', () => {
  // Valid → quoted numeric strings (with underscores stripped if any)
  expectParsedEqual('{h:0x1a,b:0b101,o:0o77}', { h: '0x1a', b: '0b101', o: '0o77' });
  expectParsedEqual('{h:0xAB_CD}', { h: '0xABCD' });

  // Invalid → plain strings
  expectParsedEqual('{h:0x, b:0b, o:0o}', { h: '0x', b: '0b', o: '0o' });
  expectParsedEqual('{h:0xZ1}', { h: '0xZ1' });
});

t('Object: keys containing punctuation must be quoted; values can be bare', () => {
  expectParsedEqual('{"x,y":a b,"p:q":c d}', { 'x,y': 'a b', 'p:q': 'c d' });
});

t('Top-level: readConcatenatedValueToken(false) behavior with long runs', () => {
  expectParsedEqual('a b c d e f', 'a b c d e f');
});

t('Object: do not swallow next key when many value parts + assorted whitespace', () => {
  expectParsedEqual('{m:0xFF_FF  \n n \t \r, n:1_2}', { m: '0xFF_FF n', n: '12' });
});

t('Bare backslash sequences in values are preserved (no extra escaping beyond JSON minimal)', () => {
  expectParsedEqual('{p:path\\to\\file}', { p: 'path\\to\\file' });
});

t('Object: multiple concatenated keys followed by value', () => {
  expectParsedEqual('{foo   bar   baz: 1}', { 'foo bar baz': 1 });
});

t('Whitespace around colon/comma does not matter, including CR/LF', () => {
  expectParsedEqual('{\n a :\n 1 b \n ,\n c:\r\n 2 d }', { a: '1 b', c: '2 d' });
});

//#region tests from YAML suite, updated for relaxed JSON

/** @type {any} */ const dpeq = assert.deepStrictEqual;
/** @type {any} */ const ndpeq = assert.notDeepStrictEqual;

/**
 * Custom parse function using relaxedJSONToStrictJSON + JSON.parse
 * @param {string} input
 * @return {*}
 */
function parseCustom(input) {
  const out = relaxedJSONToStrictJSON(input);
  return JSON.parse(out);
}

/**
 * Alias of parseCustom
 * @param {string} input
 * @return {*}
 */
function parseStandard(input) {
  return parseCustom(input);
}

t('YAML test, parsing specific to custom library, most interesting tests of not standard futures', () => {
  const parse2 = parseCustom;

  // with custom parsing string 'null' is converted to null, and is no more a string
  dpeq(parse2('null'), null);

  //#region parsing dates (only to LOCAL date or string)
  dpeq(parse2('2023-01-05T01:02:03.004'), new Date(2023, 0, 5, 1, 2, 3, 4));  // parsed as local date
  dpeq(parse2('2023-01-05T01:02:03.004Z'), new Date(2023, 0, 5, 1, 2, 3, 4));  // parsed as local date also if the string is in UTC (ends in Z)
  dpeq(parse2('2023-01-05'), new Date(2023, 0, 5));  // parsed as local date
  dpeq(parse2('2023/01/05'), new Date(2023, 0, 5));  // YYYY/MM/DD is valid and converted to local Date
  dpeq(parse2('2023.01.05'), new Date(2023, 0, 5));  // YYYY.MM.DD is valid and converted to local Date

  dpeq(parse2('2023-1-05'), '2023-1-05');  // YYYY-M-DD is not a date and left as string
  dpeq(parse2('2023-01-5'), '2023-01-5');  // YYYY-MM-D is not a date and left as string
  dpeq(parse2('2023-01'), '2023-01');  // YYYY-MM is not a date and left as string
  dpeq(parse2('2023'), 2023);  // YYYY is converted to number
  //#endregion

  // parsing an object without {} returns the input value
  dpeq(parse2('Main: 89, Ciao: 99'), 'Main: 89, Ciao: 99');

  // parsing an object with key/value without spaces and without "" is parsed correctly with custom parsing `parse2`:
  // (parsing an object with key containing whitespace without quotes will split key by : returning correctly key/value pair)
  // key and value split by the function `parseYAML`
  dpeq(parse2('{a b c:value, c c c:value2}'), { "a b c": "value", "c c c": "value2" });
  dpeq(parse2('{a b c:value}'), { "a b c": "value" });
  dpeq(parse2('{ab c:value}'), { "ab c": "value" });
  dpeq(parse2('{abc:value}'), { abc: 'value' });
  dpeq(parse2('{abc:999}'), { abc: 999 });
  // the split is NOT done for 'abc:999' because the key 'abc' already exists in the object
  dpeq(parse2('{abc:888, abc:999}'), { abc: 888,  "abc:999": null });

  // parsing an array without [] returns the input value
  dpeq(parse2('a, b, c'), 'a, b, c');
  dpeq(parse2('1, 2, 3'), '1, 2, 3');

  const parsed_keys_not_separated_from_values = parse2('{"Main":999.159, \'Main2\':"abcd", Name:"Y88:x", mamma:\'ciao\', mamma3 :99, mamma2:ciao2, mamma-ciao, :ciaociao, "UnitA!Driver[20240101]":ciao ciao}');
  dpeq(
    parsed_keys_not_separated_from_values,
    {
      Main: 999.159,
      Main2: 'abcd',
      Name: 'Y88:x',
      mamma: 'ciao',
      mamma3 :99,
      mamma2: 'ciao2',
      'mamma-ciao': null,
      ':ciaociao': null,
      'UnitA!Driver[20240101]':'ciao ciao'
    });

  //#region custom parsing object (works with ' and ")
  const parsed = parse2('{\'Main\':999.159, Name: \'Y88 x\', num: -1, \'mamma\':\'ciao\', mamma2 : 99, mamma3 :88}');
  dpeq(
    parsed,
    {
      Main: 999.159,
      Name: 'Y88 x',
      num: -1,
      mamma :'ciao',
      mamma2: 99,
      mamma3: 88,
    });

  assert(!(parsed["mamma3 "] === 88));  // without sanitization, the key would be with space!
});

t('YAML test, parsing specific to custom library, other tests', () => {
  const parse2 = parseCustom;

  // parsing string starting with @ never returns undefined
  dpeq(parse2(' @UnitA!Driver '), ' @UnitA!Driver ');
  dpeq(parse2('@UnitA!Driver[20240101]'), '@UnitA!Driver[20240101]');
  dpeq(parse2('Unit@A!Driver@[@]@'), 'Unit@A!Driver@[@]@');

  // parsing an object with [] as key, returns undefined
  dpeq(parse2('{ Driver[20240101] }'), '{ Driver[20240101] }');
  dpeq(parse2('{Driver[20240101]}'), '{Driver[20240101]}');
  dpeq(parse2('{ UnitA!Driver[20240101] }'), '{ UnitA!Driver[20240101] }');
  dpeq(parse2('{UnitA!Driver[20240101]}'), '{UnitA!Driver[20240101]}');
  // parsing object starting with @ returns undefined only if it's the first char
  dpeq(parse2('{ @UnitA!Driver }'), '{ @UnitA!Driver }');
  dpeq(parse2('{@UnitA!Driver[20240101]}'), '{@UnitA!Driver[20240101]}');
  dpeq(parse2('{Unit@A!Driver@}'), { 'Unit@A!Driver@': null });
});

t('YAML tests, parse specific to standard library', () => {
  const parse1 = parseStandard;

  // string 'null' is converted to null
  dpeq(parse1('null'), null);

  // parsing an object without {} goes in error then is returned undefined
  dpeq(parse1('Main: 89, Ciao: 99'), undefined);

  // parsing an object with key containing whitespace without quotes returns null as value and everything as key
  dpeq(parse1('{ab c:value}'), { "ab c:value": null });
  dpeq(parse1('{a b c:value}'), { "a b c:value": null });
  dpeq(parse1('{a b c:value, c c c:value2}'), { "a b c:value": null, "c c c:value2": null });

  //#region parsing dates (only to UTC date or string)
  dpeq(parse1('2023-01-05T00:00:00.000Z'), localDateToUTC(new Date(2023, 0, 5)));  // converted to UTC Date
  dpeq(parse1('2023-01-05'), localDateToUTC(new Date(2023, 0, 5)));  // converted to UTC Date
  dpeq(parse1('2023-1-05'), '2023-1-05');  // YYYY-M-DD is not a date and left as string
  dpeq(parse1('2023-01-5'), '2023-01-5');  // YYYY-MM-D is not a date and left as string
  dpeq(parse1('2023-01'), '2023-01');  // YYYY-MM is not a date and left as string
  dpeq(parse1('2023'), 2023);  // YYYY is converted to number

  dpeq(parse1('2023/01/05'), '2023/01/05');  // YYYY-M-DD is not a YAML date and left as string
  dpeq(parse1('2023.01.05'), '2023.01.05');  // YYYY-M-DD is not a YAML date and left as string
  //#endregion

  // parsing string starting with @ returns undefined only if it's the first char
  dpeq(parse1(' @UnitA!Driver '), undefined);
  dpeq(parse1('@UnitA!Driver[20240101]'), undefined);
  dpeq(parse1('Unit@A!Driver@[@]@'), 'Unit@A!Driver@[@]@');

  // parsing an object with [] as key, returns undefined
  dpeq(parse1('{ Driver[20240101] }'), undefined);
  dpeq(parse1('{Driver[20240101]}'), undefined);
  dpeq(parse1('{ UnitA!Driver[20240101] }'), undefined);
  dpeq(parse1('{UnitA!Driver[20240101]}'), undefined);
  // parsing object starting with @ returns undefined only if it's the first char
  dpeq(parse1('{ @UnitA!Driver }'), undefined);
  dpeq(parse1('{@UnitA!Driver[20240101]}'), undefined);
  dpeq(parse1('{Unit@A!Driver@}'), { 'Unit@A!Driver@': null });

  dpeq(parse1('{abc:value}'), { "abc:value": null });
  dpeq(parse1('{abc:999}'), { "abc:999": null });
  dpeq(parse1('{abc: 888, abc:999}'), { abc: 888,  "abc:999": null });
  dpeq(parse1('{abc:888, abc:999}'), { "abc:888": null, "abc:999": null });
});

t('YAML tests, parse with custom and standard library', () => {
  const parseArray = [parseStandard, parseCustom];

  for (const parse0 of parseArray) {
    //#region parsing null and undefined
    // string 'undefined' is not converted to undefined but remains a string
    dpeq(parse0('undefined'), 'undefined');
    //#endregion

    // parsing a string with a number, returns the number
    // with standard and custom parsing, parsing a number with decimal separated by comma, returns a string.
    // is not a problem if later the string is converted to a number or array or else in some way
    dpeq(parse0('999,159'), '999,159');
    dpeq(parse0('999, 159'), '999, 159');

    // parsing a driver as a string (without {}) returns a string
    dpeq(parse0('Driver'), 'Driver');
    dpeq(parse0(' Driver '), 'Driver');
    dpeq(parse0(' UnitA!Driver '), 'UnitA!Driver');
    dpeq(parse0(' Driver[20240101] '), 'Driver[20240101]');
    dpeq(parse0(' UnitA!Driver[20240101] '), 'UnitA!Driver[20240101]');

    // parsing an object without key/value splitting as `{abc}` returns an object with a key with undefined value
    dpeq(parse0('{Driver}'), { Driver: null });
    dpeq(parse0('{ Driver }'), { Driver: null });
    dpeq(parse0('{ UnitA!Driver }'), { 'UnitA!Driver': null });

    // normal object parsing
    dpeq(parse0('{"abc":value}'), { abc: "value" });

    // parsing an object with key containing whitespace with quotes is parded correctly
    dpeq(parse0('{"ab c":value}'), { "ab c": "value" });

    //#region parsing strings with and without quotes, returns the string
    dpeq(parse0('"ciao"'), 'ciao');
    dpeq(parse0("'ciao'"), 'ciao');
    dpeq(parse0('ciao'), 'ciao');
    //#endregion

    //#region parsing range of dates
    dpeq(parse0('2023-01-05T00:00:00.000Z:2024-01-05T00:00:00.000Z'), '2023-01-05T00:00:00.000Z:2024-01-05T00:00:00.000Z');  // left as string
    dpeq(parse0('2023-01-05:2024-01-05'), '2023-01-05:2024-01-05');  // left as string
    dpeq(parse0('2023-01:2024-01'), '2023-01:2024-01');  // left as string
    dpeq(parse0('2023:2024'), '2023:2024');  // left as string
    //#endregion

    //#region custom parsing object (works with ' and ")
    const parsedB = parse0('{"Main":999.159, Name: "Y88 x", num: -1, "mamma":"ciao"}');
    dpeq(parsedB.Main, 999.159);
    dpeq(parsedB.Name, 'Y88 x');
    dpeq(parsedB.mamma, 'ciao');
    //#endregion

    //#region parsing array of something, strings also without quotes
    // parsing one or more numbers with decimal separated by comma in an array breaks them, splitting at every comma
    // (array with comma separated numbers in an array are not recognized as numbers nor string, but split at every ,)
    ndpeq(parse0('[1,1]'), ['1,1']);  // should be equal, but it's not
    dpeq(parse0('[1,1]'), [1, 1]);  // wrong, number is split at comma
    ndpeq(parse0('[1, 2, 1,1 , 2,2, 5,6,7]'), [1, 2, '1,1', '2,2', '5,6', 7]);  // should be equal, but it's not
    dpeq(parse0('[1, 2, 1,1 , 2,2, 5,6,7]'), [1, 2, 1, 1, 2, 2, 5, 6, 7]);  // wrong, number are split at comma

    // when numbers are quoted, they are correctly not split
    dpeq(parse0("[1, 2, '1,1' , '2,2']"), [1, 2, '1,1', '2,2']);

    const parsed2 = parse0('[[\'2023-01-05\' , 155343.53] , [\'2023-02-05\',100000],{start: \'2024-06-01\', NP: 2, npy: 2}]');
    dpeq(parsed2[0], ['2023-01-05', 155343.53]);
    dpeq(parsed2[2].NP, 2);

    const parsed3 = parse0('[a,b,c]');
    dpeq(parsed3, ['a', 'b', 'c']);

    const parsed3b = parse0('[amm  CIO giò kjkk  , b9988,b9989, 999 ,dlkjdlkjdlsdkjjdkl, d l k j d l k j d l sdkjjdkl ,lkjlkjlkljlkj]');
    dpeq(parsed3b, ['amm  CIO giò kjkk', 'b9988', 'b9989', 999, 'dlkjdlkjdlsdkjjdkl', 'd l k j d l k j d l sdkjjdkl', 'lkjlkjlkljlkj']);

    const parsed4 = parse0('[\'ciao\', "mamma"]');
    dpeq(parsed4, ['ciao', 'mamma']);
    //#endregion

    //#region parsing array of objects
    const parsed5 = parse0('[{ type: c/c, value: ISP, weight: 0.2}, {type: linea di business, value: cantina, weight: 0.3 }]');
    dpeq(parsed5[0].type, 'c/c');
    dpeq(parsed5[1].value, 'cantina');
    dpeq(parsed5[1].weight, 0.3);
    //#endregion

    //#region parsing object with array as properties
    const parsed6 = parse0('{ name: [AA, AAA], value: [BB, BBB], weight: [0.5, 0.6] }');
    dpeq(
      parsed6,
      {
        name: ['AA', 'AAA'],
        value: ['BB', 'BBB'],
        weight: [0.5, 0.6]
      }
    );
    //#endregion
  }
});

//#endregion tests from YAML suite, updated for relaxed JSON