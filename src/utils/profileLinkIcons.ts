type Icon = {
  name: string;
  icon: string;
};

const defualtIcon: Icon = {
  name: "generic",
  icon: "generic.png",
};

const Icons: Icon[] = [
  defualtIcon,
  {
    name: "github",
    icon: "github.png",
  },
  {
    name: "instagram",
    icon: "instagram.png",
  },
  {
    name: "linkedin",
    icon: "linkedin.png",
  },
  {
    name: "twitter",
    icon: "twitter.svg",
  },
  {
    name: "youtube",
    icon: "youtube.png",
  },
  {
    name: "snapchat",
    icon: "snapchat.png",
  },
];

export { defualtIcon, Icons };
