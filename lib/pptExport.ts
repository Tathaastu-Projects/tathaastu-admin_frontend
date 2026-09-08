export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  placeOfBirth: string;
  timeOfBirth: string;
}

export interface QueryInfo {
  queryType: string;
  date: string;
  problems: string[];
}

export interface DoshaItem {
  label: string;
  value: string;
  note?: string;
}

export interface PlanetReading {
  name: string;
  strength: string;
  remedy: string;
}

export interface KundliDetails {
  lagan: string;
  rashi: string;
  dasha: string;
  shaniSadeSatti: string;
  personalityNotes: string;
  rinNotes: string;
}

export interface ExportPPTData {
  clientInfo: ClientInfo;
  queryInfo: QueryInfo;
  scannerReading: {
    readingDate: string;
    doshas: DoshaItem[];
    planets: PlanetReading[];
  };
  scannerUpay: string;
  kundli: KundliDetails;
  predictions: string[];
  kundliUpay: string;
}

export async function downloadSolutionPPT(queryId: string) {
  const response = await fetch(`/api/queries/${queryId}/solution/ppt`);
  if (!response.ok) {
    throw new Error("Failed to fetch generated PPT");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${queryId}-solution.pptx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
