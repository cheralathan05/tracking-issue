import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/smartgov-api";

export interface FeedbackFormProps {
  complaintId: string;
  complaintTitle: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function FeedbackForm({
  complaintId,
  complaintTitle,
  onSubmitSuccess,
  onCancel,
}: FeedbackFormProps) {
  const [rating, setRating] = useState(5);
  const [officerRating, setOfficerRating] = useState(5);
  const [comment, setComment] = useState("");
  const [improvements, setImprovements] = useState("");
  const [satisfied, setSatisfied] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await submitFeedback(complaintId, {
        rating,
        comment: comment || undefined,
        officerRating,
        overallSatisfaction: satisfied,
        suggestedImprovements: improvements || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSubmitSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-semibold text-green-900">Thank You!</h3>
          <p className="text-green-800 text-sm mt-2">Your feedback has been recorded and will help us improve our services.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Your Experience</CardTitle>
        <CardDescription>
          Your feedback helps us improve. Rate your experience for "{complaintTitle}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
              {error}
            </div>
          )}

          {/* Overall Satisfaction */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">How satisfied are you with the resolution?</label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="satisfied-yes"
                  name="satisfied"
                  checked={satisfied}
                  onChange={() => setSatisfied(true)}
                  className="h-4 w-4"
                />
                <label htmlFor="satisfied-yes" className="text-sm cursor-pointer">
                  Yes, I'm satisfied with the resolution
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="satisfied-no"
                  name="satisfied"
                  checked={!satisfied}
                  onChange={() => setSatisfied(false)}
                  className="h-4 w-4"
                />
                <label htmlFor="satisfied-no" className="text-sm cursor-pointer">
                  No, I need further assistance
                </label>
              </div>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Rate overall service quality (1-5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{rating} out of 5 stars</p>
          </div>

          {/* Officer Rating */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">How would you rate the assigned officer?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOfficerRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= officerRating ? "fill-blue-400 text-blue-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{officerRating} out of 5 stars</p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-semibold">
              Any comments about this complaint? (Optional)
            </label>
            <Textarea
              id="comment"
              placeholder="Share your thoughts, what went well, what could be improved..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{comment.length}/500 characters</p>
          </div>

          {/* Improvements */}
          <div className="space-y-2">
            <label htmlFor="improvements" className="text-sm font-semibold">
              Suggestions for improvement (Optional)
            </label>
            <Textarea
              id="improvements"
              placeholder="How can we better serve you next time? Share your suggestions..."
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{improvements.length}/500 characters</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Skip for now
              </Button>
            )}
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your feedback is valuable and will be reviewed by our team.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
