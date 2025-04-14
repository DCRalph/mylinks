import RoadmapItem from "./RoadmapItem";

export interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "planned";
  icon: JSX.Element;
}

interface ComingSoonSectionProps {
  features: RoadmapFeature[];
}

export default function ComingSoonSection({
  features,
}: ComingSoonSectionProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-24 sm:px-8 lg:px-12">
      <div className="mb-12 text-center">
        <h2 className="sora mb-4 text-3xl font-bold text-white sm:text-4xl">
          Coming Soon
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          We&apos;re constantly improving. Check out what&apos;s on our roadmap.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="divide-y divide-zinc-800">
          {features.map((feature) => (
            <RoadmapItem
              key={feature.id}
              title={feature.title}
              description={feature.description}
              status={feature.status}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
