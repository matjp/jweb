---
jweb:ts
---

## jtangle.md

This program by Matthew J. Penwill is based on a program by Silvio Levy and Donald E. Knuth.  
It is distributed WITHOUT ANY WARRANTY, express or implied.  
Version 0.1.5 --- December 2021

Copyright (C) 2021 Matthew J. Penwill

Permission is granted to make and distribute verbatim copies of this document provided that the copyright notice and this permission notice are preserved on all copies.

Permission is granted to copy and distribute modified versions of this document under the conditions for verbatim copying, provided that the entire resulting derived work is given a different name and distributed under the terms of a permission notice identical to this one.

## Table of contents

1. [Introduction](#introduction)
2. [The character set](#the-character-set)
3. [Program outline](#program-outline)
4. [Storage of names and strings](#storage-of-names-and-strings)
5. [Data structures](#data-structures)
6. [Tokens](#tokens)
7. [Stacks for output](#stacks-for-output)
8. [Producing the output](#producing-the-output)
9. [The big output switch](#the-big-output-switch)
10. [Introduction to the input phase](#introduction-to-the-input-phase)
11. [Inputting the next token](#inputting-the-next-token)
12. [Scanning a macro definition](#scanning-a-macro-definition)
13. [Scanning a section](#scanning-a-section)
14. [Input routines](#input-routines)
15. [Reporting errors to the user](#reporting-errors-to-the-user)
16. [Command line arguments](#command-line-arguments)
17. [Output](#output)

## Introduction

jtangle.md is a JWEB implementation of the `ctangle` program, a part of the CWEB system of structured documentation.

We begin by specifying declarations of global scope.

```ts
@c
@<Includes@>
@<Global_constants@>
@<Typedef_declarations@>
@<Global_variables@>
```

In order to read and write files we include the file system api from Node.js

```ts
@<Includes...@>=
import fs from 'fs';
import path from 'path';
```

The "banner line" defined here should be changed whenever `jtangle` is modified.

```ts
@<Global_const...@>=
const BANNER = "This is JTANGLE (Version 0.1.5)\n";
```

## The character set

A few character pairs are encoded internally as single characters, using the definitions below. These definitions are consistent with an extension of ASCII code originally developed at MIT and explained in Appendix C of The TeX book; thus, users who have such a character set can type things like `char'32` and `char'4` instead of `!=` and `&&`. (However, their files will not be too portable until more people adopt the extended code.)

If the character set is not ASCII, the definitions given here may conflict with existing characters; in such cases, other arbitrary codes should be substituted. The index to JTANGLE mentions every case where similar codes may have to be changed in order to avoid character conflicts. Look for the entry "ASCII code dependencies"
in the index.

```ts
@<Global_const...@>=
const AND_AND = 0o4; /* &&; corresponds to MIT's char 0o4 */
const LT_LT = 0o20; /* <<;  corresponds to MIT's char 0o20 */
const GT_GT = 0o21; /* >>;  corresponds to MIT's char 0o21 */
const PLUS_PLUS = 0o13; /* ++;  corresponds to MIT's char 0o13 */
const MINUS_MINUS = 0o1; /* --;  corresponds to MIT's 0o1 */
const EQ_GT = 0o30;
const MINUS_GT = 0o31; /* ->;  corresponds to MIT's 0o31 */
const NOT_EQ = 0o32; /* !=;  corresponds to MIT's 0o32 */
const LT_EQ = 0o34; /* <=;  corresponds to MIT's 0o34 */
const GT_EQ = 0o35; /* >=;  corresponds to MIT's 0o35 */
const EQ_EQ = 0o36; /* ==;  corresponds to MIT's 0o36 */
const OR_OR = 0o37; /* ||;  corresponds to MIT's 0o37 */
const DOT_DOT_DOT = 0o16; /* ...;  corresponds to MIT's 0o16 */
const COLON_COLON = 0o6; /* ::;  corresponds to MIT's 0o6 */
const PERIOD_AST = 0o26; /* .*;  corresponds to MIT's 0o26 */
const MINUS_GT_AST = 0o27; /* ->*;  corresponds to MIT's 0o27 */
```

We define names for some frequently referenced character codes.

```ts
@<Global_const...@>=
const BEL = 0o7;
const BACKSPACE = '\b'.charCodeAt(0);
const TAB = '\t'.charCodeAt(0);
const NEWLINE = '\n'.charCodeAt(0);
const VTAB = '\v'.charCodeAt(0);
const FORMFEED = '\f'.charCodeAt(0);
const RETURN = '\r'.charCodeAt(0);
const SPACE = ' '.charCodeAt(0);
const EXCLAMATION = '!'.charCodeAt(0);
const DOUBLEQUOTE = '"'.charCodeAt(0);
const HASHTAG = '#'.charCodeAt(0);
const DOLLAR = '$'.charCodeAt(0);
const AMPERSAND = '&'.charCodeAt(0);
const SINGLEQUOTE = '\''.charCodeAt(0);
const LEFTPAREN = '('.charCodeAt(0);
const RIGHTPAREN = ')'.charCodeAt(0);
const STAR = '*'.charCodeAt(0);
const PLUS = '+'.charCodeAt(0);
const MINUS = '-'.charCodeAt(0);
const DOT = '.'.charCodeAt(0);
const SLASH = '/'.charCodeAt(0);
const COLON = ':'.charCodeAt(0);
const LESSTHAN = '<'.charCodeAt(0);
const EQUALS = '='.charCodeAt(0);
const GREATERTHAN = '>'.charCodeAt(0);
const QMARK = '?'.charCodeAt(0);
const AT = '@@'.charCodeAt(0);
const BACKSLASH = '\\'.charCodeAt(0);
const CARET = '^'.charCodeAt(0);
const UNDERSCORE = '_'.charCodeAt(0);
const VBAR = '|'.charCodeAt(0);
```

## Program outline

`jtangle` has a fairly straightforward outline. It operates in two phases: First it reads the source file, saving the code in compressed form; then it shuffles and outputs the code.

```ts
@c
  export = function jtangle(argv: string[], logFunc?: (msg: string) => void) {
    @<Get_log_function@>    
    @<Set_initial_values@>  
    @<Initialize_pointers@>
    @<Set_the_default_options@>
    @<Scan_arguments_and_open_output_files@>    
    phaseOne(); /* read all the user's text and compress it into tokMem */
    phaseTwo(); /* output the contents of the compressed tables */
    return wrapUp(); /* and exit gracefully */
  }
```

Determine the logging function to use. If none is passed to `jtangle` then messages will be written to the console.

```ts
@<Global_var...@>=
let log: (msg: string) => void;
```

```ts
@<Get_log_function@>=
log = logFunc ? logFunc : console.log;
```

The following parameters were sufficient in `ctangle`, they should also be sufficient for most applications of `jtangle`.

```ts
@<Global_const...@>=
const MAX_TEXTS = 2500; /* number of replacement tokMem, must be less than 10240 */
const STACK_SIZE = 50; /* number of simultaneous levels of macro expansion */
```

## Storage of names and strings

JTANGLE stores identifiers, section names and other strings in a large array of strings, called `stringMem`. Information about the names is kept in the array `nameDir`, whose elements are structures of type `NameInfo`, containing a pointer into the `stringMem` array (the index of the string) and other data.

```ts
@<Global_var...@>=
let stringMem: string[]; /* array of strings */
let nameDir: NameInfo[]; /* information about names */
let hash: nameIndex[]; /* heads of hash lists */
```

```ts
@<Typedef...@>=
type nameIndex = number; /* pointer into nameDir */
type NameInfo = {
  stringIndex: number;
  @<More_elements_of_name_info_structure@>
} /* contains information about an identifier or section name */

```

```ts
@<Initialize_pointers@>=
stringMem.push(''); /* stringMem[0] is the empty string */
nameDir.push(
  /* nameDir[0] - will be used only for error recovery */
  { stringIndex: 0, /* name of length zero (stringMem[0]) */
    lLink: 0,
    rLink: 0,
    shortestPrefixLength: 0,
    equiv: 0 }
);
```

The names of identifiers are found by computing a hash address `h` and then looking at strings of bytes signified by the `nameIndex`s `hash[h]`, `hash[h].lLink`, `hash[h].lLink.lLink`, ..., until either finding the desired name or encountering the null pointer.

```ts
@<More_elements_of_name_info_structure@>=
lLink: nameIndex; /* link in a linked list of identifiers OR left link in binary search tree for section names */
rLink: nameIndex; /* right link in binary search tree for section names */
```

The hash table itself consists of `HASH_SIZE` entries of type `nameIndex`, and is updated by the `idLookup` procedure, which finds a given identifier and returns the appropriate `nameIndex`. The matching is done by the function `namesMatch`. If there is no match for the identifier, it is inserted into the table.

```ts
@<Global_const...@>=
const HASH_SIZE = 613; /* should be prime */
const HASH_END: nameIndex = HASH_SIZE - 1; /* end of hash */
```

Initially all the hash lists are empty.

```ts
@<Initialize_pointers@>=
for (let h = 0; h <= HASH_END; h++) {
  hash[h] = 0
}
```

Here is the main procedure for finding identifiers:

```ts
@c
function idLookup(str: string): nameIndex /* looks up a string in the identifier table */ {
  let i = 0; /* position in buf */
  let h: number; /* hash code */
  const l = str.length; /* length of the given identifier */
  let p: nameIndex; /* where the identifier is being sought */
  @<Compute_the_hash_code_h@>
  @<Compute_the_name_location_p@>
  return (p);
}
```

A simple hash code is used: If the sequence of character codes is $c_1c_2\ldots c_n$ its hash value will be $$(2^{n-1}c_1+2^{n-2}c_2+\cdots+c_n)\,\bmod\,hash\_size$$

```ts
@<Compute_the_hash...@>=
h = str.charCodeAt(i);
while (++i < l) {  
  h = h + h + str.charCodeAt(i);
}
h = h % HASH_SIZE;
```

If the identifier is new, it will be added to the stringMem array, otherwise `p` will point to its existing location.

```ts
@<Compute_the_name_location...@>=
p = hash[h];
while (p !== 0 && !namesMatch(p, str)) {
  p = nameDir[p].lLink;
}
if (p === 0) {
  @<Enter_a_new_name_into_the_table@>
  nameDir[p].lLink = hash[h];
  hash[h] = p; /* insert p at beginning of hash list */
}
```

```ts
@<Enter_a_new_name...@>=
  const s = stringMem.push(str) - 1;
  p = nameDir.push({
    stringIndex: s,
    lLink: 0,
    rLink: 0,
    shortestPrefixLength: 0,
    equiv: 0
  }) - 1;
```

The names of sections are stored in `stringMem` together with the identifier names, but a hash table is not used for them because JTANGLE needs to be able to recognize a section name when given a prefix of that name. A conventional binary search tree is used to retrieve section names, with fields called `lLink` and `rLink`. The root of this tree is stored in `nameDir[p].rLink`; this will be the only information in `nameDir[0]`.

```ts
@<Initialize_pointers@>=
nameDir[0].rLink = 0
```

If `p` is a `nameIndex` variable, as we have seen, `NameDir[p].stringIndex` is the index where the name corresponding to `p` is stored. However, if `p` refers to a section name, the name may need to be stored in chunks, because it may "grow": a prefix of the section name may be encountered before the full name. Furthermore we need to know the length of the shortest prefix of the name that was ever encountered.

We solve this problem by adding a `shortestPrefixLength` property to the `NameInfo` structure when `p` is a section name. Furthermore, the last byte of the name will be a blank space if `p` is a prefix. In the latter case, the name pointer `p+1` will allow us to access additional chunks of the name: The second chunk will begin at the name pointer `nameDir[p+1].lLink`, and if it too is a prefix (ending with blank) its `lLink` will point to additional chunks in the same way. Null links are represented by `0`.

```ts
@<More_elements_of_name_info_structure@>=
shortestPrefixLength: number; /* length of the shortest prefix for section names */
```

```ts
@c
function setPrefixLength(p: nameIndex, l: number) {
  nameDir[p].shortestPrefixLength = l;
}
```

```ts
@c
function getSectionName(p: nameIndex): string {
  let s = stringMem[nameDir[p].stringIndex];
  const l = s.length;
  let q: nameIndex = p + 1;
  let n = '';
  while (p !== 0) {
    if (l > 1 && s.charCodeAt(l-1) === SPACE) {
      n += s.substring(0, l-1);
      p = nameDir[q].lLink;
      q = p;
    } else {
      n += s;
      p = 0;
      q = 0;
    }
    s = stringMem[nameDir[p].stringIndex];
  }
  if (q) n += '...'; /* complete name not yet known */
  return n;
}
```

```ts
@c
function getPrefixName(p: nameIndex): string {
  const s = stringMem[nameDir[p].stringIndex];
  let sp = s.substring(0, nameDir[p].shortestPrefixLength);
  if (sp.length < s.length) sp += '...';
  return sp;
}
```

When we compare two section names, we need a function analogous to the string comparison operators `==`, `<` and `>`, but we keep an eye open for prefixes and extensions.

```ts
@<Global_const...@>=
const LESS = 0; /* the first name is lexicographically less than the second */
const EQUAL = 1; /* the first name is equal to the second */
const GREATER = 2; /* the first name is lexicographically greater than the second */
const PREFIX = 3; /* the first name is a proper prefix of the second */
const EXTENSION = 4; /* the first name is a proper extension of the second */
```

```ts
@c
function webStrCmp(j: string, k: string): number
/* fuller comparison than using `==` operator. */ {
  let ji = 0;
  let ki = 0;
  while (ki < k.length && ji < j.length && j[ji] === k[ki]) {
    ki++; ji++;
  }
  if (ki === k.length) {
    if (ji === j.length) {
      return EQUAL
    } else {
      return EXTENSION
    }
  } else if (ji === j.length) {
    return PREFIX
  } else if (j[ji] < k[ki]) {
    return LESS
  } else {
    return GREATER
  }
}
```

Adding a section name to the tree is straightforward if we know its parent and whether it's the `lLink` of the parent. As a special case, when the name is the first section being added, we set the "parent" to `null`. When a section name is created, it has only one chunk, which however may be just a prefix; the full name will hopefully be unveiled later. Obviously, `shortestPrefixLength` starts out as the length of the first chunk, though it may decrease later.

```ts
@c
function addSectionName( /* install a new node in the tree */
  parent: nameIndex, /* parent of new node */
  c: number, /* right or left? */
  secName: string, /* the section name to add */
  isPrefix: boolean /* are we adding a prefix or a full name? */): nameIndex
{
  const p: nameIndex = nameDir.push({
    stringIndex: 0,
    lLink: 0,
    rLink: 0,
    shortestPrefixLength: 0,
    equiv: 0
  }) - 1;

  let s: string = secName;
  const nameLen = s.length;
  if (isPrefix) {
    s += String.fromCharCode(SPACE)
  };
  nameDir[p].stringIndex = stringMem.push(s) - 1;
  setPrefixLength(p, nameLen);

  return (
    parent === 0 ? (nameDir[0].rLink = p) :
      (c === LESS ? (nameDir[parent].lLink = p) :
        (nameDir[parent].rLink = p))
  );
}
```

```ts
@c
function extendSectionName(
  p: nameIndex, /* name to be extended */
  extensionText: string,
  isPrefix: boolean /* are we adding a prefix or a full name? */)
{
  let s: string = extensionText;
  if (isPrefix) {
    s += String.fromCharCode(SPACE)
  }

  let q: nameIndex = p + 1;
  while (nameDir[q].lLink !== 0) { /* go to the last section part */
    q = nameDir[q].lLink
  }

  nameDir[q].lLink = nameDir.push({ /* add a section part with new text */
    stringIndex: stringMem.push(s) - 1,
    lLink: 0,
    rLink: 0,
    shortestPrefixLength: 0,
    equiv: 0
  }) - 1;
}
```

The `sectionLookup` procedure is supposed to find a section name that matches a new name, installing the new name if it doesn't match an existing one. A "match" means that the new name exactly equals or is a prefix or extension of a name in the tree.

```ts
@c
function sectionLookup( /* find or install section name in tree */
  newName: string, /* first and last characters of new name */
  isPrefix: boolean /* is the new name a prefix or a full name? */): nameIndex
{
  let c = 0; /* comparison between two names */
  let p: nameIndex = nameDir[0].rLink; /* current node of the search tree = root */
  let q: nameIndex = 0; /* another place to look in the tree */
  let r: nameIndex = 0; /* where a match has been found */
  let parent: nameIndex = 0; /* parent of p, if r is 0; otherwise parent of r */
  @<Look_for_matches_for_new_name_among_shortest_prefixes,_complaining_if_more_than_one_is_found@>
  @<If_no_match_found,_add_new_name_to_tree@>
  @<If_one_match_found,_check_for_compatibility_and_return_match@>
}
```

A legal new name matches an existing section name if and only if it matches the shortest prefix of that section name. Therefore we can limit our search for matches to shortest prefixes, which eliminates the need for chunk-chasing at this stage.

```ts
@<Look_for_matches_for_new_name_among...@>=
while (p !== 0) { /* compare shortest prefix of p with new name */
  c = webStrCmp(newName, stringMem[nameDir[p].stringIndex].substring(0, nameDir[p].shortestPrefixLength));
  if (c === LESS || c === GREATER) { /* new name does not match p */
    if (r === 0) { /* no previous matches have been found */
      parent = p;
    }
    p = c === LESS ? nameDir[p].lLink : nameDir[p].rLink;
  } else { /* new name matches p */
    if (r !== 0) {  /* and also r: illegal */
      log('! Ambiguous prefix: matches <' + getPrefixName(p) + '>\n and <' + getPrefixName(r) +'>');
      return 0; /* the unsection */
    }
    r = p; /* remember match */
    p = nameDir[p].lLink; /* try another */
    q = nameDir[r].rLink; /* we'll get back here if the new p doesn't match */
  }
  if (p === 0) {
    p = q; /* q held the other branch of r */
    q = 0;
  }
}
```

```ts
@<If_no_match...@>=
  if (r === 0) { /* no matches were found */
  return addSectionName(parent, c, newName, isPrefix);
}
```

Although error messages are given in anomalous cases, we do return the unique best match when a discrepancy is found, because users often change a title in one place while forgetting to change it elsewhere.

```ts
@<If_one_match...@>=
switch (sectionNameCmp(newName, r)) { /* compare all of r with new name */
  case PREFIX:
    if (!isPrefix) {
      log('\n! New name is a prefix of <' + getSectionName(r) + '>');
    }
    else if (newName.length < nameDir[r].shortestPrefixLength) {
      setPrefixLength(r, newName.length)
    }
  /* fall through */
  case EQUAL:
    return r;
  case EXTENSION:
    if (!isPrefix) {
      extendSectionName(r, newName, isPrefix);
    }
    return r;
  case BAD_EXTENSION:
    log('! New name extends <' + getSectionName(r) + '>');
    return r;
  default: /* no match: illegal */
    log('! Section name incompatible with <' + getPrefixName(r) + '>,\n which abbreviates <' + getSectionName(r) + '>');
    return r;
}
```

The return codes of `sectionNameCmp`, which compares a string with the full name of a section, are those of `webStrCmp` plus `BAD_EXTENSION`, used when the string is an extension of a supposedly already complete section name. This function has a side
effect when the comparison string is an extension: It advances the address of the first character of the string by an amount equal to the length of the known part of the section name.

The name @<foo...@> should be an acceptable "abbreviation" for @<foo@>. If such an abbreviation comes after the complete name, there's no trouble recognizing it. If it comes before the complete name, we simply append a null chunk. This logic requires us to regard @<foo...@> as an "extension" of itself.

```ts
@<Global_const...@>=
const BAD_EXTENSION = 5;
```

```ts
@c
function sectionNameCmp(
  name: string,
  r: nameIndex /* section name being compared */): number
{
  let q: nameIndex = r; /* access to subsequent chunks */
  let s: string;
  let c: number; /* comparison */
  let isPrefix: boolean; /* is chunk r a prefix? */

  while (true) {
    s = stringMem[nameDir[q].stringIndex];
    q = r + 1;
    
    if (s[s.length-1].charCodeAt(0) === SPACE) {
      isPrefix = true;
      q = nameDir[q].lLink;
    } else {
      isPrefix = false;
      q = 0;
    }

    switch (c = webStrCmp(name, s)) {
      case EQUAL:
        if (q === 0) {
          if (isPrefix) {
            return EXTENSION; /* null extension */
          } else {
            return EQUAL
          }
        } else {
          return (nameDir[q].stringIndex === nameDir[q+1].stringIndex) ? EQUAL : PREFIX
        }
      case EXTENSION:
        if (!isPrefix) return BAD_EXTENSION;
        if (q !== 0) continue;
        return EXTENSION;
      default:
        return c;
    }
  }
}
```

If `p` is a pointer to a section name, `nameDir[p].equiv` is a pointer to its replacement text, an element of the array `texts`.

```ts
@<More_elements_of_name_info_structure@>=
equiv: textIndex; /* info corresponding to names */
```

## Data structures

We've already seen that the `stringMem` array holds the names of identifiers, strings, and sections; the `tokMem` array holds the replacement texts for sections. Allocation is sequential, since things are deleted only during Phase II, and only in a last-in-first-out manner.

A `Txt` variable is a structure containing a pointer into `tokMem`, which tells where the corresponding text starts, and an integer `textLink`, which, as we shall see later, is used to connect pieces of text that have the same name. All the `Txt`s are stored in the array `texts`, and we use a `textIndex` variable to refer to them.

```ts
@<Typedef...@>=
type textIndex = number;
type Txt = {
  tokStart: number; /* pointer into `tokMem` */
  textLink: number; /* relates replacement texts */
}
```

```ts
@<Global_var...@>=
let tokMem: number[];
let texts: Txt[];
```

Here's the procedure that decides whether a name equals the identifier pointed to by `p`:

```ts
@c
function namesMatch(p: nameIndex, name: string): boolean {
  return (stringMem[nameDir[p].stringIndex] === name);
}
```

## Tokens

Replacement texts, which represent source code in a compressed format, appear in `tokMem` as mentioned above. The codes in these texts are called 'tokens'; some tokens occupy two consecutive eight-bit byte positions, and the others take just one byte.

If `p` points to a replacement text, `p.tokStart` is the `tokMem` position of the first eight-bit code of that text. If `p.textLink === 0`, this is the replacement text for a macro, otherwise it is the replacement text for a section. In the latter case `p.textLink` is either equal to `SECTION_FLAG`, which means that there is no further text for this section, or `p.textLink` points to a continuation of this replacement text; such links are created when several sections have texts with the same name, and they also tie together all the texts of unnamed sections. The replacement text pointer for the first unnamed section appears in `texts[0].textLink`, and the most recent such pointer is `lastUnnamed`.

```ts
@<Global_const...@>=
const SECTION_FLAG = MAX_TEXTS; /* final `textLink` in section replacement tokMem */
```

```ts
@<Global_var...@>=
let lastUnnamed: textIndex; /* most recent replacement text of unnamed section */
```

If the first byte of a token is less than $0o200$, the token occupies a single byte. Otherwise we make a sixteen-bit token by combining two consecutive bytes `a` and `b`. If $0o200 <= a < 0o250$, then $(a-0o200)\times2^8+b$ points to an identifier; if $0o250 <= a < 0o320$, then $(a-0o250)\times2^8+b$ points to a section name (or, if it has the special value `OUTPUT_DEFS_FLAG`, to the area where the preprocessor definitions are stored); and if $0o320 <= a < 0o400$, then $(a-0o320)\times2^8+b$ is the number of the section in which the current replacement text appears.

Codes less than $0o200$ are 7-bit `char` codes that represent themselves. Some of the 7-bit codes will not be present, however, so we can use them for special purposes. The following symbolic names are used:

`JOIN` denotes the concatenation of adjacent items with no space or line breaks allowed between them (the '@@' operation JWEB).

`STR` denotes the beginning or end of a string, verbatim construction or numerical constant.

```ts
@<Global_const...@>=
const STR = 0o2; /* takes the place of extended ASCII char 0o2 */
const JOIN = 0o177; /* takes the place of ASCII delete */
const OUTPUT_DEFS_FLAG = (2 * 0o24000 - 1);
```

The following procedure is used to enter a two-byte value into `tokMem` when a replacement text is being generated.

```ts
@c
function storeTwoBytes(x: number) {
  tokMem.push(x >> 8); /* high byte */
  tokMem.push(x & 0o377); /* low byte */
}
```

## Stacks for output

The output process uses a stack to keep track of what is going on at different "levels" as the sections are being written out. Entries on this stack have five parts:

`end` is the `tokMem` location where the replacement text of a particular level will end;

`byte` is the `tokMem` location from which the next token on a particular level will be read;

`name` points to the name corresponding to a particular level;

`repl` points to the replacement text currently being read at a particular level;

`section` is the section number, or zero if this is a macro.

The global variable `stackIndex` tells how many levels of output are currently in progress. The end of all output occurs when the stack is empty, i.e., when `stackIndex === 0`.

```ts
@<Typedef...@>=
type OutputState = {
  name: nameIndex; /* `name` index for text being output */
  repl: textIndex; /* `textIndex` index for text being output */
  byte: number; /* present location within replacement text */  
  end: number; /* ending location of replacement text */  
  section: number; /* section number or zero if not a section */
}
```

```ts
@<Global_var...@>=
let curState: OutputState;
let stack: OutputState[]; /* info for non-current levels */
let stackIndex: number; /* first unused location in the output state stack */
```

```ts
@<Global_const...@>=
const STACK_END: number = STACK_SIZE-1; /* end of `stack` */
```

To get the output process started, we will perform the following initialization steps. We may assume that `texts[0].textLink` is nonzero, since it points to the text in the first unnamed section that generates code; if there are no such sections, there is nothing to output, and an
error message will have been generated before we do any of the initialization.

```ts
@<Initialize_the_output_stacks@>=
stackIndex = 1;
curState = {
  name: 0,
  repl: texts[0].textLink,
  byte: texts[texts[0].textLink].tokStart,
  end: texts[texts[0].textLink + 1].tokStart,
  section: 0
};
```

When the replacement text for name `p` is to be inserted into the output, the following subroutine is called to save the old level of output and get the new one going.

```ts
@c
/* suspends the current level */
function pushLevel(p: nameIndex)
{
  if (stackIndex === STACK_END) {
    overflow('stack');
  }
  Object.assign(stack[stack.push(
  {
    name: 0,
    repl: 0,
    byte: 0,
    end: 0,
    section: 0
  }) - 1], curState);
  stackIndex++;
  if (p !== -1) { /* p === -1 means we are in outputDefs */
    curState = {
      name: p,
      repl: nameDir[p].equiv,
      byte: texts[nameDir[p].equiv].tokStart,
      end: texts[nameDir[p].equiv + 1].tokStart,
      section: 0
    }
  }
}
```

When we come to the end of a replacement text, the `popLevel` subroutine does the right thing: It either moves to the continuation of this replacement text or returns the state to the most recently stacked level.

```ts
@c
 /* do this when curState.byte reaches curState.end. flag===false means we are in outputDefs */
function popLevel(flag: boolean)
{
  if (flag && texts[curState.repl].textLink < SECTION_FLAG) {
    /* link to a continuation */
    curState.repl = texts[curState.repl].textLink; /* stay on the same level */
    curState.byte = texts[curState.repl].tokStart;
    curState.end = curState.repl + 1 >= texts.length ? curState.byte : texts[curState.repl + 1].tokStart;
    return;
  }
  stackIndex--; /* go down to the previous level */
  if (stack.length > 0) {
    Object.assign(curState, stack.pop());
  }
}
```

The heart of the output procedure is the function `getOutput`, which produces the next token of output and sends it on to the lower-level function `outChar`. The main purpose of `getOutput` is to handle the necessary stacking and unstacking. It sends the value `SECTION_NUMBER` if the next output begins or ends the replacement text of some section, in which case `curVal` is that section's number (if beginning) or the negative of that value (if ending). (A section number of 0 indicates not the beginning or ending of a section, but a #line command.) And it sends the value `IDENTIFIER` if the next output is an identifier, in which case `curVal` points to that identifier name.

```ts
@<Global_const...@>=
const SECTION_NUMBER = 0o201; /* code returned by `getOutput` for section numbers */
const IDENTIFIER = 0o202; /* code returned by `getOutput` for identifiers */
```

```ts
@<Global_var...@>=
let curVal: number; /* additional information corresponding to output token */
```

If `getOutput` finds that no more output remains, it returns with `stackIndex === 0`.

```ts
@c
/* sends next token to outChar */
function getOutput() 
{
  let a: number; /* value of current byte */
  let done = false;
  while (!done) {
    if (stackIndex === 0) return;
    if (curState.byte === curState.end) {
      curVal = -curState.section;
      popLevel(true);
      if (curVal === 0) continue;
      outChar(SECTION_NUMBER);
      return;
    }
    a = tokMem[curState.byte++];
    if (outState === VERBATIM && a !== STR && a !== CONSTANT && a !== NEWLINE) {
      putChar(a) /* a high-bit character can occur in a string */
    } else if (a < 0o200) {
      outChar(a) /* one-byte token */
    } else {
      a = ((a - 0o200) * 0o400) + tokMem[curState.byte++];
      switch (Math.floor(a / 0o24000)) { /* 0o24000 === (0o250 - 0o200) * 0o400 */
        case 0:
          curVal = a;
          outChar(IDENTIFIER);
          done = true;
          break;
        case 1:
          if (a === OUTPUT_DEFS_FLAG) { outputDefs() }
          else @<Expand_section_a-0o24000, _goto restart@>;
          done = true;
          break;
        default:
          curVal = a - 0o50000;
          if (curVal > 0) curState.section = curVal;
          outChar(SECTION_NUMBER);
          done = true;
      }
    }
  }
}
```

The user may have forgotten to give any code text for a section name, or the code text may have been associated with a different name by mistake.

```ts
@<Expand_section_a-0o24000...@>=
{
  a -= 0o24000;
  if (nameDir[a].equiv !== 0) {
    pushLevel(a)
  } else if (a !== 0) {
    log('! Not present: <' + getSectionName(a) + '>');
  }
  continue;
}
```

## Producing the output

The `getOutput` routine above handles most of the complexity of output generation, but there are two further considerations that have a nontrivial effect on JTANGLE's algorithms.

First, we want to make sure that the output has spaces and line breaks in the right places (e.g., not in the middle of a string or a constant or an identifier, not at a `@&` position where quantities are being joined together, and certainly after an `=` because the C compiler thinks `=-` is ambiguous).

The output process can be in one of following states:

`NUM_OR_ID` means that the last item in the buf is a number or identifier, hence a blank space or line break must be inserted if the next item is also a number or identifier.

`UNBREAKABLE` means that the last item in the buf was followed by the `@&` operation that inhibits spaces between it and the next item.

`VERBATIM` means we're copying only character tokens, and that they are to be output exactly as stored. This is the case during strings, verbatim constructions and numerical constants.

`POST_SLASH` means we've just output a slash.

`NORMAL` means none of the above.

Furthermore, if the variable `protect` is positive, newlines are preceded by a `\`.

```ts
@<Global_const...@>=
const NORMAL = 0; /* non-unusual state */
const NUM_OR_ID = 1; /* state associated with numbers and identifiers */
const POST_SLASH = 2; /* state following a / */
const UNBREAKABLE = 3; /* state associated with @@ */
const VERBATIM = 4; /* state in the middle of a string */
```

```ts
@<Global_var...@>=
let outState: number; /* current status of partial output */
let protect: boolean; /* should newline characters be quoted? */
```

Here is a routine that is invoked when we want to output the current line. During the output process, `line[includeDepth]` equals the number of the next line to be output.

```ts
@c
function flushBuffer() /* writes one line to output file */ {
  putChar(NEWLINE);
  if (line[includeDepth] % 100 === 0 && flags[FLAG.p]) {
    if (line[includeDepth] % 500 === 0) log(line[includeDepth].toString());
  }
  line[includeDepth]++;
}
```

Second, we have modified the original TANGLE so that it will write output on multiple files. If a section name is introduced in at least one place by `@(` instead of `@<`, we treat it as the name of a file. All these special sections are saved on a stack, `sectionFiles`. We write them out after we've done the unnamed section.

```ts
@<Global_const...@>=
const MAX_FILES = 256;
```

```ts
@<Global_var...@>=
let sectionFiles: nameIndex[] = [];
let curSectionFile: nameIndex;
let endSectionFiles: nameIndex
let aSectionFile: nameIndex;
let curSectionNameChar: number; /* is it LESSTHAN or LEFTPAREN */
let sectionFileName: string; /* name of the file */
```

We make `endSectionFiles` point just beyond the end of `sectionFiles`. The stack pointer `curSectionFile` starts out there. Every time we see a new file, we decrement `curSectionFile` and then write it in.

```ts
@<If_its_not_there,_add_cur_section_name_to_the_output_file_stack,_or_complain_we_are_out_of_room@>=
{
  for (aSectionFile = curSectionFile; aSectionFile < endSectionFiles; aSectionFile++)
    if (sectionFiles[aSectionFile] === curSectionName) {
      break
    }

  if (aSectionFile === endSectionFiles) {
    if (curSectionFile > 0) {
      sectionFiles[--curSectionFile] = curSectionName
    } else {
      overflow('output files');
    }
  }
}
```

## The big output switch

```ts
@c
function phaseTwo() {
  if (flags[FLAG.s]) @<Print_debug_data@>;
  webFileOpen = false;
  line[includeDepth] = 1;
  @<Initialize_the_output_stacks@>
  @<Output_macro_definitions_if_appropriate@>
  if (texts[0].textLink === 0 && curSectionFile === endSectionFiles) {
    log('! No program text was specified.');
    @<Mark_harmless@>
  }
  else {
    if (curSectionFile === endSectionFiles) {
      if (flags[FLAG.p]) {
        log('Writing the output file: (' + outputFileName + ')');
      }
    } else {
      if (flags[FLAG.p]) {
        log('Writing the output files: (' + outputFileName + ')');
      }
    }

    if (texts[0].textLink !== 0) {
      while (stackIndex > 0) {
        getOutput()
      }
      flushBuffer();
    }

    @<Write_all_the_named_output_files@>

    if (flags[FLAG.h]) log('Done.');
  }
}
```

To write the named output files, we proceed as for the unnamed section. The only subtlety is that we have to open each one.

```ts
@<Write_all_the_named_output_files@>=
for (aSectionFile = endSectionFiles; aSectionFile > curSectionFile;) {
  aSectionFile--;
  sectionFileName = getSectionName(sectionFiles[aSectionFile]);
  fs.closeSync(outputFile);
  if ((outputFile = fs.openSync(sectionFileName, 'w')) === -1)
    fatal('! Cannot open output file ', sectionFileName);
  log('\n(' + sectionFileName + ')');
  line[includeDepth] = 1;
  stackIndex = 1;
  curState.name = sectionFiles[aSectionFile];
  curState.repl = nameDir[curState.name].equiv;
  curState.byte = texts[curState.repl].tokStart;
  curState.end = curState.repl + 1 >= texts.length ? curState.byte : texts[curState.repl + 1].tokStart;  
  while (stackIndex > 0) getOutput();
  flushBuffer();
}
```

If a `@h` was not encountered in the input, we go through the list of replacement tokens and copy the ones that refer to macros, preceded by the `#define` preprocessor command.

```ts
@<Output_macro_definitions_if_appropriate@>=
if (!outputDefsSeen) {
  outputDefs();
}
```

```ts
@<Global_var...@>=
let outputDefsSeen = false;
```

```ts
@c
function outputDefs() {
  let a: number;
  pushLevel(-1);
  for (curText = 1; curText < texts.length-1; curText++)
    if (texts[curText].textLink === 0) { /* curText is the text for a macro */
      curState.byte = texts[curText].tokStart;
      curState.end = curText + 1 === texts.length? tokMem.length: texts[curText+1].tokStart;
      if (isCLanguage) putString('#define ');
      outState = NORMAL;
      protect = isCLanguage; /* newlines should be preceded by '\' */
      while (curState.byte < curState.end) {
        a = tokMem[curState.byte++];
        if (curState.byte === curState.end && a === NEWLINE) {
          break; /* disregard a final newline */
        }
        if (outState === VERBATIM && a !== STR && a !== CONSTANT && a !== NEWLINE) {
          putChar(a); /* a high-bit character can occur in a string */
        } else if (a < 0o200) {
          outChar(a); /* one-byte token */
        } else {
          a = (a - 0o200) * 0o400 + tokMem[curState.byte++];
          if (a < 0o24000) { /* 0o24000 === (0o250 - 0o200) * 0o400 */
            curVal = a;
            outChar(IDENTIFIER);
          } else if (a < 0o50000) {
            confusion("macro defs have strange char");
          } else {
            curVal = a - 0o50000;
            curState.section = curVal;
            outChar(SECTION_NUMBER);
          }
          /* no other cases */
        }
      }
      protect = false;
      flushBuffer();
    }
  popLevel(false);
}
```

A many-way switch is used to send the output.  Note that this function is not called if `outState === VERBATIM`, except perhaps with arguments `\n` (protect the newline), `STR` (end the string), or `CONSTANT` (end the constant).

```ts
@c
function outChar(curChar: number) {
  let j: number, k: number; /* pointers into stringMem */
  let cc: number;
  let done = false;
  while (!done) {
    switch (curChar) {
      case NEWLINE:
        if (protect && outState !== VERBATIM) putChar(SPACE);
        if (protect || outState === VERBATIM) putChar(BACKSLASH);
        flushBuffer();
        if (outState !== VERBATIM) outState = NORMAL;
        done = true; break;
      @<Case_of_an_identifier@>
      @<Case_of_a_section_number@>
      @<Cases_like_!=@>
      case EQUALS:
      case GREATERTHAN:
        putChar(curChar);
        putChar(SPACE);
        outState = NORMAL;
        done = true; break;
      case JOIN:
        outState = UNBREAKABLE;
        done = true; break;
      case CONSTANT:
        if (outState === VERBATIM) {
          outState = NUM_OR_ID;
          done = true; break;
        }
        if (outState === NUM_OR_ID) putChar(SPACE);
        outState = VERBATIM;
        done = true; break;
      case STR:
        if (outState === VERBATIM) outState = NORMAL
        else outState = VERBATIM;
        done = true; break;
      case SLASH:
        putChar(SLASH);
        outState = POST_SLASH;
        done = true; break;
      case STAR:
        if (outState === POST_SLASH) putChar(SPACE); /* fall through */
      default:
        putChar(curChar);
        outState = NORMAL;
        done = true; break;
    }
  }
}
```

```ts
@<Cases_like_!=@>=
case PLUS_PLUS: putChar(PLUS); putChar(PLUS); outState = NORMAL; done = true; break;
case MINUS_MINUS: putChar(MINUS); putChar(MINUS); outState = NORMAL; done = true; break;
case MINUS_GT: putChar(MINUS); putChar(GREATERTHAN); outState = NORMAL; done = true; break;
case GT_GT: putChar(GREATERTHAN); putChar(GREATERTHAN); outState = NORMAL; done = true; break;
case EQ_EQ: putChar(EQUALS); putChar(EQUALS); outState = NORMAL; done = true; break;
case LT_LT: putChar(LESSTHAN); putChar(LESSTHAN); outState = NORMAL; done = true; break;
case GT_EQ: putChar(GREATERTHAN); putChar(EQUALS); outState = NORMAL; done = true; break;
case EQ_GT: putChar(EQUALS); putChar(GREATERTHAN); outState = NORMAL; done = true; break;
case LT_EQ: putChar(LESSTHAN); putChar(EQUALS); outState = NORMAL; done = true; break;
case NOT_EQ: putChar(EXCLAMATION); putChar(EQUALS); outState = NORMAL; done = true; break;
case AND_AND: putChar(AMPERSAND); putChar(AMPERSAND); outState = NORMAL; done = true; break;
case OR_OR: putChar(VBAR); putChar(VBAR); outState = NORMAL; done = true; break;
case DOT_DOT_DOT: putChar(DOT); putChar(DOT); putChar(DOT); outState = NORMAL; done = true; break;
case COLON_COLON: putChar(COLON); putChar(COLON); outState = NORMAL; done = true; break;
case PERIOD_AST: putChar(DOT); putChar(STAR); outState = NORMAL; done = true; break;
case MINUS_GT_AST: putChar(MINUS); putChar(GREATERTHAN); putChar(STAR); outState = NORMAL; done = true; break;
```

When an identifier is output to a file, characters in the range 128-255 must be changed into something else. By default, JTANGLE converts the character with code $16x+y$ to the three characters 'X$xy$', but a different transliteration table can be specified. Thus a German might want {gr&uuml;n} to appear as a still readable {`gruen`}. This makes debugging a lot less confusing.

```ts
@<Global_const...@>=
const TRANSLIT_LENGTH = 10;
```

```ts
@<Global_var...@>=
let translit: string[] = [];
```

```ts
@<Case_of_an_identifier@>=
case IDENTIFIER:
  if (outState === NUM_OR_ID) putChar(SPACE);
  j = 0;
  k = stringMem[nameDir[curVal].stringIndex].length;
  while (j < k) {
    cc = stringMem[nameDir[curVal].stringIndex].charCodeAt(j);
    if (cc < 0o200) {
      putChar(cc)
    } else {
      putString(translit[cc - 0o200])
    }
    j++;
  }
  outState = NUM_OR_ID;
  done = true; break;
```

```ts
@<Case_of_a_sec...@>=
case SECTION_NUMBER:
  if (curVal > 0) putString('/*' + curVal.toString() + ':*/');
  else if (curVal < 0) putString('/*:' + -curVal.toString() + '*/');
  else if (protect) {
    curState.byte += 4; /* skip line number and file name */
    curChar = NEWLINE;
    break; /* restart */
  } else {
    let a: number;
    a = 0o400 * tokMem[curState.byte++];
    a += tokMem[curState.byte++]; /* gets the line number */
    if (isCLanguage) putString('\n#line ' + a.toString() + ' "');
    curVal = tokMem[curState.byte++];
    curVal = 0o400 * (curVal - 0o200) + tokMem[curState.byte++]; /* points to the file name */
    let cc: number;
    for (j = 0; j < stringMem[nameDir[curVal].stringIndex].length; j++) {
      cc = stringMem[nameDir[curVal].stringIndex].charCodeAt(j);
      if (isCLanguage) {
        if (cc === BACKSLASH || cc === DOUBLEQUOTE) putChar(BACKSLASH);
        putChar(cc);
      } 
    }
    if (isCLanguage) putString('"');
    putString('\n');
  }
  done = true; break;
```

## Introduction to the input phase

We have now seen that JTANGLE will be able to output the full program, if we can only get that program into the byte memory in the proper format. The input process is something like the output process in reverse, since we compress the text as we read it in and we expand it
as we write it out.

There are three main input routines. The most interesting is the one that gets the next token of a text; the other two are used to scan rapidly past text in the JWEB source code. One of the latter routines will jump to the next token that starts with `@`, and the other skips to the end of a comment.

Control codes in JWEB begin with `@`, and the next character identifies the code. They are converted by JTANGLE into internal code numbers by the `ccode` table below. The ordering of these internal code numbers has been chosen to simplify the program logic; larger numbers are given to the control codes that denote more significant milestones.

```ts
@<Global_const...@>=
const IGNORE = 0; /* control code of no interest to JTANGLE */
const ORD = 0o302; /* control code for '@'' */
const CONTROL_TEXT = 0o303; /* control code for '@t', '@\', etc. */
const TRANSLIT_CODE = 0o304; /* control code for '@l' */
const OUTPUT_DEFS_CODE = 0o305; /* control code for '@h' */
const FORMAT_CODE = 0o306; /* control code for '@f' */
const DEFINITION = 0o307; /* control code for '@d' */
const BEGIN_C = 0o310; /* control code for '@c' */
const SECTION_NAME = 0o311; /* control code for '@<' */
const NEW_SECTION = 0o312; /* control code for `@@ ` and `@@*` */
```

```ts
@<Global_var...@>=
let ccode: number[] = []; /* meaning of a char following '@@' */
```

The `skipAhead` procedure reads through the input at fairly high speed until finding the next non-ignorable control code, which it returns.

```ts
@c
function skipAhead(): number /* skip to next control code */ {
  let cc: number; /* control code found */
  while (true) {
    if (loc > limit && !getLine()) return (NEW_SECTION);
    buf[limit + 1] = AT;
    while (buf[loc] !== AT) loc++;
    if (loc <= limit) {
      loc++;
      cc = ccode[buf[loc]];
      loc++;
      if (cc !== IGNORE || buf[loc - 1] === GREATERTHAN) return (cc);
    }
  }
}
```

The `skipComment` procedure reads through the input at somewhat high speed in order to pass over comments, which JTANGLE does not transmit to the output. If the comment is introduced by `'/*'`, `skipComment` proceeds until finding the end-comment token `'*/'` or a newline; in the latter case `skipComment` will be called again by `getNext`, since the comment is not finished.  This is done so that each newline in the code part of a section is copied to the output; otherwise the `#line` commands inserted into the output file by the output routines become useless.  
On the other hand, if the comment is introduced by `//` (i.e., if it is a "short comment"), it always is simply delimited by the next newline. The boolean argument `isLongComment` distinguishes between the two types of comments.

If `skipComment` comes to the end of the section, it prints an error message. No comment, long or short, is allowed to contain '@ ' or '@*'.

```ts
@<Global_var...@>=
let commentContinues = false; /* are we scanning a comment? */
```

```ts
@c
function skipComment(isLongComment: boolean) /* skips over comments */
{
  let cc: number; /* current character */
  while (true) {
    if (loc > limit) {
      if (isLongComment) {
        if (getLine()) {
          commentContinues = true;
          return;
        } else {
          errPrint("! Input ended in mid-comment");
          commentContinues = false;
          return;
        }
      } else {
        commentContinues = false;
        return;
      }
    }
    cc = buf[loc++];
    if (isLongComment && cc === STAR && buf[loc] === SLASH) {
      loc++;
      commentContinues = false;
      return;
    }
    if (cc === AT) {
      if (ccode[buf[loc]] === NEW_SECTION) {
        errPrint("! Section name ended in mid-comment");
        loc--;
        commentContinues = false;
        return;
      }
      else loc++;
    }
  }
}
```

## Inputting the next token

```ts
@<Global_const...@>=
const CONSTANT = 0o3;
```

```ts
@<Global_var...@>=
let curSectionName: nameIndex; /* name of section just scanned */
let noWhere: boolean; /* suppress `printWhere`? */
```

As one might expect, `getNext` consists mostly of a big switch that branches to the various special cases that can arise.

```ts
@c
function isXAlpha(cc: number): boolean {  /* non-alpha characters allowed in identifier */
  return(cc === UNDERSCORE || cc === DOLLAR)
}

function isHigh(cc: number): boolean {
  return(cc > 0o177)
}
```

```ts
@c
function getNext(): number /* produces the next input token */
{
  let preprocessing = false;
  let cc: number; /* the current character */
  while (true) {
    if (loc > limit) {
      if (preprocessing && buf[limit-1] !== BACKSLASH) preprocessing = false;
      if (!getLine()) {
        return(NEW_SECTION)
      } else if (printWhere && !noWhere) {
        printWhere = false;
        @<Insert_the_line_number_into_tok_mem@>
      } else return (NEWLINE);
    }
    
    cc = buf[loc];
    if (commentContinues || (cc === SLASH && (buf[loc+1] === STAR || buf[loc+1] === SLASH))) {
      skipComment(commentContinues || buf[loc+1] === STAR);
      // scan to end of comment or newline
      if (commentContinues) {
        return(NEWLINE)
      } else {
        continue
      }
    }

    const cNext = buf[++loc];

    if (xIsDigit(cc) || cc === DOT)
      @<Get_a_constant@>
    else if ((cc === SINGLEQUOTE || cc === DOUBLEQUOTE) || (cc === 'L'.charCodeAt(0) && (cNext === SINGLEQUOTE || cNext === DOUBLEQUOTE)))
      @<Get_a_string@>
    else if (isAlpha(cc) || isXAlpha(cc) || isHigh(cc))
      @<Get_an_identifier@>
    else if (cc === AT )
      @<Get_control_code_and_possible_section_name@>
    else if (xIsSpace(cc)) {
      if (!preprocessing || loc > limit) continue
      /* we don't want a blank after a final backslash */
      else return(SPACE); /* ignore spaces and tabs, unless preprocessing */
    } else if (cc === HASHTAG && loc === 1) {
      preprocessing = true
    }
    @<Compress_two-symbol_operator@>
    return(cc);
  }
}
```

The following code assigns values to the combinations `++`, `--`, `->`, `>=`, `<=`, `==`, `<<`, `>>`, `!=`, `||` and `&&`, and to the C++ combinations `...`, `::`, `.*` and `->*`. The compound assignment operators (e.g., `+=`) are treated as separate tokens.

```ts
@<Compress_two-symbol_operator@>=
switch(cc) {
  case PLUS:
    if (cNext === PLUS && loc++ <= limit) return(PLUS_PLUS);
    break;
  case MINUS:
    if (cNext === MINUS) {
      if (loc++ <= limit) return(MINUS_MINUS);
    }
    else if (cNext === GREATERTHAN) {
      if (buf[loc+1] === STAR) {
        loc++;
        if (loc++ <= limit) return(MINUS_GT_AST);
      }
      else if (loc++ <= limit) return(MINUS_GT);
    }
    break;
  case DOT:
    if (cNext === STAR) {
      if (loc++ <= limit) return(PERIOD_AST);
    }
    else if (cNext === DOT && buf[loc+1] === DOT) {
      loc++;
      if (loc++ <= limit) return(DOT_DOT_DOT);
    }
    break;
  case COLON:
    if (cNext === COLON && loc++ <= limit) return(COLON_COLON);
    break;
  case EQUALS:
    if (cNext === EQUALS) {
      if (loc++ <= limit) return(EQ_EQ);
    }
    else if (cNext === GREATERTHAN && loc++ <= limit) return(EQ_GT);
    break;
  case GREATERTHAN:
    if (cNext === EQUALS) {
      if (loc++ <= limit) return(GT_EQ);
    }
    else if (cNext === GREATERTHAN && loc++ <= limit) return(GT_GT);
    break;
  case LESSTHAN:
    if (cNext === EQUALS) {
      if (loc++ <= limit) return(LT_EQ);
    }
    else if (cNext === LESSTHAN && loc++ <= limit) return(LT_LT);
    break;
  case AMPERSAND:
    if (cNext === AMPERSAND && loc++ <= limit) return(AND_AND);
    break;
  case VBAR:
    if (cNext === VBAR && loc++ <= limit) return(OR_OR);
    break;
  case EXCLAMATION:
    if (cNext === EQUALS && loc++ <= limit) return(NOT_EQ);
    break;
}
```

```ts
@<Global_const...@>=
const LONGEST_NAME = 1000; /* section names shouldn't be longer than this */
const sectionText = Buffer.alloc(LONGEST_NAME, 0, 'utf8'); /* name being sought for */
const sectionTextEnd: number = LONGEST_NAME; /* end of sectionText */
```

```ts
@<Global_var...@>=
let idFirst: number; /* where the current identifier begins in the buf */
let idLoc: number; /* just after the current identifier in the buf */
```

```ts
@<Get_an_identifier@>=
{
  idFirst = --loc;
  while (isAlpha(buf[++loc]) || isDigit(buf[loc]) || isXAlpha(buf[loc]) || isHigh(buf[loc]));
  idLoc = loc;
  return(IDENTIFIER);
}
```

```ts
@<Get_a_constant@>=
{
  idFirst = loc-1;

  if (buf[idFirst] === DOT && !xIsDigit(buf[loc])) { /* mistake - not a constant */
    @<Compress_two-symbol_operator@>
    return(cc);
  }

  let foundBinConst = false;
  let foundHexConst = false;
  let foundOctConst = false;

  if (buf[idFirst] === '0'.charCodeAt(0)) {
    /* binary constant */
    if (buf[loc] === 'b'.charCodeAt(0) || buf[loc] === 'B'.charCodeAt(0)) {
      loc++;
      while (xIsXDigit(buf[loc])) loc++;
      foundBinConst = true;
    }
    /* hex constant */
    if (buf[loc] === 'x'.charCodeAt(0) || buf[loc] === 'X'.charCodeAt(0)) {
      loc++;
      while (xIsXDigit(buf[loc])) loc++;
      foundHexConst = true;
    }
    /* octal constant */
    if (buf[loc] === 'o'.charCodeAt(0) || buf[loc] === 'O'.charCodeAt(0)) {
      loc++;
      while (xIsXDigit(buf[loc])) loc++;
      foundOctConst = true;
    }
  }

  if (!(foundBinConst || foundHexConst || foundOctConst)) {
    while (xIsDigit(buf[loc])) loc++;
    if (buf[loc] === DOT) {
      loc++;
      while (xIsDigit(buf[loc])) loc++;
    }
     /* float constant */
    if (buf[loc] === 'e'.charCodeAt(0) || buf[loc] === 'E'.charCodeAt(0)) {
      if (buf[++loc] === PLUS || buf[loc] === MINUS) loc++;
      while (xIsDigit(buf[loc])) loc++;
    }
  }

  while (buf[loc] === 'u'.charCodeAt(0) || buf[loc] === 'U'.charCodeAt(0) || buf[loc] === 'l'.charCodeAt(0) || buf[loc] === 'L'.charCodeAt(0) || buf[loc] === 'f'.charCodeAt(0) || buf[loc] === 'F'.charCodeAt(0)) loc++;

  idLoc = loc;
  return(CONSTANT);
}
```

Strings and character constants, delimited by double and single quotes, respectively, can contain newlines or instances of their own delimiters if they are protected by a backslash. We follow this convention, but do not allow the string to be longer than `LONGEST_NAME`.

```ts
@<Global_const...@>=
const stringText = Buffer.alloc(LONGEST_NAME, 0, 'utf8');
const stringTextEnd: number = LONGEST_NAME;
```

```ts
@<Get_a_string@>=
{
  let delim = cc; /* what started the string */
  idFirst = 1;
  idLoc = 0;
  stringText[++idLoc] = delim;
  if (delim === 'L'.charCodeAt(0)) { /* wide character constant */
    delim = buf[loc++];
    stringText[++idLoc] = delim;
  }

  while (true) {
    if (loc >= limit) {
      if (buf[limit-1] !== BACKSLASH) {
        errPrint("! String didn't end");
        loc=limit; break;
      }
      if (!getLine()) {
        errPrint("! Input ended in middle of string");
        loc = 0;
        break;
      }
      else if (++idLoc <= stringTextEnd) stringText[idLoc] = NEWLINE; /* will print as \.{"\\\\\\n"} */
    }
    if ((cc = buf[loc++]) === delim) {
      if (++idLoc <= stringTextEnd) stringText[idLoc] = cc;
      break;
    }
    if (cc === BACKSLASH) {
      if (loc >= limit) continue;
      if (++idLoc <= stringTextEnd) stringText[idLoc] = BACKSLASH;
      cc = buf[loc++];
    }
    if (++idLoc <= stringTextEnd) stringText[idLoc] = cc;
  }

  if (idLoc >= stringTextEnd) {
    log('! String too long: ');
    log(stringText.toString('utf8', 1, 26));
    errPrint('...');
  }

  idLoc++;
  return(STR);
}
```

After an `@` sign has been scanned, the next character tells us whether there is more work to do.

```ts
@<Get_control_code_and_possible_section_name@>=
{
  cc = ccode[buf[loc++]];
  switch(cc) {
    case IGNORE:
      continue;
    case TRANSLIT_CODE:
      errPrint("! Use @@l in limbo only");
      continue;
    case CONTROL_TEXT:
      while ((cc = skipAhead()) === AT)
      /* only @@ and @> are expected */
      if (buf[loc-1] !== GREATERTHAN)
        errPrint("! Double @@ should be used in control text");
      continue;
    case SECTION_NAME:
      curSectionNameChar = buf[loc-1];
      @<Scan_the_section_name_and_make_cur_section_name_point_to_it@>
    case STR:
      @<Scan_a_verbatim_string@>
    case ORD:
      @<Scan_an_ASCII_constant@>
    default:
      return(cc);
  }
}
```

After scanning a valid ASCII constant that follows `@'`, this code plows ahead until it finds the next single quote. (Special care is taken if the quote is part of the constant.) Anything after a valid ASCII constant is ignored; thus, `@'\` gives the same result as `@'\n`.

```ts
@<Scan_an_ASCII_constant@>=
  idFirst = loc;
  if (buf[loc] === BACKSLASH) {
    if (buf[++loc] === SINGLEQUOTE) loc++;
  }
  while (buf[loc] !== SINGLEQUOTE) {
    if (buf[loc] === AT) {
      if (buf[loc+1] !== AT)
        errPrint("! Double @@ should be used in ASCII constant");
      else loc++;
    }
    loc++;
    if (loc > limit) {
      errPrint("! String didn't end");
      loc = limit-1;
      break;
    }
  }
  loc++;
  return(ORD);
```

```ts
@<Scan_the_section_name...@>=
{
  let k: number; /* pointer into sectionText */
  @<Put_section_name_into_sectionText@>  
  if (k > 3 && sectionText.toString('utf8', 1, k+1).endsWith('...'))
    curSectionName = sectionLookup(sectionText.toString('utf8', 1, k-2), true) /* true means is a prefix */
  else
    curSectionName = sectionLookup(sectionText.toString('utf8', 1, k+1), false);
  if (curSectionNameChar === LEFTPAREN)
    @<If_its_not_there,_add_cur_section_name_to_the_output_file_stack,_or_complain_we_are_out_of_room@>
  return(SECTION_NAME);
}
```

Section names are placed into the `sectionText` string with consecutive spaces, tabs, and carriage-returns replaced by single spaces. There will be no spaces at the beginning or the end. (We set `sectionText[0] = SPACE` to facilitate this, since the `sectionLookup` routine uses `sectionText[1]` as the first character of the name.)

```ts
@<Put_section_name...@>=
k = 0;
sectionText.fill(0,1);
while (true) {
  if (loc > limit && !getLine()) {
    errPrint("! Input ended in section name");
    loc = 1;
    break;
  }
  cc = buf[loc];
  @<If_end_of_name_or_erroneous_nesting,_break@>
  loc++;
  if (k < sectionTextEnd) k++;
  if (xIsSpace(cc)) {
    cc = SPACE;
    if (sectionText[k-1] === SPACE) k--;
  }
sectionText[k] = cc;
}
if (k >= sectionTextEnd) {
  log('! Section name too long: ' + sectionText.toString('utf8', 1, 26) + ' ...');
  @<Mark_harmless@>
}
if (sectionText[k] === SPACE && k > 0) k--;
```

```ts
@<If_end_of_name_or_erroneous_nesting,...@>=
if (cc === AT) {
  cc = buf[loc+1];
  if (cc === GREATERTHAN) {
    loc += 2;
    break;
  }
  if (ccode[cc] === NEW_SECTION) {
    errPrint("! Section name didn't end");
    break;
  }
  if (ccode[cc] === SECTION_NAME) {
    errPrint("! Nesting of section names not allowed");
    break;
  }
  sectionText[++k] = AT;
  loc++; /* now cc === buf[loc] again */
}
```

At the present point in the program we have `buf[loc-1] === STR`; we set `idFirst` to the beginning of the string itself, and `idLoc` to its ending-plus-one location in the buf. We also set `loc` to the position just after the ending delimiter.

```ts
@<Scan_a_verbatim_string@>=
{
  idFirst = loc++;
  buf[limit+1] = AT;
  buf[limit+2] = GREATERTHAN;
  while (buf[loc] !== AT || buf[loc+1] !== GREATERTHAN) loc++;
  if (loc >= limit) errPrint("! Verbatim string didn't end");
  idLoc = loc;
  loc += 2;
  return(STR);
}
```

## Scanning a macro definition

The rules for generating the replacement tokens corresponding to macros and code tokens of a section are almost identical; the only differences are that

a) Section names are not allowed in macros; in fact, the appearance of a section name terminates such macros and denotes the name of the current section.

b) The symbols `@d` and `@f` and `@c` are not allowed after section names, while they terminate macro definitions.

c) Spaces are inserted after right parentheses in macros, because the ANSI C preprocessor sometimes requires it.

Therefore there is a single procedure `scanRepl` whose parameter `t` specifies either `MACRO` or `SECTION_NAME`. After `scanRepl` has acted, `curText` will point to the replacement text just generated, and `nextControl` will contain the control code that terminated the activity.

```ts
@<Global_const...@>=
const MACRO = 0;
```

```ts
@c
function appRepl(tok: number) {
  tokMem.push(tok);
}
```

```ts
@<Global_var...@>=
let curText: textIndex; /* replacement text formed by scanRepl */
let nextControl: number;
```

```ts
@c
function scanRepl(t: number) /* creates a replacement text */
{
  let a = 0; /* the current token */
  if (t === SECTION_NAME) @<Insert_the_line_number_into_tok_mem@>
  let done = false;
  while (!done)
    switch (a = getNext()) {
      @<In_cases_that_a_is_a non-char_token_(identifier,SECTION_NAME,etc.),_either_process_it_and_change_a_to_a_byte_that_should_be_stored,_or_continue_if_a_should_be_ignored,_or_goto_done_if_a_signals_the_end_of_this_replacement_text@>
      case RIGHTPAREN:
        appRepl(a);
        if (t === MACRO) appRepl(SPACE);
        break;
      default:
        appRepl(a); /* store a in tokMem */
    }
  nextControl = a;
  curText = texts.length - 1;
  texts.push(
    { tokStart: tokMem.length,
      textLink: 0
    }
  );
}
```

Here is the code for the line number: first `0o150000`; then the numeric line number; then a pointer to the file name.

```ts
@<Insert_the_line...@>=
{
  let ni: nameIndex;
  storeTwoBytes(0o150000);
  if (changing) {
    ni = idLookup(changeFileName);
    storeTwoBytes(changeLine);
  }
  else {
    ni = idLookup(fileName[includeDepth]);
    storeTwoBytes(line[includeDepth]);
  }  
  appRepl(Math.floor(ni / 0o400) + 0o200);
  appRepl(ni % 0o400);
}
```

```ts
@<In_cases_that_a_is...@>=
case IDENTIFIER:
  a = idLookup(buf.toString('utf8', idFirst, idLoc));
  appRepl(Math.floor(a / 0o400) + 0o200);
  appRepl(a % 0o400);
  break;
case SECTION_NAME:
  if (t !== SECTION_NAME) {
    done = true;
    break;
  } else {
    @<Was_an_ATAT_missed_here@>
    a = curSectionName;
    appRepl(Math.floor(a / 0o400) + 0o250);
    appRepl(a % 0o400);
    @<Insert_the_line_number_into_tok_mem@>
    break;
  }
case OUTPUT_DEFS_CODE:
  if (t !== SECTION_NAME) {
    errPrint("! Misplaced @@h")
  } else {
    outputDefsSeen = true;
    a = OUTPUT_DEFS_FLAG;
    appRepl(Math.floor(a / 0o400) + 0o200);
    appRepl(a % 0o400);
    @<Insert_the_line_number_into_tok_mem@>
  }
  break;
case CONSTANT:
case STR:
  @<Copy_a_string_or_verbatim_construction_or_numerical_constant@>
case ORD:
  @<Copy_an_ASCII_constant@>
case DEFINITION:
case FORMAT_CODE:
case BEGIN_C:
  if (t !== SECTION_NAME) {
    done = true;
    break;
  } else {
    errPrint("! @@d, @@f and @@c are ignored in C text");
    continue;
  }
case NEW_SECTION:
  done = true;
  break;
```

```ts
@<Was_an_ATAT...@>=
{
  let try_loc = loc;
  while (buf[try_loc] === SPACE && try_loc < limit) try_loc++;
  if (buf[try_loc] === PLUS && try_loc < limit) try_loc++;
  while (buf[try_loc] === SPACE && try_loc < limit) try_loc++;
  if (buf[try_loc] === EQUALS) errPrint("! Missing @@ before a named section");
  /* user who isn't defining a section should put newline after the name,
     as explained in the manual */
}
```

```ts
@<Copy_a_string...@>=
  appRepl(a); /* STR or CONSTANT */
  switch (a) {
    case STR:
      while (idFirst < idLoc) { /* simplify @@ pairs */
        if (stringText[idFirst] === AT) {
          if (stringText[idFirst + 1] === AT) idFirst++
          else errPrint("! Double @@ should be used in string");
        }
        appRepl(stringText[idFirst++]);
      }
      break;
    case CONSTANT:
      while (idFirst < idLoc) appRepl(buf[idFirst++]);
      break;
    default: errPrint("! Copy_a_string: Not a STR or CONSTANT");
  }
  appRepl(a);
  break;
```

This section should be rewritten on machines that don't use ASCII code internally.

```ts
@<Copy_an_ASCII_constant@>=
{
  let cc = buf[idFirst];
  if (cc === BACKSLASH) {
    cc = buf[++idFirst];
    if (cc >= '0'.charCodeAt(0) && cc <= '7'.charCodeAt(0)) {
      cc -= '0'.charCodeAt(0);
      if (buf[idFirst+1] >= '0'.charCodeAt(0) && buf[idFirst+1] <= '7'.charCodeAt(0)) {
        cc = 8 * cc + buf[++idFirst] - '0'.charCodeAt(0);
        if (buf[idFirst+1] >= '0'.charCodeAt(0) && buf[idFirst+1] <= '7'.charCodeAt(0) && cc < 32)
          cc = 8 * cc + buf[++idFirst] - '0'.charCodeAt(0);
      }
    }
    else switch (cc) {
    case 't'.charCodeAt(0): cc = TAB; break;
    case 'n'.charCodeAt(0): cc = NEWLINE; break;
    case 'b'.charCodeAt(0): cc = BACKSPACE; break;
    case 'f'.charCodeAt(0): cc = FORMFEED; break;
    case 'v'.charCodeAt(0): cc = VTAB; break;
    case 'r'.charCodeAt(0): cc = RETURN; break;
    case 'a'.charCodeAt(0): cc = BEL; break;
    case QMARK: break;
    case 'x'.charCodeAt(0):
      if (xIsDigit(buf[idFirst+1])) {
        cc = buf[++idFirst] - '0'.charCodeAt(0)
      } else if (xIsXDigit(buf[idFirst+1])) {
        ++idFirst;
        cc = buf[idFirst] - 32 - 'A'.charCodeAt(0) + 10;
      }
      if (xIsDigit(buf[idFirst+1])) {
        cc = 16 * cc + buf[++idFirst] - '0'.charCodeAt(0)
      } else if (xIsXDigit(buf[idFirst+1])) {
        ++idFirst;
        cc = 16 * buf[idFirst] - 32 - 'A'.charCodeAt(0) + 10;
      }
      break;
    case BACKSLASH: break;
    case SINGLEQUOTE: break;
    case DOUBLEQUOTE: break;
    default: errPrint("! Unrecognized escape sequence");
    }
  }
  /* at this point cc should have been converted to its ASCII code number */
  appRepl(CONSTANT);
  if (cc >= 100) appRepl('0'.charCodeAt(0) + Math.floor(cc / 100));
  if (cc >= 10) appRepl('0'.charCodeAt(0) + Math.floor(cc / 10) % 10);
  appRepl('0'.charCodeAt(0) + cc % 10);
  appRepl(CONSTANT);
}
break;
```

## Scanning a section

The `scanSection` procedure starts when `'@ '` or `'@*'` has been sensed in the input, and it proceeds until the end of that section. It uses `sectionCount` to keep track of the current section number.

```ts
@<Global_var...@>=
let sectionCount: number; /* the current section number */
```

Javascript implementations of some standard C library character functions, plus non-standard extended versions:

```ts
@c
function isDigit(cc: number): boolean {
  return cc >= '0'.charCodeAt(0) && cc <= '9'.charCodeAt(0)
}

function isXDigit(cc: number): boolean {
  return (isDigit(cc) || (cc >= 'A'.charCodeAt(0) && cc <= 'F'.charCodeAt(0)) || (cc >= 'a'.charCodeAt(0) && cc <= 'f'.charCodeAt(0)))
}

function isAlpha(cc: number): boolean {
  return ((cc >= 'a'.charCodeAt(0) && cc <= 'z'.charCodeAt(0)) || (cc >= 'A'.charCodeAt(0) && cc <= 'Z'.charCodeAt(0)))
}

function isSpace(cc: number): boolean {
  return (cc === TAB || cc === NEWLINE || cc === VTAB || cc === FORMFEED || cc === RETURN || cc === SPACE)
}

function isUpper(cc: number): boolean {
  return (cc >= 'A'.charCodeAt(0) && cc <= 'Z'.charCodeAt(0))
}

function xIsDigit(cc: number): boolean {
  return isDigit(cc) && (cc < 0o200)
}

function xIsAlpha(cc: number): boolean {
  return isAlpha(cc) && (cc < 0o200)
}

function xIsSpace(cc: number): boolean {
  return isSpace(cc) && (cc < 0o200)
}

function xIsUpper(cc: number): boolean {
  return isUpper(cc) && (cc < 0o200)
}

function xIsXDigit(cc: number): boolean {
  return isXDigit(cc) && (cc < 0o200)
}

```

The body of `scanSection` is a loop where we look for control codes that are significant to JTANGLE: those that delimit a definition, the code part of a module, or a new module.

```ts
@c
function scanSection()
{
  let p: nameIndex; /* section name for the current section */
  let q: textIndex; /* text for the current section */
  let a: number; /* token for left-hand side of definition */
  sectionCount++;
  noWhere = true;
  if (buf[loc-1] === STAR && flags[FLAG.p]) {
    /* starred section */
    log('*' + sectionCount.toString());
  }
  nextControl = 0;
  while (true) {
    @<Skip_ahead_until_next_control_corresponds_to_@@d,_@@<,_@@\__or_the_like@>
    if (nextControl === DEFINITION) {  /* \.{@@d} */
        @<Scan_a_definition@>
        continue;
    }
    if (nextControl === BEGIN_C) {  /* \.{@@c} or \.{@@p} */
      p = 0;
      break;
    }
    if (nextControl === SECTION_NAME) { /* \.{@@<} or \.{@@(} */
      p = curSectionName;
      @<If_section_is_not_being_defined,_continue@>
      break;
    }
    return; /* \.{@@\ } or \.{@@*} */
  }
  noWhere = printWhere = false;
  @<Scan_the_C_part_of_the_current_section@>
}
```

At the top of this loop, if `nextControl === SECTION_NAME`, the section name has already been scanned (see `@<Get_control_code_and...@>`).  Thus, if we encounter `nextControl === SECTION_NAME` in the skip-ahead process, we should likewise scan the section name, so later processing will be the same in both cases.

```ts
@<Skip_ahead_until_next_control...@>=
while (nextControl < DEFINITION) /* `DEFINITION` is the lowest of the "significant" codes */
  if((nextControl = skipAhead()) === SECTION_NAME){
    loc -= 2;
    nextControl = getNext();
  }
```

```ts
@<Scan_a_definition@>=
{
  while ((nextControl = getNext()) === NEWLINE) ; /* allow newline before definition */
  if (nextControl !== IDENTIFIER) {
    errPrint("! Definition flushed, must start with identifier");
    continue;
  };
  a = idLookup(buf.toString('utf8', idFirst, idLoc));
  appRepl(Math.floor(a / 0o400) + 0o200); /* append the lhs */
  appRepl(a % 0o400);
  if (buf[loc] !== LEFTPAREN) { /* identifier must be separated from replacement text */
    appRepl(STR);
    appRepl(SPACE);
    appRepl(STR);
  }
  scanRepl(MACRO);
  texts[curText].textLink = 0; /* textLink===0 characterizes a macro */
}
```

If the section name is not followed by `EQUALS` or `'+='`, no code is forthcoming: the section is being cited, not being defined. This use is illegal after the definition part of the current section has started, except inside a comment, but JTANGLE does not enforce this rule; it simply ignores the offending section name and everything following it, up to the next significant control code.

```ts
@<If_section_is_not_being_defined,_continue@>=
while ((nextControl = getNext()) === PLUS); /* allow optional '+=' */
if (nextControl !== EQUALS && nextControl !== EQ_EQ)
  continue;
```

```ts
@<Scan_the_C...@>=
@<Insert_the_section_number_into_tok_mem@>
scanRepl(SECTION_NAME); /* now curText points to the replacement text */
@<Update_the_data_structure_so_that_the_replacement_text_is_accessible@>
```

```ts
@<Insert_the_section_number...@>=
storeTwoBytes((0o150000 + sectionCount)); /* 0o150000==0o320*0o400 */
```

```ts
@<Update_the_data...@>=
if (p === 0) { /* unnamed section, or bad section name */
  texts[lastUnnamed].textLink = curText;
  lastUnnamed = curText;
}
else if (nameDir[p].equiv === 0) {
    nameDir[p].equiv = curText /* first section of this name */
}
else {
    q = nameDir[p].equiv;
    while (texts[q].textLink < SECTION_FLAG)
      q = texts[q].textLink; /* find end of list */
    texts[q].textLink = curText;
}
texts[curText].textLink = SECTION_FLAG; /* mark this replacement text as a nonmacro */
```

```ts
@c
function phaseOne() {
  sectionCount = 0;
  resetInput();
  skipLimbo();
  while (!inputHasEnded) scanSection();
  checkComplete();
}
```

Only a small subset of the control codes is legal in limbo, so limbo processing is straightforward.

```ts
@c
function skipLimbo()
{
  let cc: number;
  while (true) {
    if (loc > limit && !getLine()) return;
    buf[limit+1] = AT;
    while (buf[loc] !== AT) loc++;
    if (loc++ <= limit) {
      cc = buf[loc++];
      if (ccode[cc] === NEW_SECTION) break;
      switch (ccode[cc]) {
        case TRANSLIT_CODE:
          @<Read_in_transliteration_of_a_character@>
          break;
        case FORMAT_CODE:
        case AT:
          break;
        case CONTROL_TEXT:
          if (cc === 'q'.charCodeAt(0) || cc === 'Q'.charCodeAt(0)) {
            while ((cc = skipAhead()) === AT);
            if (buf[loc-1] !== GREATERTHAN)
              errPrint("! Double @@ should be used in control text");
            break;
          } /* otherwise fall through */
        default:
          errPrint("! Double @@ should be used in limbo");
      }
    }
  }
}
```

```ts
@<Read_in_transliteration_of_a_character@>=
  while (xIsSpace(buf[loc]) && loc < limit) loc++;
  loc += 3;
  if (loc > limit || !xIsXDigit(buf[loc-3]) || !xIsXDigit(buf[loc-2]) || (buf[loc-3] >= '0'.charCodeAt(0) && buf[loc-3] <= '7'.charCodeAt(0)) || !xIsSpace(buf[loc-1])) {
    errPrint("! Improper hex number following @@l");
  } else {
    const i = parseInt(buf.toString('utf8', loc-3, loc-2), 16);
    while (xIsSpace(buf[loc]) && loc < limit) loc++;
    const beg = loc;
    while (loc < limit && (xIsAlpha(buf[loc]) || xIsDigit(buf[loc]) || buf[loc] === UNDERSCORE)) loc++;
    if (loc - beg >= TRANSLIT_LENGTH)
      errPrint("! Replacement string in @@l too long");
    else{
      translit[i-0o200] = buf.toString('utf8', beg, loc);
    }
  }
```

```ts
@c
function printStats() {
  log('\nMemory usage statistics:');
  log(nameDir.length.toString() + ' names');
  log(stringMem.length.toString() + ' strings');
  log((texts.length - 1).toString() + ' replacement texts');
  log(tokMem.length.toString() + ' tokens');
}
```

## Input routines

The lowest level of input to the JWEB programs is performed by `inputLn`, which must be told which file to read from. The return value of `inputLn` is true if the read is successful and false if not (generally this means the file has ended). The characters of the next line of the file are copied into the `buf` array, and the global variable `limit` is set to the first unoccupied position. Trailing blanks are ignored. The value of `limit` must be strictly less than `BUF_SIZE`, so that `buf[BUF_SIZE-1]` is never filled.

Since `BUF_SIZE` is strictly less than `LONG_BUF_SIZE`, some of JWEB's routines use the fact that it is safe to refer to `buf[limit+2]` without overstepping the bounds of the array.

```ts
@<Global_const...@>=
const BUF_SIZE = 0o400;
const LONG_BUF_SIZE = (BUF_SIZE+LONGEST_NAME);
const buf = Buffer.alloc(LONG_BUF_SIZE, 0, 'utf8'); /* where each line of input goes */
const bufEnd: number = BUF_SIZE-1; /* end of `buf` */
```

```ts
@<Global_var...@>=
let bytesRead = -1;
let limit = 0; /* points to the last character in the buf */
let loc = 0; /* points to the next character to be read from the buf */
```

```ts
@c
function inputLn(fp: number): boolean /* copies a line into `buf` or returns false */
{
  if (fp < 0) return(false);
  let k: number;  /* where next character goes */  
  const c = new Uint8Array(1); /* the character read */
  limit = k = 0;  /* beginning of buf */
  buf.fill(0);
  while ((k <= bufEnd) && ((bytesRead = fs.readSync(fp, c, 0, 1, -1)) !== 0) && (c[0] !== NEWLINE))
    if ((buf[k++] = c[0]) !== SPACE) limit = k;
  if (k > bufEnd)
    if (((bytesRead = fs.readSync(fp, c, 0, 1, 1)) !== 0) && (c[0] !== NEWLINE)) {
      loc = 0;
      errPrint("! Input line too long");
  }
  if ((bytesRead === 0) && (limit === 0)) return(false);  /* there was nothing after the last newline */
  return(true);
}
```

Now comes the problem of deciding which file to read from next. Recall that the actual text that JWEB should process comes from two streams: a `webFile`, which can contain possibly nested include commands `'@i'`, and a `changeFile`, which might also contain includes. The `webFile` together with the currently open include files form a stack `file`, whose names are stored in a parallel stack `fileName`. The boolean `changing` tells whether or not we're reading from the `changeFile`.

The line number of each open file is also kept for error reporting and for the benefit of JTANGLE.

```ts
@<Global_const...@>=
const MAX_FILE_NAME_LENGTH = 60;
const MAX_INCLUDE_DEPTH = 10; /* maximum number of source files open simultaneously, not counting the change file */
```

```ts
@<Global_var...@>=
let file: number[] = []; /* stack of non-change files */
let fileName: string[] = []; /* stack of non-change file names */
let changeFile = -1; /* change file */
let changeFileName: string; /* name of change file */
let changing: boolean; /* if the current line is from changeFile */
let changeLine: number; /* number of current line in change file */
let changeDepth: number; /* where @y originated during a change */
let altWebFileName: string; /* alternate name to try */
let line: number[] = []; /* number of current line in the stacked files */
let webFileOpen = false; /* if the web file is being read */
let includeDepth: number; /* current level of nesting */
```

When `changing === false`, the next line of `changeFile` is kept in `changeBuf`, for purposes of comparison with the next line of `file[includeDepth]`. After the change file has been completely input, we set `changeLimit = 0`, so that no further matches will be made.

Here's a shorthand expression for inequality between the two lines:

```ts
@<Lines_dont_match@>=
(changeLimit !== limit || buf.compare(changeBuf, 0, changeLimit, 0, limit) !== 0)
```

```ts
@<Global_const...@>=
const changeBuf = Buffer.alloc(BUF_SIZE, 0, 'utf8'); /* next line of `changeFile` */
```

```ts
@<Global_var...@>=
let changeLimit: number; /* points to the last character in `changeBuf` */
```

Procedure `primeTheChangeBuffer` sets `changeBuf` in preparation for the next matching operation. Since blank lines in the change file are not used for matching, we have `(changeLimit === 0 && !changing)` if and only if the change file is exhausted. This procedure is called only when `changing` is true; hence error messages will be reported correctly.

```ts
@c
function primeTheChangeBuffer()
{
  changeLimit = 0; /* this value is used if the change file ends */
  @<Skip_over_comment_lines_in_the_change_file;_return_if_end_of_file@>
  @<Skip_to_the_next_nonblank_line;_return_if_end_of_file@>
  @<Move_buffer_and_limit_to_changeLimit@>
}
```

While looking for a line that begins with `'@x'` in the change file, we allow lines that begin with `'@@'`, as long as they don't begin with `'@y'`, `'@z'`, or `'@i'` (which would probably mean that the change file is fouled up).

```ts
@<Skip_over_comment_lines_in_the_change_file...@>=
while (true) {
  changeLine++;
  if (!inputLn(changeFile)) return;
  if (limit < 2) continue;
  if (buf[0] !== AT) continue;
  if (xIsUpper(buf[1])) buf[1] = buf[1] + 32;
  if (buf[1] === 'x'.charCodeAt(0)) break;
  if (buf[1] === 'y'.charCodeAt(0) || buf[1] === 'z'.charCodeAt(0) || buf[1] === 'i'.charCodeAt(0)) {
    loc = 2;
    errPrint("! Missing @@x in change file");
  }
}
```

Here we are looking at lines following the `'@x'`.

```ts
@<Skip_to_the_next_nonblank_line...@>=
do {
  changeLine++;
  if (!inputLn(changeFile)) {
    errPrint("! Change file ended after @@x");
    return;
  }
} while (limit === 0);
```

```ts
@<Move_buffer_and_limit_to_changeLimit@>=
{
  changeLimit = limit;
  buf.copy(changeBuf, 0, 0, limit);
}
```

The following procedure is used to see if the next change entry should go into effect; it is called only when `changing` is 0. The idea is to test whether or not the current contents of `buf` matches the current contents of `changeBuf`. If not, there's nothing more to do; but if so, a change is called for: All of the text down to the `'@y'` is supposed to match. An error message is issued if any discrepancy is found. Then the procedure prepares to read the next line from `changeFile`.

When a match is found, the current section is marked as changed unless the first line after the `'@x'` and after the `'@y'` both start with either `'@*'` or `'@ '` (possibly preceded by whitespace).

This procedure is called only when `0 < limit`, i.e., when the current line is nonempty.

```ts
@c
function ifSectionStartMakePending(b: boolean) {
  buf[limit] = EXCLAMATION;
  for (loc = 0; xIsSpace(buf[loc]); loc++) ;
  buf[limit] = SPACE;
  if (buf[loc] === AT && (xIsSpace(buf[loc+1]) || buf[loc+1] === STAR)) changePending = b;
}
```

```ts
@c
function checkChange() /* switches to changeFile if the buffers match */
{
  let n = 0; /* the number of discrepancies found */
  if @<Lines_dont_match@> return;
  changePending = false;
  if (!changedSection[sectionCount]) {
    ifSectionStartMakePending(true);
    if (!changePending) changedSection[sectionCount] = true;
  }
  while (true) {
    changing = true;
    printWhere = true;
    changeLine++;
    if (!inputLn(changeFile)) {
      errPrint("! Change file ended before @@y");
      changeLimit = 0;
      changing = false;
      return;
    }
    if (limit > 1 && buf[0] === AT) {
      const xyz_code = xIsUpper(buf[1]) ? buf[1] + 32: buf[1];
      @<If_the_current_line_starts_with_@@y,_report_any_discrepancies_and_return@>
    }
    @<Move_buffer_and_limit...@>
    changing = false;
    line[includeDepth]++;
    while (!inputLn(file[includeDepth])) { /* pop the stack or quit */
      if (includeDepth === 0) {
        errPrint("! JWEB file ended during a change");
        inputHasEnded = true;
        return;
      }
      includeDepth--;
      line[includeDepth]++;
    }
    if @<Lines_dont_match@> n++;
  }
}
```

```ts
@<If_the_current_line_starts_with_@@y...@>=
if (xyz_code === 'x'.charCodeAt(0) || xyz_code === 'z'.charCodeAt(0)) {
  loc=2;
  errPrint("! Where is the matching @@y?");
} else if (xyz_code === 'y'.charCodeAt(0)) {
  if (n > 0) {
    loc = 2;
    log('! Hmm... ' + n.toString() + ' ');
    errPrint("of the preceding lines failed to match");
  }
  changeDepth = includeDepth;
  return;
}
```

The `resetInput` procedure, which gets JWEB ready to read the user's JWEB input, is used at the beginning of phase one of JTANGLE.

```ts
@<Global_var...@>=
let inputHasEnded: boolean; /* if there is no more input */
```

```ts
@c
function resetInput()
{
  limit = 0;
  loc = 1;
  buf[0] = SPACE;
  @<Open_input_files@>
  includeDepth = 0;
  line[includeDepth] = 0;
  changeLine = 0;
  changeDepth = includeDepth;
  changing = true;
  primeTheChangeBuffer();
  changing = !changing;
  limit = 0;
  loc = 1;
  buf[0] = SPACE;
  inputHasEnded = false;
}
```

The following code opens the input files.

```ts
@<Open_input_files@>=
if ((file[0] = fs.openSync(fileName[0], 'r')) === -1) {
  fileName[0] = altWebFileName;
  if ((file[0] = fs.openSync(fileName[0], 'r')) === -1)
       fatal('! Cannot open input file ', fileName[0]);
}
webFileOpen = true;

if (changeFileName !== '') 
  if ((changeFile = fs.openSync(changeFileName, 'r')) === -1)
    fatal('! Cannot open change file ', changeFileName);
```

The `getLine` procedure is called when `loc > limit`; it puts the next line of merged input into the buf and updates the other variables appropriately. A space is placed at the right end of the line. This procedure returns `!inputHasEnded` because we often want to check the value of that variable after calling the procedure.

If we've just changed from the `file[includeDepth]` to the `changeFile`, or if the `file[includeDepth]` has changed, we tell JTANGLE to print this information in the source file by means of the `printWhere` flag.

```ts
@<Global_var...@>=
let changedSection: boolean[] = []; /* is the section changed? */
let changePending: boolean; /* if the current change is not yet recorded in changedSection[sectionCount] */
let printWhere = false; /* should JTANGLE print line and file info? */
```

```ts
@c
/* inputs the next line */
function getLine(): boolean
{
  while (true) {
    if (changeFile >= 0 && changing && includeDepth === changeDepth)
      @<Read_from_change_file_and_maybe_turn_off_changing@>;
    if (!changing || includeDepth > changeDepth) {
      @<Read_from_cur_file_and_maybe_turn_on_changing@>;
      if (changeFile >= 0 && changing && includeDepth === changeDepth) continue;
    }
    if (inputHasEnded) return false;
    loc = 0;
    buf[limit] = SPACE;
    if (buf[0] === AT && (buf[1] === 'i'.charCodeAt(0) || buf[1] === 'I'.charCodeAt(0))) {
      loc = 2;
      buf[limit] = DOUBLEQUOTE;
      while (buf[loc] === SPACE|| buf[loc] === TAB) loc++;
      if (loc >= limit) {
        errPrint("! Include file name not given");
        continue;
      }
      if (includeDepth >= MAX_INCLUDE_DEPTH-1) {
        errPrint("! Too many nested includes");
        continue;
      }
      includeDepth++; /* push input stack */
      @<Try_to_open_include_file,_abort_push_if_unsuccessful,_go_to_restart@>
    }
    return true;
  }
}
```

When an `'@i'` line is found in the `file[includeDepth]`, we must temporarily stop reading it and start reading from the named include file. The `'@i'` line should give a complete file name with or without double quotes. If the environment variable JWEBINPUTS is set, or if the compiler flag of the same name was defined at compile time, JWEB will look for include files in the directory thus named, if it cannot find them in the current directory. (Colon-separated paths are not supported.) The remainder of the `'@i'` line after the file name is ignored.

```ts
@<Include_file_too_long@>=
{
  includeDepth--;
  errPrint("! Include file name too long");
  continue;
}
```

```ts
@<Try_to_open_include_file...@>=
{
  let k = '';
  let l: number; /* length of file name */

  if (buf[loc] === DOUBLEQUOTE) {
    loc++;
    while (buf[loc] !== DOUBLEQUOTE && k.length < MAX_FILE_NAME_LENGTH) {
      k += buf[loc];
      loc++;
    }
    if (loc === limit) @<Include_file_too_long@> /* unmatched quote is `too long' */
  } else {
    while (buf[loc] !== SPACE && buf[loc] !== TAB && buf[loc] !== DOUBLEQUOTE && k.length <= MAX_FILE_NAME_LENGTH - 1) {
      k += buf[loc];
      loc++;
    }
  }

  if (k.length > MAX_FILE_NAME_LENGTH - 1) @<Include_file_too_long@>

  if ((file[includeDepth] = fs.openSync(fileName[includeDepth], 'r')) >= 0) {
    line[includeDepth] = 0;
    printWhere = true;
    continue; /* success */
  }

  const jwebInputs = process.env.JWEBINPUTS; /* where to look for the include file */
  
  if (jwebInputs !== undefined) {
    if ((l = jwebInputs.length) > MAX_FILE_NAME_LENGTH - 2) @<Include_file_too_long@>
  } else {
    l = 0;
  }

  if (l > 0) {
    if (l + k.length + 3 >= MAX_FILE_NAME_LENGTH) @<Include_file_too_long@>
    fileName[includeDepth] = path.join(jwebInputs !== undefined ? jwebInputs : '', k);
    if ((file[includeDepth] = fs.openSync(fileName[includeDepth], 'r')) >= 0) {
      line[includeDepth] = 0;
      printWhere = true;
      continue; /* success */
    }
  }

  includeDepth--;
  errPrint("! Cannot open include file");
  continue;
}
```

```ts
@<Read_from_cur_file...@>=
{
  line[includeDepth]++;
  while (!inputLn(file[includeDepth])) { /* pop the stack or quit */
    printWhere = true;
    if (includeDepth === 0) {
      inputHasEnded = true;
      break;
    } else {
      fs.closeSync(file[includeDepth]);
      includeDepth--;
      if (changing && includeDepth === changeDepth) break;
      line[includeDepth]++;
    }
  }
  if (!changing && !inputHasEnded)
   if (limit === changeLimit)
    if (buf[0] === changeBuf[0])
      if (changeLimit > 0) checkChange();
}
```

```ts
@<Read_from_change_file...@>=
{
  changeLine++;
  if (!inputLn(changeFile)) {
    errPrint("! Change file ended without @@z");
    buf[0]= AT;
    buf[1]='z'.charCodeAt(0);
    limit = 2;
  }
  if (limit > 0) { /* check if the change has ended */
    if (changePending) {
      ifSectionStartMakePending(false);
      if (changePending) {
        changedSection[sectionCount] = true;
        changePending = false;
      }
    }
    buf[limit] = SPACE;
    if (buf[0] === AT) {
      if (xIsUpper(buf[1])) buf[1] = buf[1] + 32;
      if (buf[1] === 'x'.charCodeAt(0) || buf[1] === 'y'.charCodeAt(0)) {
        loc = 2;
        errPrint("! Where is the matching @@z?");
      }
      else if (buf[1] === 'z'.charCodeAt(0)) {
        primeTheChangeBuffer();
        changing = !changing;
        printWhere = true;
      }
    }
  }
}
```

At the end of the program, we will tell the user if the change file had a line that didn't match any relevant line in `file[0]`.

```ts
@c
function checkComplete(){
  if (changeLimit !== 0) { /* changing is false */
    changeBuf.copy(buf, 0, 0, changeLimit + 1);
    limit = changeLimit;
    changing = true;
    changeDepth = includeDepth;
    loc = 0;
    errPrint("! Change file entry did not match");
  }
}
```

## Reporting errors to the user

A global variable called `runHistory` will contain one of four values at the end of every run: `SPOTLESS` means that no unusual messages were printed; `HARMLESS_MESSAGE` means that a message of possible interest was printed but no serious errors were detected; `ERROR_MESSAGE` means that at least one error was found; `FATAL_MESSAGE` means that the program terminated abnormally. The value of `runHistory` does not influence the behavior of the program; it is simply computed for the convenience of systems that might want to use such information.

```ts
@<Global_const...@>=
const SPOTLESS = 0; /* runHistory value for normal jobs */
const HARMLESS_MESSAGE = 1; /* runHistory value when non-serious info was printed */
const ERROR_MESSAGE = 2; /* runHistory value when an error was noted */
const FATAL_MESSAGE = 3; /* runHistory value when we had to stop prematurely */
```

```ts
@<Mark_harmless@>=
if (runHistory === SPOTLESS) runHistory = HARMLESS_MESSAGE
```

```ts
@<Mark_error@>=
runHistory = ERROR_MESSAGE
```

```ts
@<Global_var...@>=
let runHistory = SPOTLESS; /* indicates how bad this run was */
```

The command '`errPrint("! Error message")`' will report a syntax error to the user, by printing the error message at the beginning of a new line and then giving an indication of where the error was spotted in the source file. Note that no period follows the error message, since the error routine will automatically supply a period. A newline is automatically supplied if the string begins with `"!"`.

```ts
@c
/* prints `\..' and location of error message */
function errPrint(s: string)
{
  let k: number, l: number; /* pointers into buf */
  log(s.charCodeAt(0) === EXCLAMATION ? '\n' + s : s)
  if (webFileOpen) @<Print_error_location_based_on_input_buffer@>
  @<Mark_error@>
}
```

The error locations can be indicated by using the global variables `loc`, `line[includeDepth]`, `fileName[includeDepth]` and `changing`, which tell respectively the first unlooked-at position in `buf`, the current line number, the current file, and whether the current line is from `changeFile` or `file[includeDepth]`. This routine should be modified on systems whose standard text editor has special line-numbering conventions.

```ts
@<Print_error_location_based_on_input_buffer@>=
{
  if (changing && includeDepth === changeDepth)
    log('. (l. ' + changeLine.toString() + ' of change file)\n')
  else if (includeDepth === 0)
    log('. (l. ' + line[includeDepth].toString() + ' )\n')
  else
    log('. (l. ' + line[includeDepth].toString() + ' of include file ' + fileName[includeDepth].toString + ')\n');

  l = (loc >= limit ? limit: loc);

  let tempStr = '';
  if (l > 0) {
    for (k = 0; k < l; k++)
      if (buf[k] === TAB)
        tempStr += String.fromCharCode(SPACE);
      else
        tempStr +=  buf[k]; /* print the characters already read */
    log(tempStr);
    tempStr = '';
    for (k = 0; k < l ; k++) tempStr += String.fromCharCode(SPACE); /* space out the next line */
  }

  for (k = l; k < limit; k++) tempStr += buf[k]; /* print the part not yet read */

  if (buf[limit] === VBAR) tempStr += VBAR; /* end of source text in section names */
  tempStr += String.fromCharCode(SPACE); /* to separate the message from future asterisks */
  log(tempStr);  
}
```

When no recovery from some error has been provided, we have to wrap up and quit as graciously as possible.  This is done by calling the function `wrapUp` at the end of the code.

Some implementations may wish to pass the `runHistory` value to the operating system so that it can be used to govern whether or not other programs are started. Here, for instance, we pass the operating system a status of 0 if and only if only harmless messages were printed.

```ts
@c
function wrapUp(): number
{
  if (flags[FLAG.s])
    printStats(); /* print statistics about memory usage */

  @<Print_the_job_history@>

  if (runHistory > HARMLESS_MESSAGE)
    return(1)
  else
    return(0);
}
```

```ts
@<Print_the_job_history@>=
switch (runHistory) {
  case SPOTLESS:
    if (flags[FLAG.h])
      log('(No errors were found.)\n');
    break;
case HARMLESS_MESSAGE:
  log('(Did you see the warning message above?)\n');
  break;
case ERROR_MESSAGE:
  log('(Pardon me, but I think I spotted something wrong.)\n'); break;
case FATAL_MESSAGE:
  log('(That was a fatal error, my friend.)\n');
} /* there are no other cases */
```

When there is no way to recover from an error, the `fatal` subroutine is invoked. This happens most often when `overflow` occurs.

The two parameters to `fatal` are strings that are essentially concatenated to print the final error message.

```ts
@c
function fatal(s: string, t: string)
{
  if (s !== '') log(s);
  if (t !== '') errPrint(t);
  runHistory = FATAL_MESSAGE;
  process.exitCode = wrapUp();
  throw 'Fatal Error: exiting...';
}
```

An overflow stop occurs if JWEB's tables aren't large enough.

```ts
@c
function overflow(t: string)
{
  log('\n! Sorry, ' + t + ' capacity exceeded');
  fatal('', '');
}
```

Sometimes the program's behavior is far different from what it should be, and JWEB prints an error message that is really for the JWEB maintenance person, not the user. In such cases the program says `confusion("indication of where we are")`.

```ts
@c
function confusion(s: string)
{
  fatal("! This can't happen: ", s)
}
```

## Command line arguments

The user calls JTANGLE with arguments on the command line. These are either file names or flags to be turned off (beginning with `"-"`) or flags to be turned on (beginning with `"+"`). The following globals are for communicating the user's desires to the rest of the program. The various file name variables contain strings with the names of those files. Most of the 128 flags are undefined but available for future extensions.

```ts
@<Global_var...@>=
let flags: boolean[] = []; /* an option for each 7-bit code */
```

```ts
@<Global_const...@>=
enum FLAG {
  b = 'b'.charCodeAt(0), /* should the banner line be printed? */
  p = 'p'.charCodeAt(0), /* should progress reports be printed? */
  s = 's'.charCodeAt(0), /* should statistics be printed at end of run? */
  h = 'h'.charCodeAt(0) /* should lack of errors be announced? */
}
```

The `flags` will be initially `false`. Some of them are set to `true` before scanning the arguments; if additional flags are `true` by default they should be set before calling `common_init`.

```ts
@<Set_the_default_options@>=
for (let i = 0; i < flags.length; i++) flags[i] = false;
flags[FLAG.b] = flags[FLAG.h] = flags[FLAG.p] = true;
```

We now must look at the command line arguments and set the file names accordingly. At least one file name must be present: the JWEB file. It may have an extension, or it may omit the extension to get `".w"` or `".web"` added. The output file name is formed by replacing the extension by outputLanguage, after removing the directory name (if any).

If there is a second file name present among the arguments, it is the change file, again either with an extension or without one to get `".ch"`. An omitted change file argument means that `"/dev/null"` should be used, when no changes are desired.

If there's a third file name, it will be the output file.

```ts
@<Global_var...@>=
let isCLanguage: boolean;
```

```ts
@<Scan_arguments_and_open_output_files@>=
scanArgs(argv);
if ((outputFile = fs.openSync(outputFileName, 'w')) === -1)
  fatal('! Cannot open output file ', outputFileName);
```

```ts
@c
function scanArgs(argv: string[])
{
  if (argv === [])
    fatal('! No command line arguments provided.', '');
  let argc = argv.length;
  let argPos = -1;
  let dotPos: number; /* position of DOT in the argument */
  let processedWebFile = false;
  let processedChangeFile = false;
  let processedOutFile = false;
  let processedLang = false;
  let flagChange: boolean;
  let i: number;

  while (--argc >= 0) {
    argPos++;
    if ((argv[argPos].length > 1) && (argv[argPos].charCodeAt(0) === MINUS || argv[argPos].charCodeAt(0) === PLUS))
      @<Handle_flag_argument@>
    else {
      dotPos = 0;
      for (i = 0; i < argv[argPos].length; i++) {
        if (argv[argPos].charCodeAt(i) === DOT) {
          dotPos = i + 1
        }
        else if (argv[argPos].charCodeAt(i) === SLASH) {
          dotPos = 0;
        }
      }    
      if (!processedWebFile)
        @<Make_web_file_name@>
      else if (!processedChangeFile)
        @<Make_change_file_name@>
      else if (!processedLang)
        @<Get_output_language@>
      else if (!processedOutFile)
        @<Make_out_file_name@>
      else
        @<Print_usage_error_message_and_quit@>
    }
  }
  if (!processedWebFile)
    @<Print_usage_error_message_and_quit@>

  if (flags[FLAG.b]) { log(BANNER) }; /* print a banner line */

  log('Web file name: ' + fileName[0]);
  log('Alt web file name: ' + altWebFileName);
  log('Change file name: ' + changeFileName);
  log('Output file name: ' + outputFileName);
  log('Output language: ' + outputLanguage);
}
```

We use all of `argv` for the `webFileName` if there is a `DOT` in it, otherwise we add `".w"`. If this file can't be opened, we prepare an `altWebFileName` by adding `"web"` after the dot. The other file names come from adding other things after the dot. We must check that there is enough room in `webFileName` and the other arrays for the argument.

```ts
@<Make_web_file...@>=
{
  if (i > MAX_FILE_NAME_LENGTH - 5)
    @<Complain_about_argument_length@>

  if (dotPos === 0) {
    fileName[0] = argv[argPos] + '.w'
    altWebFileName = argv[argPos] + '.web';
  } else {
    fileName[0] = argv[argPos];
  }

  processedWebFile = true;
}
```

```ts
@<Make_change_file...@>=
{
  if (argv[argPos].charCodeAt(0) !== MINUS) {
    if (i > MAX_FILE_NAME_LENGTH - 4)
      @<Complain_about_argument_length@>

    if (dotPos === 0)
      changeFileName = argv[argPos] + '.ch'
    else
      changeFileName = argv[argPos];  
  }
  
  processedChangeFile = true;
}
```

```ts
@<Get_output_lang...@>=
{
  if (i > MAX_FILE_NAME_LENGTH - 5)
    @<Complain_about_argument_length@>

  outputLanguage = argv[argPos];

  isCLanguage = (outputLanguage === 'c' || outputLanguage === 'cc' || outputLanguage === 'cpp' || outputLanguage === 'c++' || outputLanguage === 'cp' || outputLanguage === 'cxx');

  processedLang = true;
}
```

```ts
@<Make_out_file...@>=
{
  if (i > MAX_FILE_NAME_LENGTH - 5)
    @<Complain_about_argument_length@>

  if (dotPos === 0) {
    outputFileName = argv[argPos] + '.' + outputLanguage;
  } else {
    outputFileName = argv[argPos];
  }

  processedOutFile = true;
}
```

```ts
@<Handle_flag...@>=
{
  flagChange = !(argv[argPos].charCodeAt(0) === MINUS);
  for (dotPos = 1; dotPos < argv[argPos].length; dotPos++)
    flags[argv[argPos].charCodeAt(dotPos)] = flagChange;
}
```

```ts
@<Print_usage_error_message_and_quit@>=
{
  fatal('! Usage: jtangle(args[, logFunc])\n','');
}
```

```ts
@<Complain_about_arg...@>=
fatal('! Filename too long\n', argv[argPos]);
```

## Output

Here is the code that opens the output file.

```ts
@<Global_var...@>=
let outputFile: number; /* where output of JTANGLE goes */
let outputFileName: string; /* name of outputFile */
let outputLanguage: string; /* the abbreviated language string. Appended to outputFileName. */
```

```ts
@c
function putChar(cc: number) {
  fs.writeSync(outputFile, String.fromCharCode(cc));
}

function putString(s: string) {
  fs.writeSync(outputFile, s);
}
```

```ts
@<Print_debug...@>=
{
  log('Strings: ' + JSON.stringify(stringMem));
  log('Names: ' + JSON.stringify(nameDir));
  log('Tokens: ' + JSON.stringify(tokMem));
  log('Texts: ' + JSON.stringify(texts));
}
```

```ts
@<Set_initial...@>=
stringMem = [];
nameDir = [];
hash = [];
tokMem  = [];

texts = [];
texts.push(
  { tokStart: 0,
    textLink: 0
  }
);
texts.push(
  { tokStart: 0,
    textLink: 0
  }
);

lastUnnamed = 0;
curState = {
  name: 0,
  repl: 0,
  byte: 0,
  end: 0,
  section: 0
};
stack = [];
stackIndex = 0;
curVal = 0;
outState = NORMAL;
protect = false;
sectionFiles = [];
curSectionFile = MAX_FILES;
endSectionFiles = MAX_FILES;
aSectionFile = 0;
curSectionNameChar = 0;
sectionFileName = '';
sectionText[0] = SPACE;
outputDefsSeen = false;

translit = [];
for (let i = 0; i < 128; i++) 
  translit[i] = 'X' + (128 + i).toString(16).padStart(2, '0').toUpperCase();

ccode = [];
for (let c = 0; c < 256; c++) ccode[c] = IGNORE;
ccode[SPACE] =
ccode[TAB] =
ccode[NEWLINE] =
ccode[VTAB] =
ccode[RETURN] =
ccode[FORMFEED] =
ccode[STAR] = NEW_SECTION;
ccode[AT]= AT;
ccode[EQUALS] = STR;
ccode['d'.charCodeAt(0)] = 
ccode['D'.charCodeAt(0)] = DEFINITION;
ccode['f'.charCodeAt(0)] =
ccode['F'.charCodeAt(0)] =
ccode['s'.charCodeAt(0)] =
ccode['S'.charCodeAt(0)] = FORMAT_CODE;
ccode['c'.charCodeAt(0)] =
ccode['C'.charCodeAt(0)] =
ccode['p'.charCodeAt(0)] =
ccode['P'.charCodeAt(0)] = BEGIN_C;
ccode[CARET] =
ccode[COLON] =
ccode[DOT] =
ccode['t'.charCodeAt(0)] =
ccode['T'.charCodeAt(0)] =
ccode['q'.charCodeAt(0)] =
ccode['Q'.charCodeAt(0)] = CONTROL_TEXT;
ccode['h'.charCodeAt(0)] =
ccode['H'.charCodeAt(0)] = OUTPUT_DEFS_CODE;
ccode['l'.charCodeAt(0)] =
ccode['L'.charCodeAt(0)] = TRANSLIT_CODE;
ccode[AMPERSAND] = JOIN;
ccode[LESSTHAN] =
ccode[LEFTPAREN] = SECTION_NAME;
ccode[SINGLEQUOTE]= ORD;

commentContinues = false;
curSectionName = 0;
noWhere = false;
idFirst = 0;
idLoc = 0;
curText = 0;
nextControl = 0;
sectionCount = 0;
bytesRead = -1;
limit = 0;
loc = 0;
file = [];
fileName = [];
changeFile = -1;
changeFileName = '';
changing = false;
changeLine = 0;
changeDepth = 0;
altWebFileName = '';
line = [];
webFileOpen = false;
includeDepth = 0;
changeLimit = 0;
inputHasEnded = false;
changedSection = [];
changePending = false;
printWhere = false;
runHistory = SPOTLESS;
flags = [];
outputFile = 0;
outputFileName = '';
outputLanguage = '';
isCLanguage = false;
```
