import { type IconType } from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  imageUrl?: string;
  detailedDescription?: string;
}

interface FeatureCardProps {
  feature: Feature;
  onOpenModal: (feature: Feature) => void;
}

export function FeatureCard({ feature, onOpenModal }: FeatureCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-sm">
      <div className={`mb-4 w-fit rounded-full ${feature.iconBgColor} p-3`}>
        {feature.icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
      <p className="text-zinc-400">{feature.description}</p>

      {/* Feature Screenshot - Clickable */}
      <div
        className="mt-6 aspect-video w-full cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 transition-all hover:border-zinc-700 hover:opacity-90"
        onClick={() => onOpenModal(feature)}
      >
        {feature.imageUrl ? (
          <Image
            src={feature.imageUrl}
            alt={`${feature.title} interface`}
            width={800}
            height={450}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <p className="text-sm text-zinc-500">
              {feature.title} interface screenshot
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
