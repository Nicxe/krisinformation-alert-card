const config = require("@nicxe/semantic-release-config")({
  kind: "assets",
  projectName: "Krisinformation Alert Card",
  repoSlug: "Nicxe/krisinformation-alert-card",
  assets: [
    {
      path: "krisinformation-alert-card.js",
      label: "krisinformation-alert-card.js"
    }
  ]
}
);

const githubPlugin = config.plugins.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "@semantic-release/github"
);

if (githubPlugin?.[1]) {
  githubPlugin[1].successCommentCondition = false;
}

module.exports = config;
