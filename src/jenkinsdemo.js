var express = require('express');
var Client = require('node-rest-client').Client;
var app = express();
var StringDecoder = require('string_decoder').StringDecoder;

var fs = require("fs");
var http = require('http');
var url = require('url');

if ( process.env.JENKINS_URL == undefined ||
     process.env.JENKINS_USER == undefined ||
     process.env.JENKINS_PASSWORD == undefined ||
     process.env.ARTIFACTORY_URL == undefined ||
     process.env.ARTIFACTORY_USER == undefined ||
     process.env.ARTIFACTORY_PASSWORD == undefined ||
     process.env.DOCKER_HUB_USER == undefined ||
     process.env.DOCKER_HUB_PASSWORD == undefined ) {

     console.log("ERROR: set enviroment variable JENKINS_URL, JENKINS_USER, JENKINS_PASSWORD, ARTIFACTORY_URL, ARTIFACTORY_USER, ARTIFACTORY_PASSWORD, DOCKER_HUB_USER, and DOCKER_HUB_PASSWORD");
     process.exit(1);
}

var jenkinsURL = process.env.JENKINS_URL;
var jenkinsUser = process.env.JENKINS_USER;
var jenkinsPassword = process.env.JENKINS_PASSWORD;

var options_auth = { user: jenkinsUser, password: jenkinsPassword };

var client = new Client(options_auth);

app.get('/', function (request, response){
    fs.readFile('jenkinsdemo.html', function (err, html) {
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
    var pipelineGitUrl = query.configGitHubURL;
    console.log(query);
    client.get(jenkinsURL + "/crumbIssuer/api/xml", function (data, response) {
        crumb = data;
        console.log("Configuring pipeline");
        console.log("=======================");
        console.log(data);
        var crumbStr = data.defaultCrumbIssuer.crumb[0];

        var jobConfig = `<?xml version='1.0' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.1">
  <actions/>
  <description></description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <com.coravy.hudson.plugins.github.GithubProjectProperty plugin="github@1.19.0">
      <projectUrl>${pipelineGitUrl}</projectUrl>
      <displayName></displayName>
    </com.coravy.hudson.plugins.github.GithubProjectProperty>
    <EnvInjectJobProperty plugin="envinject@1.92.1">
      <info>
        <propertiesContent>APPS_COMPOSE=${query.appsCompose}
OPS_COMPOSE=${query.opsCompose}
ARTIFACTORY_URL=${process.env.ARTIFACTORY_URL}
ARTIFACTORY_USER=${process.env.ARTIFACTORY_USER}
ARTIFACTORY_PASSWORD=${process.env.ARTIFACTORY_PASSWORD}
DOCKER_HUB_USER=${process.env.DOCKER_HUB_USER}
DOCKER_HUB_PASSWORD=${process.env.DOCKER_HUB_PASSWORD}</propertiesContent>
        <loadFilesFromMaster>false</loadFilesFromMaster>
      </info>
      <on>true</on>
      <keepJenkinsSystemVariables>true</keepJenkinsSystemVariables>
      <keepBuildVariables>true</keepBuildVariables>
      <overrideBuildParameters>false</overrideBuildParameters>
      <contributors/>
    </EnvInjectJobProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps@2.2">
    <scm class="hudson.plugins.git.GitSCM" plugin="git@2.4.4">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>${pipelineGitUrl}</url>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/master</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="list"/>
      <extensions/>
    </scm>
    <scriptPath>Jenkinsfile</scriptPath>
  </definition>
  <triggers/>
</flow-definition>
`;
        var args = {
            headers: { "Content-Type": "application/xml", "Jenkins-Crumb" : crumbStr },
            data: jobConfig
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
    var query = url.parse(request.url, true).query;
    var gitHubURL = query.gitHubURL;
    console.log("IN startJenkinsBuild");
    console.log(query);

    client.get(jenkinsURL + "/crumbIssuer/api/xml", function (data, response) {
        crumb = data;
        console.log("Building pipeline");
        console.log("=======================");
        console.log(data);
        var crumbStr = data.defaultCrumbIssuer.crumb[0];

        var args = {
            headers: { "Content-Type": "application/xml", "Jenkins-Crumb" : crumbStr }
        };

        client.post(jenkinsURL + "/job/" + query.jobName + "/build", args, function (data, response) {
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

app.get('/deleteStack', function(request, response) {
    var query = url.parse(request.url, true).query;
    var gitHubURL = query.gitHubURL;
    console.log("IN Delete Stack");
    console.log(query);

    client.get(jenkinsURL + "/crumbIssuer/api/xml", function (data, response) {
        crumb = data;
        console.log("Delete Stack");
        console.log("=======================");
        console.log(data);
        var crumbStr = data.defaultCrumbIssuer.crumb[0];

        var args = {
            headers: { "Content-Type": "application/xml", "Jenkins-Crumb" : crumbStr }
        };

        client.post(jenkinsURL + "/job/delete-swarm-stack/buildWithParameters?token=deletetoken&STACK_NAME=" + query.stackName, args, function (data, response) {
            console.log(data);

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
