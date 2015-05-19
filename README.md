# YouShouldUse

:bread: YouShouldUse adds comments to GitHub pull requests for CSS code that breaks
browser compatibility. :bread:

## How to add it to your project

1. Go to Settings, Webhooks & Services, Add Webhook
2. Payload URL: `http://youshoulduse.herokuapp.com/hook`
3. Add webhook

## How it works

When you push code to your repository, YouShouldUse scans CSS files in the new
commits.

YouShouldUse runs doiuse against the CSS files in the pull request and adds a
comment with the report results. 
