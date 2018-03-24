import * as paths from 'path';
import * as glob from 'glob';
import * as fs from 'fs';

const Mocha = require('mocha');
const tty = require('tty');

import ITestRunnerOptions from './ITestRunnerOptions';
import CoverageRunner from './CoverageRunner';
// Linux: prevent a weird NPE when mocha on Linux requires the window size from the TTY
// Since we are not running in a tty environment, we just implement the method statically

if (!tty.getWindowSize) {
    tty.getWindowSize = (): number[] => {
        return [80, 75];
    };
}

let mocha = new Mocha({
    ui: 'tdd',
    useColors: true,
    timeout: 10000
});

function configure(mochaOpts: object): void {
    mocha = new Mocha(mochaOpts);
}
exports.configure = configure;

function run(testsRoot: string, clb: any): any {
    // Enable source map support
    require('source-map-support').install();

    // Read configuration for the coverage file
    let coverOptions: ITestRunnerOptions | null = _readCoverOptions(testsRoot);
    if (coverOptions && coverOptions.enabled) {
        // Setup coverage pre-test, including post-test hook to report
        let coverageRunner = new CoverageRunner(coverOptions, testsRoot);
        if (!coverOptions.relativeSourcePath) {
            return clb(
                'Error - relativeSourcePath must be defined for code coverage to work'
            );
        }
        coverageRunner.setupCoverage();
    }

    // Glob test files
    glob('**/**.test.js', { cwd: testsRoot }, (error: any, files): any => {
        if (error) {
            return clb(error);
        }
        try {
            // Fill into Mocha
            files.forEach((f): Mocha => {
                return mocha.addFile(paths.join(testsRoot, f));
            });
            // Run the tests
            let failureCount = 0;

            mocha
                .run()
                .on('fail', (): void => {
                    failureCount++;
                })
                .on('end', (): void => {
                    clb(undefined, failureCount);
                });
        } catch (error) {
            return clb(error);
        }
    });
}
exports.run = run;

function _readCoverOptions(testsRoot: string): ITestRunnerOptions | null {
    let coverConfigPath = paths.join(testsRoot, '..', '..', 'coverconfig.json');
    let coverConfig: ITestRunnerOptions | null = null;
    if (fs.existsSync(coverConfigPath)) {
        let configContent = fs.readFileSync(coverConfigPath, 'utf-8');
        coverConfig = JSON.parse(configContent);
    }
    return coverConfig;
}
