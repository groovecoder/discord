The development workflow for this project is in flux but this document describes
the contribution workflow at this point.

# Setting up your development environment

1. Fork the Discord repository:  https://github.com/mdn/discord
2. Create a heroku account and deploy Discord to your account. A helpful guide
   can be found here:
   https://devcenter.heroku.com/articles/getting-started-with-nodejs
3. Within your GitHub Account Settings, go to "Personal Access Tokens" and
   create a token
4. From the terminal, add your newly created GitHub personal access token to the
   Heroku config:  heroku config:set OAUTH_TOKEN=#######
5. Enable the Heroku PostgreSQL add-on: `heroku addons:create
   heroku-postgresql:hobby-dev`
6. Enable the Heroku Redis add-on (you may need to enter a credit card for
   verification): `heroku addons:create heroku-redis:hobby-dev`
7. Start a worker: `heroku ps:scale worker=1`
8. Create a test repository which you'll send invalid CSS or Stylus files to,
   which your Discord instance will evaluate. Within that repository:
    1. Navigate to *Settings* > *Webhooks and Services*
    2. Add a webhook
        * Enter `http://mdn-discord.herokuapp.com/hook` as the Payload URL
        * Choose to select individual events. Ensure only *Pull Request* is
          selected.
        * Leave all other settings at their default values

When you commit changes to your test repository, your hook should recognize the
changes and execute Discord on your test repository code!  If warnings are found
by Discord, they will show up as comments within the commit detail screen on
GitHub.

# Submitting a pull request

Before submitting a pull request, follow these steps to spruce things up and
test your changes.

1. Run `npm install` to install some dependencies
2. Run `./gulp beautify` to format your code according to our conventions
3. [Run tests](docs/TESTING.md) and verify that they pass
