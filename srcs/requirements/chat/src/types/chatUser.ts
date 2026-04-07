export interface ChatUser {
  id: string;
  username: string;
  role: string;
  email?: string;
}

export interface AuthenticatedSocketUser extends ChatUser {
  sessionId: string;
}
