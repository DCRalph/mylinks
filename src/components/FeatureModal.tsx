import { IconX } from "@tabler/icons-react";
import Image from "next/image";
import { type Feature } from "./FeatureCard";

interface FeatureModalProps {
  feature: Feature | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureModal({ feature, isOpen, onClose }: FeatureModalProps) {
  if (!isOpen || !feature) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-zinc-800 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <IconX className="h-5 w-5" />
        </button>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <div className={`w-fit rounded-full ${feature.iconBgColor} p-3`}>
              {feature.icon}
            </div>
            <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
          </div>

          {feature.imageUrl && (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <Image
                src={feature.imageUrl}
                alt={`${feature.title} interface`}
                width={1200}
                height={675}
                className="h-auto w-full"
              />
            </div>
          )}

          <div className="space-y-4">
            <p className="text-zinc-300">{feature.description}</p>

            {feature.detailedDescription && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <h4 className="mb-2 text-lg font-medium text-white">
                  More Details
                </h4>
                <p className="text-zinc-400">{feature.detailedDescription}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
