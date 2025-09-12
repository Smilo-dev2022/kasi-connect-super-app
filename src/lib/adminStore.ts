import { addDays, formatISO, startOfDay, subDays } from "date-fns";

export type Ward = {
  id: string;
  name: string;
};

export type VerificationStatus = "pending" | "approved" | "rejected";

export type VerificationRequest = {
  id: string;
  citizenName: string;
  wardId: string;
  documentType: string;
  submittedAt: string;
  status: VerificationStatus;
  reviewerNotes?: string;
  reviewedAt?: string;
};

export type AdminDataStore = {
  wards: Ward[];
  requests: VerificationRequest[];
};

const STORAGE_KEY = "admin:wardVerification";

function generateId(prefix: string = "req"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function seedData(): AdminDataStore {
  const wards: Ward[] = [
    { id: "w1", name: "Ward 1" },
    { id: "w2", name: "Ward 2" },
    { id: "w3", name: "Ward 3" },
    { id: "w4", name: "Ward 4" },
  ];

  const today = startOfDay(new Date());

  const requests: VerificationRequest[] = [
    {
      id: generateId(),
      citizenName: "Aisha Bello",
      wardId: "w1",
      documentType: "National ID",
      submittedAt: formatISO(addDays(today, -1)),
      status: "pending",
    },
    {
      id: generateId(),
      citizenName: "Kunle Ade",
      wardId: "w2",
      documentType: "Voter's Card",
      submittedAt: formatISO(addDays(today, -2)),
      status: "approved",
      reviewedAt: formatISO(addDays(today, -1)),
      reviewerNotes: "All details verified.",
    },
    {
      id: generateId(),
      citizenName: "Ngozi Okafor",
      wardId: "w3",
      documentType: "Driver's License",
      submittedAt: formatISO(addDays(today, -3)),
      status: "rejected",
      reviewedAt: formatISO(addDays(today, -2)),
      reviewerNotes: "Document photo unclear.",
    },
    {
      id: generateId(),
      citizenName: "John Yusuf",
      wardId: "w1",
      documentType: "Passport",
      submittedAt: formatISO(addDays(today, -4)),
      status: "pending",
    },
  ];

  return { wards, requests };
}

function loadStore(): AdminDataStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed: AdminDataStore = JSON.parse(raw);
    if (!parsed.wards || !parsed.requests) {
      throw new Error("Invalid store shape");
    }
    return parsed;
  } catch {
    const seeded = seedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveStore(store: AdminDataStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getWards(): Ward[] {
  return loadStore().wards;
}

export function getWardById(wardId: string): Ward | undefined {
  return loadStore().wards.find((w) => w.id === wardId);
}

export function getRequests(): VerificationRequest[] {
  const { requests } = loadStore();
  return requests.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function getRequestById(id: string): VerificationRequest | undefined {
  return loadStore().requests.find((r) => r.id === id);
}

export function upsertRequest(update: Partial<VerificationRequest> & { id?: string }): VerificationRequest {
  const store = loadStore();
  const existingIndex = update.id ? store.requests.findIndex((r) => r.id === update.id) : -1;
  let result: VerificationRequest;
  if (existingIndex >= 0) {
    const current = store.requests[existingIndex];
    result = { ...current, ...update } as VerificationRequest;
    store.requests[existingIndex] = result;
  } else {
    result = {
      id: generateId(),
      citizenName: update.citizenName || "",
      wardId: update.wardId || store.wards[0].id,
      documentType: update.documentType || "National ID",
      submittedAt: update.submittedAt || new Date().toISOString(),
      status: update.status || "pending",
      reviewerNotes: update.reviewerNotes,
      reviewedAt: update.reviewedAt,
    };
    store.requests.push(result);
  }
  saveStore(store);
  return result;
}

export function setRequestStatus(
  requestId: string,
  status: Exclude<VerificationStatus, "pending">,
  reviewerNotes?: string,
): VerificationRequest | undefined {
  const store = loadStore();
  const index = store.requests.findIndex((r) => r.id === requestId);
  if (index === -1) return undefined;
  const updated: VerificationRequest = {
    ...store.requests[index],
    status,
    reviewerNotes,
    reviewedAt: new Date().toISOString(),
  };
  store.requests[index] = updated;
  saveStore(store);
  return updated;
}

export type RequestFilters = {
  query?: string;
  status?: VerificationStatus | "all";
  wardId?: string | "all";
};

export function filterRequests(filters: RequestFilters): VerificationRequest[] {
  const normalizedQuery = (filters.query || "").trim().toLowerCase();
  const statusFilter = filters.status || "all";
  const wardFilter = filters.wardId || "all";
  return getRequests().filter((r) => {
    const matchesQuery = !normalizedQuery
      ? true
      : [r.citizenName, r.documentType].some((f) => f.toLowerCase().includes(normalizedQuery));
    const matchesStatus = statusFilter === "all" ? true : r.status === statusFilter;
    const matchesWard = wardFilter === "all" ? true : r.wardId === wardFilter;
    return matchesQuery && matchesStatus && matchesWard;
  });
}

export function getStatusCounts(): { pending: number; approved: number; rejected: number; total: number } {
  const requests = getRequests();
  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    total: requests.length,
  };
  return counts;
}

export function getDailySubmissionSeries(days: number = 7): { date: string; submissions: number }[] {
  const series: { date: string; submissions: number }[] = [];
  const start = subDays(startOfDay(new Date()), days - 1);
  const requests = getRequests();
  for (let i = 0; i < days; i++) {
    const day = addDays(start, i);
    const dateIso = formatISO(day, { representation: "date" });
    const count = requests.filter((r) => r.submittedAt.startsWith(dateIso)).length;
    series.push({ date: dateIso, submissions: count });
  }
  return series;
}

export function getStatusDistribution(): { name: string; value: number; key: VerificationStatus }[] {
  const { pending, approved, rejected } = getStatusCounts();
  return [
    { name: "Pending", value: pending, key: "pending" },
    { name: "Approved", value: approved, key: "approved" },
    { name: "Rejected", value: rejected, key: "rejected" },
  ];
}

