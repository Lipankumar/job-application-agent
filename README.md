# job-application-agent

## Configuration

Copy `.env.example` to `.env` and fill in your candidate details and Naukri
credentials. Personal and professional details are read from environment
variables; `src/config/candidate.json` contains reusable skills, roles, and
preferences. Keep `.env` private.

## Job platforms

Discovery currently includes Naukri and Hirist.tech and filters listings to
the configured recent-job window. Set `ENABLE_NAUKRI` and `ENABLE_HIRIST` in
`.env` to `true` or `false` to choose which platforms are searched. Both are
enabled by default. If both are disabled, the run reports that no platform is
enabled and returns without opening a browser. During applications, each platform source
gets its own Chrome tab. To add another platform, add its discovery adapter to
the platform registry in `src/jobs/discovery/jobDiscovery.js`; application
tabs are allocated automatically by the job's `source` value.

Hirist job discovery uses public listings and does not block on sign-in. If a
Hirist application requires authentication, the agent uses the configured Chrome
profile, so sign in to Hirist there once and keep that profile available.

By default, the agent uses its own persistent Chrome profile in `data/browser-profile`.
To reuse your regular Chrome login, set `BROWSER_USER_DATA_DIR` in `.env` to your
Chrome user data directory (for Linux, `~/.config/google-chrome`) and close all
Chrome windows before starting the agent. Chrome cannot safely open the same
profile in two running processes.
