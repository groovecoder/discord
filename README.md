# YouShouldUse

YouShouldUse adds comments to GitHub pull requests for CSS code that breaks
browser compatibility.

## How to add it to your project

1. Go to Settings, Webhooks & Services, Add Webhook
2. Payload URL: `http://youshoulduse.herokuapp.com/hook`
3. Add webhook

## How it works

When you push code to your repository, YouShouldUse scans CSS files in the new
commits.

YouShouldUse runs doiuse against the CSS files in the pull request and adds a
comment with the report results.

## Configuration

To target only specific browsers, add a `.doiuse` file to the root of your
repository with autoprefixer-like format. For example:

`ie >= 8, > 1%`

If no `.doiuse` file is present, YouShouldUse will default to testing against
the two most recent versions of popular browsers.

## Reporting problems

YouShouldUse is under heavy development. Please [report any problems on GitHub](https://github.com/mdn/YouShouldUse/issues).
