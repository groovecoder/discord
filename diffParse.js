var lineToIndex = function(diff,lineNumber){
    var diffIndexes = diff.split('\n')
    var currentLine = 0;
    for(var i=0;i<diffIndexes.length;i++){
        var currentIndex = diffIndexes[i];
        console.log(currentIndex);
        if(currentIndex.substring(0,1)!='-'){
          currentLine++;
          console.log('next line '+currentLine);
        }
        if(currentIndex.substring(0,1)=='@'){
          var work = currentIndex.split('+');
          currentLine = work[1].split(',')[0];
          console.log('new start line '+currentLine);
        }
        if(currentLine == lineNumber){
            console.log('found line')
            if(currentIndex.substring(0,1)=='+'){
                console.log('returning')
                return i+1;//cause GitHub seems to start file indexes at 1 instead of 0. Oh Well.
            }else{
                console.log('not changed, returning')
                return -1;
            }
        }
    }
    return -1;
}

module.exports.lineToIndex = lineToIndex
