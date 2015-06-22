Discord adds comments to GitHub pull requests for CSS code that breaks browser
compatibility.

## Installation

Follow these instructions to add Discord to your GitHub repository.

1. Navigate to *Settings* > *Webhooks and Services*
2. Click *Add webhook*
3. Enter `http://youshoulduse.herokuapp.com/hook` as the Payload URL. Leave all
   other settings at their default values.
4. Click *Add webhook*

## How it works

When you push code to your repository, Discord scans CSS files in the new
commits.

Discord runs doiuse against the CSS files in the pull request and adds a comment
with the report results.

## Configuration

To target only specific browsers, add a `.doiuse` file to the root of your
repository with autoprefixer-like format. For example:

`ie >= 8, > 1%`

If no `.doiuse` file is present, Discord will default to testing against
the two most recent versions of popular browsers.

## Reporting problems

Discord is under heavy development. Please [report any problems on GitHub](https://github.com/mdn/Discord/issues).
