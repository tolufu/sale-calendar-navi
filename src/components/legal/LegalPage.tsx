import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export function LegalPage({ title, description, sections }: { title: string; description: string; sections: { heading: string; body: string }[] }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.heading}>
            <h2 className="font-bold">{section.heading}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{section.body}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
