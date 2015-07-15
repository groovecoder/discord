[![Build Status](https://travis-ci.org/mdn/discord.svg?branch=master)](https://travis-ci.org/mdn/discord)

Discord adds comments to GitHub pull requests for CSS code that breaks browser
compatibility.

## Installation

Follow these instructions to add Discord to your GitHub repository.

1. Navigate to *Settings* > *Webhooks and Services*
2. Add a webhook
    * Enter `http://mdn-discord.herokuapp.com/hook` as the Payload URL
    * Choose to select individual events. Ensure only *Pull Request* is
      selected.
    * Leave all other settings at their default values

## How it works

When you push code to your repository, Discord scans CSS files in the new
commits.

Discord runs doiuse against the CSS files in the pull request and adds a comment
with the report results.

## Configuration

To target specific browsers, add a `.doiuse` file to the root of your repository
with autoprefixer-like format. For example:

`ie >= 8, > 1%`

Criteria can be separated by commas, newlines, or both.

Stylesheets will be tested against browsers that match *any* of the criteria.
If the `.doiuse` file is empty or not present, Discord will default to testing
against the two most recent versions of all supported browsers.

## Testing
To run Discord tests, execute the following command:

`npm test`

Discord uses mocha and chai test frameworks.

## Reporting problems

Discord is under heavy development. Please [report any problems on GitHub](https://github.com/mdn/discord/issues).
