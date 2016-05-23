var express = require('express');
var Client = require('node-rest-client').Client;
var app = express();
var StringDecoder = require('string_decoder').StringDecoder;

var file = require("fs");
var http = require('http');
var url = require('url');

if ( process.env.JENKINS_URL == undefined ||
     process.env.JENKINS_USER == undefined ||
     process.env.JENKINS_PASSWORD == undefined ) {

     console.log("ERROR: set enviroment variable JENKINS_URL, JENKINS_USER and JENKINS_PASSWORD");
     process.exit(1);
}

var jenkinsURL = process.env.JENKINS_URL;
var jenkinsUser = process.env.JENKINS_USER;
var jenkinsPassword = process.env.JENKINS_PASSWORD;

var options_auth = { user: jenkinsUser, password: jenkinsPassword };

var client = new Client(options_auth);

app.get('/', function (request, response){
    file.readFile('jenkinsdemo.html', function (err, html) {
        if (err) {
            console.log("ERROR reading jenkinsdemo.html");
        }  
        response.writeHeader(200, {"Content-Type": "text/html"});
        response.write(html);  
        response.end();  
    });    
});


app.get('/createJenkinsBuild', function(request, response) {
    var query = url.parse(request.url,true).query;
    var gitHubURL = query.gitHubURL;
    console.log(query);
    client.get(jenkinsURL + "/crumbIssuer/api/xml", function (data, response) { 
        crumb = data;
        console.log("Configuring pipeline");
        console.log("=======================");
        console.log(data);
        var crumbStr = data.defaultCrumbIssuer.crumb[0];

        var payload = "<?xml version='1.0' encoding='UTF-8'?><flow-definition plugin='workflow-job@2.1'>  <description></description>  <keepDependencies>false</keepDependencies>  <properties>    <com.coravy.hudson.plugins.github.GithubProjectProperty plugin='github@1.19.0'>      <projectUrl>"+gitHubURL+"</projectUrl>      <displayName></displayName>    </com.coravy.hudson.plugins.github.GithubProjectProperty>  </properties>  <definition class='org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition' plugin='workflow-cps@2.2'>    <scm class='hudson.plugins.git.GitSCM' plugin='git@2.4.4'>      <configVersion>2</configVersion>      <userRemoteConfigs>        <hudson.plugins.git.UserRemoteConfig>          <url>"+gitHubURL+"</url>        </hudson.plugins.git.UserRemoteConfig>      </userRemoteConfigs>      <branches>        <hudson.plugins.git.BranchSpec>          <name>*/master</name>        </hudson.plugins.git.BranchSpec>      </branches><doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations><submoduleCfg class='list'/><extensions/> </scm>    <scriptPath>Jenkinsfile</scriptPath>  </definition>  <triggers/></flow-definition>";
        var args = {
            headers: { "Content-Type": "application/xml", "Jenkins-Crumb" : crumbStr },
            data: payload    
        };            
        client.post(jenkinsURL + "/createItem?name=" + query.jobName, args, function( data, response ) {
            console.log(data);
            var decoder = new  StringDecoder('utf8');
            console.log(decoder.write(data));
        }).on('error', function(e) {
            console.log("Error while reading container jenkinsURL", e);
        });    
        
            
    }).on('error', function(e) {
        console.log("Error while reading container jenkinsURL", e);
    }); 
    response.end();
});

app.get('/startJenkinsBuild', function(request, response) {
    var query = url.parse(request.url,true).query;
    var gitHubURL = query.gitHubURL;
    var query = url.parse(request.url,true).query;
    console.log( "IN startJenkinsBuild : " + query);
     client.get(jenkinsURL + "/crumbIssuer/api/xml", function (data, response) { 
        crumb = data;
        console.log("Building pipeline");
        console.log("=======================");
        console.log(data);
        var crumbStr = data.defaultCrumbIssuer.crumb[0];

        var payload = "<?xml version='1.0' encoding='UTF-8'?><flow-definition plugin='workflow-job@2.1'>  <description></description>  <keepDependencies>false</keepDependencies>  <properties>    <com.coravy.hudson.plugins.github.GithubProjectProperty plugin='github@1.19.0'>      <projectUrl>"+gitHubURL+"</projectUrl>      <displayName></displayName>    </com.coravy.hudson.plugins.github.GithubProjectProperty>  </properties>  <definition class='org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition' plugin='workflow-cps@2.2'>    <scm class='hudson.plugins.git.GitSCM' plugin='git@2.4.4'>      <configVersion>2</configVersion>      <userRemoteConfigs>        <hudson.plugins.git.UserRemoteConfig>          <url>"+gitHubURL+"</url>        </hudson.plugins.git.UserRemoteConfig>      </userRemoteConfigs>      <branches>        <hudson.plugins.git.BranchSpec>          <name>*/master</name>        </hudson.plugins.git.BranchSpec>      </branches><doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations><submoduleCfg class='list'/><extensions/> </scm>    <scriptPath>Jenkinsfile</scriptPath>  </definition>  <triggers/></flow-definition>";
        var args = {
            headers: { "Content-Type": "application/xml", "Jenkins-Crumb" : crumbStr },
            data: payload    
        }; 
    client.post(jenkinsURL + "job/" + query.jobName + "/build",args ,function (data, response) {
        crumb = data;
        console.log(crumb);
        
        var decoder = new  StringDecoder('utf8');    
        console.log(decoder.write(data));
    });
            
    }).on('error', function(e) {
        console.log("Error while reading container jenkinsURL", e);
    });    
    response.end();
});
var server = app.listen(5000, function () {
  var port = server.address().port;

  console.log("Example app listening at localhost",port)

})
