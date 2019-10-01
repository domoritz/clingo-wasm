module.exports = function () {
    return {
        files: [
            'src/**/*.ts',
            'index.node.ts',
            'clingo.js',
            '*.wasm',
        ],
        tests: [
            'test/**/*.ts',
        ],
        env: {
            type: 'node'
        }
    };
};