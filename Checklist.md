# Testing Checklist

Since both frameworks don't support E2E testing, we have to manually test the bots before approving the prod. This is a list of commands to run to ensure everything is working.

### Success

- `/globalping ping google.com from New york`
- `/globalping ping google.com from london --limit 16 --packets 16`

- `/globalping ping 1.1.1.1 from new york, london, eu --limit 2`

- `/globalping ping google.com`
- `/globalping ping google.com --limit 2 --packets 2`

- `/globalping traceroute google.com from new york, world`
- `/globalping traceroute google.com from new york, world --limit 2 --protocol tcp --port 33434`

- `/globalping dns google.com from new york, united kingdom`
- `/globalping dns google.com from new york, 40676 --limit 2 --query A --port 53 --protocol udp --resolver 1.1.1.1 --trace`

- `/globalping mtr google.com from new york, united kingdom`
- `/globalping mtr google.com from new york, world --limit 2 --protocol tcp --port 33434`

- `/globalping http google.com from new york, world`
- `/globalping http google.com from new york, world --limit 2 --protocol https --port 443 --method HEAD --path / --query a=1 --header Content-Type: text/html; charset=UTF-8 --header Accept-CH: Viewport-Width, Width`

- `/globalping help`
- `/globalping ping --help`
- `/globalping traceroute --help`
- `/globalping dns --help`
- `/globalping mtr --help`
- `/globalping http --help`

### Error

- `/globalping ping google.com from london --limit -1` - Validation error
- `/globalping ping badtarget --limit 2` - Validation error
- `/globalping ping google.com --packets 17` - Validation error
- `/globalping ping google.com from new york, london --packets 0` - Validation error

- `/globalping ping google.com from badprobe` - No probes found at badprobe
- `/globalping ping 1.1.1.1 from new york, london, badprobe --limit 2` - No probes found at badprobe
- `/globalping ping 1.1.1.1 from new york, --limit 2`
- `/globalping ping google.com from eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu --limit 2` - Too many locations

- `/globalping` - Invalid command format
- `/globalping badcmd` - Invalid command format
- `/globalping google.com from london` - Invalid command format
- `/globalping ping google.com badfrom london --limit 2` - Invalid command format
- `/globalping ping google.com from` - Invalid command format
- `/globalping ping google.com from --limit 2` - Invalid command format

- `/globalping badcmd google.com from london --limit 2` - Invalid argument error

- `/globalping ping google.com from world --badflag` - Invalid option
- `/globalping ping google.com from world --badflag 1 --limit 2` - Invalid option
- `/globalping mtr google.com from new york, world --limit 2 --protocol badprotocol`

- `/globalping badcmd --help` - Unknown command

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
