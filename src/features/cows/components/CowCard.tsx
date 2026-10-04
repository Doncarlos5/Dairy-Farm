// src/features/cows/components/CowCard.tsx
export function CowCard({ cow }: { cow: any }) {
  return <div className="p-4 border rounded">{cow.name}</div>;
}
