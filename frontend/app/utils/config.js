const BASE_URL = "https://localhost:3000/api"

export const DEV_MODE = true;
export const DEMO_MODE = true;

export const API = {
  nasa: `${BASE_URL}/nasa`,
  profile: `${BASE_URL}/profile`,
  retroMachine: `${BASE_URL}/retro-machine`,
  storyOfTheDay: `${BASE_URL}/story-of-the-day`,
  digitalSignpost: `${BASE_URL}/digitalSignpost`,
  retroVotesGet: `${BASE_URL}/retro-machine/retroVotesGet`,
  retroVotesPost: `${BASE_URL}/retro-machine/retroVotesPost`,
  storyVotesGet: `${BASE_URL}/story-of-the-day/storyVotesGet`,
  storyVotesPost: `${BASE_URL}/story-of-the-day/storyVotesPost`,
  untruthVotesPost: `${BASE_URL}/untruth-votes`,
  untruthLimitLog: `${BASE_URL}/untruth-limit-log`,
  getToken: `${BASE_URL}/get-token`
}
