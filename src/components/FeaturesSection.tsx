import { useState } from "react";
import {
  IconLink,
  IconExternalLink,
  IconBrandGithub,
} from "@tabler/icons-react";
import { FeatureCard, type Feature } from "./FeatureCard";
import { FeatureModal } from "./FeatureModal";

// Define all features in one place
export const features: Feature[] = [
  {
    id: "custom-links",
    title: "Custom Short Links",
    description:
      "Create branded, memorable links that are easy to share and remember.",
    icon: <IconLink className="h-6 w-6 text-blue-400" />,
    iconBgColor: "bg-blue-500/10",
    iconTextColor: "text-blue-400",
    imageUrl: undefined,
    detailedDescription:
      "Custom short links allow you to create professional, branded URLs that reflect your brand identity. You can customize the link path, track performance metrics, and update destinations anytime without changing the short link.",
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    description:
      "Track clicks, geographic data, devices, and referrers in real-time.",
    icon: <IconExternalLink className="h-6 w-6 text-indigo-400" />,
    iconBgColor: "bg-indigo-500/10",
    iconTextColor: "text-indigo-400",
    imageUrl: undefined,
    detailedDescription:
      "Our powerful analytics dashboard gives you real-time insights into your link performance. Track clicks, geographic locations, devices, referral sources, and conversion rates to optimize your marketing campaigns.",
  },
  {
    id: "bookmarks",
    title: "Bookmark Manager",
    description:
      "Organize and manage your links with tags, folders, and search functionality.",
    icon: <IconBrandGithub className="h-6 w-6 text-green-400" />,
    iconBgColor: "bg-green-500/10",
    iconTextColor: "text-green-400",
    imageUrl: "/homePage/bookmarks.png",
    detailedDescription:
      "Keep all your important links organized in one place with our bookmark manager. Add tags, create folders, and use our powerful search to quickly find what you need. Perfect for research, project management, and personal organization.",
  },
];

export function FeaturesSection() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (feature: Feature) => {
    setSelectedFeature(feature);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12"
    >
      <div className="mb-12 text-center">
        <h2 className="sora mb-4 text-3xl font-bold text-white sm:text-4xl">
          Powerful Features
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          Everything you need to manage, track, and optimize your links
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            onOpenModal={handleOpenModal}
          />
        ))}
      </div>

      <FeatureModal
        feature={selectedFeature}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}
