var lineToIndex = function(diff, lineNumber) {
    var diffIndexes = diff.split('\n');
    var currentLine = 0;
    for (var i = 0; i < diffIndexes.length; i++) {
        var currentIndex = diffIndexes[i];
        if (currentIndex.substring(0, 1) != '-') {
            currentLine++;
        }
        if (currentIndex.substring(0, 1) == '@') {
            var work = currentIndex.split('+');
            currentLine = work[1].split(',')[0];
        }
        if (currentLine == lineNumber) {
            if (currentIndex.substring(0, 1) == '+') {
                return i + 1; //cause GitHub seems to start file indexes at 1 instead of 0. Oh Well.
            } else {
                return -1;
            }
        }
    }
    return -1;
}

module.exports.lineToIndex = lineToIndex;
