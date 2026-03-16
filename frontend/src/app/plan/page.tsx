import { prisma } from "@/lib/prisma";
import WeekPlanView from "@/components/plan/WeekPlanView";

export const dynamic = "force-dynamic";

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  now.setHours(0, 0, 0, 0);
  return now;
}

export default async function PlanPage() {
  const weekStart = getWeekStart();

  // Get or create this week's plan
  let plan = await prisma.weekPlan.findUnique({
    where: { weekStart },
    include: { slots: { include: { dish: true } } },
  });

  if (!plan) {
    plan = await prisma.weekPlan.create({
      data: { weekStart },
      include: { slots: { include: { dish: true } } },
    });
  }

  // Load all active dishes for the picker
  const dishes = await prisma.dish.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return (
    <div className="relative">
      <WeekPlanView initialPlan={plan} dishes={dishes} />
    </div>
  );
}
