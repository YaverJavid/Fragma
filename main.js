const cheerio = require('cheerio');
const fs = require('fs');
const originalDir = process.cwd();
let errCount = 0

if (!process.argv[2]) {
    error("Fragma fault : File name not given!");
    process.exit(1);
}
let outputFn = process.argv[3] || 'a.html';
let mainPath = process.argv[2]

function getDirFromPath(path) {
    if (path === "" || path === "/") return ".";  // Handle empty or root path
    if (!path.includes('/')) return ".";  // Handle simple filenames
    if (path.endsWith('/')) return path.substring(0, path.lastIndexOf('/')).slice(0, -1); // Handle trailing slash case
    return path.substring(0, path.lastIndexOf('/'));
}


function pack(path, main, dir, encoding) {
    encoding = encoding || 'utf8'
    process.chdir(dir)
    try {
        const data = fs.readFileSync(path, encoding);
        process.chdir(originalDir);
        if (analyze(data, path).failed) {
            process.exit(1);
        }

        // Cheerio
        const $ = cheerio.load(data, { isDocument: main });

        $('content').each((i, el) => {
            const src = $(el).attr('src');
            const encoding = $(el).attr('encoding');
            const content = pack(src, false, getDirFromPath(path), encoding)
            $(el).replaceWith(content);
        });
        return $.html();
    } catch (err) {
        error(`Fragma Failed: Could Not Read The Path: ${path}, ERR_CODE: ${err.code}`);
        process.exit(1); // Exit the program if there's an error
    } finally {
        process.chdir(originalDir);
    }
}

function analyze(text, fn) {
    let err = false;
    // Split the text into lines for later retrieval of line content.
    const lines = text.split('\n');

    // This regex matches opening tags for <content> or <fragma-template>
    // It captures the tag name in group 1 and the attributes string in group 2.
    const tagRegex = /<(content|fragma-template)\b([^>]*?)>/gi;

    let match;
    while ((match = tagRegex.exec(text)) !== null) {
        const tagName = match[1];      // either 'content' or 'fragma-template'
        const attrString = match[2];   // the string with all attributes
        const matchIndex = match.index;  // position where the tag starts

        // Check if 'src' attribute is present.
        // This simple check works if the attribute is present in any form.
        if (!/\bsrc\s*=/i.test(attrString)) {
            // Calculate the line number by counting the newlines before the tag.
            const precedingText = text.slice(0, matchIndex);
            const lineNumber = (precedingText.match(/\n/g) || []).length + 1;
            // Error Reporting
            errCount++
            err = true
            const lineContent = lines[lineNumber - 1].trim();
            error("\nFragma Check Error " + errCount)
            error("At file : " + fn)
            error(`Fragma Failed: SRC missing in <${tagName}> (line ${lineNumber})`)
            error(`\nAt: ${lineContent}\n`);
        }
    }
    return { failed: err }
}

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    yellow: "\x1b[33m"
};

function warn(message) {
    console.log(`${colors.yellow}${message}${colors.reset}`);
}

function error(message) {
    console.log(`${colors.red}${message}${colors.reset}`);
}

let output = pack(mainPath, true, '.')

process.chdir(getDirFromPath(mainPath))

fs.writeFile(outputFn, output, (err) => {
    if (err) {
        error('Error writing the file:' + outputFn);
    }
});
