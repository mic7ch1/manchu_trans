// Function to load JSON data from a file
function loadJSON(callback) {
    fetch('words.json') // The JSON file should be in the same directory as the app.js file
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json(); // Parse the JSON data
        })
        .then(data => {
            callback(data); // Use the loaded JSON data
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

// Function to clean a single word by removing numbers and unwanted punctuation
function cleanWord(word) {
    const allowedCharacters = /[^A-Za-zŽŪūŠš\-']/g;  // Regular expression to match only allowed characters
    return word.replace(allowedCharacters, '');    // Remove anything that's not allowed
}

// Function to replace "v" with "Ū" and "x" with "Š" in the input
function replaceSpecialChars(input) {
    return input.replace(/v/g, 'ū').replace(/x/g, 'š').replace(/V/g, 'Ū').replace(/X/g, 'Š');  // Replace 'v' with 'Ū' and 'x' with 'Š'
}

// Function to progressively shorten a word to find the best match (shortest word)
function findBestMatch(word, jsonData) {
    let matches = [];
    
    // Keep shortening the word until we either find matches or the word is fully trimmed
    while (word.length > 0) {
        // Find matches in the JSON data for the shortened word
        matches = jsonData.filter(entry => {
            // Match only if the entry has no spaces (single word) and starts with the shortened word
            return entry.Words.indexOf(' ') === -1 && entry.Words.toUpperCase().startsWith(word.toUpperCase());
        });

        if (matches.length > 0) {
            // If we found matches, break out of the loop
            break;
        }
        // Remove the last character of the word and continue searching
        word = word.slice(0, -1);
    }
    
    // If there are matches, return the one with the shortest word
    if (matches.length > 0) {
        return matches.reduce((shortest, current) => {
            return current.Words.length < shortest.Words.length ? current : shortest;
        });
    }
    
    return null;  // Return null if no match was found
}

// Function to find a two-word phrase (exactly one space) in the JSON
function findPairedMatch(word1, word2, jsonData) {
    const pairedWord = `${word1} ${word2}`;  // Create a paired word string (word1 + space + word2)
    
    // Search the JSON data for an exact match with one space
    return jsonData.find(entry => entry.Words.toUpperCase() === pairedWord.toUpperCase());
}

// Function to find a three-word phrase (exactly two spaces) in the JSON
function findThreeWordMatch(word1, word2, word3, jsonData) {
    const threeWordPhrase = `${word1} ${word2} ${word3}`;  // Create a three-word phrase (word1 + space + word2 + space + word3)

    // Search the JSON data for an exact match with two spaces
    return jsonData.find(entry => entry.Words.toUpperCase() === threeWordPhrase.toUpperCase());
}

// Function to find a four-word phrase (exactly three spaces) in the JSON
function findFourWordMatch(word1, word2, word3, word4, jsonData) {
    const fourWordPhrase = `${word1} ${word2} ${word3} ${word4}`;  // Create a four-word phrase (word1 + space + word2 + space + word3 + space + word4)

    // Search the JSON data for an exact match with three spaces
    return jsonData.find(entry => entry.Words.toUpperCase() === fourWordPhrase.toUpperCase());
}

// Function to handle form submission and compare words
document.getElementById('manchuForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from refreshing the page

    let input = document.getElementById('inputString').value;

    // Replace "v" with "Ū" and "x" with "Š"
    input = replaceSpecialChars(input);

    // Split the original input into lines, so we can maintain line breaks
    const lines = input.split('\n');

    const outputDiv = document.getElementById('output');
    const allMatchesDiv = document.getElementById('allMatches');  // Reference to the all matches section
    outputDiv.innerHTML = ''; // Clear previous output
    allMatchesDiv.innerHTML = ''; // Clear previous matches

    let allMatches = [];  // Array to store all matches (full, partial, paired, etc.)

    // Load the JSON data and process it
    loadJSON(function(jsonData) {
        lines.forEach((line) => {
            const lineDiv = document.createElement('div');  // Create a div for each line

            // Split the current line into words
            const originalWords = line.split(/\s+/);

            originalWords.forEach((originalWord, index) => {
                let cleanedWord = cleanWord(originalWord);  // Clean the current word for matching purposes

                // If the cleaned word is empty (due to it being punctuation or invalid), skip it
                if (cleanedWord === "") {
                    return;
                }

                // First, attempt to find an exact match
                let exactMatch = jsonData.find(entry => entry.Words.toUpperCase() === cleanedWord.toUpperCase());

                let match;
                let isPartialMatch = false;  // Flag to indicate a partial match
                if (!exactMatch) {
                    // If no exact match is found, try progressively shortening the word
                    match = findBestMatch(cleanedWord, jsonData);
                    isPartialMatch = true;  // Mark as partial match
                } else {
                    match = exactMatch;
                }

                // Create a span element for the word (show original word, corrected)
                const span = document.createElement('span');
                span.className = 'tooltip word';
                span.innerText = originalWord;  // Display the original word with punctuation and corrections

                const tooltipText = document.createElement('span');
                tooltipText.className = 'tooltiptext';

                // Display the match in the tooltip
                if (match) {
                    if (isPartialMatch) {
                        // If it's a partial match, display the word in red
                        tooltipText.innerHTML = `<span style="color:red;">${match.Words}</span> : ${match.Definition}`;
                        allMatches.push(`<span style="color:red;">${match.Words}</span> : ${match.Definition}`);
                    } else {
                        tooltipText.innerText = match.Words + ' : ' + match.Definition;
                        allMatches.push(`${match.Words} : ${match.Definition}`);
                    }
                } else {
                    tooltipText.innerText = 'No match found';  // If no match is found, show "No match found"
                }

                // Check if there's a word behind (index > 0) and try to match paired word
                if (index > 0) {
                    const precedingWord = cleanWord(originalWords[index - 1]);
                    const pairedMatch = findPairedMatch(precedingWord, cleanedWord, jsonData);

                    // If a paired match is found, append it to the tooltip
                    if (pairedMatch) {
                        tooltipText.innerHTML += `<br><br><span style="color:blue;">${pairedMatch.Words}</span> : ${pairedMatch.Definition}`;
                        allMatches.push(`<span style="color:blue;">${pairedMatch.Words}</span> : ${pairedMatch.Definition}`);
                    }
                }

                // Check if there are two words following the current word (for three-word phrase match)
                if (index < originalWords.length - 2) {
                    const nextWord1 = cleanWord(originalWords[index + 1]);
                    const nextWord2 = cleanWord(originalWords[index + 2]);

                    const threeWordMatch = findThreeWordMatch(cleanedWord, nextWord1, nextWord2, jsonData);

                    // If a three-word match is found, append it to the tooltip
                    if (threeWordMatch) {
                        tooltipText.innerHTML += `<br><br><span style="color:green;">${threeWordMatch.Words}</span> : ${threeWordMatch.Definition}`;
                        allMatches.push(`<span style="color:green;">${threeWordMatch.Words}</span> : ${threeWordMatch.Definition}`);
                    }
                }

                // Check if there are three words behind the current word (for four-word phrase match)
                if (index >= 3) {
                    const prevWord1 = cleanWord(originalWords[index - 1]);
                    const prevWord2 = cleanWord(originalWords[index - 2]);
                    const prevWord3 = cleanWord(originalWords[index - 3]);

                    const fourWordMatch = findFourWordMatch(prevWord3, prevWord2, prevWord1, cleanedWord, jsonData);

                    // If a four-word match is found, append it to the tooltip
                    if (fourWordMatch) {
                        tooltipText.innerHTML += `<br><br><span style="color:orange;">${fourWordMatch.Words}</span> : ${fourWordMatch.Definition}`;
                        allMatches.push(`<span style="color:orange;">${fourWordMatch.Words}</span> : ${fourWordMatch.Definition}`);
                    }
                }

                // Append the tooltip and span to the current line div
                span.appendChild(tooltipText);
                lineDiv.appendChild(span);

                // Add a space between words
                lineDiv.appendChild(document.createTextNode(' '));
            });

            // Append the processed line to the outputDiv
            outputDiv.appendChild(lineDiv);
        });

        // Display all matches below the interactive text
        allMatches.forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.innerHTML = match;
            matchDiv.style.textAlign = "left";  // Align all matches to the left
            allMatchesDiv.appendChild(matchDiv);
        });
    });
});

// Add an event listener to the textarea to submit the form on Enter key press
document.getElementById('inputString').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default behavior of adding a new line
        document.getElementById('manchuForm').dispatchEvent(new Event('submit')); // Trigger form submission
    }
});
