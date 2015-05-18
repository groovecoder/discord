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

var parseCSS = function(files,commitUrl,cb){
	var comind = 0;
	features = [];
	commitDone = function(usage){
		if(usage){
			features.push(usage)
		}
		if(comind==0){
			cb(features);
		}
	}
	commits.forEach(function(commit,index){
		comind++;
		if(path.extname(commit)=='.css'){
			var thisUrl=url+commit
			request({url:thisUrl,headers: {'User-Agent': 'shouldiuse'}}, function(err,res,body){
				var body = JSON.parse(body)
				if(body.type!=file){
					comind--;
					commitDone()
				}
				contents= new Buffer(body.content, 'base64')
				contents = contents.toString();
				postCSS(doiuse({
					onFeatureUsage: commitDone
				})).process(contents)
			})
		}
	})
}
			
exports.hook = hook

