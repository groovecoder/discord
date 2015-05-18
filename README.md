# GitHub-Todo

GitHub-Todo creates GitHub issues for every "TODO:" that you commit to your
GitHub repostiory.

## How to add it to your project

1. Go to Settings, Webhooks & Services, Add Webhook
2. Payload URL: `http://github-todo-issue.herokuapp.com/hook`
3. Default options are fine
4. Add webhook

## How it works

When you push code to your repository, Github-Todo scans the files in the new
commits.

For every `TODO:` line in a file, it creates a new GitHub issue with a title
matching the text following "`TODO:`"

Note: Don't change the title of the created issues. GitHub-Todo uses them to
keep from duplicating issues.

# Disclamer

This code is in no way affiliated with Github. Please file issues in this repo.
Don't complain to Github if this breaks.

# Our own TODOs

* [ ] TODO: Pass jshint

