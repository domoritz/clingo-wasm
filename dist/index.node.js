"use strict";
exports.__esModule = true;
var nodeClingoModule = require("./clingo");
function run(program, models) {
    if (models === void 0) { models = 1; }
    console.time("Clingo Run Time");
    return new Promise(function (res, rej) {
        var results = [];
        var params = {
            locateFile: function (file) { return "https://cdn.jsdelivr.net/npm/wasm-clingo/" + file; },
            print: function (x) { return results.push(x); },
            printErr: rej,
            postRun: function () {
                var parsedResults = JSON.parse(results.join(""));
                delete parsedResults.Solver;
                delete parsedResults.Input;
                res(parsedResults);
            }
        };
        nodeClingoModule(params).then(function (clingo) {
            clingo.ccall('run', 'number', ['string',
                'string'], [program, '--outf=2 --enum-mode brave ' + models]);
        });
    });
}
exports.run = run;
run('a. b. c :- a, b.');
