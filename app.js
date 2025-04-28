// Function to load JSON data from a file
async function loadJSON(filePath) {
    try {
        const response = await fetch(filePath); // Fetch data from the specified file path
        if (!response.ok) {
            // Log status and statusText for more specific error info
            console.error(`Fetch failed for ${filePath}: ${response.status} ${response.statusText}`);
            throw new Error(`Network response was not ok for ${filePath}: ${response.statusText}`);
        }
        return await response.json(); // Parse and return the JSON data
    } catch (error) {
        // Log the full error object for detailed inspection
        console.error(`Problem loading or parsing ${filePath}:`, error);
        return null; // Return null or handle the error appropriately
    }
}

// Function to clean a single word by removing numbers and unwanted punctuation
function cleanWord(word) {
    const allowedCharacters = /[^A-Za-zŽŪūŠš\-'‘]+/g;  // Added apostrophe variant ‘
    return word.replace(allowedCharacters, '');    // Remove anything that's not allowed
}

// Function to replace "v" with "Ū" and "x" with "Š" in the input
function replaceSpecialChars(input) {
    return input.replace(/v/g, 'ū').replace(/x/g, 'š').replace(/V/g, 'Ū').replace(/X/g, 'Š').replace(/q/g, 'c').replace(/Q/g, 'C');  // Replace 'v' with 'Ū' and 'x' with 'Š'
}

// Function to progressively shorten a word to find the best match (shortest word)
// Changed to return the LONGEST match starting with the prefix
function findBestPrefixMatch(word, jsonData) {
    let currentWord = word;
    let matches = [];

    while (currentWord.length > 0) {
        matches = jsonData.filter(entry => {
            // Match only if the entry has no spaces and starts with the currentWord prefix
            return entry.Words.indexOf(' ') === -1 && entry.Words.toUpperCase().startsWith(currentWord.toUpperCase());
        });

        if (matches.length > 0) {
            // If matches are found for this prefix, return the one with the longest 'Words' property
            return matches.reduce((longest, current) => {
                return current.Words.length > longest.Words.length ? current : longest;
            });
        }
        // Remove the last character and try again
        currentWord = currentWord.slice(0, -1);
    }

    return null; // Return null if no match was found at any prefix length
}

// Function to find an exact match for a phrase (can be multi-word)
function findExactPhraseMatch(phrase, jsonData) {
    return jsonData.find(entry => entry.Words.toUpperCase() === phrase.toUpperCase());
}

// --- Core Processing Function ---
// This function takes the input words, JSON data, and output elements
// It performs the matching and updates the DOM for one dictionary
function processAndDisplayMatches(originalWords, jsonData, outputDiv, allMatchesDiv) {
    let allMatches = []; // Array to store matches for this dictionary
    const lineDiv = document.createElement('div'); // Create a container for the line output

    originalWords.forEach((originalWord, index) => {
        let cleanedWord = cleanWord(originalWord);

        if (cleanedWord === "") {
            // Optionally add placeholder for spacing or skip
            lineDiv.appendChild(document.createTextNode(originalWord + ' '));
            return;
        }

        let exactMatch = findExactPhraseMatch(cleanedWord, jsonData);
        let bestPrefixMatch = null;
        let pairedMatch = null;
        let threeWordMatch = null;
        let fourWordMatch = null;
        let isPartialMatch = false;

        if (!exactMatch) {
            bestPrefixMatch = findBestPrefixMatch(cleanedWord, jsonData);
            isPartialMatch = !!bestPrefixMatch;
        }

        // Check for multi-word phrases starting from the current word
        // Paired Match (word i, word i+1)
        if (index < originalWords.length - 1) {
            const nextWordClean = cleanWord(originalWords[index + 1]);
            if (nextWordClean !== "") {
                pairedMatch = findExactPhraseMatch(`${cleanedWord} ${nextWordClean}`, jsonData);
            }
        }

        // Three Word Match (word i, i+1, i+2)
        if (index < originalWords.length - 2) {
            const nextWord1Clean = cleanWord(originalWords[index + 1]);
            const nextWord2Clean = cleanWord(originalWords[index + 2]);
            if (nextWord1Clean !== "" && nextWord2Clean !== "") {
                threeWordMatch = findExactPhraseMatch(`${cleanedWord} ${nextWord1Clean} ${nextWord2Clean}`, jsonData);
            }
        }

        // Four Word Match (word i, i+1, i+2, i+3)
        if (index < originalWords.length - 3) {
            const nextWord1Clean = cleanWord(originalWords[index + 1]);
            const nextWord2Clean = cleanWord(originalWords[index + 2]);
            const nextWord3Clean = cleanWord(originalWords[index + 3]);
            if (nextWord1Clean !== "" && nextWord2Clean !== "" && nextWord3Clean !== "") {
                fourWordMatch = findExactPhraseMatch(`${cleanedWord} ${nextWord1Clean} ${nextWord2Clean} ${nextWord3Clean}`, jsonData);
            }
        }

        // --- Create Span and Tooltip ---
        const span = document.createElement('span');
        span.className = 'tooltip word';
        span.innerText = originalWord;

        const tooltipText = document.createElement('span');
        tooltipText.className = 'tooltiptext';
        let tooltipContent = '';

        // Determine primary match for display (Exact > Best Prefix)
        const primaryMatch = exactMatch || bestPrefixMatch;

        if (primaryMatch) {
            if (isPartialMatch && !exactMatch) {
                tooltipContent += `<span style="color:red;">${primaryMatch.Words}</span> : ${primaryMatch.Definition}`; // Partial match in red
                allMatches.push(`<span style="color:red;">${primaryMatch.Words}</span> : ${primaryMatch.Definition}`);
            } else {
                tooltipContent += `${primaryMatch.Words} : ${primaryMatch.Definition}`; // Exact match
                allMatches.push(`${primaryMatch.Words} : ${primaryMatch.Definition}`);
            }
        } else {
            tooltipContent += 'No single match found';
        }

        // Append multi-word matches to tooltip and allMatches
        if (pairedMatch) {
            tooltipContent += `<br><br><span style="color:blue;">${pairedMatch.Words}</span> : ${pairedMatch.Definition}`;
            allMatches.push(`<span style="color:blue;">${pairedMatch.Words}</span> : ${pairedMatch.Definition}`);
        }
        if (threeWordMatch) {
            tooltipContent += `<br><br><span style="color:green;">${threeWordMatch.Words}</span> : ${threeWordMatch.Definition}`;
            allMatches.push(`<span style="color:green;">${threeWordMatch.Words}</span> : ${threeWordMatch.Definition}`);
        }
        if (fourWordMatch) {
            tooltipContent += `<br><br><span style="color:orange;">${fourWordMatch.Words}</span> : ${fourWordMatch.Definition}`;
            allMatches.push(`<span style="color:orange;">${fourWordMatch.Words}</span> : ${fourWordMatch.Definition}`);
        }

        tooltipText.innerHTML = tooltipContent;
        span.appendChild(tooltipText);
        lineDiv.appendChild(span);
        lineDiv.appendChild(document.createTextNode(' ')); // Add space
    });

    // Append the processed line to the outputDiv
    outputDiv.appendChild(lineDiv);

    // Return all matches found for this line/dictionary
    return allMatches;
}

// --- Form Submission Handler ---
document.getElementById('manchuForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    let input = document.getElementById('inputString').value;
    input = replaceSpecialChars(input);
    const lines = input.split('\n');

    // Get references to output elements for both columns
    const outputDivEn = document.getElementById('output');
    const allMatchesDivEn = document.getElementById('allMatches');
    const outputDivPh2 = document.getElementById('outputPh2');
    const allMatchesDivPh2 = document.getElementById('allMatchesPh2');

    // Clear previous results
    outputDivEn.innerHTML = '';
    allMatchesDivEn.innerHTML = '';
    outputDivPh2.innerHTML = '';
    allMatchesDivPh2.innerHTML = '';
    document.getElementById('sourcePh2').innerText = ''; // Clear second source

    // Load both JSON data files concurrently
    const [jsonDataEn, jsonDataPh2] = await Promise.all([
        loadJSON('words_28April2025.json'),
        loadJSON('db_ph2.json')
    ]);

    // Check if data loading failed
    if (!jsonDataEn) {
        outputDivEn.innerText = 'Error loading English dictionary.';
    }
    if (!jsonDataPh2) {
        outputDivPh2.innerText = 'Error loading Chinese dictionary.';
         document.getElementById('sourcePh2').innerText = ''; // Ensure no source if data fails
    } else {
        // Optionally add source info for the second dictionary if it loaded
         document.getElementById('sourcePh2').innerText = ' | Source 2: [Add Source Info for db_ph2.json]';
    }

    // --- Process lines for both dictionaries ---
    let allMatchesCombinedEn = [];
    let allMatchesCombinedPh2 = [];

    lines.forEach((line) => {
        const originalWords = line.trim().split(/\s+/).filter(w => w); // Trim line and filter empty strings
        if (originalWords.length === 0) {
             // Add empty lines if needed or just skip
             outputDivEn.appendChild(document.createElement('div'));
             outputDivPh2.appendChild(document.createElement('div'));
             return;
        }

        // Process for English Dictionary
        if (jsonDataEn) {
            const matchesEn = processAndDisplayMatches(originalWords, jsonDataEn, outputDivEn, allMatchesDivEn);
            allMatchesCombinedEn.push(...matchesEn);
        }

        // Process for Chinese Dictionary (db_ph2.json)
        if (jsonDataPh2) {
            const matchesPh2 = processAndDisplayMatches(originalWords, jsonDataPh2, outputDivPh2, allMatchesDivPh2);
            allMatchesCombinedPh2.push(...matchesPh2);
        }
    });

    // --- Display all matches collected below the interactive text ---
    // Display English matches
    allMatchesCombinedEn.forEach(match => {
        const matchDiv = document.createElement('div');
        matchDiv.innerHTML = match;
        matchDiv.style.textAlign = "left";
        allMatchesDivEn.appendChild(matchDiv);
    });

    // Display Chinese matches
    allMatchesCombinedPh2.forEach(match => {
        const matchDiv = document.createElement('div');
        matchDiv.innerHTML = match;
        matchDiv.style.textAlign = "left";
        allMatchesDivPh2.appendChild(matchDiv);
    });
});

// Remove or modify the Enter key listener for the textarea if multi-line input is desired
document.getElementById('inputString').addEventListener('keydown', function(event) {
    // Example: Allow Shift+Enter for new line, Enter for submit
    // if (event.key === 'Enter' && !event.shiftKey) {
    //     event.preventDefault();
    //     document.getElementById('manchuForm').dispatchEvent(new Event('submit'));
    // }
    // Current behavior: Enter submits, preventing easy multi-line input
     if (event.key === 'Enter') {
         event.preventDefault(); // Prevent the default behavior of adding a new line
         document.getElementById('manchuForm').dispatchEvent(new Event('submit')); // Trigger form submission
     }
});
