"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProjectStatus, Role } from "@/generated/prisma/enums";
import { usePolling } from "@/lib/hooks/usePolling";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { ProfileCard } from "./ProfileCard";
import { TaggedItemsList } from "./TaggedItemsList";
import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { WorkStationPanel } from "./WorkStationPanel";
import { MemoPanel } from "./MemoPanel";
import { ProjectContent } from "@/components/staff-projects/ProjectContent";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import type {
  CalendarEventItem,
  MemoFolderItem,
  MemoItem,
  NotificationItem,
  ProjectSummary,
  TaggedItem,
  TaskItem,
} from "./types";

export function StaffHome({
  currentUser,
  initialTasks,
  initialEvents,
  initialMemos,
  initialFolders,
  myProjects,
  taggedItems: initialTaggedItems,
  initialNotifications = [],
  initialActiveView = "home",
  initialDeepLinkTaskId = null,
}: {
  currentUser: { id: string; name: string | null; email: string; role: Role };
  initialTasks: TaskItem[];
  initialEvents: CalendarEventItem[];
  initialMemos: MemoItem[];
  initialFolders: MemoFolderItem[];
  myProjects: ProjectSummary[];
  taggedItems: TaggedItem[];
  initialNotifications?: NotificationItem[];
  initialActiveView?: string;
  initialDeepLinkTaskId?: string | null;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [events, setEvents] = useState(initialEvents);
  const [taggedItems, setTaggedItems] = useState(initialTaggedItems);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeView, setActiveView] = useState<"home" | string>(initialActiveView);
  const [deepLinkTaskId, setDeepLinkTaskId] = useState<string | null>(initialDeepLinkTaskId);
  const [projects, setProjects] = useState(myProjects);

  const handleProjectStatusChange = (projectId: string, newStatus: ProjectStatus) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
  };

  usePolling({
    url: "/api/dashboard/home",
    interval: 8000,
    enabled: activeView === "home",
    onData: (data: { tasks: TaskItem[]; events: CalendarEventItem[]; taggedItems: TaggedItem[] }) => {
      setTasks(data.tasks);
      setEvents(data.events);
      setTaggedItems(data.taggedItems);
    },
  });

  const myTasks = tasks.filter((t) => t.assignee.id === currentUser.id);
  const doneCount = myTasks.filter((t) => t.status === "DONE").length;
  const openCount = myTasks.length - doneCount;
  const upcomingEvents = events.filter((e) => new Date(e.startAt).getTime() >= Date.now()).length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const selectView = (id: "home" | string) => { setActiveView(id); setDeepLinkTaskId(null); window.history.replaceState(null, "", id === "home" ? "/dashboard" : `/dashboard?project=${id}`); };

  return (
    <>
      <DashboardLayout
        nav={<DashboardNav currentUser={currentUser} unreadCount={unreadCount} onNotificationsClick={() => setShowNotifications(true)} />}
        sidebar={<ProjectSidebar projects={projects} activeView={activeView} onSelectView={selectView} />}
        main={
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-7">
            {activeView === "home" ? (
              <>
                <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono">
                  <div className="flex items-center gap-2.5 text-xs font-bold tracking-widest text-brand-light">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-brand-light shadow-[0_0_8px_rgba(143,168,196,0.6)]" />
                    LOIND FLOW STATION
                  </div>
                  <div className="text-xs tracking-widest text-white/40" suppressHydrationWarning>
                    {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                  </div>
                </div>
                <div className="grid min-h-[460px] grid-cols-1 gap-y-8 divide-y divide-white/10 md:grid-cols-[1fr_2fr] md:gap-y-0 md:divide-x md:divide-y-0">
                  <CalendarPanel initialEvents={events} tasks={tasks} myProjects={projects} readOnly />
                  <WorkStationPanel tasks={tasks} onTasksChange={setTasks} currentUserId={currentUser.id} myProjects={projects} onTaskClick={(projectId) => selectView(projectId)} />
                </div>
              </>
            ) : (
              <ProjectContent key={activeView} projectId={activeView} currentUser={currentUser} initialTaskId={deepLinkTaskId} onProjectStatusChange={handleProjectStatusChange} />
            )}
          </div>
        }
        rightPanel={
          <>
            <ProfileCard currentUser={currentUser} openCount={openCount} doneCount={doneCount} upcomingEvents={upcomingEvents} />
            <TaggedItemsList items={taggedItems} />
            <div className="flex-1 overflow-hidden border-t border-white/10 pt-4">
              <MemoPanel initialMemos={initialMemos} initialFolders={initialFolders} />
            </div>
            <div className="mt-auto flex flex-col gap-2.5">
              <Link href="/dashboard/settings" className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/70 transition-all hover:bg-white/10 hover:text-white">
                <span>⚙️</span> 계정 설정
              </Link>
            </div>
          </>
        }
      />
      {showNotifications && (
        <NotificationPanel notifications={notifications} onNotificationsChange={setNotifications} onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}
