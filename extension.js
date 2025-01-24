const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs').promises;
const fss=require('fs')
const path = require('path');
const cheerio = require('cheerio');
const { format, splitTC, executeCode } = require('./src/utils/convert');


function extractTestCases(problemContent, exampleTestcases, sampleTestCase) {
    if (!problemContent) return { inputs: [], outputs: [] };
    
    const $ = cheerio.load(problemContent);
    const extractedOutputs = [];
    const linesPerCase = sampleTestCase ?
    (sampleTestCase.match(/\n/g) || []).length + 1 : 1;
    
    const extractedInputs = exampleTestcases ?
    splitTC(exampleTestcases, linesPerCase) : [];
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
                    extractedOutput = format(outputMatch[1].trim());
                    break;
                }
            }
        }
        extractedOutputs.push(extractedOutput || '');
    });

    
    return {
        inputs: extractedInputs.map(input =>
            input.split('\n')
            .map(line => format(line))
            .join('\n')
        ),
        outputs: extractedOutputs.map(output =>
            output.split('\n')
            .map(line => format(line))
            .join('\n')
        )
    };
}

async function saveTestCases(workspacePath, problemId, testcases) {
    const testCaseDirectory = path.join(__dirname, 'src', 'testcases', problemId);
    
    try {
        await fs.mkdir(testCaseDirectory, { recursive: true });
        
        for (let i = 0; i < testcases.inputs.length; i++) {
            const inputPath = path.join(testCaseDirectory, `input_${i + 1}.txt`);
            const formattedInput = Array.isArray(testcases.inputs[i]) ?
            testcases.inputs[i].join('\n') :
            testcases.inputs[i];
            await fs.writeFile(inputPath, formattedInput);
        }
        
        for (let i = 0; i < testcases.outputs.length; i++) {
            const outputPath = path.join(testCaseDirectory, `output_${i + 1}.txt`);
            await fs.writeFile(outputPath, testcases.outputs[i]);
        }
        
        return testCaseDirectory;
    } catch (error) {
        throw new Error(`Failed to save test cases: ${error.message}`);
    }
}

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
        console.log(problemData.questionId)
        console.log(problemData.content)
        console.log(problemData.exampleTestcases)
        console.log(problemData.sampleTestCase)
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

const get_Title_Slug = (url) => {
    try {
        const cleanUrl = url.replace(/\/$/, '');
        const match = cleanUrl.match(/\/problems\/([^/]+)/);
        if (!match || !match[1]) throw new Error('Invalid LeetCode URL');
        return match[1];
    } catch (error) {
        throw new Error('Invalid LeetCode URL format');
    }
};
function activate(context) {
    console.log('Congratulations, your extension "lyjain" is now active!');

    const mywebview = new CPHView(context.extensionUri)
    console.log("Heree")
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('CPHLeetcodePanel', mywebview)
    );

    // Registering the "fetch" command to retrieve test cases
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

            const titleSlug = get_Title_Slug(problemUrl);

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

    // Registering the "run" command to execute code with test cases
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
    context.subscriptions.push(fetchCommand, runCommand);
}

/**
 * This method is called when the extension is deactivated.
 */
function deactivate() { }

class CPHView {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.webview = null;
        console.log("Initialized")
    }
    resolveWebviewView(webviewView) {
        this.webview = webviewView.webview
        console.log("Starting")
        webviewView.webview.options = {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'webview')],
        };
        console.log("Here")
        webviewView.webview.html = this.getHtmlForWebview();
        console.log("HERE")

        webviewView.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'fetch':
                    vscode.commands.executeCommand("lyjain.fetch", message.url)
                    break;
                case 'runTestCases':
                    vscode.window.showInformationMessage('Running test cases...');
                    break;
            }
        });
    }

    getHtmlForWebview() {
        const htmlPath = path.join(__dirname, 'webview', 'index.html');
        const htmlContent = fss.readFileSync(htmlPath, 'utf8');
        return htmlContent;
    }

}
module.exports = {
    activate,
    deactivate
};
