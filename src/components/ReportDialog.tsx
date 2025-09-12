import { useState } from "react";
import { z } from "zod";
import { moderationStore, type ReportCategory } from "@/lib/moderation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  category: z.enum(["harassment", "hate_speech", "spam", "sexual_content", "violence", "misinformation", "other"], {
    required_error: "Please select a category",
  }),
  details: z.string().max(500, "Details must be 500 characters or less").optional(),
});

interface ReportDialogProps {
  targetId: string;
  targetType: "user" | "message" | "room";
  reporterUserId?: string;
  trigger?: React.ReactNode;
}

const categoryOptions: { value: ReportCategory; label: string }[] = [
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "spam", label: "Spam" },
  { value: "sexual_content", label: "Sexual content" },
  { value: "violence", label: "Violence or threats" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

const ReportDialog = ({ targetId, targetType, reporterUserId, trigger }: ReportDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    const parsed = schema.safeParse({ category, details: details || undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      const created = moderationStore.addReport({
        reporterUserId,
        targetId,
        targetType,
        category: parsed.data.category,
        details: parsed.data.details,
      });
      toast({ title: "Report submitted", description: "Thank you for helping keep the community safe." });
      setOpen(false);
      setCategory("");
      setDetails("");
      return created;
    } catch (e) {
      setError("Could not submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="destructive" size="sm">Report</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
          <DialogDescription>Select a reason and optionally add details.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Details (optional)</Label>
            <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add any helpful context" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting || !category}>{submitting ? "Submitting..." : "Submit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
