var request = require('request');
var postcss = require('postcss');
var doiuse = require('doiuse');
var path = require('path');

var token = "token "+process.env.OATH_TOKEN;

var hook = function(req,res,key){
	var localToken = ""
	if(key){
		localToken = "token "+key
	}else{
		localToken = token
	}
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
	parseCSS(newChanges,commitUrl,function(usageInfo){console.log(usageInfo)})

}

var parseCSS = function(commits,commitUrl,cb){
	var comind = 0;
	features = [];
	var commitDone = function(){
		comind--;
		if(comind<1){
			cb(features);
		}
	}
	var addFeature = function(usage){
		features.push(usage)
	}
		
	commits.forEach(function(commit,index){
		comind++;
		if(path.extname(commit)=='.css'){
			var thisUrl=commitUrl+commit
			request({url:thisUrl,headers: {'User-Agent': 'shouldiuse'}}, function(err,res,body){
				var body = JSON.parse(body)
				if(body.type!=="file"){
					commitDone()
				}
				contents= new Buffer(body.content, 'base64')
				contents = contents.toString();
				postcss(doiuse({
					browserSelection: ['ie >= 8', '> 1%'],
					onFeatureUsage: addFeature
				})).process(contents.replace(/\r?\n|\r/g," ")).then(function(res){commitDone()});
			})
		}
	})
}
			
exports.hook = hook

