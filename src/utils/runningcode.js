const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const LANGUAGE_COMMANDS = {
    'cpp': 'g++-13',
    'python': 'python3',
    'java': 'javac',
    'javascript': 'node'
};

async function executeCode(filePath, language, pblm_id, inputs) {
    console.log(`Running code:
    File path: ${filePath}
    Programming Language: ${language}
    Leetcode Problem's ID: ${pblm_id}`);

    try {
        const extn = path.extname(filePath);
        const base_name = path.basename(filePath, extn);
        const directory = path.join(__dirname, '../temp');
        await fs.mkdir(directory, { recursive: true });
        console.log(`Created/verified temp directory at: ${directory}`);


        const temp_path = path.join(directory, `${base_name}${extn}`);
        await fs.copyFile(filePath, temp_path);
        const resl = [];
        const testCaseDir = path.join(__dirname, `../testcases/${pblm_id}`);
        console.log(`Looking for test cases in: ${testCaseDir}`);
        const files = await fs.readdir(testCaseDir);
        const inputFiles = files.filter(f => f.startsWith('input_'));
        console.log(`Found ${inputFiles.length} test cases`);
        for (let i = 0; i < inputFiles.length; i++) {
            console.log(`\nExecuting test case ${i + 1}/${inputFiles.length}`);
            const inputFile = path.join(testCaseDir, `input_${i + 1}.txt`);
            const expectedOutputFile = path.join(testCaseDir, `output_${i + 1}.txt`)
            const input = await fs.readFile(inputFile, 'utf-8');
            const expectedOutput = await fs.readFile(expectedOutputFile, 'utf-8').then(out => out.trim());
            console.log(`Running code with input from: ${inputFile}`);
            const output = await runCode(temp_path, language, input);
            const actualOutput = output.trim();
            const passed = actualOutput === expectedOutput;
            console.log(`Test case ${i + 1} result: ${passed ? 'PASSED' : 'FAILED'}`);
            if (!passed) {
                console.log(`Expected: "${expectedOutput}"`);
                console.log(`Actual: "${actualOutput}"`);
            }
            resl.push({
                testCase: i + 1,
                passed,
                input,
                expectedOutput,
                actualOutput
            });
        }
        await fs.unlink(temp_path);
        console.log(`\nCleaned up temporary file: ${temp_path}`);
        const summary = {
            total: resl.length,
            passed: resl.filter(r => r.passed).length
        };
        console.log(`\nExecution complete. Summary: ${summary.passed}/${summary.total} tests passed`);
        return {
            success: true,
            resl,
            summary
        };
    } catch (error) {
        console.error('Execution failed with error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function runCode(filePath, language, input) {
    return new Promise((resolve, reject) => {
        let cmnd;
        
        switch (language.toLowerCase()) {
            case 'cpp':
                const outputPath = filePath.replace('.cpp', '');
                cmnd = `${LANGUAGE_COMMANDS.cpp} ${filePath} -o ${outputPath} && ${outputPath}`;
                break;
            case 'python':
                cmnd = `${LANGUAGE_COMMANDS.python} ${filePath}`;
                break;
            case 'py':
                cmnd = `${LANGUAGE_COMMANDS.python} ${filePath}`;
                break;
            case 'java':
                const className = path.basename(filePath, '.java');
                cmnd = `${LANGUAGE_COMMANDS.java} ${filePath} && java -cp ${path.dirname(filePath)} ${className}`;
                break;
            case 'javascript':
                cmnd = `${LANGUAGE_COMMANDS.javascript} ${filePath}`;
                break;
            case 'js':
                cmnd = `${LANGUAGE_COMMANDS.javascript} ${filePath}`;
                break;
            default:
            reject(new Error(`Unsupported language: ${language}`));
            return;
        }
        
        console.log(`Executing command: ${cmnd}`);
        
        const process = exec(cmnd, (error, stdout, stderr) => {
            if (error) {
                console.error('Process execution failed:', error);
                console.error('stderr:', stderr);
                reject(new Error(stderr || error.message));
                return;
            }
            console.log('Process execution successful');
            resolve(stdout);
        });
        if (input) {
            console.log('Providing input to process');
            process.stdin.write(input);
            process.stdin.end();
        }
    });
}

module.exports = { executeCode };