# Testing Checklist

Since both frameworks don't support E2E testing, we have to manually test the bots before approving the prod. This is a list of commands to run to ensure everything is working.

### Success

`/globalping ping google.com from New york`
`/globalping ping google.com from london --limit 16 --packets 16`

`/globalping ping 1.1.1.1 from new york, london, eu --limit 2`

`/globalping ping google.com`
`/globalping ping google.com --limit 2 --packets 2`

`/globalping traceroute google.com from new york, world`
`/globalping traceroute google.com from new york, world --limit 2`

`/globalping dns 1.1.1.1 from new york, united kingdom`
`/globalping dns 1.1.1.1 from new york, 52865 --limit 2`

`/globalping mtr google.com from new york, united kingdom`
`/globalping mtr google.com from new york, world --limit 2`

`/globalping http google.com from new york, world`
`/globalping http google.com from new york, world --limit 2`

`/globalping help`
`/globalping ping --help`
`/globalping traceroute --help`
`/globalping dns --help`
`/globalping mtr --help`
`/globalping http --help`

### Error

`/globalping ping google.com from london --limit -1` - Validation error
`/globalping ping badtarget --limit 2` - Validation error
`/globalping ping google.com --packets 17` - Validation error
`/globalping ping google.com from new york, london --packets 0` - Validation error

`/globalping ping google.com from badprobe` - No probes found at badprobe
`/globalping ping 1.1.1.1 from new york, london, badprobe --limit 2` - No probes found at badprobe
`/globalping ping 1.1.1.1 from new york, --limit 2`
`/globalping ping google.com from eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu --limit 2` - Too many locations

### Environments

Test if commands run successfully in the following places to ensure authentication is correct:

- Public Slack Channel
- Slack DM with Bot

- Private Slack Channel
  - This should prompt a request for the bot to be invited to the channel before continuing.
- Slack DM with yourself
  - This should prompt the user to DM the bot.
- Slack DM with another user / DM group chat
  - This should prompt the user to create a new group chat with the bot.

For the private environments, ensure both API success, error and help commands work.
