The development workflow for this project is in flux but this document describes the contribution workflow at this point.

# Setting up your development environment

1. Fork the YouShouldUse repository:  https://github.com/mdn/YouShouldUse
2. Create a heroku account and deploy YouShouldUse to your account.  A helpful guide can be found here:  https://devcenter.heroku.com/articles/getting-started-with-nodejs
3. Within your GitHub Account Settings, go to "Personal Access Tokens" and create a token
4. From the terminal, add your newly created GitHub personal access token to the Heroku config:  heroku config:set OAUTH_TOKEN=#######
5. Create a test repository which you'll send invalid CSS or Stylus files to, which your YouShouldUse instance will evaluate.  Within that repository:
	1. Navigate to *Settings* > *Webhooks and Services*
	2. Click *Add webhook*
	3. Enter `http://{your-heroku-address}.herokuapp.com/hook` as the Payload URL. Leave all
	   other settings at their default values.
	4. Click *Add webhook*

When you commit changes to your test repository, your hook should recognize the changes and execute YouShouldUse on your test repository code!  If warnings are found by YouShouldUse, they will show up as comments within the commit detail screen on GitHub.


# Submitting a pull request

Before submitting a pull request, run the following commands to test your
changes and spruce things up.

1. `npm install`
2. `./gulp test`
3. `./gulp beautify`
