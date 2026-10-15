# User Prompts Log

This document records all user prompts submitted during the development of the SG BusLive (Singapore Bus Arrival & Tracking) project.

---

## Prompt 1: Initial Frontend Application

**Date/Time:** 2026-10-14T23:39:11-07:00

```text
build a singapore based bus arrival time application which tracks real time bus locations and provides accurate wait time predictions for all LTA bus stops

build just the front end for now, i will include the backend connection later
```

---

## Prompt 2: GitHub Repository Push

**Date/Time:** 2026-10-14T23:49:33-07:00

```text
git push https://<REDACTED_GITHUB_PAT>@https://github.com/jiatongng-afk/lta-bus-arrival.git
```

---

## Prompt 3: Serverless LTA DataMall Endpoints

**Date/Time:** 2026-10-15T00:06:19-07:00

```text
add a serverless connection that pulls live data from LTA datamall using the following endpoints:

- store this in /api folder (project root level) not the src folder
- include /health.ts and /busarrival.ts within that subfolder
- do not hardcode any key, i will include them later

GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
# AccountKey: <LTA_ACCOUNT_KEY>
# accept: application/json
```

---

## Prompt 4: Gather Prompts into Markdown

**Date/Time:** 2026-10-15T00:54:21-07:00

```text
gather all the prompts i given so far into prompt.md file
```
