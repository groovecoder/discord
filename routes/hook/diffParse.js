'use strict';

function lineToIndex(diff, lineNumber) {
    var diffIndexes = diff.split('\n');
    var numLines = diffIndexes.length;
    var currentLine = 0;
    var currentIndex, firstChar;

    for (var i = 0; i < numLines; i++) {
        currentIndex = diffIndexes[i];
        firstChar = currentIndex.substring(0, 1);

        if (firstChar !== '-') {
            currentLine++;
        }
        if (firstChar === '@') {
            currentLine = currentIndex.split('+')[1].split(',')[0];
        }
        if (currentLine === lineNumber) {
            if (firstChar === '+') {
                return i + 1; //cause GitHub seems to start file indexes at 1 instead of 0. Oh Well.
            } else {
                return -1;
            }
        }
    }
    return -1;
}

exports.lineToIndex = lineToIndex;
