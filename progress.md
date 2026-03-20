Original prompt: I did a redesign, can we look thru the css and adapt it to all the game, you can keep the text the same but the styling and look with the screen shots and code and stuff

- Reviewed redesign references in `/Users/blahz/Documents/social/swfift/potholes/stitch (3)` and `/Users/blahz/Documents/social/swfift/potholes/stitch`.
- Current app uses a fantasy theme already, but it does not match the new "Royal Tournament / Gilded Quest" direction.
- Planned migration:
  - replace the broken font setup with Epilogue + Manrope + Space Grotesk
  - restyle shared shell/header/footer and global tokens
  - reshape intro into the new hero + rule-card + stage-preview layout
  - restyle playing, scored, leaderboard, archives, and history screens to match the redesign language

- Implemented:
  - migrated the global visual system in `src/styles/globals.css`
  - rebuilt the intro screen in `src/components/GameContainer.tsx` into the new hero/rules/stage layout
  - updated the header into a more editorial nav + score/date treatment
  - rethemed playing, scored, leaderboard, past quests, submit panel, and history pages
  - switched leaderboard rank display to ordinal labels instead of emoji medals

- Verification:
  - `npm run lint` passed
  - `npm run build` passed
  - visually checked intro, playing, scored, leaderboard, and history screens in the browser

- Notes:
  - local testing added new entries to `db/visitors.json`; keep that out of any commit unless you explicitly want fixture/history data committed
