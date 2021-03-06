const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const bluebird = require('bluebird');
const xml2js = bluebird.promisifyAll(require('xml2js'));

// import the file to test and mock out its dependencies
const translate = proxyquire('../src/translate', {
    'google-translate-api': text => {
        // this function simulates the Google Translate API.
        // all words will be translated to [word]_TRANSLATED, i.e:
        // "hello world" => "hello_TRANSLATED world_TRANSLATED"

        const words = text.split(/\s+/);
        const translatedWords = [];
        words.forEach(word => {
            translatedWords.push(word + '_TRANSLATED');
        });

        const translatedText = translatedWords.join(' ');

        return bluebird.resolve({
            text: translatedText
        });
    },
    './log': () => {
        /* noop */
    }
});

describe('translate', () => {
    it('verifies that all properties are correctly translated', () => {
        const input = `
            <?xml version="1.0" encoding="UTF-8" ?>
            <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
                <file source-language="en" datatype="plaintext" original="ng2.template">
                    <body>
                        <trans-unit id="introductionHeader" datatype="html">
                            <source>Hello i18n!</source>
                            <context-group purpose="location">
                                <context context-type="sourcefile">app\app.component.ts</context>
                                <context context-type="linenumber">4</context>
                            </context-group>
                            <note priority="1" from="description">An introduction header for this sample</note>
                            <note priority="1" from="meaning">User welcome</note>
                        </trans-unit>
                    </body>
                </file>
            </xliff>
        `;

        const expectedOutput = `
            <?xml version="1.0" encoding="UTF-8" ?>
            <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
                <file source-language="en" datatype="plaintext" original="ng2.template">
                    <body>
                        <trans-unit id="introductionHeader" datatype="html">
                            <source>Hello i18n!</source>
                            <target>Hello_TRANSLATED i18n!_TRANSLATED</target>
                            <context-group purpose="location">
                                <context context-type="sourcefile">app\app.component.ts</context>
                                <context context-type="linenumber">4</context>
                            </context-group>
                            <note priority="1" from="description">An introduction header for this sample</note>
                            <note priority="1" from="meaning">User welcome</note>
                        </trans-unit>
                    </body>
                </file>
            </xliff>
        `;

        return translate(input, 'from', 'to', [], [])
            .then(output => {
                return bluebird.all([
                    xml2js.parseStringAsync(output),
                    xml2js.parseStringAsync(expectedOutput)
                ]);
            })
            .then(([output, expectedOutput]) => {
                expect(output).to.deep.equal(expectedOutput);
            });
    });
});
