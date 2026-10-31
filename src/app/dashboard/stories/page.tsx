import { requireStaff } from "@/lib/auth-guards";
import { listStories, storiesConfigured, type StoryRecord } from "@/lib/loind-stories";
import { StoriesView } from "@/components/stories/StoriesView";

export default async function StoriesPage() {
  const user = await requireStaff();
  const configured = storiesConfigured();

  let initialStories: StoryRecord[] = [];
  let initialError = "";
  if (configured) {
    try {
      initialStories = await listStories();
    } catch (e) {
      initialError = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <StoriesView
      currentUser={{
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? "",
        role: user.role,
      }}
      configured={configured}
      initialStories={initialStories}
      initialError={initialError}
    />
  );
}
