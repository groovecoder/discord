## Note: Project Suspended
This project has been on hiatus since Feb, 2016. While this README will still work, you should not expect any timely responses from the project maintainers.

If you would like to take over maintenance of this project, please file an issue for us to discuss.

[![Build Status](https://travis-ci.org/mdn/discord.svg?branch=master)](https://travis-ci.org/mdn/discord)

Discord analyzes GitHub pull requests and adds comments about incompatible CSS.

## Installation

Follow these instructions to add Discord to your GitHub repository:

1. Navigate to *Settings* > *Webhooks and Services*
2. Add a webhook
    * Enter `http://mdn-discord.herokuapp.com/hook` as the Payload URL
    * Choose to select individual events. Ensure only *Pull Request* is
      selected.
    * Leave all other settings at their default values

## Configuration

To target specific browsers, add a `.discord` file to the root of your
repository with [Browserslist queries](https://github.com/ai/browserslist#queries).
For example:

`ie >= 8, > 1%`

Criteria can be separated by commas, newlines, or both.

Stylesheets will be tested against browsers that match *any* of the criteria.
If the `.discord` file is empty or not present, Discord will default to testing
against the two most recent versions of all supported browsers.

## Testing

See [TESTING.md](docs/TESTING.md) for more information.

## Reporting problems

Discord is under development. Please [report any problems on GitHub](https://github.com/mdn/discord/issues).
