export type TrackObject = {
  location: "local" | "remote";
  mid?: string | null; // Só necessário para tracks locais
  sessionId?: string; // Só necessário para tracks remotas
  trackName: string;
};

export type CallUser = {
  id: string;
  name: string;
  joined: boolean;
  speaking: boolean;
  media?: {
    audioEnabled: boolean;
    cameraEnabled: boolean;
    screenEnabled: boolean;
    sessionTracks?: TrackObject[];
  };
  socketId: string;
  sessionId?: string;
};
