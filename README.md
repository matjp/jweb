# JWEB

JWEB is a modern, simplified implementation of the CWEB system of literate programming.

Program texts are written in Markdown with fenced code blocks instead of TeX.

`ctangle` has been re-implemented as `jtangle` which has been enhanced to support the Javascript and Typescript languages in addition to the original `ctangle` support for C and C++.

`jtangle` is written in JWEB, so it is self-built.

Since TeX is not used no re-implementation of `cweave` was required.

## How it works

Write your program as a Markdown document consisting of sections of descriptive text together with fenced code blocks formatted using CWEB control codes and section texts.

### Language Specifier

The output language is indicated by this Markdown front-matter:

```markdown
---
jweb:<language>
---
```

where `<language>` is the language specifier that will be appended to the output filename. e.g. (c, cpp, js, ts).

See `cwebman.pdf` in `docs` for the CWEB syntax, and see `jtangle.md` and the `examples` folder for JWEB source examples.

## Generating a target source file

`jtangle` accepts WEB files as input, so any existing CWEB (*.w) file can be processed into a program source file.

Note that the command line syntax for `jtangle` is different to that of `ctangle`. i.e.

`jtangle(args[, logFunc])`

`args` is a string array containing the following members in the same order: `[options] webfile[.w] {changefile[.ch]|-} outlang outfile`

where `outlang` is the target language extension and `outfile` is the filename without language extension.

`logFunc` is a function taking a single string parameter that will output that string somewhere as a log message. If no function is passed `console.log` will be used.

When building from a Markdown source an intermediate WEB file must be generated before calling `jtangle`. A build script `build.js` is provided to fully process a Markdown file.

The markdown file is converted into a WEB file by concatenating all of the fenced code blocks together and adding CWEB section control codes.

Then the WEB file is passed into `jtangle` to produce the target source file.

See `package.json` for examples of calling `build.js` for `jtangle` and the examples.

## VS Code Extension

[JWEB Editor](https://marketplace.visualstudio.com/items?itemName=matjp.jweb-editor) is a VS Code extension for editing JWEB files.

It automates the calling of `jtangle` on each file save and allows the use of syntax highlighting, Markdown preview and other Markdown extensions with your JWEB documents.

<br>
If you find this software useful please consider making a contribution to support the development of free and open software:

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/donate/?business=4Y8W9NDGYET6A&no_recurring=0&currency_code=USD)
