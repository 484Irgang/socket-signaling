export type TrackObject = {
  location: "local" | "remote";
  mid?: string | null; // Só necessário para tracks locais
  sessionId?: string; // Só necessário para tracks remotas
  trackName: string;
};

export type CallSession = {
  id: string;
  tracks: TrackObject[];
};
