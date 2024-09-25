type Icon = {
  name: string;
  icon: string;
};

const defualtIcon: Icon = {
  name: "Generic",
  icon: "generic.png",
};

const Icons: Icon[] = [
  defualtIcon,
  {
    name: "Github",
    icon: "github.png",
  },
  {
    name: "Instagram",
    icon: "instagram.png",
  },
  {
    name: "Linkedin",
    icon: "linkedin.png",
  },
  {
    name: "Twitter old",
    icon: "twitter.svg",
  },
  {
    name: "X",
    icon: "x(twitter).png",
  },
  {
    name: "Youtube",
    icon: "youtube.png",
  },
  {
    name: "Snapchat",
    icon: "snapchat.png",
  },
  {
    name: "Discord",
    icon: "discord.png",
  },
];

export { defualtIcon, Icons };
