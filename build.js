var jtangle = require ('./out/jtangle');
var md = require('markdown-it');
var mdConcatCode = require('markdown-it-concat-code');
var frontMatter = require('markdown-it-front-matter');
const path = require('path');

var src = {};
var mdlang;

exports.run = function (mdFile, outDir) {
    if (mdFile) {
        const fn = path.parse(mdFile).name;
        const wFile = outDir ? path.join(outDir, fn + '.w') : fn + '.w';
        const outFile = outDir ? path.join(outDir, fn) : fn;
        
        const content = fs.readFileSync(mdFile).toString();

        //Determine the target language and convert the markdown source into WEB source
        md().use(frontMatter, function(fm) {
                const arr = fm.split(':');
                if (arr.length === 2 && arr[0] === 'jweb') {
                    mdlang = arr[1];
                }})
            .use(mdConcatCode.default, { lang: mdlang, separator: '\n@ \n'}, src)
            .parse(content);
        
        fs.writeFileSync(wFile, '@*\n' + src.value);
        
        // Generate the source file in the target language
        jtangle([wFile, '-', mdlang, outFile]);
    }
}; 
