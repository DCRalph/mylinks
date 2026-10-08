const badSlugs = [
  "dashboard",
  "settings",
  "admin",
  "api",
  "auth",
  "me",
  "p",
  "_next",
  "profile",
  "robots.txt",
  "favicon.ico",
];
const badUsernames = [
  "unknown",
  "admin",
  "moderator",
  "mod",
  "administrator",
  "root",
  "superuser",
  "user",
  "users",
  "me",
];

const badWords = {
  badSlugs,
  badUsernames,
};

export default badWords;
