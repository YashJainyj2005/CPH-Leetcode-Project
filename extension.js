// Import necessary modules from VS Code's extensibility API and other libraries
const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const { formatArrToStr, splitTestCases } = require('./src/utils/convert');
const { executeCode } = require('./src/utils/runningcode');

// GraphQL query to fetch problem data from LeetCode
const PROBLEM_QUERY = `
query getProblemData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
        questionId
        title
        content
        exampleTestcases
        sampleTestCase
    }
}`;

/**
 * Extract test cases from the problem content and example test cases provided by LeetCode.
 * 
 * @param {string} exampleTestcases - Raw example test cases.
 * @param {string} sampleTestCase - A sample test case for determining input/output structure.
 * @returns {Object} An object containing arrays of inputs and outputs.
 */
function extractTestCases(problemContent, exampleTestcases, sampleTestCase) {
    if (!problemContent) return { inputs: [], outputs: [] };

    const $ = cheerio.load(problemContent); // Load the HTML content
    const extractedOutputs = [];

    // Determine the number of lines per test case based on the sample test case
    const linesPerCase = sampleTestCase ?
        (sampleTestCase.match(/\n/g) || []).length + 1 : 1;

    const extractedInputs = exampleTestcases ?
        splitTestCases(exampleTestcases, linesPerCase) : [];

    // Extract outputs from HTML content marked with 'strong.example'
    $('strong.example').each((index, element) => {
        let extractedOutput = '';
        let currentElement = $(element);

        while (currentElement.length) {
            if (currentElement.next().length) {
                currentElement = currentElement.next();
            } else if (currentElement.parent().next().length) {
                currentElement = currentElement.parent().next();
            } else {
                break;
            }

            const preElement = currentElement.is('pre') ?
                currentElement : currentElement.find('pre');

            if (preElement.length) {
                const testCaseText = preElement.text();
                const outputMatch = testCaseText.match(/Output:\s*([^]*?)(?=\nExplanation:|$)/);
                if (outputMatch && outputMatch[1]) {
                    extractedOutput = formatArrToStr(outputMatch[1].trim());
                    break;
                }
            }
        }
        extractedOutputs.push(extractedOutput || '');
    });

    return {
        inputs: extractedInputs.map(input =>
            input.split('\n')
                .map(line => formatArrToStr(line))
                .join('\n')
        ),
        outputs: extractedOutputs.map(output =>
            output.split('\n')
                .map(line => formatArrToStr(line))
                .join('\n')
        )
    };
}

/**
 * Save extracted test cases to files in the specified directory.
 * 
 * @param {string} workspacePath - The root path of the current workspace.
 * @param {string} problemId - The unique identifier for the problem.
 * @param {Object} testcases - An object containing arrays of inputs and outputs.
 * @returns {Promise<string>} The path where test cases are saved.
 */
async function saveTestCases(workspacePath, problemId, testcases) {
    const testCaseDirectory = path.join(__dirname, 'src', 'testcases', problemId);

    try {
        // Ensure the directory exists
        await fs.mkdir(testCaseDirectory, { recursive: true });

        // Save input test cases
        for (let i = 0; i < testcases.inputs.length; i++) {
            const inputPath = path.join(testCaseDirectory, `input_${i + 1}.txt`);
            const formattedInput = Array.isArray(testcases.inputs[i]) ?
                testcases.inputs[i].join('\n') :
                testcases.inputs[i];
            await fs.writeFile(inputPath, formattedInput);
        }

        // Save output test cases
        for (let i = 0; i < testcases.outputs.length; i++) {
            const outputPath = path.join(testCaseDirectory, `output_${i + 1}.txt`);
            await fs.writeFile(outputPath, testcases.outputs[i]);
        }

        return testCaseDirectory;
    } catch (error) {
        throw new Error(`Failed to save test cases: ${error.message}`);
    }
}

/**
 * Fetch test cases for a given problem from LeetCode.
 * 
 * @param {string} titleSlug - The problem's unique identifier from its URL.
 * @returns {Promise<Object>} An object containing problem details and test cases.
 */
async function fetchTestCases(titleSlug) {
    try {
        const response = await axios.post(
            'https://leetcode.com/graphql',
            {
                query: PROBLEM_QUERY,
                variables: { titleSlug }
            }
        );

        if (response.data.errors) {
            throw new Error(response.data.errors[0].message);
        }

        const problemData = response.data.data.question;
        return {
            id: problemData.questionId,
            content: problemData.content,
            testcases: extractTestCases(
                problemData.content,
                problemData.exampleTestcases,
                problemData.sampleTestCase
            )
        };
    } catch (error) {
        throw new Error(`LeetCode API Error: ${error.message}`);
    }
}

/**
 * Extract the `titleSlug` from a LeetCode problem URL.
 * 
 * @param {string} url - The full URL of the problem.
 * @returns {string} The extracted `titleSlug`.
 */
const getTitleSlug = (url) => {
    try {
        const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash if present
        const match = cleanUrl.match(/\/problems\/([^/]+)/);
        if (!match || !match[1]) throw new Error('Invalid LeetCode URL');
        return match[1];
    } catch (error) {
        throw new Error('Invalid LeetCode URL format');
    }
};

/**
 * This method is called when the extension is activated.
 * It registers commands and sets up initial state.
 * 
 * @param {vscode.ExtensionContext} context - The VS Code extension context.
 */
function activate(context) {
    console.log('Congratulations, your extension "lyjain" is now active!');

    // Register the "fetch" command to retrieve test cases
    let fetchCommand = vscode.commands.registerCommand('lyjain.fetch', async (problemUrl) => {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder found');
            }

            if (!problemUrl) {
                problemUrl = await vscode.window.showInputBox({
                    prompt: 'Enter LeetCode problem URL',
                    placeHolder: 'https://leetcode.com/problems/...'
                });
            }

            if (!problemUrl) {
                return;
            }

            const titleSlug = getTitleSlug(problemUrl);

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Fetching LeetCode test cases...",
                cancellable: false
            }, async (progress) => {
                const { id, content, testcases } = await fetchTestCases(titleSlug);
                const testCasePath = await saveTestCases(workspaceRoot, id, testcases);

                await context.workspaceState.update('currentProblemId', id);
                vscode.window.showInformationMessage(
                    `Test cases saved to ${testCasePath}`
                );
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    // Register the "run" command to execute code with test cases
    let runCommand = vscode.commands.registerCommand('lyjain.run', async () => {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                throw new Error('No active editor');
            }

            const filePath = editor.document.uri.fsPath;
            const fileExtension = path.extname(filePath);
            const language = fileExtension.substring(1);

            await editor.document.save();

            const problemId = context.workspaceState.get('currentProblemId');
            if (!problemId) {
                throw new Error('No problem ID found. Please fetch test cases first.');
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Running test cases...",
                cancellable: false
            }, async (progress) => {
                const executionResult = await executeCode(filePath, language, problemId);

                if (!executionResult.success) {
                    throw new Error(executionResult.error);
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    // Add the commands to the extension's subscriptions
    context.subscriptions.push(fetchCommand, runCommand);
}

/**
 * This method is called when the extension is deactivated.
 */
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
