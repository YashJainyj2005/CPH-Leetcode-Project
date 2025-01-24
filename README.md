# README
Hey,

This is a VS Code extension which enables you to fetch test cases of any Leetcode problem directly into VS Code, using its url, as txt files.
It also allows you to test run your program in any of the most common languages like C++, Python, Java and JavaScript on these fetched test cases and compare your outputs with the original output.

![Demo](images/Demo.gif)

## How to install?
Clone this repository into your local system using the following command:

`git clone https://github.com/YashJainyj2005/CPH-Leetcode-Project.git`

Now run this command to install dependencies:

`npm install`


## How to use?

1. Open the Leetcode problem in your browser and copy its url.
2. Run the extension in VS Code.
3. Open the command pallete (Ctrl/Cmd + Shift + P)
4. Search for the command `CPH: Fetch Test Cases` and select it.
5. Paste the problem url and press enter.

OR to fetch test cases you can also use the new panel created for this extension in the activity bar in VS Code.

6. The test cases are locally saved.
7. To run these search for command `CPH: Run Test Cases` from the command pallete.
8. Results are shown in the console panel.
9. Done
   
![Commands](images/Commands.png)

![Leetcode url](images/Leetcode_url.png)

## Features

**1. Problem URL Fetching**

Enable users to fetch test cases directly from LeetCode problem URLs. The system:

- Parses the problem description to extract the test cases (both input and expected output).
- Handles problems with multiple test cases.
- Stores test cases in a structured format for local testing.

**2. Test Case Storage**

Test cases are stored in a format compatible with the extension in form of .txt files. For example:

- **Input File**: input_1.txt, input_2.txt, etc.
- **Output File**: output_1.txt, output_2.txt, etc.

**3. Code Execution**

Allows the users to:

- Write their code in their preferred programming language.
- Execute their code against the fetched test cases.
- Compare actual outputs with expected outputs.
- Manually edit or add test cases if needed.
- Provides clear error messages when test case fetching fails.

**4. Multi-Language Support**

Provides execution support for commonly used languages, such as:

- C++
- Python
- Java
- JavaScript (using node.js)

**5. GUI for fetching test cases**

Provides a panel to fetch the test cases instead of using the `CPH: Fetch Test Cases` command.

![Fetch_GUI](images/Fetch_GUI.png)

## Requirements

- VS Code for running the extension
- Internet connection for fetching test cases from Leetcode
- node.js for running JavaScript files locally

## Future Scope of Improvements

- Add feature to automatically make program file with snippet from Leetcode by allowing user to choose a language.

- Implement GUI for running test cases as well.

**Enjoy!**
