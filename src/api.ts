// Thin client over the public Freelancer REST API (https://developers.freelancer.com).
// Searching projects is anonymous; anything about *you* (self, bids) needs an OAuth token.

const BASE = "https://www.freelancer.com/api";

export type Project = {
  id: number;
  title: string;
  seo_url: string;
  type: "fixed" | "hourly";
  budget: { minimum?: number; maximum?: number };
  currency: { code: string; sign: string; exchange_rate: number };
  bid_stats: { bid_count: number; bid_avg: number | null };
  time_submitted: number;
  preview_description?: string;
  description?: string;
  jobs?: { id: number; name: string }[];
  upgrades?: Record<string, boolean | null>;
  frontend_project_status?: string;
  language?: string;
  hourly_project_info?: { commitment?: { hours?: number; interval?: string }; duration_enum?: string };
};

type Envelope<T> = { status: "success" | "error"; result: T; message?: string; error_code?: string };

export class ApiError extends Error {}

async function call<T>(path: string, init: RequestInit = {}, authToken?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (authToken) headers.set("freelancer-oauth-v1", authToken);
  if (init.body) headers.set("content-type", "application/json");
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body || body.status !== "success") {
    const why = body?.message ?? `${res.status} ${res.statusText}`;
    throw new ApiError(`Freelancer API ${path.split("?")[0]}: ${why}`);
  }
  return body.result;
}

function qs(params: Record<string, string | number | boolean | (string | number)[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => q.append(`${k}[]`, String(x)));
    else q.set(k, String(v));
  }
  return q.toString();
}

export type SearchParams = {
  query?: string;
  jobIds?: (string | number)[];
  limit?: number;
  offset?: number;
  type?: "fixed" | "hourly";
  fullDescription?: boolean;
};

/** The API caps a page at 100; larger limits are fetched page by page. */
export async function searchActive(p: SearchParams): Promise<{ projects: Project[]; total: number }> {
  const want = p.limit ?? 50;
  const projects: Project[] = [];
  let total = 0;
  for (let offset = p.offset ?? 0; projects.length < want; offset += 100) {
    const page = await searchPage({ ...p, offset, limit: Math.min(100, want - projects.length) });
    total = page.total;
    projects.push(...page.projects);
    if (page.projects.length === 0 || offset + 100 >= total) break;
  }
  return { projects, total };
}

async function searchPage(p: SearchParams): Promise<{ projects: Project[]; total: number }> {
  const result = await call<{ projects: Project[]; total_count: number }>(
    `/projects/0.1/projects/active/?${qs({
      query: p.query,
      "jobs": p.jobIds,
      "project_types": p.type ? [p.type] : undefined,
      limit: p.limit ?? 50,
      offset: p.offset ?? 0,
      job_details: true,
      full_description: p.fullDescription ?? true,
      sort_field: "time_updated",
    })}`,
  );
  return { projects: result.projects, total: result.total_count };
}

export async function getProject(id: number): Promise<Project> {
  const result = await call<{ projects: Project[] }>(
    `/projects/0.1/projects/?${qs({ projects: [id], full_description: true, job_details: true })}`,
  );
  const project = result.projects[0];
  if (!project) throw new ApiError(`Project ${id} not found`);
  return project;
}

export type Self = { id: number; username: string; display_name?: string; hourly_rate?: number };

export async function getSelf(authToken: string): Promise<Self> {
  return call<Self>(`/users/0.1/self/`, {}, authToken);
}

export type BidInput = {
  projectId: number;
  bidderId: number;
  amount: number;
  periodDays: number;
  milestonePercentage: number;
  description: string;
};

export async function placeBid(authToken: string, b: BidInput): Promise<{ id: number }> {
  return call<{ id: number }>(
    `/projects/0.1/bids/`,
    {
      method: "POST",
      body: JSON.stringify({
        project_id: b.projectId,
        bidder_id: b.bidderId,
        amount: b.amount,
        period: b.periodDays,
        milestone_percentage: b.milestonePercentage,
        description: b.description,
      }),
    },
    authToken,
  );
}

export function projectUrl(p: Pick<Project, "id" | "seo_url">): string {
  return p.seo_url
    ? `https://www.freelancer.com/projects/${p.seo_url}`
    : `https://www.freelancer.com/projects/${p.id}`;
}
