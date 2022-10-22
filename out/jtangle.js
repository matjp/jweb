"use strict";
/*1:*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
/*2:*/
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/*:2*/
/*3:*/
const BANNER = "This is JTANGLE (Version 0.1.9)\n";
/*:3*/ /*4:*/
const AND_AND = 0o4;
const LT_LT = 0o20;
const GT_GT = 0o21;
const PLUS_PLUS = 0o13;
const MINUS_MINUS = 0o1;
const EQ_GT = 0o30;
const MINUS_GT = 0o31;
const NOT_EQ = 0o32;
const LT_EQ = 0o34;
const GT_EQ = 0o35;
const EQ_EQ = 0o36;
const OR_OR = 0o37;
const DOT_DOT_DOT = 0o16;
const COLON_COLON = 0o6;
const PERIOD_AST = 0o26;
const MINUS_GT_AST = 0o27;
/*:4*/ /*5:*/
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
const AT = '@'.charCodeAt(0);
const BACKSLASH = '\\'.charCodeAt(0);
const CARET = '^'.charCodeAt(0);
const UNDERSCORE = '_'.charCodeAt(0);
const VBAR = '|'.charCodeAt(0);
/*:5*/ /*9:*/
const MAX_TEXTS = 2500;
const STACK_SIZE = 50;
/*:9*/ /*14:*/
const HASH_SIZE = 613;
const HASH_END = HASH_SIZE - 1;
/*:14*/ /*25:*/
const LESS = 0;
const EQUAL = 1;
const GREATER = 2;
const PREFIX = 3;
const EXTENSION = 4;
/*:25*/ /*33:*/
const BAD_EXTENSION = 5;
/*:33*/ /*39:*/
const SECTION_FLAG = MAX_TEXTS;
/*:39*/ /*41:*/
const STR = 0o2;
const JOIN = 0o177;
const OUTPUT_DEFS_FLAG = (2 * 0o24000 - 1);
/*:41*/ /*45:*/
const STACK_END = STACK_SIZE - 1;
/*:45*/ /*49:*/
const SECTION_NUMBER = 0o201;
const IDENTIFIER = 0o202;
/*:49*/ /*53:*/
const NORMAL = 0;
const NUM_OR_ID = 1;
const POST_SLASH = 2;
const UNBREAKABLE = 3;
const VERBATIM = 4;
/*:53*/ /*56:*/
const MAX_FILES = 256;
/*:56*/ /*66:*/
const TRANSLIT_LENGTH = 10;
/*:66*/ /*70:*/
const IGNORE = 0;
const ORD = 0o302;
const CONTROL_TEXT = 0o303;
const TRANSLIT_CODE = 0o304;
const OUTPUT_DEFS_CODE = 0o305;
const FORMAT_CODE = 0o306;
const DEFINITION = 0o307;
const BEGIN_C = 0o310;
const SECTION_NAME = 0o311;
const NEW_SECTION = 0o312;
/*:70*/ /*75:*/
const CONSTANT = 0o3;
/*:75*/ /*80:*/
const LONGEST_NAME = 1000;
const sectionText = Buffer.alloc(LONGEST_NAME, 0, 'utf8');
const sectionTextEnd = LONGEST_NAME;
/*:80*/ /*84:*/
const stringText = Buffer.alloc(LONGEST_NAME, 0, 'utf8');
const stringTextEnd = LONGEST_NAME;
/*:84*/ /*92:*/
const MACRO = 0;
/*:92*/ /*114:*/
const BUF_SIZE = 0o400;
const LONG_BUF_SIZE = (BUF_SIZE + LONGEST_NAME);
const buf = Buffer.alloc(LONG_BUF_SIZE, 0, 'utf8');
const bufEnd = BUF_SIZE - 1;
/*:114*/ /*117:*/
const MAX_FILE_NAME_LENGTH = 4096;
const MAX_INCLUDE_DEPTH = 10;
/*:117*/ /*120:*/
const changeBuf = Buffer.alloc(BUF_SIZE, 0, 'utf8');
/*:120*/ /*139:*/
const SPOTLESS = 0;
const HARMLESS_MESSAGE = 1;
const ERROR_MESSAGE = 2;
const FATAL_MESSAGE = 3;
/*:139*/ /*151:*/
var FLAG;
(function (FLAG) {
    FLAG[FLAG["b"] = 'b'.charCodeAt(0)] = "b";
    FLAG[FLAG["p"] = 'p'.charCodeAt(0)] = "p";
    FLAG[FLAG["s"] = 's'.charCodeAt(0)] = "s";
    FLAG[FLAG["h"] = 'h'.charCodeAt(0)] = "h";
    FLAG[FLAG["c"] = 'c'.charCodeAt(0)] = "c";
    FLAG[FLAG["n"] = 'n'.charCodeAt(0)] = "n";
})(FLAG || (FLAG = {}));
/*:43*/
/*7:*/
let log;
/*:7*/ /*10:*/
let stringMem;
let nameDir;
let hash;
/*:10*/ /*37:*/
let tokMem;
let texts;
/*:37*/ /*40:*/
let lastUnnamed;
/*:40*/ /*44:*/
let curState;
let stack;
let stackIndex;
/*:44*/ /*50:*/
let curVal;
/*:50*/ /*54:*/
let outState;
let protect;
/*:54*/ /*57:*/
let sectionFiles = [];
let curSectionFile;
let endSectionFiles;
let aSectionFile;
let curSectionNameChar;
let sectionFileName;
/*:57*/ /*62:*/
let outputDefsSeen = false;
/*:62*/ /*67:*/
let translit = [];
/*:67*/ /*71:*/
let ccode = [];
/*:71*/ /*73:*/
let commentContinues = false;
/*:73*/ /*76:*/
let curSectionName;
let noWhere;
/*:76*/ /*81:*/
let idFirst;
let idLoc;
/*:81*/ /*94:*/
let curText;
let nextControl;
/*:94*/ /*101:*/
let sectionCount;
/*:101*/ /*115:*/
let bytesRead = -1;
let limit = 0;
let loc = 0;
/*:115*/ /*118:*/
let file = [];
let fileName = [];
let changeFile = -1;
let changeFileName;
let changing;
let changeLine;
let changeDepth;
let altWebFileName;
let line = [];
let webFileOpen = false;
let includeDepth;
/*:118*/ /*121:*/
let changeLimit;
/*:121*/ /*129:*/
let inputHasEnded;
/*:129*/ /*132:*/
let changedSection = [];
let changePending;
let printWhere = false;
/*:132*/ /*142:*/
let runHistory = SPOTLESS;
/*:142*/ /*150:*/
let flags = [];
/*:150*/ /*153:*/
let isCLanguage;
/*:153*/ /*163:*/
let outputFile;
let outputFileName;
let outputLanguage;
/*:6*/ /*16:*/
function idLookup(str) {
    let i = 0;
    let h;
    const l = str.length;
    let p;
    /*17:*/
    h = str.charCodeAt(i);
    while (++i < l) {
        h = h + h + str.charCodeAt(i);
    }
    h = h % HASH_SIZE;
    /*:17*/
    /*18:*/
    p = hash[h];
    while (p !== 0 && !namesMatch(p, str)) {
        p = nameDir[p].lLink;
    }
    if (p === 0) {
        /*19:*/
        const s = stringMem.push(str) - 1;
        p = nameDir.push({
            stringIndex: s,
            lLink: 0,
            rLink: 0,
            shortestPrefixLength: 0,
            equiv: 0
        }) - 1;
        /*:19*/
        nameDir[p].lLink = hash[h];
        hash[h] = p;
    }
    /*:18*/
    return (p);
}
/*:16*/ /*22:*/
function setPrefixLength(p, l) {
    nameDir[p].shortestPrefixLength = l;
}
/*:22*/ /*23:*/
function getSectionName(p) {
    let s = stringMem[nameDir[p].stringIndex];
    const l = s.length;
    let q = p + 1;
    let n = '';
    while (p !== 0) {
        if (l > 1 && s.charCodeAt(l - 1) === SPACE) {
            n += s.substring(0, l - 1);
            p = nameDir[q].lLink;
            q = p;
        }
        else {
            n += s;
            p = 0;
            q = 0;
        }
        s = stringMem[nameDir[p].stringIndex];
    }
    if (q)
        n += '...';
    return n;
}
/*:23*/ /*24:*/
function getPrefixName(p) {
    const s = stringMem[nameDir[p].stringIndex];
    let sp = s.substring(0, nameDir[p].shortestPrefixLength);
    if (sp.length < s.length)
        sp += '...';
    return sp;
}
/*:24*/ /*26:*/
function webStrCmp(j, k) {
    let ji = 0;
    let ki = 0;
    while (ki < k.length && ji < j.length && j[ji] === k[ki]) {
        ki++;
        ji++;
    }
    if (ki === k.length) {
        if (ji === j.length) {
            return EQUAL;
        }
        else {
            return EXTENSION;
        }
    }
    else if (ji === j.length) {
        return PREFIX;
    }
    else if (j[ji] < k[ki]) {
        return LESS;
    }
    else {
        return GREATER;
    }
}
/*:26*/ /*27:*/
function addSectionName(parent, c, secName, isPrefix) {
    const p = nameDir.push({
        stringIndex: 0,
        lLink: 0,
        rLink: 0,
        shortestPrefixLength: 0,
        equiv: 0
    }) - 1;
    let s = secName;
    const nameLen = s.length;
    if (isPrefix) {
        s += String.fromCharCode(SPACE);
    }
    ;
    nameDir[p].stringIndex = stringMem.push(s) - 1;
    setPrefixLength(p, nameLen);
    return (parent === 0 ? (nameDir[0].rLink = p) :
        (c === LESS ? (nameDir[parent].lLink = p) :
            (nameDir[parent].rLink = p)));
}
/*:27*/ /*28:*/
function extendSectionName(p, extensionText, isPrefix) {
    let s = extensionText;
    if (isPrefix) {
        s += String.fromCharCode(SPACE);
    }
    let q = p + 1;
    while (nameDir[q].lLink !== 0) {
        q = nameDir[q].lLink;
    }
    nameDir[q].lLink = nameDir.push({
        stringIndex: stringMem.push(s) - 1,
        lLink: 0,
        rLink: 0,
        shortestPrefixLength: 0,
        equiv: 0
    }) - 1;
}
/*:28*/ /*29:*/
function sectionLookup(newName, isPrefix) {
    let c = 0;
    let p = nameDir[0].rLink;
    let q = 0;
    let r = 0;
    let parent = 0;
    /*30:*/
    while (p !== 0) {
        c = webStrCmp(newName, stringMem[nameDir[p].stringIndex].substring(0, nameDir[p].shortestPrefixLength));
        if (c === LESS || c === GREATER) {
            if (r === 0) {
                parent = p;
            }
            p = c === LESS ? nameDir[p].lLink : nameDir[p].rLink;
        }
        else {
            if (r !== 0) {
                log('! Ambiguous prefix: matches <' + getPrefixName(p) + '>\n and <' + getPrefixName(r) + '>');
                return 0;
            }
            r = p;
            p = nameDir[p].lLink;
            q = nameDir[r].rLink;
        }
        if (p === 0) {
            p = q;
            q = 0;
        }
    }
    /*:30*/
    /*31:*/
    if (r === 0) {
        return addSectionName(parent, c, newName, isPrefix);
    }
    /*:31*/
    /*32:*/
    switch (sectionNameCmp(newName, r)) {
        case PREFIX:
            if (!isPrefix) {
                log('\n! New name is a prefix of <' + getSectionName(r) + '>');
            }
            else if (newName.length < nameDir[r].shortestPrefixLength) {
                setPrefixLength(r, newName.length);
            }
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
        default:
            log('! Section name incompatible with <' + getPrefixName(r) + '>,\n which abbreviates <' + getSectionName(r) + '>');
            return r;
    }
    /*:32*/
}
/*:29*/ /*34:*/
function sectionNameCmp(name, r) {
    let q = r;
    let s;
    let c;
    let isPrefix;
    while (true) {
        s = stringMem[nameDir[q].stringIndex];
        q = r + 1;
        if (s[s.length - 1].charCodeAt(0) === SPACE) {
            isPrefix = true;
            q = nameDir[q].lLink;
        }
        else {
            isPrefix = false;
            q = 0;
        }
        switch (c = webStrCmp(name, s)) {
            case EQUAL:
                if (q === 0) {
                    if (isPrefix) {
                        return EXTENSION;
                    }
                    else {
                        return EQUAL;
                    }
                }
                else {
                    return (nameDir[q].stringIndex === nameDir[q + 1].stringIndex) ? EQUAL : PREFIX;
                }
            case EXTENSION:
                if (!isPrefix)
                    return BAD_EXTENSION;
                if (q !== 0)
                    continue;
                return EXTENSION;
            default:
                return c;
        }
    }
}
/*:34*/ /*38:*/
function namesMatch(p, name) {
    return (stringMem[nameDir[p].stringIndex] === name);
}
/*:38*/ /*42:*/
function storeTwoBytes(x) {
    tokMem.push(x >> 8);
    tokMem.push(x & 0o377);
}
/*:42*/ /*47:*/
function pushLevel(p) {
    if (stackIndex === STACK_END) {
        overflow('stack');
    }
    Object.assign(stack[stack.push({
        name: 0,
        repl: 0,
        byte: 0,
        end: 0,
        section: 0
    }) - 1], curState);
    stackIndex++;
    if (p !== -1) {
        curState = {
            name: p,
            repl: nameDir[p].equiv,
            byte: texts[nameDir[p].equiv].tokStart,
            end: texts[nameDir[p].equiv + 1].tokStart,
            section: 0
        };
    }
}
/*:47*/ /*48:*/
function popLevel(flag) {
    if (flag && texts[curState.repl].textLink < SECTION_FLAG) {
        curState.repl = texts[curState.repl].textLink;
        curState.byte = texts[curState.repl].tokStart;
        curState.end = curState.repl + 1 >= texts.length ? curState.byte : texts[curState.repl + 1].tokStart;
        return;
    }
    stackIndex--;
    if (stack.length > 0) {
        Object.assign(curState, stack.pop());
    }
}
/*:48*/ /*51:*/
function getOutput() {
    let a;
    let done = false;
    while (!done) {
        if (stackIndex === 0)
            return;
        if (curState.byte === curState.end) {
            curVal = -curState.section;
            popLevel(true);
            if (curVal === 0)
                continue;
            outChar(SECTION_NUMBER);
            return;
        }
        a = tokMem[curState.byte++];
        if (outState === VERBATIM && a !== STR && a !== CONSTANT && a !== NEWLINE) {
            putChar(a);
        }
        else if (a < 0o200) {
            outChar(a);
        }
        else {
            a = ((a - 0o200) * 0o400) + tokMem[curState.byte++];
            switch (Math.floor(a / 0o24000)) {
                case 0:
                    curVal = a;
                    outChar(IDENTIFIER);
                    done = true;
                    break;
                case 1:
                    if (a === OUTPUT_DEFS_FLAG) {
                        outputDefs();
                    }
                    else /*52:*/ {
                        a -= 0o24000;
                        if (nameDir[a].equiv !== 0) {
                            pushLevel(a);
                        }
                        else if (a !== 0) {
                            log('! Not present: <' + getSectionName(a) + '>');
                        }
                        continue;
                    }
                    /*:52*/
                    ;
                    done = true;
                    break;
                default:
                    curVal = a - 0o50000;
                    if (curVal > 0)
                        curState.section = curVal;
                    outChar(SECTION_NUMBER);
                    done = true;
            }
        }
    }
}
/*:51*/ /*55:*/
function flushBuffer() {
    putChar(NEWLINE);
    if (line[includeDepth] % 100 === 0 && flags[FLAG.p]) {
        if (line[includeDepth] % 500 === 0)
            log(line[includeDepth].toString());
    }
    line[includeDepth]++;
}
/*:55*/ /*59:*/
function phaseTwo() {
    if (flags[FLAG.s]) /*165:*/ {
        log('Strings: ' + JSON.stringify(stringMem));
        log('Names: ' + JSON.stringify(nameDir));
        log('Tokens: ' + JSON.stringify(tokMem));
        log('Texts: ' + JSON.stringify(texts));
    }
    /*:165*/
    ;
    webFileOpen = false;
    line[includeDepth] = 1;
    /*46:*/
    stackIndex = 1;
    curState = {
        name: 0,
        repl: texts[0].textLink,
        byte: texts[texts[0].textLink].tokStart,
        end: texts[texts[0].textLink + 1].tokStart,
        section: 0
    };
    /*:46*/
    /*61:*/
    if (!outputDefsSeen) {
        outputDefs();
    }
    /*:61*/
    if (texts[0].textLink === 0 && curSectionFile === endSectionFiles) {
        log('! No program text was specified.');
        /*140:*/
        if (runHistory === SPOTLESS)
            runHistory = HARMLESS_MESSAGE;
        /*:140*/
    }
    else {
        if (curSectionFile === endSectionFiles) {
            if (flags[FLAG.p]) {
                log('Writing the output file: (' + outputFileName + ')');
            }
        }
        else {
            if (flags[FLAG.p]) {
                log('Writing the output files: (' + outputFileName + ')');
            }
        }
        if (texts[0].textLink !== 0) {
            while (stackIndex > 0) {
                getOutput();
            }
            flushBuffer();
        }
        /*60:*/
        for (aSectionFile = endSectionFiles; aSectionFile > curSectionFile;) {
            aSectionFile--;
            sectionFileName = getSectionName(sectionFiles[aSectionFile]);
            fs_1.default.closeSync(outputFile);
            if ((outputFile = fs_1.default.openSync(sectionFileName, 'w')) === -1)
                fatal('! Cannot open output file ', sectionFileName);
            log('\n(' + sectionFileName + ')');
            line[includeDepth] = 1;
            stackIndex = 1;
            curState.name = sectionFiles[aSectionFile];
            curState.repl = nameDir[curState.name].equiv;
            curState.byte = texts[curState.repl].tokStart;
            curState.end = curState.repl + 1 >= texts.length ? curState.byte : texts[curState.repl + 1].tokStart;
            while (stackIndex > 0)
                getOutput();
            flushBuffer();
        }
        /*:60*/
        if (flags[FLAG.h])
            log('Done.');
    }
}
/*:59*/ /*63:*/
function outputDefs() {
    let a;
    pushLevel(-1);
    for (curText = 1; curText < texts.length - 1; curText++)
        if (texts[curText].textLink === 0) {
            curState.byte = texts[curText].tokStart;
            curState.end = curText + 1 === texts.length ? tokMem.length : texts[curText + 1].tokStart;
            if (isCLanguage)
                putString('#define ');
            outState = NORMAL;
            protect = isCLanguage;
            while (curState.byte < curState.end) {
                a = tokMem[curState.byte++];
                if (curState.byte === curState.end && a === NEWLINE) {
                    break;
                }
                if (outState === VERBATIM && a !== STR && a !== CONSTANT && a !== NEWLINE) {
                    putChar(a);
                }
                else if (a < 0o200) {
                    outChar(a);
                }
                else {
                    a = (a - 0o200) * 0o400 + tokMem[curState.byte++];
                    if (a < 0o24000) {
                        curVal = a;
                        outChar(IDENTIFIER);
                    }
                    else if (a < 0o50000) {
                        confusion("macro defs have strange char");
                    }
                    else {
                        curVal = a - 0o50000;
                        curState.section = curVal;
                        outChar(SECTION_NUMBER);
                    }
                }
            }
            protect = false;
            flushBuffer();
        }
    popLevel(false);
}
/*:63*/ /*64:*/
function outChar(curChar) {
    let j, k;
    let cc;
    let done = false;
    while (!done) {
        switch (curChar) {
            case NEWLINE:
                if (protect && outState !== VERBATIM)
                    putChar(SPACE);
                if (protect)
                    putChar(BACKSLASH);
                flushBuffer();
                if (outState !== VERBATIM)
                    outState = NORMAL;
                done = true;
                break;
            /*68:*/
            case IDENTIFIER:
                if (outState === NUM_OR_ID)
                    putChar(SPACE);
                j = 0;
                k = stringMem[nameDir[curVal].stringIndex].length;
                while (j < k) {
                    cc = stringMem[nameDir[curVal].stringIndex].charCodeAt(j);
                    if (cc < 0o200) {
                        putChar(cc);
                    }
                    else {
                        putString(translit[cc - 0o200]);
                    }
                    j++;
                }
                outState = NUM_OR_ID;
                done = true;
                break;
            /*:68*/
            /*69:*/
            case SECTION_NUMBER:
                if (curVal > 0) {
                    if (flags[FLAG.n])
                        putString('/*' + curVal.toString() + ':*/');
                }
                else if (curVal < 0) {
                    if (flags[FLAG.n])
                        putString('/*:' + -curVal.toString() + '*/');
                }
                else if (protect) {
                    curState.byte += 4;
                    curChar = NEWLINE;
                    break;
                }
                else {
                    let a;
                    a = 0o400 * tokMem[curState.byte++];
                    a += tokMem[curState.byte++];
                    if (isCLanguage)
                        putString('\n#line ' + a.toString() + ' "');
                    curVal = tokMem[curState.byte++];
                    curVal = 0o400 * (curVal - 0o200) + tokMem[curState.byte++];
                    let cc;
                    for (j = 0; j < stringMem[nameDir[curVal].stringIndex].length; j++) {
                        cc = stringMem[nameDir[curVal].stringIndex].charCodeAt(j);
                        if (isCLanguage) {
                            if (cc === BACKSLASH || cc === DOUBLEQUOTE)
                                putChar(BACKSLASH);
                            putChar(cc);
                        }
                    }
                    if (isCLanguage)
                        putString('"');
                    putString('\n');
                }
                done = true;
                break;
            /*:69*/
            /*65:*/
            case PLUS_PLUS:
                putChar(PLUS);
                putChar(PLUS);
                outState = NORMAL;
                done = true;
                break;
            case MINUS_MINUS:
                putChar(MINUS);
                putChar(MINUS);
                outState = NORMAL;
                done = true;
                break;
            case MINUS_GT:
                putChar(MINUS);
                putChar(GREATERTHAN);
                outState = NORMAL;
                done = true;
                break;
            case GT_GT:
                putChar(GREATERTHAN);
                putChar(GREATERTHAN);
                outState = NORMAL;
                done = true;
                break;
            case EQ_EQ:
                putChar(EQUALS);
                putChar(EQUALS);
                outState = NORMAL;
                done = true;
                break;
            case LT_LT:
                putChar(LESSTHAN);
                putChar(LESSTHAN);
                outState = NORMAL;
                done = true;
                break;
            case GT_EQ:
                putChar(GREATERTHAN);
                putChar(EQUALS);
                outState = NORMAL;
                done = true;
                break;
            case EQ_GT:
                putChar(EQUALS);
                putChar(GREATERTHAN);
                outState = NORMAL;
                done = true;
                break;
            case LT_EQ:
                putChar(LESSTHAN);
                putChar(EQUALS);
                outState = NORMAL;
                done = true;
                break;
            case NOT_EQ:
                putChar(EXCLAMATION);
                putChar(EQUALS);
                outState = NORMAL;
                done = true;
                break;
            case AND_AND:
                putChar(AMPERSAND);
                putChar(AMPERSAND);
                outState = NORMAL;
                done = true;
                break;
            case OR_OR:
                putChar(VBAR);
                putChar(VBAR);
                outState = NORMAL;
                done = true;
                break;
            case DOT_DOT_DOT:
                putChar(DOT);
                putChar(DOT);
                putChar(DOT);
                outState = NORMAL;
                done = true;
                break;
            case COLON_COLON:
                putChar(COLON);
                putChar(COLON);
                outState = NORMAL;
                done = true;
                break;
            case PERIOD_AST:
                putChar(DOT);
                putChar(STAR);
                outState = NORMAL;
                done = true;
                break;
            case MINUS_GT_AST:
                putChar(MINUS);
                putChar(GREATERTHAN);
                putChar(STAR);
                outState = NORMAL;
                done = true;
                break;
            /*:65*/
            case EQUALS:
            case GREATERTHAN:
                putChar(curChar);
                putChar(SPACE);
                outState = NORMAL;
                done = true;
                break;
            case JOIN:
                outState = UNBREAKABLE;
                done = true;
                break;
            case CONSTANT:
                if (outState === VERBATIM) {
                    outState = NUM_OR_ID;
                    done = true;
                    break;
                }
                if (outState === NUM_OR_ID)
                    putChar(SPACE);
                outState = VERBATIM;
                done = true;
                break;
            case STR:
                if (outState === VERBATIM)
                    outState = NORMAL;
                else
                    outState = VERBATIM;
                done = true;
                break;
            case SLASH:
                putChar(SLASH);
                outState = POST_SLASH;
                done = true;
                break;
            case STAR:
                if (outState === POST_SLASH)
                    putChar(SPACE);
            default:
                putChar(curChar);
                outState = NORMAL;
                done = true;
                break;
        }
    }
}
/*:64*/ /*72:*/
function skipAhead() {
    let cc;
    while (true) {
        if (loc > limit && !getLine())
            return (NEW_SECTION);
        buf[limit + 1] = AT;
        while (buf[loc] !== AT)
            loc++;
        if (loc <= limit) {
            loc++;
            cc = ccode[buf[loc]];
            loc++;
            if (cc !== IGNORE || buf[loc - 1] === GREATERTHAN)
                return (cc);
        }
    }
}
/*:72*/ /*74:*/
function readComment(skipComment, isLongComment) {
    let cc;
    while (true) {
        if (loc > limit) {
            if (isLongComment) {
                if (getLine()) {
                    commentContinues = true;
                    return;
                }
                else {
                    errPrint("! Input ended in mid-comment");
                    commentContinues = false;
                    return;
                }
            }
            else {
                commentContinues = false;
                return;
            }
        }
        cc = buf[loc++];
        if (!skipComment) {
            if (++idLoc <= stringTextEnd)
                stringText[idLoc] = cc;
        }
        if (isLongComment && cc === STAR && buf[loc] === SLASH) {
            if (!skipComment) {
                if (++idLoc <= stringTextEnd)
                    stringText[idLoc] = SLASH;
                idLoc++;
            }
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
            else
                loc++;
        }
    }
}
/*:74*/ /*77:*/
function isXAlpha(cc) {
    return (cc === UNDERSCORE || cc === DOLLAR);
}
function isHigh(cc) {
    return (cc > 0o177);
}
/*:77*/ /*78:*/
function getNext() {
    let preprocessing = false;
    let cc;
    let nc;
    while (true) {
        if (loc > limit) {
            if (preprocessing && buf[limit - 1] !== BACKSLASH)
                preprocessing = false;
            if (!getLine()) {
                return (NEW_SECTION);
            }
            else if (printWhere && !noWhere) {
                printWhere = false;
                /*96:*/
                {
                    let ni;
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
                /*:96*/
            }
            else
                return (NEWLINE);
        }
        cc = buf[loc];
        nc = buf[loc + 1];
        if (commentContinues || (cc === SLASH && (nc === STAR || nc === SLASH))) {
            if (flags[FLAG.c]) {
                if (cc === SLASH && (nc === STAR || nc === SLASH)) {
                    idLoc = 0;
                    idFirst = 1;
                }
                readComment(false, commentContinues || nc === STAR);
                if (commentContinues) {
                    if (++idLoc <= stringTextEnd)
                        stringText[idLoc] = NEWLINE;
                    return (NEWLINE);
                }
                else {
                    return (STR);
                }
            }
            else {
                readComment(true, commentContinues || nc === STAR);
                if (commentContinues) {
                    return (NEWLINE);
                }
                else {
                    continue;
                }
            }
        }
        const cNext = buf[++loc];
        if (xIsDigit(cc) || cc === DOT) 
        /*83:*/
        {
            idFirst = loc - 1;
            if (buf[idFirst] === DOT && !xIsDigit(buf[loc])) {
                /*79:*/
                switch (cc) {
                    case PLUS:
                        if (cNext === PLUS && loc++ <= limit)
                            return (PLUS_PLUS);
                        break;
                    case MINUS:
                        if (cNext === MINUS) {
                            if (loc++ <= limit)
                                return (MINUS_MINUS);
                        }
                        else if (cNext === GREATERTHAN) {
                            if (buf[loc + 1] === STAR) {
                                loc++;
                                if (loc++ <= limit)
                                    return (MINUS_GT_AST);
                            }
                            else if (loc++ <= limit)
                                return (MINUS_GT);
                        }
                        break;
                    case DOT:
                        if (cNext === STAR) {
                            if (loc++ <= limit)
                                return (PERIOD_AST);
                        }
                        else if (cNext === DOT && buf[loc + 1] === DOT) {
                            loc++;
                            if (loc++ <= limit)
                                return (DOT_DOT_DOT);
                        }
                        break;
                    case COLON:
                        if (cNext === COLON && loc++ <= limit)
                            return (COLON_COLON);
                        break;
                    case EQUALS:
                        if (cNext === EQUALS) {
                            if (loc++ <= limit)
                                return (EQ_EQ);
                        }
                        else if (cNext === GREATERTHAN && loc++ <= limit)
                            return (EQ_GT);
                        break;
                    case GREATERTHAN:
                        if (cNext === EQUALS) {
                            if (loc++ <= limit)
                                return (GT_EQ);
                        }
                        else if (cNext === GREATERTHAN && loc++ <= limit)
                            return (GT_GT);
                        break;
                    case LESSTHAN:
                        if (cNext === EQUALS) {
                            if (loc++ <= limit)
                                return (LT_EQ);
                        }
                        else if (cNext === LESSTHAN && loc++ <= limit)
                            return (LT_LT);
                        break;
                    case AMPERSAND:
                        if (cNext === AMPERSAND && loc++ <= limit)
                            return (AND_AND);
                        break;
                    case VBAR:
                        if (cNext === VBAR && loc++ <= limit)
                            return (OR_OR);
                        break;
                    case EXCLAMATION:
                        if (cNext === EQUALS && loc++ <= limit)
                            return (NOT_EQ);
                        break;
                }
                /*:79*/
                return (cc);
            }
            let foundBinConst = false;
            let foundHexConst = false;
            let foundOctConst = false;
            if (buf[idFirst] === '0'.charCodeAt(0)) {
                if (buf[loc] === 'b'.charCodeAt(0) || buf[loc] === 'B'.charCodeAt(0)) {
                    loc++;
                    while (xIsXDigit(buf[loc]))
                        loc++;
                    foundBinConst = true;
                }
                if (buf[loc] === 'x'.charCodeAt(0) || buf[loc] === 'X'.charCodeAt(0)) {
                    loc++;
                    while (xIsXDigit(buf[loc]))
                        loc++;
                    foundHexConst = true;
                }
                if (buf[loc] === 'o'.charCodeAt(0) || buf[loc] === 'O'.charCodeAt(0)) {
                    loc++;
                    while (xIsXDigit(buf[loc]))
                        loc++;
                    foundOctConst = true;
                }
            }
            if (!(foundBinConst || foundHexConst || foundOctConst)) {
                while (xIsDigit(buf[loc]))
                    loc++;
                if (buf[loc] === DOT) {
                    loc++;
                    while (xIsDigit(buf[loc]))
                        loc++;
                }
                if (buf[loc] === 'e'.charCodeAt(0) || buf[loc] === 'E'.charCodeAt(0)) {
                    if (buf[++loc] === PLUS || buf[loc] === MINUS)
                        loc++;
                    while (xIsDigit(buf[loc]))
                        loc++;
                }
            }
            while (buf[loc] === 'u'.charCodeAt(0) || buf[loc] === 'U'.charCodeAt(0) || buf[loc] === 'l'.charCodeAt(0) || buf[loc] === 'L'.charCodeAt(0) || buf[loc] === 'f'.charCodeAt(0) || buf[loc] === 'F'.charCodeAt(0))
                loc++;
            idLoc = loc;
            return (CONSTANT);
        }
        /*:83*/
        else if ((cc === SINGLEQUOTE || cc === DOUBLEQUOTE) || (cc === 'L'.charCodeAt(0) && (cNext === SINGLEQUOTE || cNext === DOUBLEQUOTE))) 
        /*85:*/
        {
            let delim = cc;
            idFirst = 1;
            idLoc = 0;
            stringText[++idLoc] = delim;
            if (delim === 'L'.charCodeAt(0)) {
                delim = buf[loc++];
                stringText[++idLoc] = delim;
            }
            while (true) {
                if (loc >= limit) {
                    if (buf[limit - 1] !== BACKSLASH) {
                        errPrint("! String didn't end");
                        loc = limit;
                        break;
                    }
                    if (!getLine()) {
                        errPrint("! Input ended in middle of string");
                        loc = 0;
                        break;
                    }
                    else if (++idLoc <= stringTextEnd)
                        stringText[idLoc] = NEWLINE;
                }
                if ((cc = buf[loc++]) === delim) {
                    if (++idLoc <= stringTextEnd)
                        stringText[idLoc] = cc;
                    break;
                }
                if (cc === BACKSLASH) {
                    if (loc >= limit)
                        continue;
                    if (++idLoc <= stringTextEnd)
                        stringText[idLoc] = BACKSLASH;
                    cc = buf[loc++];
                }
                if (++idLoc <= stringTextEnd)
                    stringText[idLoc] = cc;
            }
            if (idLoc >= stringTextEnd) {
                log('! String too long: ');
                log(stringText.toString('utf8', 1, 26));
                errPrint('...');
            }
            idLoc++;
            return (STR);
        }
        /*:85*/
        else if (isAlpha(cc) || isXAlpha(cc) || isHigh(cc)) 
        /*82:*/
        {
            idFirst = --loc;
            while (isAlpha(buf[++loc]) || isDigit(buf[loc]) || isXAlpha(buf[loc]) || isHigh(buf[loc]))
                ;
            idLoc = loc;
            return (IDENTIFIER);
        }
        /*:82*/
        else if (cc === AT) 
        /*86:*/
        {
            cc = ccode[buf[loc++]];
            switch (cc) {
                case IGNORE:
                    continue;
                case TRANSLIT_CODE:
                    errPrint("! Use @l in limbo only");
                    continue;
                case CONTROL_TEXT:
                    while ((cc = skipAhead()) === AT)
                        if (buf[loc - 1] !== GREATERTHAN)
                            errPrint("! Double @ should be used in control text");
                    continue;
                case SECTION_NAME:
                    curSectionNameChar = buf[loc - 1];
                    /*88:*/
                    {
                        let k;
                        /*89:*/
                        k = 0;
                        sectionText.fill(0, 1);
                        while (true) {
                            if (loc > limit && !getLine()) {
                                errPrint("! Input ended in section name");
                                loc = 1;
                                break;
                            }
                            cc = buf[loc];
                            /*90:*/
                            if (cc === AT) {
                                cc = buf[loc + 1];
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
                                loc++;
                            }
                            /*:90*/
                            loc++;
                            if (k < sectionTextEnd)
                                k++;
                            if (xIsSpace(cc)) {
                                cc = SPACE;
                                if (sectionText[k - 1] === SPACE)
                                    k--;
                            }
                            sectionText[k] = cc;
                        }
                        if (k >= sectionTextEnd) {
                            log('! Section name too long: ' + sectionText.toString('utf8', 1, 26) + ' ...');
                            /*140:*/
                            if (runHistory === SPOTLESS)
                                runHistory = HARMLESS_MESSAGE;
                            /*:140*/
                        }
                        if (sectionText[k] === SPACE && k > 0)
                            k--;
                        /*:89*/
                        if (k > 3 && sectionText.toString('utf8', 1, k + 1).endsWith('...'))
                            curSectionName = sectionLookup(sectionText.toString('utf8', 1, k - 2), true);
                        else
                            curSectionName = sectionLookup(sectionText.toString('utf8', 1, k + 1), false);
                        if (curSectionNameChar === LEFTPAREN) 
                        /*58:*/
                        {
                            for (aSectionFile = curSectionFile; aSectionFile < endSectionFiles; aSectionFile++)
                                if (sectionFiles[aSectionFile] === curSectionName) {
                                    break;
                                }
                            if (aSectionFile === endSectionFiles) {
                                if (curSectionFile > 0) {
                                    sectionFiles[--curSectionFile] = curSectionName;
                                }
                                else {
                                    overflow('output files');
                                }
                            }
                        }
                        /*:58*/
                        return (SECTION_NAME);
                    }
                /*:88*/
                case STR:
                    /*91:*/
                    {
                        idFirst = loc++;
                        buf[limit + 1] = AT;
                        buf[limit + 2] = GREATERTHAN;
                        while (buf[loc] !== AT || buf[loc + 1] !== GREATERTHAN)
                            loc++;
                        if (loc >= limit)
                            errPrint("! Verbatim string didn't end");
                        idLoc = loc;
                        loc += 2;
                        return (STR);
                    }
                /*:91*/
                case ORD:
                    /*87:*/
                    idFirst = loc;
                    if (buf[loc] === BACKSLASH) {
                        if (buf[++loc] === SINGLEQUOTE)
                            loc++;
                    }
                    while (buf[loc] !== SINGLEQUOTE) {
                        if (buf[loc] === AT) {
                            if (buf[loc + 1] !== AT)
                                errPrint("! Double @ should be used in ASCII constant");
                            else
                                loc++;
                        }
                        loc++;
                        if (loc > limit) {
                            errPrint("! String didn't end");
                            loc = limit - 1;
                            break;
                        }
                    }
                    loc++;
                    return (ORD);
                /*:87*/
                default:
                    return (cc);
            }
        }
        /*:86*/
        else if (xIsSpace(cc)) {
            if (!preprocessing || loc > limit)
                continue;
            else
                return (SPACE);
        }
        else if (cc === HASHTAG && loc === 1) {
            preprocessing = true;
        }
        /*79:*/
        switch (cc) {
            case PLUS:
                if (cNext === PLUS && loc++ <= limit)
                    return (PLUS_PLUS);
                break;
            case MINUS:
                if (cNext === MINUS) {
                    if (loc++ <= limit)
                        return (MINUS_MINUS);
                }
                else if (cNext === GREATERTHAN) {
                    if (buf[loc + 1] === STAR) {
                        loc++;
                        if (loc++ <= limit)
                            return (MINUS_GT_AST);
                    }
                    else if (loc++ <= limit)
                        return (MINUS_GT);
                }
                break;
            case DOT:
                if (cNext === STAR) {
                    if (loc++ <= limit)
                        return (PERIOD_AST);
                }
                else if (cNext === DOT && buf[loc + 1] === DOT) {
                    loc++;
                    if (loc++ <= limit)
                        return (DOT_DOT_DOT);
                }
                break;
            case COLON:
                if (cNext === COLON && loc++ <= limit)
                    return (COLON_COLON);
                break;
            case EQUALS:
                if (cNext === EQUALS) {
                    if (loc++ <= limit)
                        return (EQ_EQ);
                }
                else if (cNext === GREATERTHAN && loc++ <= limit)
                    return (EQ_GT);
                break;
            case GREATERTHAN:
                if (cNext === EQUALS) {
                    if (loc++ <= limit)
                        return (GT_EQ);
                }
                else if (cNext === GREATERTHAN && loc++ <= limit)
                    return (GT_GT);
                break;
            case LESSTHAN:
                if (cNext === EQUALS) {
                    if (loc++ <= limit)
                        return (LT_EQ);
                }
                else if (cNext === LESSTHAN && loc++ <= limit)
                    return (LT_LT);
                break;
            case AMPERSAND:
                if (cNext === AMPERSAND && loc++ <= limit)
                    return (AND_AND);
                break;
            case VBAR:
                if (cNext === VBAR && loc++ <= limit)
                    return (OR_OR);
                break;
            case EXCLAMATION:
                if (cNext === EQUALS && loc++ <= limit)
                    return (NOT_EQ);
                break;
        }
        /*:79*/
        return (cc);
    }
}
/*:78*/ /*93:*/
function appRepl(tok) {
    tokMem.push(tok);
}
/*:93*/ /*95:*/
function scanRepl(t) {
    let a = 0;
    if (t === SECTION_NAME) /*96:*/ {
        let ni;
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
    /*:96*/
    let done = false;
    while (!done)
        switch (a = getNext()) {
            /*97:*/
            case IDENTIFIER:
                a = idLookup(buf.toString('utf8', idFirst, idLoc));
                appRepl(Math.floor(a / 0o400) + 0o200);
                appRepl(a % 0o400);
                break;
            case SECTION_NAME:
                if (t !== SECTION_NAME) {
                    done = true;
                    break;
                }
                else {
                    /*98:*/
                    {
                        let try_loc = loc;
                        while (buf[try_loc] === SPACE && try_loc < limit)
                            try_loc++;
                        if (buf[try_loc] === PLUS && try_loc < limit)
                            try_loc++;
                        while (buf[try_loc] === SPACE && try_loc < limit)
                            try_loc++;
                        if (buf[try_loc] === EQUALS)
                            errPrint("! Missing @ before a named section");
                    }
                    /*:98*/
                    a = curSectionName;
                    appRepl(Math.floor(a / 0o400) + 0o250);
                    appRepl(a % 0o400);
                    /*96:*/
                    {
                        let ni;
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
                    /*:96*/
                    break;
                }
            case OUTPUT_DEFS_CODE:
                if (t !== SECTION_NAME) {
                    errPrint("! Misplaced @h");
                }
                else {
                    outputDefsSeen = true;
                    a = OUTPUT_DEFS_FLAG;
                    appRepl(Math.floor(a / 0o400) + 0o200);
                    appRepl(a % 0o400);
                    /*96:*/
                    {
                        let ni;
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
                    /*:96*/
                }
                break;
            case CONSTANT:
            case STR:
                /*99:*/
                appRepl(a);
                switch (a) {
                    case STR:
                        while (idFirst < idLoc) {
                            if (stringText[idFirst] === AT) {
                                if (stringText[idFirst + 1] === AT)
                                    idFirst++;
                                else
                                    errPrint("! Double @ should be used in string");
                            }
                            appRepl(stringText[idFirst++]);
                        }
                        break;
                    case CONSTANT:
                        while (idFirst < idLoc)
                            appRepl(buf[idFirst++]);
                        break;
                    default: errPrint("! Copy_a_string: Not a STR or CONSTANT");
                }
                appRepl(a);
                break;
            /*:99*/
            case ORD:
                /*100:*/
                {
                    let cc = buf[idFirst];
                    if (cc === BACKSLASH) {
                        cc = buf[++idFirst];
                        if (cc >= '0'.charCodeAt(0) && cc <= '7'.charCodeAt(0)) {
                            cc -= '0'.charCodeAt(0);
                            if (buf[idFirst + 1] >= '0'.charCodeAt(0) && buf[idFirst + 1] <= '7'.charCodeAt(0)) {
                                cc = 8 * cc + buf[++idFirst] - '0'.charCodeAt(0);
                                if (buf[idFirst + 1] >= '0'.charCodeAt(0) && buf[idFirst + 1] <= '7'.charCodeAt(0) && cc < 32)
                                    cc = 8 * cc + buf[++idFirst] - '0'.charCodeAt(0);
                            }
                        }
                        else
                            switch (cc) {
                                case 't'.charCodeAt(0):
                                    cc = TAB;
                                    break;
                                case 'n'.charCodeAt(0):
                                    cc = NEWLINE;
                                    break;
                                case 'b'.charCodeAt(0):
                                    cc = BACKSPACE;
                                    break;
                                case 'f'.charCodeAt(0):
                                    cc = FORMFEED;
                                    break;
                                case 'v'.charCodeAt(0):
                                    cc = VTAB;
                                    break;
                                case 'r'.charCodeAt(0):
                                    cc = RETURN;
                                    break;
                                case 'a'.charCodeAt(0):
                                    cc = BEL;
                                    break;
                                case QMARK: break;
                                case 'x'.charCodeAt(0):
                                    if (xIsDigit(buf[idFirst + 1])) {
                                        cc = buf[++idFirst] - '0'.charCodeAt(0);
                                    }
                                    else if (xIsXDigit(buf[idFirst + 1])) {
                                        ++idFirst;
                                        cc = buf[idFirst] - 32 - 'A'.charCodeAt(0) + 10;
                                    }
                                    if (xIsDigit(buf[idFirst + 1])) {
                                        cc = 16 * cc + buf[++idFirst] - '0'.charCodeAt(0);
                                    }
                                    else if (xIsXDigit(buf[idFirst + 1])) {
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
                    appRepl(CONSTANT);
                    if (cc >= 100)
                        appRepl('0'.charCodeAt(0) + Math.floor(cc / 100));
                    if (cc >= 10)
                        appRepl('0'.charCodeAt(0) + Math.floor(cc / 10) % 10);
                    appRepl('0'.charCodeAt(0) + cc % 10);
                    appRepl(CONSTANT);
                }
                break;
            /*:100*/
            case DEFINITION:
            case FORMAT_CODE:
            case BEGIN_C:
                if (t !== SECTION_NAME) {
                    done = true;
                    break;
                }
                else {
                    errPrint("! @d, @f and @c are ignored in C text");
                    continue;
                }
            case NEW_SECTION:
                done = true;
                break;
            /*:97*/
            case RIGHTPAREN:
                appRepl(a);
                if (t === MACRO)
                    appRepl(SPACE);
                break;
            default:
                appRepl(a);
        }
    nextControl = a;
    curText = texts.length - 1;
    texts.push({ tokStart: tokMem.length,
        textLink: 0
    });
}
/*:95*/ /*102:*/
function isDigit(cc) {
    return cc >= '0'.charCodeAt(0) && cc <= '9'.charCodeAt(0);
}
function isXDigit(cc) {
    return (isDigit(cc) || (cc >= 'A'.charCodeAt(0) && cc <= 'F'.charCodeAt(0)) || (cc >= 'a'.charCodeAt(0) && cc <= 'f'.charCodeAt(0)));
}
function isAlpha(cc) {
    return ((cc >= 'a'.charCodeAt(0) && cc <= 'z'.charCodeAt(0)) || (cc >= 'A'.charCodeAt(0) && cc <= 'Z'.charCodeAt(0)));
}
function isSpace(cc) {
    return (cc === TAB || cc === NEWLINE || cc === VTAB || cc === FORMFEED || cc === RETURN || cc === SPACE);
}
function isUpper(cc) {
    return (cc >= 'A'.charCodeAt(0) && cc <= 'Z'.charCodeAt(0));
}
function xIsDigit(cc) {
    return isDigit(cc) && (cc < 0o200);
}
function xIsAlpha(cc) {
    return isAlpha(cc) && (cc < 0o200);
}
function xIsSpace(cc) {
    return isSpace(cc) && (cc < 0o200);
}
function xIsUpper(cc) {
    return isUpper(cc) && (cc < 0o200);
}
function xIsXDigit(cc) {
    return isXDigit(cc) && (cc < 0o200);
}
/*:102*/ /*103:*/
function scanSection() {
    let p;
    let q;
    let a;
    sectionCount++;
    noWhere = true;
    if (buf[loc - 1] === STAR && flags[FLAG.p]) {
        log('*' + sectionCount.toString());
    }
    nextControl = 0;
    while (true) {
        /*104:*/
        while (nextControl < DEFINITION)
            if ((nextControl = skipAhead()) === SECTION_NAME) {
                loc -= 2;
                nextControl = getNext();
            }
        /*:104*/
        if (nextControl === DEFINITION) {
            /*105:*/
            {
                while ((nextControl = getNext()) === NEWLINE)
                    ;
                if (nextControl !== IDENTIFIER) {
                    errPrint("! Definition flushed, must start with identifier");
                    continue;
                }
                ;
                a = idLookup(buf.toString('utf8', idFirst, idLoc));
                appRepl(Math.floor(a / 0o400) + 0o200);
                appRepl(a % 0o400);
                if (buf[loc] !== LEFTPAREN) {
                    appRepl(STR);
                    appRepl(SPACE);
                    appRepl(STR);
                }
                scanRepl(MACRO);
                texts[curText].textLink = 0;
            }
            /*:105*/
            continue;
        }
        if (nextControl === BEGIN_C) {
            p = 0;
            break;
        }
        if (nextControl === SECTION_NAME) {
            p = curSectionName;
            /*106:*/
            while ((nextControl = getNext()) === PLUS)
                ;
            if (nextControl !== EQUALS && nextControl !== EQ_EQ)
                continue;
            /*:106*/
            break;
        }
        return;
    }
    noWhere = printWhere = false;
    /*107:*/
    /*108:*/
    storeTwoBytes((0o150000 + sectionCount));
    /*:108*/
    scanRepl(SECTION_NAME);
    /*109:*/
    if (p === 0) {
        texts[lastUnnamed].textLink = curText;
        lastUnnamed = curText;
    }
    else if (nameDir[p].equiv === 0) {
        nameDir[p].equiv = curText;
    }
    else {
        q = nameDir[p].equiv;
        while (texts[q].textLink < SECTION_FLAG)
            q = texts[q].textLink;
        texts[q].textLink = curText;
    }
    texts[curText].textLink = SECTION_FLAG;
    /*:109*/
    /*:107*/
}
/*:103*/ /*110:*/
function phaseOne() {
    sectionCount = 0;
    resetInput();
    skipLimbo();
    while (!inputHasEnded)
        scanSection();
    checkComplete();
}
/*:110*/ /*111:*/
function skipLimbo() {
    let cc;
    while (true) {
        if (loc > limit && !getLine())
            return;
        buf[limit + 1] = AT;
        while (buf[loc] !== AT)
            loc++;
        if (loc++ <= limit) {
            cc = buf[loc++];
            if (ccode[cc] === NEW_SECTION)
                break;
            switch (ccode[cc]) {
                case TRANSLIT_CODE:
                    /*112:*/
                    while (xIsSpace(buf[loc]) && loc < limit)
                        loc++;
                    loc += 3;
                    if (loc > limit || !xIsXDigit(buf[loc - 3]) || !xIsXDigit(buf[loc - 2]) || (buf[loc - 3] >= '0'.charCodeAt(0) && buf[loc - 3] <= '7'.charCodeAt(0)) || !xIsSpace(buf[loc - 1])) {
                        errPrint("! Improper hex number following @l");
                    }
                    else {
                        const i = parseInt(buf.toString('utf8', loc - 3, loc - 2), 16);
                        while (xIsSpace(buf[loc]) && loc < limit)
                            loc++;
                        const beg = loc;
                        while (loc < limit && (xIsAlpha(buf[loc]) || xIsDigit(buf[loc]) || buf[loc] === UNDERSCORE))
                            loc++;
                        if (loc - beg >= TRANSLIT_LENGTH)
                            errPrint("! Replacement string in @l too long");
                        else {
                            translit[i - 0o200] = buf.toString('utf8', beg, loc);
                        }
                    }
                    /*:112*/
                    break;
                case FORMAT_CODE:
                case AT:
                    break;
                case CONTROL_TEXT:
                    if (cc === 'q'.charCodeAt(0) || cc === 'Q'.charCodeAt(0)) {
                        while ((cc = skipAhead()) === AT)
                            ;
                        if (buf[loc - 1] !== GREATERTHAN)
                            errPrint("! Double @ should be used in control text");
                        break;
                    }
                default:
                    errPrint("! Double @ should be used in limbo");
            }
        }
    }
}
/*:111*/ /*113:*/
function printStats() {
    log('\nMemory usage statistics:');
    log(nameDir.length.toString() + ' names');
    log(stringMem.length.toString() + ' strings');
    log((texts.length - 1).toString() + ' replacement texts');
    log(tokMem.length.toString() + ' tokens');
}
/*:113*/ /*116:*/
function inputLn(fp) {
    if (fp < 0)
        return (false);
    let k;
    const c = new Uint8Array(1);
    limit = k = 0;
    buf.fill(0);
    while ((k <= bufEnd) && ((bytesRead = fs_1.default.readSync(fp, c, 0, 1, -1)) !== 0) && (c[0] !== NEWLINE))
        if ((buf[k++] = c[0]) !== SPACE)
            limit = k;
    if (k > bufEnd)
        if (((bytesRead = fs_1.default.readSync(fp, c, 0, 1, 1)) !== 0) && (c[0] !== NEWLINE)) {
            loc = 0;
            errPrint("! Input line too long");
        }
    if ((bytesRead === 0) && (limit === 0))
        return (false);
    return (true);
}
/*:116*/ /*122:*/
function primeTheChangeBuffer() {
    changeLimit = 0;
    /*123:*/
    while (true) {
        changeLine++;
        if (!inputLn(changeFile))
            return;
        if (limit < 2)
            continue;
        if (buf[0] !== AT)
            continue;
        if (xIsUpper(buf[1]))
            buf[1] = buf[1] + 32;
        if (buf[1] === 'x'.charCodeAt(0))
            break;
        if (buf[1] === 'y'.charCodeAt(0) || buf[1] === 'z'.charCodeAt(0) || buf[1] === 'i'.charCodeAt(0)) {
            loc = 2;
            errPrint("! Missing @x in change file");
        }
    }
    /*:123*/
    /*124:*/
    do {
        changeLine++;
        if (!inputLn(changeFile)) {
            errPrint("! Change file ended after @x");
            return;
        }
    } while (limit === 0);
    /*:124*/
    /*125:*/
    {
        changeLimit = limit;
        buf.copy(changeBuf, 0, 0, limit);
    }
    /*:125*/
}
/*:122*/ /*126:*/
function ifSectionStartMakePending(b) {
    buf[limit] = EXCLAMATION;
    for (loc = 0; xIsSpace(buf[loc]); loc++)
        ;
    buf[limit] = SPACE;
    if (buf[loc] === AT && (xIsSpace(buf[loc + 1]) || buf[loc + 1] === STAR))
        changePending = b;
}
/*:126*/ /*127:*/
function checkChange() {
    let n = 0;
    if /*119:*/ (changeLimit !== limit || buf.compare(changeBuf, 0, changeLimit, 0, limit) !== 0)
        /*:119*/
        return;
    changePending = false;
    if (!changedSection[sectionCount]) {
        ifSectionStartMakePending(true);
        if (!changePending)
            changedSection[sectionCount] = true;
    }
    while (true) {
        changing = true;
        printWhere = true;
        changeLine++;
        if (!inputLn(changeFile)) {
            errPrint("! Change file ended before @y");
            changeLimit = 0;
            changing = false;
            return;
        }
        if (limit > 1 && buf[0] === AT) {
            const xyz_code = xIsUpper(buf[1]) ? buf[1] + 32 : buf[1];
            /*128:*/
            if (xyz_code === 'x'.charCodeAt(0) || xyz_code === 'z'.charCodeAt(0)) {
                loc = 2;
                errPrint("! Where is the matching @y?");
            }
            else if (xyz_code === 'y'.charCodeAt(0)) {
                if (n > 0) {
                    loc = 2;
                    log('! Hmm... ' + n.toString() + ' ');
                    errPrint("of the preceding lines failed to match");
                }
                changeDepth = includeDepth;
                return;
            }
            /*:128*/
        }
        /*125:*/
        {
            changeLimit = limit;
            buf.copy(changeBuf, 0, 0, limit);
        }
        /*:125*/
        changing = false;
        line[includeDepth]++;
        while (!inputLn(file[includeDepth])) {
            if (includeDepth === 0) {
                errPrint("! JWEB file ended during a change");
                inputHasEnded = true;
                return;
            }
            includeDepth--;
            line[includeDepth]++;
        }
        if /*119:*/ (changeLimit !== limit || buf.compare(changeBuf, 0, changeLimit, 0, limit) !== 0)
            /*:119*/
            n++;
    }
}
/*:127*/ /*130:*/
function resetInput() {
    limit = 0;
    loc = 1;
    buf[0] = SPACE;
    /*131:*/
    if ((file[0] = fs_1.default.openSync(fileName[0], 'r')) === -1) {
        fileName[0] = altWebFileName;
        if ((file[0] = fs_1.default.openSync(fileName[0], 'r')) === -1)
            fatal('! Cannot open input file ', fileName[0]);
    }
    webFileOpen = true;
    if (changeFileName !== '')
        if ((changeFile = fs_1.default.openSync(changeFileName, 'r')) === -1)
            fatal('! Cannot open change file ', changeFileName);
    /*:131*/
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
/*:130*/ /*133:*/
function getLine() {
    while (true) {
        if (changeFile >= 0 && changing && includeDepth === changeDepth) 
        /*137:*/
        {
            changeLine++;
            if (!inputLn(changeFile)) {
                errPrint("! Change file ended without @z");
                buf[0] = AT;
                buf[1] = 'z'.charCodeAt(0);
                limit = 2;
            }
            if (limit > 0) {
                if (changePending) {
                    ifSectionStartMakePending(false);
                    if (changePending) {
                        changedSection[sectionCount] = true;
                        changePending = false;
                    }
                }
                buf[limit] = SPACE;
                if (buf[0] === AT) {
                    if (xIsUpper(buf[1]))
                        buf[1] = buf[1] + 32;
                    if (buf[1] === 'x'.charCodeAt(0) || buf[1] === 'y'.charCodeAt(0)) {
                        loc = 2;
                        errPrint("! Where is the matching @z?");
                    }
                    else if (buf[1] === 'z'.charCodeAt(0)) {
                        primeTheChangeBuffer();
                        changing = !changing;
                        printWhere = true;
                    }
                }
            }
        }
        /*:137*/
        ;
        if (!changing || includeDepth > changeDepth) {
            /*136:*/
            {
                line[includeDepth]++;
                while (!inputLn(file[includeDepth])) {
                    printWhere = true;
                    if (includeDepth === 0) {
                        inputHasEnded = true;
                        break;
                    }
                    else {
                        fs_1.default.closeSync(file[includeDepth]);
                        includeDepth--;
                        if (changing && includeDepth === changeDepth)
                            break;
                        line[includeDepth]++;
                    }
                }
                if (!changing && !inputHasEnded)
                    if (limit === changeLimit)
                        if (buf[0] === changeBuf[0])
                            if (changeLimit > 0)
                                checkChange();
            }
            /*:136*/
            ;
            if (changeFile >= 0 && changing && includeDepth === changeDepth)
                continue;
        }
        if (inputHasEnded)
            return false;
        loc = 0;
        buf[limit] = SPACE;
        if (buf[0] === AT && (buf[1] === 'i'.charCodeAt(0) || buf[1] === 'I'.charCodeAt(0))) {
            loc = 2;
            buf[limit] = DOUBLEQUOTE;
            while (buf[loc] === SPACE || buf[loc] === TAB)
                loc++;
            if (loc >= limit) {
                errPrint("! Include file name not given");
                continue;
            }
            if (includeDepth >= MAX_INCLUDE_DEPTH - 1) {
                errPrint("! Too many nested includes");
                continue;
            }
            includeDepth++;
            /*135:*/
            {
                let k = '';
                let l;
                if (buf[loc] === DOUBLEQUOTE) {
                    loc++;
                    while (buf[loc] !== DOUBLEQUOTE && k.length < MAX_FILE_NAME_LENGTH) {
                        k += buf[loc];
                        loc++;
                    }
                    if (loc === limit) /*134:*/ {
                        includeDepth--;
                        errPrint("! Include file name too long");
                        continue;
                    }
                    /*:134*/
                }
                else {
                    while (buf[loc] !== SPACE && buf[loc] !== TAB && buf[loc] !== DOUBLEQUOTE && k.length <= MAX_FILE_NAME_LENGTH - 1) {
                        k += buf[loc];
                        loc++;
                    }
                }
                if (k.length > MAX_FILE_NAME_LENGTH - 1) /*134:*/ {
                    includeDepth--;
                    errPrint("! Include file name too long");
                    continue;
                }
                /*:134*/
                if ((file[includeDepth] = fs_1.default.openSync(fileName[includeDepth], 'r')) >= 0) {
                    line[includeDepth] = 0;
                    printWhere = true;
                    continue;
                }
                const jwebInputs = process.env.JWEBINPUTS;
                if (jwebInputs !== undefined) {
                    if ((l = jwebInputs.length) > MAX_FILE_NAME_LENGTH - 2) /*134:*/ {
                        includeDepth--;
                        errPrint("! Include file name too long");
                        continue;
                    }
                    /*:134*/
                }
                else {
                    l = 0;
                }
                if (l > 0) {
                    if (l + k.length + 3 >= MAX_FILE_NAME_LENGTH) /*134:*/ {
                        includeDepth--;
                        errPrint("! Include file name too long");
                        continue;
                    }
                    /*:134*/
                    fileName[includeDepth] = path_1.default.join(jwebInputs !== undefined ? jwebInputs : '', k);
                    if ((file[includeDepth] = fs_1.default.openSync(fileName[includeDepth], 'r')) >= 0) {
                        line[includeDepth] = 0;
                        printWhere = true;
                        continue;
                    }
                }
                includeDepth--;
                errPrint("! Cannot open include file");
                continue;
            }
            /*:135*/
        }
        return true;
    }
}
/*:133*/ /*138:*/
function checkComplete() {
    if (changeLimit !== 0) {
        changeBuf.copy(buf, 0, 0, changeLimit + 1);
        limit = changeLimit;
        changing = true;
        changeDepth = includeDepth;
        loc = 0;
        errPrint("! Change file entry did not match");
    }
}
/*:138*/ /*143:*/
function errPrint(s) {
    let k, l;
    log(s.charCodeAt(0) === EXCLAMATION ? '\n' + s : s);
    if (webFileOpen) /*144:*/ {
        if (changing && includeDepth === changeDepth)
            log('. (l. ' + changeLine.toString() + ' of change file)\n');
        else if (includeDepth === 0)
            log('. (l. ' + line[includeDepth].toString() + ' )\n');
        else
            log('. (l. ' + line[includeDepth].toString() + ' of include file ' + fileName[includeDepth].toString + ')\n');
        l = (loc >= limit ? limit : loc);
        let tempStr = '';
        if (l > 0) {
            for (k = 0; k < l; k++)
                if (buf[k] === TAB)
                    tempStr += String.fromCharCode(SPACE);
                else
                    tempStr += buf[k];
            log(tempStr);
            tempStr = '';
            for (k = 0; k < l; k++)
                tempStr += String.fromCharCode(SPACE);
        }
        for (k = l; k < limit; k++)
            tempStr += buf[k];
        if (buf[limit] === VBAR)
            tempStr += VBAR;
        tempStr += String.fromCharCode(SPACE);
        log(tempStr);
    }
    /*:144*/
    /*141:*/
    runHistory = ERROR_MESSAGE;
    /*:141*/
}
/*:143*/ /*145:*/
function wrapUp() {
    if (flags[FLAG.s])
        printStats();
    /*146:*/
    switch (runHistory) {
        case SPOTLESS:
            if (flags[FLAG.h])
                log('(No errors were found.)\n');
            break;
        case HARMLESS_MESSAGE:
            log('(Did you see the warning message above?)\n');
            break;
        case ERROR_MESSAGE:
            log('(Pardon me, but I think I spotted something wrong.)\n');
            break;
        case FATAL_MESSAGE:
            log('(That was a fatal error, my friend.)\n');
    }
    /*:146*/
    if (runHistory > HARMLESS_MESSAGE)
        return (1);
    else
        return (0);
}
/*:145*/ /*147:*/
function fatal(s, t) {
    if (s !== '')
        log(s);
    if (t !== '')
        errPrint(t);
    runHistory = FATAL_MESSAGE;
    process.exitCode = wrapUp();
    throw 'Fatal Error: exiting...';
}
/*:147*/ /*148:*/
function overflow(t) {
    log('\n! Sorry, ' + t + ' capacity exceeded');
    fatal('', '');
}
/*:148*/ /*149:*/
function confusion(s) {
    fatal("! This can't happen: ", s);
}
/*:149*/ /*155:*/
function scanArgs(argv) {
    if (argv === [])
        fatal('! No command line arguments provided.', '');
    let argc = argv.length;
    let argPos = -1;
    let dotPos;
    let processedWebFile = false;
    let processedChangeFile = false;
    let processedOutFile = false;
    let processedLang = false;
    let flagChange;
    let i;
    while (--argc >= 0) {
        argPos++;
        if ((argv[argPos].length > 1) && (argv[argPos].charCodeAt(0) === MINUS || argv[argPos].charCodeAt(0) === PLUS)) 
        /*160:*/
        {
            flagChange = !(argv[argPos].charCodeAt(0) === MINUS);
            for (dotPos = 1; dotPos < argv[argPos].length; dotPos++)
                flags[argv[argPos].charCodeAt(dotPos)] = flagChange;
        }
        /*:160*/
        else {
            dotPos = 0;
            for (i = 0; i < argv[argPos].length; i++) {
                if (argv[argPos].charCodeAt(i) === DOT) {
                    dotPos = i + 1;
                }
                else if (argv[argPos].charCodeAt(i) === SLASH) {
                    dotPos = 0;
                }
            }
            if (!processedWebFile) 
            /*156:*/
            {
                if (i > MAX_FILE_NAME_LENGTH - 5)
                    /*162:*/
                    fatal('! Filename too long\n', argv[argPos]);
                /*:162*/
                if (dotPos === 0) {
                    fileName[0] = argv[argPos] + '.w';
                    altWebFileName = argv[argPos] + '.web';
                }
                else {
                    fileName[0] = argv[argPos];
                }
                processedWebFile = true;
            }
            /*:156*/
            else if (!processedChangeFile) 
            /*157:*/
            {
                if (argv[argPos].charCodeAt(0) !== MINUS) {
                    if (i > MAX_FILE_NAME_LENGTH - 4)
                        /*162:*/
                        fatal('! Filename too long\n', argv[argPos]);
                    /*:162*/
                    if (dotPos === 0)
                        changeFileName = argv[argPos] + '.ch';
                    else
                        changeFileName = argv[argPos];
                }
                processedChangeFile = true;
            }
            /*:157*/
            else if (!processedLang) 
            /*158:*/
            {
                if (i > MAX_FILE_NAME_LENGTH - 5)
                    /*162:*/
                    fatal('! Filename too long\n', argv[argPos]);
                /*:162*/
                outputLanguage = argv[argPos];
                isCLanguage = (outputLanguage === 'c' || outputLanguage === 'cc' || outputLanguage === 'cpp' || outputLanguage === 'c++' || outputLanguage === 'cp' || outputLanguage === 'cxx');
                processedLang = true;
            }
            /*:158*/
            else if (!processedOutFile) 
            /*159:*/
            {
                if (i > MAX_FILE_NAME_LENGTH - 5)
                    /*162:*/
                    fatal('! Filename too long\n', argv[argPos]);
                /*:162*/
                if (dotPos === 0) {
                    outputFileName = argv[argPos] + '.' + outputLanguage;
                }
                else {
                    outputFileName = argv[argPos];
                }
                processedOutFile = true;
            }
            /*:159*/
            else 
            /*161:*/
            {
                fatal('! Usage: jtangle(args[, logFunc])\n', '');
            }
            /*:161*/
        }
    }
    if (!processedWebFile) 
    /*161:*/
    {
        fatal('! Usage: jtangle(args[, logFunc])\n', '');
    }
    /*:161*/
    if (flags[FLAG.b]) {
        log(BANNER);
    }
    ;
    log('Flags: banner:' + flags[FLAG.b].toString() + ', progress:' + flags[FLAG.p].toString() +
        ', debug info:' + flags[FLAG.s].toString() + ', report no errors:' + flags[FLAG.h].toString() +
        ', comments:' + flags[FLAG.c].toString() + ', section numbers:' + flags[FLAG.n].toString());
    log('Web file name: ' + fileName[0]);
    log('Alt web file name: ' + altWebFileName);
    log('Change file name: ' + changeFileName);
    log('Output file name: ' + outputFileName);
    log('Output language: ' + outputLanguage);
}
/*:155*/ /*164:*/
function putChar(cc) {
    fs_1.default.writeSync(outputFile, String.fromCharCode(cc));
}
function putString(s) {
    fs_1.default.writeSync(outputFile, s);
}
module.exports = function jtangle(argv, logFunc) {
    /*8:*/
    log = logFunc ? logFunc : console.log;
    /*:8*/
    /*166:*/
    stringMem = [];
    nameDir = [];
    hash = [];
    tokMem = [];
    texts = [];
    texts.push({ tokStart: 0,
        textLink: 0
    });
    texts.push({ tokStart: 0,
        textLink: 0
    });
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
    for (let c = 0; c < 256; c++)
        ccode[c] = IGNORE;
    ccode[SPACE] =
        ccode[TAB] =
            ccode[NEWLINE] =
                ccode[VTAB] =
                    ccode[RETURN] =
                        ccode[FORMFEED] =
                            ccode[STAR] = NEW_SECTION;
    ccode[AT] = AT;
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
    ccode[SINGLEQUOTE] = ORD;
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
    /*:166*/
    /*12:*/
    stringMem.push('');
    nameDir.push({ stringIndex: 0,
        lLink: 0,
        rLink: 0,
        shortestPrefixLength: 0,
        equiv: 0 });
    /*:12*/ /*15:*/
    for (let h = 0; h <= HASH_END; h++) {
        hash[h] = 0;
    }
    /*:15*/ /*20:*/
    nameDir[0].rLink = 0;
    /*:20*/
    /*152:*/
    flags[FLAG.s] = flags[FLAG.c] = flags[FLAG.n] = false;
    flags[FLAG.b] = flags[FLAG.p] = flags[FLAG.h] = true;
    /*:152*/
    /*154:*/
    scanArgs(argv);
    if ((outputFile = fs_1.default.openSync(outputFileName, 'w')) === -1)
        fatal('! Cannot open output file ', outputFileName);
    /*:154*/
    phaseOne();
    phaseTwo();
    return wrapUp();
};
/*:164*/
//# sourceMappingURL=jtangle.js.map