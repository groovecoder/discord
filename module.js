var request = require('request');
var postcss = require('postcss');
var doiuse = require('doiuse');
var path = require('path');

var token = "token "+process.env.OAUTH_TOKEN;

var hook = function(req,res){
    var localToken = token
    res.send(200,'{"message":"ok","result":"ok"}');
    github(req.body, localToken);
}

var github = function(payload, localToken){
    // TODO: Only acknowledge pushes to the "Master" branch.
    console.log(payload)
    var commits = payload.commits
    newChanges = []
    commits.forEach(function(commit, index, commits){
        commit.added.forEach(function(add,id){
            if(!(newChanges.indexOf(add)>=0)){
                newChanges.push(add);
            }
        })
        commit.modified.forEach(function(add,id){
            if(!(newChanges.indexOf(add)>=0)){
                newChanges.push(add);
            }
        });
    });
    var commitUrl = payload.repository.contents_url.replace('{+path}','');
    var commentUrl = payload.repository.commits_url.replace('{/sha}','/'+payload.head_commit.id+'/comments');
    parseCSS(newChanges,commitUrl,commentUrl,localToken,function(usageInfo){console.log(usageInfo)})

}

var parseCSS = function(commits,commitUrl,commentUrl,token,cb){
    commits.forEach(function(commit,index){
        if(path.extname(commit)=='.css'){
            var thisUrl=commitUrl+commit
            request({url:thisUrl,headers: {'User-Agent': 'shouldiuse'}}, function(err,res,body){
                var features=[]
                var addFeature=function(feature){
                    renderComment(commentUrl,commit,feature.message,feature.usage.source.start.line,token)
                }
                var body = JSON.parse(body)
                if(body.type!=="file"){
                    return;
                }
                contents= new Buffer(body.content, 'base64')
                postcss(doiuse({
                    browserSelection: ['ie >= 8', '> 1%'],
                    onFeatureUsage: addFeature
                })).process(contents,{from:"/"+commit}).then(function(res){})
            });
        }
    })
}

var renderComment = function(url,file,comment,line,token){
    console.log('renderingcomment')
    console.log(url)
    console.log(file)
    console.log(comment)
    console.log(line)
    console.log(token)
    request({url:url,method:"POST",headers:{"User-Agent":"github-cleanpr", "Authorization": token},body:JSON.stringify({body:comment,path:file,line:line})},function(err,res,body){console.log(err);console.log(body)});
}

exports.hook = hook

